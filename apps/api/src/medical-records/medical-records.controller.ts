import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { MedicalRecordsService } from './medical-records.service';
import { UpsertMedicalRecordDto } from './dto/upsert-medical-record.dto';
import { MedicalRecord } from './schemas/medical-record.schema';

@Controller('medical-records')
@UseGuards(FirebaseAuthGuard)
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get('me/patient')
  getPatientRecords(@Req() request: AuthenticatedRequest) {
    return this.medicalRecordsService.getPatientRecords(request.user);
  }

  @Get('me/doctor/patients')
  listDoctorPatients(@Req() request: AuthenticatedRequest) {
    return this.medicalRecordsService.listDoctorPatients(request.user);
  }

  @Get('me/doctor/patients/:patientId')
  getDoctorPatientDetail(
    @Req() request: AuthenticatedRequest,
    @Param('patientId') patientId: string,
  ) {
    return this.medicalRecordsService.getDoctorPatientDetail(
      request.user,
      patientId,
    );
  }

  @Get('me/doctor/appointments/:appointmentId')
  getDoctorAppointmentRecord(
    @Req() request: AuthenticatedRequest,
    @Param('appointmentId') appointmentId: string,
  ): Promise<MedicalRecord | null> {
    return this.medicalRecordsService.getDoctorAppointmentRecord(
      request.user,
      appointmentId,
    );
  }

  @Put('me/doctor/appointments/:appointmentId')
  upsertDoctorAppointmentRecord(
    @Req() request: AuthenticatedRequest,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpsertMedicalRecordDto,
  ): Promise<MedicalRecord> {
    return this.medicalRecordsService.upsertDoctorAppointmentRecord(
      request.user,
      appointmentId,
      dto,
    );
  }
}
