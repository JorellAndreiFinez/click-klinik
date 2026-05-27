import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export type PaymentProvider = 'pay_later' | 'paymongo' | 'xendit';
export type PaymentStatus = 'mock_pending' | 'pending' | 'unpaid';

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
        success_redirect_url: this.buildAppRedirectUrl('/patient/appointments'),
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
