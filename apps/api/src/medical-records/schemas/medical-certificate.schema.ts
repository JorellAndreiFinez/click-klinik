import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MedicalCertificateDocument = HydratedDocument<MedicalCertificate>;

@Schema({ timestamps: true, collection: 'medical_certificates' })
export class MedicalCertificate {
  @Prop({ required: true, unique: true, index: true })
  appointmentId!: string;

  @Prop({ required: true, index: true })
  patientId!: string;

  @Prop({ required: true, trim: true })
  patientName!: string;

  @Prop({ required: true, index: true })
  doctorApplicationId!: string;

  @Prop({ required: true, trim: true })
  doctorName!: string;

  @Prop({ required: true, trim: true })
  specializationName!: string;

  @Prop({ trim: true })
  code?: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  body!: string;

  @Prop({ trim: true })
  remarks?: string;

  @Prop({ required: true })
  issuedAt!: Date;

  @Prop({ trim: true })
  doctorSignatureDataUrl?: string;

  @Prop({ trim: true })
  doctorSignatureText?: string;
}

export const MedicalCertificateSchema =
  SchemaFactory.createForClass(MedicalCertificate);

MedicalCertificateSchema.index(
  { patientId: 1, issuedAt: -1 },
  { name: 'patient_certificates_timeline' },
);
MedicalCertificateSchema.index(
  { doctorApplicationId: 1, issuedAt: -1 },
  { name: 'doctor_certificates_timeline' },
);
