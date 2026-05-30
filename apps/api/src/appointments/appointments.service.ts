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
import { NotificationsService } from '../integrations/notifications/notifications.service';
import { PaymentsService } from '../integrations/payments/payments.service';
import { Patient } from '../patients/schemas/patient.schema';
import { ScheduleSlot } from '../schedules/schemas/schedule.schema';
import { Doctor } from '../doctors/schemas/doctor.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RateDoctorDto } from './dto/rate-doctor.dto';
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

type DoctorPayoutSummary = {
  totals: {
    grossAmountPhp: number;
    platformCommissionPhp: number;
    doctorPayoutPhp: number;
    availablePayoutPhp: number;
    paidOutPayoutPhp: number;
    pendingPayoutPhp: number;
    refundedPhp: number;
  };
  payouts: Payout[];
};

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
    private readonly notificationsService: NotificationsService,
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

    const bookedOverlap = await this.scheduleSlotModel
      .exists({
        doctorApplicationId: String(doctor._id),
        status: 'booked',
        startAt: { $lt: selectedEndAt },
        endAt: { $gt: selectedStartAt },
      })
      .exec();

    if (bookedOverlap) {
      throw new ConflictException(
        'This 30-minute time slot was just booked by another patient. Please choose another available time.',
      );
    }

    const selectedSlotQuery = {
      doctorApplicationId: String(doctor._id),
      status: 'available' as const,
      startAt: { $lte: selectedStartAt },
      endAt: { $gte: selectedEndAt },
    };

    const slot =
      (await this.scheduleSlotModel
        .findOne({
          _id: dto.scheduleSlotId,
          ...selectedSlotQuery,
        })
        .exec()) ??
      (await this.scheduleSlotModel
        .findOne(selectedSlotQuery)
        .sort({ startAt: 1, endAt: 1 })
        .exec());

    if (!slot) {
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
        .findOneAndUpdate(
          {
            _id: slot._id,
            doctorApplicationId: String(doctor._id),
            status: 'available',
            startAt: slot.startAt,
            endAt: slot.endAt,
          },
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
      const consultMethod = dto.triage.consultMethod;
      const calendarEvent = await this.calendarService.createConsultationEvent({
        doctorEmail: doctor.professionalEmail,
        doctorName,
        patientEmail: patient.email,
        patientName,
        startsAt: selectedStartAt,
        endsAt: selectedEndAt,
        summary: `Click Klinik ${formatConsultMethod(consultMethod)}: ${patientName} with ${doctorName}`,
        description: buildConsultationCalendarDescription({
          consultMethod,
          doctor,
          patient,
        }),
        createMeet: consultMethod === 'google_meet',
      });

      const createdAppointment = await this.appointmentModel.create({
        patientId: String(patient._id),
        patientEmail: patient.email,
        patientName,
        patientMobileNumber: patient.mobileNumber,
        patientLocation: buildLocationLabel(patient),
        patientRegionName: patient.regionName,
        patientProvinceName: patient.provinceName,
        patientCityMunicipalityName: patient.cityMunicipalityName,
        patientBarangayName: patient.barangayName,
        patientLatitude: patient.latitude,
        patientLongitude: patient.longitude,
        doctorApplicationId: String(doctor._id),
        doctorEmail: doctor.professionalEmail,
        doctorName,
        specializationName: doctor.specializationName,
        doctorLocation: buildLocationLabel(doctor),
        doctorClinicOrHospital: doctor.clinicOrHospital,
        doctorMobileNumber: doctor.mobileNumber,
        doctorRegionName: doctor.regionName,
        doctorProvinceName: doctor.provinceName,
        doctorCityMunicipalityName: doctor.cityMunicipalityName,
        doctorBarangayName: doctor.barangayName,
        doctorLatitude: doctor.latitude,
        doctorLongitude: doctor.longitude,
        consultationCode: consultation.code,
        consultationLabel: consultation.label,
        triage: {
          consultMethod,
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

      await Promise.all([
        this.notificationsService.createForDoctor(String(doctor._id), {
          type: 'appointment_booked',
          title: 'New patient booking',
          message: `${patientName} booked ${consultation.label} for ${formatDateTime(selectedStartAt)}.`,
          href: '/doctor/schedule/calendar',
        }),
        this.notificationsService.createForPatient(String(patient._id), {
          type: 'appointment_booked',
          title: 'Consultation booked',
          message: `Your appointment with ${doctorName} is scheduled for ${formatDateTime(selectedStartAt)}.`,
          href: '/patient/appointments',
        }),
      ]);

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

    return this.hydrateAppointmentLocationSnapshots(
      await this.syncPendingPaymentStatuses(appointments),
    );
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

    return this.hydrateAppointmentLocationSnapshots(
      await this.syncPendingPaymentStatuses(appointments),
    );
  }

  async listDoctorPayouts(user: DecodedIdToken): Promise<DoctorPayoutSummary> {
    const doctor = await this.getApprovedDoctor(user);
    const doctorApplicationId = String(doctor._id);

    const appointments = await this.appointmentModel
      .find({ doctorApplicationId })
      .sort({ scheduledStartAt: 1 })
      .exec();

    await this.syncPendingPaymentStatuses(appointments);

    const payouts = await this.payoutModel
      .find({ doctorApplicationId })
      .sort({ createdAt: -1 })
      .exec();

    const totals = payouts.reduce(
      (summary, payout) => {
        if (payout.status === 'cancelled') {
          return summary;
        }

        if (payout.status === 'refunded' || payout.status === 'refund_requested') {
          summary.refundedPhp += payout.grossAmountPhp;
          return summary;
        }

        if (payout.status === 'pending_payment') {
          summary.pendingPayoutPhp += payout.doctorPayoutPhp;
          return summary;
        }

        summary.grossAmountPhp += payout.grossAmountPhp;
        summary.platformCommissionPhp += payout.platformCommissionPhp;
        summary.doctorPayoutPhp += payout.doctorPayoutPhp;

        if (payout.status === 'available') {
          summary.availablePayoutPhp += payout.doctorPayoutPhp;
        }

        if (payout.status === 'paid_out') {
          summary.paidOutPayoutPhp += payout.doctorPayoutPhp;
        }

        return summary;
      },
      {
        availablePayoutPhp: 0,
        doctorPayoutPhp: 0,
        grossAmountPhp: 0,
        paidOutPayoutPhp: 0,
        pendingPayoutPhp: 0,
        platformCommissionPhp: 0,
        refundedPhp: 0,
      },
    );

    return { payouts, totals };
  }

  async claimDoctorPayouts(user: DecodedIdToken): Promise<DoctorPayoutSummary> {
    const doctor = await this.getApprovedDoctor(user);
    const doctorApplicationId = String(doctor._id);
    const paidAt = new Date();

    const availablePayouts = await this.payoutModel
      .find({ doctorApplicationId, status: 'available' })
      .exec();

    if (availablePayouts.length === 0) {
      return this.listDoctorPayouts(user);
    }

    const payoutIds = availablePayouts.map((payout) => getDocumentId(payout));
    const appointmentIds = availablePayouts.map((payout) => payout.appointmentId);
    const totalPayout = availablePayouts.reduce(
      (sum, payout) => sum + payout.doctorPayoutPhp,
      0,
    );
    const payoutResult = this.paymentsService.simulateXenditPayout({
      amountPhp: totalPayout,
      doctorEmail: doctor.professionalEmail,
      doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
    });

    await Promise.all([
      this.payoutModel
        .updateMany(
          { _id: { $in: payoutIds } },
          {
            $set: {
              status: 'paid_out',
              paidAt,
              payoutProviderPayoutId: payoutResult.providerPayoutId,
              payoutProviderStatus: payoutResult.providerStatus,
            },
          },
        )
        .exec(),
      this.appointmentModel
        .updateMany(
          { _id: { $in: appointmentIds } },
          { $set: { doctorPayoutStatus: 'paid_out' } },
        )
        .exec(),
    ]);

    await this.notificationsService.createForDoctor(doctorApplicationId, {
      type: 'payout',
      title: 'Payout claimed',
      message: `${formatPhp(totalPayout)} was marked as paid out in Xendit test flow.`,
      href: '/doctor/dashboard',
    });

    return this.listDoctorPayouts(user);
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
            ...(nextStatus === 'completed'
              ? {
                  patientHasRatedDoctor: appointment.patientHasRatedDoctor ?? false,
                }
              : {}),
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Consultation not found.');
    }

    if (nextStatus === 'cancelled') {
      await Promise.all([
        this.notificationsService.createForPatient(appointment.patientId, {
          type: 'appointment_status',
          title: 'Consultation cancelled',
          message: 'Your consultation was cancelled and the schedule was released.',
          href: '/patient/appointments',
        }),
        this.notificationsService.createForDoctor(appointment.doctorApplicationId, {
          type: 'appointment_status',
          title: 'Patient consultation cancelled',
          message: `${appointment.patientName} cancelled the ${formatDateTime(appointment.scheduledStartAt)} consultation.`,
          href: '/doctor/schedule/calendar',
        }),
      ]);
      return updated;
    }

    await this.notificationsService.createForPatient(appointment.patientId, {
      type: 'appointment_status',
      title: 'Consultation status updated',
      message: `${appointment.doctorName} marked your consultation as ${nextStatus.replace(/_/g, ' ')}.`,
      href: '/patient/appointments',
    });

    return updated;
  }

  async rateDoctor(
    user: DecodedIdToken,
    id: string,
    dto: RateDoctorDto,
  ): Promise<Appointment> {
    const appointment = await this.getAccessibleAppointment(user, id);
    const isPatient = await this.isPatientOwner(user, appointment.patientId);

    if (!isPatient) {
      throw new ForbiddenException('Only the patient can rate this doctor.');
    }

    if (appointment.status !== 'completed') {
      throw new BadRequestException(
        'You can rate the doctor after the consultation is completed.',
      );
    }

    if (appointment.patientHasRatedDoctor) {
      throw new BadRequestException('This consultation has already been rated.');
    }

    const updated = await this.appointmentModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            patientHasRatedDoctor: true,
            doctorRatingStars: dto.stars,
            doctorRatingComment: dto.comment?.trim(),
            doctorRatedAt: new Date(),
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Consultation not found.');
    }

    await Promise.all([
      this.notificationsService.createForPatient(updated.patientId, {
        type: 'refund',
        title: 'Refund processed',
        message: `Your ${updated.consultationLabel} was cancelled and the refund was marked as ${updated.refundStatus}.`,
        href: '/patient/appointments',
      }),
      this.notificationsService.createForDoctor(updated.doctorApplicationId, {
        type: 'refund',
        title: 'Consultation refunded',
        message: `${updated.patientName} cancelled and refunded ${formatPhp(updated.totalFeePhp)}.`,
        href: '/doctor/schedule/calendar',
      }),
    ]);

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

    await Promise.all([
      this.notificationsService.createForPatient(updated.patientId, {
        type: 'payment',
        title: 'Payment confirmed',
        message: `Your ${updated.consultationLabel} payment is now marked as paid.`,
        href: '/patient/appointments',
      }),
      this.notificationsService.createForDoctor(updated.doctorApplicationId, {
        type: 'payment',
        title: 'Patient payment received',
        message: `${updated.patientName} paid ${formatPhp(updated.totalFeePhp)}. Doctor payout is now available.`,
        href: '/doctor/dashboard',
      }),
    ]);

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

    await Promise.all([
      this.notificationsService.createForPatient(appointment.patientId, {
        type: 'appointment_status',
        title: 'Consultation cancelled',
        message: 'Your consultation was cancelled and the schedule was released.',
        href: '/patient/appointments',
      }),
      this.notificationsService.createForDoctor(appointment.doctorApplicationId, {
        type: 'appointment_status',
        title: 'Patient consultation cancelled',
        message: `${appointment.patientName} cancelled the ${formatDateTime(appointment.scheduledStartAt)} consultation.`,
        href: '/doctor/schedule/calendar',
      }),
    ]);

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
    const email =
      typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    const patient = await this.patientModel
      .findOne({ $or: [{ firebaseUid: user.uid }, { email }] })
      .exec();

    if (!patient) {
      throw new ForbiddenException('Patient access is required.');
    }

    if (patient.firebaseUid !== user.uid) {
      await this.patientModel
        .findByIdAndUpdate(patient._id, { $set: { firebaseUid: user.uid } })
        .exec();
      patient.firebaseUid = user.uid;
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
    const email =
      typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    const patient = await this.patientModel
      .findOne({ $or: [{ firebaseUid: user.uid }, { email }] })
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

  private async hydrateAppointmentLocationSnapshots(
    appointments: Appointment[],
  ): Promise<Appointment[]> {
    return Promise.all(
      appointments.map(async (appointment) => {
        const needsPatientLocation =
          !isFiniteNumber(appointment.patientLatitude) ||
          !isFiniteNumber(appointment.patientLongitude) ||
          !appointment.patientLocation;
        const needsDoctorLocation =
          !isFiniteNumber(appointment.doctorLatitude) ||
          !isFiniteNumber(appointment.doctorLongitude) ||
          !appointment.doctorLocation;

        if (!needsPatientLocation && !needsDoctorLocation) {
          return appointment;
        }

        const [patient, doctor] = await Promise.all([
          needsPatientLocation
            ? this.patientModel.findById(appointment.patientId).exec()
            : Promise.resolve(null),
          needsDoctorLocation
            ? this.doctorModel.findById(appointment.doctorApplicationId).exec()
            : Promise.resolve(null),
        ]);
        const update: Partial<Appointment> = {};

        if (patient) {
          update.patientLocation = buildLocationLabel(patient);
          update.patientRegionName = patient.regionName;
          update.patientProvinceName = patient.provinceName;
          update.patientCityMunicipalityName = patient.cityMunicipalityName;
          update.patientBarangayName = patient.barangayName;
          update.patientLatitude = patient.latitude;
          update.patientLongitude = patient.longitude;
        }

        if (doctor) {
          update.doctorLocation = buildLocationLabel(doctor);
          update.doctorClinicOrHospital = doctor.clinicOrHospital;
          update.doctorRegionName = doctor.regionName;
          update.doctorProvinceName = doctor.provinceName;
          update.doctorCityMunicipalityName = doctor.cityMunicipalityName;
          update.doctorBarangayName = doctor.barangayName;
          update.doctorLatitude = doctor.latitude;
          update.doctorLongitude = doctor.longitude;
        }

        if (Object.keys(update).length === 0) {
          return appointment;
        }

        const updated = await this.appointmentModel
          .findByIdAndUpdate(getDocumentId(appointment), { $set: update }, { new: true })
          .exec();

        return updated ?? appointment;
      }),
    );
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

function formatConsultMethod(method: Appointment['triage']['consultMethod']): string {
  if (method === 'physical_visit') {
    return 'physical clinic visit';
  }

  if (method === 'cellular') {
    return 'cellular phone consultation';
  }

  return 'Google Meet teleconsult';
}

function buildConsultationCalendarDescription(input: {
  consultMethod: Appointment['triage']['consultMethod'];
  doctor: Pick<
    Doctor,
    | 'clinicOrHospital'
    | 'mobileNumber'
    | 'location'
    | 'barangayName'
    | 'cityMunicipalityName'
    | 'provinceName'
    | 'regionName'
    | 'latitude'
    | 'longitude'
  >;
  patient: Pick<
    Patient,
    | 'mobileNumber'
    | 'barangayName'
    | 'cityMunicipalityName'
    | 'provinceName'
    | 'regionName'
    | 'latitude'
    | 'longitude'
  >;
}): string {
  const lines = [
    'Click Klinik consultation booking.',
    'This tool provides guidance only and does not replace professional medical advice or emergency care.',
    '',
    `Consult method: ${formatConsultMethod(input.consultMethod)}`,
  ];

  if (input.consultMethod === 'physical_visit') {
    lines.push(
      `Clinic/Hospital: ${input.doctor.clinicOrHospital ?? 'Doctor clinic location'}`,
      `Clinic address: ${buildLocationLabel(input.doctor) || 'See doctor profile'}`,
      `Patient starting area: ${buildLocationLabel(input.patient) || 'Saved patient location'}`,
      `Clinic map pin: ${formatGeoPin(input.doctor) || 'Not provided'}`,
      `Patient map pin: ${formatGeoPin(input.patient) || 'Not provided'}`,
    );
  }

  if (input.consultMethod === 'cellular') {
    lines.push(
      `Patient mobile: ${input.patient.mobileNumber}`,
      `Doctor contact number: ${input.doctor.mobileNumber}`,
      'The doctor and patient should keep their phones reachable at the scheduled time.',
    );
  }

  return lines.join('\n');
}

function formatGeoPin(profile: { latitude?: number; longitude?: number }): string {
  if (
    typeof profile.latitude !== 'number' ||
    typeof profile.longitude !== 'number'
  ) {
    return '';
  }

  return `${profile.latitude}, ${profile.longitude}`;
}

function buildLocationLabel(
  profile: {
    barangayName?: string;
    cityMunicipalityName?: string;
    provinceName?: string;
    regionName?: string;
    location?: string;
  },
): string {
  return [
    profile.location,
    profile.barangayName,
    profile.cityMunicipalityName,
    profile.provinceName,
    profile.regionName,
  ]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(', ');
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

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(value);
}

function formatPhp(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
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
