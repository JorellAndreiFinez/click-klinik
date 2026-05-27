"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Crosshair,
  HeartPulse,
  MapPin,
  Search,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import { PatientWorkspaceShell } from "../patient-workspace-shell";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  discoverDoctors,
  getPublicDoctorAvailability,
  type DiscoverDoctor,
  type PublicDoctorAvailabilitySlot,
} from "@/lib/doctor-discovery-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { getMyPatientProfile, type PatientProfile } from "@/lib/patient-api";

const specializationOptions = [
  { code: "", label: "All specializations" },
  { code: "GPHY", label: "General Physician" },
  { code: "GP", label: "General Practitioner" },
  { code: "CARD", label: "Cardiologist" },
  { code: "IM", label: "Internal Medicine" },
  { code: "PEDIA", label: "Pediatrics" },
  { code: "OBGYN", label: "Obstetrician-Gynecologist" },
  { code: "PSYCH", label: "Psychiatry" },
  { code: "PSYCHO", label: "Psychology" },
  { code: "ENT", label: "ENT" },
  { code: "DERM", label: "Dermatology" },
] as const;

export default function PatientDoctorsPage() {
  const router = useRouter();
  const firebaseConfigured = isFirebaseConfigured();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [message, setMessage] = useState(
    firebaseConfigured
      ? "Loading your patient access..."
      : "Authentication is not configured yet.",
  );
  const [query, setQuery] = useState("");
  const [symptom, setSymptom] = useState("");
  const [patientLocation, setPatientLocation] = useState("");
  const [specializationCode, setSpecializationCode] = useState("");
  const [doctors, setDoctors] = useState<DiscoverDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [expandedDoctorId, setExpandedDoctorId] = useState<string | null>(null);
  const [availabilityByDoctor, setAvailabilityByDoctor] = useState<
    Record<string, PublicDoctorAvailabilitySlot[]>
  >({});
  const [loadingAvailabilityId, setLoadingAvailabilityId] = useState<string | null>(
    null,
  );
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseConfigured) {
      return;
    }

    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }

      void getMyPatientProfile(user)
        .then((patient) => setProfile(patient))
        .catch(() => {
          setMessage(
            "Your patient profile is incomplete. Please finish onboarding first.",
          );
        });
    });
  }, [firebaseConfigured, router]);

  useEffect(() => {
    let active = true;

    void discoverDoctors({
      query,
      specializationCode,
      symptom,
      location: patientLocation,
    })
      .then((result) => {
        if (!active) {
          return;
        }

        setDoctors(result);
        setDoctorError(null);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setDoctorError(
          error instanceof Error
            ? error.message
            : "Unable to load available doctors.",
        );
      })
      .finally(() => {
        if (active) {
          setLoadingDoctors(false);
        }
      });

    return () => {
      active = false;
    };
  }, [patientLocation, query, specializationCode, symptom]);

  async function handleSignOut() {
    if (!firebaseConfigured) {
      router.replace("/auth");
      return;
    }

    await signOut(getFirebaseAuth());
    router.replace("/auth");
  }

  async function handleViewAvailability(doctorId: string) {
    if (expandedDoctorId === doctorId) {
      setExpandedDoctorId(null);
      setAvailabilityError(null);
      return;
    }

    setExpandedDoctorId(doctorId);
    setAvailabilityError(null);

    if (availabilityByDoctor[doctorId]) {
      return;
    }

    setLoadingAvailabilityId(doctorId);

    try {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 6);

      const slots = await getPublicDoctorAvailability(doctorId, {
        from: toDateOnly(from),
        to: toDateOnly(to),
      });

      setAvailabilityByDoctor((current) => ({
        ...current,
        [doctorId]: slots,
      }));
    } catch (error: unknown) {
      setAvailabilityError(
        error instanceof Error
          ? error.message
          : "Unable to load doctor availability.",
      );
    } finally {
      setLoadingAvailabilityId((current) => (current === doctorId ? null : current));
    }
  }

  const recommendedLabel = useMemo(() => {
    if (symptom.trim()) {
      return `Matches for "${symptom.trim()}"`;
    }

    if (query.trim()) {
      return `Search results for "${query.trim()}"`;
    }

    return "Available doctors";
  }, [query, symptom]);

  const rankedDoctors = useMemo(() => {
    const locationNeedle = patientLocation.trim().toLowerCase();
    const queryNeedle = query.trim().toLowerCase();
    const symptomNeedle = symptom.trim().toLowerCase();

    return [...doctors].sort((left, right) => {
      const leftScore = calculateDoctorMatchScore(
        left,
        queryNeedle,
        symptomNeedle,
        specializationCode,
        locationNeedle,
      );
      const rightScore = calculateDoctorMatchScore(
        right,
        queryNeedle,
        symptomNeedle,
        specializationCode,
        locationNeedle,
      );

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return right.yearsOfExperience - left.yearsOfExperience;
    });
  }, [doctors, patientLocation, query, specializationCode, symptom]);

  const matchedDoctors = useMemo(
    () => rankedDoctors.filter((doctor) => isRelevantDoctor(doctor, patientLocation)).slice(0, 3),
    [patientLocation, rankedDoctors],
  );

  if (!profile) {
    return (
      <main className="clinic-grid flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
          <HeartPulse className="mx-auto size-10 text-primary" />
          <p className="mt-5 text-sm text-muted-foreground">{message}</p>
          {message.includes("incomplete") ? (
            <Button asChild className="mt-6 h-11 rounded-xl">
              <Link href="/auth/signup">Finish onboarding</Link>
            </Button>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <PatientWorkspaceShell
      patientName={`${profile.firstName} ${profile.lastName}`}
      onSignOut={handleSignOut}
    >
      <div className="w-full bg-[linear-gradient(180deg,#f7f2e8_0%,#f4ecde_100%)]">
        <section className="border-b border-[#12324d]/10 bg-[linear-gradient(135deg,#0d3553_0%,#123f63_58%,#15496f_100%)] text-primary-foreground">
          <div className="grid xl:grid-cols-[1.08fr_0.92fr]">
            <div className="px-6 py-7 sm:px-8">
              <p className="text-xs font-bold tracking-[0.22em] text-secondary uppercase">
                Doctor discovery
              </p>
              <h1 className="mt-3 text-3xl font-bold">
                Find the right doctor for your health concern.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-primary-foreground/68">
                Browse approved doctors, explore by symptoms or medical needs,
                and review specialization before booking.
              </p>
            </div>
            <div className="border-t border-primary-foreground/10 px-6 py-7 sm:px-8 xl:border-t-0 xl:border-l xl:border-primary-foreground/10">
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-secondary uppercase">
                <Sparkles className="size-4" />
                Search help
              </p>
              <div className="mt-4 space-y-2 text-sm text-primary-foreground/68">
                <p>Search by doctor name or specialization.</p>
                <p>Use symptoms like chest pain, cough, or anxiety.</p>
                <p>Filter by specialization to narrow the list fast.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid xl:grid-cols-[340px_1fr]">
          <aside className="border-r border-[#12324d]/10 bg-[#fcfaf5] px-6 py-5 sm:px-8">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Filters
            </p>
            <div className="mt-4 space-y-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Your location</span>
                <div className="flex h-11 items-center gap-3 rounded-xl border border-[#12324d]/10 bg-white px-4">
                  <Crosshair className="size-4 text-muted-foreground" />
                  <input
                    value={patientLocation}
                    onChange={(event) => setPatientLocation(event.target.value)}
                    placeholder="e.g. Quezon City, Manila, Pasig"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Search doctor</span>
                <div className="flex h-11 items-center gap-3 rounded-xl border border-[#12324d]/10 bg-white px-4">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => {
                      setDoctorError(null);
                      setLoadingDoctors(true);
                      setQuery(event.target.value);
                    }}
                    placeholder="Name or specialization"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Medical need / symptom</span>
                <input
                  value={symptom}
                  onChange={(event) => {
                    setDoctorError(null);
                    setLoadingDoctors(true);
                    setSymptom(event.target.value);
                  }}
                  placeholder="e.g. chest pain, cough, anxiety"
                  className="h-11 rounded-xl border border-[#12324d]/10 bg-white px-4 text-sm outline-none"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Specialization</span>
                <select
                  value={specializationCode}
                  onChange={(event) => {
                    setDoctorError(null);
                    setLoadingDoctors(true);
                    setSpecializationCode(event.target.value);
                  }}
                  className="h-11 rounded-xl border border-[#12324d]/10 bg-white px-4 text-sm outline-none"
                >
                  {specializationOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => {
                  setLoadingDoctors(true);
                  setPatientLocation("");
                  setQuery("");
                  setSymptom("");
                  setSpecializationCode("");
                }}
              >
                Reset filters
              </Button>
            </div>
          </aside>

          <div className="bg-[#fffdf8] px-6 py-5 sm:px-8">
            {matchedDoctors.length > 0 ? (
              <div className="mb-5 rounded-2xl border border-[#12324d]/10 bg-[#f9f5eb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                      Best matched for you
                    </p>
                    <p className="mt-1 text-base font-bold">
                      Relevant doctors near {patientLocation.trim()}
                    </p>
                  </div>
                  <Badge variant="secondary">{matchedDoctors.length} matched</Badge>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {matchedDoctors.map((doctorItem) => (
                    <article
                      key={`matched-${doctorItem._id}`}
                      className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">
                            Dr. {doctorItem.firstName} {doctorItem.lastName}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {doctorItem.specializationName}
                          </p>
                        </div>
                        <Badge variant="outline">Relevant</Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                          {doctorItem.location ||
                            doctorItem.clinicOrHospital ||
                            "Online telehealth practice"}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                  Results
                </p>
                <p className="mt-1 text-xl font-bold">{recommendedLabel}</p>
              </div>
              <Badge variant="outline">{rankedDoctors.length} doctors</Badge>
            </div>

            {doctorError ? (
              <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
                {doctorError}
              </div>
            ) : null}

            {loadingDoctors ? (
              <div className="mt-4 rounded-xl border border-[#12324d]/10 bg-white px-4 py-6 text-sm text-muted-foreground">
                Loading available doctors...
              </div>
            ) : null}

            {!loadingDoctors && !doctorError ? (
              <div className="mt-4 grid gap-3">
                {rankedDoctors.map((doctorItem) => (
                  <article
                    key={doctorItem._id}
                    className="rounded-xl border border-[#12324d]/10 bg-white px-5 py-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold">
                            Dr. {doctorItem.firstName} {doctorItem.lastName}
                            {doctorItem.suffix ? `, ${doctorItem.suffix}` : ""}
                          </p>
                          <Badge variant="secondary">
                            {doctorItem.specializationName}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {doctorItem.location ||
                            doctorItem.clinicOrHospital ||
                            "Telehealth practice"}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-2 text-sm font-semibold text-primary">
                        {doctorItem.yearsOfExperience} yrs
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {doctorItem.bio}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Stethoscope className="size-4 text-primary" />
                          {doctorItem.specializationCode}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="size-4 text-primary" />
                          {doctorItem.location ||
                            doctorItem.clinicOrHospital ||
                            "Online consultation"}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="size-4 text-primary" />
                          Next available slots
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          className="h-11 rounded-xl"
                          onClick={() => void handleViewAvailability(doctorItem._id)}
                        >
                          {expandedDoctorId === doctorItem._id ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                          View availability
                        </Button>
                        <Button asChild className="h-11 rounded-xl">
                          <Link href={`/patient/doctors/${doctorItem._id}/calendar`}>
                            Book consult
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {expandedDoctorId === doctorItem._id ? (
                      <div className="mt-5 rounded-2xl border border-[#12324d]/10 bg-[#fcfaf5] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                              Availability
                            </p>
                            <p className="mt-1 font-semibold">
                              Next 7 days for Dr. {doctorItem.lastName}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {(availabilityByDoctor[doctorItem._id] ?? []).length} slots
                          </Badge>
                        </div>

                        {loadingAvailabilityId === doctorItem._id ? (
                          <div className="mt-4 rounded-xl border border-[#12324d]/10 bg-white px-4 py-4 text-sm text-muted-foreground">
                            Loading consultation slots...
                          </div>
                        ) : null}

                        {availabilityError && loadingAvailabilityId !== doctorItem._id ? (
                          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
                            {availabilityError}
                          </div>
                        ) : null}

                        {loadingAvailabilityId !== doctorItem._id ? (
                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {(availabilityByDoctor[doctorItem._id] ?? []).map((slot) => (
                              <div
                                key={slot._id}
                                className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4"
                              >
                                <p className="font-semibold text-primary">
                                  {formatAvailabilityDay(slot.startAt)}
                                </p>
                                <p className="mt-2 text-sm font-medium">
                                  {formatAvailabilityTimeRange(slot.startAt, slot.endAt)}
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Online consultation
                                </p>
                              </div>
                            ))}

                            {(availabilityByDoctor[doctorItem._id] ?? []).length === 0 ? (
                              <div className="rounded-xl border border-dashed border-[#12324d]/12 bg-white px-4 py-6 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                                No upcoming available slots yet for this doctor.
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                ))}

                {rankedDoctors.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
                    No matching doctors found. Try another symptom, keyword, or specialization.
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PatientWorkspaceShell>
  );
}

function calculateDoctorMatchScore(
  doctor: DiscoverDoctor,
  query: string,
  symptom: string,
  specializationCode: string,
  patientLocation: string,
): number {
  const searchableText = [
    doctor.firstName,
    doctor.lastName,
    doctor.specializationCode,
    doctor.specializationName,
    doctor.clinicOrHospital,
    doctor.location,
    doctor.bio,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = doctor.yearsOfExperience;

  if (query && searchableText.includes(query)) {
    score += 6;
  }

  if (symptom && searchableText.includes(symptom)) {
    score += 7;
  }

  if (specializationCode && doctor.specializationCode === specializationCode) {
    score += 8;
  }

  if (patientLocation && searchableText.includes(patientLocation)) {
    score += 10;
  }

  return score;
}

function isRelevantDoctor(
  doctor: DiscoverDoctor,
  patientLocation: string,
): boolean {
  const locationNeedle = patientLocation.trim().toLowerCase();
  if (!locationNeedle) {
    return false;
  }

  const searchableText = [doctor.location, doctor.clinicOrHospital, doctor.bio]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(locationNeedle);
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatAvailabilityDay(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatAvailabilityTimeRange(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);

  return `${start.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
