"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  CalendarDays,
  CheckCircle2,
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

export default function PatientDoctorCalendarPage() {
  const params = useParams<{ doctorId: string }>();
  const router = useRouter();
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [doctor, setDoctor] = useState<PublicDoctorProfile | null>(null);
  const [slots, setSlots] = useState<PublicDoctorAvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedConsultationCode, setSelectedConsultationCode] = useState<string>(
    "",
  );
  const [selectedAddOnCodes, setSelectedAddOnCodes] = useState<string[]>([]);
  const [paymentProvider, setPaymentProvider] = useState<
    "pay_later" | "paymongo" | "xendit"
  >("xendit");
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
      to.setDate(to.getDate() + 6);

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
          setSelectedDate(toDateOnly(new Date(nextSlots[0]?.startAt ?? from)));
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

    try {
      const appointment = await createAppointment(user, {
        doctorId: doctor._id,
        scheduleSlotId: selectedSlot.scheduleSlotId,
        scheduledStartAt: selectedSlot.startAt,
        scheduledEndAt: selectedSlot.endAt,
        consultationCode: selectedConsultationCode,
        addOnCodes: selectedAddOnCodes,
        paymentProvider,
      });

      if (appointment.paymentCheckoutUrl && paymentProvider !== "pay_later") {
        window.open(
          appointment.paymentCheckoutUrl,
          "_blank",
          "noopener,noreferrer",
        );
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

  const groupedDates = Array.from(
    new Set(generatedSlots.map((slot) => toDateOnly(new Date(slot.startAt)))),
  );

  const visibleSlots = generatedSlots.filter(
    (slot) => toDateOnly(new Date(slot.startAt)) === selectedDate,
  );

  if (!profile) {
    return (
      <main className="clinic-grid flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
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
      <div className="min-h-full bg-[linear-gradient(180deg,#f7f2e8_0%,#f4ecde_100%)]">
        <section className="border-b border-[#12324d]/10 bg-[linear-gradient(135deg,#0d3553_0%,#123f63_58%,#15496f_100%)] text-primary-foreground">
          <div className="grid gap-6 px-6 py-7 sm:px-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-secondary uppercase">
                Booking calendar
              </p>
              <h1 className="mt-3 text-3xl font-bold">
                {doctor ? `Book with Dr. ${doctor.lastName}` : "Choose a consultation slot"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-primary-foreground/68">
                Pick one available time slot. Click Klinik will create the calendar invite and meeting link for both patient and doctor.
              </p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/[0.06] p-5">
              <p className="text-xs font-bold tracking-[0.18em] text-secondary uppercase">
                Safety note
              </p>
              <p className="mt-3 text-sm leading-7 text-primary-foreground/68">
                This booking supports telehealth guidance only and does not replace emergency in-person medical care.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-0 xl:grid-cols-[340px_1fr]">
          <aside className="border-r border-[#12324d]/10 bg-[#fcfaf5] px-6 py-6 sm:px-8">
            {doctor ? (
              <div className="rounded-2xl border border-[#12324d]/10 bg-white px-5 py-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
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
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Available dates
              </p>
              <div className="mt-4 grid gap-2">
                {groupedDates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => {
                      setActionError(null);
                      setSelectedSlotId("");
                      setSelectedDate(date);
                    }}
                    className={
                      selectedDate === date
                        ? "rounded-xl border border-primary bg-primary px-4 py-3 text-left text-sm font-semibold text-primary-foreground"
                        : "rounded-xl border border-[#12324d]/10 bg-white px-4 py-3 text-left text-sm font-semibold text-primary"
                    }
                  >
                    {formatDateChip(date)}
                  </button>
                ))}
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
              <div className="rounded-2xl border border-[#12324d]/10 bg-white px-5 py-8 text-sm text-muted-foreground">
                Loading calendar availability...
              </div>
            ) : null}

            {!loading ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                      Appointment details
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      Review the consultation fee before creating the calendar invite
                    </p>
                  </div>
                  <Badge variant="outline">{formatPhp(totalFeePhp || 0)}</Badge>
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="grid gap-5">
                    <section className="rounded-2xl border border-[#12324d]/10 bg-white p-5">
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
                                  ? "rounded-2xl border border-primary bg-primary/5 px-4 py-4 text-left"
                                  : "rounded-2xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4 text-left"
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

                    <section className="rounded-2xl border border-[#12324d]/10 bg-white p-5">
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
                                  ? "rounded-2xl border border-primary bg-primary/5 px-4 py-4 text-left"
                                  : "rounded-2xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4 text-left"
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

                    <section className="rounded-2xl border border-[#12324d]/10 bg-white p-5">
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
                          <div className="rounded-2xl border border-dashed border-[#12324d]/12 bg-[#fcfaf5] px-4 py-8 text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                            No consultation slots are available on this date.
                          </div>
                        ) : null}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-[#12324d]/10 bg-white p-5">
                      <p className="text-sm font-semibold text-foreground">Payment plan</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Use test checkout in Xendit or PayMongo, or allow pay after consultation.
                      </p>
                      <div className="mt-4 grid gap-3">
                        <PaymentOptionCard
                          active={paymentProvider === "xendit"}
                          title="Pay now with Xendit"
                          description="Redirect to Xendit test checkout after confirming this consultation."
                          onSelect={() => setPaymentProvider("xendit")}
                        />
                        <PaymentOptionCard
                          active={paymentProvider === "paymongo"}
                          title="Pay now with PayMongo"
                          description="Redirect to PayMongo test checkout after confirming this consultation."
                          onSelect={() => setPaymentProvider("paymongo")}
                        />
                        <PaymentOptionCard
                          active={paymentProvider === "pay_later"}
                          title="Pay after consultation"
                          description="Reserve the schedule first and settle the consultation fee after the session."
                          onSelect={() => setPaymentProvider("pay_later")}
                        />
                      </div>
                    </section>
                  </div>

                  <aside className="rounded-2xl border border-[#12324d]/10 bg-white p-5">
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
                              paymentProvider === "xendit"
                                ? "Xendit test checkout"
                                : paymentProvider === "paymongo"
                                  ? "PayMongo test checkout"
                                  : "Pay after consultation",
                          },
                        ]}
                      />
                    </div>
                  </aside>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    className="h-11 rounded-xl"
                    disabled={!selectedSlotId || !selectedConsultationCode || submitting}
                    onClick={() => void handleBook()}
                  >
                    <CalendarDays className="size-4" />
                    {submitting
                      ? "Preparing consultation..."
                      : paymentProvider === "pay_later"
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
    <div className="rounded-2xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3">
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
          ? "flex items-start gap-3 rounded-2xl border border-primary bg-primary/5 px-4 py-4 text-left"
          : "flex items-start gap-3 rounded-2xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4 text-left"
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

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDateChip(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
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
          ? "rounded-2xl border border-dashed border-[#12324d]/10 bg-[#f5efe4] px-4 py-4 text-left opacity-70"
          : selected
            ? "rounded-2xl border border-primary bg-primary px-4 py-4 text-left text-primary-foreground"
            : "rounded-2xl border border-[#12324d]/10 bg-white px-4 py-4 text-left"
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
