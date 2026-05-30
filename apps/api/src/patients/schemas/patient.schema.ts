import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PatientDocument = HydratedDocument<Patient>;

@Schema({ timestamps: true, collection: 'patients' })
export class Patient {
  @Prop({ required: true, unique: true, index: true, select: false })
  firebaseUid!: string;

  @Prop({ required: true, enum: ['patient'], default: 'patient' })
  role!: 'patient';

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ trim: true })
  suffix?: string;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true,
  })
  email!: string;

  @Prop({ required: true, unique: true, index: true })
  mobileNumber!: string;

  @Prop({ required: true })
  birthdate!: Date;

  @Prop({ required: true, enum: ['female', 'male', 'prefer_not_to_say'] })
  sex!: string;

  @Prop({ required: true })
  weightKg!: number;

  @Prop({ required: true })
  heightCm!: number;

  @Prop({ trim: true })
  emergencyContactName?: string;

  @Prop({ trim: true })
  emergencyContactNumber?: string;

  @Prop({ type: [String], default: [] })
  allergies!: string[];

  @Prop({ type: [String], default: [] })
  existingConditions!: string[];

  @Prop({ type: [String], default: [] })
  currentMedications!: string[];

  @Prop({ trim: true })
  basicMedicalHistory?: string;

  @Prop({ required: true, trim: true })
  regionCode!: string;

  @Prop({ required: true, trim: true })
  regionName!: string;

  @Prop({ trim: true })
  provinceCode?: string;

  @Prop({ trim: true })
  provinceName?: string;

  @Prop({ required: true, trim: true })
  cityMunicipalityCode!: string;

  @Prop({ required: true, trim: true, index: true })
  cityMunicipalityName!: string;

  @Prop({ required: true, trim: true })
  barangayCode!: string;

  @Prop({ required: true, trim: true })
  barangayName!: string;

  @Prop({ min: -90, max: 90 })
  latitude?: number;

  @Prop({ min: -180, max: 180 })
  longitude?: number;

  @Prop()
  geoLocationUpdatedAt?: Date;

  @Prop({ required: true, default: false })
  privacyPolicyAccepted!: boolean;

  @Prop({ required: true, default: false })
  healthDataProcessingAccepted!: boolean;

  @Prop({ required: true, default: false })
  aiAssistanceAccepted!: boolean;

  @Prop({ required: true })
  consentAcceptedAt!: Date;

  @Prop({ required: true, default: 'hackathon-v1' })
  privacyNoticeVersion!: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
