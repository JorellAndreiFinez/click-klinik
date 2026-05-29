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
export type AppointmentPaymentStatus =
  | 'mock_pending'
  | 'paid'
  | 'pending'
  | 'refunded'
  | 'unpaid';
export type AppointmentPaymentPlan = 'pay_now' | 'pay_after_consultation';
export type DoctorPayoutStatus = 'pending_payment' | 'available' | 'paid_out';

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

@Schema({ _id: false })
export class AppointmentTriage {
  @Prop({ required: true, enum: ['google_meet', 'physical_visit', 'cellular'] })
  consultMethod!: 'google_meet' | 'physical_visit' | 'cellular';

  @Prop({ required: true, trim: true })
  chiefComplaint!: string;

  @Prop({ required: true, trim: true })
  detailedSymptoms!: string;

  @Prop({ required: true })
  onsetDate!: Date;

  @Prop({ type: [String], default: [] })
  medications!: string[];

  @Prop({ type: [String], default: [] })
  allergies!: string[];

  @Prop({ type: [String], default: [] })
  healthProblems!: string[];

  @Prop({ required: true, enum: ['yes', 'no', 'prefer_not_to_say'] })
  smokes!: 'yes' | 'no' | 'prefer_not_to_say';

  @Prop({ required: true, enum: ['yes', 'no', 'prefer_not_to_say'] })
  drinksAlcohol!: 'yes' | 'no' | 'prefer_not_to_say';

  @Prop({ required: true, default: false })
  insurancePartnersConsent!: boolean;

  @Prop({ required: true, default: false })
  laboratoryPartnersConsent!: boolean;

  @Prop({ required: true, default: false })
  pharmacyPartnersConsent!: boolean;

  @Prop({ required: true, default: false })
  emergencyDisclosureConsent!: boolean;
}

export const AppointmentTriageSchema =
  SchemaFactory.createForClass(AppointmentTriage);

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

  @Prop({ type: AppointmentTriageSchema, required: true })
  triage!: AppointmentTriage;

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

  @Prop({ required: true, enum: ['xendit'] })
  paymentProvider!: 'xendit';

  @Prop({
    required: true,
    enum: ['pay_now', 'pay_after_consultation'],
    default: 'pay_now',
  })
  paymentPlan!: AppointmentPaymentPlan;

  @Prop({
    required: true,
    enum: ['mock_pending', 'paid', 'pending', 'refunded', 'unpaid'],
  })
  paymentStatus!: AppointmentPaymentStatus;

  @Prop({ trim: true })
  paymentReferenceId?: string;

  @Prop({ trim: true })
  paymentProviderPaymentId?: string;

  @Prop({ trim: true })
  paymentCheckoutUrl?: string;

  @Prop()
  paymentDueAt?: Date;

  @Prop({ index: true, trim: true })
  payoutId?: string;

  @Prop({ min: 0, max: 1, default: 0.15 })
  platformCommissionRate?: number;

  @Prop({ min: 0, default: 0 })
  platformCommissionPhp?: number;

  @Prop({ min: 0, default: 0 })
  doctorPayoutPhp?: number;

  @Prop({
    enum: ['pending_payment', 'available', 'paid_out'],
    default: 'pending_payment',
  })
  doctorPayoutStatus?: DoctorPayoutStatus;

  @Prop({
    enum: ['none', 'requested', 'approved', 'rejected', 'refunded'],
    default: 'none',
  })
  refundStatus?: 'none' | 'requested' | 'approved' | 'rejected' | 'refunded';

  @Prop()
  refundRequestedAt?: Date;

  @Prop({ trim: true })
  refundReason?: string;

  @Prop({ trim: true })
  refundProviderRefundId?: string;

  @Prop({ trim: true })
  refundProviderStatus?: string;
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
