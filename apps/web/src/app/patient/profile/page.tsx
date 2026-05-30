"use client";

import { useEffect, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { HeartPulse, Save } from "lucide-react";

import { PatientWorkspaceShell } from "../patient-workspace-shell";

import { Button } from "@/components/ui/button";
import { PhAddressFields } from "@/components/forms/ph-address-fields";
import { LocationPinPicker } from "@/components/forms/location-pin-picker";
import { dashboardPageTranslations } from "@/features/localization/dashboard-page-translations";
import { useLocale } from "@/features/localization/locale-provider";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import {
  getMyPatientProfile,
  saveMyPatientProfile,
  type PatientProfile,
} from "@/lib/patient-api";

export default function PatientProfilePage() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = dashboardPageTranslations[locale].patientProfile;
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Loading your profile...");
  const savedLocationParts = profile
    ? [
        profile.barangayName,
        profile.cityMunicipalityName,
        profile.provinceName,
        profile.regionName,
      ].filter(Boolean)
    : [];
  const hasSavedLocation = Boolean(
    savedLocationParts.length > 0 ||
      profile?.regionCode ||
      profile?.cityMunicipalityCode ||
      profile?.barangayCode,
  );

  useEffect(() => {
    if (!configured) return;

    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      if (!nextUser) {
        router.replace("/auth");
        return;
      }

      setUser(nextUser);
      void getMyPatientProfile(nextUser)
        .then((nextProfile) => {
          setProfile(nextProfile);
          setLoading(false);
        })
        .catch((error: unknown) => {
          setMessage(error instanceof Error ? error.message : "Unable to load profile.");
          setLoading(false);
        });
    });
  }, [configured, router]);

  async function handleSignOut() {
    if (!configured) {
      router.replace("/auth");
      return;
    }

    await signOut(getFirebaseAuth());
    router.replace("/auth");
  }

  async function handleSave(nextProfile = profile) {
    if (!user || !nextProfile) return;

    setSaving(true);
    setMessage("");

    try {
      const saved = await saveMyPatientProfile(user, {
        ...nextProfile,
        birthdate: toDateInput(nextProfile.birthdate),
        allergies: nextProfile.allergies,
        existingConditions: nextProfile.existingConditions,
        currentMedications: nextProfile.currentMedications,
      });
      setProfile(saved);
      setMessage("Profile updated.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <main className="clinic-grid flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <HeartPulse className="mx-auto size-10 text-primary" />
          <p className="mt-5 text-sm text-muted-foreground">{message}</p>
        </div>
      </main>
    );
  }

  return (
    <PatientWorkspaceShell
      patientName={`${profile.firstName} ${profile.lastName}`}
      onSignOut={handleSignOut}
    >
      <div className="min-h-full bg-[#f7f2e8]">
        <section className="border-b border-[#12324d]/10 bg-white px-6 py-6 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {t.eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
            {t.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t.description}
          </p>
        </section>

        <main className="px-6 py-6 sm:px-8">
          {message && !loading ? (
            <div className="mb-4 rounded-xl border border-[#12324d]/10 bg-white px-4 py-3 text-sm text-primary">
              {message}
            </div>
          ) : null}

          <form
            className="grid gap-5 xl:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setProfile({
                ...profile,
                regionCode: String(form.get("regionCode") ?? "").trim(),
                regionName: String(form.get("regionName") ?? "").trim(),
                provinceCode: String(form.get("provinceCode") ?? "").trim() || undefined,
                provinceName: String(form.get("provinceName") ?? "").trim() || undefined,
                cityMunicipalityCode: String(form.get("cityMunicipalityCode") ?? "").trim(),
                cityMunicipalityName: String(form.get("cityMunicipalityName") ?? "").trim(),
                barangayCode: String(form.get("barangayCode") ?? "").trim(),
                barangayName: String(form.get("barangayName") ?? "").trim(),
                latitude: optionalNumber(form.get("latitude")),
                longitude: optionalNumber(form.get("longitude")),
              });
              void handleSave({
                ...profile,
                regionCode: String(form.get("regionCode") ?? "").trim(),
                regionName: String(form.get("regionName") ?? "").trim(),
                provinceCode: String(form.get("provinceCode") ?? "").trim() || undefined,
                provinceName: String(form.get("provinceName") ?? "").trim() || undefined,
                cityMunicipalityCode: String(form.get("cityMunicipalityCode") ?? "").trim(),
                cityMunicipalityName: String(form.get("cityMunicipalityName") ?? "").trim(),
                barangayCode: String(form.get("barangayCode") ?? "").trim(),
                barangayName: String(form.get("barangayName") ?? "").trim(),
                latitude: optionalNumber(form.get("latitude")),
                longitude: optionalNumber(form.get("longitude")),
              });
            }}
          >
            <ProfileCard title={t.personal}>
              <Field label={t.email} value={profile.email} disabled />
              <TwoCols>
                <Field label={t.firstName} value={profile.firstName} onChange={(value) => setProfile({ ...profile, firstName: value })} />
                <Field label={t.lastName} value={profile.lastName} onChange={(value) => setProfile({ ...profile, lastName: value })} />
              </TwoCols>
              <TwoCols>
                <Field label={t.suffix} value={profile.suffix ?? ""} onChange={(value) => setProfile({ ...profile, suffix: value })} />
                <Field
                  label={t.mobile}
                  value={profile.mobileNumber}
                  inputMode="tel"
                  maxLength={13}
                  onChange={(value) => setProfile({ ...profile, mobileNumber: toPhilippineE164Input(value) })}
                />
              </TwoCols>
              <TwoCols>
                <Field label={t.birthday} type="date" value={toDateInput(profile.birthdate)} onChange={(value) => setProfile({ ...profile, birthdate: value })} />
                <label className="grid gap-2 text-sm font-semibold text-primary">
                  {t.sex}
                  <select
                    value={profile.sex}
                    onChange={(event) => setProfile({ ...profile, sex: event.target.value as PatientProfile["sex"] })}
                    className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm outline-none"
                  >
                    <option value="female">{t.female}</option>
                    <option value="male">{t.male}</option>
                    <option value="prefer_not_to_say">{t.preferNot}</option>
                  </select>
                </label>
              </TwoCols>
            </ProfileCard>

            <ProfileCard title={t.health}>
              <TwoCols>
                <Field label={t.weight} type="number" value={String(profile.weightKg)} onChange={(value) => setProfile({ ...profile, weightKg: Number(value) })} />
                <Field label={t.height} type="number" value={String(profile.heightCm)} onChange={(value) => setProfile({ ...profile, heightCm: Number(value) })} />
              </TwoCols>
              <TwoCols>
                <Field label={t.emergencyContact} value={profile.emergencyContactName ?? ""} onChange={(value) => setProfile({ ...profile, emergencyContactName: value })} />
                <Field label={t.emergencyNumber} value={profile.emergencyContactNumber ?? ""} onChange={(value) => setProfile({ ...profile, emergencyContactNumber: value })} />
              </TwoCols>
              <Field label={t.allergies} value={profile.allergies.join(", ")} onChange={(value) => setProfile({ ...profile, allergies: splitItems(value) })} />
              <Field label={t.conditions} value={profile.existingConditions.join(", ")} onChange={(value) => setProfile({ ...profile, existingConditions: splitItems(value) })} />
              <Field label={t.medications} value={profile.currentMedications.join(", ")} onChange={(value) => setProfile({ ...profile, currentMedications: splitItems(value) })} />
              <TextArea label={t.basicHistory} value={profile.basicMedicalHistory ?? ""} onChange={(value) => setProfile({ ...profile, basicMedicalHistory: value })} />
            </ProfileCard>

            <ProfileCard title={t.location}>
              {!hasSavedLocation ? (
                <div className="rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm leading-6 text-primary">
                  {t.noSavedLocation}
                </div>
              ) : (
                <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3 text-sm leading-6 text-primary">
                  {t.currentSavedLocation}{" "}
                  <strong>
                    {savedLocationParts.length > 0
                      ? savedLocationParts.join(", ")
                      : "Saved location codes detected"}
                  </strong>
                </div>
              )}
              <PhAddressFields
                defaultValue={{
                  regionCode: profile.regionCode ?? "",
                  provinceCode: profile.provinceCode ?? "",
                  cityMunicipalityCode: profile.cityMunicipalityCode ?? "",
                  barangayCode: profile.barangayCode ?? "",
                }}
              />
              <LocationPinPicker
                defaultLatitude={profile.latitude}
                defaultLongitude={profile.longitude}
              />
            </ProfileCard>

            <div className="xl:col-span-2">
              <Button className="h-11 rounded-xl" disabled={saving} type="submit">
                <Save className="size-4" />
                {saving ? t.saving : t.save}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </PatientWorkspaceShell>
  );
}

function ProfileCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#12324d]/10 bg-white p-5">
      <h2 className="text-lg font-bold text-primary">{title}</h2>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

function TwoCols({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  disabled?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-primary">
      {label}
      <input
        type={type}
        value={value}
        disabled={disabled}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm outline-none disabled:bg-[#eee8dc] disabled:text-muted-foreground"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-primary">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="min-h-28 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-3 text-sm outline-none"
      />
    </label>
  );
}

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function splitItems(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function optionalNumber(value: FormDataEntryValue | null): number | undefined {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toPhilippineE164Input(value: string): string {
  const digits = value.replace(/\D/g, "");
  const local = digits.replace(/^63/, "").replace(/^0/, "").slice(0, 10);
  return local ? `+63${local}` : "";
}
