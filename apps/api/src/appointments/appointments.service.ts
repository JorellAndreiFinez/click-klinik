import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { HydratedDocument, Model } from 'mongoose';
import { CalendarService } from '../integrations/calendar/calendar.service';
import { PaymentsService } from '../integrations/payments/payments.service';
import { Patient } from '../patients/schemas/patient.schema';
import { ScheduleSlot } from '../schedules/schemas/schedule.schema';
import { Doctor } from '../doctors/schemas/doctor.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import {
  resolveConsultationAddOns,
  resolveConsultationOption,
} from './consultation-catalog';
import {
  Appointment,
  AppointmentStatus,
} from './schemas/appointment.schema';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(ScheduleSlot.name)
    private readonly scheduleSlotModel: Model<ScheduleSlot>,
    private readonly calendarService: CalendarService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createAppointment(
    user: DecodedIdToken,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const patient = await this.getPatient(user);
    const doctor = await this.doctorModel
      .findOne({
        _id: dto.doctorId,
        applicationStatus: 'approved',
        displayOnPublicWebsite: true,
      })
      .exec();

    if (!doctor) {
      throw new NotFoundException('Doctor not found for booking.');
    }

    const consultation = resolveConsultationOption(
      doctor.specializationName,
      dto.consultationCode,
    );
    const addOns = resolveConsultationAddOns(
      doctor.specializationName,
      dto.addOnCodes ?? [],
    );
    const addOnsTotalPhp = addOns.reduce((sum, item) => sum + item.feePhp, 0);
    const totalFeePhp = consultation.feePhp + addOnsTotalPhp;

    const selectedStartAt = new Date(dto.scheduledStartAt);
    const selectedEndAt = new Date(dto.scheduledEndAt);
    validateBookableRange(selectedStartAt, selectedEndAt);

    const slot = await this.scheduleSlotModel
      .findOne({
        _id: dto.scheduleSlotId,
        doctorApplicationId: String(doctor._id),
        status: 'available',
      })
      .exec();

    if (!slot || selectedStartAt < slot.startAt || selectedEndAt > slot.endAt) {
      throw new ConflictException(
        'This consultation slot is no longer available.',
      );
    }

    const originalSlot = slot.toObject();
    const insertedSlotIds: string[] = [];

    try {
      const beforeSlot =
        selectedStartAt.getTime() > slot.startAt.getTime()
          ? {
              doctorApplicationId: slot.doctorApplicationId,
              doctorEmail: slot.doctorEmail,
              startAt: slot.startAt,
              endAt: selectedStartAt,
              status: 'available' as const,
              source: slot.source,
              note: slot.note,
            }
          : null;

      const afterSlot =
        selectedEndAt.getTime() < slot.endAt.getTime()
          ? {
              doctorApplicationId: slot.doctorApplicationId,
              doctorEmail: slot.doctorEmail,
              startAt: selectedEndAt,
              endAt: slot.endAt,
              status: 'available' as const,
              source: slot.source,
              note: slot.note,
            }
          : null;

      const updatedSlot = await this.scheduleSlotModel
        .findByIdAndUpdate(
          slot._id,
          {
            $set: {
              startAt: selectedStartAt,
              endAt: selectedEndAt,
              status: 'booked',
              note: `Booked by ${patient.firstName} ${patient.lastName}`,
            },
          },
          { new: true },
        )
        .exec();

      if (!updatedSlot) {
        throw new ConflictException('This consultation slot is no longer available.');
      }

      const remainingSlots = [beforeSlot, afterSlot].filter(Boolean);
      if (remainingSlots.length > 0) {
        const insertedSlots = await this.scheduleSlotModel.insertMany(remainingSlots);
        insertedSlotIds.push(...insertedSlots.map((item) => String(item._id)));
      }

      const patientName = `${patient.firstName} ${patient.lastName}`;
      const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
      const payment = await this.paymentsService.createCheckout({
        provider: dto.paymentProvider,
        amountPhp: totalFeePhp,
        description: `Click Klinik ${consultation.label} for ${patientName}`,
        patientFirstName: patient.firstName,
        patientLastName: patient.lastName,
        patientEmail: patient.email,
        patientMobileNumber: patient.mobileNumber,
        referenceId: `ck-${randomId()}`,
      });
      const calendarEvent = await this.calendarService.createConsultationEvent({
        doctorEmail: doctor.professionalEmail,
        doctorName,
        patientEmail: patient.email,
        patientName,
        startsAt: selectedStartAt,
        endsAt: selectedEndAt,
        summary: `Click Klinik teleconsult: ${patientName} with ${doctorName}`,
        description:
          'Telehealth consultation booked via Click Klinik. This consultation is guidance only and does not replace professional in-person emergency medical care.',
      });

      return await this.appointmentModel.create({
        patientId: String(patient._id),
        patientEmail: patient.email,
        patientName,
        doctorApplicationId: String(doctor._id),
        doctorEmail: doctor.professionalEmail,
        doctorName,
        specializationName: doctor.specializationName,
        doctorLocation: doctor.location ?? doctor.clinicOrHospital,
        consultationCode: consultation.code,
        consultationLabel: consultation.label,
        addOns: addOns.map((item) => ({
          code: item.code,
          label: item.label,
          feePhp: item.feePhp,
        })),
        baseFeePhp: consultation.feePhp,
        addOnsTotalPhp,
        totalFeePhp,
        currency: 'PHP',
        scheduledStartAt: selectedStartAt,
        scheduledEndAt: selectedEndAt,
        scheduleSlotId: String(updatedSlot._id),
        status: 'booked',
        googleCalendarEventId: calendarEvent.eventId,
        googleMeetLink: calendarEvent.meetLink,
        googleCalendarHtmlLink: calendarEvent.htmlLink,
        paymentProvider: dto.paymentProvider,
        paymentStatus: payment.paymentStatus,
        paymentReferenceId: payment.referenceId,
        paymentProviderPaymentId: payment.providerPaymentId,
        paymentCheckoutUrl: payment.checkoutUrl,
      });
    } catch (error) {
      await this.scheduleSlotModel.findByIdAndDelete(slot._id).exec();
      if (insertedSlotIds.length > 0) {
        await this.scheduleSlotModel
          .deleteMany({ _id: { $in: insertedSlotIds } })
          .exec();
      }
      await this.scheduleSlotModel.create(originalSlot);
      throw error;
    }
  }

  async listPatientAppointments(user: DecodedIdToken): Promise<Appointment[]> {
    const patient = await this.getPatient(user);
    return this.appointmentModel
      .find({ patientId: String(patient._id) })
      .sort({ scheduledStartAt: 1 })
      .exec();
  }

  async listDoctorAppointments(user: DecodedIdToken): Promise<Appointment[]> {
    const doctor = await this.getApprovedDoctor(user);
    return this.appointmentModel
      .find({ doctorApplicationId: String(doctor._id) })
      .sort({ scheduledStartAt: 1 })
      .exec();
  }

  async updateStatus(
    user: DecodedIdToken,
    id: string,
    dto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const appointment = await this.getAccessibleAppointment(user, id);
    const nextStatus = dto.status;

    if (
      nextStatus === 'completed' ||
      nextStatus === 'confirmed' ||
      nextStatus === 'active_consultation'
    ) {
      await this.assertDoctorAccess(user, appointment.doctorApplicationId);
    }

    if (nextStatus === 'cancelled') {
      const accessibleByDoctor = await this.isDoctorOwner(
        user,
        appointment.doctorApplicationId,
      );
      const accessibleByPatient = await this.isPatientOwner(user, appointment.patientId);

      if (!accessibleByDoctor && !accessibleByPatient) {
        throw new ForbiddenException('You do not have access to cancel this consultation.');
      }

      await this.scheduleSlotModel
        .findOneAndUpdate(
          {
            _id: appointment.scheduleSlotId,
            status: 'booked',
          },
          {
            $set: {
              status: 'available',
              note: 'Returned to availability after cancellation',
            },
          },
        )
        .exec();
    }

    const updated = await this.appointmentModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: nextStatus,
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Consultation not found.');
    }

    return updated;
  }

  async joinAppointment(
    user: DecodedIdToken,
    id: string,
  ): Promise<{ meetLink?: string; appointment: Appointment }> {
    const appointment = await this.getAccessibleAppointment(user, id);

    const isDoctor = await this.isDoctorOwner(user, appointment.doctorApplicationId);
    const isPatient = await this.isPatientOwner(user, appointment.patientId);

    if (!isDoctor && !isPatient) {
      throw new ForbiddenException('You do not have access to this consultation.');
    }

    const nextStatus: AppointmentStatus =
      appointment.status === 'completed' || appointment.status === 'cancelled'
        ? appointment.status
        : 'active_consultation';

    const updated = await this.appointmentModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: nextStatus,
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Consultation not found.');
    }

    return {
      meetLink: updated.googleMeetLink,
      appointment: updated,
    };
  }

  private async getPatient(
    user: DecodedIdToken,
  ): Promise<HydratedDocument<Patient>> {
    const patient = await this.patientModel
      .findOne({ firebaseUid: user.uid })
      .exec();

    if (!patient) {
      throw new ForbiddenException('Patient access is required.');
    }

    return patient;
  }

  private async getApprovedDoctor(
    user: DecodedIdToken,
  ): Promise<HydratedDocument<Doctor>> {
    const email =
      typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
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

  private async getAccessibleAppointment(
    user: DecodedIdToken,
    appointmentId: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentModel.findById(appointmentId).exec();

    if (!appointment) {
      throw new NotFoundException('Consultation not found.');
    }

    const isDoctor = await this.isDoctorOwner(user, appointment.doctorApplicationId);
    const isPatient = await this.isPatientOwner(user, appointment.patientId);

    if (!isDoctor && !isPatient) {
      throw new ForbiddenException(
        'You are not allowed to access this consultation.',
      );
    }

    return appointment;
  }

  private async assertDoctorAccess(
    user: DecodedIdToken,
    doctorApplicationId: string,
  ): Promise<void> {
    const doctor = await this.getApprovedDoctor(user);

    if (String(doctor._id) !== doctorApplicationId) {
      throw new ForbiddenException('Only the assigned doctor can update this consultation.');
    }
  }

  private async isDoctorOwner(
    user: DecodedIdToken,
    doctorApplicationId: string,
  ): Promise<boolean> {
    try {
      const doctor = await this.getApprovedDoctor(user);
      return String(doctor._id) === doctorApplicationId;
    } catch {
      return false;
    }
  }

  private async isPatientOwner(
    user: DecodedIdToken,
    patientId: string,
  ): Promise<boolean> {
    const patient = await this.patientModel
      .findOne({ firebaseUid: user.uid })
      .select(['_id'])
      .exec();

    return Boolean(patient && String(patient._id) === patientId);
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function validateBookableRange(startAt: Date, endAt: Date): void {
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new ConflictException('Select a valid consultation time slot.');
  }

  if (startAt.getTime() <= Date.now()) {
    throw new ConflictException(
      'This consultation time has already passed. Please choose a future slot.',
    );
  }

  if (endAt <= startAt) {
    throw new ConflictException('Consultation end time must be after the start time.');
  }

  const durationMinutes = (endAt.getTime() - startAt.getTime()) / (1000 * 60);
  if (durationMinutes !== 30) {
    throw new ConflictException('Consultation booking must use 30-minute time slots.');
  }
}
