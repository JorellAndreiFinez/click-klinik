import type { User } from "firebase/auth";

export type PatientProfile = {
  _id: string;
  firstName: string;
  lastName: string;
  suffix?: string;
  email: string;
  mobileNumber: string;
  birthdate: string;
  sex: "female" | "male" | "prefer_not_to_say";
  weightKg: number;
  heightCm: number;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  allergies: string[];
  existingConditions: string[];
  currentMedications: string[];
  basicMedicalHistory?: string;
  regionCode?: string;
  regionName?: string;
  provinceCode?: string;
  provinceName?: string;
  cityMunicipalityCode?: string;
  cityMunicipalityName?: string;
  barangayCode?: string;
  barangayName?: string;
  latitude?: number;
  longitude?: number;
  privacyPolicyAccepted: boolean;
  healthDataProcessingAccepted: boolean;
  aiAssistanceAccepted: boolean;
};

export type SavePatientProfileInput = Omit<
  PatientProfile,
  "_id" | "email"
>;

export async function getMyPatientProfile(user: User): Promise<PatientProfile> {
  return patientRequest<PatientProfile>(user, "/patients/me");
}

export async function saveMyPatientProfile(
  user: User,
  profile: SavePatientProfileInput,
): Promise<PatientProfile> {
  return patientRequest<PatientProfile>(user, "/patients/me", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function checkPatientSignupEligibility(user: User): Promise<void> {
  await patientRequest<{ available: true }>(user, "/patients/signup-eligibility", {
    method: "POST",
  });
}

export async function checkPatientMobileAvailability(
  user: User,
  mobileNumber: string,
): Promise<void> {
  await patientRequest<{ available: true }>(user, "/patients/mobile-availability", {
    method: "POST",
    body: JSON.stringify({ mobileNumber }),
  });
}

async function patientRequest<T>(
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
  });

  if (!response.ok) {
    const result: unknown = await response.json().catch(() => null);
    const message =
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : "Unable to complete the request.";
    throw new Error(message);
  }

  return (await response.json()) as T;
}
