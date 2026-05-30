import type { User } from "firebase/auth";

import type { Appointment } from "./appointments-api";
import type { HealthMonitoringSummary } from "./health-monitoring-api";

export type PrescriptionItem = {
  medicine: string;
  dosage?: string;
  instruction?: string;
  duration?: string;
};

export type MedicalRecord = {
  _id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorApplicationId: string;
  doctorName: string;
  specializationName: string;
  consultationSummary?: string;
  publicNote?: string;
  privateNote?: string;
  recommendations?: string;
  prescriptions: PrescriptionItem[];
  doctorSignatureDataUrl?: string;
  doctorSignatureText?: string;
  medicalCertificate?: MedicalCertificate;
  createdAt: string;
  updatedAt: string;
  canViewPrivateNote?: boolean;
};

export type MedicalCertificate = {
  _id?: string;
  appointmentId?: string;
  patientId?: string;
  patientName?: string;
  doctorApplicationId?: string;
  doctorName?: string;
  specializationName?: string;
  code?: string;
  title?: string;
  body?: string;
  remarks?: string;
  issuedAt?: string;
};

export type DoctorPatientListItem = {
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientMobileNumber: string;
  sex: "female" | "male" | "prefer_not_to_say";
  age?: number;
  latestAppointmentAt: string;
  latestAppointmentStatus: Appointment["status"];
  latestConcern: string;
  recordCount: number;
};

export type DoctorPatientDetail = {
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    sex: "female" | "male" | "prefer_not_to_say";
    birthdate?: string;
    age?: number;
    allergies: string[];
    existingConditions: string[];
    currentMedications: string[];
    basicMedicalHistory?: string;
  };
  appointments: Appointment[];
  records: MedicalRecord[];
  monitoring?: HealthMonitoringSummary;
};

export type PatientRecordsView = {
  appointments: Appointment[];
  records: MedicalRecord[];
  monitoring?: HealthMonitoringSummary;
};

export type UpsertMedicalRecordInput = {
  consultationSummary?: string;
  publicNote?: string;
  privateNote?: string;
  recommendations?: string;
  prescriptions?: PrescriptionItem[];
  doctorSignatureDataUrl?: string;
  doctorSignatureText?: string;
  medicalCertificate?: MedicalCertificate;
};

export async function getMyPatientRecords(user: User): Promise<PatientRecordsView> {
  try {
    return await medicalRecordsRequest<PatientRecordsView>(
      user,
      "/patients/me/records",
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Cannot GET /patients/me/records")
    ) {
      return medicalRecordsRequest<PatientRecordsView>(
        user,
        "/medical-records/me/patient",
      );
    }

    throw error;
  }
}

export async function getMyDoctorPatients(
  user: User,
): Promise<DoctorPatientListItem[]> {
  return medicalRecordsRequest<DoctorPatientListItem[]>(
    user,
    "/medical-records/me/doctor/patients",
  );
}

export async function getMyDoctorPatientDetail(
  user: User,
  patientId: string,
): Promise<DoctorPatientDetail> {
  return medicalRecordsRequest<DoctorPatientDetail>(
    user,
    `/medical-records/me/doctor/patients/${patientId}`,
  );
}

export async function getMyDoctorAppointmentRecord(
  user: User,
  appointmentId: string,
): Promise<MedicalRecord | null> {
  return medicalRecordsRequest<MedicalRecord | null>(
    user,
    `/medical-records/me/doctor/appointments/${appointmentId}`,
  );
}

export async function saveMyDoctorAppointmentRecord(
  user: User,
  appointmentId: string,
  input: UpsertMedicalRecordInput,
): Promise<MedicalRecord> {
  return medicalRecordsRequest<MedicalRecord>(
    user,
    `/medical-records/me/doctor/appointments/${appointmentId}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

export async function saveMyDoctorAppointmentCertificate(
  user: User,
  appointmentId: string,
  input: MedicalCertificate & {
    doctorSignatureDataUrl?: string;
    doctorSignatureText?: string;
  },
): Promise<MedicalCertificate> {
  return medicalRecordsRequest<MedicalCertificate>(
    user,
    `/medical-records/me/doctor/appointments/${appointmentId}/certificate`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

async function medicalRecordsRequest<T>(
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
        : "Unable to load medical records.";
    throw new Error(message);
  }

  const text = await response.text();

  if (!text.trim()) {
    return null as T;
  }

  return JSON.parse(text) as T;
}
