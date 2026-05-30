"use client";

import { useEffect, useState } from "react";
import {
  Clock3,
  FileText,
  Pill,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import { dashboardPageTranslations } from "@/features/localization/dashboard-page-translations";
import { useLocale } from "@/features/localization/locale-provider";
import {
  getMyDoctorPatientDetail,
  getMyDoctorPatients,
  type DoctorPatientDetail,
  type DoctorPatientListItem,
} from "@/lib/medical-records-api";

export default function DoctorRecordsPage() {
  const { user } = useDoctorWorkspace();
  const { locale } = useLocale();
  const t = dashboardPageTranslations[locale].doctorRecords;
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<DoctorPatientListItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [detail, setDetail] = useState<DoctorPatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    void getMyDoctorPatients(user)
      .then((result) => {
        setPatients(result);
        setSelectedPatientId(result[0]?.patientId ?? "");
        setLoading(false);
      })
      .catch((nextError: unknown) => {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to load doctor patient records.",
        );
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user || !selectedPatientId) {
      return;
    }

    void getMyDoctorPatientDetail(user, selectedPatientId)
      .then((result) => {
        setDetail(result);
      })
      .catch((nextError: unknown) => {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to open patient record.",
        );
      });
  }, [selectedPatientId, user]);

  const value = query.trim().toLowerCase();
  const filteredPatients = !value
    ? patients
    : patients.filter((patient) =>
        `${patient.patientName} ${patient.latestConcern} ${patient.patientEmail}`
          .toLowerCase()
          .includes(value),
      );
  const detailLoading =
    !loading &&
    Boolean(selectedPatientId) &&
    detail?.patient._id !== selectedPatientId;

  return (
    <div className="w-full bg-[#f7f2e8]">
      <section className="relative overflow-hidden border-b border-[#12324d]/10 bg-[#082b45] text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="grid xl:grid-cols-[1.12fr_0.88fr]">
          <div className="relative px-6 py-7 sm:px-8">
            <p className="text-xs font-bold tracking-[0.18em] text-secondary uppercase">
              {t.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
              {t.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              {t.description}
            </p>
          </div>
          <div className="relative border-t border-white/15 px-6 py-7 sm:px-8 xl:border-t-0 xl:border-l">
            <p className="text-xs font-bold tracking-[0.16em] text-secondary uppercase">
              {t.linkedPatients}
            </p>
            <p className="mt-3 text-3xl font-bold">{patients.length}</p>
            <p className="mt-2 text-sm text-white/70">
              {t.linkedPatientsCopy}
            </p>
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-[320px_1fr]">
        <aside className="border-r border-[#12324d]/10 bg-[#fcfaf5] px-6 py-5 sm:px-8">
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-[#12324d]/10 bg-white px-4 shadow-[0_16px_40px_-36px_rgba(8,43,69,0.8)]">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none"
              aria-label={t.searchPlaceholder}
            />
          </div>

          <div className="mt-5 space-y-2">
            {filteredPatients.map((patient) => {
              const active = selectedPatientId === patient.patientId;
              return (
                <button
                  key={patient.patientId}
                  type="button"
                  onClick={() => {
                    setDetail(null);
                    setSelectedPatientId(patient.patientId);
                  }}
                  className={`w-full border px-4 py-4 text-left shadow-[0_16px_46px_-44px_rgba(8,43,69,0.9)] transition-all hover:-translate-y-0.5 ${
                    active
                      ? "rounded-2xl border-primary bg-primary text-primary-foreground"
                      : "rounded-2xl border-[#12324d]/10 bg-white hover:bg-primary/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{patient.patientName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {patient.age ? `${patient.age} years old` : "Age not set"} •{" "}
                        {formatSex(patient.sex)}
                      </p>
                    </div>
                    <Badge variant="outline" className="h-fit">
                      {patient.recordCount} records
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {patient.latestConcern}
                  </p>
                </button>
              );
            })}

            {!loading && filteredPatients.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-6 text-sm text-muted-foreground">
                {t.noPatients}
              </div>
            ) : null}
          </div>
        </aside>

        <div className="bg-[#fffdf8] px-6 py-5 sm:px-8">
          {error ? (
            <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-[#12324d]/10 bg-white px-5 py-10 text-sm text-muted-foreground shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)]">
              {t.loading}
            </div>
          ) : null}

          {!loading && detailLoading ? (
            <div className="rounded-2xl border border-[#12324d]/10 bg-white px-5 py-10 text-sm text-muted-foreground shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)]">
              {t.opening}
            </div>
          ) : null}

          {!loading && !detailLoading && detail ? (
            <PatientRecordPanels detail={detail} />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function PatientRecordPanels({ detail }: { detail: DoctorPatientDetail }) {
  const { patient, appointments, records } = detail;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#12324d]/10 bg-white px-5 py-5 shadow-[0_20px_60px_-52px_rgba(8,43,69,0.9)]">
          <div className="flex items-start gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <UserRound className="size-5" />
            </span>
            <div>
              <p className="font-bold">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {patient.age ? `${patient.age} years old` : "Age not set"} •{" "}
                {formatSex(patient.sex)}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <InfoRow label="Email" value={patient.email} />
            <InfoRow label="Mobile" value={patient.mobileNumber} />
            <InfoRow
              label="Known history"
              value={patient.basicMedicalHistory || "No medical history added yet."}
            />
            <InfoRow
              label="Allergies"
              value={patient.allergies.join(", ") || "None reported"}
            />
            <InfoRow
              label="Existing conditions"
              value={patient.existingConditions.join(", ") || "None reported"}
            />
          </div>
        </section>

        <section>
          <SectionHeader
            icon={<Clock3 className="size-5" />}
            title="Appointment history"
            copy="Consultations in this app, including sessions with other doctors"
            badge={`${appointments.length} records`}
          />
          <div className="mt-3 space-y-2">
            {appointments.map((appointment) => (
              <article
                key={appointment._id}
                className="grid gap-3 rounded-2xl border border-[#12324d]/10 bg-white px-4 py-4 shadow-[0_16px_42px_-38px_rgba(8,43,69,0.8)] sm:grid-cols-[150px_1fr_auto]"
              >
                <div>
                  <p className="text-sm font-bold text-primary">
                    {formatDate(appointment.scheduledStartAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTime(appointment.scheduledStartAt)} -{" "}
                    {formatTime(appointment.scheduledEndAt)}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">
                    {appointment.consultationLabel || appointment.specializationName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {appointment.doctorName} • {appointment.specializationName}
                  </p>
                </div>
                <Badge variant="outline" className="h-fit">
                  {formatStatus(appointment.status)}
                </Badge>
              </article>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            icon={<FileText className="size-5" />}
            title="Consultation notes"
            copy="Public notes from all doctors plus your private notes for future care"
            badge={`${records.length} records`}
          />
          <div className="mt-3 grid gap-2">
            {records.map((record) => (
              <article
                key={record._id}
                className="rounded-2xl border border-[#12324d]/10 bg-white px-4 py-4 shadow-[0_16px_42px_-38px_rgba(8,43,69,0.8)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{record.doctorName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {record.specializationName} • {formatDate(record.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline">Record</Badge>
                </div>

                <div className="mt-4 grid gap-3">
                  <RecordBubble
                    tone="public"
                    label="Public note"
                    value={record.publicNote || record.consultationSummary || "No public summary shared yet."}
                  />
                  {record.recommendations ? (
                    <RecordBubble
                      tone="public"
                      label="Recommendations"
                      value={record.recommendations}
                    />
                  ) : null}
                  {record.canViewPrivateNote ? (
                    <RecordBubble
                      tone="private"
                      label="Private doctor note"
                      value={record.privateNote || "No private note saved yet."}
                    />
                  ) : null}
                </div>
              </article>
            ))}
            {records.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-6 text-sm text-muted-foreground">
                No consultation notes have been saved for this patient yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section>
          <SectionHeader
            icon={<Pill className="size-5" />}
            title="Prescription history"
            copy="Medications previously issued in the app"
          />
          <div className="mt-3 space-y-2">
            {records.flatMap((record) =>
              record.prescriptions.map((item, index) => (
                <article
                  key={`${record._id}-${item.medicine}-${index}`}
                  className="rounded-2xl border border-[#12324d]/10 bg-white px-4 py-4 shadow-[0_16px_42px_-38px_rgba(8,43,69,0.8)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{item.medicine}</p>
                    <Badge variant="outline">{record.doctorName}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {[item.dosage, item.instruction, item.duration]
                      .filter(Boolean)
                      .join(" • ") || "No instruction added."}
                  </p>
                </article>
              )),
            )}
            {records.every((record) => record.prescriptions.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-6 text-sm text-muted-foreground">
                No prescriptions saved for this patient yet.
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-[#12324d]/10 bg-[#fcfaf5] px-5 py-5">
          <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-primary uppercase">
            <ShieldCheck className="size-4" />
            Access reminder
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Public consultation history and prescriptions can help with continuity of care. Private notes remain visible only to the doctor who authored them.
          </p>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  copy,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          {icon}
        </span>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm text-muted-foreground">{copy}</p>
        </div>
      </div>
      {badge ? <Badge variant="outline">{badge}</Badge> : null}
    </div>
  );
}

function RecordBubble({
  tone,
  label,
  value,
}: {
  tone: "public" | "private";
  label: string;
  value: string;
}) {
  return (
    <div
      className={
        tone === "public"
          ? "rounded-2xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3"
          : "rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3"
      }
    >
      <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[58%] text-right font-medium">{value}</span>
    </div>
  );
}

function formatSex(value: DoctorPatientListItem["sex"]) {
  return value === "prefer_not_to_say"
    ? "Prefer not to say"
    : value.charAt(0).toUpperCase() + value.slice(1);
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
