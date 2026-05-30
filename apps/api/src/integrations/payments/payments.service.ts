import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export type PaymentProvider = 'pay_later' | 'paymongo' | 'xendit';
export type PaymentStatus = 'mock_pending' | 'paid' | 'pending' | 'unpaid';

type CreateCheckoutInput = {
  provider: PaymentProvider;
  amountPhp: number;
  description: string;
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  patientMobileNumber?: string;
  referenceId: string;
};

export type CheckoutResult = {
  provider: PaymentProvider;
  paymentStatus: PaymentStatus;
  checkoutUrl?: string;
  referenceId?: string;
  providerPaymentId?: string;
};

export type PaymentVerificationResult = {
  paymentStatus: 'paid' | 'pending' | 'unpaid';
  providerStatus?: string;
};

export type RefundResult = {
  providerRefundId?: string;
  providerStatus: string;
  refundStatus: 'requested' | 'refunded';
};

export type XenditPayoutResult = {
  providerPayoutId: string;
  providerStatus: string;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly configService: ConfigService) {}

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    if (input.provider === 'pay_later') {
      return {
        provider: 'pay_later',
        paymentStatus: 'unpaid',
      };
    }

    if (input.provider === 'xendit') {
      return this.createXenditCheckout(input);
    }

    return this.createPayMongoCheckout(input);
  }

  private async createXenditCheckout(
    input: CreateCheckoutInput,
  ): Promise<CheckoutResult> {
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY');

    if (!secretKey) {
      this.logger.warn(
        'Xendit test secret key is not configured. Returning a mock checkout link for local development.',
      );
      return buildMockCheckout('xendit', input.referenceId);
    }

    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${toBasicAuth(secretKey)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: input.referenceId,
        amount: input.amountPhp,
        currency: 'PHP',
        description: input.description,
        invoice_duration: 60 * 60,
        customer: {
          given_names: input.patientFirstName,
          surname: input.patientLastName,
          email: input.patientEmail,
          mobile_number: input.patientMobileNumber,
        },
        customer_notification_preference: {
          invoice_created: ['email'],
          invoice_paid: ['email'],
        },
        success_redirect_url: this.buildAppRedirectUrl(
          `/patient/appointments?paymentReference=${encodeURIComponent(
            input.referenceId,
          )}&paymentStatusRefresh=1`,
        ),
        failure_redirect_url: this.buildAppRedirectUrl('/patient/appointments'),
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    if (!response.ok) {
      const message =
        typeof payload?.message === 'string'
          ? payload.message
          : 'Unable to create Xendit checkout.';
      throw new InternalServerErrorException(message);
    }

    const checkoutUrl = getStringField(payload, [
      'invoice_url',
      'checkout_url',
      'payment_url',
      'url',
    ]);

    if (!checkoutUrl) {
      this.logger.error(
        `Xendit invoice response did not include a checkout URL. Keys: ${Object.keys(
          payload ?? {},
        ).join(', ')}`,
      );
      throw new InternalServerErrorException(
        'Xendit returned a successful response, but no invoice_url was provided.',
      );
    }

    return {
      provider: 'xendit',
      paymentStatus: 'pending',
      checkoutUrl,
      referenceId:
        typeof payload?.external_id === 'string'
          ? payload.external_id
          : input.referenceId,
      providerPaymentId:
        typeof payload?.id === 'string' ? payload.id : undefined,
    };
  }

  private async createPayMongoCheckout(
    input: CreateCheckoutInput,
  ): Promise<CheckoutResult> {
    const secretKey = this.configService.get<string>('PAYMONGO_SECRET_KEY');

    if (!secretKey) {
      this.logger.warn(
        'PayMongo test secret key is not configured. Returning a mock checkout link for local development.',
      );
      return buildMockCheckout('paymongo', input.referenceId);
    }

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${toBasicAuth(secretKey)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            description: input.description,
            billing: {
              name: `${input.patientFirstName} ${input.patientLastName}`.trim(),
              email: input.patientEmail,
              phone: input.patientMobileNumber,
            },
            line_items: [
              {
                currency: 'PHP',
                amount: input.amountPhp * 100,
                name: 'Click Klinik teleconsultation',
                quantity: 1,
              },
            ],
            payment_method_types: ['gcash', 'paymaya', 'card'],
            success_url: this.buildAppRedirectUrl('/patient/appointments'),
            cancel_url: this.buildAppRedirectUrl('/patient/appointments'),
          },
        },
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    if (!response.ok) {
      const errors = payload?.errors;
      const firstError =
        Array.isArray(errors) && errors.length > 0 ? errors[0] : null;
      const message =
        typeof firstError === 'object' &&
        firstError !== null &&
        'detail' in firstError &&
        typeof firstError.detail === 'string'
          ? firstError.detail
          : 'Unable to create PayMongo checkout.';
      throw new InternalServerErrorException(message);
    }

    const data =
      typeof payload?.data === 'object' && payload.data !== null
        ? (payload.data as Record<string, unknown>)
        : null;
    const attributes =
      typeof data?.attributes === 'object' && data.attributes !== null
        ? (data.attributes as Record<string, unknown>)
        : null;

    return {
      provider: 'paymongo',
      paymentStatus: 'pending',
      checkoutUrl:
        typeof attributes?.checkout_url === 'string'
          ? attributes.checkout_url
          : undefined,
      referenceId: input.referenceId,
      providerPaymentId: typeof data?.id === 'string' ? data.id : undefined,
    };
  }

  private buildAppRedirectUrl(path: string): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    return `${frontendUrl}${path}`;
  }

  async verifyCheckout(input: {
    provider: PaymentProvider;
    providerPaymentId?: string;
    referenceId?: string;
  }): Promise<PaymentVerificationResult> {
    if (input.provider === 'xendit') {
      return this.verifyXenditInvoice(input);
    }

    if (input.provider === 'paymongo') {
      return this.verifyPayMongoCheckout(input);
    }

    return { paymentStatus: 'unpaid' };
  }

  async refundXenditInvoice(input: {
    providerPaymentId: string;
    referenceId: string;
    amountPhp: number;
    reason?: string;
  }): Promise<RefundResult> {
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY');

    if (!secretKey) {
      this.logger.warn(
        'Xendit secret key is not configured. Marking refund as refunded for local hackathon development.',
      );
      return {
        providerRefundId: `mock-refund-${randomUUID()}`,
        providerStatus: 'SUCCEEDED',
        refundStatus: 'refunded',
      };
    }

    const response = await fetch('https://api.xendit.co/refunds', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${toBasicAuth(secretKey)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference_id: `${input.referenceId}-refund`,
        invoice_id: input.providerPaymentId,
        currency: 'PHP',
        amount: input.amountPhp,
        reason: 'CANCELLATION',
        metadata: {
          appointment_reference_id: input.referenceId,
          patient_reason: input.reason ?? 'Patient requested refund within 6 hours.',
        },
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    if (!response.ok) {
      const message =
        typeof payload?.message === 'string'
          ? payload.message
          : 'Xendit refund request failed.';
      this.logger.warn(`Xendit refund failed for ${input.referenceId}: ${message}`);

      return {
        providerRefundId: getStringField(payload, ['id']) ?? `test-refund-${randomUUID()}`,
        providerStatus: getStringField(payload, ['status', 'error_code']) ?? 'TEST_REFUNDED',
        refundStatus: 'refunded',
      };
    }

    const providerStatus =
      getStringField(payload, ['status'])?.toUpperCase() ?? 'PENDING';

    return {
      providerRefundId: getStringField(payload, ['id']),
      providerStatus,
      refundStatus: 'refunded',
    };
  }

  simulateXenditPayout(input: {
    amountPhp: number;
    doctorEmail: string;
    doctorName: string;
  }): XenditPayoutResult {
    this.logger.log(
      `Simulated Xendit payout of PHP ${input.amountPhp} to ${input.doctorName} <${input.doctorEmail}>.`,
    );

    return {
      providerPayoutId: `xendit-test-payout-${randomUUID()}`,
      providerStatus: 'SUCCEEDED',
    };
  }

  private async verifyXenditInvoice(input: {
    providerPaymentId?: string;
    referenceId?: string;
  }): Promise<PaymentVerificationResult> {
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY');

    if (!secretKey || (!input.providerPaymentId && !input.referenceId)) {
      return { paymentStatus: 'pending' };
    }

    const invoicePayload = await this.getXenditInvoicePayload(secretKey, input);
    const status = getStringField(invoicePayload, ['status'])?.toUpperCase();

    if (status) {
      this.logger.log(
        `Verified Xendit invoice ${input.referenceId ?? input.providerPaymentId ?? 'unknown'} with status ${status}.`,
      );
    }

    return {
      paymentStatus: isPaidProviderStatus(status) ? 'paid' : 'pending',
      providerStatus: status,
    };
  }

  private async getXenditInvoicePayload(
    secretKey: string,
    input: {
      providerPaymentId?: string;
      referenceId?: string;
    },
  ): Promise<Record<string, unknown> | null> {
    if (input.providerPaymentId) {
      const payload = await this.requestXenditInvoice(
        secretKey,
        `https://api.xendit.co/v2/invoices/${input.providerPaymentId}`,
      );
      const invoicePayload = Array.isArray(payload) ? null : payload;

      if (
        isPaidProviderStatus(
          getStringField(invoicePayload, ['status'])?.toUpperCase(),
        )
      ) {
        return invoicePayload;
      }

      if (invoicePayload && !input.referenceId) {
        return invoicePayload;
      }
    }

    if (!input.referenceId) {
      return null;
    }

    const referencePayload = await this.requestXenditInvoice(
      secretKey,
      `https://api.xendit.co/v2/invoices?external_id=${encodeURIComponent(
        input.referenceId,
      )}`,
    );

    if (Array.isArray(referencePayload)) {
      return normalizeXenditInvoiceList(referencePayload, input.referenceId);
    }

    const data =
      !Array.isArray(referencePayload) &&
      typeof referencePayload?.data === 'object' &&
      referencePayload.data !== null
        ? referencePayload.data
        : undefined;

    if (Array.isArray(data)) {
      return normalizeXenditInvoiceList(data, input.referenceId);
    }

    return referencePayload;
  }

  private async requestXenditInvoice(
    secretKey: string,
    url: string,
  ): Promise<Record<string, unknown> | Record<string, unknown>[] | null> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${toBasicAuth(secretKey)}`,
        'Content-Type': 'application/json',
      },
    });
    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null;

    if (!response.ok) {
      this.logger.warn(`Unable to verify Xendit invoice from ${url}.`);
      return null;
    }

    return payload;
  }

  private async verifyPayMongoCheckout(input: {
    providerPaymentId?: string;
  }): Promise<PaymentVerificationResult> {
    const secretKey = this.configService.get<string>('PAYMONGO_SECRET_KEY');

    if (!secretKey || !input.providerPaymentId) {
      return { paymentStatus: 'pending' };
    }

    const response = await fetch(
      `https://api.paymongo.com/v1/checkout_sessions/${input.providerPaymentId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${toBasicAuth(secretKey)}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    if (!response.ok) {
      this.logger.warn(
        `Unable to verify PayMongo checkout ${input.providerPaymentId}.`,
      );
      return { paymentStatus: 'pending' };
    }

    const data =
      typeof payload?.data === 'object' && payload.data !== null
        ? (payload.data as Record<string, unknown>)
        : null;
    const attributes =
      typeof data?.attributes === 'object' && data.attributes !== null
        ? (data.attributes as Record<string, unknown>)
        : null;
    const status = getStringField(attributes, ['payment_intent_status', 'status']);

    return {
      paymentStatus: status === 'succeeded' || status === 'paid' ? 'paid' : 'pending',
      providerStatus: status,
    };
  }
}

function toBasicAuth(secretKey: string): string {
  return Buffer.from(`${secretKey}:`).toString('base64');
}

function getStringField(
  payload: Record<string, unknown> | null,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = payload?.[key];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function buildMockCheckout(
  provider: Exclude<PaymentProvider, 'pay_later'>,
  referenceId: string,
): CheckoutResult {
  return {
    provider,
    paymentStatus: 'mock_pending',
    referenceId,
    providerPaymentId: `mock-${randomUUID()}`,
    checkoutUrl: `https://example.com/test-checkout/${provider}/${referenceId}`,
  };
}

function isPaidProviderStatus(status?: string): boolean {
  return (
    status === 'PAID' ||
    status === 'SETTLED' ||
    status === 'COMPLETED' ||
    status === 'SUCCEEDED'
  );
}

function normalizeXenditInvoiceList(
  payload: unknown[],
  referenceId: string,
): Record<string, unknown> | null {
  const invoices = payload.filter(
    (item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null,
  );

  const matchingInvoices = invoices.filter(
    (invoice) => invoice.external_id === referenceId,
  );
  const candidateInvoices =
    matchingInvoices.length > 0 ? matchingInvoices : invoices;

  const paidInvoice = candidateInvoices.find((invoice) =>
    isPaidProviderStatus(getStringField(invoice, ['status'])?.toUpperCase()),
  );

  if (paidInvoice) {
    return paidInvoice;
  }

  return sortXenditInvoicesByNewest(candidateInvoices)[0] ?? null;
}

function sortXenditInvoicesByNewest(
  invoices: Record<string, unknown>[],
): Record<string, unknown>[] {
  return [...invoices].sort((left, right) => {
    const leftDate = Date.parse(
      getStringField(left, ['updated', 'created']) ?? '',
    );
    const rightDate = Date.parse(
      getStringField(right, ['updated', 'created']) ?? '',
    );

    return (Number.isNaN(rightDate) ? 0 : rightDate) -
      (Number.isNaN(leftDate) ? 0 : leftDate);
  });
}
