import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, collection: 'doctor_applications' })
export class Doctor {
  @Prop({ required: true, unique: true, sparse: true, select: false })
  firebaseUid!: string;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, trim: true })
  suffix!: string;

  @Prop({ required: true, lowercase: true, trim: true, unique: true })
  professionalEmail!: string;

  @Prop({ required: true, unique: true, sparse: true })
  mobileNumber!: string;

  @Prop({ required: true, trim: true, unique: true })
  prcLicenseNumber!: string;

  @Prop({ required: true })
  specializationCode!: string;

  @Prop({ required: true })
  specializationName!: string;

  @Prop({ trim: true })
  clinicOrHospital?: string;

  @Prop({ trim: true, index: true })
  location?: string;

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

  @Prop({ required: true })
  yearsOfExperience!: number;

  @Prop({ required: true, trim: true })
  bio!: string;

  @Prop({ required: true, default: false })
  displayOnPublicWebsite!: boolean;

  @Prop({
    required: true,
    default: 'pending_review',
    enum: ['pending_review', 'approved', 'rejected'],
  })
  applicationStatus!: 'pending_review' | 'approved' | 'rejected';

  @Prop({ required: true })
  credentialReviewConsentAcceptedAt!: Date;

  @Prop({ trim: true })
  reviewNotes?: string;

  @Prop({ trim: true })
  reviewedByEmail?: string;

  @Prop()
  reviewedAt?: Date;

  @Prop({ type: [String], default: [] })
  searchableSymptoms!: string[];
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
