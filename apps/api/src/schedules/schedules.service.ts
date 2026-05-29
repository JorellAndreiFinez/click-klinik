import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { HydratedDocument, Model } from 'mongoose';
import { Doctor } from '../doctors/schemas/doctor.schema';
import { CreateScheduleSlotDto } from './dto/create-schedule-slot.dto';
import {
  UpsertWeeklyTemplateDto,
  type WeeklyTemplateEntryInput,
} from './dto/upsert-weekly-template.dto';
import { UpdateScheduleSlotDto } from './dto/update-schedule-slot.dto';
import { ScheduleNotification, ScheduleSlot } from './schemas/schedule.schema';
import { WeeklyTemplateEntry } from './schemas/weekly-template.schema';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(ScheduleSlot.name)
    private readonly slotModel: Model<ScheduleSlot>,
    @InjectModel(ScheduleNotification.name)
    private readonly notificationModel: Model<ScheduleNotification>,
    @InjectModel(WeeklyTemplateEntry.name)
    private readonly weeklyTemplateModel: Model<WeeklyTemplateEntry>,
  ) {}

  async listWeeklyTemplate(
    user: DecodedIdToken,
  ): Promise<WeeklyTemplateEntry[]> {
    const doctor = await this.getApprovedDoctor(user);
    const current = await this.weeklyTemplateModel
      .find({ doctorApplicationId: String(doctor._id) })
      .sort({ dayOfWeek: 1 })
      .exec();

    return completeWeeklyTemplate(current, String(doctor._id));
  }

  async upsertWeeklyTemplate(
    user: DecodedIdToken,
    dto: UpsertWeeklyTemplateDto,
  ): Promise<WeeklyTemplateEntry[]> {
    const doctor = await this.getApprovedDoctor(user);
    const doctorApplicationId = String(doctor._id);
    const entries = normalizeWeeklyEntries(dto.entries, doctorApplicationId);

    await Promise.all(
      entries.map((entry) =>
        this.weeklyTemplateModel
          .findOneAndUpdate(
            {
              doctorApplicationId,
              dayOfWeek: entry.dayOfWeek,
            },
            { $set: entry },
            { upsert: true, new: true, runValidators: true },
          )
          .exec(),
      ),
    );

    const defaultWindow = resolveSlotWindow();
    await this.syncTemplateSlotsForWindow(
      doctorApplicationId,
      doctor.professionalEmail,
      entries,
      defaultWindow.startAt,
      defaultWindow.endAt,
    );
    await this.createNotification(
      doctorApplicationId,
      'slot_updated',
      'Weekly schedule updated',
      'Your Monday to Sunday consultation availability was updated.',
    );

    return this.listWeeklyTemplate(user);
  }

  async listSlots(
    user: DecodedIdToken,
    from?: string,
    to?: string,
  ): Promise<ScheduleSlot[]> {
    const doctor = await this.getApprovedDoctor(user);
    const doctorApplicationId = String(doctor._id);
    const template = await this.weeklyTemplateModel
      .find({ doctorApplicationId })
      .sort({ dayOfWeek: 1 })
      .exec();
    const window = resolveSlotWindow(from, to);

    if (template.length > 0) {
      await this.syncTemplateSlotsForWindow(
        doctorApplicationId,
        doctor.professionalEmail,
        completeWeeklyTemplate(template, doctorApplicationId),
        window.startAt,
        window.endAt,
      );
    }

    await this.removeExactDuplicateSlots(
      doctorApplicationId,
      window.startAt,
      window.endAt,
    );
    await this.normalizeBookedOverlaps(
      doctorApplicationId,
      doctor.professionalEmail,
      window.startAt,
      window.endAt,
    );

    return this.slotModel
      .find({
        doctorApplicationId,
        startAt: { $gte: window.startAt, $lt: window.endAt },
      })
      .sort({ startAt: 1 })
      .exec();
  }

  async listPublicDoctorAvailability(
    doctorId: string,
    from?: string,
    to?: string,
  ): Promise<ScheduleSlot[]> {
    const doctor = await this.doctorModel
      .findOne({
        _id: doctorId,
        applicationStatus: 'approved',
        displayOnPublicWebsite: true,
      })
      .exec();

    if (!doctor) {
      throw new NotFoundException('Public doctor profile not found.');
    }

    const doctorApplicationId = String(doctor._id);
    const template = await this.weeklyTemplateModel
      .find({ doctorApplicationId })
      .sort({ dayOfWeek: 1 })
      .exec();
    const window = resolveSlotWindow(from, to);

    if (template.length > 0) {
      await this.syncTemplateSlotsForWindow(
        doctorApplicationId,
        doctor.professionalEmail,
        completeWeeklyTemplate(template, doctorApplicationId),
        window.startAt,
        window.endAt,
      );
    }

    await this.removeExactDuplicateSlots(
      doctorApplicationId,
      window.startAt,
      window.endAt,
    );
    await this.normalizeBookedOverlaps(
      doctorApplicationId,
      doctor.professionalEmail,
      window.startAt,
      window.endAt,
    );

    return this.slotModel
      .find({
        doctorApplicationId,
        status: 'available',
        startAt: { $gte: window.startAt, $lt: window.endAt },
      })
      .sort({ startAt: 1 })
      .exec();
  }

  async createSlot(
    user: DecodedIdToken,
    dto: CreateScheduleSlotDto,
  ): Promise<ScheduleSlot> {
    const doctor = await this.getApprovedDoctor(user);
    const { startAt, endAt } = validatePeriod(dto.startAt, dto.endAt);
    await this.assertNoOverlap(String(doctor._id), startAt, endAt);

    const slot = await this.slotModel.create({
      doctorApplicationId: String(doctor._id),
      doctorEmail: doctor.professionalEmail,
      startAt,
      endAt,
      status: dto.status,
      source: 'manual',
      note: dto.note?.trim(),
    });

    await this.createNotification(
      String(doctor._id),
      'slot_created',
      dto.status === 'available'
        ? 'Availability published'
        : 'Unavailable period added',
      describeSlot(slot),
    );

    return slot;
  }

  async updateSlot(
    user: DecodedIdToken,
    id: string,
    dto: UpdateScheduleSlotDto,
  ): Promise<ScheduleSlot> {
    const doctor = await this.getApprovedDoctor(user);
    const currentSlot = await this.slotModel
      .findOne({
        _id: id,
        doctorApplicationId: String(doctor._id),
        status: { $ne: 'booked' },
      })
      .exec();

    if (!currentSlot) {
      throw new NotFoundException('Schedule slot not found or already booked.');
    }

    const startAt = dto.startAt ? new Date(dto.startAt) : currentSlot.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : currentSlot.endAt;
    validateDateRange(startAt, endAt);

    await this.assertNoOverlap(String(doctor._id), startAt, endAt, id);

    const slot = await this.slotModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            startAt,
            endAt,
            status: dto.status ?? currentSlot.status,
            source: 'manual',
            note: dto.note?.trim() ?? currentSlot.note,
          },
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!slot) {
      throw new NotFoundException('Schedule slot not found or already booked.');
    }

    await this.createNotification(
      String(doctor._id),
      'slot_updated',
      'Schedule updated',
      `${describeSlot(slot)} is now ${dto.status}.`,
    );

    return slot;
  }

  async removeSlot(
    user: DecodedIdToken,
    id: string,
  ): Promise<{ removed: true }> {
    const doctor = await this.getApprovedDoctor(user);
    const slot = await this.slotModel
      .findOneAndDelete({
        _id: id,
        doctorApplicationId: String(doctor._id),
        status: { $ne: 'booked' },
      })
      .exec();

    if (!slot) {
      throw new NotFoundException('Schedule slot not found or already booked.');
    }

    await this.createNotification(
      String(doctor._id),
      'slot_removed',
      'Schedule removed',
      `${describeSlot(slot)} was removed from your schedule.`,
    );

    return { removed: true };
  }

  async listNotifications(
    user: DecodedIdToken,
  ): Promise<ScheduleNotification[]> {
    const doctor = await this.getApprovedDoctor(user);
    return this.notificationModel
      .find({ doctorApplicationId: String(doctor._id) })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();
  }

  async readNotification(
    user: DecodedIdToken,
    id: string,
  ): Promise<ScheduleNotification> {
    const doctor = await this.getApprovedDoctor(user);
    const notification = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, doctorApplicationId: String(doctor._id) },
        { $set: { read: true } },
        { new: true },
      )
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return notification;
  }

  private async getApprovedDoctor(
    user: DecodedIdToken,
  ): Promise<HydratedDocument<Doctor>> {
    const email =
      typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    if (!email) {
      throw new ForbiddenException('Doctor account email is required.');
    }

    const doctor = await this.doctorModel
      .findOne({
        $or: [{ firebaseUid: user.uid }, { professionalEmail: email }],
        applicationStatus: 'approved',
      })
      .exec();

    if (!doctor) {
      throw new ForbiddenException('Approved doctor access is required.');
    }

    return doctor;
  }

  private async assertNoOverlap(
    doctorApplicationId: string,
    startAt: Date,
    endAt: Date,
    excludeSlotId?: string,
  ): Promise<void> {
    const conflictingSlot = await this.slotModel
      .exists({
        doctorApplicationId,
        ...(excludeSlotId ? { _id: { $ne: excludeSlotId } } : {}),
        startAt: { $lt: endAt },
        endAt: { $gt: startAt },
      })
      .exec();

    if (conflictingSlot) {
      throw new ConflictException(
        'This schedule overlaps with another available or unavailable period.',
      );
    }
  }

  private async createNotification(
    doctorApplicationId: string,
    type: ScheduleNotification['type'],
    title: string,
    message: string,
  ): Promise<void> {
    await this.notificationModel.create({
      doctorApplicationId,
      type,
      title,
      message,
      read: false,
    });
  }

  private async syncTemplateSlotsForWindow(
    doctorApplicationId: string,
    doctorEmail: string,
    entries: WeeklyTemplateEntry[],
    windowStart: Date,
    windowEnd: Date,
  ): Promise<void> {
    await this.slotModel.deleteMany({
      doctorApplicationId,
      source: 'template',
      status: { $ne: 'booked' },
      startAt: { $gte: windowStart, $lt: windowEnd },
    });

    const protectedSlots = await this.slotModel
      .find({
        doctorApplicationId,
        $or: [{ source: { $ne: 'template' } }, { status: 'booked' }],
        startAt: { $lt: windowEnd },
        endAt: { $gt: windowStart },
      })
      .select(['startAt', 'endAt'])
      .lean()
      .exec();

    const creatableSlots: Array<{
      doctorApplicationId: string;
      doctorEmail: string;
      startAt: Date;
      endAt: Date;
      status: 'available' | 'unavailable';
      source: 'template';
      note: string;
    }> = [];

    for (
      const currentDate = startOfDay(windowStart);
      currentDate < windowEnd;
      currentDate.setDate(currentDate.getDate() + 1)
    ) {
      const entry = entries.find(
        (item) => item.dayOfWeek === currentDate.getDay(),
      );

      if (!entry || entry.status === 'off') {
        continue;
      }

      const slotDate = new Date(currentDate);
      const startAt = combineDateAndTime(slotDate, entry.startTime!);
      const endAt = combineDateAndTime(slotDate, entry.endTime!);

      if (startAt >= windowEnd || endAt <= windowStart) {
        continue;
      }

      let segments = [{ startAt, endAt }];

      for (const protectedSlot of protectedSlots) {
        segments = segments.flatMap((segment) =>
          subtractSegment(segment, {
            startAt: protectedSlot.startAt,
            endAt: protectedSlot.endAt,
          }),
        );
      }

      creatableSlots.push(
        ...segments
          .filter((segment) => segment.endAt > segment.startAt)
          .map((segment) => ({
            doctorApplicationId,
            doctorEmail,
            startAt: segment.startAt,
            endAt: segment.endAt,
            status:
              entry.status === 'available'
                ? ('available' as const)
                : ('unavailable' as const),
            source: 'template' as const,
            note: `Weekly availability template for ${DAY_LABELS[entry.dayOfWeek]}`,
          })),
      );
    }

    if (creatableSlots.length > 0) {
      await this.slotModel.insertMany(creatableSlots);
    }
  }

  private async removeExactDuplicateSlots(
    doctorApplicationId: string,
    windowStart: Date,
    windowEnd: Date,
  ): Promise<void> {
    const slots = await this.slotModel
      .find({
        doctorApplicationId,
        startAt: { $gte: windowStart, $lt: windowEnd },
      })
      .sort({ createdAt: 1, _id: 1 })
      .exec();

    const seen = new Set<string>();
    const duplicateIds: string[] = [];

    for (const slot of slots) {
      const key = [
        slot.startAt.toISOString(),
        slot.endAt.toISOString(),
        slot.status,
      ].join('|');

      if (seen.has(key)) {
        duplicateIds.push(String(slot._id));
        continue;
      }

      seen.add(key);
    }

    if (duplicateIds.length > 0) {
      await this.slotModel.deleteMany({ _id: { $in: duplicateIds } }).exec();
    }
  }

  private async normalizeBookedOverlaps(
    doctorApplicationId: string,
    doctorEmail: string,
    windowStart: Date,
    windowEnd: Date,
  ): Promise<void> {
    const slots = await this.slotModel
      .find({
        doctorApplicationId,
        startAt: { $lt: windowEnd },
        endAt: { $gt: windowStart },
      })
      .sort({ startAt: 1, endAt: 1 })
      .exec();

    const bookedSlots = slots.filter((slot) => slot.status === 'booked');
    if (bookedSlots.length === 0) {
      return;
    }

    for (const slot of slots) {
      if (slot.status === 'booked') {
        continue;
      }

      const overlaps = bookedSlots.filter(
        (bookedSlot) =>
          bookedSlot.startAt < slot.endAt && bookedSlot.endAt > slot.startAt,
      );

      if (overlaps.length === 0) {
        continue;
      }

      let segments = [{ startAt: slot.startAt, endAt: slot.endAt }];

      for (const bookedSlot of overlaps) {
        segments = segments.flatMap((segment) =>
          subtractSegment(segment, {
            startAt: bookedSlot.startAt,
            endAt: bookedSlot.endAt,
          }),
        );
      }

      await this.slotModel.findByIdAndDelete(slot._id).exec();

      const remainderSegments = segments.filter(
        (segment) => segment.endAt > segment.startAt,
      );

      if (remainderSegments.length > 0) {
        await this.slotModel.insertMany(
          remainderSegments.map((segment) => ({
            doctorApplicationId,
            doctorEmail,
            startAt: segment.startAt,
            endAt: segment.endAt,
            status: slot.status,
            source: slot.source,
            note: slot.note,
          })),
        );
      }
    }
  }
}

const DEFAULT_RECURRING_WINDOW_DAYS = 60;

function subtractSegment(
  segment: { startAt: Date; endAt: Date },
  blocker: { startAt: Date; endAt: Date },
): Array<{ startAt: Date; endAt: Date }> {
  if (blocker.endAt <= segment.startAt || blocker.startAt >= segment.endAt) {
    return [segment];
  }

  const nextSegments: Array<{ startAt: Date; endAt: Date }> = [];

  if (blocker.startAt > segment.startAt) {
    nextSegments.push({
      startAt: segment.startAt,
      endAt: blocker.startAt,
    });
  }

  if (blocker.endAt < segment.endAt) {
    nextSegments.push({
      startAt: blocker.endAt,
      endAt: segment.endAt,
    });
  }

  return nextSegments;
}

function validatePeriod(
  rawStartAt: string,
  rawEndAt: string,
): { startAt: Date; endAt: Date } {
  const startAt = new Date(rawStartAt);
  const endAt = new Date(rawEndAt);

  validateDateRange(startAt, endAt);

  return { startAt, endAt };
}

function validateDateRange(startAt: Date, endAt: Date): void {
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new BadRequestException('Enter a valid schedule date and time.');
  }

  if (endAt <= startAt) {
    throw new BadRequestException('End time must be later than start time.');
  }
}

function describeSlot(slot: ScheduleSlot): string {
  return `${slot.startAt.toLocaleString('en-PH')} to ${slot.endAt.toLocaleTimeString('en-PH')}`;
}

const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

function normalizeWeeklyEntries(
  entries: WeeklyTemplateEntryInput[],
  doctorApplicationId: string,
): WeeklyTemplateEntry[] {
  const byDay = new Map(entries.map((entry) => [entry.dayOfWeek, entry]));
  const normalized: WeeklyTemplateEntry[] = [];

  for (let day = 0; day < 7; day += 1) {
    const dayOfWeek = day as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const entry = byDay.get(dayOfWeek) ?? {
      dayOfWeek,
      status: 'off' as const,
    };
    const normalizedEntry: WeeklyTemplateEntry = {
      doctorApplicationId,
      dayOfWeek,
      status: entry.status,
      startTime: undefined,
      endTime: undefined,
    };

    if (entry.status !== 'off') {
      validateTemplateTimeRange(entry.startTime, entry.endTime);
      normalizedEntry.startTime = entry.startTime;
      normalizedEntry.endTime = entry.endTime;
    }

    normalized.push(normalizedEntry);
  }

  return normalized;
}

function completeWeeklyTemplate(
  current: WeeklyTemplateEntry[],
  doctorApplicationId: string,
): WeeklyTemplateEntry[] {
  const byDay = new Map(current.map((entry) => [entry.dayOfWeek, entry]));
  return Array.from({ length: 7 }, (_, index) => {
    const dayOfWeek = index as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const existing = byDay.get(dayOfWeek);
    if (!existing) {
      return {
        doctorApplicationId,
        dayOfWeek,
        status: 'off',
      };
    }

    if (existing.status === 'unavailable') {
      return {
        ...existing,
        status: 'off',
        startTime: undefined,
        endTime: undefined,
      };
    }

    return existing;
  });
}

function validateTemplateTimeRange(startTime?: string, endTime?: string): void {
  if (!startTime || !endTime) {
    throw new BadRequestException(
      'Choose both a start time and an end time for available days.',
    );
  }

  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  const minimumMinutes = 7 * 60;
  const maximumMinutes = 20 * 60;

  if (
    startMinutes < minimumMinutes ||
    endMinutes > maximumMinutes ||
    startMinutes >= endMinutes
  ) {
    throw new BadRequestException(
      'Weekly schedule must stay between 7:00 AM and 8:00 PM, with the end after the start.',
    );
  }
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

function resolveSlotWindow(
  from?: string,
  to?: string,
): {
  startAt: Date;
  endAt: Date;
} {
  if (!from && !to) {
    const startAt = startOfDay(new Date());
    const endAt = new Date(startAt);
    endAt.setDate(endAt.getDate() + DEFAULT_RECURRING_WINDOW_DAYS);
    return { startAt, endAt };
  }

  const startAt = startOfDay(parseWindowDate(from, 'from'));
  const endAt = startOfDay(parseWindowDate(to, 'to'));
  endAt.setDate(endAt.getDate() + 1);

  if (endAt <= startAt) {
    throw new BadRequestException(
      'The schedule range end must be after the start.',
    );
  }

  return { startAt, endAt };
}

function parseWindowDate(value: string | undefined, label: string): Date {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Enter a valid ${label} date.`);
  }

  return date;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}
