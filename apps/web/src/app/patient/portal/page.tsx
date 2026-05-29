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
import { getMyPatientAppointments, type Appointment } from "@/lib/appointments-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import {
  getMyPatientRecords,
  type MedicalRecord,
} from "@/lib/medical-records-api";
import { getMyPatientProfile, type PatientProfile } from "@/lib/patient-api";

export default function PatientPortalPage() {
  const router = useRouter();
  const firebaseConfigured = isFirebaseConfigured();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [receivedRecords, setReceivedRecords] = useState<MedicalRecord[]>([]);
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
        const [patient, nextAppointments, recordsView] = await Promise.all([
          getMyPatientProfile(user),
          getMyPatientAppointments(user),
          getMyPatientRecords(user),
        ]);
        setProfile(patient);
        setAppointments(nextAppointments);
        setReceivedRecords(recordsView.records);
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
    profile && [profile.cityMunicipalityName, profile.provinceName]
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
        <header className="border-b border-[#12324d]/10 bg-white px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Home
              </p>
              <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
                Hi, {profile.firstName}. What do you need today?
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Start a consultation, check your appointment, or open records from your doctor.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="h-9 rounded-full px-3">
                <ShieldCheck className="size-3.5" />
                Private care
              </Badge>
              {locationText ? (
                <Badge variant="outline" className="h-9 rounded-full px-3">
                  <MapPin className="size-3.5" />
                  {locationText}
                </Badge>
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
                title="Find a doctor"
                copy="Search by symptoms or specialization"
              />
              <HomeAction
                href="/patient/appointments"
                icon={<CalendarDays className="size-5" />}
                title="My appointments"
                copy={`${activeAppointments.length} active consultation${activeAppointments.length === 1 ? "" : "s"}`}
              />
              <HomeAction
                href="/patient/records"
                icon={<FileText className="size-5" />}
                title="My records"
                copy={
                  receivedRecords.length
                    ? `${receivedRecords.length} doctor record${receivedRecords.length === 1 ? "" : "s"} received`
                    : "Notes and prescriptions"
                }
              />
            </div>

            <div className="mt-6 border-y border-[#12324d]/10 py-6">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <h2 className="font-bold text-primary">Tell us your concern</h2>
                    <p className="text-sm text-muted-foreground">
                      We will help match you with a relevant doctor type.
                    </p>
                  </div>
                </div>

                <textarea
                  value={doctorSearchNeed}
                  onChange={(event) => setDoctorSearchNeed(event.target.value)}
                  rows={3}
                  placeholder="Example: diabetes checkup, cough for 3 days, chest pain"
                  className="mt-4 min-h-24 w-full rounded-xl border border-[#12324d]/12 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button className="h-11 rounded-xl" onClick={handleDoctorMatchSearch}>
                    <Search className="size-4" />
                    Find matched doctors
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Guidance only. For emergencies, go to the nearest hospital.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Your next step
              </p>
              {nextAppointment ? (
                <article className="mt-3 rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Badge variant="secondary">{formatStatus(nextAppointment.status)}</Badge>
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
                          Open appointment
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-[#12324d]/14 bg-white px-5 py-6">
                  <p className="font-semibold text-primary">No appointment booked yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You can find a doctor when you are ready.
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside className="bg-[#fcfaf5] px-6 py-6 sm:px-8">
            <section className="rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Care summary
              </p>
              <div className="mt-4 space-y-4">
                <SummaryRow
                  label="Mobile"
                  value={profile.mobileNumber}
                />
                <SummaryRow
                  label="Allergies"
                  value={profile.allergies.join(", ") || "None reported"}
                />
                <SummaryRow
                  label="Conditions"
                  value={profile.existingConditions.join(", ") || "None reported"}
                />
                <SummaryRow
                  label="Emergency contact"
                  value={
                    profile.emergencyContactName
                      ? `${profile.emergencyContactName}${profile.emergencyContactNumber ? `, ${profile.emergencyContactNumber}` : ""}`
                      : "Not added"
                  }
                />
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Latest doctor record
              </p>
              {latestRecord ? (
                <div className="mt-4 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4">
                  <p className="font-semibold text-primary">{latestRecord.doctorName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {latestRecord.specializationName}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {buildRecordPreview(latestRecord)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {latestRecord.publicNote ? (
                      <Badge variant="secondary">Doctor note</Badge>
                    ) : null}
                    {latestRecord.prescriptions.length ? (
                      <Badge variant="secondary">Prescription</Badge>
                    ) : null}
                    {latestRecord.medicalCertificate ? (
                      <Badge variant="secondary">Certificate</Badge>
                    ) : null}
                  </div>
                  <Button asChild variant="outline" className="mt-4 h-10 rounded-xl">
                    <Link href="/patient/records">Open records</Link>
                  </Button>
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-[#12324d]/12 bg-[#fcfaf5] px-4 py-5 text-sm text-muted-foreground">
                  Doctor notes, prescriptions, and certificates will appear here after
                  your consultation.
                </p>
              )}
            </section>

            <section className="mt-4 rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Quick links
              </p>
              <div className="mt-4 grid gap-2">
                <SmallLink href="/patient/appointments" icon={<CalendarDays className="size-4" />}>
                  View appointments
                </SmallLink>
                <SmallLink href="/patient/records" icon={<FileText className="size-4" />}>
                  View records
                </SmallLink>
                <SmallLink href="/privacy" icon={<ShieldCheck className="size-4" />}>
                  Privacy notice
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
}: {
  href: string;
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-[#12324d]/10 bg-white px-4 py-5 transition-colors hover:bg-[#f7f2e8]"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
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

function buildRecordPreview(record: MedicalRecord) {
  const parts = [
    record.publicNote ? `Note: ${record.publicNote}` : "",
    record.recommendations ? `Advice: ${record.recommendations}` : "",
    record.prescriptions.length
      ? `${record.prescriptions.length} prescription item${record.prescriptions.length === 1 ? "" : "s"}`
      : "",
    record.medicalCertificate ? "Medical certificate issued" : "",
  ].filter(Boolean);

  return parts.join(" / ") || "A doctor record is ready for review.";
}
