import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CreateHealthMonitoringLogDto } from './dto/create-health-monitoring-log.dto';
import { HealthMonitoringService } from './health-monitoring.service';

@Controller('health-monitoring')
@UseGuards(FirebaseAuthGuard)
export class HealthMonitoringController {
  constructor(
    private readonly healthMonitoringService: HealthMonitoringService,
  ) {}

  @Post('me/logs')
  createMyLog(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateHealthMonitoringLogDto,
  ) {
    return this.healthMonitoringService.createMyLog(request.user, dto);
  }

  @Get('me/logs')
  listMyLogs(@Req() request: AuthenticatedRequest) {
    return this.healthMonitoringService.listMyLogs(request.user);
  }

  @Get('me/summary')
  getMySummary(@Req() request: AuthenticatedRequest) {
    return this.healthMonitoringService.getMySummary(request.user);
  }

  @Get('me/doctor/patients/:patientId/summary')
  getDoctorPatientSummary(
    @Req() request: AuthenticatedRequest,
    @Param('patientId') patientId: string,
  ) {
    return this.healthMonitoringService.getDoctorPatientSummary(
      request.user,
      patientId,
    );
  }
}
