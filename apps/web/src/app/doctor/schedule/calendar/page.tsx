"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import { mockDoctorPatients } from "@/features/doctor/mock-doctor-patients";
import { getMyScheduleSlots, type ScheduleSlot } from "@/lib/schedule-api";

type CalendarEvent = {
  id: string;
  patient: string;
  concern: string;
  time: string;
  kind: "booked" | "open" | "blocked" | "passed";
};

const HALF_HOUR = 30;

export default function DoctorScheduleCalendarPage() {
  const { user } = useDoctorWorkspace();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    const isoDate = selectedDate.toISOString();
    void getMyScheduleSlots(user, { from: isoDate, to: isoDate }).then((nextSlots) => {
      setSlots(nextSlots);
    });
  }, [selectedDate, user]);

  const normalizedSearch = search.trim().toLowerCase();
  const selectedDaySlots = useMemo(
    () =>
      slots
        .filter((slot) => isSameDay(new Date(slot.startAt), selectedDate))
        .sort(
          (left, right) =>
            new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
        ),
    [selectedDate, slots],
  );

  const bookedEvents = useMemo(() => {
    const events = mockDoctorPatients.flatMap((patient) =>
      patient.appointments
        .filter(
          (appointment) =>
            appointment.status === "Upcoming" &&
            isSameDay(parseLongDate(appointment.date), selectedDate),
        )
        .map((appointment) => ({
          id: `${patient.id}-${appointment.date}-${appointment.time}`,
          patient: patient.name,
          concern: appointment.concern,
          time: appointment.time,
          kind: "booked" as const,
        })),
    );

    if (!normalizedSearch) {
      return events;
    }

    return events.filter((event) =>
      `${event.patient} ${event.concern}`.toLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch, selectedDate]);

  const visibleEvents = useMemo(() => {
    const availabilityRows = buildAvailabilityRows(selectedDate, selectedDaySlots).map(
      (row) => {
        const booked = bookedEvents.find((event) => event.time === row.timeLabel);
        if (booked) {
          return booked;
        }

        if (row.kind === "available") {
          return {
            id: `open-${row.timeLabel}`,
            patient: "Open slot",
            concern: "Consultation window",
            time: row.timeLabel,
            kind: isPastRow(selectedDate, row.hour, row.minute) ? "passed" : "open",
          } satisfies CalendarEvent;
        }

        return {
          id: `blocked-${row.timeLabel}`,
          patient: "Blocked slot",
          concern: "Doctor unavailable",
          time: row.timeLabel,
          kind: "blocked",
        } satisfies CalendarEvent;
      },
    );

    if (!normalizedSearch) {
      return availabilityRows;
    }

    return availabilityRows.filter((event) =>
      `${event.patient} ${event.concern}`.toLowerCase().includes(normalizedSearch),
    );
  }, [bookedEvents, normalizedSearch, selectedDate, selectedDaySlots]);

  const bookedCount = visibleEvents.filter((event) => event.kind === "booked").length;
  const openCount = visibleEvents.filter((event) => event.kind === "open").length;

  return (
    <div className="w-full bg-[#f7f2e8]">
      <section className="border-b border-[#12324d]/10 bg-white">
        <div className="grid xl:grid-cols-[1.08fr_0.92fr]">
          <div className="px-6 py-7 sm:px-8">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Calendar
            </p>
            <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
              See consultation meetings in 30-minute rows.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              This board follows the doctor&apos;s saved availability and makes booked
              consultations easy to spot in a cleaner day view.
            </p>
          </div>
          <div className="border-t border-[#12324d]/10 px-6 py-7 sm:px-8 xl:border-t-0 xl:border-l">
            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
              Daily summary
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <SummaryStat label="Booked" value={String(bookedCount)} />
              <SummaryStat label="Open" value={String(openCount)} />
              <SummaryStat label="Rows" value={String(visibleEvents.length)} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-[1fr_300px]">
        <div className="border-r border-[#12324d]/10 bg-[#fffdf8]">
          <div className="flex flex-wrap items-center gap-3 border-b border-[#12324d]/10 px-6 py-4 sm:px-8">
            <div className="flex items-center gap-2">
              <ToolbarIcon onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
                <ChevronLeft className="size-4" />
              </ToolbarIcon>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedDate(startOfDay(new Date()))}
                className="h-11 rounded-xl"
              >
                Today
              </Button>
              <ToolbarIcon onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                <ChevronRight className="size-4" />
              </ToolbarIcon>
            </div>

            <div className="flex min-h-11 min-w-[220px] flex-1 items-center gap-3 rounded-xl border border-[#12324d]/10 bg-white px-4">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search patient or concern"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <Button asChild className="h-11 rounded-xl">
              <Link href="/doctor/schedule">Open availability</Link>
            </Button>
          </div>

          <div className="grid grid-cols-[110px_1fr] border-b border-[#12324d]/10 bg-[#fcfaf5] px-6 py-4 text-sm font-semibold text-primary sm:px-8">
            <p>Time</p>
            <div className="flex items-center justify-between gap-3">
              <p>Consultations</p>
              <p className="text-muted-foreground">{formatLongDate(selectedDate)}</p>
            </div>
          </div>

          <div className="max-h-[calc(100vh-254px)] overflow-auto bg-[#fffdf8]">
            {visibleEvents.map((event) => (
              <div
                key={event.id}
                className="grid min-h-[108px] grid-cols-[110px_1fr] border-b border-[#12324d]/10 px-6 py-4 sm:px-8"
              >
                <div className="pr-4 text-sm text-primary">{event.time}</div>
                <div>
                  <CalendarCard event={event} />
                </div>
              </div>
            ))}

            {visibleEvents.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                No consultation rows for this view yet.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="bg-[#fcfaf5] px-6 py-5 sm:px-8">
          <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
            Day view
          </p>
          <p className="mt-2 text-xl font-bold text-primary">
            {formatWeekdayDate(selectedDate)}
          </p>

          <div className="mt-5 space-y-5">
            <div className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4">
              <p className="text-sm font-semibold">Calendar notes</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This board uses 30-minute increments inside the doctor&apos;s saved
                availability, so booked consultations are easier to scan.
              </p>
            </div>

            <div className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4">
              <p className="text-sm font-semibold">Quick links</p>
              <div className="mt-3 grid gap-2">
                <SideLink href="/doctor/session" icon={<Video className="size-4" />}>
                  Open consult room
                </SideLink>
                <SideLink href="/doctor/dashboard" icon={<CalendarDays className="size-4" />}>
                  Return to overview
                </SideLink>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function CalendarCard({ event }: { event: CalendarEvent }) {
  if (event.kind === "booked") {
    return (
      <div className="max-w-[320px] rounded-xl border border-primary/20 bg-primary px-4 py-3 text-primary-foreground shadow-[0_12px_32px_-22px_rgba(8,43,69,0.8)]">
        <p className="text-base font-bold">{event.patient}</p>
        <p className="mt-1 text-xs text-primary-foreground/70">{event.concern}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Badge className="border-0 bg-secondary px-3 py-1 text-secondary-foreground shadow-none">
            Booked
          </Badge>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-secondary"
          >
            <Video className="size-3.5" />
            Join
          </button>
        </div>
      </div>
    );
  }

  if (event.kind === "blocked") {
    return (
      <div className="max-w-[320px] rounded-xl border border-border bg-[#f7f7f7] px-4 py-5 text-center text-muted-foreground">
        <p className="text-sm font-semibold">Blocked slot</p>
        <p className="mt-1 text-xs">Doctor unavailable</p>
      </div>
    );
  }

  return (
    <div className="max-w-[320px] rounded-xl border border-dashed border-border bg-white px-4 py-5 text-center text-muted-foreground">
      <p className="text-sm font-semibold">
        {event.kind === "passed" ? "Slot passed" : "Open slot"}
      </p>
      <p className="mt-1 text-xs">
        {event.kind === "passed" ? "No consultation booked" : "Available for booking"}
      </p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4">
      <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

function ToolbarIcon({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center rounded-xl border border-[#12324d]/10 bg-white text-primary transition-colors hover:bg-primary/[0.03]"
    >
      {children}
    </button>
  );
}

function SideLink({
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
      className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
    >
      {icon}
      {children}
    </Link>
  );
}

function buildAvailabilityRows(selectedDate: Date, slots: ScheduleSlot[]) {
  if (slots.length === 0) {
    return buildRows(7 * 60, 20 * 60).map((row) => ({
      ...row,
      kind: "available" as const,
    }));
  }

  const startMinutes = Math.min(
    ...slots.map((slot) => getMinutesOfDay(new Date(slot.startAt))),
  );
  const endMinutes = Math.max(
    ...slots.map((slot) => getMinutesOfDay(new Date(slot.endAt))),
  );

  return buildRows(startMinutes, endMinutes).map((row) => {
    const rowDate = setTime(selectedDate, row.hour, row.minute);
    const matchingSlot = slots.find((slot) => {
      const startAt = new Date(slot.startAt);
      const endAt = new Date(slot.endAt);
      return rowDate >= startAt && rowDate < endAt;
    });

    return {
      ...row,
      kind:
        matchingSlot?.status === "unavailable"
          ? ("unavailable" as const)
          : ("available" as const),
    };
  });
}

function buildRows(startMinutes: number, endMinutes: number) {
  const rows: Array<{
    hour: number;
    minute: number;
    timeLabel: string;
  }> = [];

  for (let current = startMinutes; current < endMinutes; current += HALF_HOUR) {
    const hour = Math.floor(current / 60);
    const minute = current % 60;
    rows.push({
      hour,
      minute,
      timeLabel: toDisplayTime(hour, minute),
    });
  }

  return rows;
}

function parseLongDate(value: string) {
  return new Date(value);
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

function setTime(date: Date, hour: number, minute: number) {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getMinutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function toDisplayTime(hour: number, minute: number) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatWeekdayDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isPastRow(date: Date, hour: number, minute: number) {
  const now = new Date();
  const rowDate = setTime(date, hour, minute);
  return rowDate.getTime() < now.getTime();
}
