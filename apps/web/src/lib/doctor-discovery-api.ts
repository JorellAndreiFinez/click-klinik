export type DiscoverDoctor = {
  _id: string;
  firstName: string;
  lastName: string;
  suffix: string;
  specializationCode: string;
  specializationName: string;
  clinicOrHospital?: string;
  location?: string;
  regionName?: string;
  provinceName?: string;
  cityMunicipalityName?: string;
  barangayName?: string;
  latitude?: number;
  longitude?: number;
  yearsOfExperience: number;
  bio: string;
  displayOnPublicWebsite: boolean;
};

export type PublicDoctorProfile = DiscoverDoctor;

export type DoctorRecommendation = {
  specializationCode: string;
  specializationName: string;
  relatedSpecializations: Array<{
    code: string;
    name: string;
  }>;
  reasoning: string;
  symptomKeywords: string[];
  disclaimer: string;
  doctors: DiscoverDoctor[];
};

export type PublicDoctorAvailabilitySlot = {
  _id: string;
  startAt: string;
  endAt: string;
  status: "available";
  note?: string;
};

export async function discoverDoctors(filters?: {
  query?: string;
  specializationCode?: string;
  symptom?: string;
  location?: string;
}): Promise<DiscoverDoctor[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("The API URL is not configured.");
  }

  const query = new URLSearchParams();
  if (filters?.query?.trim()) {
    query.set("query", filters.query.trim());
  }
  if (filters?.specializationCode?.trim()) {
    query.set("specializationCode", filters.specializationCode.trim());
  }
  if (filters?.symptom?.trim()) {
    query.set("symptom", filters.symptom.trim());
  }
  if (filters?.location?.trim()) {
    query.set("location", filters.location.trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${apiUrl}/doctors/discover${suffix}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
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
        : "Unable to load available doctors.";
    throw new Error(message);
  }

  return (await response.json()) as DiscoverDoctor[];
}

export async function getPublicDoctorAvailability(
  doctorId: string,
  range?: { from?: string; to?: string },
): Promise<PublicDoctorAvailabilitySlot[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("The API URL is not configured.");
  }

  const query = new URLSearchParams();
  if (range?.from) {
    query.set("from", range.from);
  }
  if (range?.to) {
    query.set("to", range.to);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(
    `${apiUrl}/schedules/public/doctors/${doctorId}/availability${suffix}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const result: unknown = await response.json().catch(() => null);
    const message =
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : "Unable to load doctor availability.";
    throw new Error(message);
  }

  return (await response.json()) as PublicDoctorAvailabilitySlot[];
}

export async function recommendDoctors(input: {
  symptom: string;
  location?: string;
  query?: string;
}): Promise<DoctorRecommendation> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("The API URL is not configured.");
  }

  const response = await fetch(`${apiUrl}/doctors/recommendation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const result: unknown = await response.json().catch(() => null);
    const message =
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : "Unable to recommend doctors for this symptom.";
    throw new Error(message);
  }

  return (await response.json()) as DoctorRecommendation;
}

export async function getPublicDoctorProfile(
  doctorId: string,
): Promise<PublicDoctorProfile> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("The API URL is not configured.");
  }

  const response = await fetch(`${apiUrl}/doctors/public/${doctorId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
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
        : "Unable to load doctor profile.";
    throw new Error(message);
  }

  return (await response.json()) as PublicDoctorProfile;
}
