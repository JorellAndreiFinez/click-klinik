import { IsIn } from 'class-validator';
import { APPOINTMENT_STATUSES } from '../schemas/appointment.schema';

export class UpdateAppointmentStatusDto {
  @IsIn(APPOINTMENT_STATUSES)
  status!: (typeof APPOINTMENT_STATUSES)[number];
}
