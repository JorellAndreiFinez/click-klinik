"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { FileText, HeartPulse, Pill } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

import { PatientWorkspaceShell } from "../patient-workspace-shell";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import {
  getMyPatientRecords,
  type PatientRecordsView,
} from "@/lib/medical-records-api";
import { getMyPatientProfile, type PatientProfile } from "@/lib/patient-api";

export default function PatientRecordsPage() {
  const router = useRouter();
  const configured = isFirebaseConfigured();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [recordsView, setRecordsView] = useState<PatientRecordsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(
    configured ? "Loading your health records..." : "Authentication is not configured yet.",
  );

  useEffect(() => {
    if (!configured) {
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      if (!nextUser) {
        router.replace("/auth");
        return;
      }

      void Promise.all([
        getMyPatientProfile(nextUser),
        getMyPatientRecords(nextUser),
      ])
        .then(([nextProfile, nextRecords]) => {
          setProfile(nextProfile);
          setRecordsView(nextRecords);
          setLoading(false);
        })
        .catch((error: unknown) => {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load your health records.",
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

  const prescriptionCount = useMemo(
    () =>
      recordsView?.records.reduce(
        (sum, record) => sum + record.prescriptions.length,
        0,
      ) ?? 0,
    [recordsView],
  );

  if (!profile) {
    return (
      <main className="clinic-grid flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <HeartPulse className="mx-auto size-10 text-primary" />
          <p className="mt-5 text-sm text-muted-foreground">{message}</p>
          {!configured ? null : (
            <Button
              className="mt-6 h-11 rounded-xl"
              onClick={() => router.push("/patient/portal")}
            >
              Back to portal
            </Button>
          )}
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
        <section className="border-b border-[#12324d]/10 bg-white px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Records
              </p>
              <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
                Doctor notes and prescriptions
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                View shared notes, prescriptions, and past consultations.
              </p>
            </div>
            <Badge variant="outline" className="h-9 rounded-full px-3">
              {recordsView?.records.length ?? 0} records / {prescriptionCount} prescriptions
            </Badge>
          </div>
        </section>

        <section className="grid xl:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-[#12324d]/10 bg-[#fffdf8] px-6 py-6 sm:px-8 xl:border-r xl:border-b-0">
            <SectionTitle title="Appointment history" />

            <div className="mt-4 space-y-3">
              {loading ? (
                <EmptyState copy="Loading your appointment history..." />
              ) : recordsView?.appointments.length ? (
                recordsView.appointments.map((appointment) => (
                  <article
                    key={appointment._id}
                    className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-primary">
                          {appointment.consultationLabel ||
                            appointment.specializationName}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {appointment.doctorName}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {formatStatus(appointment.status)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {formatDate(appointment.scheduledStartAt)} /{" "}
                      {formatTime(appointment.scheduledStartAt)} -{" "}
                      {formatTime(appointment.scheduledEndAt)}
                    </p>
                    {appointment.triage ? (
                      <div className="mt-3 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-3">
                        <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
                          Triage history
                        </p>
                        <p className="mt-2 text-sm font-semibold text-primary">
                          {appointment.triage.chiefComplaint}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {appointment.triage.detailedSymptoms}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Started: {formatDate(appointment.triage.onsetDate)} / Method:{" "}
                          {formatStatus(appointment.triage.consultMethod)}
                        </p>
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <EmptyState copy="No consultations yet." />
              )}
            </div>
          </div>

          <div className="bg-[#fcfaf5] px-6 py-6 sm:px-8">
            <SectionTitle title="Shared medical records" />

            <div className="mt-4 space-y-4">
              {loading ? (
                <EmptyState copy="Loading your doctor notes..." />
              ) : recordsView?.records.length ? (
                recordsView.records.map((record) => (
                  <article
                    key={record._id}
                    className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{record.doctorName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {record.specializationName} / {formatDate(record.createdAt)}
                        </p>
                      </div>
                      <Badge variant="secondary">Shared</Badge>
                    </div>

                    <RecordBlock
                      icon={<FileText className="size-4" />}
                      label="Doctor note"
                      value={
                        record.consultationSummary ||
                        record.publicNote ||
                        "No consultation summary was shared yet."
                      }
                    />

                    {record.recommendations ? (
                      <RecordBlock
                        label="Care advice"
                        value={record.recommendations}
                      />
                    ) : null}

                    <div className="mt-3 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4">
                      <p className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-primary uppercase">
                        <Pill className="size-4" />
                        Prescriptions
                      </p>
                      <div className="mt-3 space-y-2">
                        {record.prescriptions.length ? (
                          record.prescriptions.map((item, index) => (
                            <div
                              key={`${record._id}-${item.medicine}-${index}`}
                              className="rounded-lg border border-[#12324d]/10 bg-white px-3 py-3"
                            >
                              <p className="font-semibold">{item.medicine}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {[item.dosage, item.instruction, item.duration]
                                  .filter(Boolean)
                                  .join(" / ") || "No extra instructions added."}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No prescriptions were attached to this consultation.
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState copy="No doctor notes have been shared yet." />
              )}
            </div>
          </div>
        </section>
      </div>
    </PatientWorkspaceShell>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="text-sm font-bold tracking-[0.14em] text-primary uppercase">
      {title}
    </p>
  );
}

function RecordBlock({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="mt-3 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4">
      <p className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-primary uppercase">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

function EmptyState({ copy }: { copy: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#12324d]/12 bg-white px-4 py-6 text-sm text-muted-foreground">
      {copy}
    </div>
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

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
