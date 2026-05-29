"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardPenLine,
  FileText,
  Pill,
  Plus,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import { getMyDoctorAppointments, type Appointment } from "@/lib/appointments-api";
import {
  getMyDoctorAppointmentRecord,
  saveMyDoctorAppointmentRecord,
  type PrescriptionItem,
} from "@/lib/medical-records-api";

type EditablePrescription = PrescriptionItem & { id: string };

export default function DoctorNotesPage() {
  const { user } = useDoctorWorkspace();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [consultationSummary, setConsultationSummary] = useState("");
  const [publicNote, setPublicNote] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [prescriptions, setPrescriptions] = useState<EditablePrescription[]>([
    createPrescription(),
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    void getMyDoctorAppointments(user)
      .then((result) => {
        setAppointments(result);
        setSelectedAppointmentId(result[0]?._id ?? "");
        setLoading(false);
      })
      .catch((error: unknown) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load doctor consultations.",
        );
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user || !selectedAppointmentId) {
      return;
    }

    void getMyDoctorAppointmentRecord(user, selectedAppointmentId)
      .then((record) => {
        setConsultationSummary(record?.consultationSummary ?? "");
        setPublicNote(record?.publicNote ?? "");
        setPrivateNote(record?.privateNote ?? "");
        setRecommendations(record?.recommendations ?? "");
        setPrescriptions(
          record?.prescriptions.length
            ? record.prescriptions.map((item) => createPrescription(item))
            : [createPrescription()],
        );
      })
      .catch((error: unknown) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load consultation notes.",
        );
      });
  }, [selectedAppointmentId, user]);

  const selectedAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment._id === selectedAppointmentId) ??
      null,
    [appointments, selectedAppointmentId],
  );

  async function handleSave() {
    if (!user || !selectedAppointmentId) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await saveMyDoctorAppointmentRecord(user, selectedAppointmentId, {
        consultationSummary,
        publicNote,
        privateNote,
        recommendations,
        prescriptions: prescriptions
          .map((item) => ({
            medicine: item.medicine,
            dosage: item.dosage,
            instruction: item.instruction,
            duration: item.duration,
          }))
          .filter((item) => item.medicine.trim()),
      });
      setMessage("Consultation notes and prescriptions saved.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save notes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full bg-[#f7f2e8]">
      <section className="border-b border-[#12324d]/10 bg-white">
        <div className="grid xl:grid-cols-[1.08fr_0.92fr]">
          <div className="px-6 py-7 sm:px-8">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Notes & prescriptions
            </p>
            <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
              Save consultation notes while the care context is fresh.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Add public notes for the patient, private notes for your future consultations, and prescriptions linked to the appointment.
            </p>
          </div>
          <div className="border-t border-[#12324d]/10 px-6 py-7 sm:px-8 xl:border-t-0 xl:border-l">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-primary uppercase">
              <ShieldCheck className="size-4" />
              Documentation safety
            </p>
            <div className="mt-4 rounded-xl bg-[#e8f5ee] px-4 py-3 text-sm text-[#12734b]">
              This tool provides guidance only and does not replace professional medical advice.
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Public notes appear on the patient dashboard. Private notes stay visible only to you for future consultations.
            </p>
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-[1.08fr_0.92fr]">
        <div className="border-r border-[#12324d]/10 bg-[#fffdf8] px-6 py-5 sm:px-8">
          {message ? (
            <div className="mb-4 rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3 text-sm text-primary">
              {message}
            </div>
          ) : null}

          <div className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Select consultation</span>
              <select
                value={selectedAppointmentId}
                onChange={(event) => setSelectedAppointmentId(event.target.value)}
                className="h-12 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm outline-none"
              >
                {appointments.map((appointment) => (
                  <option key={appointment._id} value={appointment._id}>
                    {appointment.patientName} • {formatDate(appointment.scheduledStartAt)} •{" "}
                    {appointment.consultationLabel || appointment.specializationName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="mt-5 rounded-xl border border-[#12324d]/10 bg-white px-5 py-10 text-sm text-muted-foreground">
              Loading consultation notes...
            </div>
          ) : null}

          {!loading && selectedAppointment ? (
            <div className="mt-5 grid gap-4">
              {selectedAppointment.triage ? (
                <div className="rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-4">
                  <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
                    Patient triage before booking
                  </p>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <InfoLine label="Chief complaint" value={selectedAppointment.triage.chiefComplaint} />
                    <InfoLine label="Consult method" value={formatTriageValue(selectedAppointment.triage.consultMethod)} />
                    <InfoLine label="Onset" value={formatDate(selectedAppointment.triage.onsetDate)} />
                    <InfoLine label="Smokes" value={formatTriageValue(selectedAppointment.triage.smokes)} />
                    <InfoLine label="Alcohol" value={formatTriageValue(selectedAppointment.triage.drinksAlcohol)} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {selectedAppointment.triage.detailedSymptoms}
                  </p>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <p><strong>Allergies:</strong> {selectedAppointment.triage.allergies.join(", ") || "None listed"}</p>
                    <p><strong>Meds:</strong> {selectedAppointment.triage.medications.join(", ") || "None listed"}</p>
                    <p><strong>Problems:</strong> {selectedAppointment.triage.healthProblems.join(", ") || "None listed"}</p>
                  </div>
                </div>
              ) : null}
              <FieldBlock
                label="Consultation summary"
                value={consultationSummary}
                onChange={setConsultationSummary}
                placeholder="Short structured summary of the consultation."
              />
              <FieldBlock
                label="Public note for patient"
                value={publicNote}
                onChange={setPublicNote}
                placeholder="Patient-facing explanation, findings, and next steps."
              />
              <FieldBlock
                label="Private doctor note"
                value={privateNote}
                onChange={setPrivateNote}
                placeholder="Your internal observations for future consultations."
              />
              <FieldBlock
                label="Recommendations"
                value={recommendations}
                onChange={setRecommendations}
                placeholder="Lifestyle, monitoring, follow-up, or referral recommendations."
              />
            </div>
          ) : null}
        </div>

        <aside className="bg-[#fcfaf5] px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <Pill className="size-5" />
              </span>
              <div>
                <p className="font-bold">Prescription builder</p>
                <p className="text-sm text-muted-foreground">
                  Add medications and instructions
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => setPrescriptions((current) => [...current, createPrescription()])}
            >
              <Plus className="size-4" />
              Add item
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {prescriptions.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4"
              >
                <div className="grid gap-3">
                  <input
                    value={item.medicine}
                    onChange={(event) =>
                      setPrescriptions((current) =>
                        current.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, medicine: event.target.value }
                            : entry,
                        ),
                      )
                    }
                    placeholder="Medicine"
                    className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm outline-none"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={item.dosage ?? ""}
                      onChange={(event) =>
                        setPrescriptions((current) =>
                          current.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, dosage: event.target.value }
                              : entry,
                          ),
                        )
                      }
                      placeholder="Dosage"
                      className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm outline-none"
                    />
                    <input
                      value={item.duration ?? ""}
                      onChange={(event) =>
                        setPrescriptions((current) =>
                          current.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, duration: event.target.value }
                              : entry,
                          ),
                        )
                      }
                      placeholder="Duration"
                      className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm outline-none"
                    />
                  </div>
                  <textarea
                    value={item.instruction ?? ""}
                    onChange={(event) =>
                      setPrescriptions((current) =>
                        current.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, instruction: event.target.value }
                            : entry,
                        ),
                      )
                    }
                    placeholder="Instruction"
                    rows={3}
                    className="min-h-24 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-3 text-sm outline-none"
                  />
                </div>
              </article>
            ))}
          </div>

          {selectedAppointment ? (
            <div className="mt-6 rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <ClipboardPenLine className="size-5" />
                </span>
                <div>
                  <p className="font-bold">Ready to finalize</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.patientName} • {formatDate(selectedAppointment.scheduledStartAt)}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button className="h-11 rounded-xl" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? "Saving..." : "Save notes"}
                </Button>
                <Badge variant="outline" className="h-11 rounded-xl px-4">
                  {selectedAppointment.consultationLabel || selectedAppointment.specializationName}
                </Badge>
              </div>
            </div>
          ) : null}

          {!selectedAppointment && !loading ? (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-white px-5 py-8 text-sm text-muted-foreground">
              No consultation is available for note writing yet.
            </div>
          ) : null}

          {selectedAppointment ? (
            <div className="mt-6 rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <FileText className="size-5" />
                </span>
                <div>
                  <p className="font-bold">Notes style</p>
                  <p className="text-sm text-muted-foreground">
                    Public and private note channels
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <ConversationBubble
                  tone="public"
                  title="Public note"
                  copy="Visible to the patient in their records dashboard after consultation."
                />
                <ConversationBubble
                  tone="private"
                  title="Private note"
                  copy="Visible only to the authoring doctor for future consultations."
                />
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function FieldBlock({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="min-h-28 rounded-xl border border-[#12324d]/10 bg-white px-4 py-3 text-sm leading-6 outline-none"
      />
    </label>
  );
}

function ConversationBubble({
  tone,
  title,
  copy,
}: {
  tone: "public" | "private";
  title: string;
  copy: string;
}) {
  return (
    <div
      className={
        tone === "public"
          ? "rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3"
          : "rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3"
      }
    >
      <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#12324d]/10 bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-semibold text-primary">{value}</p>
    </div>
  );
}

function createPrescription(item?: PrescriptionItem): EditablePrescription {
  return {
    id: Math.random().toString(36).slice(2, 10),
    medicine: item?.medicine ?? "",
    dosage: item?.dosage ?? "",
    instruction: item?.instruction ?? "",
    duration: item?.duration ?? "",
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTriageValue(value: string) {
  return value.replace(/_/g, " ");
}
