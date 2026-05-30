"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenText,
  CalendarDays,
  CalendarRange,
  ClipboardPenLine,
  MonitorSmartphone,
  Stethoscope,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import { useLocale } from "@/features/localization/locale-provider";
import { workspaceTranslations } from "@/features/localization/workspace-translations";
import {
  claimMyDoctorPayouts,
  getMyDoctorAppointments,
  getMyDoctorPayouts,
  type Appointment,
  type DoctorPayout,
  type DoctorPayoutSummary,
} from "@/lib/appointments-api";
import { getMyScheduleSlots, type ScheduleSlot } from "@/lib/schedule-api";

export default function DoctorDashboardPage() {
  const { user, doctor } = useDoctorWorkspace();
  const { locale } = useLocale();
  const t = workspaceTranslations[locale].doctorHome;
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payoutSummary, setPayoutSummary] =
    useState<DoctorPayoutSummary | null>(null);
  const [claimingPayout, setClaimingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadDoctorDashboard = () =>
      Promise.all([
        getMyScheduleSlots(user),
        getMyDoctorAppointments(user),
        getMyDoctorPayouts(user),
      ]).then(([nextSlots, nextAppointments, nextPayoutSummary]) => {
        setSlots(nextSlots);
        setAppointments(nextAppointments);
        setPayoutSummary(nextPayoutSummary);
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
          appointment.status !== "completed" &&
          appointment.status !== "cancelled",
      ),
    [appointments],
  );

  if (!doctor) {
    return null;
  }

  const nextAppointment = activeAppointments[0] ?? null;
  const openSlots = slots.filter((slot) => slot.status === "available");
  const displayName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const revenue = payoutSummary?.totals ?? getDoctorRevenue(appointments);

  async function handleClaimPayout() {
    if (!user || revenue.availablePayoutPhp <= 0) {
      return;
    }

    setClaimingPayout(true);
    setPayoutMessage("");

    try {
      const nextSummary = await claimMyDoctorPayouts(user);
      setPayoutSummary(nextSummary);
      setPayoutMessage(t.payoutSent);
    } catch (error: unknown) {
      setPayoutMessage(
        error instanceof Error ? error.message : "Unable to claim payout.",
      );
    } finally {
      setClaimingPayout(false);
    }
  }

  return (
    <div className="min-h-full bg-[#f7f2e8]">
      <section className="relative overflow-hidden border-b border-[#12324d]/10 bg-[#082b45] px-6 py-7 text-white sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-secondary/20 blur-3xl" />
        <p className="relative text-xs font-bold tracking-[0.2em] text-secondary uppercase">
          {t.eyebrow}
        </p>
        <div className="relative mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
              {t.title(displayName)}
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/75">
              {doctor.specializationName}
              {doctor.clinicOrHospital ? ` / ${doctor.clinicOrHospital}` : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-6 sm:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label={t.activeConsults} value={activeAppointments.length} />
          <StatCard label={t.openSlots} value={openSlots.length} />
          <StatCard
            label={t.patients}
            value={new Set(appointments.map((item) => item.patientId)).size}
          />
          <MoneyStatCard
            label={t.doctorEarnings}
            value={formatPhp(revenue.doctorPayoutPhp)}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-[#12324d]/10 bg-white px-5 py-5 shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  {t.nextStep}
                </p>
                <h2 className="mt-2 text-xl font-bold text-primary">
                  {nextAppointment
                    ? t.upcomingConsultation
                    : t.prepareSchedule}
                </h2>
              </div>
              <Badge variant={nextAppointment ? "secondary" : "outline"}>
                {nextAppointment
                  ? formatStatus(nextAppointment.status)
                  : t.noActiveSession}
              </Badge>
            </div>

            {nextAppointment ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <InfoTile label={t.patient} value={nextAppointment.patientName} />
                <InfoTile
                  label={t.date}
                  value={formatDate(nextAppointment.scheduledStartAt)}
                />
                <InfoTile
                  label={t.time}
                  value={`${formatTime(nextAppointment.scheduledStartAt)} - ${formatTime(nextAppointment.scheduledEndAt)}`}
                />
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-border bg-[#fcfaf5] px-4 py-5 text-sm text-muted-foreground">
                {t.addAvailability}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <QuickButton href="/doctor/session" primary>
                {nextAppointment?.triage?.consultMethod === "physical_visit"
                  ? t.openClinicRoute
                  : t.openSession}
              </QuickButton>
              <QuickButton href="/doctor/schedule">{t.availability}</QuickButton>
              <QuickButton href="/doctor/schedule/calendar">
                {t.calendar}
              </QuickButton>
            </div>
          </section>

          <aside className="rounded-2xl border border-[#12324d]/10 bg-white px-5 py-5 shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)]">
            <p className="text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
              {t.clinicWallet}
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
                  <p className="text-xs text-muted-foreground">
                    {t.walletCopy}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <WalletRow
                  label={t.grossPaid}
                  value={formatPhp(revenue.grossAmountPhp)}
                />
                <WalletRow
                  label={t.clinicFee}
                  value={formatPhp(revenue.platformCommissionPhp)}
                />
                <WalletRow
                  label={t.pendingPayout}
                  value={formatPhp(revenue.pendingPayoutPhp)}
                />
                <WalletRow
                  label={t.paidOut}
                  value={formatPhp(revenue.paidOutPayoutPhp)}
                />
              </div>
              <button
                type="button"
                disabled={claimingPayout || revenue.availablePayoutPhp <= 0}
                onClick={() => void handleClaimPayout()}
                className="mt-4 h-10 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {claimingPayout
                  ? t.claiming
                  : revenue.availablePayoutPhp > 0
                    ? t.sendViaXendit(formatPhp(revenue.availablePayoutPhp))
                    : t.noPayout}
              </button>
              {payoutMessage ? (
                <p className="mt-3 rounded-xl border border-[#12324d]/10 bg-white px-3 py-2 text-xs font-semibold text-primary">
                  {payoutMessage}
                </p>
              ) : null}
            </div>

            <p className="mt-5 text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
              {t.quickActions}
            </p>
            <div className="mt-4 grid gap-2">
              <FeatureLink
                href="/doctor/records"
                icon={<BookOpenText className="size-4" />}
                label={t.medicalRecords}
              />
              <FeatureLink
                href="/doctor/schedule"
                icon={<CalendarDays className="size-4" />}
                label={t.availability}
              />
              <FeatureLink
                href="/doctor/schedule/calendar"
                icon={<CalendarRange className="size-4" />}
                label={t.calendar}
              />
              <FeatureLink
                href="/doctor/notes"
                icon={<ClipboardPenLine className="size-4" />}
                label={t.notesPrescriptions}
              />
              <FeatureLink
                href="/doctor/session"
                icon={<MonitorSmartphone className="size-4" />}
                label={t.consultRoom}
              />
            </div>
          </aside>
        </div>

        <section className="mt-5 rounded-2xl border border-[#12324d]/10 bg-white px-5 py-5 shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                {t.recentBookings}
              </p>
              <h2 className="mt-2 text-xl font-bold text-primary">
                {t.nextPatients}
              </h2>
            </div>
            <Link
              href="/doctor/schedule/calendar"
              className="text-sm font-semibold text-primary"
            >
              {t.viewAll}
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {activeAppointments.slice(0, 4).map((appointment) => (
              <article
                key={appointment._id}
                className="grid gap-3 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-semibold text-primary">
                    {appointment.patientName}
                  </p>
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
                {t.noRecentBookings}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-[#12324d]/10 bg-white px-5 py-5 shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                {t.payouts}
              </p>
              <h2 className="mt-2 text-xl font-bold text-primary">
                {t.consultationEarnings}
              </h2>
            </div>
            <span className="rounded-full border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-1 text-xs font-semibold text-primary">
              15% platform fee
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#12324d]/10 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">{t.patientHeader}</th>
                  <th className="py-3 pr-4">{t.grossHeader}</th>
                  <th className="py-3 pr-4">{t.feeHeader}</th>
                  <th className="py-3 pr-4">{t.payoutHeader}</th>
                  <th className="py-3 pr-4">{t.statusHeader}</th>
                </tr>
              </thead>
              <tbody>
                {(payoutSummary?.payouts ?? []).slice(0, 8).map((payout) => (
                  <PayoutRow
                    key={payout._id}
                    payout={payout}
                    noReferenceLabel={t.noReference}
                  />
                ))}
              </tbody>
            </table>
            {payoutSummary?.payouts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-[#fcfaf5] px-4 py-6 text-sm text-muted-foreground">
                {t.payoutEmpty}
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </div>
  );
}

function PayoutRow({
  payout,
  noReferenceLabel,
}: {
  payout: DoctorPayout;
  noReferenceLabel: string;
}) {
  return (
    <tr className="border-b border-[#12324d]/10 last:border-b-0">
      <td className="py-3 pr-4">
        <p className="font-semibold text-primary">{payout.patientName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {payout.payoutProviderPayoutId ??
            payout.paymentReferenceId ??
            noReferenceLabel}
        </p>
      </td>
      <td className="py-3 pr-4 font-semibold text-primary">
        {formatPhp(payout.grossAmountPhp)}
      </td>
      <td className="py-3 pr-4 text-amber-700">
        {formatPhp(payout.platformCommissionPhp)}
      </td>
      <td className="py-3 pr-4 font-bold text-emerald-700">
        {formatPhp(payout.doctorPayoutPhp)}
      </td>
      <td className="py-3 pr-4">
        <span className="rounded-full border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-1 text-xs font-semibold text-primary">
          {payout.status.replace(/_/g, " ")}
        </span>
      </td>
    </tr>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#12324d]/10 bg-white px-4 py-4 shadow-[0_18px_50px_-44px_rgba(8,43,69,0.9)]">
      <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

function MoneyStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#12324d]/10 bg-white px-4 py-4 shadow-[0_18px_50px_-44px_rgba(8,43,69,0.9)]">
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
    <div className="rounded-2xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
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
      className="flex h-12 items-center gap-3 rounded-2xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/[0.04]"
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
          ? "inline-flex h-11 items-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
          : "inline-flex h-11 items-center rounded-2xl border border-[#12324d]/10 bg-[#fcfaf5] px-5 text-sm font-semibold text-primary"
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
        summary.grossAmountPhp += appointment.totalFeePhp ?? 0;
        summary.platformCommissionPhp += commission;
        summary.availablePayoutPhp += payout;
        summary.doctorPayoutPhp += payout;
      } else if (appointment.status !== "cancelled") {
        summary.pendingPayoutPhp += payout;
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
}

function getDoctorPayoutPhp(appointment: Appointment) {
  if (typeof appointment.doctorPayoutPhp === "number") {
    return appointment.doctorPayoutPhp;
  }

  return Math.max(
    (appointment.totalFeePhp ?? 0) - getPlatformCommissionPhp(appointment),
    0,
  );
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
