"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ClipboardCheck,
  MapPin,
  MonitorSmartphone,
  Phone,
  ShieldAlert,
  UserRound,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import {
  getMyDoctorAppointments,
  joinAppointment,
  updateAppointmentStatus,
  type Appointment,
} from "@/lib/appointments-api";

const sessionChecklist = [
  "Review previous consultation notes before joining",
  "Confirm patient identity and scheduled time slot",
  "Escalate to emergency care if symptoms require immediate in-person help",
  "Complete notes, prescriptions, and status update after the call",
] as const;

export default function DoctorSessionPage() {
  const { user } = useDoctorWorkspace();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    void getMyDoctorAppointments(user)
      .then((result) => setAppointments(result))
      .catch((error: unknown) => {
        setActionError(
          error instanceof Error ? error.message : "Unable to load consultation session.",
        );
      });
  }, [user]);

  const activeAppointment = useMemo(
    () =>
      appointments.find(
        (appointment) =>
          appointment.status !== "completed" && appointment.status !== "cancelled",
      ) ?? null,
    [appointments],
  );

  async function handleJoin() {
    if (!user || !activeAppointment) {
      return;
    }

    setActionError(null);

    try {
      const result = await joinAppointment(user, activeAppointment._id);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === activeAppointment._id ? result.appointment : appointment,
        ),
      );

      if (result.meetLink) {
        window.open(result.meetLink, "_blank", "noopener,noreferrer");
      }
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to launch consultation.",
      );
    }
  }

  async function handleComplete() {
    if (!user || !activeAppointment) {
      return;
    }

    setActionError(null);

    try {
      const updated = await updateAppointmentStatus(
        user,
        activeAppointment._id,
        "completed",
      );
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === activeAppointment._id ? updated : appointment,
        ),
      );
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to complete consultation.",
      );
    }
  }

  return (
    <div className="min-h-full bg-[#f7f2e8]">
      <section className="border-b border-[#12324d]/10 bg-white px-6 py-6 sm:px-8">
        <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
          Consultation session
        </p>
        <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
          {activeAppointment
            ? `Ready for ${activeAppointment.patientName}`
            : "Waiting for the next booked teleconsult"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Join the active consultation, keep patient context visible, then finish with notes and prescriptions.
        </p>
      </section>

      <div className="px-6 py-6 sm:px-8">
      {actionError ? (
        <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_0.4fr]">
        <section className="rounded-xl border border-[#12324d]/10 bg-white p-5 sm:p-6">
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              className="h-11 rounded-xl"
              disabled={!activeAppointment}
              onClick={() => void handleJoin()}
            >
              <Video className="size-4" />
              Join Google Meet
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              disabled={!activeAppointment}
              onClick={() => void handleComplete()}
            >
              Mark completed
            </Button>
          </div>
        </section>

        <aside className="rounded-xl border border-[#12324d]/10 bg-white p-5">
          <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
            Session status
          </p>
          <div className="mt-5 rounded-[1.5rem] border border-border bg-background p-5">
            <Badge variant="secondary">
              {activeAppointment ? formatStatus(activeAppointment.status) : "No active consult"}
            </Badge>
            <p className="mt-4 text-lg font-bold">
              {activeAppointment
                ? formatAppointmentTimeRange(
                    activeAppointment.scheduledStartAt,
                    activeAppointment.scheduledEndAt,
                  )
                : "--"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeAppointment
                ? formatAppointmentDate(activeAppointment.scheduledStartAt)
                : "Booked consultations will appear here automatically."}
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-5">
          <article className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <UserRound className="size-5" />
              </span>
              <div>
                <p className="font-bold">Active patient</p>
                <p className="text-sm text-muted-foreground">
                  Primary session details before joining
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoCard
                label="Patient name"
                value={activeAppointment?.patientName ?? "Waiting for booking"}
              />
              <InfoCard
                label="Consult type"
                value={activeAppointment?.specializationName ?? "Teleconsult"}
              />
              <InfoCard
                label="Patient email"
                value={activeAppointment?.patientEmail ?? "--"}
              />
              <InfoCard
                label="Doctor location"
                value={activeAppointment?.doctorLocation ?? "Online consultation"}
              />
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <ClipboardCheck className="size-5" />
              </span>
              <div>
                <p className="font-bold">Pre-consult checklist</p>
                <p className="text-sm text-muted-foreground">
                  Quick checks before the doctor enters the virtual room
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {sessionChecklist.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-background px-4 py-3"
                >
                  <span className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="space-y-5">
          <article className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <CalendarClock className="size-5" />
              </span>
              <div>
                <p className="font-bold">Consult schedule context</p>
                <p className="text-sm text-muted-foreground">
                  Time, readiness, and session handoff
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-border bg-background p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {activeAppointment
                      ? formatAppointmentTimeRange(
                          activeAppointment.scheduledStartAt,
                          activeAppointment.scheduledEndAt,
                        )
                      : "--"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeAppointment
                      ? formatAppointmentDate(activeAppointment.scheduledStartAt)
                      : "No booked consultation yet"}
                  </p>
                </div>
                <Badge variant="secondary">
                  {activeAppointment ? formatStatus(activeAppointment.status) : "Waiting"}
                </Badge>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button className="h-11 rounded-xl" disabled={!activeAppointment} onClick={() => void handleJoin()}>
                  <MonitorSmartphone className="size-4" />
                  Launch consult session
                </Button>
                <Button variant="outline" className="h-11 rounded-xl" disabled={!activeAppointment} onClick={() => void handleComplete()}>
                  Mark as completed
                </Button>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <p className="font-bold">Emergency fallback</p>
                <p className="text-sm text-muted-foreground">
                  If the patient needs immediate in-person care
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] bg-muted/35 p-5">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 text-primary" />
                  Suggest nearest hospital or ER based on saved patient location
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-primary" />
                  Provide emergency contact guidance and hotline fallback
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-border bg-background px-4 py-4">
      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </article>
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
