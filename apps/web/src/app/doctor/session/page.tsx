"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ClipboardCheck,
  MapPin,
  MonitorSmartphone,
  Navigation,
  Phone,
  ShieldAlert,
  UserRound,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import { dashboardPageTranslations } from "@/features/localization/dashboard-page-translations";
import { useLocale } from "@/features/localization/locale-provider";
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
  const { locale } = useLocale();
  const t = dashboardPageTranslations[locale].doctorSession;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    void getMyDoctorAppointments(user)
      .then((result) => {
        const active = result.filter(
          (appointment) =>
            appointment.status !== "completed" && appointment.status !== "cancelled",
        );
        setAppointments(result);
        setSelectedAppointmentId(active[0]?._id ?? result[0]?._id ?? "");
      })
      .catch((error: unknown) => {
        setActionError(
          error instanceof Error ? error.message : "Unable to load consultation session.",
        );
      });
  }, [user]);

  const sessionAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status !== "completed" && appointment.status !== "cancelled",
      ),
    [appointments],
  );
  const activeAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment._id === selectedAppointmentId) ??
      sessionAppointments[0] ??
      null,
    [appointments, selectedAppointmentId, sessionAppointments],
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
      } else if (activeAppointment.triage?.consultMethod === "cellular") {
        window.open(`tel:${activeAppointment.patientMobileNumber ?? ""}`, "_self");
      } else if (activeAppointment.triage?.consultMethod === "physical_visit") {
        window.open(`/consultation-route/${activeAppointment._id}`, "_blank", "noopener,noreferrer");
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
      <section className="relative overflow-hidden border-b border-[#12324d]/10 bg-[#082b45] px-6 py-7 text-white sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-secondary/20 blur-3xl" />
        <p className="relative text-xs font-bold tracking-[0.18em] text-secondary uppercase">
          {t.eyebrow}
        </p>
        <h1 className="relative mt-2 text-3xl font-bold leading-tight text-white sm:text-4xl">
          {activeAppointment
            ? t.titleOpen(activeAppointment.patientName)
            : t.titleWaiting}
        </h1>
        <p className="relative mt-3 max-w-2xl text-sm leading-6 text-white/75">
          {t.description}
        </p>
      </section>

      <div className="px-6 py-6 sm:px-8">
      {actionError ? (
        <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_0.42fr]">
        <section className="rounded-2xl border border-[#12324d]/10 bg-white p-5 shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                {t.queue}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.queueCopy}
              </p>
            </div>
            <Badge variant="outline">{sessionAppointments.length} {t.active}</Badge>
          </div>

          <div className="mt-4 grid gap-3">
            {sessionAppointments.map((appointment) => (
              <button
                key={appointment._id}
                type="button"
                onClick={() => setSelectedAppointmentId(appointment._id)}
                className={
                  selectedAppointmentId === appointment._id
                    ? "rounded-2xl border border-primary bg-primary/5 px-4 py-4 text-left shadow-[0_16px_42px_-38px_rgba(8,43,69,0.8)]"
                    : "rounded-2xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:bg-primary/[0.03]"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{appointment.patientName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatAppointmentDate(appointment.scheduledStartAt)} •{" "}
                      {formatAppointmentTimeRange(
                        appointment.scheduledStartAt,
                        appointment.scheduledEndAt,
                      )}
                    </p>
                  </div>
                  <Badge variant="secondary">{formatStatus(appointment.status)}</Badge>
                </div>
              </button>
            ))}
            {sessionAppointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#12324d]/10 bg-[#fcfaf5] px-4 py-8 text-center text-sm text-muted-foreground">
                {t.noActive}
                </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              className="h-11 rounded-xl"
              disabled={!activeAppointment}
              onClick={() => void handleJoin()}
            >
              <Video className="size-4" />
              {getSessionActionLabel(activeAppointment)}
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              disabled={!activeAppointment}
              onClick={() => void handleComplete()}
            >
              {t.markCompleted}
            </Button>
          </div>
        </section>

        <aside className="rounded-2xl border border-[#12324d]/10 bg-white p-5 shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)]">
          <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
            {t.currentSession}
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
          <article className="rounded-2xl border border-[#12324d]/10 bg-white p-5 shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <UserRound className="size-5" />
              </span>
              <div>
                <p className="font-bold">{t.patientDetails}</p>
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
                label="Consult method"
                value={activeAppointment ? formatConsultMethod(activeAppointment) : "--"}
              />
            </div>

            {activeAppointment ? (
              <ConsultMethodPanel appointment={activeAppointment} />
            ) : null}
          </article>

          <article className="rounded-2xl border border-[#12324d]/10 bg-white p-5 shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <ClipboardCheck className="size-5" />
              </span>
              <div>
                <p className="font-bold">{t.checklist}</p>
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
          <article className="rounded-2xl border border-[#12324d]/10 bg-white p-5 shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <CalendarClock className="size-5" />
              </span>
              <div>
                <p className="font-bold">{t.schedule}</p>
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
                  {getSessionActionLabel(activeAppointment)}
                </Button>
                <Button variant="outline" className="h-11 rounded-xl" disabled={!activeAppointment} onClick={() => void handleComplete()}>
                  {t.markCompleted}
                </Button>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[#12324d]/10 bg-white p-5 shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <p className="font-bold">{t.safetyFallback}</p>
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

function ConsultMethodPanel({ appointment }: { appointment: Appointment }) {
  if (appointment.triage?.consultMethod === "cellular") {
    return (
      <div className="mt-5 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4">
        <p className="flex items-center gap-2 text-sm font-bold text-primary">
          <Phone className="size-4" />
          Cellular phone session
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Patient mobile:{" "}
          <span className="font-semibold text-primary">
            {appointment.patientMobileNumber ?? "Not provided"}
          </span>
        </p>
      </div>
    );
  }

  if (appointment.triage?.consultMethod === "physical_visit") {
    return (
      <div className="mt-5 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4">
        <p className="flex items-center gap-2 text-sm font-bold text-primary">
          <MapPin className="size-4" />
          Physical clinic visit
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <InfoCard
            label="Patient start area"
            value={appointment.patientLocation ?? "Saved patient location"}
          />
          <InfoCard
            label="Clinic location"
            value={
              appointment.doctorLocation ??
              appointment.doctorClinicOrHospital ??
              "Clinic location"
            }
          />
        </div>
        <Button asChild variant="outline" className="mt-4 h-10 rounded-xl">
          <Link href={`/consultation-route/${appointment._id}`}>
            <Navigation className="size-4" />
            Open Click Klinik route
          </Link>
        </Button>
        <Button asChild variant="outline" className="mt-3 h-10 rounded-xl">
          <a href={buildMapsDirectionsUrl(appointment)} target="_blank">
            Google Maps backup
          </a>
        </Button>
      </div>
    );
  }

  return null;
}

function formatConsultMethod(appointment: Appointment) {
  if (appointment.triage?.consultMethod === "physical_visit") {
    return "Physical visit";
  }

  if (appointment.triage?.consultMethod === "cellular") {
    return "Cellular phone";
  }

  return "Google Meet";
}

function getSessionActionLabel(appointment: Appointment | null) {
  if (!appointment) {
    return "Open session";
  }

  if (appointment.triage?.consultMethod === "cellular") {
    return "Call patient";
  }

  if (appointment.triage?.consultMethod === "physical_visit") {
    return "Open clinic route";
  }

  return "Join Google Meet";
}

function buildMapsDirectionsUrl(appointment: Appointment) {
  const params = new URLSearchParams({
    api: "1",
    origin:
      formatCoordinatePair(appointment.patientLatitude, appointment.patientLongitude) ??
      appointment.patientLocation ??
      "",
    destination:
      formatCoordinatePair(appointment.doctorLatitude, appointment.doctorLongitude) ??
      appointment.doctorLocation ??
      appointment.doctorClinicOrHospital ??
      appointment.doctorCityMunicipalityName ??
      "",
    travelmode: "driving",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function formatCoordinatePair(latitude?: number, longitude?: number) {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return undefined;
  }

  return `${latitude},${longitude}`;
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
