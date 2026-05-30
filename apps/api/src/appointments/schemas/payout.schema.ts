import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PayoutDocument = HydratedDocument<Payout>;

export type PayoutStatus =
  | 'pending_payment'
  | 'available'
  | 'refund_requested'
  | 'refunded'
  | 'cancelled'
  | 'paid_out';

@Schema({ timestamps: true, collection: 'payouts' })
export class Payout {
  @Prop({ required: true, index: true })
  appointmentId!: string;

  @Prop({ required: true, index: true })
  patientId!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  patientEmail!: string;

  @Prop({ required: true, trim: true })
  patientName!: string;

  @Prop({ required: true, index: true })
  doctorApplicationId!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  doctorEmail!: string;

  @Prop({ required: true, trim: true })
  doctorName!: string;

  @Prop({ required: true, min: 0 })
  grossAmountPhp!: number;

  @Prop({ required: true, min: 0, max: 1 })
  platformCommissionRate!: number;

  @Prop({ required: true, min: 0 })
  platformCommissionPhp!: number;

  @Prop({ required: true, min: 0 })
  doctorPayoutPhp!: number;

  @Prop({ required: true, trim: true, default: 'PHP' })
  currency!: string;

  @Prop({
    required: true,
    enum: [
      'pending_payment',
      'available',
      'refund_requested',
      'refunded',
      'cancelled',
      'paid_out',
    ],
    default: 'pending_payment',
    index: true,
  })
  status!: PayoutStatus;

  @Prop({ required: true, enum: ['xendit'] })
  paymentProvider!: 'xendit';

  @Prop({ trim: true })
  paymentReferenceId?: string;

  @Prop({ trim: true })
  paymentProviderPaymentId?: string;

  @Prop()
  paidAt?: Date;

  @Prop({ trim: true })
  payoutProviderPayoutId?: string;

  @Prop({ trim: true })
  payoutProviderStatus?: string;

  @Prop()
  refundRequestedAt?: Date;

  @Prop({ trim: true })
  refundReason?: string;
}

export const PayoutSchema = SchemaFactory.createForClass(Payout);

PayoutSchema.index({ appointmentId: 1 }, { unique: true, name: 'one_payout_per_appointment' });
PayoutSchema.index(
  { doctorApplicationId: 1, status: 1 },
  { name: 'doctor_payout_status_lookup' },
);
