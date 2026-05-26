import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { CheckMobileNumberDto } from './dto/check-mobile-number.dto';
import { UpsertPatientProfileDto } from './dto/upsert-patient-profile.dto';
import { PatientsService } from './patients.service';
import { Patient } from './schemas/patient.schema';

@Controller('patients')
@UseGuards(FirebaseAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('me')
  getMyProfile(@Req() request: AuthenticatedRequest): Promise<Patient> {
    return this.patientsService.getProfile(request.user);
  }

  @Post('me')
  upsertMyProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpsertPatientProfileDto,
  ): Promise<Patient> {
    return this.patientsService.upsertProfile(request.user, dto);
  }

  @Post('mobile-availability')
  checkMobileAvailability(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CheckMobileNumberDto,
  ): Promise<{ available: true }> {
    return this.patientsService.checkMobileAvailability(
      request.user,
      dto.mobileNumber,
    );
  }
}
