import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MedicalRecordDocument = HydratedDocument<MedicalRecord>;

@Schema({ _id: false })
export class PrescriptionItem {
  @Prop({ required: true, trim: true })
  medicine!: string;

  @Prop({ trim: true })
  dosage?: string;

  @Prop({ trim: true })
  instruction?: string;

  @Prop({ trim: true })
  duration?: string;
}

export const PrescriptionItemSchema =
  SchemaFactory.createForClass(PrescriptionItem);

@Schema({ timestamps: true, collection: 'medical_records' })
export class MedicalRecord {
  @Prop({ required: true, index: true, unique: true })
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
  consultationSummary?: string;

  @Prop({ trim: true })
  publicNote?: string;

  @Prop({ trim: true })
  privateNote?: string;

  @Prop({ trim: true })
  recommendations?: string;

  @Prop({ type: [PrescriptionItemSchema], default: [] })
  prescriptions!: PrescriptionItem[];
}

export const MedicalRecordSchema = SchemaFactory.createForClass(MedicalRecord);

MedicalRecordSchema.index(
  { patientId: 1, createdAt: -1 },
  { name: 'patient_records_timeline' },
);
MedicalRecordSchema.index(
  { doctorApplicationId: 1, createdAt: -1 },
  { name: 'doctor_records_timeline' },
);
