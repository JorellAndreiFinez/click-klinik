"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ChevronRight,
  Download,
  FileBadge2,
  FileText,
  HeartPulse,
  Pill,
  Search,
  ShieldCheck,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

import { PatientWorkspaceShell } from "../patient-workspace-shell";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardPageTranslations } from "@/features/localization/dashboard-page-translations";
import { useLocale } from "@/features/localization/locale-provider";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import {
  getMyPatientRecords,
  type PatientRecordsView,
} from "@/lib/medical-records-api";
import { getMyPatientProfile, type PatientProfile } from "@/lib/patient-api";
import { cn } from "@/lib/utils";

type RecordTypeFilter = "all" | "notes" | "prescriptions" | "certificates";

export default function PatientRecordsPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = dashboardPageTranslations[locale].patientRecords;
  const configured = isFirebaseConfigured();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [recordsView, setRecordsView] = useState<PatientRecordsView | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [recordTypeFilter, setRecordTypeFilter] =
    useState<RecordTypeFilter>("all");
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
          setSelectedRecordId(nextRecords.records[0]?._id ?? "");
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
  const certificateCount = useMemo(
    () =>
      recordsView?.records.filter((record) => Boolean(record.medicalCertificate))
        .length ?? 0,
    [recordsView],
  );
  const noteCount = useMemo(
    () =>
      recordsView?.records.filter(
        (record) =>
          Boolean(record.consultationSummary) ||
          Boolean(record.publicNote) ||
          Boolean(record.recommendations),
      ).length ?? 0,
    [recordsView],
  );
  const sortedRecords = useMemo(
    () =>
      [...(recordsView?.records ?? [])].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [recordsView],
  );
  const filteredRecords = useMemo(() => {
    const normalizedSearch = recordSearch.trim().toLowerCase();

    return sortedRecords.filter((record) => {
      if (recordTypeFilter === "notes") {
        if (
          !record.consultationSummary &&
          !record.publicNote &&
          !record.recommendations
        ) {
          return false;
        }
      }

      if (
        recordTypeFilter === "prescriptions" &&
        record.prescriptions.length === 0
      ) {
        return false;
      }

      if (recordTypeFilter === "certificates" && !record.medicalCertificate) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        record.doctorName,
        record.specializationName,
        record.consultationSummary,
        record.publicNote,
        record.recommendations,
        record.medicalCertificate?.title,
        record.prescriptions.map((prescription) => prescription.medicine).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [recordSearch, recordTypeFilter, sortedRecords]);
  const selectedRecord = useMemo(
    () =>
      filteredRecords.find((record) => record._id === selectedRecordId) ??
      filteredRecords[0] ??
      null,
    [filteredRecords, selectedRecordId],
  );
  const latestAppointment = recordsView?.appointments[0] ?? null;

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
        <section className="relative overflow-hidden border-b border-[#12324d]/10 bg-[#082b45] px-6 py-7 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-24 top-0 size-72 rounded-full bg-secondary/20 blur-3xl" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-secondary uppercase">
                {t.eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                {t.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                {t.description}
              </p>
            </div>
            <div className="relative rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur">
              <p className="font-bold">{t.privacyProtected}</p>
              <p className="mt-1 text-white/70">
                {t.privacyCopy}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <RecordStat label={t.doctorNotes} value={noteCount} />
            <RecordStat label={t.prescriptions} value={prescriptionCount} />
            <RecordStat label={t.certificates} value={certificateCount} />
          </div>
        </section>

        <section className="grid min-h-[620px] lg:grid-cols-[360px_1fr]">
          <aside className="border-b border-[#12324d]/10 bg-[#fffdf8] px-6 py-6 sm:px-8 lg:border-r lg:border-b-0">
            <SectionTitle title={t.findDocument} />
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t.filterCopy}
            </p>

            <div className="mt-5 flex h-12 items-center gap-3 rounded-2xl border border-[#12324d]/10 bg-white px-4">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={recordSearch}
                onChange={(event) => setRecordSearch(event.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <RecordFilterButton
                active={recordTypeFilter === "all"}
                onClick={() => setRecordTypeFilter("all")}
              >
                {t.all}
              </RecordFilterButton>
              <RecordFilterButton
                active={recordTypeFilter === "notes"}
                onClick={() => setRecordTypeFilter("notes")}
              >
                {t.notes}
              </RecordFilterButton>
              <RecordFilterButton
                active={recordTypeFilter === "prescriptions"}
                onClick={() => setRecordTypeFilter("prescriptions")}
              >
                {t.rx}
              </RecordFilterButton>
              <RecordFilterButton
                active={recordTypeFilter === "certificates"}
                onClick={() => setRecordTypeFilter("certificates")}
              >
                {t.certificates}
              </RecordFilterButton>
            </div>

            {latestAppointment ? (
              <div className="mt-5 rounded-2xl border border-[#12324d]/10 bg-white px-4 py-4">
                <p className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-primary uppercase">
                  <CalendarDays className="size-4" />
                  {t.latestVisit}
                </p>
                <p className="mt-3 font-bold text-primary">
                  {latestAppointment.consultationLabel || latestAppointment.specializationName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(latestAppointment.scheduledStartAt)} with {latestAppointment.doctorName}
                </p>
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {loading ? (
                <EmptyState copy={t.loadingRecords} />
              ) : filteredRecords.length ? (
                filteredRecords.map((record) => (
                  <RecordListButton
                    key={record._id}
                    record={record}
                    active={selectedRecord?._id === record._id}
                    onClick={() => setSelectedRecordId(record._id)}
                  />
                ))
              ) : (
                <EmptyState copy={t.noMatch} />
              )}
            </div>
          </aside>

          <main className="bg-[#fcfaf5] px-6 py-6 sm:px-8">
            {loading ? (
              <EmptyState copy={t.loadingRecords} />
            ) : selectedRecord ? (
              <article className="overflow-hidden rounded-[28px] border border-[#12324d]/10 bg-white shadow-[0_24px_80px_-60px_rgba(8,43,69,0.95)]">
                <div className="border-b border-[#12324d]/10 bg-[#fffdf8] px-5 py-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                      {t.patientPacket}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-primary">
                        {selectedRecord.doctorName}
                      </h2>
                      <p className="mt-1 text-base text-muted-foreground">
                        {selectedRecord.specializationName} / {formatDate(selectedRecord.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl bg-white"
                        onClick={() => downloadPrescriptionPdf(selectedRecord, profile)}
                        disabled={!selectedRecord.prescriptions.length}
                      >
                        <Download className="size-4" />
                        {t.prescriptionPdf}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl bg-white"
                        onClick={() => downloadMedicalCertificatePdf(selectedRecord, profile)}
                        disabled={!selectedRecord.medicalCertificate}
                      >
                        <Download className="size-4" />
                        {t.certificatePdf}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5">
                  <PatientFriendlyNotice
                    title={t.reminderTitle}
                    copy={t.reminderCopy}
                  />

                  <RecordSection
                    icon={<FileText className="size-5" />}
                    title={t.doctorNotes}
                    description="The doctor's patient-friendly summary and advice from your consultation."
                  >
                    {selectedRecord.consultationSummary ? (
                      <RecordBlock label="Consultation summary" value={selectedRecord.consultationSummary} />
                    ) : null}
                    {selectedRecord.publicNote ? (
                      <RecordBlock label="Doctor note for you" value={selectedRecord.publicNote} tone="public" />
                    ) : null}
                    {selectedRecord.recommendations ? (
                      <RecordBlock label="Care advice" value={selectedRecord.recommendations} />
                    ) : null}
                    {!selectedRecord.consultationSummary &&
                    !selectedRecord.publicNote &&
                    !selectedRecord.recommendations ? (
                      <p className="rounded-xl border border-dashed border-[#12324d]/15 bg-[#fcfaf5] px-4 py-5 text-sm text-muted-foreground">
                        No shared note yet for this consultation.
                      </p>
                    ) : null}
                  </RecordSection>

                  <RecordSection
                    icon={<Pill className="size-5" />}
                    title={t.prescriptions}
                    description="Medicines and instructions shared by your doctor."
                  >
                    {selectedRecord.prescriptions.length ? (
                      <div className="overflow-hidden rounded-2xl border border-[#12324d]/10 bg-[#fffdf8]">
                        <div className="flex items-center justify-between gap-3 border-b border-[#12324d]/10 bg-white px-4 py-3">
                          <div>
                            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                              Rx order
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Follow exactly as instructed by your doctor.
                            </p>
                          </div>
                          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">
                            {selectedRecord.prescriptions.length} item
                            {selectedRecord.prescriptions.length === 1
                              ? ""
                              : "s"}
                          </span>
                        </div>
                        {selectedRecord.prescriptions.map((item, index) => (
                          <div
                            key={`${selectedRecord._id}-${item.medicine}-${index}`}
                            className="grid gap-3 border-b border-[#12324d]/10 px-4 py-4 last:border-b-0 md:grid-cols-[56px_1fr]"
                          >
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-lg font-black text-primary">
                              Rx
                            </div>
                            <div>
                              <p className="text-lg font-bold text-primary">
                                {item.medicine}
                              </p>
                              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                <MiniInfo
                                  label="Dosage"
                                  value={item.dosage || "-"}
                                />
                                <MiniInfo
                                  label="Duration"
                                  value={item.duration || "-"}
                                />
                                <MiniInfo
                                  label="Instruction"
                                  value={item.instruction || "-"}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-[#12324d]/15 bg-[#fcfaf5] px-4 py-5 text-sm text-muted-foreground">
                        No prescriptions were attached to this consultation.
                      </p>
                    )}
                  </RecordSection>

                  <RecordSection
                    icon={<FileBadge2 className="size-5" />}
                    title={t.medicalCertificate}
                    description="Formal certificate issued only when your doctor publishes one."
                  >
                    {selectedRecord.medicalCertificate ? (
                      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white px-5 py-5">
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl font-black uppercase tracking-[0.2em] text-emerald-900/[0.035]">
                          Click Klinik
                        </div>
                        <div className="relative">
                          <p className="text-xs font-bold tracking-[0.18em] text-emerald-700 uppercase">
                            Verified certificate
                          </p>
                          <h4 className="mt-2 text-xl font-bold text-primary">
                            {selectedRecord.medicalCertificate.title ||
                              "Medical Certificate"}
                          </h4>
                          <p className="mt-4 line-clamp-6 whitespace-pre-line rounded-xl border border-[#12324d]/10 bg-[#fcfaf5]/90 px-4 py-4 text-sm leading-7 text-muted-foreground">
                            {selectedRecord.medicalCertificate.body ||
                              "Issued by your doctor after consultation review."}
                          </p>
                          {selectedRecord.medicalCertificate.remarks ? (
                            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-900">
                              Verification note:{" "}
                              {selectedRecord.medicalCertificate.remarks}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-[#12324d]/15 bg-[#fcfaf5] px-4 py-5 text-sm text-muted-foreground">
                        No medical certificate was issued for this consultation.
                      </p>
                    )}
                  </RecordSection>
                </div>
              </article>
            ) : (
              <EmptyState copy="No records available yet. Completed consultations will appear here once your doctor shares notes." />
            )}
          </main>
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

function RecordStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white px-4 py-3 shadow-[0_18px_48px_-44px_rgba(8,43,69,0.9)]">
      <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

function RecordFilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 rounded-xl border text-sm font-bold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-[#12324d]/10 bg-white text-primary hover:bg-secondary/20",
      )}
    >
      {children}
    </button>
  );
}

function RecordListButton({
  record,
  active,
  onClick,
}: {
  record: PatientRecordsView["records"][number];
  active: boolean;
  onClick: () => void;
}) {
  const documentCount =
    Number(Boolean(record.consultationSummary || record.publicNote || record.recommendations)) +
    Number(record.prescriptions.length > 0) +
    Number(Boolean(record.medicalCertificate));

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-4 text-left shadow-[0_16px_44px_-42px_rgba(8,43,69,0.9)] transition-all hover:-translate-y-0.5 ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-[#12324d]/10 bg-white text-primary hover:border-primary/35"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{record.doctorName}</p>
          <p className={`mt-1 text-sm ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
            {formatDate(record.createdAt)}
          </p>
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {record.prescriptions.length ? (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-white/15" : "bg-secondary/70"}`}>
            RX
          </span>
        ) : null}
        {record.medicalCertificate ? (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-white/15" : "bg-emerald-100 text-emerald-900"}`}>
            Certificate
          </span>
        ) : null}
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-white/15" : "bg-[#f7f2e8]"}`}>
          {documentCount || 1} item{documentCount === 1 ? "" : "s"}
        </span>
      </div>
    </button>
  );
}

function PatientFriendlyNotice({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-2xl border border-[#12324d]/10 bg-[#e8f5ee] px-4 py-4">
      <div className="flex gap-3">
        <ShieldCheck className="mt-1 size-5 shrink-0 text-[#12734b]" />
        <div>
          <p className="font-bold text-primary">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {copy}
          </p>
        </div>
      </div>
    </div>
  );
}

function RecordSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#12324d]/10 bg-white px-4 py-4">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          {icon}
        </span>
        <div>
          <h3 className="text-xl font-bold text-primary">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function RecordBlock({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  tone?: "default" | "public";
}) {
  const toneClass =
    tone === "public"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-[#12324d]/10 bg-[#fcfaf5] text-muted-foreground";

  return (
    <div className={`mt-3 rounded-xl border px-4 py-4 ${toneClass}`}>
      <p className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-primary uppercase">
        {icon}
        {label}
      </p>
      <p className="mt-2 whitespace-pre-line text-sm leading-6">{value}</p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-white px-3 py-3">
      <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5 text-primary">
        {value}
      </p>
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

function downloadPrescriptionPdf(
  record: PatientRecordsView["records"][number],
  profile: PatientProfile,
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return;
  }

  const patientName = `${profile.firstName} ${profile.lastName}`;
  const prescriptions = record.prescriptions
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.medicine)}</td>
          <td>${escapeHtml(item.dosage || "-")}</td>
          <td>${escapeHtml(item.duration || "-")}</td>
          <td>${escapeHtml(item.instruction || "-")}</td>
        </tr>
      `,
    )
    .join("");
  const signatureMarkup = record.doctorSignatureDataUrl
    ? `<img class="signature-image" src="${record.doctorSignatureDataUrl}" alt="Doctor digital signature" />`
    : `<div class="sign-name">${escapeHtml(record.doctorSignatureText || record.doctorName)}</div>`;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Click Klinik Prescription</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body {
            color: #082b45;
            font-family: Georgia, "Times New Roman", serif;
            margin: 0;
          }
          .paper {
            min-height: 94vh;
            position: relative;
          }
          .watermark {
            color: rgba(8, 43, 69, 0.07);
            font-size: 76px;
            font-weight: 800;
            left: 50%;
            letter-spacing: 8px;
            position: fixed;
            text-transform: uppercase;
            top: 48%;
            transform: translate(-50%, -50%) rotate(-28deg);
            white-space: nowrap;
            z-index: 0;
          }
          .content { position: relative; z-index: 1; }
          header {
            border-bottom: 2px solid #082b45;
            padding-bottom: 14px;
          }
          h1 { font-size: 28px; margin: 0; }
          .muted { color: #49657a; font-size: 13px; }
          .grid {
            display: grid;
            gap: 10px;
            grid-template-columns: 1fr 1fr;
            margin-top: 20px;
          }
          .box {
            border: 1px solid #d8d0c2;
            border-radius: 10px;
            padding: 12px;
          }
          .label {
            color: #49657a;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .value { font-size: 15px; font-weight: 700; margin-top: 5px; }
          table {
            border-collapse: collapse;
            margin-top: 24px;
            width: 100%;
          }
          th, td {
            border: 1px solid #d8d0c2;
            font-size: 13px;
            padding: 10px;
            text-align: left;
            vertical-align: top;
          }
          th { background: #f7f2e8; }
          .signature {
            margin-left: auto;
            margin-top: 70px;
            text-align: center;
            width: 260px;
          }
          .sign-name {
            border-bottom: 1px solid #082b45;
            font-family: "Brush Script MT", cursive;
            font-size: 28px;
            padding-bottom: 4px;
          }
          .signature-image {
            border-bottom: 1px solid #082b45;
            height: 72px;
            object-fit: contain;
            width: 100%;
          }
          .seal {
            border: 2px solid rgba(8, 43, 69, 0.22);
            border-radius: 999px;
            color: rgba(8, 43, 69, 0.32);
            display: inline-block;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 2px;
            margin-top: 10px;
            padding: 12px 18px;
            text-transform: uppercase;
            transform: rotate(-8deg);
          }
          footer {
            border-top: 1px solid #d8d0c2;
            bottom: 0;
            color: #49657a;
            font-size: 11px;
            padding-top: 10px;
            position: absolute;
            width: 100%;
          }
        </style>
      </head>
      <body>
        <div class="paper">
          <div class="watermark">click-klinik</div>
          <div class="content">
            <header>
              <h1>Click Klinik Prescription</h1>
              <p class="muted">Secure telehealth prescription copy with wet-style watermark.</p>
            </header>
            <section class="grid">
              <div class="box">
                <div class="label">Patient</div>
                <div class="value">${escapeHtml(patientName)}</div>
              </div>
              <div class="box">
                <div class="label">Issued</div>
                <div class="value">${escapeHtml(formatDate(record.createdAt))}</div>
              </div>
              <div class="box">
                <div class="label">Doctor</div>
                <div class="value">${escapeHtml(record.doctorName)}</div>
              </div>
              <div class="box">
                <div class="label">Specialization</div>
                <div class="value">${escapeHtml(record.specializationName)}</div>
              </div>
            </section>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>${prescriptions}</tbody>
            </table>
            <section class="signature">
              ${signatureMarkup}
              <strong>${escapeHtml(record.doctorName)}</strong>
              <div class="muted">Doctor signature</div>
              <div class="seal">Click Klinik Verified</div>
            </section>
          </div>
          <footer>
            This tool provides guidance only and does not replace professional medical advice.
            Watermark: click-klinik. Verify through your Click Klinik patient record.
          </footer>
        </div>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function downloadMedicalCertificatePdf(
  record: PatientRecordsView["records"][number],
  profile: PatientProfile,
) {
  if (!record.medicalCertificate) {
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return;
  }

  const patientName = `${profile.firstName} ${profile.lastName}`;
  const issuedAt = record.medicalCertificate.issuedAt || record.createdAt;
  const certificateBody = escapeHtml(
    record.medicalCertificate.body ||
      "This medical certificate was issued after a Click Klinik consultation.",
  ).replace(/\n/g, "<br />");
  const signatureMarkup = record.doctorSignatureDataUrl
    ? `<img class="signature-image" src="${record.doctorSignatureDataUrl}" alt="Doctor digital signature" />`
    : `<div class="sign-name">${escapeHtml(record.doctorSignatureText || record.doctorName)}</div>`;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Click Klinik Medical Certificate</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body {
            color: #082b45;
            font-family: Georgia, "Times New Roman", serif;
            margin: 0;
            background: #ffffff;
          }
          .paper {
            box-sizing: border-box;
            min-height: 277mm;
            padding: 18mm 18mm 16mm;
            position: relative;
          }
          .watermark {
            color: rgba(8, 43, 69, 0.045);
            font-size: 72px;
            font-weight: 900;
            left: 50%;
            letter-spacing: 8px;
            position: fixed;
            text-transform: uppercase;
            top: 48%;
            transform: translate(-50%, -50%) rotate(-28deg);
            white-space: nowrap;
            z-index: 0;
          }
          .content { position: relative; z-index: 1; }
          header {
            align-items: center;
            border-bottom: 1.5px solid #082b45;
            display: flex;
            gap: 14px;
            padding-bottom: 20px;
          }
          .logo {
            align-items: center;
            background: #ffd92e;
            border: 1px solid #082b45;
            border-radius: 14px;
            display: flex;
            font-family: Arial, sans-serif;
            font-weight: 900;
            height: 50px;
            justify-content: center;
            width: 50px;
          }
          h1 { font-size: 24px; letter-spacing: 0.5px; margin: 0; }
          .muted { color: #49657a; font-size: 12px; line-height: 1.6; }
          .title {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 2.4px;
            margin-top: 34px;
            text-align: center;
            text-transform: uppercase;
          }
          .subtitle {
            color: #49657a;
            font-size: 12px;
            letter-spacing: 1.2px;
            margin-top: 8px;
            text-align: center;
            text-transform: uppercase;
          }
          .grid {
            display: grid;
            gap: 14px;
            grid-template-columns: 1fr 1fr;
            margin-top: 34px;
          }
          .box {
            border: 1px solid #d8d0c2;
            border-radius: 4px;
            min-height: 45px;
            padding: 14px 16px;
          }
          .label {
            color: #49657a;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .value { font-size: 15px; font-weight: 700; margin-top: 5px; }
          .body {
            border: 1px solid #d8d0c2;
            border-radius: 4px;
            font-size: 16px;
            line-height: 1.95;
            margin-top: 34px;
            min-height: 220px;
            padding: 30px 32px;
            text-align: justify;
          }
          .remarks {
            background: #f7f2e8;
            border: 1px solid #d8d0c2;
            border-radius: 4px;
            font-size: 13px;
            line-height: 1.6;
            margin-top: 22px;
            padding: 14px 16px;
          }
          .signature {
            margin-left: auto;
            margin-top: 58px;
            text-align: center;
            width: 280px;
          }
          .sign-name {
            border-bottom: 1px solid #082b45;
            font-family: "Brush Script MT", cursive;
            font-size: 28px;
            padding-bottom: 4px;
          }
          .signature-image {
            border-bottom: 1px solid #082b45;
            height: 72px;
            object-fit: contain;
            width: 100%;
          }
          .seal {
            border: 2px solid rgba(8, 43, 69, 0.22);
            border-radius: 999px;
            color: rgba(8, 43, 69, 0.32);
            display: inline-block;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 2px;
            margin-top: 12px;
            padding: 12px 18px;
            text-transform: uppercase;
            transform: rotate(-8deg);
          }
          footer {
            border-top: 1px solid #d8d0c2;
            bottom: 0;
            color: #49657a;
            font-size: 10px;
            left: 18mm;
            line-height: 1.5;
            padding-top: 12px;
            position: absolute;
            right: 18mm;
          }
          .footer-text {
            max-width: 100%;
            overflow-wrap: anywhere;
          }
        </style>
      </head>
      <body>
        <div class="paper">
          <div class="watermark">click-klinik</div>
          <div class="content">
            <header>
              <div class="logo">CK</div>
              <div>
                <h1>Click Klinik</h1>
                <p class="muted">Secure telehealth document with digital signature verification.</p>
              </div>
            </header>

            <div class="title">${escapeHtml(
              record.medicalCertificate.title || "Medical Certificate",
            )}</div>
            <div class="subtitle">Official Telehealth Documentation</div>

            <section class="grid">
              <div class="box">
                <div class="label">Patient</div>
                <div class="value">${escapeHtml(patientName)}</div>
              </div>
              <div class="box">
                <div class="label">Issued</div>
                <div class="value">${escapeHtml(formatDate(issuedAt))}</div>
              </div>
              <div class="box">
                <div class="label">Doctor</div>
                <div class="value">${escapeHtml(record.doctorName)}</div>
              </div>
              <div class="box">
                <div class="label">Specialization</div>
                <div class="value">${escapeHtml(record.specializationName)}</div>
              </div>
            </section>

            <section class="body">${certificateBody}</section>
            ${
              record.medicalCertificate.remarks
                ? `<section class="remarks"><strong>Remarks:</strong> ${escapeHtml(
                    record.medicalCertificate.remarks,
                  )}</section>`
                : ""
            }

            <section class="signature">
              ${signatureMarkup}
              <strong>${escapeHtml(record.doctorName)}</strong>
              <div class="muted">Licensed doctor signature</div>
              <div class="seal">Click Klinik Verified</div>
            </section>
          </div>
          <footer>
            <div class="footer-text">
              Verification ID: ${escapeHtml(record._id)} / Appointment: ${escapeHtml(
                record.appointmentId,
              )}. This certificate is based on the telehealth consultation record and should be verified in Click Klinik.
            </div>
          </footer>
        </div>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
