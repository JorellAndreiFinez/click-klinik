"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  HeartPulse,
  MapPin,
  Receipt,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { PatientWorkspaceShell } from "@/app/patient/patient-workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatPhp,
  getBookingAddOnOptions,
  getBookingConsultationOptions,
} from "@/features/appointments/booking-catalog";
import { createAppointment } from "@/lib/appointments-api";
import {
  getPublicDoctorAvailability,
  getPublicDoctorProfile,
  type PublicDoctorAvailabilitySlot,
  type PublicDoctorProfile,
} from "@/lib/doctor-discovery-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { getMyPatientProfile, type PatientProfile } from "@/lib/patient-api";

type BookableTimeSlot = {
  id: string;
  scheduleSlotId: string;
  startAt: string;
  endAt: string;
};

type TriageStep = 1 | 2 | 3;
type BookingStage = "triage" | "appointment";

type TriageForm = {
  consultMethod: "google_meet" | "physical_visit" | "cellular";
  chiefComplaint: string;
  detailedSymptoms: string;
  onsetDate: string;
  medications: string;
  allergies: string;
  healthProblems: string;
  smokes: "yes" | "no" | "prefer_not_to_say";
  drinksAlcohol: "yes" | "no" | "prefer_not_to_say";
  insurancePartnersConsent: boolean;
  laboratoryPartnersConsent: boolean;
  pharmacyPartnersConsent: boolean;
  emergencyDisclosureConsent: boolean;
};

export default function PatientDoctorCalendarPage() {
  const params = useParams<{ doctorId: string }>();
  const router = useRouter();
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [doctor, setDoctor] = useState<PublicDoctorProfile | null>(null);
  const [slots, setSlots] = useState<PublicDoctorAvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedConsultationCode, setSelectedConsultationCode] = useState<string>(
    "",
  );
  const [selectedAddOnCodes, setSelectedAddOnCodes] = useState<string[]>([]);
  const [paymentPlan, setPaymentPlan] = useState<
    "pay_now" | "pay_after_consultation"
  >("pay_now");
  const [triageStep, setTriageStep] = useState<TriageStep>(1);
  const [triageCompleted, setTriageCompleted] = useState(false);
  const [bookingStage, setBookingStage] = useState<BookingStage>("triage");
  const [triage, setTriage] = useState<TriageForm>({
    consultMethod: "google_meet",
    chiefComplaint: "",
    detailedSymptoms: "",
    onsetDate: toDateOnly(new Date()),
    medications: "",
    allergies: "",
    healthProblems: "",
    smokes: "no",
    drinksAlcohol: "no",
    insurancePartnersConsent: false,
    laboratoryPartnersConsent: false,
    pharmacyPartnersConsent: false,
    emergencyDisclosureConsent: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(
    configured ? "Loading doctor calendar..." : "Authentication is not configured yet.",
  );
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      if (!nextUser) {
        router.replace("/auth");
        return;
      }

      setUser(nextUser);

      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 59);

      void Promise.all([
        getMyPatientProfile(nextUser),
        getPublicDoctorProfile(params.doctorId),
        getPublicDoctorAvailability(params.doctorId, {
          from: toDateOnly(from),
          to: toDateOnly(to),
        }),
      ])
        .then(([nextProfile, nextDoctor, nextSlots]) => {
          setProfile(nextProfile);
          setDoctor(nextDoctor);
          setSlots(nextSlots);
          const firstAvailableDate = new Date(nextSlots[0]?.startAt ?? from);
          setSelectedDate(toDateOnly(firstAvailableDate));
          setCalendarMonth(startOfMonth(firstAvailableDate));
          setTriage((current) => ({
            ...current,
            allergies: nextProfile.allergies.join(", "),
            medications: nextProfile.currentMedications.join(", "),
            healthProblems: nextProfile.existingConditions.join(", "),
          }));
          const defaultConsultation = getBookingConsultationOptions(
            nextDoctor.specializationName,
          )[0];
          setSelectedConsultationCode(defaultConsultation?.code ?? "");
          setLoading(false);
        })
        .catch((error: unknown) => {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load the booking calendar.",
          );
          setLoading(false);
        });
    });
  }, [configured, params.doctorId, router]);

  async function handleSignOut() {
    if (!configured) {
      router.replace("/auth");
      return;
    }

    await signOut(getFirebaseAuth());
    router.replace("/auth");
  }

  async function handleBook() {
    if (!user || !doctor || !selectedSlotId) {
      return;
    }

    const selectedSlot = generatedSlots.find((slot) => slot.id === selectedSlotId);
    if (!selectedSlot) {
      return;
    }

    setSubmitting(true);
    setActionError(null);

    const triageError = validateTriageForm(triage);
    if (triageError) {
      setActionError(triageError);
      setTriageCompleted(false);
      setBookingStage("triage");
      setTriageStep(getTriageStepForError(triageError));
      setSubmitting(false);
      return;
    }

    try {
      const appointment = await createAppointment(user, {
        doctorId: doctor._id,
        scheduleSlotId: selectedSlot.scheduleSlotId,
        scheduledStartAt: selectedSlot.startAt,
        scheduledEndAt: selectedSlot.endAt,
        consultationCode: selectedConsultationCode,
        addOnCodes: selectedAddOnCodes,
        paymentProvider: "xendit",
        paymentPlan,
        triage: {
          consultMethod: triage.consultMethod,
          chiefComplaint: triage.chiefComplaint,
          detailedSymptoms: triage.detailedSymptoms,
          onsetDate: triage.onsetDate,
          medications: splitList(triage.medications),
          allergies: splitList(triage.allergies),
          healthProblems: splitList(triage.healthProblems),
          smokes: triage.smokes,
          drinksAlcohol: triage.drinksAlcohol,
          insurancePartnersConsent: triage.insurancePartnersConsent,
          laboratoryPartnersConsent: triage.laboratoryPartnersConsent,
          pharmacyPartnersConsent: triage.pharmacyPartnersConsent,
          emergencyDisclosureConsent: triage.emergencyDisclosureConsent,
        },
      });

      if (appointment.paymentCheckoutUrl && paymentPlan === "pay_now") {
        window.location.href = appointment.paymentCheckoutUrl;
        return;
      }

      router.push("/patient/appointments");
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to book consultation.",
      );
      setSubmitting(false);
    }
  }

  const generatedSlots = expandAvailabilityToHalfHourSlots(slots);
  const consultationOptions = useMemo(
    () => getBookingConsultationOptions(doctor?.specializationName ?? ""),
    [doctor?.specializationName],
  );
  const addOnOptions = useMemo(
    () => getBookingAddOnOptions(doctor?.specializationName ?? ""),
    [doctor?.specializationName],
  );
  const selectedConsultation = consultationOptions.find(
    (option) => option.code === selectedConsultationCode,
  );
  const selectedAddOns = addOnOptions.filter((option) =>
    selectedAddOnCodes.includes(option.code),
  );
  const selectedSlot = generatedSlots.find((slot) => slot.id === selectedSlotId);
  const totalFeePhp =
    (selectedConsultation?.feePhp ?? 0) +
    selectedAddOns.reduce((sum, item) => sum + item.feePhp, 0);

  const futureGeneratedSlots = generatedSlots.filter(
    (slot) => !isPastBookableSlot(slot),
  );
  const availableDateSet = new Set(
    futureGeneratedSlots.map((slot) => toDateOnly(new Date(slot.startAt))),
  );
  const calendarDays = buildCalendarMonthDays(calendarMonth, availableDateSet);

  const visibleSlots = generatedSlots.filter(
    (slot) => toDateOnly(new Date(slot.startAt)) === selectedDate,
  );
  const triageError = validateTriageForm(triage);

  if (!profile) {
    return (
      <main className="clinic-grid flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <HeartPulse className="mx-auto size-10 text-primary" />
          <p className="mt-5 text-sm text-muted-foreground">{message}</p>
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
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Book appointment
            </p>
            <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
              {bookingStage === "triage"
                ? "Complete triage first"
                : doctor
                  ? `Book with Dr. ${doctor.lastName}`
                  : "Choose a time slot"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {bookingStage === "triage"
                ? "Answer a short intake form so the doctor can prepare before your teleconsultation."
                : "Pick one available 30-minute slot, review the fee, then confirm your teleconsultation."}
            </p>
          </div>
        </section>

        <section className="grid gap-0 xl:grid-cols-[340px_1fr]">
          <aside className="border-r border-[#12324d]/10 bg-[#fcfaf5] px-6 py-6 sm:px-8">
            {doctor ? (
              <div className="rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Stethoscope className="size-5" />
                  </span>
                  <div>
                    <p className="font-bold">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {doctor.specializationName}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4 text-primary" />
                    {doctor.location || doctor.clinicOrHospital || "Online consultation"}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="size-4 text-primary" />
                    {doctor.yearsOfExperience} years of experience
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5">
              <div className="rounded-xl border border-[#12324d]/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                      Available dates
                    </p>
                    <p className="mt-1 text-sm font-bold text-primary">
                      {formatCalendarMonth(calendarMonth)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-[#12324d]/10 bg-[#fcfaf5] text-primary"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-[#12324d]/10 bg-[#fcfaf5] text-primary"
                      aria-label="Next month"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => (
                    <CalendarDateButton
                      key={day.date}
                      day={day}
                      selected={selectedDate === day.date}
                      onSelect={() => {
                        setActionError(null);
                        setSelectedSlotId("");
                        setSelectedDate(day.date);
                      }}
                    />
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-primary" />
                    Available
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#d8d0c2]" />
                    Doctor off
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <div className="bg-[#fffdf8] px-6 py-6 sm:px-8">
            {actionError ? (
              <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
                {actionError}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-xl border border-[#12324d]/10 bg-white px-5 py-8 text-sm text-muted-foreground">
                Loading calendar availability...
              </div>
            ) : null}

            {!loading ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                      {bookingStage === "triage" ? "Required intake" : "Appointment details"}
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {bookingStage === "triage"
                        ? "Complete your 3-step triage before choosing payment"
                        : "Review the consultation fee before creating the calendar invite"}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {bookingStage === "triage" ? "Step 1 of 2" : formatPhp(totalFeePhp || 0)}
                  </Badge>
                </div>

                <div
                  className={
                    bookingStage === "triage"
                      ? "mt-5"
                      : "mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]"
                  }
                >
                  <div className="grid gap-5">
                    <section
                      className={
                        bookingStage === "appointment"
                          ? "order-1 rounded-xl border border-[#12324d]/10 bg-white p-5"
                          : "hidden"
                      }
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <SummaryField
                          label="Specialization"
                          value={doctor?.specializationName ?? "—"}
                        />
                        <SummaryField
                          label="Doctor"
                          value={doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "—"}
                        />
                      </div>

                      <div className="mt-5">
                        <p className="text-sm font-semibold text-foreground">
                          Consultation type
                        </p>
                        <div className="mt-3 grid gap-3">
                          {consultationOptions.map((option) => (
                            <button
                              key={option.code}
                              type="button"
                              onClick={() => setSelectedConsultationCode(option.code)}
                              className={
                                selectedConsultationCode === option.code
                                  ? "rounded-xl border border-primary bg-primary/5 px-4 py-4 text-left"
                                  : "rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4 text-left"
                              }
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-semibold">{option.label}</p>
                                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    {option.description}
                                  </p>
                                </div>
                                <p className="text-sm font-bold text-primary">
                                  {formatPhp(option.feePhp)}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>

                    <section className={bookingStage === "appointment" && triageCompleted ? "order-3 rounded-xl border border-[#12324d]/10 bg-white p-5" : "hidden"}>
                      <div className="flex items-center gap-2">
                        <Receipt className="size-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground">Add-ons</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Add additional services to your appointment.
                      </p>
                      <div className="mt-4 grid gap-3">
                        {addOnOptions.map((option) => {
                          const checked = selectedAddOnCodes.includes(option.code);

                          return (
                            <button
                              key={option.code}
                              type="button"
                              onClick={() =>
                                setSelectedAddOnCodes((current) =>
                                  checked
                                    ? current.filter((code) => code !== option.code)
                                    : [...current, option.code],
                                )
                              }
                              className={
                                checked
                                  ? "rounded-xl border border-primary bg-primary/5 px-4 py-4 text-left"
                                  : "rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4 text-left"
                              }
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-semibold">{option.label}</p>
                                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    {option.description}
                                  </p>
                                </div>
                                <p className="text-sm font-bold text-primary">
                                  {formatPhp(option.feePhp)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section
                      className={
                        bookingStage === "triage"
                          ? "rounded-2xl border-2 border-primary bg-[#f5fbf8] p-5 shadow-[0_22px_60px_-42px_rgba(8,43,69,0.9)]"
                          : "order-2 rounded-xl border border-emerald-200 bg-emerald-50 p-5"
                      }
                    >
                      {bookingStage === "appointment" ? (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold tracking-[0.18em] text-emerald-700 uppercase">
                              Triage completed
                            </p>
                            <h2 className="mt-1 text-lg font-bold text-primary">
                              Intake is ready for the doctor
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              Chief complaint: {triage.chiefComplaint || "Not provided"}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl bg-white"
                            onClick={() => {
                              setBookingStage("triage");
                              setTriageCompleted(false);
                            }}
                          >
                            Edit triage
                          </Button>
                        </div>
                      ) : null}

                      {bookingStage === "triage" ? (
                        <>
                      <div className="mb-5 rounded-2xl border border-primary/20 bg-white p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                              Required before booking
                            </p>
                            <h2 className="mt-2 text-2xl font-bold text-primary">
                              Complete your 3-step triage first
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                              This helps the doctor understand your symptoms before the Google Meet invite and payment are created.
                            </p>
                          </div>
                          <Badge className={triageCompleted ? "bg-emerald-600" : "bg-amber-500"}>
                            {triageCompleted ? "Triage complete" : "Required"}
                          </Badge>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {[1, 2, 3].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => setTriageStep(step as TriageStep)}
                              className={
                                triageStep === step
                                  ? "rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                                  : "rounded-xl border border-[#12324d]/10 bg-white px-3 py-2 text-xs font-bold text-primary"
                              }
                            >
                              {step === 1
                                ? "1. Health info"
                                : step === 2
                                  ? "2. Health history"
                                  : "3. Consent"}
                            </button>
                          ))}
                        </div>
                        {!triageCompleted && triageError ? (
                          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                            {triageError}
                          </p>
                        ) : null}
                      </div>

                      {triageStep === 1 ? (
                        <div className="grid gap-4">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <label className="grid gap-2 text-sm font-semibold">
                              Consult method <span className="text-red-600">*</span>
                              <select
                                value={triage.consultMethod}
                                onChange={(event) =>
                                  setTriage((current) => ({
                                    ...current,
                                    consultMethod: event.target.value as TriageForm["consultMethod"],
                                  }))
                                }
                                className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm"
                              >
                                <option value="google_meet">Google Meet</option>
                                <option value="physical_visit">Physical visit</option>
                                <option value="cellular">Cellular</option>
                              </select>
                            </label>
                            <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                              Onset date <span className="text-red-600">*</span>
                              <input
                                type="date"
                                value={triage.onsetDate}
                                onChange={(event) =>
                                  setTriage((current) => ({
                                    ...current,
                                    onsetDate: event.target.value,
                                  }))
                                }
                                className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm"
                              />
                            </label>
                          </div>
                          <label className="grid gap-2 text-sm font-semibold">
                            Chief complaint <span className="text-red-600">*</span>
                            <input
                              value={triage.chiefComplaint}
                              onChange={(event) =>
                                setTriage((current) => ({
                                  ...current,
                                  chiefComplaint: event.target.value,
                                }))
                              }
                              placeholder="Main reason you are seeking medical care today."
                              className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm"
                            />
                          </label>
                          <label className="grid gap-2 text-sm font-semibold">
                            Detailed symptoms <span className="text-red-600">*</span>
                            <textarea
                              value={triage.detailedSymptoms}
                              onChange={(event) =>
                                setTriage((current) => ({
                                  ...current,
                                  detailedSymptoms: event.target.value,
                                }))
                              }
                              rows={4}
                              placeholder="Please make it as detailed as possible to guide our doctors better. / Gawin pong detalyado hangga't kaya para mas magabayan ang mga doktor."
                              className="min-h-28 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-3 text-sm"
                            />
                          </label>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <TriageTextArea
                              label="Medications"
                              value={triage.medications}
                              onChange={(value) =>
                                setTriage((current) => ({ ...current, medications: value }))
                              }
                            />
                            <TriageTextArea
                              label="Allergies"
                              value={triage.allergies}
                              onChange={(value) =>
                                setTriage((current) => ({ ...current, allergies: value }))
                              }
                            />
                            <TriageTextArea
                              label="Health problems"
                              value={triage.healthProblems}
                              onChange={(value) =>
                                setTriage((current) => ({ ...current, healthProblems: value }))
                              }
                            />
                          </div>
                        </div>
                      ) : null}

                      {triageStep === 2 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <YesNoSelect
                            label="Do you smoke?"
                            value={triage.smokes}
                            onChange={(value) =>
                              setTriage((current) => ({ ...current, smokes: value }))
                            }
                          />
                          <YesNoSelect
                            label="Do you drink alcohol?"
                            value={triage.drinksAlcohol}
                            onChange={(value) =>
                              setTriage((current) => ({
                                ...current,
                                drinksAlcohol: value,
                              }))
                            }
                          />
                        </div>
                      ) : null}

                      {triageStep === 3 ? (
                        <div className="grid gap-3">
                          <ConsentCheck
                            checked={triage.insurancePartnersConsent}
                            label="Insurance partners terms and conditions"
                            onChange={(checked) =>
                              setTriage((current) => ({
                                ...current,
                                insurancePartnersConsent: checked,
                              }))
                            }
                          />
                          <ConsentCheck
                            checked={triage.laboratoryPartnersConsent}
                            label="Laboratory partners terms and conditions"
                            onChange={(checked) =>
                              setTriage((current) => ({
                                ...current,
                                laboratoryPartnersConsent: checked,
                              }))
                            }
                          />
                          <ConsentCheck
                            checked={triage.pharmacyPartnersConsent}
                            label="Pharmacy partners terms and conditions"
                            onChange={(checked) =>
                              setTriage((current) => ({
                                ...current,
                                pharmacyPartnersConsent: checked,
                              }))
                            }
                          />
                          <ConsentCheck
                            checked={triage.emergencyDisclosureConsent}
                            label="Emergency Disclosure and Patient Safety terms and conditions"
                            onChange={(checked) =>
                              setTriage((current) => ({
                                ...current,
                                emergencyDisclosureConsent: checked,
                              }))
                            }
                          />
                        </div>
                      ) : null}

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-primary/15 pt-5">
                        <p className="text-sm text-muted-foreground">
                          Appointment date, time, add-ons, and payment will unlock after triage is complete.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {triageStep > 1 ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => setTriageStep((triageStep - 1) as TriageStep)}
                            >
                              Back
                            </Button>
                          ) : null}
                          {triageStep < 3 ? (
                            <Button
                              type="button"
                              className="rounded-xl"
                              onClick={() => setTriageStep((triageStep + 1) as TriageStep)}
                            >
                              Continue triage
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              className="rounded-xl"
                              disabled={Boolean(triageError)}
                              onClick={() => {
                                const error = validateTriageForm(triage);
                                if (error) {
                                  setActionError(error);
                                  setTriageStep(getTriageStepForError(error));
                                  return;
                                }

                                setActionError(null);
                                setTriageCompleted(true);
                                setBookingStage("appointment");
                              }}
                            >
                              Complete triage and continue
                            </Button>
                          )}
                        </div>
                      </div>
                        </>
                      ) : null}
                    </section>

                    <section className={bookingStage === "appointment" && triageCompleted ? "order-4 rounded-xl border border-[#12324d]/10 bg-white p-5" : "hidden"}>
                      <p className="text-sm font-semibold text-foreground">Choose date and time</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        The calendar only shows future 30-minute slots within the doctor&apos;s availability.
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {visibleSlots.map((slot) => (
                          <TimeSlotCard
                            key={slot.id}
                            slot={slot}
                            selected={selectedSlotId === slot.id}
                            disabled={isPastBookableSlot(slot)}
                            onSelect={() => setSelectedSlotId(slot.id)}
                          />
                        ))}

                        {visibleSlots.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-[#12324d]/12 bg-[#fcfaf5] px-4 py-8 text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                            No consultation slots are available on this date.
                          </div>
                        ) : null}
                      </div>
                    </section>

                    <section className={bookingStage === "appointment" && triageCompleted ? "order-5 rounded-xl border border-[#12324d]/10 bg-white p-5" : "hidden"}>
                      <p className="text-sm font-semibold text-foreground">Payment plan</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Use Xendit test mode. Pay now unlocks the consultation after payment; pay later lets you settle after the session.
                      </p>
                      <div className="mt-4 grid gap-3">
                        <PaymentOptionCard
                          active={paymentPlan === "pay_now"}
                          title="Pay now with Xendit"
                          description="You have 6 hours to complete payment or the booking is released."
                          onSelect={() => setPaymentPlan("pay_now")}
                        />
                        <PaymentOptionCard
                          active={paymentPlan === "pay_after_consultation"}
                          title="Pay later with Xendit"
                          description="Reserve the schedule now and settle the Xendit checkout after consultation."
                          onSelect={() => setPaymentPlan("pay_after_consultation")}
                        />
                      </div>
                    </section>
                  </div>

                  <aside className={bookingStage === "appointment" ? "rounded-xl border border-[#12324d]/10 bg-white p-5" : "hidden"}>
                    <p className="text-lg font-bold">Booking summary</p>
                    <div className="mt-5 space-y-5">
                      <SummaryBlock
                        title="Patient"
                        rows={[
                          { label: "Name", value: `${profile.firstName} ${profile.lastName}` },
                          { label: "Email", value: profile.email },
                        ]}
                      />
                      <SummaryBlock
                        title="Doctor & consultation"
                        rows={[
                          { label: "Specialization", value: doctor?.specializationName ?? "—" },
                          { label: "Doctor", value: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "—" },
                          { label: "Consultation", value: selectedConsultation?.label ?? "Choose consultation type" },
                        ]}
                      />
                      <SummaryBlock
                        title="Date & time"
                        rows={[
                          { label: "Date", value: selectedSlot ? formatAppointmentDate(selectedSlot.startAt) : "Choose a date" },
                          { label: "Time", value: selectedSlot ? formatTimeRange(selectedSlot.startAt, selectedSlot.endAt) : "Choose a time slot" },
                        ]}
                      />
                      <SummaryBlock
                        title="Fees"
                        rows={[
                          { label: "Consultation fee", value: selectedConsultation ? formatPhp(selectedConsultation.feePhp) : "—" },
                          { label: "Add-ons", value: selectedAddOns.length > 0 ? formatPhp(selectedAddOns.reduce((sum, item) => sum + item.feePhp, 0)) : formatPhp(0) },
                          { label: "Total", value: totalFeePhp > 0 ? formatPhp(totalFeePhp) : "—", strong: true },
                        ]}
                      />
                      <SummaryBlock
                        title="Payment"
                        rows={[
                          {
                            label: "Method",
                            value:
                              paymentPlan === "pay_now"
                                ? "Pay now with Xendit"
                                : "Pay later with Xendit",
                          },
                        ]}
                      />
                    </div>
                  </aside>
                </div>

                <div className={bookingStage === "appointment" ? "mt-6 flex flex-wrap gap-3" : "hidden"}>
                  <Button
                    className="h-11 rounded-xl"
                    disabled={!triageCompleted || !selectedSlotId || !selectedConsultationCode || submitting}
                    onClick={() => void handleBook()}
                  >
                    <CalendarDays className="size-4" />
                    {submitting
                      ? "Preparing consultation..."
                      : !triageCompleted
                        ? "Complete triage first"
                      : paymentPlan === "pay_after_consultation"
                        ? "Confirm booking"
                        : "Continue to test checkout"}
                  </Button>
                  <Button asChild variant="outline" className="h-11 rounded-xl">
                    <Link href="/patient/doctors">Back to doctors</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PatientWorkspaceShell>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SummaryBlock({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string; strong?: boolean }>;
}) {
  return (
    <section className="border-b border-[#12324d]/10 pb-5 last:border-b-0 last:pb-0">
      <p className="font-semibold text-foreground">{title}</p>
      <div className="mt-3 grid gap-3">
        {rows.map((row) => (
          <div key={`${title}-${row.label}`} className="flex items-start justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={row.strong ? "font-bold text-foreground" : "font-medium text-foreground"}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PaymentOptionCard({
  active,
  title,
  description,
  onSelect,
}: {
  active: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        active
          ? "flex items-start gap-3 rounded-xl border border-primary bg-primary/5 px-4 py-4 text-left"
          : "flex items-start gap-3 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4 text-left"
      }
    >
      <span className={active ? "mt-0.5 text-primary" : "mt-0.5 text-muted-foreground"}>
        <CheckCircle2 className="size-4" />
      </span>
      <span>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </span>
    </button>
  );
}

function TriageTextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        placeholder="Separate multiple items with commas."
        className="min-h-24 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-3 text-sm"
      />
    </label>
  );
}

function YesNoSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TriageForm["smokes"];
  onChange: (value: TriageForm["smokes"]) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TriageForm["smokes"])}
        className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm"
      >
        <option value="no">No</option>
        <option value="yes">Yes</option>
        <option value="prefer_not_to_say">Prefer not to say</option>
      </select>
    </label>
  );
}

function ConsentCheck({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1"
      />
      <span>
        <span className="font-semibold text-primary">{label}</span>
        <span className="mt-1 block text-muted-foreground">
          I understand and agree that Click Klinik may use this information only
          for safe teleconsultation coordination.
        </span>
      </span>
    </label>
  );
}

function CalendarDateButton({
  day,
  selected,
  onSelect,
}: {
  day: {
    date: string;
    dayNumber: number;
    inCurrentMonth: boolean;
    available: boolean;
    past: boolean;
  };
  selected: boolean;
  onSelect: () => void;
}) {
  const disabled = !day.available;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={
        disabled
          ? "aspect-square rounded-lg border border-transparent bg-[#efe8dc] text-xs font-semibold text-muted-foreground/45"
          : selected
            ? "aspect-square rounded-lg border border-primary bg-primary text-xs font-bold text-primary-foreground shadow-sm"
            : day.inCurrentMonth
              ? "aspect-square rounded-lg border border-[#12324d]/10 bg-[#fcfaf5] text-xs font-bold text-primary hover:border-primary/40 hover:bg-primary/5"
              : "aspect-square rounded-lg border border-transparent bg-[#f6f0e6] text-xs font-semibold text-muted-foreground/60"
      }
      title={
        day.available
          ? "Doctor has future availability on this date"
          : day.past
            ? "No future time slots remain on this date"
          : "Doctor has no availability on this date"
      }
    >
      {day.dayNumber}
    </button>
  );
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
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

function expandAvailabilityToHalfHourSlots(
  slots: PublicDoctorAvailabilitySlot[],
): BookableTimeSlot[] {
  return slots.flatMap((slot) => {
    const result: BookableTimeSlot[] = [];
    const blockStart = new Date(slot.startAt);
    const blockEnd = new Date(slot.endAt);
    const current = new Date(blockStart);

    while (current.getTime() + 30 * 60 * 1000 <= blockEnd.getTime()) {
      const next = new Date(current.getTime() + 30 * 60 * 1000);
      result.push({
        id: `${slot._id}-${current.toISOString()}`,
        scheduleSlotId: slot._id,
        startAt: current.toISOString(),
        endAt: next.toISOString(),
      });
      current.setTime(next.getTime());
    }

    return result;
  });
}

function TimeSlotCard({
  slot,
  selected,
  disabled,
  onSelect,
}: {
  slot: BookableTimeSlot;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={
        disabled
          ? "rounded-xl border border-dashed border-[#12324d]/10 bg-[#f5efe4] px-4 py-4 text-left opacity-70"
          : selected
            ? "rounded-xl border border-primary bg-primary px-4 py-4 text-left text-primary-foreground"
            : "rounded-xl border border-[#12324d]/10 bg-white px-4 py-4 text-left"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{formatTimeRange(slot.startAt, slot.endAt)}</p>
          <p
            className={
              disabled
                ? "mt-2 text-xs text-muted-foreground"
                : selected
                  ? "mt-2 text-xs text-primary-foreground/80"
                  : "mt-2 text-xs text-muted-foreground"
            }
          >
            {disabled
              ? "This time has already passed."
              : "Google Meet invite will be created after booking."}
          </p>
        </div>
        <span
          className={
            disabled
              ? "rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
              : "rounded-full bg-[#fcfaf5] px-2.5 py-1 text-[11px] font-semibold text-primary"
          }
        >
          <Clock3 className="mr-1 inline size-3" />
          30 min
        </span>
      </div>
    </button>
  );
}

function isPastBookableSlot(slot: BookableTimeSlot): boolean {
  return new Date(slot.startAt).getTime() <= Date.now();
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateTriageForm(triage: TriageForm): string | null {
  if (!triage.chiefComplaint.trim()) {
    return "Please enter the chief complaint before booking.";
  }

  if (!triage.detailedSymptoms.trim()) {
    return "Please describe the symptoms before booking.";
  }

  if (!triage.onsetDate) {
    return "Please select when the symptoms started.";
  }

  if (
    !triage.insurancePartnersConsent ||
    !triage.laboratoryPartnersConsent ||
    !triage.pharmacyPartnersConsent ||
    !triage.emergencyDisclosureConsent
  ) {
    return "Please accept all data sharing and patient safety consents before booking.";
  }

  return null;
}

function getTriageStepForError(error: string): TriageStep {
  if (error.includes("consents")) {
    return 3;
  }

  return 1;
}

function startOfMonth(date: Date): Date {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount, 1);
  return startOfMonth(next);
}

function buildCalendarMonthDays(
  month: Date,
  availableDateSet: Set<string>,
): Array<{
  date: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  available: boolean;
  past: boolean;
}> {
  const firstDay = startOfMonth(month);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = toDateOnly(date);

    return {
      date: dateKey,
      dayNumber: date.getDate(),
      inCurrentMonth: date.getMonth() === month.getMonth(),
      available: availableDateSet.has(dateKey),
      past: date < today,
    };
  });
}

function formatCalendarMonth(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
  }).format(date);
}
