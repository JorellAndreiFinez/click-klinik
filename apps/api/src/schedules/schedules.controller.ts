import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CreateScheduleSlotDto } from './dto/create-schedule-slot.dto';
import { UpsertWeeklyTemplateDto } from './dto/upsert-weekly-template.dto';
import { UpdateScheduleSlotDto } from './dto/update-schedule-slot.dto';
import { ScheduleNotification, ScheduleSlot } from './schemas/schedule.schema';
import { WeeklyTemplateEntry } from './schemas/weekly-template.schema';
import { SchedulesService } from './schedules.service';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('me/weekly-template')
  @UseGuards(FirebaseAuthGuard)
  listWeeklyTemplate(
    @Req() request: AuthenticatedRequest,
  ): Promise<WeeklyTemplateEntry[]> {
    return this.schedulesService.listWeeklyTemplate(request.user);
  }

  @Put('me/weekly-template')
  @UseGuards(FirebaseAuthGuard)
  upsertWeeklyTemplate(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpsertWeeklyTemplateDto,
  ): Promise<WeeklyTemplateEntry[]> {
    return this.schedulesService.upsertWeeklyTemplate(request.user, dto);
  }

  @Get('me/slots')
  @UseGuards(FirebaseAuthGuard)
  listSlots(
    @Req() request: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<ScheduleSlot[]> {
    return this.schedulesService.listSlots(request.user, from, to);
  }

  @Post('me/slots')
  @UseGuards(FirebaseAuthGuard)
  createSlot(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateScheduleSlotDto,
  ): Promise<ScheduleSlot> {
    return this.schedulesService.createSlot(request.user, dto);
  }

  @Patch('me/slots/:id')
  @UseGuards(FirebaseAuthGuard)
  updateSlot(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleSlotDto,
  ): Promise<ScheduleSlot> {
    return this.schedulesService.updateSlot(request.user, id, dto);
  }

  @Delete('me/slots/:id')
  @UseGuards(FirebaseAuthGuard)
  removeSlot(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ removed: true }> {
    return this.schedulesService.removeSlot(request.user, id);
  }

  @Get('me/notifications')
  @UseGuards(FirebaseAuthGuard)
  listNotifications(
    @Req() request: AuthenticatedRequest,
  ): Promise<ScheduleNotification[]> {
    return this.schedulesService.listNotifications(request.user);
  }

  @Patch('me/notifications/:id/read')
  @UseGuards(FirebaseAuthGuard)
  readNotification(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ScheduleNotification> {
    return this.schedulesService.readNotification(request.user, id);
  }

  @Get('public/doctors/:doctorId/availability')
  listPublicDoctorAvailability(
    @Param('doctorId') doctorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<ScheduleSlot[]> {
    return this.schedulesService.listPublicDoctorAvailability(
      doctorId,
      from,
      to,
    );
  }
}
