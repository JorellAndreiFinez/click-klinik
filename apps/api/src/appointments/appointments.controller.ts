import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RateDoctorDto } from './dto/rate-doctor.dto';
import { RequestRefundDto } from './dto/request-refund.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { Appointment } from './schemas/appointment.schema';

@Controller('appointments')
@UseGuards(FirebaseAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  createAppointment(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentsService.createAppointment(request.user, dto);
  }

  @Get('me/patient')
  listMyPatientAppointments(
    @Req() request: AuthenticatedRequest,
  ): Promise<Appointment[]> {
    return this.appointmentsService.listPatientAppointments(request.user);
  }

  @Get('me/doctor')
  listMyDoctorAppointments(
    @Req() request: AuthenticatedRequest,
  ): Promise<Appointment[]> {
    return this.appointmentsService.listDoctorAppointments(request.user);
  }

  @Get('me/doctor/payouts')
  listMyDoctorPayouts(@Req() request: AuthenticatedRequest) {
    return this.appointmentsService.listDoctorPayouts(request.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    return this.appointmentsService.updateStatus(request.user, id, dto);
  }

  @Post(':id/join')
  joinAppointment(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ meetLink?: string; appointment: Appointment }> {
    return this.appointmentsService.joinAppointment(request.user, id);
  }

  @Post(':id/rating')
  rateDoctor(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RateDoctorDto,
  ): Promise<Appointment> {
    return this.appointmentsService.rateDoctor(request.user, id, dto);
  }

  @Post(':id/refund-request')
  requestRefundAndCancel(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RequestRefundDto,
  ): Promise<Appointment> {
    return this.appointmentsService.requestRefundAndCancel(request.user, id, dto);
  }

  @Post(':id/refund')
  requestRefundAndCancelAlias(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RequestRefundDto,
  ): Promise<Appointment> {
    return this.appointmentsService.requestRefundAndCancel(request.user, id, dto);
  }

  @Post(':id/payment/refresh')
  refreshPaymentStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Appointment> {
    return this.appointmentsService.refreshPaymentStatus(request.user, id);
  }

  @Post(':id/refresh-payment')
  refreshPaymentStatusAlias(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Appointment> {
    return this.appointmentsService.refreshPaymentStatus(request.user, id);
  }

  @Post('payments/:referenceId/refresh')
  refreshPaymentStatusByReference(
    @Req() request: AuthenticatedRequest,
    @Param('referenceId') referenceId: string,
  ): Promise<Appointment> {
    return this.appointmentsService.refreshPaymentStatusByReference(
      request.user,
      referenceId,
    );
  }
}
