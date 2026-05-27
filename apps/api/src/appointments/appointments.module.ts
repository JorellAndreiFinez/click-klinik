import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { CalendarModule } from '../integrations/calendar/calendar.module';
import { PaymentsModule } from '../integrations/payments/payments.module';
import { Doctor, DoctorSchema } from '../doctors/schemas/doctor.schema';
import { Patient, PatientSchema } from '../patients/schemas/patient.schema';
import { ScheduleSlot, ScheduleSlotSchema } from '../schedules/schemas/schedule.schema';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: ScheduleSlot.name, schema: ScheduleSlotSchema },
    ]),
    AuthModule,
    CalendarModule,
    PaymentsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
