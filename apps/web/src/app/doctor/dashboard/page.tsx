"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpenText,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  ClipboardPenLine,
  MonitorSmartphone,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import { getMyDoctorAppointments, type Appointment } from "@/lib/appointments-api";
import {
  getMyScheduleNotifications,
  getMyScheduleSlots,
  type ScheduleNotification,
  type ScheduleSlot,
} from "@/lib/schedule-api";

type DoctorAlert = {
  id: string;
  kind: "booked" | "upcoming" | "schedule";
  title: string;
  message: string;
  createdAt: string;
};

export default function DoctorDashboardPage() {
  const { user, doctor } = useDoctorWorkspace();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [notifications, setNotifications] = useState<ScheduleNotification[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadDoctorDashboard = () =>
      Promise.all([
        getMyScheduleSlots(user),
        getMyScheduleNotifications(user),
        getMyDoctorAppointments(user),
      ]).then(([nextSlots, nextNotifications, nextAppointments]) => {
        setSlots(nextSlots);
        setNotifications(nextNotifications);
        setAppointments(nextAppointments);
      });

    void loadDoctorDashboard();

    const intervalId = window.setInterval(() => {
      void loadDoctorDashboard();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [user]);

  if (!doctor) {
    return null;
  }

  const nextOpenSlot = slots.find((slot) => slot.status === "available");
  const blockedCount = slots.filter((slot) => slot.status === "unavailable").length;
  const displayName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const activeAppointments = appointments.filter(
    (appointment) =>
      appointment.status !== "completed" && appointment.status !== "cancelled",
  );
  const doctorAlerts = buildDoctorAlerts(appointments, notifications);
  const nextAppointment = activeAppointments[0];
  const recentPatients = activeAppointments.slice(0, 4);

  return (
    <div className="w-full bg-[linear-gradient(180deg,#f7f2e8_0%,#f4ecde_100%)]">
      <section className="border-b border-[#12324d]/10 bg-[linear-gradient(135deg,#0d3553_0%,#123f63_58%,#15496f_100%)] text-primary-foreground">
        <div className="grid xl:grid-cols-[1.1fr_0.9fr]">
          <div className="px-6 py-7 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.22em] text-secondary uppercase">
                  Doctor overview
                </p>
                <h1 className="mt-3 text-3xl font-bold">{displayName}</h1>
                <p className="mt-2 text-sm text-primary-foreground/68">
                  {doctor.specializationName}
                  {doctor.clinicOrHospital ? ` / ${doctor.clinicOrHospital}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <TopPill
                  icon={<ShieldCheck className="size-3.5" />}
                  label="Verified"
                />
                <TopPill
                  icon={<Bell className="size-3.5" />}
                  label={`${doctorAlerts.length} live alerts`}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-px border border-primary-foreground/10 bg-primary-foreground/10 sm:grid-cols-3">
              <HeroStat
                label="Next open slot"
                value={nextOpenSlot ? formatTime(nextOpenSlot.startAt) : "--"}
                note={nextOpenSlot ? formatDay(nextOpenSlot.startAt) : "No slot yet"}
              />
              <HeroStat
                label="Patients"
                value={String(new Set(appointments.map((item) => item.patientId)).size)}
                note="booked patients"
              />
              <HeroStat
                label="Blocked"
                value={String(blockedCount)}
                note="schedule periods"
              />
            </div>
          </div>

          <div className="border-t border-primary-foreground/10 px-6 py-7 sm:px-8 xl:border-t-0 xl:border-l xl:border-primary-foreground/10">
            <p className="text-xs font-bold tracking-[0.18em] text-secondary uppercase">
              Next session
            </p>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-bold">
                  {nextAppointment
                    ? formatDayLong(nextAppointment.scheduledStartAt)
                    : nextOpenSlot
                      ? formatDayLong(nextOpenSlot.startAt)
                      : "Waiting for schedule"}
                </p>
                <p className="mt-2 text-sm text-primary-foreground/66">
                  {nextAppointment
                    ? `${nextAppointment.patientName} • ${formatTime(nextAppointment.scheduledStartAt)} - ${formatTime(nextAppointment.scheduledEndAt)}`
                    : nextOpenSlot
                      ? `${formatTime(nextOpenSlot.startAt)} - ${formatTime(nextOpenSlot.endAt)}`
                      : "Add availability to unlock consultation flow."}
                </p>
              </div>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-foreground/[0.06] text-secondary">
                <Stethoscope className="size-5" />
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton href="/doctor/session" tone="primary">
                Open consult room
              </ActionButton>
              <ActionButton href="/doctor/consultations" tone="ghost">
                Active consultations
              </ActionButton>
              <ActionButton href="/doctor/schedule/calendar" tone="ghost">
                View calendar
              </ActionButton>
            </div>
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-[1.18fr_0.82fr]">
        <div className="border-r border-[#12324d]/10 bg-[#fcfaf5] px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Today&apos;s work
              </p>
              <p className="mt-1 text-xl font-bold">Schedule and patients</p>
            </div>
            <Link href="/doctor/schedule" className="text-sm font-semibold text-primary">
              Manage availability
            </Link>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div>
              <SectionTitle
                title="Upcoming schedule"
                meta={`${slots.length} saved periods`}
              />
              <div className="mt-3 space-y-2">
                {slots.slice(0, 4).map((slot) => (
                  <article
                    key={slot._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#12324d]/10 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary">
                        {formatDayLong(slot.startAt)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
                      </p>
                    </div>
                    <Badge
                      variant={slot.status === "available" ? "secondary" : "outline"}
                    >
                      {slot.status === "available"
                        ? "Available"
                        : slot.status === "unavailable"
                          ? "Blocked"
                          : "Booked"}
                    </Badge>
                  </article>
                ))}
                {slots.length === 0 ? <EmptyStrip copy="No saved schedule yet." /> : null}
              </div>
            </div>

            <div>
              <SectionTitle title="Recent patients" meta={`${recentPatients.length} active`} />
              <div className="mt-3 space-y-2">
                {recentPatients.map((appointment) => (
                  <Link
                    key={appointment._id}
                    href="/doctor/consultations"
                    className="group flex items-center justify-between gap-3 rounded-xl border border-[#12324d]/10 bg-white px-4 py-3 transition-colors hover:bg-primary/[0.03]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{appointment.patientName}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {appointment.specializationName}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-primary/35 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
                {recentPatients.length === 0 ? <EmptyStrip copy="No patient bookings yet." /> : null}
              </div>
            </div>
          </div>
        </div>

        <aside className="bg-[#fffdf8] px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Quick access
            </p>
            <p className="mt-1 text-xl font-bold">Care tools</p>
          </div>

          <div className="mt-5 space-y-5">
            <div className="space-y-2">
              <SectionTitle title="Core modules" />
              <div className="grid gap-2">
                <ModuleLink
                  href="/doctor/consultations"
                  icon={<CalendarCheck2 className="size-4.5" />}
                  label="Consultations"
                  meta="Booked sessions"
                />
                <ModuleLink
                  href="/doctor/records"
                  icon={<BookOpenText className="size-4.5" />}
                  label="Medical records"
                  meta="Patient charts"
                />
                <ModuleLink
                  href="/doctor/schedule"
                  icon={<CalendarDays className="size-4.5" />}
                  label="Availability"
                  meta="Weekly setup"
                />
                <ModuleLink
                  href="/doctor/schedule/calendar"
                  icon={<CalendarRange className="size-4.5" />}
                  label="Calendar"
                  meta="Consultation board"
                />
                <ModuleLink
                  href="/doctor/notes"
                  icon={<ClipboardPenLine className="size-4.5" />}
                  label="Notes & Rx"
                  meta="Consult summary"
                />
                <ModuleLink
                  href="/doctor/session"
                  icon={<MonitorSmartphone className="size-4.5" />}
                  label="Consult room"
                  meta="Virtual session"
                />
              </div>
            </div>

            <div className="space-y-2">
              <SectionTitle title="Needs attention" meta={`${doctorAlerts.length} live`} />
              <div className="space-y-2">
                {doctorAlerts.slice(0, 3).map((alert) => (
                  <article
                    key={alert.id}
                    className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <Badge variant="secondary">{alert.kind}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {alert.message}
                    </p>
                  </article>
                ))}
                {doctorAlerts.length === 0 ? (
                  <EmptyStrip copy="No new booking, upcoming, or schedule alerts right now." />
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function TopPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/12 bg-primary-foreground/[0.06] px-3 py-2 text-xs font-semibold">
      {icon}
      {label}
    </span>
  );
}

function HeroStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="bg-primary-foreground/[0.05] px-4 py-4">
      <p className="text-[11px] font-bold tracking-[0.18em] text-secondary uppercase">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-primary-foreground/65">{note}</p>
    </div>
  );
}

function ActionButton({
  href,
  tone,
  children,
}: {
  href: string;
  tone: "primary" | "ghost";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        tone === "primary"
          ? "inline-flex h-11 items-center rounded-xl bg-secondary px-5 text-sm font-semibold text-secondary-foreground"
          : "inline-flex h-11 items-center rounded-xl border border-primary-foreground/14 bg-primary-foreground/[0.05] px-5 text-sm font-semibold text-primary-foreground"
      }
    >
      {children}
    </Link>
  );
}

function SectionTitle({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-primary">{title}</p>
      {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
    </div>
  );
}

function ModuleLink({
  href,
  icon,
  label,
  meta,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-xl border border-[#12324d]/10 bg-white px-4 py-3 transition-colors hover:bg-primary/[0.03]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-secondary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-primary/35 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function EmptyStrip({ copy }: { copy: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted-foreground">
      {copy}
    </div>
  );
}

function formatDay(dateValue: string) {
  return new Intl.DateTimeFormat("en-PH", { weekday: "short" }).format(
    new Date(dateValue),
  );
}

function formatDayLong(dateValue: string) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(dateValue));
}

function formatTime(dateValue: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function buildDoctorAlerts(
  appointments: Appointment[],
  notifications: ScheduleNotification[],
): DoctorAlert[] {
  const now = Date.now();
  const appointmentAlerts = appointments
    .filter(
      (appointment) =>
        appointment.status !== "completed" &&
        appointment.status !== "cancelled",
    )
    .map((appointment) => {
      const startAt = new Date(appointment.scheduledStartAt).getTime();
      const hoursUntil = (startAt - now) / (1000 * 60 * 60);

      if (hoursUntil <= 24) {
        return {
          id: `upcoming-${appointment._id}`,
          kind: "upcoming" as const,
          title: "Upcoming consultation",
          message: `${appointment.patientName} at ${formatTime(appointment.scheduledStartAt)} on ${formatDayLong(appointment.scheduledStartAt)}.`,
          createdAt: appointment.scheduledStartAt,
        };
      }

      return {
        id: `booked-${appointment._id}`,
        kind: "booked" as const,
        title: "New booking received",
        message: `${appointment.patientName} booked ${appointment.specializationName} for ${formatDayLong(appointment.scheduledStartAt)}.`,
        createdAt: appointment.createdAt,
      };
    });

  const scheduleAlerts = notifications.map((notification) => ({
    id: `schedule-${notification._id}`,
    kind: "schedule" as const,
    title: notification.title,
    message: notification.message,
    createdAt: notification.createdAt,
  }));

  return [...appointmentAlerts, ...scheduleAlerts].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}
