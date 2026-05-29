import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { AuthModule } from '../auth/auth.module';
import { Doctor, DoctorSchema } from '../doctors/schemas/doctor.schema';
import {
  HealthMonitoringLog,
  HealthMonitoringLogSchema,
} from '../health-monitoring/schemas/health-monitoring-log.schema';
import { Patient, PatientSchema } from '../patients/schemas/patient.schema';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './medical-records.service';
import {
  MedicalCertificate,
  MedicalCertificateSchema,
} from './schemas/medical-certificate.schema';
import { MedicalRecord, MedicalRecordSchema } from './schemas/medical-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MedicalRecord.name, schema: MedicalRecordSchema },
      { name: MedicalCertificate.name, schema: MedicalCertificateSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: HealthMonitoringLog.name, schema: HealthMonitoringLogSchema },
    ]),
    AuthModule,
  ],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
