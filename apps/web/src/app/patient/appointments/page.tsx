"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  ExternalLink,
  HeartPulse,
  Video,
} from "lucide-react";

import { PatientWorkspaceShell } from "../patient-workspace-shell";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getMyPatientAppointments,
  joinAppointment,
  updateAppointmentStatus,
  type Appointment,
} from "@/lib/appointments-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { getMyPatientProfile, type PatientProfile } from "@/lib/patient-api";
import { formatPhp } from "@/features/appointments/booking-catalog";

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const configured = isFirebaseConfigured();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(
    configured ? "Loading your appointments..." : "Authentication is not configured yet.",
  );
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      if (!nextUser) {
        router.replace("/auth");
        return;
      }

      setUser(nextUser);

      void Promise.all([
        getMyPatientProfile(nextUser),
        getMyPatientAppointments(nextUser),
      ])
        .then(([nextProfile, nextAppointments]) => {
          setProfile(nextProfile);
          setAppointments(nextAppointments);
          setLoading(false);
        })
        .catch((error: unknown) => {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load your patient appointments.",
          );
          setLoading(false);
        });
    });
  }, [configured, router]);

  async function handleSignOut() {
    if (!configured) {
      router.replace("/auth");
      return;
    }

    await signOut(getFirebaseAuth());
    router.replace("/auth");
  }

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
        error instanceof Error ? error.message : "Unable to join the consultation.",
      );
    }
  }

  async function handleCancel(appointmentId: string) {
    if (!user) {
      return;
    }

    setActionError(null);

    try {
      const updated = await updateAppointmentStatus(user, appointmentId, "cancelled");
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === appointmentId ? updated : appointment,
        ),
      );
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to cancel the consultation.",
      );
    }
  }

  const upcomingAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status !== "completed" && appointment.status !== "cancelled",
      ),
    [appointments],
  );

  if (!profile) {
    return (
      <main className="clinic-grid flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
          <HeartPulse className="mx-auto size-10 text-primary" />
          <p className="mt-5 text-sm text-muted-foreground">{message}</p>
        </div>
      </main>
    );
  }

  return (
    <PatientWorkspaceShell
      patientName={`${profile.firstName} ${profile.lastName}`}
      onSignOut={handleSignOut}
    >
      <div className="min-h-full bg-[linear-gradient(180deg,#f7f2e8_0%,#f4ecde_100%)]">
        <section className="border-b border-[#12324d]/10 bg-[linear-gradient(135deg,#0d3553_0%,#123f63_58%,#15496f_100%)] text-primary-foreground">
          <div className="grid gap-6 px-6 py-7 sm:px-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-secondary uppercase">
                Consultations
              </p>
              <h1 className="mt-3 text-3xl font-bold">Your booked appointments</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-primary-foreground/68">
                Review your active teleconsults, open the meeting link, and stay ready for your session.
              </p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/[0.06] p-5">
              <p className="text-xs font-bold tracking-[0.18em] text-secondary uppercase">
                Quick count
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <StatCard label="Upcoming" value={String(upcomingAppointments.length)} />
                <StatCard label="All booked" value={String(appointments.length)} />
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
              Loading your appointments...
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
                      <p className="text-lg font-bold">{appointment.doctorName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {appointment.specializationName}
                        {appointment.doctorLocation
                          ? ` • ${appointment.doctorLocation}`
                          : ""}
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
                    <InfoTile
                      label="Calendar"
                      value={appointment.googleCalendarEventId ? "Created" : "Pending"}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <InfoTile
                      label="Consultation"
                      value={getConsultationLabel(appointment)}
                    />
                    <InfoTile
                      label="Total fee"
                      value={formatAppointmentFee(appointment.totalFeePhp)}
                    />
                    <InfoTile label="Payment" value={formatPaymentStatus(appointment.paymentStatus)} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {canJoinAppointment(appointment) ? (
                      <Button
                        className="h-11 rounded-xl"
                        onClick={() => void handleJoin(appointment._id)}
                      >
                        <Video className="size-4" />
                        Join consultation
                      </Button>
                    ) : null}
                    {canCancelAppointment(appointment) ? (
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl"
                        onClick={() => void handleCancel(appointment._id)}
                      >
                        Cancel consultation
                      </Button>
                    ) : null}
                    {appointment.paymentCheckoutUrl ? (
                      <Button asChild variant="outline" className="h-11 rounded-xl">
                        <Link href={appointment.paymentCheckoutUrl} target="_blank">
                          Complete test payment
                        </Link>
                      </Button>
                    ) : null}
                    {appointment.googleCalendarHtmlLink ? (
                      <Button asChild variant="outline" className="h-11 rounded-xl">
                        <Link href={appointment.googleCalendarHtmlLink} target="_blank">
                          <ExternalLink className="size-4" />
                          View calendar invite
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}

              {appointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#12324d]/12 bg-white px-5 py-8 text-center text-sm text-muted-foreground">
                  No consultations yet. Start by browsing doctors and booking an available slot.
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </PatientWorkspaceShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/[0.04] px-4 py-3">
      <p className="text-[11px] font-bold tracking-[0.16em] text-secondary uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
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

function canJoinAppointment(appointment: Appointment) {
  return (
    appointment.status !== "cancelled" &&
    appointment.status !== "completed"
  );
}

function canCancelAppointment(appointment: Appointment) {
  return (
    appointment.status === "booked" || appointment.status === "confirmed"
  );
}
