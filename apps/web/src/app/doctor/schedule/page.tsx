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
import { dashboardPageTranslations } from "@/features/localization/dashboard-page-translations";
import { useLocale } from "@/features/localization/locale-provider";
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
  const { locale } = useLocale();
  const t = dashboardPageTranslations[locale].doctorSchedule;
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
      <section className="relative overflow-hidden border-b border-[#12324d]/10 bg-[#082b45] text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="grid xl:grid-cols-[1.08fr_0.92fr]">
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
          <div className="relative border-t border-white/15 px-6 py-7 sm:px-8 xl:border-t-0 xl:border-l">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-secondary uppercase">
              <CalendarDays className="size-4" />
              {t.howItWorks}
            </p>
            <div className="mt-4 space-y-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-4 text-sm text-white/75">
              <p>Choose {t.available.toLowerCase()} or {t.off.toLowerCase()} for each weekday.</p>
              <p>Use {t.morning.toLowerCase()}, {t.afternoon.toLowerCase()}, or {t.wholeDay.toLowerCase()} presets.</p>
              <p>The {t.weeklyPattern.toLowerCase()} repeats automatically for matching days.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-0 xl:grid-cols-[1fr_360px]">
        <div className="border-r border-[#12324d]/10 bg-[#fffdf8] px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
                {t.weeklyPattern}
              </p>
              <p className="mt-1 text-xl font-bold text-primary">{t.weeklyAvailability}</p>
            </div>
            <Button disabled={busy} onClick={() => void handleSave()} className="h-11 rounded-2xl px-5">
              <Save className="size-4" />
              {busy ? t.saving : t.save}
            </Button>
          </div>

          <div className="mt-5 grid gap-3">
            {rows.map((row, index) => (
              <article
                key={row.dayOfWeek}
                className="rounded-2xl border border-[#12324d]/10 bg-white p-4 shadow-[0_18px_48px_-42px_rgba(8,43,69,0.9)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-bold">{row.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.status === "off"
                        ? `${t.off}.`
                        : `${t.available}: ${toDisplayTime(row.startTime)} - ${toDisplayTime(row.endTime)}.`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusChip
                      active={row.status === "available"}
                      onClick={() => updateRow(index, { status: "available" }, setRows)}
                    >
                      {t.available}
                    </StatusChip>
                    <StatusChip
                      active={row.status === "off"}
                      onClick={() => updateRow(index, { status: "off" }, setRows)}
                    >
                      {t.off}
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
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/[0.03] hover:text-primary"
                        >
                          {preset.label === "Morning" ? t.morning : preset.label === "Afternoon" ? t.afternoon : t.wholeDay}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <TimeSelect
                        label={t.start}
                        value={row.startTime}
                        onChange={(value) =>
                          updateRow(index, { startTime: value }, setRows)
                        }
                      />
                      <TimeSelect
                        label={t.end}
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
            <p className="mt-4 rounded-2xl border border-primary/10 bg-primary/[0.03] p-3 text-sm text-muted-foreground">
              {notice}
            </p>
          ) : null}
        </div>

        <aside className="bg-[#fcfaf5] px-6 py-6 sm:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
              {t.currentSetup}
            </p>
            <p className="mt-1 text-xl font-bold text-primary">{t.openDays}</p>
          </div>

          <div className="mt-5 space-y-3">
            {availableDays.map((day) => (
              <div
                key={day.dayOfWeek}
                className="rounded-2xl border border-[#12324d]/10 bg-white px-4 py-4 shadow-[0_16px_42px_-38px_rgba(8,43,69,0.8)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{day.label}</p>
                  <Badge variant="secondary">{t.available}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {toDisplayTime(day.startTime)} - {toDisplayTime(day.endTime)}
                </p>
              </div>
            ))}

            {availableDays.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-6 text-sm text-muted-foreground">
                {t.noOpenDays}
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded-2xl border border-[#12324d]/10 bg-white px-4 py-4">
            <p className="text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
              {t.scheduleRule}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t.scheduleRuleCopy}
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
        className="h-12 rounded-2xl border border-input bg-background px-3 text-sm"
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
