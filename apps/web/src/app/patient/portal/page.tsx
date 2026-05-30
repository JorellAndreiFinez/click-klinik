"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  HeartPulse,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";

import { PatientWorkspaceShell } from "../patient-workspace-shell";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getMyPatientAppointments,
  type Appointment,
} from "@/lib/appointments-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import {
  getMyPatientRecords,
  type MedicalRecord,
} from "@/lib/medical-records-api";
import {
  getMyMonitoringSummary,
  type HealthMonitoringSummary,
} from "@/lib/health-monitoring-api";
import { getMyPatientProfile, type PatientProfile } from "@/lib/patient-api";
import { useLocale } from "@/features/localization/locale-provider";
import { workspaceTranslations } from "@/features/localization/workspace-translations";

export default function PatientPortalPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = workspaceTranslations[locale].patientHome;
  const firebaseConfigured = isFirebaseConfigured();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [receivedRecords, setReceivedRecords] = useState<MedicalRecord[]>([]);
  const [monitoringSummary, setMonitoringSummary] =
    useState<HealthMonitoringSummary | null>(null);
  const [doctorSearchNeed, setDoctorSearchNeed] = useState("");
  const [message, setMessage] = useState(
    firebaseConfigured
      ? "Loading your secure patient profile..."
      : "Authentication is not configured yet. Add Firebase Web App values before opening the patient portal.",
  );

  useEffect(() => {
    if (!firebaseConfigured) {
      return;
    }

    const auth = getFirebaseAuth();
    let intervalId: number | null = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }

      const loadPortalData = async () => {
        const [patient, nextAppointments, recordsView, nextMonitoringSummary] =
          await Promise.all([
            getMyPatientProfile(user),
            getMyPatientAppointments(user),
            getMyPatientRecords(user),
            getMyMonitoringSummary(user),
          ]);
        setProfile(patient);
        setAppointments(nextAppointments);
        setReceivedRecords(recordsView.records);
        setMonitoringSummary(nextMonitoringSummary);
      };

      void loadPortalData().catch(() => {
        setMessage(
          "Your patient profile is incomplete. Please finish onboarding first.",
        );
      });

      if (intervalId) {
        window.clearInterval(intervalId);
      }

      intervalId = window.setInterval(() => {
        void loadPortalData().catch(() => {
          setMessage(
            "Your patient profile is incomplete. Please finish onboarding first.",
          );
        });
      }, 30000);
    });

    return () => {
      unsubscribe();
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [firebaseConfigured, router]);

  async function handleSignOut() {
    if (!firebaseConfigured) {
      router.replace("/auth");
      return;
    }

    await signOut(getFirebaseAuth());
    router.replace("/auth");
  }

  function handleDoctorMatchSearch() {
    const query = new URLSearchParams();

    if (doctorSearchNeed.trim()) {
      query.set("symptom", doctorSearchNeed.trim());
    }

    const location = profile
      ? [profile.cityMunicipalityName, profile.provinceName]
          .filter(Boolean)
          .join(", ")
      : "";

    if (location) {
      query.set("location", location);
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    router.push(`/patient/doctors${suffix}`);
  }

  const activeAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status !== "completed" &&
          appointment.status !== "cancelled",
      ),
    [appointments],
  );
  const nextAppointment = activeAppointments[0];
  const latestRecord = receivedRecords[0];
  const locationText =
    profile &&
    [profile.cityMunicipalityName, profile.provinceName]
      .filter(Boolean)
      .join(", ");

  if (!profile) {
    return (
      <main className="clinic-grid flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <HeartPulse className="mx-auto size-10 text-primary" />
          <p className="mt-5 text-sm text-muted-foreground">{message}</p>
          {message.includes("incomplete") ? (
            <Button asChild className="mt-6 h-11 rounded-xl">
              <Link href="/auth/signup">Finish onboarding</Link>
            </Button>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <PatientWorkspaceShell
      patientName={`${profile.firstName} ${profile.lastName}`}
      onSignOut={handleSignOut}
    >
      <div className="min-h-full bg-[#f7f2e8]">
        <header className="relative overflow-hidden border-b border-[#12324d]/10 bg-[#082b45] px-6 py-7 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-secondary/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-24 w-96 -translate-x-1/2 rounded-t-full bg-white/5" />
          <div className="relative grid gap-6 xl:grid-cols-[1fr_360px] xl:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-secondary uppercase">
                {t.eyebrow}
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
                Hi, {profile.firstName}. {t.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                {t.description}
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-bold tracking-[0.18em] text-secondary uppercase">
                {t.glance}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <HeroMetric label={t.active} value={activeAppointments.length} />
                <HeroMetric label={t.records} value={receivedRecords.length} />
                <HeroMetric
                  label={t.logs}
                  value={monitoringSummary?.logs.length ?? 0}
                />
              </div>
              {locationText ? (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white">
                  <MapPin className="size-4 text-secondary" />
                  {locationText}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="grid lg:grid-cols-[1fr_360px]">
          <section className="border-b border-[#12324d]/10 bg-[#fffdf8] px-6 py-6 sm:px-8 lg:border-r lg:border-b-0">
            <div className="grid gap-3 md:grid-cols-3">
              <HomeAction
                href="/patient/doctors"
                icon={<Search className="size-5" />}
                title={t.findDoctor}
                copy={t.findDoctorCopy}
                accent="gold"
              />
              <HomeAction
                href="/patient/appointments"
                icon={<CalendarDays className="size-5" />}
                title={t.appointments}
                copy={t.appointmentsCopy(activeAppointments.length)}
                accent="blue"
              />
              <HomeAction
                href="/patient/records"
                icon={<FileText className="size-5" />}
                title={t.myRecords}
                copy={t.myRecordsCopy(receivedRecords.length)}
                accent="green"
              />
            </div>

            <div className="mt-6 border-y border-[#12324d]/10 py-6">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <h2 className="font-bold text-primary">
                      {t.concernTitle}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t.concernCopy}
                    </p>
                  </div>
                </div>

                <textarea
                  value={doctorSearchNeed}
                  onChange={(event) => setDoctorSearchNeed(event.target.value)}
                  rows={3}
                  placeholder={t.concernPlaceholder}
                  className="mt-4 min-h-24 w-full rounded-xl border border-[#12324d]/12 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button
                    className="h-11 rounded-xl"
                    onClick={handleDoctorMatchSearch}
                  >
                    <Search className="size-4" />
                    {t.concernButton}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t.guidanceOnly}
                  </p>
                </div>
              </div>
            </div>

            <section className="mt-6 rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                    Health monitoring
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-primary">
                    {monitoringSummary?.trend
                      ? formatMonitoringTrend(monitoringSummary.trend)
                      : t.monitoringTitle}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {monitoringSummary?.summary ??
                      t.monitoringCopy}
                  </p>
                </div>
                <Button asChild className="h-11 rounded-xl">
                  <Link href="/patient/monitoring">
                    <HeartPulse className="size-4" />
                    {t.monitoringButton}
                  </Link>
                </Button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MonitoringTile
                  label={t.latestBp}
                  value={
                    monitoringSummary?.latestLog
                      ? formatBp(monitoringSummary.latestLog, t.notLogged)
                      : t.notLogged
                  }
                />
                <MonitoringTile
                  label={t.temperature}
                  value={
                    typeof monitoringSummary?.latestLog?.temperatureC ===
                    "number"
                      ? `${monitoringSummary.latestLog.temperatureC} deg C`
                      : t.notLogged
                  }
                />
                <MonitoringTile
                  label={t.oxygen}
                  value={
                    typeof monitoringSummary?.latestLog?.oxygenSaturation ===
                    "number"
                      ? `${monitoringSummary.latestLog.oxygenSaturation}%`
                      : t.notLogged
                  }
                />
              </div>

              {monitoringSummary?.flags.length ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  {monitoringSummary.flags[0]}
                </div>
              ) : null}
            </section>

            <div className="mt-6">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                {t.nextConsult}
              </p>
              {nextAppointment ? (
                <article className="mt-3 overflow-hidden rounded-2xl border border-[#12324d]/10 bg-white shadow-[0_20px_55px_-42px_rgba(8,43,69,0.9)]">
                  <div className="h-2 bg-gradient-to-r from-secondary via-[#38bdf8] to-[#12734b]" />
                  <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Badge variant="secondary">
                        {formatStatus(nextAppointment.status)}
                      </Badge>
                      <h2 className="mt-3 text-xl font-bold text-primary">
                        {nextAppointment.doctorName}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(nextAppointment.scheduledStartAt)} at{" "}
                        {formatTime(nextAppointment.scheduledStartAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild className="h-11 rounded-xl">
                        <Link href="/patient/appointments">
                          <Video className="size-4" />
                          {t.openAppointments}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-[#12324d]/14 bg-white px-5 py-6">
                  <p className="font-semibold text-primary">
                    {t.nextConsultEmpty}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.findDoctorCopy}
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside className="bg-[#fcfaf5] px-6 py-6 sm:px-8">
            <section className="rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                {t.careSummary}
              </p>
              <div className="mt-4 space-y-4">
                <SummaryRow label={t.mobile} value={profile.mobileNumber} />
                <SummaryRow
                  label={t.allergies}
                  value={profile.allergies.join(", ") || t.noneReported}
                />
                <SummaryRow
                  label={t.conditions}
                  value={
                    profile.existingConditions.join(", ") || t.noneReported
                  }
                />
                <SummaryRow
                  label={t.emergencyContact}
                  value={
                    profile.emergencyContactName
                      ? `${profile.emergencyContactName}${profile.emergencyContactNumber ? `, ${profile.emergencyContactNumber}` : ""}`
                      : t.notAdded
                  }
                />
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                {t.latestRecord}
              </p>
              {latestRecord ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#12324d]/10 bg-[#fffdf8]">
                  <div className="border-b border-[#12324d]/10 bg-white px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                          {t.doctorPacket}
                        </p>
                        <p className="mt-2 font-bold text-primary">
                          {latestRecord.doctorName}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {latestRecord.specializationName}
                        </p>
                      </div>
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                        <FileText className="size-5" />
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-4">
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {buildRecordPreview(latestRecord, t.recordReady)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {latestRecord.publicNote ? (
                        <Badge variant="secondary">{t.doctorNote}</Badge>
                      ) : null}
                      {latestRecord.prescriptions.length ? (
                        <Badge variant="secondary">{t.prescription}</Badge>
                      ) : null}
                      {latestRecord.medicalCertificate ? (
                        <Badge variant="secondary">{t.certificate}</Badge>
                      ) : null}
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="mt-4 h-10 rounded-xl"
                    >
                      <Link href="/patient/records">{t.latestRecordButton}</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-[#12324d]/12 bg-[#fcfaf5] px-4 py-5 text-sm text-muted-foreground">
                  {t.noRecord}
                </p>
              )}
            </section>

            <section className="mt-4 rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                {t.quickLinks}
              </p>
              <div className="mt-4 grid gap-2">
                <SmallLink
                  href="/patient/appointments"
                  icon={<CalendarDays className="size-4" />}
                >
                  {t.viewAppointments}
                </SmallLink>
                <SmallLink
                  href="/patient/records"
                  icon={<FileText className="size-4" />}
                >
                  {t.viewRecords}
                </SmallLink>
                <SmallLink
                  href="/privacy"
                  icon={<ShieldCheck className="size-4" />}
                >
                  {t.privacyNotice}
                </SmallLink>
              </div>
            </section>
          </aside>
        </main>
      </div>
    </PatientWorkspaceShell>
  );
}

function HomeAction({
  href,
  icon,
  title,
  copy,
  accent,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  copy: string;
  accent: "blue" | "gold" | "green";
}) {
  const accentClass = {
    blue: "from-[#e0f2fe] to-white text-primary",
    gold: "from-secondary/50 to-white text-primary",
    green: "from-emerald-100 to-white text-emerald-900",
  }[accent];

  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[#12324d]/10 bg-white px-4 py-5 shadow-[0_18px_48px_-42px_rgba(8,43,69,0.85)] transition-all hover:-translate-y-0.5 hover:border-primary/25"
    >
      <span
        className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClass}`}
      >
        {icon}
      </span>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-bold text-primary">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-primary/35 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function HeroMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-3">
      <p className="text-[10px] font-bold tracking-[0.14em] text-white/60 uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#12324d]/8 pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-primary">{value}</p>
    </div>
  );
}

function SmallLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-11 items-center justify-between rounded-xl border border-[#12324d]/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-[#f7f2e8]"
    >
      <span className="flex items-center gap-2">
        {icon}
        {children}
      </span>
      <ChevronRight className="size-4 text-primary/40" />
    </Link>
  );
}

function MonitoringTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3">
      <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-primary">{value}</p>
    </div>
  );
}

function formatMonitoringTrend(trend: string) {
  return trend.replace(/_/g, " ");
}

function formatBp(
  log: { systolicBp?: number; diastolicBp?: number },
  fallback: string,
) {
  return typeof log.systolicBp === "number" &&
    typeof log.diastolicBp === "number"
    ? `${log.systolicBp}/${log.diastolicBp} mmHg`
    : fallback;
}

function formatStatus(value: Appointment["status"]) {
  return value.replace(/_/g, " ");
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

function buildRecordPreview(record: MedicalRecord, fallback: string) {
  const parts = [
    record.publicNote ? `Note: ${record.publicNote}` : "",
    record.recommendations ? `Advice: ${record.recommendations}` : "",
    record.prescriptions.length
      ? `${record.prescriptions.length} prescription item${record.prescriptions.length === 1 ? "" : "s"}`
      : "",
    record.medicalCertificate ? "Medical certificate issued" : "",
  ].filter(Boolean);

  return parts.join(" / ") || fallback;
}
