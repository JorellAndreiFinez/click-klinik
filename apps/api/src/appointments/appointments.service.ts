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
import { CalendarService } from '../integrations/calendar/calendar.service';
import { PaymentsService } from '../integrations/payments/payments.service';
import { Patient } from '../patients/schemas/patient.schema';
import { ScheduleSlot } from '../schedules/schemas/schedule.schema';
import { Doctor } from '../doctors/schemas/doctor.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RequestRefundDto } from './dto/request-refund.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import {
  resolveConsultationAddOns,
  resolveConsultationOption,
} from './consultation-catalog';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from './schemas/appointment.schema';
import { Payout } from './schemas/payout.schema';

const PLATFORM_COMMISSION_RATE = 0.15;
const PAY_NOW_PAYMENT_WINDOW_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(ScheduleSlot.name)
    private readonly scheduleSlotModel: Model<ScheduleSlot>,
    @InjectModel(Payout.name)
    private readonly payoutModel: Model<Payout>,
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
    const revenue = calculateConsultationRevenue(totalFeePhp);
    const paymentPlan = dto.paymentPlan ?? 'pay_now';

    const selectedStartAt = new Date(dto.scheduledStartAt);
    const selectedEndAt = new Date(dto.scheduledEndAt);
    const onsetDate = new Date(dto.triage.onsetDate);
    validateBookableRange(selectedStartAt, selectedEndAt);
    if (Number.isNaN(onsetDate.getTime())) {
      throw new ConflictException('Select a valid symptom onset date.');
    }

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
        provider: 'xendit',
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

      const createdAppointment = await this.appointmentModel.create({
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
        triage: {
          consultMethod: dto.triage.consultMethod,
          chiefComplaint: dto.triage.chiefComplaint.trim(),
          detailedSymptoms: dto.triage.detailedSymptoms.trim(),
          onsetDate,
          medications: normalizeTextList(dto.triage.medications),
          allergies: normalizeTextList(dto.triage.allergies),
          healthProblems: normalizeTextList(dto.triage.healthProblems),
          smokes: dto.triage.smokes,
          drinksAlcohol: dto.triage.drinksAlcohol,
          insurancePartnersConsent: dto.triage.insurancePartnersConsent,
          laboratoryPartnersConsent: dto.triage.laboratoryPartnersConsent,
          pharmacyPartnersConsent: dto.triage.pharmacyPartnersConsent,
          emergencyDisclosureConsent: dto.triage.emergencyDisclosureConsent,
        },
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
        paymentProvider: 'xendit',
        paymentPlan,
        paymentStatus: paymentPlan === 'pay_now' ? payment.paymentStatus : 'unpaid',
        paymentReferenceId: payment.referenceId,
        paymentProviderPaymentId: payment.providerPaymentId,
        paymentCheckoutUrl: payment.checkoutUrl,
        paymentDueAt:
          paymentPlan === 'pay_now'
            ? new Date(Date.now() + PAY_NOW_PAYMENT_WINDOW_MS)
            : undefined,
        platformCommissionRate: revenue.platformCommissionRate,
        platformCommissionPhp: revenue.platformCommissionPhp,
        doctorPayoutPhp: revenue.doctorPayoutPhp,
        doctorPayoutStatus:
          paymentPlan === 'pay_now' && payment.paymentStatus === 'paid'
            ? 'available'
            : 'pending_payment',
      });

      const payout = await this.createOrUpdatePayout(createdAppointment);

      const appointmentWithPayout = await this.appointmentModel
        .findByIdAndUpdate(
          createdAppointment._id,
          { $set: { payoutId: getDocumentId(payout) } },
          { new: true },
        )
        .exec();

      if (!appointmentWithPayout) {
        throw new NotFoundException('Consultation not found.');
      }

      return appointmentWithPayout;
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
    await this.expireOverduePayNowBookings({ patientId: String(patient._id) });

    const appointments = await this.appointmentModel
      .find({ patientId: String(patient._id) })
      .sort({ scheduledStartAt: 1 })
      .exec();

    return this.syncPendingPaymentStatuses(appointments);
  }

  async refreshPaymentStatus(
    user: DecodedIdToken,
    id: string,
  ): Promise<Appointment> {
    const appointment = await this.getAccessibleAppointment(user, id);
    const accessibleByPatient = await this.isPatientOwner(user, appointment.patientId);
    const accessibleByDoctor = await this.isDoctorOwner(
      user,
      appointment.doctorApplicationId,
    );

    if (!accessibleByPatient && !accessibleByDoctor) {
      throw new ForbiddenException('You do not have access to this payment.');
    }

    if (appointment.paymentStatus === 'paid') {
      return appointment;
    }

    const verification = await this.paymentsService.verifyCheckout({
      provider: appointment.paymentProvider,
      providerPaymentId: appointment.paymentProviderPaymentId,
      referenceId: appointment.paymentReferenceId,
    });

    if (verification.paymentStatus === 'paid') {
      return this.markAppointmentAsPaid(appointment);
    }

    return appointment;
  }

  async syncXenditPayment(input: {
    invoiceId?: string;
    externalId?: string;
    status?: string;
  }): Promise<Appointment | null> {
    const isPaid = isPaidPaymentStatus(input.status);

    if (!isPaid || (!input.invoiceId && !input.externalId)) {
      return null;
    }

    const appointment = await this.appointmentModel
      .findOne({
        paymentProvider: 'xendit',
        $or: [
          ...(input.invoiceId
            ? [{ paymentProviderPaymentId: input.invoiceId }]
            : []),
          ...(input.externalId
            ? [{ paymentReferenceId: input.externalId }]
            : []),
        ],
      })
      .exec();

    if (!appointment) {
      return null;
    }

    return this.markAppointmentAsPaid(appointment);
  }

  async refreshPaymentStatusByReference(
    user: DecodedIdToken,
    referenceId: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findOne({
        paymentReferenceId: referenceId,
      })
      .exec();

    if (!appointment) {
      throw new NotFoundException('Consultation payment reference not found.');
    }

    const accessibleByPatient = await this.isPatientOwner(user, appointment.patientId);
    const accessibleByDoctor = await this.isDoctorOwner(
      user,
      appointment.doctorApplicationId,
    );

    if (!accessibleByPatient && !accessibleByDoctor) {
      throw new ForbiddenException('You do not have access to this payment.');
    }

    const verification = await this.paymentsService.verifyCheckout({
      provider: appointment.paymentProvider,
      providerPaymentId: appointment.paymentProviderPaymentId,
      referenceId: appointment.paymentReferenceId,
    });

    if (verification.paymentStatus === 'paid') {
      return this.markAppointmentAsPaid(appointment);
    }

    return appointment;
  }

  async listDoctorAppointments(user: DecodedIdToken): Promise<Appointment[]> {
    const doctor = await this.getApprovedDoctor(user);
    await this.expireOverduePayNowBookings({
      doctorApplicationId: String(doctor._id),
    });

    const appointments = await this.appointmentModel
      .find({ doctorApplicationId: String(doctor._id) })
      .sort({ scheduledStartAt: 1 })
      .exec();

    return this.syncPendingPaymentStatuses(appointments);
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

      if (appointment.paymentStatus === 'paid') {
        throw new BadRequestException(
          'This consultation is already paid. Please request a refund instead.',
        );
      }

      await this.releaseBookedSlot(appointment, 'Returned to availability after cancellation');
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

    if (
      appointment.paymentPlan === 'pay_now' &&
      appointment.paymentStatus !== 'paid'
    ) {
      throw new ForbiddenException(
        'Payment is required before joining this consultation.',
      );
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

  async requestRefundAndCancel(
    user: DecodedIdToken,
    id: string,
    dto: RequestRefundDto,
  ): Promise<Appointment> {
    const appointment = await this.getAccessibleAppointment(user, id);
    const isPatient = await this.isPatientOwner(user, appointment.patientId);

    if (!isPatient) {
      throw new ForbiddenException('Only the patient can request a refund.');
    }

    if (appointment.status === 'cancelled') {
      return appointment;
    }

    if (appointment.paymentStatus !== 'paid') {
      await this.releaseBookedSlot(appointment, 'Returned to availability after cancellation');
      return this.updateCancelledAppointment(appointment, {
        refundStatus: 'none',
        refundReason: dto.reason,
      });
    }

    assertRefundWindowOpen(appointment);

    const now = new Date();
    await this.releaseBookedSlot(appointment, 'Returned to availability after refund request');
    const refund = await this.paymentsService.refundXenditInvoice({
      providerPaymentId: appointment.paymentProviderPaymentId ?? '',
      referenceId: appointment.paymentReferenceId ?? getDocumentId(appointment),
      amountPhp: appointment.totalFeePhp,
      reason: dto.reason,
    });

    const updated = await this.appointmentModel
      .findByIdAndUpdate(
        getDocumentId(appointment),
        {
          $set: {
            status: 'cancelled',
            paymentStatus:
              refund.refundStatus === 'refunded'
                ? 'refunded'
                : appointment.paymentStatus,
            refundStatus: refund.refundStatus,
            refundRequestedAt: now,
            refundReason: dto.reason,
            refundProviderRefundId: refund.providerRefundId,
            refundProviderStatus: refund.providerStatus,
          },
        },
        { new: true },
      )
      .exec();

    await this.payoutModel
      .findOneAndUpdate(
        { appointmentId: getDocumentId(appointment) },
        {
          $set: {
            status:
              refund.refundStatus === 'refunded'
                ? 'refunded'
                : 'refund_requested',
            refundRequestedAt: now,
            refundReason: dto.reason,
          },
        },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Consultation not found.');
    }

    return updated;
  }

  private async markAppointmentAsPaid(
    appointment: Appointment,
  ): Promise<Appointment> {
    const revenue = calculateConsultationRevenue(appointment.totalFeePhp);
    const now = new Date();
    const updated = await this.appointmentModel
      .findByIdAndUpdate(
        getDocumentId(appointment),
        {
          $set: {
            paymentStatus: 'paid',
            doctorPayoutStatus: 'available',
            platformCommissionRate: revenue.platformCommissionRate,
            platformCommissionPhp: revenue.platformCommissionPhp,
            doctorPayoutPhp: revenue.doctorPayoutPhp,
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Consultation not found.');
    }

    await this.createOrUpdatePayout(updated, now);

    return updated;
  }

  private async createOrUpdatePayout(
    appointment: Appointment,
    paidAt?: Date,
  ): Promise<Payout> {
    const revenue = calculateConsultationRevenue(appointment.totalFeePhp);
    const status =
      appointment.paymentStatus === 'paid' ? 'available' : 'pending_payment';

    const payout = await this.payoutModel
      .findOneAndUpdate(
        { appointmentId: getDocumentId(appointment) },
        {
          $set: {
            appointmentId: getDocumentId(appointment),
            patientId: appointment.patientId,
            patientEmail: appointment.patientEmail,
            patientName: appointment.patientName,
            doctorApplicationId: appointment.doctorApplicationId,
            doctorEmail: appointment.doctorEmail,
            doctorName: appointment.doctorName,
            grossAmountPhp: appointment.totalFeePhp,
            platformCommissionRate: revenue.platformCommissionRate,
            platformCommissionPhp: revenue.platformCommissionPhp,
            doctorPayoutPhp: revenue.doctorPayoutPhp,
            currency: appointment.currency,
            status,
            paymentProvider: 'xendit',
            paymentReferenceId: appointment.paymentReferenceId,
            paymentProviderPaymentId: appointment.paymentProviderPaymentId,
            ...(paidAt ? { paidAt } : {}),
          },
        },
        { new: true, upsert: true },
      )
      .exec();

    if (!payout) {
      throw new NotFoundException('Payout record was not created.');
    }

    if (!appointment.payoutId || appointment.payoutId !== getDocumentId(payout)) {
      await this.appointmentModel
        .findByIdAndUpdate(getDocumentId(appointment), {
          $set: { payoutId: getDocumentId(payout) },
        })
        .exec();
    }

    return payout;
  }

  private async releaseBookedSlot(
    appointment: Appointment,
    note: string,
  ): Promise<void> {
    await this.scheduleSlotModel
      .findOneAndUpdate(
        {
          _id: appointment.scheduleSlotId,
          status: 'booked',
        },
        {
          $set: {
            status: 'available',
            note,
          },
        },
      )
      .exec();
  }

  private async updateCancelledAppointment(
    appointment: Appointment,
    extraFields: Record<string, unknown>,
  ): Promise<Appointment> {
    const updated = await this.appointmentModel
      .findByIdAndUpdate(
        getDocumentId(appointment),
        {
          $set: {
            status: 'cancelled',
            ...extraFields,
          },
        },
        { new: true },
      )
      .exec();

    await this.payoutModel
      .findOneAndUpdate(
        { appointmentId: getDocumentId(appointment) },
        { $set: { status: 'cancelled' } },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Consultation not found.');
    }

    return updated;
  }

  private async expireOverduePayNowBookings(filter: {
    patientId?: string;
    doctorApplicationId?: string;
  }): Promise<void> {
    const overdueAppointments = await this.appointmentModel
      .find({
        ...filter,
        paymentPlan: 'pay_now',
        paymentStatus: { $ne: 'paid' },
        status: { $in: ['booked', 'confirmed'] },
        paymentDueAt: { $lte: new Date() },
      })
      .exec();

    await Promise.all(
      overdueAppointments.map(async (appointment) => {
        await this.releaseBookedSlot(
          appointment,
          'Returned to availability after unpaid booking expired',
        );
        await this.updateCancelledAppointment(appointment, {
          refundStatus: 'none',
          refundReason: 'Auto-cancelled because payment was not completed within 6 hours.',
        });
      }),
    );
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

  private async syncPendingPaymentStatuses(
    appointments: AppointmentDocument[],
  ): Promise<Appointment[]> {
    const syncedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        if (appointment.paymentStatus === 'paid') {
          if (!appointment.payoutId) {
            await this.createOrUpdatePayout(appointment, new Date());
          }

          return appointment;
        }

        if (
          appointment.paymentStatus === 'refunded' ||
          (appointment.paymentStatus === 'unpaid' &&
            appointment.paymentPlan !== 'pay_after_consultation')
        ) {
          return appointment;
        }

        const verification = await this.paymentsService.verifyCheckout({
          provider: appointment.paymentProvider,
          providerPaymentId: appointment.paymentProviderPaymentId,
          referenceId: appointment.paymentReferenceId,
        });

        if (verification.paymentStatus !== 'paid') {
          return appointment;
        }

        return this.markAppointmentAsPaid(appointment);
      }),
    );

    return syncedAppointments;
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeTextList(values: string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter(Boolean);
}

function assertRefundWindowOpen(appointment: Appointment): void {
  const createdAt = getDocumentDate(appointment, 'createdAt');
  const deadline = new Date(createdAt.getTime() + PAY_NOW_PAYMENT_WINDOW_MS);

  if (Date.now() > deadline.getTime()) {
    throw new BadRequestException(
      'Refunds are only available within 6 hours after booking.',
    );
  }
}

function getDocumentDate(document: unknown, field: string): Date {
  const value =
    typeof document === 'object' && document !== null
      ? (document as Record<string, unknown>)[field]
      : undefined;
  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new NotFoundException(`${field} is missing from the appointment.`);
  }

  return date;
}

function getDocumentId(document: unknown): string {
  const candidate =
    typeof document === 'object' && document !== null
      ? (document as { _id?: unknown })._id
      : undefined;

  if (!candidate) {
    throw new NotFoundException('Mongo document id is missing.');
  }

  return String(candidate);
}

function calculateConsultationRevenue(totalFeePhp: number): {
  platformCommissionRate: number;
  platformCommissionPhp: number;
  doctorPayoutPhp: number;
} {
  const platformCommissionPhp = Math.round(
    totalFeePhp * PLATFORM_COMMISSION_RATE,
  );

  return {
    platformCommissionRate: PLATFORM_COMMISSION_RATE,
    platformCommissionPhp,
    doctorPayoutPhp: Math.max(totalFeePhp - platformCommissionPhp, 0),
  };
}

function isPaidPaymentStatus(status?: string): boolean {
  const normalized = status?.trim().toUpperCase();

  return (
    normalized === 'PAID' ||
    normalized === 'SETTLED' ||
    normalized === 'COMPLETED' ||
    normalized === 'SUCCEEDED'
  );
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
