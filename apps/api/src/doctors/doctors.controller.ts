import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { CheckDoctorMobileNumberDto } from './dto/check-doctor-mobile-number.dto';
import { CreateDoctorApplicationDto } from './dto/create-doctor-application.dto';
import { DoctorRecommendationDto } from './dto/doctor-recommendation.dto';
import { ReviewDoctorApplicationDto } from './dto/review-doctor-application.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { DoctorsService } from './doctors.service';
import { Doctor } from './schemas/doctor.schema';
import { SearchDoctorsDto } from './dto/search-doctors.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  getMyApplication(@Req() request: AuthenticatedRequest): Promise<Doctor> {
    return this.doctorsService.getMyApplication(request.user);
  }

  @Get('me/access')
  @UseGuards(FirebaseAuthGuard)
  getMyApprovedAccess(@Req() request: AuthenticatedRequest): Promise<Doctor> {
    return this.doctorsService.getMyApprovedAccess(request.user);
  }

  @Patch('me')
  @UseGuards(FirebaseAuthGuard)
  updateMyProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateDoctorProfileDto,
  ): Promise<Doctor> {
    return this.doctorsService.updateMyProfile(request.user, dto);
  }

  @Get('discover')
  discoverDoctors(@Query() filters: SearchDoctorsDto) {
    return this.doctorsService.discoverDoctors(filters);
  }

  @Post('recommendation')
  recommendDoctors(@Body() dto: DoctorRecommendationDto) {
    return this.doctorsService.recommendDoctors(dto);
  }

  @Get('public/:id')
  getPublicDoctorProfile(@Param('id') id: string): Promise<Doctor> {
    return this.doctorsService.getPublicDoctorProfile(id);
  }

  @Post('applications')
  @UseGuards(FirebaseAuthGuard)
  submitApplication(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateDoctorApplicationDto,
  ): Promise<Doctor> {
    return this.doctorsService.submitApplication(request.user, dto);
  }

  @Post('signup-eligibility')
  @UseGuards(FirebaseAuthGuard)
  checkSignupEligibility(
    @Req() request: AuthenticatedRequest,
  ): Promise<{ available: true }> {
    return this.doctorsService.checkSignupEligibility(request.user);
  }

  @Post('mobile-availability')
  @UseGuards(FirebaseAuthGuard)
  checkMobileAvailability(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CheckDoctorMobileNumberDto,
  ): Promise<{ available: true }> {
    return this.doctorsService.checkMobileAvailability(
      request.user,
      dto.mobileNumber,
    );
  }

  @Get('applications')
  @UseGuards(FirebaseAuthGuard, SuperAdminGuard)
  listApplications(): Promise<Doctor[]> {
    return this.doctorsService.listApplications();
  }

  @Patch('applications/:id/review')
  @UseGuards(FirebaseAuthGuard, SuperAdminGuard)
  reviewApplication(
    @Param('id') id: string,
    @Body() dto: ReviewDoctorApplicationDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Doctor> {
    return this.doctorsService.reviewApplication(id, dto, request.user.email!);
  }
}
