import type { User } from "firebase/auth";

export type HealthMonitoringTrend =
  | "stable"
  | "changed"
  | "needs_attention"
  | "first_log";

export type HealthMonitoringLog = {
  _id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  loggedAt: string;
  systolicBp?: number;
  diastolicBp?: number;
  glucoseMgDl?: number;
  temperatureC?: number;
  oxygenSaturation?: number;
  pulseBpm?: number;
  weightKg?: number;
  symptoms: string[];
  notes?: string;
  trend: HealthMonitoringTrend;
  analysisSummary: string;
  flags: string[];
  disclaimer: string;
  createdAt: string;
  updatedAt: string;
};

export type HealthMonitoringSummary = {
  trend: HealthMonitoringTrend;
  summary: string;
  flags: string[];
  latestLog?: HealthMonitoringLog;
  logs: HealthMonitoringLog[];
  disclaimer: string;
};

export type CreateHealthMonitoringLogInput = {
  loggedAt?: string;
  systolicBp?: number;
  diastolicBp?: number;
  glucoseMgDl?: number;
  temperatureC?: number;
  oxygenSaturation?: number;
  pulseBpm?: number;
  weightKg?: number;
  symptoms: string[];
  notes?: string;
};

export async function createMyMonitoringLog(
  user: User,
  input: CreateHealthMonitoringLogInput,
): Promise<HealthMonitoringLog> {
  return healthMonitoringRequest<HealthMonitoringLog>(user, "/health-monitoring/me/logs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMyMonitoringLogs(user: User): Promise<HealthMonitoringLog[]> {
  return healthMonitoringRequest<HealthMonitoringLog[]>(user, "/health-monitoring/me/logs");
}

export async function getMyMonitoringSummary(
  user: User,
): Promise<HealthMonitoringSummary> {
  return healthMonitoringRequest<HealthMonitoringSummary>(
    user,
    "/health-monitoring/me/summary",
  );
}

export async function getDoctorPatientMonitoringSummary(
  user: User,
  patientId: string,
): Promise<HealthMonitoringSummary> {
  return healthMonitoringRequest<HealthMonitoringSummary>(
    user,
    `/health-monitoring/me/doctor/patients/${patientId}/summary`,
  );
}

async function healthMonitoringRequest<T>(
  user: User,
  pathname: string,
  init?: RequestInit,
): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("The API URL is not configured.");
  }

  const token = await user.getIdToken();
  const response = await fetch(`${apiUrl}${pathname}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const result: unknown = await response.json().catch(() => null);
    const message =
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : "Unable to save health monitoring log.";
    throw new Error(message);
  }

  return (await response.json()) as T;
}
