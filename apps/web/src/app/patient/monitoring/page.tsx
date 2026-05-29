"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  Activity,
  Droplets,
  HeartPulse,
  Save,
  ShieldCheck,
  Thermometer,
  Weight,
  Wind,
} from "lucide-react";

import { PatientWorkspaceShell } from "../patient-workspace-shell";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import {
  createMyMonitoringLog,
  getMyMonitoringSummary,
  type CreateHealthMonitoringLogInput,
  type HealthMonitoringLog,
  type HealthMonitoringSummary,
} from "@/lib/health-monitoring-api";
import { getMyPatientProfile, type PatientProfile } from "@/lib/patient-api";

type MonitoringForm = {
  systolicBp: string;
  diastolicBp: string;
  glucoseMgDl: string;
  temperatureC: string;
  oxygenSaturation: string;
  pulseBpm: string;
  weightKg: string;
  symptoms: string;
  notes: string;
};

const initialForm: MonitoringForm = {
  systolicBp: "",
  diastolicBp: "",
  glucoseMgDl: "",
  temperatureC: "",
  oxygenSaturation: "",
  pulseBpm: "",
  weightKg: "",
  symptoms: "",
  notes: "",
};

export default function PatientMonitoringPage() {
  const router = useRouter();
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [summary, setSummary] = useState<HealthMonitoringSummary | null>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(
    configured ? "Loading monitoring logs..." : "Authentication is not configured.",
  );

  useEffect(() => {
    if (!configured) return;

    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      if (!nextUser) {
        router.replace("/auth");
        return;
      }

      setUser(nextUser);
      void loadMonitoring(nextUser);
    });
  }, [configured, router]);

  async function loadMonitoring(nextUser: User) {
    try {
      const [nextProfile, nextSummary] = await Promise.all([
        getMyPatientProfile(nextUser),
        getMyMonitoringSummary(nextUser),
      ]);
      setProfile(nextProfile);
      setSummary(nextSummary);
      setForm((current) => ({
        ...current,
        weightKg: current.weightKg || String(nextProfile.weightKg || ""),
      }));
      setMessage("");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to load monitoring.");
    }
  }

  async function handleSignOut() {
    if (!configured) {
      router.replace("/auth");
      return;
    }

    await signOut(getFirebaseAuth());
    router.replace("/auth");
  }

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      const input = buildMonitoringInput(form);
      await createMyMonitoringLog(user, input);
      await loadMonitoring(user);
      setForm((current) => ({
        ...initialForm,
        weightKg: current.weightKg,
      }));
      setMessage("Monitoring log saved. AI/rule analysis updated.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to save monitoring log.");
    } finally {
      setSaving(false);
    }
  }

  const latestLog = summary?.latestLog;
  const logs = summary?.logs ?? [];
  const trendTone = getTrendTone(summary?.trend);
  const patientName = profile ? `${profile.firstName} ${profile.lastName}` : "Patient";

  return (
    <PatientWorkspaceShell patientName={patientName} onSignOut={handleSignOut}>
      <div className="min-h-full bg-[#f7f2e8]">
        <header className="border-b border-[#12324d]/10 bg-white px-6 py-6 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Home monitoring
          </p>
          <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
            Track readings doctors can review.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Log BP, glucose, temperature, oxygen, pulse, and weight. The system
            summarizes whether readings look stable, changed, or need attention.
          </p>
        </header>

        <main className="grid gap-6 px-6 py-6 sm:px-8 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-2xl border border-[#12324d]/10 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Current snapshot
                </p>
                <h2 className="mt-2 text-xl font-bold text-primary">
                  {summary?.trend ? formatTrend(summary.trend) : "No logs yet"}
                </h2>
              </div>
              <Badge className={`${trendTone} rounded-full px-3 py-1`}>
                {summary?.trend ? formatTrend(summary.trend) : "Start"}
              </Badge>
            </div>

            <p className="mt-4 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3 text-sm leading-6 text-muted-foreground">
              {summary?.summary ?? "Save your first home reading to generate a monitoring summary."}
            </p>

            {summary?.flags.length ? (
              <div className="mt-4 grid gap-2">
                {summary.flags.map((flag) => (
                  <div
                    key={flag}
                    className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
                  >
                    {flag}
                  </div>
                ))}
              </div>
            ) : null}

            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              {summary?.disclaimer ??
                "Guidance only. This monitoring summary does not replace professional medical advice or emergency care."}
            </p>

            {latestLog ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Reading label="BP" value={formatBp(latestLog)} icon={<HeartPulse className="size-4" />} />
                <Reading label="Glucose" value={formatUnit(latestLog.glucoseMgDl, "mg/dL")} icon={<Droplets className="size-4" />} />
                <Reading label="Temperature" value={formatUnit(latestLog.temperatureC, "°C")} icon={<Thermometer className="size-4" />} />
                <Reading label="Oxygen" value={formatUnit(latestLog.oxygenSaturation, "%")} icon={<Wind className="size-4" />} />
                <Reading label="Pulse" value={formatUnit(latestLog.pulseBpm, "bpm")} icon={<Activity className="size-4" />} />
                <Reading label="Weight" value={formatUnit(latestLog.weightKg, "kg")} icon={<Weight className="size-4" />} />
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[#12324d]/10 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Add reading
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Systolic BP" value={form.systolicBp} onChange={(value) => setForm({ ...form, systolicBp: value })} placeholder="e.g. 120" />
              <Field label="Diastolic BP" value={form.diastolicBp} onChange={(value) => setForm({ ...form, diastolicBp: value })} placeholder="e.g. 80" />
              <Field label="Glucose (mg/dL)" value={form.glucoseMgDl} onChange={(value) => setForm({ ...form, glucoseMgDl: value })} placeholder="e.g. 110" />
              <Field label="Temperature (°C)" value={form.temperatureC} onChange={(value) => setForm({ ...form, temperatureC: value })} placeholder="e.g. 37.2" />
              <Field label="Oxygen (%)" value={form.oxygenSaturation} onChange={(value) => setForm({ ...form, oxygenSaturation: value })} placeholder="e.g. 98" />
              <Field label="Pulse (bpm)" value={form.pulseBpm} onChange={(value) => setForm({ ...form, pulseBpm: value })} placeholder="e.g. 76" />
              <Field label="Weight (kg)" value={form.weightKg} onChange={(value) => setForm({ ...form, weightKg: value })} placeholder="e.g. 70" />
              <Field label="Symptoms" value={form.symptoms} onChange={(value) => setForm({ ...form, symptoms: value })} placeholder="cough, dizzy, headache" />
            </div>
            <label className="mt-4 grid gap-2 text-sm font-semibold text-primary">
              Notes
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                rows={4}
                placeholder="Optional context: after meal, after medicine, after exercise, or how you feel."
                className="min-h-28 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-3 text-sm outline-none"
              />
            </label>

            {message ? (
              <div className="mt-4 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3 text-sm text-primary">
                {message}
              </div>
            ) : null}

            <Button className="mt-5 h-11 rounded-xl" disabled={saving} onClick={() => void handleSave()}>
              <Save className="size-4" />
              {saving ? "Saving..." : "Save monitoring log"}
            </Button>
          </section>

          <section className="rounded-2xl border border-[#12324d]/10 bg-white p-5 xl:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Timeline
                </p>
                <h2 className="mt-2 text-lg font-bold text-primary">
                  Recent home logs
                </h2>
              </div>
              <Badge variant="outline">{logs.length} logs</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {logs.map((log) => (
                <MonitoringLogCard key={log._id} log={log} />
              ))}
              {logs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-[#fcfaf5] px-4 py-8 text-center text-sm text-muted-foreground">
                  No monitoring logs yet. Add your first reading above.
                </div>
              ) : null}
            </div>
          </section>
        </main>
      </div>
    </PatientWorkspaceShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-primary">
      {label}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm outline-none"
      />
    </label>
  );
}

function Reading({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-lg font-bold text-primary">{value}</p>
    </div>
  );
}

function MonitoringLogCard({ log }: { log: HealthMonitoringLog }) {
  const readings = useMemo(
    () =>
      [
        ["BP", formatBp(log)],
        ["Glucose", formatUnit(log.glucoseMgDl, "mg/dL")],
        ["Temp", formatUnit(log.temperatureC, "°C")],
        ["Oxygen", formatUnit(log.oxygenSaturation, "%")],
        ["Pulse", formatUnit(log.pulseBpm, "bpm")],
        ["Weight", formatUnit(log.weightKg, "kg")],
      ].filter(([, value]) => value !== "Not logged"),
    [log],
  );

  return (
    <article className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-primary">{formatDateTime(log.loggedAt)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{log.analysisSummary}</p>
        </div>
        <Badge className={`${getTrendTone(log.trend)} rounded-full px-3 py-1`}>
          {formatTrend(log.trend)}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {readings.map(([label, value]) => (
          <span key={label} className="rounded-full border border-[#12324d]/10 bg-white px-3 py-1 text-xs">
            {label}: {value}
          </span>
        ))}
      </div>
      {log.symptoms.length ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Symptoms: {log.symptoms.join(", ")}
        </p>
      ) : null}
    </article>
  );
}

function buildMonitoringInput(form: MonitoringForm): CreateHealthMonitoringLogInput {
  return {
    systolicBp: toNumber(form.systolicBp),
    diastolicBp: toNumber(form.diastolicBp),
    glucoseMgDl: toNumber(form.glucoseMgDl),
    temperatureC: toNumber(form.temperatureC),
    oxygenSaturation: toNumber(form.oxygenSaturation),
    pulseBpm: toNumber(form.pulseBpm),
    weightKg: toNumber(form.weightKg),
    symptoms: form.symptoms.split(",").map((item) => item.trim()).filter(Boolean),
    notes: form.notes.trim() || undefined,
  };
}

function toNumber(value: string): number | undefined {
  const next = Number(value);
  return Number.isFinite(next) && value.trim() ? next : undefined;
}

function formatBp(log: Pick<HealthMonitoringLog, "systolicBp" | "diastolicBp">) {
  return log.systolicBp && log.diastolicBp
    ? `${log.systolicBp}/${log.diastolicBp} mmHg`
    : "Not logged";
}

function formatUnit(value: number | undefined, unit: string) {
  return typeof value === "number" ? `${value} ${unit}` : "Not logged";
}

function formatTrend(trend: string) {
  return trend.replace(/_/g, " ");
}

function getTrendTone(trend?: string) {
  if (trend === "needs_attention") return "bg-amber-300 text-amber-950";
  if (trend === "changed") return "bg-blue-100 text-blue-900";
  if (trend === "stable") return "bg-emerald-100 text-emerald-900";
  return "bg-secondary text-secondary-foreground";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
