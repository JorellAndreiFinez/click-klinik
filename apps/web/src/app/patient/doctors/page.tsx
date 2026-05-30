"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { dashboardPageTranslations } from "@/features/localization/dashboard-page-translations";
import { useLocale } from "@/features/localization/locale-provider";
import {
  discoverDoctors,
  getPublicDoctorAvailability,
  recommendDoctors,
  type DoctorRecommendation,
  type DiscoverDoctor,
  type PublicDoctorAvailabilitySlot,
} from "@/lib/doctor-discovery-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { getMyPatientProfile, type PatientProfile } from "@/lib/patient-api";

const specializationOptions = [
  { code: "", label: "All specializations" },
  { code: "MEDSPEC", label: "Medical Specialist" },
  { code: "GPHY", label: "General Physician" },
  { code: "GP", label: "General Practitioner" },
  { code: "CARD", label: "Cardiologist" },
  { code: "CARDADULT", label: "Adult Cardiologist" },
  { code: "IM", label: "Internal Medicine" },
  { code: "HEMA", label: "Hematology" },
  { code: "IMID", label: "Infectious Disease" },
  { code: "PULMO", label: "Pulmonology" },
  { code: "PEDIA", label: "Pediatrics" },
  { code: "OBGYN", label: "Obstetrician-Gynecologist" },
  { code: "PSYCH", label: "Psychiatry" },
  { code: "PSYCHO", label: "Psychology" },
  { code: "ENT", label: "ENT" },
  { code: "DERM", label: "Dermatology" },
  { code: "IMMONCO", label: "Immunodermatology and Oncodermatology" },
  { code: "GS", label: "General Surgery" },
  { code: "NEURO", label: "Neurology" },
  { code: "OPTH", label: "Ophthalmology" },
  { code: "PHYTHERA", label: "Physical Therapist" },
  { code: "REHAB", label: "Rehabilitation Medicine" },
  { code: "URO", label: "Urology" },
] as const;

export default function PatientDoctorsPage() {
  return (
    <Suspense fallback={<DoctorsPageFallback />}>
      <PatientDoctorsPageContent />
    </Suspense>
  );
}

function PatientDoctorsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const t = dashboardPageTranslations[locale].patientDoctors;
  const firebaseConfigured = isFirebaseConfigured();
  const initialSymptom = searchParams.get("symptom") ?? "";
  const initialLocation = searchParams.get("location") ?? "";
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [message, setMessage] = useState(
    firebaseConfigured
      ? "Loading your patient access..."
      : "Authentication is not configured yet.",
  );
  const [query, setQuery] = useState("");
  const [symptom, setSymptom] = useState(initialSymptom);
  const [patientLocation, setPatientLocation] = useState(initialLocation);
  const [specializationCode, setSpecializationCode] = useState("");
  const [doctors, setDoctors] = useState<DiscoverDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [recommendation, setRecommendation] =
    useState<DoctorRecommendation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
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

        if (result.length === 0 && specializationCode && symptom.trim()) {
          return discoverDoctors({
            query,
            specializationCode,
            location: patientLocation,
          }).then((fallbackResult) => {
            if (!active) {
              return;
            }

            setDoctors(fallbackResult);
            setDoctorError(null);
          });
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

  async function handleAiRecommendation() {
    if (!symptom.trim()) {
      setDoctorError("Describe the symptom or medical need first.");
      return;
    }

    setAiLoading(true);
    setDoctorError(null);

    try {
      const result = await recommendDoctors({
        symptom,
        location: patientLocation,
        query,
      });
      const recommendedDoctors =
        result.doctors.length > 0
          ? result.doctors
          : await discoverDoctorsForRecommendation(result, {
              query,
              location: patientLocation,
            });

      setRecommendation(result);
      setSpecializationCode(result.specializationCode);
      setDoctors(recommendedDoctors);
      setLoadingDoctors(false);
    } catch (error: unknown) {
      const fallback = buildLocalRecommendation(symptom);
      const fallbackDoctors = await discoverDoctors({
        query,
        location: patientLocation,
        symptom,
        specializationCode: fallback.specializationCode,
      }).catch(() => []);

      setRecommendation(fallback);
      setSpecializationCode(fallback.specializationCode);
      setDoctors(fallbackDoctors);
      setLoadingDoctors(false);
      setDoctorError(
        error instanceof Error &&
          error.message.includes("Cannot POST /doctors/recommendation")
          ? "AI recommendation route is not loaded in the API yet. Using built-in symptom matching for now."
          : error instanceof Error
            ? error.message
            : "Unable to recommend doctors for this symptom.",
      );
    } finally {
      setAiLoading(false);
    }
  }

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
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
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
      <div className="w-full bg-[#f7f2e8]">
        <section className="border-b border-[#12324d]/10 bg-white px-6 py-6 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              {t.eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
              {t.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t.description}
            </p>
          </div>
        </section>

        <section className="grid xl:grid-cols-[340px_1fr]">
          <aside className="border-r border-[#12324d]/10 bg-[#fcfaf5] px-6 py-5 sm:px-8">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              {t.filters}
            </p>
            <div className="mt-4 space-y-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">{t.yourLocation}</span>
                <div className="flex h-11 items-center gap-3 rounded-xl border border-[#12324d]/10 bg-white px-4">
                  <Crosshair className="size-4 text-muted-foreground" />
                  <input
                    value={patientLocation}
                    onChange={(event) => {
                      setRecommendation(null);
                      setPatientLocation(event.target.value);
                    }}
                    placeholder="e.g. Quezon City, Manila, Pasig"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">{t.searchDoctor}</span>
                <div className="flex h-11 items-center gap-3 rounded-xl border border-[#12324d]/10 bg-white px-4">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => {
                      setDoctorError(null);
                      setRecommendation(null);
                      setLoadingDoctors(true);
                      setQuery(event.target.value);
                    }}
                    placeholder="Name or specialization"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">{t.symptom}</span>
                <textarea
                  value={symptom}
                  onChange={(event) => {
                    setDoctorError(null);
                    setRecommendation(null);
                    setLoadingDoctors(true);
                    setSymptom(event.target.value);
                  }}
                  placeholder="Describe the symptoms, health concern, or specialist you think you need."
                  rows={4}
                  className="min-h-28 rounded-xl border border-[#12324d]/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>

              <Button
                type="button"
                className="h-11 rounded-xl"
                onClick={() => void handleAiRecommendation()}
                disabled={aiLoading}
              >
                <Sparkles className="size-4" />
                {aiLoading ? t.matchingDoctors : t.askAi}
              </Button>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">{t.specialization}</span>
                <select
                  value={specializationCode}
                  onChange={(event) => {
                    setDoctorError(null);
                    setRecommendation(null);
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
                  setRecommendation(null);
                  setPatientLocation("");
                  setQuery("");
                  setSymptom("");
                  setSpecializationCode("");
                }}
              >
                {t.reset}
              </Button>
            </div>
          </aside>

          <div className="bg-[#fffdf8] px-6 py-5 sm:px-8">
            {matchedDoctors.length > 0 ? (
              <div className="mb-5 rounded-xl border border-[#12324d]/10 bg-white p-4">
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
                      className="rounded-lg border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-4"
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
                {recommendation ? (
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    AI matched this concern to{" "}
                    <span className="font-semibold text-primary">
                      {recommendation.specializationName}
                    </span>
                    {recommendation.relatedSpecializations.length > 1 ? (
                      <>
                        {" "}with related options like{" "}
                        <span className="font-semibold text-primary">
                          {recommendation.relatedSpecializations
                            .slice(1)
                            .map((item) => item.name)
                            .join(", ")}
                        </span>
                      </>
                    ) : null}
                    . {recommendation.reasoning}
                  </p>
                ) : null}
              </div>
              <Badge variant="outline">{rankedDoctors.length} doctors</Badge>
            </div>

            {recommendation ? (
              <div className="mt-4 rounded-xl border border-[#12324d]/10 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                      {t.aiRecommendation}
                    </p>
                    <p className="mt-1 font-semibold">
                      {recommendation.specializationName}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {recommendation.specializationCode}
                  </Badge>
                </div>
                {recommendation.relatedSpecializations.length > 1 ? (
                  <div className="mt-3">
                    <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
                      {t.relatedTypes}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {recommendation.relatedSpecializations.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setDoctorError(null);
                            setLoadingDoctors(true);
                            setSpecializationCode(item.code);
                          }}
                          className={`rounded-full border px-3 py-1 text-xs ${
                            specializationCode === item.code
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-[#12324d]/10 bg-white text-muted-foreground"
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {recommendation.symptomKeywords.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recommendation.symptomKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-[#12324d]/10 bg-white px-3 py-1 text-xs text-muted-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  {recommendation.disclaimer}
                </p>
              </div>
            ) : null}

            {doctorError ? (
              <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
                {doctorError}
              </div>
            ) : null}

            {loadingDoctors ? (
              <div className="mt-4 rounded-xl border border-[#12324d]/10 bg-white px-4 py-6 text-sm text-muted-foreground">
                {t.loadingDoctors}
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
                          {t.nextSlots}
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
                          {expandedDoctorId === doctorItem._id
                            ? t.hideAvailability
                            : t.viewAvailability}
                        </Button>
                        <Button asChild className="h-11 rounded-xl">
                          <Link href={`/patient/doctors/${doctorItem._id}/calendar`}>
                            {t.bookConsult}
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {expandedDoctorId === doctorItem._id ? (
                      <div className="mt-5 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                              {t.availability}
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
                                {t.noUpcomingSlots}
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
                    {t.noMatches}
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

function DoctorsPageFallback() {
  const { locale } = useLocale();
  const t = dashboardPageTranslations[locale].patientDoctors;

  return (
    <main className="clinic-grid flex min-h-screen items-center justify-center px-5">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <HeartPulse className="mx-auto size-10 text-primary" />
        <p className="mt-5 text-sm text-muted-foreground">
          {t.loadingDoctors}
        </p>
      </div>
    </main>
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

async function discoverDoctorsForRecommendation(
  recommendation: DoctorRecommendation,
  filters: {
    query?: string;
    location?: string;
  },
): Promise<DiscoverDoctor[]> {
  const specializationCodes = Array.from(
    new Set([
      recommendation.specializationCode,
      ...recommendation.relatedSpecializations.map((item) => item.code),
    ]),
  );
  const doctorGroups = await Promise.all(
    specializationCodes.map((code) =>
      discoverDoctors({
        query: filters.query,
        location: filters.location,
        specializationCode: code,
      }).catch(() => []),
    ),
  );
  const doctorsById = new Map<string, DiscoverDoctor>();

  doctorGroups.flat().forEach((doctor) => {
    doctorsById.set(doctor._id, doctor);
  });

  return Array.from(doctorsById.values());
}

function buildLocalRecommendation(symptom: string): DoctorRecommendation {
  const input = symptom.toLowerCase();
  const rules: Array<{
    specializationCode: string;
    relatedSpecializations?: string[];
    keywords: string[];
  }> = [
    { specializationCode: "CARD", relatedSpecializations: ["IM", "GPHY"], keywords: ["chest pain", "palpitations", "heart", "high blood"] },
    { specializationCode: "PULMO", relatedSpecializations: ["IM", "GPHY"], keywords: ["cough", "asthma", "shortness of breath", "wheezing"] },
    { specializationCode: "PSYCH", relatedSpecializations: ["PSYCHO", "GPHY"], keywords: ["anxiety", "depression", "panic", "insomnia", "suicidal"] },
    { specializationCode: "PSYCHO", relatedSpecializations: ["PSYCH", "GPHY"], keywords: ["stress", "counseling", "therapy", "behavior"] },
    { specializationCode: "DERM", relatedSpecializations: ["GPHY"], keywords: ["rash", "itch", "skin", "acne", "eczema"] },
    { specializationCode: "OBGYN", relatedSpecializations: ["GPHY"], keywords: ["pregnancy", "period", "pelvic", "menstrual", "vaginal"] },
    { specializationCode: "PEDIA", relatedSpecializations: ["GPHY"], keywords: ["child", "baby", "infant", "newborn", "pediatric"] },
    { specializationCode: "ENT", relatedSpecializations: ["GPHY"], keywords: ["ear", "nose", "throat", "sinus", "tonsil"] },
    { specializationCode: "NEURO", relatedSpecializations: ["IM", "GPHY"], keywords: ["migraine", "seizure", "numbness", "headache", "vertigo"] },
    { specializationCode: "URO", relatedSpecializations: ["IM", "GPHY"], keywords: ["urine", "uti", "kidney", "prostate", "bladder"] },
    { specializationCode: "OPTH", relatedSpecializations: ["GPHY"], keywords: ["eye", "vision", "blurred vision", "red eye"] },
    { specializationCode: "REHAB", relatedSpecializations: ["PHYTHERA", "GPHY"], keywords: ["injury", "rehab", "mobility", "stroke recovery"] },
    { specializationCode: "PHYTHERA", relatedSpecializations: ["REHAB", "GPHY"], keywords: ["back pain", "joint pain", "physical therapy", "sprain"] },
    { specializationCode: "IM", relatedSpecializations: ["GPHY", "MEDSPEC"], keywords: ["diabetes", "hypertension", "cholesterol", "fatigue", "adult checkup"] },
  ];

  const matchedRule = rules.find((rule) =>
    rule.keywords.some((keyword) => input.includes(keyword)),
  );
  const specializationCode = matchedRule?.specializationCode ?? "GPHY";
  const specializationName =
    specializationOptions.find((item) => item.code === specializationCode)?.label ??
    "General Physician";
  const relatedCodes = Array.from(
    new Set([
      specializationCode,
      ...(matchedRule?.relatedSpecializations ?? ["GPHY"]),
    ]),
  );

  return {
    specializationCode,
    specializationName,
    relatedSpecializations: relatedCodes.map((code) => ({
      code,
      name:
        specializationOptions.find((item) => item.code === code)?.label ?? code,
    })),
    reasoning: `Matched to ${specializationName} with related alternatives using built-in symptom rules while AI routing is unavailable.`,
    symptomKeywords: matchedRule?.keywords.slice(0, 4) ?? [],
    disclaimer:
      "Guidance only. This recommendation does not replace professional medical advice or emergency care.",
    doctors: [],
  };
}
