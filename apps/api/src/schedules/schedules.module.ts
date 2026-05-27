import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Doctor, DoctorSchema } from '../doctors/schemas/doctor.schema';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import {
  ScheduleNotification,
  ScheduleNotificationSchema,
  ScheduleSlot,
  ScheduleSlotSchema,
} from './schemas/schedule.schema';
import {
  WeeklyTemplateEntry,
  WeeklyTemplateEntrySchema,
} from './schemas/weekly-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Doctor.name, schema: DoctorSchema },
      { name: ScheduleSlot.name, schema: ScheduleSlotSchema },
      { name: ScheduleNotification.name, schema: ScheduleNotificationSchema },
      { name: WeeklyTemplateEntry.name, schema: WeeklyTemplateEntrySchema },
    ]),
    AuthModule,
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
