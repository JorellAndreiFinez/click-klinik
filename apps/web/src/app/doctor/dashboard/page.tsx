"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenText,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  ClipboardPenLine,
  MonitorSmartphone,
  Stethoscope,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import { getMyDoctorAppointments, type Appointment } from "@/lib/appointments-api";
import {
  getMyScheduleSlots,
  type ScheduleSlot,
} from "@/lib/schedule-api";

export default function DoctorDashboardPage() {
  const { user, doctor } = useDoctorWorkspace();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadDoctorDashboard = () =>
      Promise.all([
        getMyScheduleSlots(user),
        getMyDoctorAppointments(user),
      ]).then(([nextSlots, nextAppointments]) => {
        setSlots(nextSlots);
        setAppointments(nextAppointments);
      });

    void loadDoctorDashboard();

    const intervalId = window.setInterval(() => {
      void loadDoctorDashboard();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [user]);

  const activeAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status !== "completed" && appointment.status !== "cancelled",
      ),
    [appointments],
  );

  if (!doctor) {
    return null;
  }

  const nextAppointment = activeAppointments[0] ?? null;
  const openSlots = slots.filter((slot) => slot.status === "available");
  const displayName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const revenue = getDoctorRevenue(appointments);

  return (
    <div className="min-h-full bg-[#f7f2e8]">
      <section className="border-b border-[#12324d]/10 bg-white px-6 py-6 sm:px-8">
        <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
          Doctor home
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary sm:text-3xl">
              Good day, {displayName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {doctor.specializationName}
              {doctor.clinicOrHospital ? ` • ${doctor.clinicOrHospital}` : ""}
            </p>
          </div>
          <Badge variant="outline" className="h-9 rounded-full px-3">
            <Stethoscope className="size-3.5" />
            Verified doctor
          </Badge>
        </div>
      </section>

      <section className="px-6 py-6 sm:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Active consults" value={activeAppointments.length} />
          <StatCard label="Open slots" value={openSlots.length} />
          <StatCard label="Patients" value={new Set(appointments.map((item) => item.patientId)).size} />
          <MoneyStatCard
            label="Doctor earnings"
            value={formatPhp(revenue.availablePayoutPhp)}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                  Next step
                </p>
                <h2 className="mt-2 text-xl font-bold text-primary">
                  {nextAppointment ? "Upcoming consultation" : "Prepare your schedule"}
                </h2>
              </div>
              <Badge variant={nextAppointment ? "secondary" : "outline"}>
                {nextAppointment ? formatStatus(nextAppointment.status) : "No active session"}
              </Badge>
            </div>

            {nextAppointment ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <InfoTile label="Patient" value={nextAppointment.patientName} />
                <InfoTile
                  label="Date"
                  value={formatDate(nextAppointment.scheduledStartAt)}
                />
                <InfoTile
                  label="Time"
                  value={`${formatTime(nextAppointment.scheduledStartAt)} - ${formatTime(nextAppointment.scheduledEndAt)}`}
                />
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-border bg-[#fcfaf5] px-4 py-5 text-sm text-muted-foreground">
                Add your weekly availability so patients can book consultations.
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <QuickButton href="/doctor/session" primary>
                Open session
              </QuickButton>
              <QuickButton href="/doctor/schedule">Availability</QuickButton>
              <QuickButton href="/doctor/schedule/calendar">Calendar</QuickButton>
            </div>
          </section>

          <aside className="rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
              Clinic wallet
            </p>
            <div className="mt-4 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Wallet className="size-5" />
                </span>
                <div>
                  <p className="font-bold text-primary">
                    {formatPhp(revenue.availablePayoutPhp)}
                  </p>
                  <p className="text-xs text-muted-foreground">available after online payment</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <WalletRow label="Gross paid" value={formatPhp(revenue.grossPaidPhp)} />
                <WalletRow label="Click Klinik fee" value={formatPhp(revenue.platformCommissionPhp)} />
                <WalletRow label="Pending payout" value={formatPhp(revenue.pendingPayoutPhp)} />
              </div>
            </div>

            <p className="mt-5 text-xs font-bold tracking-[0.16em] text-primary uppercase">
              Choose what you need
            </p>
            <div className="mt-4 grid gap-2">
              <FeatureLink
                href="/doctor/consultations"
                icon={<CalendarCheck2 className="size-4" />}
                label="Consultations"
              />
              <FeatureLink
                href="/doctor/records"
                icon={<BookOpenText className="size-4" />}
                label="Medical records"
              />
              <FeatureLink
                href="/doctor/schedule"
                icon={<CalendarDays className="size-4" />}
                label="Availability"
              />
              <FeatureLink
                href="/doctor/schedule/calendar"
                icon={<CalendarRange className="size-4" />}
                label="Calendar"
              />
              <FeatureLink
                href="/doctor/notes"
                icon={<ClipboardPenLine className="size-4" />}
                label="Notes & prescriptions"
              />
              <FeatureLink
                href="/doctor/session"
                icon={<MonitorSmartphone className="size-4" />}
                label="Consult room"
              />
            </div>
          </aside>
        </div>

        <section className="mt-5 rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                Recent bookings
              </p>
              <h2 className="mt-2 text-xl font-bold text-primary">Patients to review</h2>
            </div>
            <Link href="/doctor/consultations" className="text-sm font-semibold text-primary">
              View all
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {activeAppointments.slice(0, 4).map((appointment) => (
              <article
                key={appointment._id}
                className="grid gap-3 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-semibold text-primary">{appointment.patientName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(appointment.scheduledStartAt)} at{" "}
                    {formatTime(appointment.scheduledStartAt)}
                  </p>
                </div>
                <Badge variant="outline" className="h-fit">
                  {formatStatus(appointment.status)}
                </Badge>
              </article>
            ))}

            {activeAppointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-[#fcfaf5] px-4 py-6 text-sm text-muted-foreground">
                No patient bookings yet.
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4">
      <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

function MoneyStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4">
      <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

function WalletRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-primary">{value}</span>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-bold text-primary">{value}</p>
    </div>
  );
}

function FeatureLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-12 items-center gap-3 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm font-semibold text-primary hover:bg-primary/[0.04]"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
        {icon}
      </span>
      {label}
    </Link>
  );
}

function QuickButton({
  href,
  primary = false,
  children,
}: {
  href: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
          : "inline-flex h-11 items-center rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-5 text-sm font-semibold text-primary"
      }
    >
      {children}
    </Link>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(value: Appointment["status"]) {
  return value.replace(/_/g, " ");
}

function getDoctorRevenue(appointments: Appointment[]) {
  return appointments.reduce(
    (summary, appointment) => {
      const payout = getDoctorPayoutPhp(appointment);
      const commission = getPlatformCommissionPhp(appointment);

      if (appointment.paymentStatus === "paid") {
        summary.grossPaidPhp += appointment.totalFeePhp ?? 0;
        summary.platformCommissionPhp += commission;
        summary.availablePayoutPhp += payout;
      } else if (appointment.status !== "cancelled") {
        summary.pendingPayoutPhp += payout;
      }

      return summary;
    },
    {
      availablePayoutPhp: 0,
      grossPaidPhp: 0,
      pendingPayoutPhp: 0,
      platformCommissionPhp: 0,
    },
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

function formatPhp(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
