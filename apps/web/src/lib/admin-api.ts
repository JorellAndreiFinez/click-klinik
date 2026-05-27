import type { User } from "firebase/auth";

export type DoctorApplication = {
  _id: string;
  firstName: string;
  lastName: string;
  suffix: string;
  professionalEmail: string;
  mobileNumber: string;
  prcLicenseNumber: string;
  specializationName: string;
  clinicOrHospital?: string;
  yearsOfExperience: number;
  bio: string;
  displayOnPublicWebsite: boolean;
  applicationStatus: "pending_review" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
};

export async function getDoctorApplications(
  user: User,
): Promise<DoctorApplication[]> {
  return adminRequest<DoctorApplication[]>(user, "/doctors/applications");
}

export async function reviewDoctorApplication(
  user: User,
  id: string,
  action: "approved" | "rejected",
  reviewNotes: string,
): Promise<DoctorApplication> {
  return adminRequest<DoctorApplication>(
    user,
    `/doctors/applications/${id}/review`,
    {
      method: "PATCH",
      body: JSON.stringify({ action, reviewNotes }),
    },
  );
}

async function adminRequest<T>(
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
        : "You do not have superadmin access.";
    throw new Error(message);
  }

  return (await response.json()) as T;
}
