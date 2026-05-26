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
  fullName!: string;

  @Prop({ required: true, lowercase: true, trim: true })
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
