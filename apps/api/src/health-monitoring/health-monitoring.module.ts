import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { AuthModule } from '../auth/auth.module';
import { Doctor, DoctorSchema } from '../doctors/schemas/doctor.schema';
import { Patient, PatientSchema } from '../patients/schemas/patient.schema';
import { HealthMonitoringController } from './health-monitoring.controller';
import { HealthMonitoringService } from './health-monitoring.service';
import {
  HealthMonitoringLog,
  HealthMonitoringLogSchema,
} from './schemas/health-monitoring-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HealthMonitoringLog.name, schema: HealthMonitoringLogSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
    AuthModule,
  ],
  controllers: [HealthMonitoringController],
  providers: [HealthMonitoringService],
  exports: [HealthMonitoringService],
})
export class HealthMonitoringModule {}
