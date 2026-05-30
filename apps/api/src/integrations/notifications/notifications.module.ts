import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../../auth/auth.module';
import { Doctor, DoctorSchema } from '../../doctors/schemas/doctor.schema';
import { Patient, PatientSchema } from '../../patients/schemas/patient.schema';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import {
  AppNotification,
  AppNotificationSchema,
} from './schemas/app-notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppNotification.name, schema: AppNotificationSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
    AuthModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
