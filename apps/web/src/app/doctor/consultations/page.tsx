"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import {
  getMyDoctorAppointments,
  joinAppointment,
  updateAppointmentStatus,
  type Appointment,
} from "@/lib/appointments-api";
import { formatPhp } from "@/features/appointments/booking-catalog";

export default function DoctorConsultationsPage() {
  const { user, doctor } = useDoctorWorkspace();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    void getMyDoctorAppointments(user)
      .then((result) => {
        setAppointments(result);
        setLoading(false);
      })
      .catch((error: unknown) => {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to load doctor consultations.",
        );
        setLoading(false);
      });
  }, [user]);

  async function handleJoin(appointmentId: string) {
    if (!user) {
      return;
    }

    setActionError(null);

    try {
      const result = await joinAppointment(user, appointmentId);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === appointmentId ? result.appointment : appointment,
        ),
      );

      if (result.meetLink) {
        window.open(result.meetLink, "_blank", "noopener,noreferrer");
      }
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to join consultation.",
      );
    }
  }

  async function handleComplete(appointmentId: string) {
    if (!user) {
      return;
    }

    setActionError(null);

    try {
      const updated = await updateAppointmentStatus(user, appointmentId, "completed");
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === appointmentId ? updated : appointment,
        ),
      );
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update consultation.",
      );
    }
  }

  const activeAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status !== "completed" && appointment.status !== "cancelled",
      ),
    [appointments],
  );
  const revenue = useMemo(() => getDoctorRevenue(appointments), [appointments]);

  if (!doctor) {
    return null;
  }

  return (
    <div className="min-h-full bg-[#f7f2e8]">
      <section className="border-b border-[#12324d]/10 bg-white">
        <div className="grid gap-6 px-6 py-7 sm:px-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Active consultations
            </p>
            <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
              Doctor booking queue
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review booked teleconsults, open Google Meet, and move sessions through their active status.
            </p>
          </div>
          <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] p-5">
            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
              Overview
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SummaryBox label="Upcoming" value={String(activeAppointments.length)} />
              <SummaryBox label="Earnings" value={formatPhp(revenue.availablePayoutPhp)} />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-6 sm:px-8">
        {actionError ? (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
            {actionError}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-[#12324d]/10 bg-white px-5 py-8 text-sm text-muted-foreground">
            Loading consultations...
          </div>
        ) : null}

        {!loading ? (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <article
                key={appointment._id}
                className="rounded-2xl border border-[#12324d]/10 bg-white px-5 py-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold">{appointment.patientName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.specializationName}
                    </p>
                  </div>
                  <Badge variant="secondary">{formatStatus(appointment.status)}</Badge>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <InfoTile
                    label="Date"
                    value={formatAppointmentDate(appointment.scheduledStartAt)}
                  />
                  <InfoTile
                    label="Time"
                    value={formatAppointmentTimeRange(
                      appointment.scheduledStartAt,
                      appointment.scheduledEndAt,
                    )}
                  />
                  <InfoTile label="Patient email" value={appointment.patientEmail} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <InfoTile
                    label="Consultation"
                    value={getConsultationLabel(appointment)}
                  />
                  <InfoTile
                    label="Fee"
                    value={formatAppointmentFee(appointment.totalFeePhp)}
                  />
                  <InfoTile label="Payment" value={formatPaymentStatus(appointment.paymentStatus)} />
                  <InfoTile
                    label="Doctor payout"
                    value={formatDoctorPayout(appointment)}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    className="h-11 rounded-xl"
                    onClick={() => void handleJoin(appointment._id)}
                  >
                    <Video className="size-4" />
                    Join consultation
                  </Button>
                  {appointment.status !== "completed" ? (
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl"
                      onClick={() => void handleComplete(appointment._id)}
                    >
                      Mark completed
                    </Button>
                  ) : null}
                  {appointment.googleCalendarHtmlLink ? (
                    <Button asChild variant="outline" className="h-11 rounded-xl">
                      <Link href={appointment.googleCalendarHtmlLink} target="_blank">
                        <ExternalLink className="size-4" />
                        Calendar invite
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}

            {appointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#12324d]/12 bg-white px-5 py-8 text-center text-sm text-muted-foreground">
                No consultation bookings yet.
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-3">
      <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatAppointmentTimeRange(startAt: string, endAt: string) {
  return `${formatTime(startAt)} - ${formatTime(endAt)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(status: Appointment["status"]) {
  return status.replace(/_/g, " ");
}

function formatPaymentStatus(status?: Appointment["paymentStatus"]) {
  if (!status) {
    return "not set";
  }

  return status.replace(/_/g, " ");
}

function getConsultationLabel(appointment: Appointment) {
  return appointment.consultationLabel?.trim() || "Teleconsultation";
}

function formatAppointmentFee(totalFeePhp?: number) {
  return typeof totalFeePhp === "number" && Number.isFinite(totalFeePhp)
    ? formatPhp(totalFeePhp)
    : "Not set";
}

function formatDoctorPayout(appointment: Appointment) {
  const commission = getPlatformCommissionPhp(appointment);
  const payout = getDoctorPayoutPhp(appointment);
  const status =
    appointment.paymentStatus === "paid"
      ? "available"
      : appointment.status === "cancelled"
        ? "cancelled"
        : "pending";

  return `${formatPhp(payout)} ${status} • ${formatPhp(commission)} fee`;
}

function getDoctorRevenue(appointments: Appointment[]) {
  return appointments.reduce(
    (summary, appointment) => {
      if (appointment.paymentStatus === "paid") {
        summary.availablePayoutPhp += getDoctorPayoutPhp(appointment);
      }

      return summary;
    },
    { availablePayoutPhp: 0 },
  );
}

function getDoctorPayoutPhp(appointment: Appointment) {
  if (typeof appointment.doctorPayoutPhp === "number") {
    return appointment.doctorPayoutPhp;
  }

  return Math.max((appointment.totalFeePhp ?? 0) - getPlatformCommissionPhp(appointment), 0);
}

function getPlatformCommissionPhp(appointment: Appointment) {
  if (typeof appointment.platformCommissionPhp === "number") {
    return appointment.platformCommissionPhp;
  }

  return Math.round((appointment.totalFeePhp ?? 0) * 0.15);
}
