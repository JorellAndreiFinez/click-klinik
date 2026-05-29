import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './schemas/appointment.schema';

type XenditInvoiceWebhookBody = {
  id?: unknown;
  external_id?: unknown;
  status?: unknown;
  data?: {
    id?: unknown;
    reference_id?: unknown;
    status?: unknown;
  };
};

@Controller('appointments/webhooks')
export class XenditWebhookController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('xendit')
  async handleXenditWebhook(
    @Headers('x-callback-token') callbackToken: string | undefined,
    @Body() body: XenditInvoiceWebhookBody,
  ): Promise<{ appointment?: Appointment | null; ok: true }> {
    const expectedToken = this.configService.get<string>('XENDIT_WEBHOOK_TOKEN');

    if (expectedToken && callbackToken !== expectedToken) {
      throw new UnauthorizedException('Invalid Xendit webhook token.');
    }

    const appointment = await this.appointmentsService.syncXenditPayment({
      invoiceId: getString(body.id) ?? getString(body.data?.id),
      externalId: getString(body.external_id) ?? getString(body.data?.reference_id),
      status: getString(body.status) ?? getString(body.data?.status),
    });

    return { appointment, ok: true };
  }
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}
