"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { CalendarDays, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getMyWeeklyTemplate,
  saveMyWeeklyTemplate,
  type WeeklyTemplateEntry,
} from "@/lib/schedule-api";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import { cn } from "@/lib/utils";

type TemplateRow = {
  dayOfWeek: number;
  label: string;
  status: "off" | "available";
  startTime: string;
  endTime: string;
};

const dayRows = [
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
  { dayOfWeek: 6, label: "Saturday" },
  { dayOfWeek: 0, label: "Sunday" },
] as const;

const quickPresets = [
  { label: "Morning", startTime: "07:00", endTime: "12:00" },
  { label: "Afternoon", startTime: "13:00", endTime: "18:00" },
  { label: "Whole day", startTime: "07:00", endTime: "20:00" },
] as const;

const timeOptions = Array.from({ length: 14 }, (_, index) => {
  const hour = 7 + index;
  return `${String(hour).padStart(2, "0")}:00`;
});

export default function DoctorSchedulePage() {
  const { user } = useDoctorWorkspace();
  const [rows, setRows] = useState<TemplateRow[]>(createDefaultRows());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    void getMyWeeklyTemplate(user)
      .then((template) => {
        setRows(mapTemplateToRows(template));
      })
      .catch((error: unknown) => {
        setNotice(
          error instanceof Error
            ? error.message
            : "Unable to load the weekly availability pattern.",
        );
      });
  }, [user]);

  const availableDays = useMemo(
    () => rows.filter((row) => row.status === "available"),
    [rows],
  );

  async function handleSave() {
    if (!user) {
      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      const saved = await saveMyWeeklyTemplate(
        user,
        rows.map((row) => ({
          dayOfWeek: row.dayOfWeek,
          status: row.status,
          startTime: row.status === "off" ? undefined : row.startTime,
          endTime: row.status === "off" ? undefined : row.endTime,
        })),
      );

      startTransition(() => {
        setRows(mapTemplateToRows(saved));
      });
      setNotice(
        "Weekly availability saved. This pattern now applies to every matching weekday in future schedules.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to save the weekly availability pattern.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full bg-[#f7f2e8]">
      <section className="border-b border-[#12324d]/10 bg-white">
        <div className="grid xl:grid-cols-[1.08fr_0.92fr]">
          <div className="px-6 py-7 sm:px-8">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Availability
            </p>
            <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
              Set one weekly clinic pattern from Monday to Sunday.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Keep this simple: choose which days are open for teleconsultation,
              apply a preset, and the same weekday pattern repeats automatically in future weeks.
            </p>
          </div>
          <div className="border-t border-[#12324d]/10 px-6 py-7 sm:px-8 xl:border-t-0 xl:border-l">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-primary uppercase">
              <CalendarDays className="size-4" />
              How it works
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>Choose `Available` or `Off` for each weekday.</p>
              <p>Use morning, afternoon, or whole-day presets.</p>
              <p>Every Monday, Tuesday, and so on will follow this same pattern automatically.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-0 xl:grid-cols-[1fr_360px]">
        <div className="border-r border-[#12324d]/10 bg-[#fffdf8] px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Weekly pattern
              </p>
              <p className="mt-1 text-xl font-bold">Recurring availability</p>
            </div>
            <Button disabled={busy} onClick={() => void handleSave()} className="h-11 rounded-xl px-5">
              <Save className="size-4" />
              {busy ? "Saving..." : "Save weekly pattern"}
            </Button>
          </div>

          <div className="mt-5 grid gap-3">
            {rows.map((row, index) => (
              <article
                key={row.dayOfWeek}
                className="rounded-xl border border-[#12324d]/10 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-bold">{row.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.status === "off"
                        ? "No consultation window for this weekday."
                        : `Available from ${toDisplayTime(row.startTime)} to ${toDisplayTime(row.endTime)} every ${row.label.toLowerCase()}.`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusChip
                      active={row.status === "available"}
                      onClick={() => updateRow(index, { status: "available" }, setRows)}
                    >
                      Available
                    </StatusChip>
                    <StatusChip
                      active={row.status === "off"}
                      onClick={() => updateRow(index, { status: "off" }, setRows)}
                    >
                      Off
                    </StatusChip>
                  </div>
                </div>

                {row.status === "available" ? (
                  <div className="mt-4 grid gap-4">
                    <div className="flex flex-wrap gap-2">
                      {quickPresets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            updateRow(
                              index,
                              {
                                startTime: preset.startTime,
                                endTime: preset.endTime,
                              },
                              setRows,
                            )
                          }
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <TimeSelect
                        label="Start"
                        value={row.startTime}
                        onChange={(value) =>
                          updateRow(index, { startTime: value }, setRows)
                        }
                      />
                      <TimeSelect
                        label="End"
                        value={row.endTime}
                        onChange={(value) =>
                          updateRow(index, { endTime: value }, setRows)
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          {notice ? (
            <p className="mt-4 rounded-xl border border-primary/10 bg-primary/[0.03] p-3 text-sm text-muted-foreground">
              {notice}
            </p>
          ) : null}
        </div>

        <aside className="bg-[#fcfaf5] px-6 py-6 sm:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Current setup
            </p>
            <p className="mt-1 text-xl font-bold">Open consultation days</p>
          </div>

          <div className="mt-5 space-y-3">
            {availableDays.map((day) => (
              <div
                key={day.dayOfWeek}
                className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{day.label}</p>
                  <Badge variant="secondary">Available</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {toDisplayTime(day.startTime)} - {toDisplayTime(day.endTime)}
                </p>
              </div>
            ))}

            {availableDays.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white px-4 py-6 text-sm text-muted-foreground">
                No consultation days are open yet. Turn on availability for at least one weekday.
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded-xl border border-[#12324d]/10 bg-white px-4 py-4">
            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
              Simpler workflow
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Day-specific preview editing was removed here to avoid duplicate and inconsistent periods.
              Booking calendars will use this weekly pattern automatically.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function createDefaultRows(): TemplateRow[] {
  return dayRows.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    label: day.label,
    status: "off",
    startTime: "07:00",
    endTime: "12:00",
  }));
}

function mapTemplateToRows(template: WeeklyTemplateEntry[]): TemplateRow[] {
  const byDay = new Map(template.map((entry) => [entry.dayOfWeek, entry]));
  return dayRows.map((day) => {
    const entry = byDay.get(day.dayOfWeek);
    return {
      dayOfWeek: day.dayOfWeek,
      label: day.label,
      status: entry?.status === "available" ? "available" : "off",
      startTime: entry?.startTime ?? "07:00",
      endTime: entry?.endTime ?? "12:00",
    };
  });
}

function updateRow(
  index: number,
  update: Partial<TemplateRow>,
  setRows: React.Dispatch<React.SetStateAction<TemplateRow[]>>,
) {
  setRows((current) =>
    current.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            ...update,
          }
        : row,
    ),
  );
}

function TimeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-xl border border-input bg-background px-3 text-sm"
      >
        {timeOptions.map((option) => (
          <option key={option} value={option}>
            {toDisplayTime(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

function toDisplayTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
