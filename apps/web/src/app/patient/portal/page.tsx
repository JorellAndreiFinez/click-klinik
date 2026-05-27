"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronRight,
  FileText,
  HeartPulse,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { PatientWorkspaceShell } from "../patient-workspace-shell";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyPatientAppointments, type Appointment } from "@/lib/appointments-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { getMyPatientProfile, type PatientProfile } from "@/lib/patient-api";

export default function PatientPortalPage() {
  const router = useRouter();
  const firebaseConfigured = isFirebaseConfigured();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
        const [patient, nextAppointments] = await Promise.all([
          getMyPatientProfile(user),
          getMyPatientAppointments(user),
        ]);
        setProfile(patient);
        setAppointments(nextAppointments);
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

  const activeAppointments = appointments.filter(
    (appointment) =>
      appointment.status !== "completed" && appointment.status !== "cancelled",
  );
  const patientAlerts = buildPatientAlerts(appointments);

  if (!profile) {
    return (
      <main className="clinic-grid flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
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
      <div className="min-h-full bg-[linear-gradient(180deg,#f7f2e8_0%,#f4ecde_100%)]">
        <section className="border-b border-[#12324d]/10 bg-[linear-gradient(135deg,#0d3553_0%,#123f63_58%,#15496f_100%)] text-primary-foreground">
          <div className="grid gap-6 px-6 py-7 sm:px-8 xl:grid-cols-[1.18fr_0.82fr]">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-secondary uppercase">
                Patient overview
              </p>
              <h1 className="mt-3 text-3xl font-bold">Mabuhay.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-primary-foreground/68">
                Manage teleconsults, review your records, and keep your health
                details ready for doctor-reviewed care.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <QuickStat
                  icon={<Phone className="size-4" />}
                  label="Mobile"
                  value={profile.mobileNumber}
                />
                <QuickStat
                  icon={<Activity className="size-4" />}
                  label="Vitals"
                  value={`${profile.heightCm} cm / ${profile.weightKg} kg`}
                />
                <QuickStat
                  icon={<ShieldCheck className="size-4" />}
                  label="Privacy"
                  value="Consent active"
                />
                <QuickStat
                  icon={<Bell className="size-4" />}
                  label="Alerts"
                  value={`${patientAlerts.length} live`}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/6 p-5">
              <p className="text-xs font-bold tracking-[0.18em] text-secondary uppercase">
                Ready for care
              </p>
              <div className="mt-4 space-y-3">
                <CompactAction
                  href="/patient/doctors"
                  icon={<Search className="size-4" />}
                  title="Find matched doctors"
                  copy="Search by symptom, specialty, and location."
                />
                <CompactAction
                  href="/patient/records"
                  icon={<FileText className="size-4" />}
                  title="Open my records"
                  copy="Review prescriptions and consultation notes."
                />
                <CompactAction
                  href="/patient/appointments"
                  icon={<CalendarDays className="size-4" />}
                  title="Upcoming consultations"
                  copy={`${activeAppointments.length} active appointment${activeAppointments.length === 1 ? "" : "s"}.`}
                />
              </div>
              <Link
                href="/privacy"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-secondary"
              >
                View Privacy Notice
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-[#12324d]/10 bg-[#fffdf8] px-6 py-6 sm:px-8 xl:border-r xl:border-b-0">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                  Quick actions
                </p>
                <p className="mt-1 text-xl font-bold">
                  What do you need today?
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <PortalAction
                href="/patient/doctors"
                icon={<Search className="size-5" />}
                title="Find a doctor"
                copy="Browse approved doctors"
              />
              <PortalAction
                href="/patient/appointments"
                icon={<CalendarDays className="size-5" />}
                title="Appointments"
                copy="Check your consult schedule"
              />
              <PortalAction
                href="/patient/records"
                icon={<FileText className="size-5" />}
                title="Records"
                copy="Review prescriptions and notes"
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                    Care alerts
                  </p>
                  <p className="mt-1 text-xl font-bold">Booked and upcoming</p>
                </div>
                <Badge variant="outline">{patientAlerts.length} updates</Badge>
              </div>

              <div className="mt-4 space-y-3">
                {patientAlerts.slice(0, 4).map((alert) => (
                  <article
                    key={alert.id}
                    className="rounded-2xl border border-[#12324d]/10 bg-white px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{alert.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {alert.message}
                        </p>
                      </div>
                      <Badge variant="secondary">{alert.kind}</Badge>
                    </div>
                  </article>
                ))}
                {patientAlerts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#12324d]/12 bg-white px-4 py-6 text-sm text-muted-foreground">
                    No active booking or upcoming consultation alerts right now.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="bg-[#fcfaf5] px-6 py-6 sm:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                  Health snapshot
                </p>
                <p className="mt-1 text-xl font-bold">Profile summary</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#12324d]/10 bg-white px-3 py-1.5 text-xs font-semibold text-primary">
                <UserRound className="size-3.5" />
                Patient profile ready
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ProfileDetail label="Mobile" value={profile.mobileNumber} />
              <ProfileDetail label="Height" value={`${profile.heightCm} cm`} />
              <ProfileDetail label="Weight" value={`${profile.weightKg} kg`} />
              <ProfileDetail
                label="Emergency contact"
                value={
                  profile.emergencyContactName
                    ? `${profile.emergencyContactName}${profile.emergencyContactNumber ? ` ${profile.emergencyContactNumber}` : ""}`
                    : "Not added"
                }
              />
              <ProfileDetail
                label="Allergies"
                value={profile.allergies.join(", ") || "None reported"}
                className="sm:col-span-2"
              />
              <ProfileDetail
                label="Existing conditions"
                value={profile.existingConditions.join(", ") || "None reported"}
                className="sm:col-span-2"
              />
            </div>
          </div>
        </section>
      </div>
    </PatientWorkspaceShell>
  );
}

function PortalAction({
  href,
  icon,
  title,
  copy,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#12324d]/10 bg-white px-4 py-5 transition-colors hover:bg-primary/[0.03]"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
        {icon}
      </span>
      <h2 className="mt-5 font-bold">{title}</h2>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">{copy}</p>
    </Link>
  );
}

function CompactAction({
  href,
  icon,
  title,
  copy,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start justify-between gap-3 rounded-xl border border-primary-foreground/10 bg-primary-foreground/4 px-4 py-3 transition-colors hover:bg-primary-foreground/[0.08]"
    >
      <div className="flex gap-3">
        <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
          {icon}
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-5 text-primary-foreground/66">
            {copy}
          </p>
        </div>
      </div>
      <ChevronRight className="mt-1 size-4 shrink-0 text-primary-foreground/56" />
    </Link>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-primary-foreground/12 bg-primary-foreground/[0.06] px-3 py-2.5">
      <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-secondary uppercase">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function ProfileDetail({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#12324d]/10 bg-white px-4 py-4 ${className ?? ""}`}
    >
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function buildPatientAlerts(appointments: Appointment[]) {
  const now = Date.now();

  return appointments
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
          kind: "upcoming",
          title: "Consultation starting soon",
          message: `${appointment.doctorName} on ${formatAlertDate(appointment.scheduledStartAt)} at ${formatAlertTime(appointment.scheduledStartAt)}.`,
          createdAt: appointment.scheduledStartAt,
        };
      }

      return {
        id: `booked-${appointment._id}`,
        kind: "booked",
        title: "Consultation booked",
        message: `${appointment.doctorName} is scheduled for ${formatAlertDate(appointment.scheduledStartAt)} at ${formatAlertTime(appointment.scheduledStartAt)}.`,
        createdAt: appointment.createdAt,
      };
    })
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
}

function formatAlertDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatAlertTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
