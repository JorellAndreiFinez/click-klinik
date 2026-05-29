"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ClipboardPenLine,
  Edit3,
  FileBadge2,
  PenLine,
  Pill,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import { getMyDoctorAppointments, type Appointment } from "@/lib/appointments-api";
import {
  getMyDoctorPatientDetail,
  getMyDoctorAppointmentRecord,
  saveMyDoctorAppointmentCertificate,
  saveMyDoctorAppointmentRecord,
  type MedicalRecord,
  type PrescriptionItem,
} from "@/lib/medical-records-api";

type EditablePrescription = PrescriptionItem & { id: string };
type EditableSection = "notes" | "prescription" | "signature" | "certificate" | null;

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
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [doctorSignatureDataUrl, setDoctorSignatureDataUrl] = useState("");
  const [doctorSignatureText, setDoctorSignatureText] = useState("");
  const [certificateTitle, setCertificateTitle] = useState("GP Medical Certificate");
  const [certificateBody, setCertificateBody] = useState("");
  const [certificateRemarks, setCertificateRemarks] = useState("");
  const [certificateIssuedAt, setCertificateIssuedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<EditableSection>(null);
  const [message, setMessage] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingSignatureRef = useRef(false);

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
        setDoctorSignatureDataUrl(record?.doctorSignatureDataUrl ?? "");
        setDoctorSignatureText(record?.doctorSignatureText ?? "");
        setCertificateTitle(
          record?.medicalCertificate?.title ?? "GP Medical Certificate",
        );
        setCertificateBody(record?.medicalCertificate?.body ?? "");
        setCertificateRemarks(record?.medicalCertificate?.remarks ?? "");
        setCertificateIssuedAt(
          record?.medicalCertificate?.issuedAt
            ? new Date(record.medicalCertificate.issuedAt).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
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

  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !doctorSignatureDataUrl) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = doctorSignatureDataUrl;
  }, [doctorSignatureDataUrl]);

  const selectedAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment._id === selectedAppointmentId) ??
      null,
    [appointments, selectedAppointmentId],
  );
  const patientHistory = useMemo(() => {
    if (!selectedAppointment) {
      return [];
    }

    return appointments
      .filter((appointment) => appointment.patientId === selectedAppointment.patientId)
      .sort(
        (left, right) =>
          new Date(right.scheduledStartAt).getTime() -
          new Date(left.scheduledStartAt).getTime(),
      );
  }, [appointments, selectedAppointment]);
  const hasMedicalCertificateAddOn = useMemo(
    () => Boolean(selectedAppointment?.addOns.some(isMedicalCertificateAddOn)),
    [selectedAppointment],
  );
  useEffect(() => {
    if (!user || !selectedAppointment?.patientId) {
      setPatientRecords([]);
      return;
    }

    void getMyDoctorPatientDetail(user, selectedAppointment.patientId)
      .then((detail) => {
        setPatientRecords(detail.records);
      })
      .catch(() => {
        setPatientRecords([]);
      });
  }, [selectedAppointment?.patientId, user]);
  const prescriptionHistory = useMemo(
    () =>
      patientRecords
        .filter(
          (record) =>
            record.appointmentId !== selectedAppointmentId &&
            record.prescriptions.length > 0,
        )
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        ),
    [patientRecords, selectedAppointmentId],
  );

  useEffect(() => {
    if (!selectedAppointment || certificateBody.trim()) {
      return;
    }

    if (selectedAppointment.addOns.some((item) => item.code === "gp_medical_certificate")) {
      setCertificateTitle("GP Medical Certificate");
      setCertificateBody(buildDefaultMedicalCertificateBody(selectedAppointment));
    }
  }, [certificateBody, selectedAppointment]);

  async function handleSaveNotes() {
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
      });
      setEditingSection(null);
      setMessage("Consultation notes saved.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to save notes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePrescriptions() {
    if (!user || !selectedAppointmentId) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await saveMyDoctorAppointmentRecord(user, selectedAppointmentId, {
        prescriptions: prescriptions
          .map((item) => ({
            medicine: item.medicine,
            dosage: item.dosage,
            instruction: item.instruction,
            duration: item.duration,
          }))
          .filter((item) => item.medicine.trim()),
      });
      setEditingSection(null);
      setMessage("Prescription saved.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save prescription.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCertificate() {
    if (!user || !selectedAppointmentId || !selectedAppointment) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const latestSignatureDataUrl =
        getSignatureDataUrl(signatureCanvasRef.current) || doctorSignatureDataUrl;
      const latestSignatureText =
        doctorSignatureText.trim() || selectedAppointment.doctorName;
      const savedCertificate = await saveMyDoctorAppointmentCertificate(
        user,
        selectedAppointmentId,
        {
          code:
            selectedAppointment.addOns.find(isMedicalCertificateAddOn)?.code ??
            "medical_certificate",
          title: certificateTitle.trim() || "Medical Certificate",
          body:
            certificateBody.trim() ||
            buildDefaultMedicalCertificateBody(selectedAppointment),
          remarks: certificateRemarks,
          issuedAt: certificateIssuedAt,
          doctorSignatureDataUrl: latestSignatureDataUrl,
          doctorSignatureText: latestSignatureText,
        },
      );

      setDoctorSignatureDataUrl(latestSignatureDataUrl);
      setDoctorSignatureText(latestSignatureText);
      setCertificateTitle(savedCertificate.title ?? certificateTitle);
      setCertificateBody(savedCertificate.body ?? certificateBody);
      setCertificateRemarks(savedCertificate.remarks ?? certificateRemarks);
      setCertificateIssuedAt(
        savedCertificate.issuedAt
          ? new Date(savedCertificate.issuedAt).toISOString().slice(0, 10)
          : certificateIssuedAt,
      );
      setEditingSection(null);
      setMessage(
        "Medical certificate saved to patient records and medical_certificates.",
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save medical certificate.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSignature() {
    if (!user || !selectedAppointmentId || !selectedAppointment) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const latestSignatureDataUrl =
        getSignatureDataUrl(signatureCanvasRef.current) || doctorSignatureDataUrl;
      const latestSignatureText =
        doctorSignatureText.trim() || selectedAppointment.doctorName;

      const savedRecord = await saveMyDoctorAppointmentRecord(
        user,
        selectedAppointmentId,
        {
          doctorSignatureDataUrl: latestSignatureDataUrl,
          doctorSignatureText: latestSignatureText,
        },
      );

      setDoctorSignatureDataUrl(
        savedRecord.doctorSignatureDataUrl ?? latestSignatureDataUrl,
      );
      setDoctorSignatureText(
        savedRecord.doctorSignatureText ?? latestSignatureText,
      );
      setEditingSection(null);
      setMessage("Doctor signature saved.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save doctor signature.",
      );
    } finally {
      setSaving(false);
    }
  }

  function startSignature(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    const { x, y } = getCanvasPoint(canvas, event);
    isDrawingSignatureRef.current = true;
    context.lineWidth = 2.4;
    context.lineCap = "round";
    context.strokeStyle = "#082b45";
    context.beginPath();
    context.moveTo(x, y);
  }

  function drawSignature(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingSignatureRef.current) {
      return;
    }

    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    const { x, y } = getCanvasPoint(canvas, event);
    context.lineTo(x, y);
    context.stroke();
  }

  function endSignature() {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !isDrawingSignatureRef.current) {
      return;
    }

    isDrawingSignatureRef.current = false;
    setDoctorSignatureDataUrl(getSignatureDataUrl(canvas) || "");
  }

  function clearSignature() {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    setDoctorSignatureDataUrl("");
  }

  return (
    <div className="min-h-full bg-[#f7f2e8]">
      <section className="border-b border-[#12324d]/10 bg-white">
        <div className="grid lg:grid-cols-[1fr_360px]">
          <div className="px-6 py-6 sm:px-8">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Notes & prescriptions
            </p>
            <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
              Write patient notes clearly.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Choose one consultation, review the patient concern, then save notes
              and prescriptions in one simple flow.
            </p>
          </div>
          <div className="border-t border-[#12324d]/10 px-6 py-5 sm:px-8 lg:border-t-0 lg:border-l">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-primary uppercase">
              <ShieldCheck className="size-4" />
              Safety reminder
            </p>
            <div className="mt-3 rounded-xl bg-[#e8f5ee] px-4 py-3 text-sm text-[#12734b]">
              This tool provides guidance only and does not replace professional medical advice.
            </div>
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-[1fr_360px]">
        <main className="min-w-0 bg-[#fffdf8] px-6 py-6 sm:px-8">
          {message ? (
            <div className="mb-4 rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3 text-sm text-primary">
              {message}
            </div>
          ) : null}

          <section className="rounded-xl border border-[#12324d]/10 bg-white p-5">
            <StepHeader
              number="1"
              title="Select consultation"
              copy="Pick the exact patient and time before writing notes."
            />
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-primary">
                Patient consultation
              </span>
              <select
                value={selectedAppointmentId}
                onChange={(event) => setSelectedAppointmentId(event.target.value)}
                className="h-12 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm font-semibold text-primary outline-none"
              >
                {appointments.map((appointment) => (
                  <option key={appointment._id} value={appointment._id}>
                    {appointment.patientName} - {formatDate(appointment.scheduledStartAt)} -{" "}
                    {formatTimeRange(
                      appointment.scheduledStartAt,
                      appointment.scheduledEndAt,
                    )} - {appointment.consultationLabel || appointment.specializationName}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {loading ? (
            <div className="mt-5 rounded-xl border border-[#12324d]/10 bg-white px-5 py-10 text-sm text-muted-foreground">
              Loading consultation notes...
            </div>
          ) : null}

          {!loading && selectedAppointment ? (
            <div className="mt-5 space-y-5">
              <section className="rounded-xl border border-[#12324d]/10 bg-white p-5">
                <StepHeader
                  number="2"
                  title="Review patient triage"
                  copy="Use this intake summary before writing your consultation notes."
                />
                {selectedAppointment.triage ? (
                  <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoLine
                        label="Chief complaint"
                        value={selectedAppointment.triage.chiefComplaint}
                      />
                      <InfoLine
                        label="Consult method"
                        value={formatTriageValue(selectedAppointment.triage.consultMethod)}
                      />
                      <InfoLine
                        label="Started"
                        value={formatDate(selectedAppointment.triage.onsetDate)}
                      />
                      <InfoLine
                        label="Health history"
                        value={`Smoke: ${formatTriageValue(
                          selectedAppointment.triage.smokes,
                        )}, Alcohol: ${formatTriageValue(
                          selectedAppointment.triage.drinksAlcohol,
                        )}`}
                      />
                    </div>
                    <div className="mt-4 rounded-xl bg-white px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        Detailed symptoms
                      </p>
                      <p className="mt-2 text-sm leading-6 text-primary">
                        {selectedAppointment.triage.detailedSymptoms}
                      </p>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                      <TriageList
                        label="Allergies"
                        values={selectedAppointment.triage.allergies}
                      />
                      <TriageList
                        label="Medications"
                        values={selectedAppointment.triage.medications}
                      />
                      <TriageList
                        label="Health problems"
                        values={selectedAppointment.triage.healthProblems}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-[#12324d]/10 bg-[#fcfaf5] px-4 py-5 text-sm text-muted-foreground">
                    No triage form was attached to this consultation.
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-[#12324d]/10 bg-white p-5">
                <EditableHeader
                  number="3"
                  title="Write consultation notes"
                  copy="Public notes are visible to the patient. Private notes are only for doctors."
                  isEditing={editingSection === "notes"}
                  onEdit={() => setEditingSection("notes")}
                  onCancel={() => setEditingSection(null)}
                />
                <div className="grid gap-4">
                  <FieldBlock
                    tone="summary"
                    label="Consultation summary"
                    helper="Short medical summary for this visit."
                    value={consultationSummary}
                    onChange={setConsultationSummary}
                    placeholder="Example: Patient reports fever and cough for 2 days..."
                    disabled={editingSection !== "notes"}
                  />
                  <FieldBlock
                    tone="public"
                    label="Public note for patient"
                    helper="Plain-language advice the patient can read later."
                    value={publicNote}
                    onChange={setPublicNote}
                    placeholder="Example: Continue hydration, rest, and monitor temperature..."
                    disabled={editingSection !== "notes"}
                  />
                  <FieldBlock
                    tone="private"
                    label="Private doctor note"
                    helper="Internal observation for future consultations."
                    value={privateNote}
                    onChange={setPrivateNote}
                    placeholder="Example: Consider follow-up if symptoms persist..."
                    disabled={editingSection !== "notes"}
                  />
                  <FieldBlock
                    tone="recommendation"
                    label="Recommendations"
                    helper="Follow-up, referrals, monitoring, or lifestyle guidance."
                    value={recommendations}
                    onChange={setRecommendations}
                    placeholder="Example: Follow up after 3 days or sooner if worsening..."
                    disabled={editingSection !== "notes"}
                  />
                </div>
                {editingSection === "notes" ? (
                  <SectionActions
                    saving={saving}
                    saveLabel="Save consultation notes"
                    onSave={() => void handleSaveNotes()}
                    onCancel={() => setEditingSection(null)}
                  />
                ) : null}
              </section>

              <section className="rounded-xl border border-[#12324d]/10 bg-white p-5">
                <StepHeader
                  number="H"
                  title="Patient consultation history"
                  copy="Previous appointments in Click Klinik. Use this for context before saving new notes."
                />
                <div className="grid gap-3">
                  {patientHistory.map((appointment) => (
                    <article
                      key={appointment._id}
                      className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-primary">
                            {appointment.consultationLabel || appointment.specializationName}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(appointment.scheduledStartAt)} /{" "}
                            {formatTimeRange(
                              appointment.scheduledStartAt,
                              appointment.scheduledEndAt,
                            )}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#12324d]/10 bg-white px-3 py-1 text-xs font-semibold text-primary">
                          {formatTriageValue(appointment.status)}
                        </span>
                      </div>
                      {appointment.triage?.chiefComplaint ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Concern: {appointment.triage.chiefComplaint}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </main>

        <aside className="border-t border-[#12324d]/10 bg-[#fcfaf5] px-6 py-6 sm:px-8 xl:sticky xl:top-0 xl:h-screen xl:overflow-auto xl:border-t-0 xl:border-l">
          <section className="rounded-xl border border-[#12324d]/10 bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <ClipboardPenLine className="size-5" />
              </span>
              <div>
                <p className="font-bold text-primary">Selected patient</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAppointment
                    ? `${selectedAppointment.patientName} - ${formatDate(
                        selectedAppointment.scheduledStartAt,
                      )}`
                    : "Choose a consultation first"}
                </p>
              </div>
            </div>

            <p className="mt-5 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3 text-xs leading-5 text-muted-foreground">
              Sections are locked by default to prevent accidental edits. Click an
              edit icon before changing notes, prescriptions, signature, or certificate.
            </p>
          </section>

          <section className="mt-5 rounded-xl border border-[#12324d]/10 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <Pill className="size-5" />
                </span>
                <div>
                  <p className="font-bold text-primary">4. Prescription</p>
                  <p className="text-sm text-muted-foreground">
                    Optional medication instructions
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="h-10 rounded-xl"
                disabled={editingSection !== "prescription"}
                onClick={() =>
                  setPrescriptions((current) => [...current, createPrescription()])
                }
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>

            <div className="mt-4 flex justify-end">
              {editingSection === "prescription" ? (
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#12324d]/10 bg-white px-3 py-2 text-xs font-bold text-primary"
                >
                  <X className="size-3.5" />
                  Cancel edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingSection("prescription")}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-2 text-xs font-bold text-primary"
                >
                  <Edit3 className="size-3.5" />
                  Edit prescription
                </button>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {prescriptions.map((item, index) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      Medicine {index + 1}
                    </p>
                    <button
                      type="button"
                      disabled={editingSection !== "prescription"}
                      onClick={() =>
                        setPrescriptions((current) =>
                          current.length === 1
                            ? [createPrescription()]
                            : current.filter((entry) => entry.id !== item.id),
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="size-3" />
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3">
                    <input
                      value={item.medicine}
                      disabled={editingSection !== "prescription"}
                      onChange={(event) =>
                        setPrescriptions((current) =>
                          current.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, medicine: event.target.value }
                              : entry,
                          ),
                        )
                      }
                      placeholder="Medicine name"
                      className="h-11 rounded-xl border border-[#12324d]/10 bg-white px-3 text-sm outline-none disabled:bg-[#f4f0e8] disabled:text-muted-foreground"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={item.dosage ?? ""}
                        disabled={editingSection !== "prescription"}
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
                        className="h-11 rounded-xl border border-[#12324d]/10 bg-white px-3 text-sm outline-none disabled:bg-[#f4f0e8] disabled:text-muted-foreground"
                      />
                      <input
                        value={item.duration ?? ""}
                        disabled={editingSection !== "prescription"}
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
                        className="h-11 rounded-xl border border-[#12324d]/10 bg-white px-3 text-sm outline-none disabled:bg-[#f4f0e8] disabled:text-muted-foreground"
                      />
                    </div>
                    <textarea
                      value={item.instruction ?? ""}
                      disabled={editingSection !== "prescription"}
                      onChange={(event) =>
                        setPrescriptions((current) =>
                          current.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, instruction: event.target.value }
                              : entry,
                          ),
                        )
                      }
                      placeholder="Instructions for the patient"
                      rows={3}
                      className="min-h-24 rounded-xl border border-[#12324d]/10 bg-white px-3 py-3 text-sm outline-none disabled:bg-[#f4f0e8] disabled:text-muted-foreground"
                    />
                  </div>
                </article>
              ))}
            </div>
            {editingSection === "prescription" ? (
              <SectionActions
                saving={saving}
                saveLabel="Save prescription"
                onSave={() => void handleSavePrescriptions()}
                onCancel={() => setEditingSection(null)}
              />
            ) : null}
          </section>

          <section className="mt-5 rounded-xl border border-[#12324d]/10 bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f2e8] text-primary">
                <Pill className="size-5" />
              </span>
              <div>
                <p className="font-bold text-primary">Prescription history</p>
                <p className="text-sm text-muted-foreground">
                  Previous medicines from this patient&apos;s past records.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {prescriptionHistory.length ? (
                prescriptionHistory.map((record) => (
                  <article
                    key={record._id}
                    className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      {formatDate(record.createdAt)} / {record.specializationName}
                    </p>
                    <div className="mt-3 space-y-2">
                      {record.prescriptions.map((item, index) => (
                        <div
                          key={`${record._id}-${item.medicine}-${index}`}
                          className="rounded-lg border border-[#12324d]/10 bg-white px-3 py-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-primary">
                                {item.medicine}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                {[item.dosage, item.duration, item.instruction]
                                  .filter(Boolean)
                                  .join(" / ") || "No extra instruction"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setPrescriptions((current) => [
                                  ...current,
                                  createPrescription(item),
                                ])
                              }
                              className="rounded-lg border border-[#12324d]/10 bg-white px-2 py-1 text-xs font-semibold text-primary"
                            >
                              Reuse
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-[#12324d]/15 bg-[#fcfaf5] px-4 py-5 text-sm text-muted-foreground">
                  No previous prescriptions found for this patient yet.
                </p>
              )}
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-[#12324d]/10 bg-white p-5">
            <EditableIconHeader
              icon={<PenLine className="size-5" />}
              title="5. Digital doctor signature"
              copy="Draw once, then save with the record for document verification."
              isEditing={editingSection === "signature"}
              onEdit={() => setEditingSection("signature")}
              onCancel={() => setEditingSection(null)}
            />

            <div className="mt-4 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] p-3">
              <label className="mb-3 grid gap-2">
                <span className="text-sm font-bold text-primary">
                  Signature name fallback
                </span>
                <input
                  value={doctorSignatureText}
                  disabled={editingSection !== "signature"}
                  onChange={(event) => setDoctorSignatureText(event.target.value)}
                  placeholder={selectedAppointment?.doctorName ?? "Doctor name"}
                  className="h-11 rounded-xl border border-[#12324d]/10 bg-white px-3 text-sm outline-none disabled:bg-[#f4f0e8] disabled:text-muted-foreground"
                />
              </label>
              <canvas
                ref={signatureCanvasRef}
                width={420}
                height={120}
                onPointerDown={
                  editingSection === "signature" ? startSignature : undefined
                }
                onPointerMove={
                  editingSection === "signature" ? drawSignature : undefined
                }
                onPointerUp={editingSection === "signature" ? endSignature : undefined}
                onPointerLeave={
                  editingSection === "signature" ? endSignature : undefined
                }
                className="h-32 w-full touch-none rounded-lg border border-dashed border-[#12324d]/20 bg-white data-[locked=true]:cursor-not-allowed data-[locked=true]:opacity-70"
                data-locked={editingSection !== "signature"}
                aria-label="Draw doctor signature"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Signature is stored only with this consultation record.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl"
                  disabled={editingSection !== "signature"}
                  onClick={clearSignature}
                >
                  Clear signature
                </Button>
              </div>
            </div>
            {editingSection === "signature" ? (
              <SectionActions
                saving={saving}
                saveLabel="Save signature"
                onSave={() => void handleSaveSignature()}
                onCancel={() => setEditingSection(null)}
              />
            ) : null}

            {doctorSignatureDataUrl ? (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">
                  Signature captured
                </p>
                <img
                  src={doctorSignatureDataUrl}
                  alt="Doctor digital signature preview"
                  className="mt-2 h-16 max-w-full rounded-lg bg-white object-contain"
                />
              </div>
            ) : null}
          </section>

          <section className="mt-5 rounded-xl border border-[#12324d]/10 bg-white p-5">
            <EditableIconHeader
              icon={<FileBadge2 className="size-5" />}
              title="6. Medical certificate"
              copy="Available only when the patient ordered a certificate add-on."
              isEditing={editingSection === "certificate"}
              onEdit={() => setEditingSection("certificate")}
              onCancel={() => setEditingSection(null)}
              accent
            />

            <div className="mt-4 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3 text-sm leading-6 text-muted-foreground">
              {hasMedicalCertificateAddOn
                ? "Certificate add-on detected. Saving will publish this certificate to the patient records."
                : "No certificate add-on was detected. You can still draft and save if this consultation requires a certificate, but confirm the order first."}
            </div>

            {selectedAppointment ? (
              <div className="mt-4 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-primary">Certificate title</span>
                  <input
                    value={certificateTitle}
                    disabled={editingSection !== "certificate"}
                    onChange={(event) => setCertificateTitle(event.target.value)}
                    className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm outline-none disabled:bg-[#f4f0e8] disabled:text-muted-foreground"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-primary">Issue date</span>
                  <input
                    type="date"
                    value={certificateIssuedAt}
                    disabled={editingSection !== "certificate"}
                    onChange={(event) => setCertificateIssuedAt(event.target.value)}
                    className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm outline-none disabled:bg-[#f4f0e8] disabled:text-muted-foreground"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-primary">Certificate body</span>
                  <textarea
                    value={certificateBody}
                    disabled={editingSection !== "certificate"}
                    onChange={(event) => setCertificateBody(event.target.value)}
                    rows={7}
                    className="min-h-40 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-3 text-sm leading-6 outline-none disabled:bg-[#f4f0e8] disabled:text-muted-foreground"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-primary">Verification remarks</span>
                  <textarea
                    value={certificateRemarks}
                    disabled={editingSection !== "certificate"}
                    onChange={(event) => setCertificateRemarks(event.target.value)}
                    placeholder="Example: Issued after teleconsultation evaluation."
                    rows={3}
                    className="min-h-24 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-3 text-sm leading-6 outline-none disabled:bg-[#f4f0e8] disabled:text-muted-foreground"
                  />
                </label>
                {editingSection === "certificate" ? (
                  <SectionActions
                    saving={saving}
                    saveLabel="Save certificate for patient"
                    onSave={() => void handleSaveCertificate()}
                    onCancel={() => setEditingSection(null)}
                  />
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[#12324d]/15 bg-[#fcfaf5] px-4 py-5 text-sm leading-6 text-muted-foreground">
                Choose a consultation first before issuing a certificate.
              </div>
            )}
          </section>

          {!selectedAppointment && !loading ? (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-white px-5 py-8 text-sm text-muted-foreground">
              No consultation is available for note writing yet.
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function StepHeader({
  number,
  title,
  copy,
}: {
  number: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </span>
      <div>
        <h2 className="text-lg font-bold text-primary">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}

function EditableHeader({
  number,
  title,
  copy,
  isEditing,
  onEdit,
  onCancel,
}: {
  number: string;
  title: string;
  copy: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {number}
        </span>
        <div>
          <h2 className="text-lg font-bold text-primary">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
        </div>
      </div>
      {isEditing ? (
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#12324d]/10 bg-white px-3 py-2 text-xs font-bold text-primary"
        >
          <X className="size-3.5" />
          Cancel
        </button>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-2 text-xs font-bold text-primary"
        >
          <Edit3 className="size-3.5" />
          Edit
        </button>
      )}
    </div>
  );
}

function EditableIconHeader({
  icon,
  title,
  copy,
  isEditing,
  onEdit,
  onCancel,
  accent = false,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-primary ${
            accent ? "bg-secondary" : "bg-primary/8"
          }`}
        >
          {icon}
        </span>
        <div>
          <p className="font-bold text-primary">{title}</p>
          <p className="text-sm text-muted-foreground">{copy}</p>
        </div>
      </div>
      {isEditing ? (
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#12324d]/10 bg-white px-3 py-2 text-xs font-bold text-primary"
        >
          <X className="size-3.5" />
          Cancel
        </button>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-2 text-xs font-bold text-primary"
        >
          <Edit3 className="size-3.5" />
          Edit
        </button>
      )}
    </div>
  );
}

function SectionActions({
  saving,
  saveLabel,
  onSave,
  onCancel,
}: {
  saving: boolean;
  saveLabel: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[#12324d]/10 pt-4">
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-xl"
        onClick={onCancel}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button type="button" className="h-10 rounded-xl" onClick={onSave} disabled={saving}>
        <Save className="size-4" />
        {saving ? "Saving..." : saveLabel}
      </Button>
    </div>
  );
}

function FieldBlock({
  tone,
  label,
  helper,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  tone: "summary" | "public" | "private" | "recommendation";
  label: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const toneClass = {
    private: "border-amber-300 bg-amber-50 focus:border-amber-600",
    public: "border-emerald-300 bg-emerald-50 focus:border-emerald-600",
    recommendation: "border-sky-300 bg-sky-50 focus:border-sky-600",
    summary: "border-[#12324d]/20 bg-[#fcfaf5] focus:border-primary",
  }[tone];
  const labelClass = {
    private: "text-amber-800",
    public: "text-emerald-800",
    recommendation: "text-sky-800",
    summary: "text-primary",
  }[tone];

  return (
    <label className="grid gap-2">
      <span>
        <span className={`block text-sm font-bold ${labelClass}`}>{label}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{helper}</span>
      </span>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className={`min-h-28 rounded-xl border px-4 py-3 text-sm leading-6 outline-none disabled:cursor-not-allowed disabled:opacity-75 ${toneClass}`}
      />
    </label>
  );
}

function TriageList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-white px-3 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-semibold text-primary">
        {values.length ? values.join(", ") : "None listed"}
      </p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-white px-3 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
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

function isMedicalCertificateAddOn(addOn: Appointment["addOns"][number]) {
  return (
    addOn.code === "gp_medical_certificate" ||
    addOn.code === "psych_medical_certificate" ||
    addOn.label.toLowerCase().includes("medical certificate")
  );
}

function buildDefaultMedicalCertificateBody(appointment: Appointment) {
  const consultationDate = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(appointment.scheduledStartAt));

  return `This is to certify that ${appointment.patientName} was evaluated through a Click Klinik teleconsultation on ${consultationDate}.

Based on the consultation and the information provided, this certificate verifies the patient's reported health status and medical consultation for ${appointment.consultationLabel || appointment.specializationName}.

This certificate is issued upon the patient's request for appropriate documentation purposes, subject to the limitations of telehealth evaluation.`;
}

function getCanvasPoint(
  canvas: HTMLCanvasElement,
  event: React.PointerEvent<HTMLCanvasElement>,
) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function getSignatureDataUrl(canvas: HTMLCanvasElement | null) {
  if (!canvas || isCanvasBlank(canvas)) {
    return "";
  }

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const context = exportCanvas.getContext("2d");

  if (!context) {
    return "";
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  context.drawImage(canvas, 0, 0);

  return exportCanvas.toDataURL("image/jpeg", 0.72);
}

function isCanvasBlank(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) {
    return true;
  }

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] !== 0) {
      return false;
    }
  }

  return true;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTimeRange(startAt: string, endAt: string) {
  return `${formatTime(startAt)} - ${formatTime(endAt)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTriageValue(value: string) {
  return value.replace(/_/g, " ");
}
