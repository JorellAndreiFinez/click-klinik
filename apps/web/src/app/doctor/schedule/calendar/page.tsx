"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  FilePenLine,
  MapPin,
  Navigation,
  Phone,
  Search,
  Video,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPhp } from "@/features/appointments/booking-catalog";
import { dashboardPageTranslations } from "@/features/localization/dashboard-page-translations";
import { useLocale } from "@/features/localization/locale-provider";
import {
  getMyDoctorAppointments,
  joinAppointment,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentPaymentStatus,
  type AppointmentStatus,
} from "@/lib/appointments-api";
import { cn } from "@/lib/utils";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";

type StatusFilter = "all" | "upcoming" | AppointmentStatus;
type PaymentFilter = "all" | AppointmentPaymentStatus;
type SortMode = "soonest" | "latest" | "newest" | "patient";
type DateScope = "all" | "selected_day";
type DayPeriod = "am" | "pm";
type CalendarViewMode = "calendar" | "summary";

export default function DoctorScheduleCalendarPage() {
  const { user } = useDoctorWorkspace();
  const { locale } = useLocale();
  const t = dashboardPageTranslations[locale].doctorCalendar;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("soonest");
  const [dateScope, setDateScope] = useState<DateScope>("all");
  const [activePeriod, setActivePeriod] = useState<DayPeriod>("am");
  const [viewMode, setViewMode] = useState<CalendarViewMode>("calendar");

  useEffect(() => {
    if (!user) {
      return;
    }

    void getMyDoctorAppointments(user)
      .then((result) => {
        setAppointments(result);
        const nextAppointment = result.find(
          (appointment) =>
            appointment.status !== "completed" &&
            appointment.status !== "cancelled",
        );
        if (nextAppointment) {
          setSelectedDate(startOfDay(new Date(nextAppointment.scheduledStartAt)));
        }
        setLoading(false);
      })
      .catch((error: unknown) => {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to load doctor consultations.",
        );
        setLoading(false);
      });
  }, [user]);

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
      } else {
        const appointment = result.appointment;
        if (appointment.triage?.consultMethod === "cellular") {
          window.open(`tel:${appointment.patientMobileNumber ?? ""}`, "_self");
        }
        if (appointment.triage?.consultMethod === "physical_visit") {
          window.open(`/consultation-route/${appointment._id}`, "_blank", "noopener,noreferrer");
        }
      }
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to join consultation.",
      );
    }
  }

  async function handleComplete(appointmentId: string) {
    if (!user) {
      return;
    }

    setActionError(null);

    try {
      const updated = await updateAppointmentStatus(user, appointmentId, "completed");
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === appointmentId ? updated : appointment,
        ),
      );
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Unable to complete consultation.",
      );
    }
  }

  const visibleAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return appointments
      .filter((appointment) => {
        if (
          dateScope === "selected_day" &&
          !isSameDay(new Date(appointment.scheduledStartAt), selectedDate)
        ) {
          return false;
        }

        if (statusFilter === "upcoming") {
          if (appointment.status === "completed" || appointment.status === "cancelled") {
            return false;
          }
        } else if (statusFilter !== "all" && appointment.status !== statusFilter) {
          return false;
        }

        if (paymentFilter !== "all" && appointment.paymentStatus !== paymentFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          appointment.patientName,
          appointment.patientEmail,
          appointment.consultationLabel,
          appointment.specializationName,
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
  const counts = useMemo(() => getAppointmentCounts(appointments), [appointments]);
  const selectedDayAppointments = visibleAppointments.filter((appointment) =>
    isSameDay(new Date(appointment.scheduledStartAt), selectedDate),
  );
  const activePeriodCount = calendarRows.reduce(
    (total, row) => total + row.appointments.length,
    0,
  );
  const selectedDayCount = selectedDayAppointments.length;

  return (
    <div className="min-h-full bg-[#f7f2e8]">
      <section className="relative overflow-hidden border-b border-[#12324d]/10 bg-[#082b45] text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="grid lg:grid-cols-[1fr_360px]">
          <div className="relative px-6 py-7 sm:px-8">
            <p className="text-xs font-bold tracking-[0.18em] text-secondary uppercase">
              {t.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-white sm:text-4xl">
              {t.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              {t.description}
            </p>
          </div>
          <div className="relative border-t border-white/15 px-6 py-6 sm:px-8 lg:border-t-0 lg:border-l">
            <p className="text-xs font-bold tracking-[0.18em] text-secondary uppercase">
              {t.quickStatus}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <SummaryPill label={t.upcoming} value={counts.upcoming} />
              <SummaryPill label={t.paid} value={counts.paid} />
              <SummaryPill label={t.needsNote} value={counts.needsNote} />
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
              <ToggleButton active={dateScope === "all"} onClick={() => setDateScope("all")}>
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
                  placeholder="Patient, email, status"
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
                <option value="refunded">Refunded</option>
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
                <option value="patient">Patient A-Z</option>
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
              <SegmentedToggle
                leftLabel="Calendar"
                rightLabel="Summary"
                leftActive={viewMode === "calendar"}
                onLeft={() => setViewMode("calendar")}
                onRight={() => setViewMode("summary")}
              />
              <SegmentedToggle
                leftLabel="AM"
                rightLabel="PM"
                leftActive={activePeriod === "am"}
                onLeft={() => setActivePeriod("am")}
                onRight={() => setActivePeriod("pm")}
              />
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
              Loading doctor consultations...
            </div>
          ) : null}

          {!loading && viewMode === "calendar" ? (
            <div className="divide-y divide-[#12324d]/10">
              {calendarRows.map((row) => (
                <CalendarTimeRow
                  key={row.timeLabel}
                  row={row}
                  onJoin={handleJoin}
                  onComplete={handleComplete}
                />
              ))}

              {activePeriodCount === 0 ? (
                <div className="px-6 py-14 text-center sm:px-8">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary/20 text-primary">
                    <CalendarDays className="size-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-primary">
                    No booked consultations in this {activePeriod.toUpperCase()} view.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Empty 30-minute rows are shown so the doctor can scan the whole clinic day.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {!loading && viewMode === "summary" ? (
            <SummaryConsultationList
              appointments={visibleAppointments}
              onJoin={handleJoin}
              onComplete={handleComplete}
            />
          ) : null}
        </main>
      </section>
    </div>
  );
}

function CalendarTimeRow({
  row,
  onJoin,
  onComplete,
}: {
  row: { timeLabel: string; endAt: Date; appointments: Appointment[] };
  onJoin: (appointmentId: string) => Promise<void>;
  onComplete: (appointmentId: string) => Promise<void>;
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
            <DoctorConsultationRow
              key={appointment._id}
              appointment={appointment}
              onJoin={onJoin}
              onComplete={onComplete}
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

function SummaryConsultationList({
  appointments,
  onJoin,
  onComplete,
}: {
  appointments: Appointment[];
  onJoin: (appointmentId: string) => Promise<void>;
  onComplete: (appointmentId: string) => Promise<void>;
}) {
  const groupedAppointments = groupAppointmentsByDate(appointments);

  if (appointments.length === 0) {
    return (
      <div className="px-6 py-14 text-center sm:px-8">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary/20 text-primary">
          <CalendarDays className="size-5" />
        </div>
        <p className="mt-4 text-sm font-semibold text-primary">
          No consultations match these filters.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try resetting filters or choosing another date.
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
              <DoctorConsultationRow
                key={appointment._id}
                appointment={appointment}
                onJoin={onJoin}
                onComplete={onComplete}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DoctorConsultationRow({
  appointment,
  onJoin,
  onComplete,
}: {
  appointment: Appointment;
  onJoin: (appointmentId: string) => Promise<void>;
  onComplete: (appointmentId: string) => Promise<void>;
}) {
  const statusMeta = getStatusMeta(appointment.status);
  const paymentMeta = getPaymentMeta(appointment.paymentStatus);

  return (
    <article
      className={cn(
        "rounded-xl border bg-white px-4 py-4 shadow-[0_16px_40px_-34px_rgba(8,43,69,0.9)]",
        statusMeta.cardClass,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold text-primary">{appointment.patientName}</p>
            <StatusBadge status={appointment.status} />
            <PaymentBadge status={appointment.paymentStatus} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {appointment.patientEmail} • {appointment.consultationLabel || appointment.specializationName}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canJoinAppointment(appointment) ? (
            <Button className="h-10 rounded-xl" onClick={() => void onJoin(appointment._id)}>
              {getConsultMethodIcon(appointment)}
              {getConsultActionLabel(appointment)}
            </Button>
          ) : appointment.paymentPlan === "pay_now" &&
            appointment.paymentStatus !== "paid" &&
            appointment.status !== "cancelled" ? (
            <Button className="h-10 rounded-xl" disabled>
              <Video className="size-4" />
              Awaiting pay
            </Button>
          ) : null}
          {appointment.status !== "completed" && appointment.status !== "cancelled" ? (
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => void onComplete(appointment._id)}
            >
              Complete
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
          value={paymentMeta.label}
          valueClassName={paymentMeta.textClass}
        />
        <DetailTile
          icon={<CalendarDays className="size-4" />}
          label="Doctor payout"
          value={formatDoctorPayout(appointment)}
        />
      </div>

      {appointment.triage?.consultMethod !== "google_meet" ? (
        <div className="mt-4 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4 text-sm text-muted-foreground">
          {appointment.triage?.consultMethod === "cellular" ? (
            <p>
              Phone session. Patient mobile:{" "}
              <span className="font-semibold text-primary">
                {appointment.patientMobileNumber ?? "Not provided"}
              </span>
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Physical visit. Clinic:{" "}
                <span className="font-semibold text-primary">
                  {appointment.doctorLocation ?? appointment.doctorClinicOrHospital ?? "Clinic location"}
                </span>
              </p>
              <Button asChild variant="outline" className="h-9 rounded-xl">
                <Link href={`/consultation-route/${appointment._id}`}>
                  <Navigation className="size-4" />
                  Route
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-9 rounded-xl">
                <Link href={buildMapsDirectionsUrl(appointment)} target="_blank">
                  Maps backup
                </Link>
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#12324d]/10 pt-4">
        <p className="mr-auto text-sm text-muted-foreground">
          {appointment.triage?.chiefComplaint
            ? `Chief complaint: ${appointment.triage.chiefComplaint}`
            : getConsultationLabel(appointment)}
        </p>
        <Button asChild variant="outline" className="h-10 rounded-xl">
          <Link href="/doctor/notes">
            <FilePenLine className="size-4" />
            Notes & Rx
          </Link>
        </Button>
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
          onClick={() => downloadDoctorReceipt(appointment)}
        >
          Receipt
        </Button>
      </div>
    </article>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/8 px-3 py-3">
      <p className="text-[10px] font-bold tracking-[0.14em] text-secondary uppercase">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function SegmentedToggle({
  leftLabel,
  rightLabel,
  leftActive,
  onLeft,
  onRight,
}: {
  leftLabel: string;
  rightLabel: string;
  leftActive: boolean;
  onLeft: () => void;
  onRight: () => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-xl border border-[#12324d]/10 bg-white p-1">
      <button
        type="button"
        onClick={onLeft}
        className={cn(
          "h-9 rounded-lg px-4 text-sm font-semibold transition-colors",
          leftActive ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/[0.04]",
        )}
      >
        {leftLabel}
      </button>
      <button
        type="button"
        onClick={onRight}
        className={cn(
          "h-9 rounded-lg px-4 text-sm font-semibold transition-colors",
          !leftActive ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/[0.04]",
        )}
      >
        {rightLabel}
      </button>
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

      if (appointment.status === "completed") {
        counts.needsNote += 1;
      }

      return counts;
    },
    { needsNote: 0, paid: 0, upcoming: 0 },
  );
}

function sortAppointments(left: Appointment, right: Appointment, mode: SortMode) {
  if (mode === "latest") {
    return new Date(right.scheduledStartAt).getTime() - new Date(left.scheduledStartAt).getTime();
  }

  if (mode === "newest") {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  }

  if (mode === "patient") {
    return left.patientName.localeCompare(right.patientName);
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

function formatAppointmentTimeRange(startAt: string, endAt: string) {
  return `${formatTime(startAt)} - ${formatTime(endAt)}`;
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

function formatDoctorPayout(appointment: Appointment) {
  if (appointment.paymentStatus !== "paid") {
    return "Pending";
  }

  return formatPhp(appointment.doctorPayoutPhp ?? Math.round((appointment.totalFeePhp ?? 0) * 0.85));
}

function canJoinAppointment(appointment: Appointment) {
  if (appointment.status === "cancelled" || appointment.status === "completed") {
    return false;
  }

  return appointment.paymentPlan !== "pay_now" || appointment.paymentStatus === "paid";
}

function getConsultActionLabel(appointment: Appointment) {
  if (appointment.triage?.consultMethod === "cellular") {
    return "Call patient";
  }

  if (appointment.triage?.consultMethod === "physical_visit") {
    return "Open route";
  }

  return "Join";
}

function getConsultMethodIcon(appointment: Appointment) {
  if (appointment.triage?.consultMethod === "cellular") {
    return <Phone className="size-4" />;
  }

  if (appointment.triage?.consultMethod === "physical_visit") {
    return <MapPin className="size-4" />;
  }

  return <Video className="size-4" />;
}

function buildMapsDirectionsUrl(appointment: Appointment) {
  const params = new URLSearchParams({
    api: "1",
    origin:
      formatCoordinatePair(appointment.patientLatitude, appointment.patientLongitude) ??
      appointment.patientLocation ??
      "",
    destination:
      formatCoordinatePair(appointment.doctorLatitude, appointment.doctorLongitude) ??
      appointment.doctorLocation ??
      appointment.doctorClinicOrHospital ??
      appointment.doctorCityMunicipalityName ??
      "",
    travelmode: "driving",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function formatCoordinatePair(latitude?: number, longitude?: number) {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return undefined;
  }

  return `${latitude},${longitude}`;
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

function downloadDoctorReceipt(appointment: Appointment) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return;
  }

  const commission = appointment.platformCommissionPhp ?? Math.round((appointment.totalFeePhp ?? 0) * 0.15);
  const payout = appointment.doctorPayoutPhp ?? Math.max((appointment.totalFeePhp ?? 0) - commission, 0);

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Click Klinik Doctor Receipt</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body { color: #082b45; font-family: Georgia, "Times New Roman", serif; margin: 0; }
          .paper { min-height: 94vh; position: relative; }
          .watermark { color: rgba(8,43,69,.07); font-size: 76px; font-weight: 800; left: 50%; letter-spacing: 8px; position: fixed; text-transform: uppercase; top: 48%; transform: translate(-50%, -50%) rotate(-28deg); white-space: nowrap; }
          .content { position: relative; z-index: 1; }
          header { border-bottom: 2px solid #082b45; padding-bottom: 14px; }
          h1 { font-size: 28px; margin: 0; }
          .muted { color: #49657a; font-size: 13px; }
          .grid { display: grid; gap: 10px; grid-template-columns: 1fr 1fr; margin-top: 20px; }
          .box { border: 1px solid #d8d0c2; border-radius: 10px; padding: 12px; }
          .label { color: #49657a; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
          .value { font-size: 15px; font-weight: 700; margin-top: 5px; }
          footer { border-top: 1px solid #d8d0c2; bottom: 0; color: #49657a; font-size: 11px; padding-top: 10px; position: absolute; width: 100%; }
        </style>
      </head>
      <body>
        <div class="paper">
          <div class="watermark">click-klinik</div>
          <div class="content">
            <header>
              <h1>Doctor Payout Receipt</h1>
              <p class="muted">Consultation payment and commission copy</p>
            </header>
            <section class="grid">
              <div class="box"><div class="label">Patient</div><div class="value">${escapeReceiptHtml(appointment.patientName)}</div></div>
              <div class="box"><div class="label">Doctor</div><div class="value">${escapeReceiptHtml(appointment.doctorName)}</div></div>
              <div class="box"><div class="label">Gross amount</div><div class="value">${escapeReceiptHtml(formatPhp(appointment.totalFeePhp ?? 0))}</div></div>
              <div class="box"><div class="label">Click Klinik commission</div><div class="value">${escapeReceiptHtml(formatPhp(commission))}</div></div>
              <div class="box"><div class="label">Doctor payout</div><div class="value">${escapeReceiptHtml(formatPhp(payout))}</div></div>
              <div class="box"><div class="label">Payment status</div><div class="value">${escapeReceiptHtml(appointment.paymentStatus.replace(/_/g, " "))}</div></div>
            </section>
          </div>
          <footer>Watermark: click-klinik. This is a hackathon test-mode payout receipt.</footer>
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
