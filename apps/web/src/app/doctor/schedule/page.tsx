"use client";

import { startTransition, useEffect, useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp, PencilLine, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getMyScheduleSlots,
  getMyWeeklyTemplate,
  saveMyWeeklyTemplate,
  updateMyScheduleSlot,
  type ScheduleSlot,
  type WeeklyTemplateEntry,
} from "@/lib/schedule-api";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import { cn } from "@/lib/utils";

type TemplateRow = {
  dayOfWeek: number;
  label: string;
  status: "off" | "available" | "unavailable";
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
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<{
    startTime: string;
    endTime: string;
    status: "available" | "unavailable";
    note: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    void Promise.all([getMyWeeklyTemplate(user), getMyScheduleSlots(user)]).then(
      ([template, nextSlots]) => {
        setRows(mapTemplateToRows(template));
        setSlots(nextSlots);
      },
    );
  }, [user]);

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
      const nextSlots = await getMyScheduleSlots(user);
      startTransition(() => {
        setRows(mapTemplateToRows(saved));
        setSlots(nextSlots);
      });
      setNotice("Weekly consultation schedule saved.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to save the weekly schedule.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEditedSlot(slot: ScheduleSlot) {
    if (!user || !editingSlot) {
      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      const updated = await updateMyScheduleSlot(user, slot._id, {
        startAt: toEditedIso(slot.startAt, editingSlot.startTime),
        endAt: toEditedIso(slot.endAt, editingSlot.endTime),
        status: editingSlot.status,
        note: editingSlot.note || undefined,
      });

      setSlots((current) =>
        current.map((item) => (item._id === updated._id ? updated : item)),
      );
      setEditingSlotId(null);
      setEditingSlot(null);
      setNotice("Saved changes to the selected schedule period.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to update the selected schedule period.",
      );
    } finally {
      setBusy(false);
    }
  }

  function beginEditSlot(slot: ScheduleSlot) {
    setEditingSlotId(slot._id);
    setEditingSlot({
      startTime: extractTime(slot.startAt),
      endTime: extractTime(slot.endAt),
      status: slot.status === "unavailable" ? "unavailable" : "available",
      note: slot.note ?? "",
    });
  }

  return (
    <div className="w-full bg-[linear-gradient(180deg,#f7f2e8_0%,#f4ecde_100%)]">
      <section className="border-b border-[#12324d]/10 bg-[linear-gradient(135deg,#0d3553_0%,#123f63_58%,#15496f_100%)] text-primary-foreground">
        <div className="grid xl:grid-cols-[1.08fr_0.92fr]">
          <div className="px-6 py-7 sm:px-8">
            <p className="text-xs font-bold tracking-[0.22em] text-secondary uppercase">
              Availability
            </p>
            <h1 className="mt-3 text-3xl font-bold">Customize your weekly availability.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-primary-foreground/68">
              Set consultation windows from Monday to Sunday, then fine-tune the
              next 7 days in the live preview.
            </p>
          </div>
          <div className="border-t border-primary-foreground/10 px-6 py-7 sm:px-8 xl:border-t-0 xl:border-l xl:border-primary-foreground/10">
            <p className="text-xs font-bold tracking-[0.18em] text-secondary uppercase">
              Setup guide
            </p>
            <div className="mt-4 space-y-2 text-sm text-primary-foreground/68">
              <p>Choose `Available`, `Blocked`, or `Off` per day.</p>
              <p>Use quick presets for morning, afternoon, or whole day.</p>
              <p>Saving the template refreshes your next 7 days.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-[1fr_0.96fr]">
        <div className="border-r border-[#12324d]/10 bg-[#fffdf8] px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Weekly template
              </p>
              <p className="mt-1 text-xl font-bold">Base schedule pattern</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPlannerOpen((current) => !current)}
              className="h-11 rounded-xl px-5"
            >
              {plannerOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              {plannerOpen ? "Hide weekly planner" : "Show weekly planner"}
            </Button>
          </div>

          {plannerOpen ? (
            <>
              <div className="mt-5 flex justify-end">
                <Button disabled={busy} onClick={() => void handleSave()} className="h-11 rounded-xl px-5">
                  {busy ? "Saving..." : "Save weekly schedule"}
                </Button>
              </div>

              <div className="mt-5 grid gap-3">
                {rows.map((row, index) => (
                  <article key={row.dayOfWeek} className="rounded-xl border border-[#12324d]/10 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-bold">{row.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {row.status === "off"
                            ? "No consultation window saved for this day."
                            : `${row.status === "available" ? "Open for booking" : "Blocked"} from ${toDisplayTime(row.startTime)} to ${toDisplayTime(row.endTime)}.`}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusChip active={row.status === "available"} onClick={() => updateRow(index, { status: "available" }, setRows)}>Available</StatusChip>
                        <StatusChip active={row.status === "unavailable"} onClick={() => updateRow(index, { status: "unavailable" }, setRows)}>Blocked</StatusChip>
                        <StatusChip active={row.status === "off"} onClick={() => updateRow(index, { status: "off" }, setRows)}>Off</StatusChip>
                      </div>
                    </div>

                    {row.status !== "off" ? (
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
                            onChange={(value) => updateRow(index, { startTime: value }, setRows)}
                          />
                          <TimeSelect
                            label="End"
                            value={row.endTime}
                            onChange={(value) => updateRow(index, { endTime: value }, setRows)}
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
            </>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted-foreground">
              Weekly planner hidden. You can still edit the saved periods directly below.
            </div>
          )}
        </div>

        <aside className="bg-[#fcfaf5] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">Live preview</p>
              <p className="mt-1 text-xl font-bold">Next 7 days</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {slots.slice(0, 10).map((slot) => (
              <article key={slot._id} className="rounded-xl border border-[#12324d]/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{formatSlotDay(slot.startAt)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {toDisplayTime(extractTime(slot.startAt))} - {toDisplayTime(extractTime(slot.endAt))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={slot.status === "available" ? "secondary" : "outline"}>
                      {slot.status === "available" ? "Available" : slot.status === "unavailable" ? "Blocked" : "Booked"}
                    </Badge>
                    {slot.status !== "booked" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => beginEditSlot(slot)}
                        className="h-8 rounded-lg"
                      >
                        <PencilLine className="size-4" />
                        Edit
                      </Button>
                    ) : null}
                  </div>
                </div>
                {editingSlotId === slot._id && editingSlot ? (
                  <div className="mt-4 grid gap-4 rounded-xl border border-primary/10 bg-[#fcfaf5] p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TimeSelect
                        label="Start"
                        value={editingSlot.startTime}
                        onChange={(value) =>
                          setEditingSlot((current) =>
                            current ? { ...current, startTime: value } : current,
                          )
                        }
                      />
                      <TimeSelect
                        label="End"
                        value={editingSlot.endTime}
                        onChange={(value) =>
                          setEditingSlot((current) =>
                            current ? { ...current, endTime: value } : current,
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">Status</span>
                        <select
                          value={editingSlot.status}
                          onChange={(event) =>
                            setEditingSlot((current) =>
                              current
                                ? {
                                    ...current,
                                    status: event.target.value as "available" | "unavailable",
                                  }
                                : current,
                            )
                          }
                          className="h-12 rounded-xl border border-input bg-background px-3 text-sm"
                        >
                          <option value="available">Available</option>
                          <option value="unavailable">Blocked</option>
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">Note</span>
                        <input
                          value={editingSlot.note}
                          onChange={(event) =>
                            setEditingSlot((current) =>
                              current ? { ...current, note: event.target.value } : current,
                            )
                          }
                          maxLength={120}
                          placeholder="Optional note"
                          className="h-12 rounded-xl border border-input bg-background px-3 text-sm"
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleSaveEditedSlot(slot)}
                        className="h-10 rounded-xl"
                      >
                        <Save className="size-4" />
                        Save changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          setEditingSlotId(null);
                          setEditingSlot(null);
                        }}
                        className="h-10 rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}

            {slots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted-foreground">
                Your weekly template will generate a preview here after the first save.
              </div>
            ) : null}
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
      status: entry?.status ?? "off",
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

function extractTime(value: string): string {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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

function formatSlotDay(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function toEditedIso(referenceDate: string, time: string): string {
  const date = new Date(referenceDate);
  const [hours, minutes] = time.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}
