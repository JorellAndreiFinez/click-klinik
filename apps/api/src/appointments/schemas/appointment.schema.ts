import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

export const APPOINTMENT_STATUSES = [
  'booked',
  'confirmed',
  'active_consultation',
  'completed',
  'cancelled',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export type AppointmentPaymentStatus = 'mock_pending' | 'paid' | 'pending' | 'unpaid';

@Schema({ _id: false })
export class AppointmentAddOn {
  @Prop({ required: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ required: true, min: 0 })
  feePhp!: number;
}

export const AppointmentAddOnSchema =
  SchemaFactory.createForClass(AppointmentAddOn);

@Schema({ timestamps: true, collection: 'appointments' })
export class Appointment {
  @Prop({ required: true, index: true })
  patientId!: string;

  @Prop({ required: true, lowercase: true, trim: true, index: true })
  patientEmail!: string;

  @Prop({ required: true, trim: true })
  patientName!: string;

  @Prop({ required: true, index: true })
  doctorApplicationId!: string;

  @Prop({ required: true, lowercase: true, trim: true, index: true })
  doctorEmail!: string;

  @Prop({ required: true, trim: true })
  doctorName!: string;

  @Prop({ required: true, trim: true })
  specializationName!: string;

  @Prop({ trim: true })
  doctorLocation?: string;

  @Prop({ required: true, trim: true })
  consultationCode!: string;

  @Prop({ required: true, trim: true })
  consultationLabel!: string;

  @Prop({ type: [AppointmentAddOnSchema], default: [] })
  addOns!: AppointmentAddOn[];

  @Prop({ required: true, min: 0 })
  baseFeePhp!: number;

  @Prop({ required: true, min: 0, default: 0 })
  addOnsTotalPhp!: number;

  @Prop({ required: true, min: 0 })
  totalFeePhp!: number;

  @Prop({ required: true, trim: true, default: 'PHP' })
  currency!: string;

  @Prop({ required: true })
  scheduledStartAt!: Date;

  @Prop({ required: true })
  scheduledEndAt!: Date;

  @Prop({ required: true, index: true })
  scheduleSlotId!: string;

  @Prop({ required: true, enum: APPOINTMENT_STATUSES, default: 'booked' })
  status!: AppointmentStatus;

  @Prop({ trim: true })
  googleCalendarEventId?: string;

  @Prop({ trim: true })
  googleMeetLink?: string;

  @Prop({ trim: true })
  googleCalendarHtmlLink?: string;

  @Prop({ required: true, enum: ['pay_later', 'paymongo', 'xendit'] })
  paymentProvider!: 'pay_later' | 'paymongo' | 'xendit';

  @Prop({ required: true, enum: ['mock_pending', 'paid', 'pending', 'unpaid'] })
  paymentStatus!: AppointmentPaymentStatus;

  @Prop({ trim: true })
  paymentReferenceId?: string;

  @Prop({ trim: true })
  paymentProviderPaymentId?: string;

  @Prop({ trim: true })
  paymentCheckoutUrl?: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index(
  { doctorApplicationId: 1, scheduledStartAt: 1, scheduledEndAt: 1 },
  { name: 'doctor_schedule_lookup' },
);
AppointmentSchema.index(
  { patientId: 1, scheduledStartAt: -1 },
  { name: 'patient_timeline_lookup' },
);
