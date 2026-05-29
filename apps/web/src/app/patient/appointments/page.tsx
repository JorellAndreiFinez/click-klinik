"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  HeartPulse,
  Search,
  Star,
  Video,
  XCircle,
} from "lucide-react";

import { PatientWorkspaceShell } from "../patient-workspace-shell";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPhp } from "@/features/appointments/booking-catalog";
import {
  getMyPatientAppointments,
  joinAppointment,
  rateAppointmentDoctor,
  requestAppointmentRefund,
  refreshAppointmentPaymentStatus,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentPaymentStatus,
  type AppointmentStatus,
} from "@/lib/appointments-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { getMyPatientProfile, type PatientProfile } from "@/lib/patient-api";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "upcoming" | AppointmentStatus;
type PaymentFilter = "all" | AppointmentPaymentStatus | "not_set";
type SortMode = "soonest" | "latest" | "newest" | "highest_fee";
type DateScope = "all" | "selected_day";
type DayPeriod = "am" | "pm";
type AppointmentViewMode = "calendar" | "summary";

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const configured = isFirebaseConfigured();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(
    configured ? "Loading your appointments..." : "Authentication is not configured yet.",
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshingPaymentId, setRefreshingPaymentId] = useState<string | null>(null);
  const [refundAppointment, setRefundAppointment] = useState<Appointment | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("soonest");
  const [dateScope, setDateScope] = useState<DateScope>("all");
  const [activePeriod, setActivePeriod] = useState<DayPeriod>("am");
  const [viewMode, setViewMode] = useState<AppointmentViewMode>("calendar");
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

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

      void Promise.all([
        getMyPatientProfile(nextUser),
        getMyPatientAppointments(nextUser),
      ])
        .then(([nextProfile, nextAppointments]) => {
          setProfile(nextProfile);
          setAppointments(nextAppointments);
          setLoading(false);
          void refreshPendingXenditPayments(nextUser, nextAppointments);
        })
        .catch((error: unknown) => {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load your patient appointments.",
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

  async function handleJoin(appointmentId: string) {
    if (!user) {
      return;
    }

    setActionError(null);

    try {
      const result = await joinAppointment(user, appointmentId);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === appointmentId ? result.appointment : appointment,
        ),
      );

      if (result.meetLink) {
        window.open(result.meetLink, "_blank", "noopener,noreferrer");
      }
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to join the consultation.",
      );
    }
  }

  async function handleCancel(appointmentId: string) {
    if (!user) {
      return;
    }

    setActionError(null);

    try {
      const appointment = appointments.find((item) => item._id === appointmentId);
      if (appointment?.paymentStatus === "paid") {
        setRefundAppointment(appointment);
        setRefundReason("");
        return;
      }

      const updated = await updateAppointmentStatus(user, appointmentId, "cancelled");
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === appointmentId ? updated : appointment,
        ),
      );
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to cancel the consultation.",
      );
    }
  }

  async function handleConfirmRefundRequest() {
    if (!user || !refundAppointment) {
      return;
    }

    setActionError(null);

    try {
      const updated = await requestAppointmentRefund(
        user,
        refundAppointment._id,
        refundReason.trim() || "Patient requested cancellation and refund.",
      );
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === refundAppointment._id ? updated : appointment,
        ),
      );
      setRefundAppointment(null);
      setRefundReason("");
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to request refund.",
      );
    }
  }

  async function handleRefreshPayment(appointmentId: string) {
    if (!user) {
      return;
    }

    setActionError(null);
    setRefreshingPaymentId(appointmentId);

    try {
      const appointment = appointments.find((item) => item._id === appointmentId);
      const updated = await refreshAppointmentPaymentStatus(
        user,
        appointmentId,
        appointment?.paymentReferenceId,
      );
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === appointmentId ? updated : appointment,
        ),
      );
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to refresh payment status.",
      );
    } finally {
      setRefreshingPaymentId((current) =>
        current === appointmentId ? null : current,
      );
    }
  }

  async function handleSubmitRating(appointmentId: string) {
    if (!user) {
      return;
    }

    setActionError(null);
    setSubmittingRating(true);

    try {
      const updated = await rateAppointmentDoctor(user, appointmentId, {
        stars: ratingStars,
        comment: ratingComment.trim() || undefined,
      });
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === appointmentId ? updated : appointment,
        ),
      );
      setRatingStars(5);
      setRatingComment("");
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to save your rating.",
      );
    } finally {
      setSubmittingRating(false);
    }
  }

  async function refreshPendingXenditPayments(
    nextUser: User,
    nextAppointments: Appointment[],
  ) {
    const pendingXenditAppointments = nextAppointments.filter(
      (appointment) =>
        appointment.paymentProvider === "xendit" &&
        appointment.paymentStatus === "pending",
    );

    for (const appointment of pendingXenditAppointments) {
      try {
        const updated = await refreshAppointmentPaymentStatus(
          nextUser,
          appointment._id,
          appointment.paymentReferenceId,
        );

        setAppointments((current) =>
          current.map((currentAppointment) =>
            currentAppointment._id === appointment._id ? updated : currentAppointment,
          ),
        );
      } catch {
        // Keep the page usable; the manual "I already paid" button can retry.
      }
    }
  }

  const appointmentCounts = useMemo(() => getAppointmentCounts(appointments), [appointments]);

  const visibleAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return appointments
      .filter((appointment) => {
        if (dateScope === "selected_day" && !isSameDay(new Date(appointment.scheduledStartAt), selectedDate)) {
          return false;
        }

        if (statusFilter === "upcoming") {
          if (appointment.status === "completed" || appointment.status === "cancelled") {
            return false;
          }
        } else if (statusFilter !== "all" && appointment.status !== statusFilter) {
          return false;
        }

        if (paymentFilter === "not_set") {
          if (appointment.paymentStatus) {
            return false;
          }
        } else if (paymentFilter !== "all" && appointment.paymentStatus !== paymentFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          appointment.doctorName,
          appointment.specializationName,
          appointment.doctorLocation,
          appointment.consultationLabel,
          appointment.status,
          appointment.paymentStatus,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => sortAppointments(left, right, sortMode));
  }, [appointments, dateScope, paymentFilter, search, selectedDate, sortMode, statusFilter]);

  const calendarRows = useMemo(
    () => buildCalendarRows(selectedDate, activePeriod, visibleAppointments),
    [activePeriod, selectedDate, visibleAppointments],
  );

  const selectedDayCount = calendarRows.reduce(
    (count, row) => count + row.appointments.length,
    0,
  );
  const pendingRatingAppointment = useMemo(
    () =>
      appointments.find(
        (appointment) =>
          appointment.status === "completed" && !appointment.patientHasRatedDoctor,
      ) ?? null,
    [appointments],
  );

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
        <section className="border-b border-[#12324d]/10 bg-white">
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="px-6 py-6 sm:px-8">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Appointments
              </p>
              <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
                Your consultations
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Search, filter, pay, cancel, and join your online consultations from one
                calendar-style view.
              </p>
            </div>
            <div className="border-t border-[#12324d]/10 px-6 py-5 sm:px-8 lg:border-t-0 lg:border-l">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Quick status
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <SummaryPill label="Upcoming" value={appointmentCounts.upcoming} />
                <SummaryPill label="Paid" value={appointmentCounts.paid} />
                <SummaryPill label="Needs pay" value={appointmentCounts.needsPayment} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid xl:grid-cols-[320px_1fr]">
          <aside className="border-b border-[#12324d]/10 bg-[#fcfaf5] px-6 py-5 sm:px-8 xl:border-r xl:border-b-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-[#12324d]/10 bg-white text-primary"
                aria-label="Previous day"
              >
                <ChevronLeft className="size-4" />
              </button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedDate(startOfDay(new Date()))}
                className="h-10 flex-1 rounded-xl"
              >
                Today
              </Button>
              <button
                type="button"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-[#12324d]/10 bg-white text-primary"
                aria-label="Next day"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-[#12324d]/10 bg-white px-4 py-4">
              <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
                Calendar date
              </p>
              <p className="mt-2 text-lg font-bold text-primary">
                {formatWeekdayDate(selectedDate)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <ToggleButton
                  active={dateScope === "all"}
                  onClick={() => setDateScope("all")}
                >
                  All dates
                </ToggleButton>
                <ToggleButton
                  active={dateScope === "selected_day"}
                  onClick={() => setDateScope("selected_day")}
                >
                  This day
                </ToggleButton>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <FilterField label="Search">
                <div className="flex h-11 items-center gap-3 rounded-xl border border-[#12324d]/10 bg-white px-3">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Doctor, location, status"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </FilterField>

              <FilterField label="Consultation status">
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                >
                  <option value="upcoming">Upcoming only</option>
                  <option value="all">All statuses</option>
                  <option value="booked">Booked</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="active_consultation">Active consultation</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </FilterField>

              <FilterField label="Payment">
                <Select
                  value={paymentFilter}
                  onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}
                >
                  <option value="all">All payments</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="mock_pending">Test pending</option>
                  <option value="not_set">Not set</option>
                </Select>
              </FilterField>

              <FilterField label="Sort by">
                <Select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                >
                  <option value="soonest">Soonest schedule</option>
                  <option value="latest">Latest schedule</option>
                  <option value="newest">Newest booking</option>
                  <option value="highest_fee">Highest fee</option>
                </Select>
              </FilterField>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPaymentFilter("all");
                  setSortMode("soonest");
                  setDateScope("all");
                  setSelectedDate(startOfDay(new Date()));
                }}
              >
                Reset filters
              </Button>
            </div>
          </aside>

          <main className="min-w-0 bg-[#fffdf8]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#12324d]/10 bg-[#fcfaf5] px-6 py-4 sm:px-8">
              <div>
                <p className="text-sm font-semibold text-primary">
                  {viewMode === "calendar" ? "Daily calendar" : "Upcoming summary"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {viewMode === "calendar"
                    ? "30-minute slots from 7:00 AM to 8:00 PM"
                    : "Date-sorted consultation cards for faster review"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="grid grid-cols-2 rounded-xl border border-[#12324d]/10 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("calendar")}
                    className={cn(
                      "h-9 rounded-lg px-4 text-sm font-semibold transition-colors",
                      viewMode === "calendar"
                        ? "bg-primary text-primary-foreground"
                        : "text-primary hover:bg-primary/[0.04]",
                    )}
                  >
                    Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("summary")}
                    className={cn(
                      "h-9 rounded-lg px-4 text-sm font-semibold transition-colors",
                      viewMode === "summary"
                        ? "bg-primary text-primary-foreground"
                        : "text-primary hover:bg-primary/[0.04]",
                    )}
                  >
                    Summary
                  </button>
                </div>
                <div className="grid grid-cols-2 rounded-xl border border-[#12324d]/10 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setActivePeriod("am")}
                    className={cn(
                      "h-9 rounded-lg px-4 text-sm font-semibold transition-colors",
                      activePeriod === "am"
                        ? "bg-primary text-primary-foreground"
                        : "text-primary hover:bg-primary/[0.04]",
                    )}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePeriod("pm")}
                    className={cn(
                      "h-9 rounded-lg px-4 text-sm font-semibold transition-colors",
                      activePeriod === "pm"
                        ? "bg-primary text-primary-foreground"
                        : "text-primary hover:bg-primary/[0.04]",
                    )}
                  >
                    PM
                  </button>
                </div>
                <Badge variant="outline" className="h-9 rounded-full px-3">
                  <CalendarDays className="size-3.5" />
                  {selectedDayCount} on this day
                </Badge>
              </div>
            </div>

            {viewMode === "calendar" ? (
              <div className="grid grid-cols-[104px_1fr] border-b border-[#12324d]/10 bg-white px-6 py-3 text-sm font-semibold text-primary sm:px-8">
                <p>Time</p>
                <div className="flex items-center justify-between gap-3">
                  <p>Consultations</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {formatWeekdayDate(selectedDate)}
                  </p>
                </div>
              </div>
            ) : null}

            {actionError ? (
              <div className="mx-6 mt-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive sm:mx-8">
                {actionError}
              </div>
            ) : null}

            {loading ? (
              <div className="mx-6 mt-5 rounded-xl border border-[#12324d]/10 bg-white px-5 py-8 text-sm text-muted-foreground sm:mx-8">
                Loading your appointments...
              </div>
            ) : null}

            {!loading && viewMode === "calendar" ? (
              <div className="divide-y divide-[#12324d]/10">
                {calendarRows.map((row) => (
                  <CalendarTimeRow
                    key={row.timeLabel}
                    row={row}
                    refreshingPaymentId={refreshingPaymentId}
                    onJoin={handleJoin}
                    onCancel={handleCancel}
                    onRefreshPayment={handleRefreshPayment}
                  />
                ))}

                {selectedDayCount === 0 ? (
                  <div className="px-6 py-14 text-center sm:px-8">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary/20 text-primary">
                      <CalendarDays className="size-5" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-primary">
                      No booked consultations in this {activePeriod.toUpperCase()} view.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Empty rows are still shown so patients can understand the full day.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!loading && viewMode === "summary" ? (
              <SummaryAppointmentList
                appointments={visibleAppointments}
                refreshingPaymentId={refreshingPaymentId}
                onJoin={handleJoin}
                onCancel={handleCancel}
                onRefreshPayment={handleRefreshPayment}
              />
            ) : null}
          </main>
        </section>
      </div>

      {refundAppointment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#082b45]/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#12324d]/10 bg-white p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Refund request
            </p>
            <h2 className="mt-2 text-2xl font-bold text-primary">
              Cancel paid consultation?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This will cancel the booking, reopen the time slot, and mark the
              doctor payout as refund requested. The actual refund can be
              reviewed by the clinic team.
            </p>
            <label className="mt-5 block text-sm font-semibold text-primary">
              Reason for cancellation
            </label>
            <textarea
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-xl border border-[#12324d]/15 bg-[#fcfaf5] px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="Example: I need to reschedule, duplicate booking, or wrong doctor selected."
            />
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRefundAppointment(null)}
              >
                Keep appointment
              </Button>
              <Button type="button" onClick={() => void handleConfirmRefundRequest()}>
                Submit refund request
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingRatingAppointment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#082b45]/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#12324d]/10 bg-white p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
              Consultation completed
            </p>
            <h2 className="mt-2 text-2xl font-bold text-primary">
              How was your doctor?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your rating helps Click Klinik keep care quality high for Filipino patients.
            </p>
            <div className="mt-5 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4">
              <p className="font-bold text-primary">{pendingRatingAppointment.doctorName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {pendingRatingAppointment.consultationLabel || pendingRatingAppointment.specializationName}
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] p-2"
                  aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
                >
                  <Star
                    className={
                      star <= ratingStars
                        ? "size-8 fill-secondary text-secondary"
                        : "size-8 text-muted-foreground"
                    }
                  />
                </button>
              ))}
            </div>
            <label className="mt-5 block text-sm font-semibold text-primary">
              Optional comment
            </label>
            <textarea
              value={ratingComment}
              onChange={(event) => setRatingComment(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-xl border border-[#12324d]/15 bg-[#fcfaf5] px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="Example: The doctor explained things clearly."
            />
            <Button
              type="button"
              className="mt-5 h-11 w-full rounded-xl"
              disabled={submittingRating}
              onClick={() => void handleSubmitRating(pendingRatingAppointment._id)}
            >
              {submittingRating ? "Saving rating..." : "Submit rating"}
            </Button>
          </div>
        </div>
      ) : null}
    </PatientWorkspaceShell>
  );
}

function CalendarTimeRow({
  row,
  refreshingPaymentId,
  onJoin,
  onCancel,
  onRefreshPayment,
}: {
  row: {
    timeLabel: string;
    endAt: Date;
    appointments: Appointment[];
  };
  refreshingPaymentId: string | null;
  onJoin: (appointmentId: string) => Promise<void>;
  onCancel: (appointmentId: string) => Promise<void>;
  onRefreshPayment: (appointmentId: string) => Promise<void>;
}) {
  return (
    <div className="grid min-h-[118px] gap-4 px-6 py-4 sm:px-8 md:grid-cols-[104px_1fr]">
      <div className="text-sm text-primary">
        <p className="font-bold">{row.timeLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatTime(row.endAt.toISOString())} end
        </p>
      </div>

      {row.appointments.length > 0 ? (
        <div className="grid gap-3">
          {row.appointments.map((appointment) => (
            <AppointmentRow
              key={appointment._id}
              appointment={appointment}
              refreshingPaymentId={refreshingPaymentId}
              onJoin={onJoin}
              onCancel={onCancel}
              onRefreshPayment={onRefreshPayment}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[86px] max-w-[340px] items-center justify-center rounded-xl border border-dashed border-[#12324d]/15 bg-white text-center">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">No consultation</p>
            <p className="mt-1 text-xs text-muted-foreground">Empty 30-minute slot</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryAppointmentList({
  appointments,
  refreshingPaymentId,
  onJoin,
  onCancel,
  onRefreshPayment,
}: {
  appointments: Appointment[];
  refreshingPaymentId: string | null;
  onJoin: (appointmentId: string) => Promise<void>;
  onCancel: (appointmentId: string) => Promise<void>;
  onRefreshPayment: (appointmentId: string) => Promise<void>;
}) {
  const upcomingAppointments = appointments.filter(
    (appointment) =>
      appointment.status !== "completed" && appointment.status !== "cancelled",
  );
  const groupedAppointments = groupAppointmentsByDate(upcomingAppointments);

  if (upcomingAppointments.length === 0) {
    return (
      <div className="px-6 py-14 text-center sm:px-8">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary/20 text-primary">
          <CalendarDays className="size-5" />
        </div>
        <p className="mt-4 text-sm font-semibold text-primary">
          No upcoming consultations.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Book a doctor from Find care when you need a new appointment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-6 sm:px-8">
      {groupedAppointments.map((group) => (
        <section key={group.dateKey}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                {group.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {group.appointments.length} consultation
                {group.appointments.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="grid gap-3">
            {group.appointments.map((appointment) => (
              <AppointmentRow
                key={appointment._id}
                appointment={appointment}
                refreshingPaymentId={refreshingPaymentId}
                onJoin={onJoin}
                onCancel={onCancel}
                onRefreshPayment={onRefreshPayment}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function AppointmentRow({
  appointment,
  refreshingPaymentId,
  onJoin,
  onCancel,
  onRefreshPayment,
}: {
  appointment: Appointment;
  refreshingPaymentId: string | null;
  onJoin: (appointmentId: string) => Promise<void>;
  onCancel: (appointmentId: string) => Promise<void>;
  onRefreshPayment: (appointmentId: string) => Promise<void>;
}) {
  const statusMeta = getStatusMeta(appointment.status);
  const paymentMeta = getPaymentMeta(appointment.paymentStatus);

  return (
    <article>
      <div className="hidden">
        <p className="font-bold">{formatTime(appointment.scheduledStartAt)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatAppointmentDate(appointment.scheduledStartAt)}
        </p>
      </div>

      <div
        className={cn(
          "rounded-xl border bg-white px-4 py-4 shadow-[0_16px_40px_-34px_rgba(8,43,69,0.9)]",
          statusMeta.cardClass,
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold text-primary">{appointment.doctorName}</p>
              <StatusBadge status={appointment.status} />
              <PaymentBadge status={appointment.paymentStatus} />
              {appointment.refundStatus && appointment.refundStatus !== "none" ? (
                <RefundBadge status={appointment.refundStatus} />
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {appointment.specializationName}
              {appointment.doctorLocation ? ` • ${appointment.doctorLocation}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canJoinAppointment(appointment) ? (
              <Button
                className="h-10 rounded-xl"
                onClick={() => void onJoin(appointment._id)}
              >
                <Video className="size-4" />
                Join
              </Button>
            ) : appointment.paymentPlan === "pay_now" &&
              appointment.paymentStatus !== "paid" &&
              appointment.status !== "cancelled" ? (
              <Button className="h-10 rounded-xl" disabled>
                <Video className="size-4" />
                Pay to join
              </Button>
            ) : null}
            {canCancelAppointment(appointment) ? (
              <Button
                variant="outline"
                className="h-10 rounded-xl"
                onClick={() => void onCancel(appointment._id)}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <DetailTile
            icon={<Clock3 className="size-4" />}
            label="Schedule"
            value={formatAppointmentTimeRange(
              appointment.scheduledStartAt,
              appointment.scheduledEndAt,
            )}
          />
          <DetailTile
            icon={statusMeta.icon}
            label="Status"
            value={statusMeta.label}
            valueClassName={statusMeta.textClass}
          />
          <DetailTile
            icon={<CreditCard className="size-4" />}
            label="Payment"
            value={
              appointment.paymentPlan === "pay_after_consultation"
                ? `${paymentMeta.label} after consult`
                : paymentMeta.label
            }
            valueClassName={paymentMeta.textClass}
          />
          <DetailTile
            icon={<CalendarDays className="size-4" />}
            label="Total fee"
            value={formatAppointmentFee(appointment.totalFeePhp)}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#12324d]/10 pt-4">
          <p className="mr-auto text-sm text-muted-foreground">
            {getConsultationLabel(appointment)}
            {appointment.paymentPlan === "pay_now" &&
            appointment.paymentStatus !== "paid" &&
            appointment.paymentDueAt ? (
              <span className="mt-1 block text-xs font-semibold text-amber-700">
                Pay before {formatPaymentDeadline(appointment.paymentDueAt)} or this
                booking will be cancelled.
              </span>
            ) : null}
            {appointment.refundStatus === "requested" ? (
              <span className="mt-1 block text-xs font-semibold text-amber-700">
                Refund requested. Clinic review is pending.
              </span>
            ) : null}
            {appointment.refundStatus === "refunded" ? (
              <span className="mt-1 block text-xs font-semibold text-emerald-700">
                Refunded through Xendit test mode.
              </span>
            ) : null}
            {appointment.paymentStatus === "paid" &&
            canCancelAppointment(appointment) ? (
              <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                Refund available until {formatPaymentDeadline(getRefundDeadline(appointment.createdAt))}.
              </span>
            ) : null}
          </p>
          {appointment.paymentCheckoutUrl && appointment.paymentStatus !== "paid" ? (
            <Button asChild variant="outline" className="h-10 rounded-xl">
              <Link href={appointment.paymentCheckoutUrl}>
                {appointment.paymentPlan === "pay_after_consultation"
                  ? "Pay after consultation"
                  : "Complete test payment"}
              </Link>
            </Button>
          ) : null}
          {canRefreshPayment(appointment) ? (
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              disabled={refreshingPaymentId === appointment._id}
              onClick={() => void onRefreshPayment(appointment._id)}
            >
              {refreshingPaymentId === appointment._id ? "Checking..." : "I already paid"}
            </Button>
          ) : null}
          {appointment.googleCalendarHtmlLink ? (
            <Button asChild variant="outline" className="h-10 rounded-xl">
              <Link href={appointment.googleCalendarHtmlLink} target="_blank">
                <ExternalLink className="size-4" />
                Calendar invite
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            onClick={() => downloadAppointmentReceipt(appointment)}
          >
            Receipt
          </Button>
        </div>
      </div>
    </article>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-3">
      <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-primary">{value}</p>
    </div>
  );
}

function ToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 rounded-xl border px-3 text-sm font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-[#12324d]/10 bg-[#fcfaf5] text-primary hover:bg-primary/[0.04]",
      )}
    >
      {children}
    </button>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="h-11 w-full rounded-xl border border-[#12324d]/10 bg-white px-3 text-sm text-primary outline-none"
    >
      {children}
    </select>
  );
}

function DetailTile({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-xs font-semibold">{label}</p>
      </div>
      <p className={cn("mt-2 text-sm font-bold text-primary", valueClassName)}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const meta = getStatusMeta(status);

  return (
    <Badge className={cn("rounded-full border px-2.5 py-1 shadow-none", meta.badgeClass)}>
      {meta.label}
    </Badge>
  );
}

function PaymentBadge({ status }: { status?: AppointmentPaymentStatus }) {
  const meta = getPaymentMeta(status);

  return (
    <Badge className={cn("rounded-full border px-2.5 py-1 shadow-none", meta.badgeClass)}>
      {meta.label}
    </Badge>
  );
}

function RefundBadge({
  status,
}: {
  status: NonNullable<Appointment["refundStatus"]>;
}) {
  const label = status.replace(/_/g, " ");
  const className =
    status === "refunded"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "requested"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-zinc-200 bg-zinc-50 text-zinc-700";

  return (
    <Badge className={cn("rounded-full border px-2.5 py-1 shadow-none", className)}>
      Refund {label}
    </Badge>
  );
}

function getStatusMeta(status: AppointmentStatus) {
  const map = {
    booked: {
      label: "Booked",
      icon: <CalendarDays className="size-4" />,
      badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
      cardClass: "border-sky-200",
      textClass: "text-sky-700",
    },
    confirmed: {
      label: "Confirmed",
      icon: <CheckCircle2 className="size-4" />,
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      cardClass: "border-emerald-200",
      textClass: "text-emerald-700",
    },
    active_consultation: {
      label: "Active",
      icon: <Video className="size-4" />,
      badgeClass: "border-primary/20 bg-primary text-primary-foreground",
      cardClass: "border-primary/25",
      textClass: "text-primary",
    },
    completed: {
      label: "Completed",
      icon: <CheckCircle2 className="size-4" />,
      badgeClass: "border-zinc-200 bg-zinc-100 text-zinc-700",
      cardClass: "border-zinc-200 opacity-90",
      textClass: "text-zinc-700",
    },
    cancelled: {
      label: "Cancelled",
      icon: <XCircle className="size-4" />,
      badgeClass: "border-red-200 bg-red-50 text-red-700",
      cardClass: "border-red-200 opacity-90",
      textClass: "text-red-700",
    },
  } satisfies Record<
    AppointmentStatus,
    {
      label: string;
      icon: React.ReactNode;
      badgeClass: string;
      cardClass: string;
      textClass: string;
    }
  >;

  return map[status];
}

function getPaymentMeta(status?: AppointmentPaymentStatus) {
  if (!status) {
    return {
      label: "Not set",
      badgeClass: "border-zinc-200 bg-zinc-50 text-zinc-700",
      textClass: "text-zinc-700",
    };
  }

  const map = {
    paid: {
      label: "Paid",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      textClass: "text-emerald-700",
    },
    refunded: {
      label: "Refunded",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      textClass: "text-emerald-700",
    },
    pending: {
      label: "Pending",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
      textClass: "text-amber-800",
    },
    unpaid: {
      label: "Unpaid",
      badgeClass: "border-red-200 bg-red-50 text-red-700",
      textClass: "text-red-700",
    },
    mock_pending: {
      label: "Test pending",
      badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
      textClass: "text-blue-700",
    },
  } satisfies Record<
    AppointmentPaymentStatus,
    {
      label: string;
      badgeClass: string;
      textClass: string;
    }
  >;

  return map[status];
}

function getAppointmentCounts(appointments: Appointment[]) {
  return appointments.reduce(
    (counts, appointment) => {
      if (appointment.status !== "completed" && appointment.status !== "cancelled") {
        counts.upcoming += 1;
      }

      if (appointment.paymentStatus === "paid") {
        counts.paid += 1;
      }

      if (
        appointment.status !== "cancelled" &&
        appointment.paymentPlan === "pay_now" &&
        appointment.paymentStatus !== "paid"
      ) {
        counts.needsPayment += 1;
      }

      return counts;
    },
    { needsPayment: 0, paid: 0, upcoming: 0 },
  );
}

function sortAppointments(left: Appointment, right: Appointment, mode: SortMode) {
  if (mode === "latest") {
    return new Date(right.scheduledStartAt).getTime() - new Date(left.scheduledStartAt).getTime();
  }

  if (mode === "newest") {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  }

  if (mode === "highest_fee") {
    return (right.totalFeePhp ?? 0) - (left.totalFeePhp ?? 0);
  }

  return new Date(left.scheduledStartAt).getTime() - new Date(right.scheduledStartAt).getTime();
}

function buildCalendarRows(
  selectedDate: Date,
  activePeriod: DayPeriod,
  appointments: Appointment[],
) {
  const startMinutes = activePeriod === "am" ? 7 * 60 : 12 * 60;
  const endMinutes = activePeriod === "am" ? 12 * 60 : 20 * 60;
  const rows: Array<{
    timeLabel: string;
    startAt: Date;
    endAt: Date;
    appointments: Appointment[];
  }> = [];

  for (let current = startMinutes; current < endMinutes; current += 30) {
    const startAt = setTime(selectedDate, current);
    const endAt = setTime(selectedDate, current + 30);

    rows.push({
      timeLabel: formatTime(startAt.toISOString()),
      startAt,
      endAt,
      appointments: appointments.filter((appointment) => {
        const appointmentStart = new Date(appointment.scheduledStartAt);
        return (
          isSameDay(appointmentStart, selectedDate) &&
          appointmentStart >= startAt &&
          appointmentStart < endAt
        );
      }),
    });
  }

  return rows;
}

function groupAppointmentsByDate(appointments: Appointment[]) {
  const groups = new Map<string, Appointment[]>();

  for (const appointment of appointments) {
    const date = startOfDay(new Date(appointment.scheduledStartAt));
    const key = date.toISOString();
    const current = groups.get(key) ?? [];
    current.push(appointment);
    groups.set(key, current);
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => new Date(left).getTime() - new Date(right).getTime())
    .map(([dateKey, groupAppointments]) => ({
      dateKey,
      label: formatWeekdayDate(new Date(dateKey)),
      appointments: groupAppointments.sort(
        (left, right) =>
          new Date(left.scheduledStartAt).getTime() -
          new Date(right.scheduledStartAt).getTime(),
      ),
    }));
}

function setTime(date: Date, minutesOfDay: number) {
  const next = new Date(date);
  next.setHours(Math.floor(minutesOfDay / 60), minutesOfDay % 60, 0, 0);
  return next;
}

function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatAppointmentTimeRange(startAt: string, endAt: string) {
  return `${formatTime(startAt)} - ${formatTime(endAt)}`;
}

function formatPaymentDeadline(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getRefundDeadline(createdAt: string) {
  return new Date(new Date(createdAt).getTime() + 6 * 60 * 60 * 1000).toISOString();
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getConsultationLabel(appointment: Appointment) {
  return appointment.consultationLabel?.trim() || "Teleconsultation";
}

function formatAppointmentFee(totalFeePhp?: number) {
  return typeof totalFeePhp === "number" && Number.isFinite(totalFeePhp)
    ? formatPhp(totalFeePhp)
    : "Not set";
}

function canJoinAppointment(appointment: Appointment) {
  if (appointment.status === "cancelled" || appointment.status === "completed") {
    return false;
  }

  return (
    appointment.paymentPlan !== "pay_now" || appointment.paymentStatus === "paid"
  );
}

function canCancelAppointment(appointment: Appointment) {
  return appointment.status === "booked" || appointment.status === "confirmed";
}

function canRefreshPayment(appointment: Appointment) {
  return (
    appointment.paymentStatus !== "paid" &&
    appointment.status !== "cancelled"
  );
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatWeekdayDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function downloadAppointmentReceipt(appointment: Appointment) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Click Klinik Receipt</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body { color: #082b45; font-family: Georgia, "Times New Roman", serif; margin: 0; }
          .paper { min-height: 94vh; position: relative; }
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
          }
          .content { position: relative; z-index: 1; }
          header { border-bottom: 2px solid #082b45; padding-bottom: 14px; }
          h1 { font-size: 28px; margin: 0; }
          .muted { color: #49657a; font-size: 13px; }
          .grid { display: grid; gap: 10px; grid-template-columns: 1fr 1fr; margin-top: 20px; }
          .box { border: 1px solid #d8d0c2; border-radius: 10px; padding: 12px; }
          .label { color: #49657a; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
          .value { font-size: 15px; font-weight: 700; margin-top: 5px; }
          .total { background: #f7f2e8; border: 1px solid #d8d0c2; border-radius: 14px; margin-top: 24px; padding: 18px; }
          footer { border-top: 1px solid #d8d0c2; bottom: 0; color: #49657a; font-size: 11px; padding-top: 10px; position: absolute; width: 100%; }
        </style>
      </head>
      <body>
        <div class="paper">
          <div class="watermark">click-klinik</div>
          <div class="content">
            <header>
              <h1>Click Klinik Receipt</h1>
              <p class="muted">Appointment and payment copy</p>
            </header>
            <section class="grid">
              <div class="box"><div class="label">Patient</div><div class="value">${escapeReceiptHtml(appointment.patientName)}</div></div>
              <div class="box"><div class="label">Doctor</div><div class="value">${escapeReceiptHtml(appointment.doctorName)}</div></div>
              <div class="box"><div class="label">Consultation</div><div class="value">${escapeReceiptHtml(appointment.consultationLabel || appointment.specializationName)}</div></div>
              <div class="box"><div class="label">Schedule</div><div class="value">${escapeReceiptHtml(formatAppointmentTimeRange(appointment.scheduledStartAt, appointment.scheduledEndAt))}</div></div>
              <div class="box"><div class="label">Payment status</div><div class="value">${escapeReceiptHtml(getPaymentMeta(appointment.paymentStatus).label)}</div></div>
              <div class="box"><div class="label">Reference</div><div class="value">${escapeReceiptHtml(appointment.paymentReferenceId || appointment._id)}</div></div>
            </section>
            <section class="total">
              <div class="label">Total amount</div>
              <div class="value">${escapeReceiptHtml(formatAppointmentFee(appointment.totalFeePhp))}</div>
            </section>
          </div>
          <footer>Watermark: click-klinik. This is a hackathon test-mode payment receipt.</footer>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function escapeReceiptHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
