import type { User } from "firebase/auth";

export type DoctorApplication = {
  _id: string;
  firstName: string;
  lastName: string;
  suffix: string;
  professionalEmail: string;
  mobileNumber: string;
  prcLicenseNumber: string;
  specializationCode: string;
  specializationName: string;
  clinicOrHospital?: string;
  location?: string;
  regionCode: string;
  regionName: string;
  provinceCode?: string;
  provinceName?: string;
  cityMunicipalityCode: string;
  cityMunicipalityName: string;
  barangayCode: string;
  barangayName: string;
  yearsOfExperience: number;
  bio: string;
  displayOnPublicWebsite: boolean;
  applicationStatus: "pending_review" | "approved" | "rejected";
};

export type DoctorApplicationInput = {
  firstName: string;
  lastName: string;
  suffix: string;
  otherSuffix?: string;
  mobileNumber: string;
  prcLicenseNumber: string;
  specializationCode: string;
  otherSpecialization?: string;
  clinicOrHospital?: string;
  location?: string;
  regionCode: string;
  regionName: string;
  provinceCode?: string;
  provinceName?: string;
  cityMunicipalityCode: string;
  cityMunicipalityName: string;
  barangayCode: string;
  barangayName: string;
  yearsOfExperience: number;
  bio: string;
  displayOnPublicWebsite: boolean;
  credentialReviewConsent: boolean;
};

export async function getMyApprovedDoctorAccess(
  user: User,
): Promise<DoctorApplication> {
  return doctorRequest<DoctorApplication>(user, "/doctors/me/access");
}

export async function checkDoctorSignupEligibility(user: User): Promise<void> {
  await doctorRequest<{ available: true }>(user, "/doctors/signup-eligibility", {
    method: "POST",
  });
}

export async function checkDoctorMobileAvailability(
  user: User,
  mobileNumber: string,
): Promise<void> {
  await doctorRequest<{ available: true }>(user, "/doctors/mobile-availability", {
    method: "POST",
    body: JSON.stringify({ mobileNumber }),
  });
}

export async function submitDoctorApplication(
  user: User,
  application: DoctorApplicationInput,
): Promise<void> {
  await doctorRequest(user, "/doctors/applications", {
    method: "POST",
    body: JSON.stringify(application),
  });
}

async function doctorRequest<T>(
  user: User,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("The API URL is not configured.");
  }

  const token = await user.getIdToken();
  const response = await fetch(`${apiUrl}${path}`, {
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
        : "Unable to complete your professional application.";
    throw new Error(message);
  }

  return (await response.json()) as T;
}
