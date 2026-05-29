"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { HeartPulse, Save } from "lucide-react";

import { PatientWorkspaceShell } from "../patient-workspace-shell";

import { Button } from "@/components/ui/button";
import { PhAddressFields } from "@/components/forms/ph-address-fields";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import {
  getMyPatientProfile,
  saveMyPatientProfile,
  type PatientProfile,
} from "@/lib/patient-api";

export default function PatientProfilePage() {
  const router = useRouter();
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
            Profile
          </p>
          <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
            Your patient information
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Update the details doctors use to prepare safer teleconsultations. Email is read-only.
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
              });
            }}
          >
            <ProfileCard title="Personal details">
              <Field label="Email" value={profile.email} disabled />
              <TwoCols>
                <Field label="First name" value={profile.firstName} onChange={(value) => setProfile({ ...profile, firstName: value })} />
                <Field label="Last name" value={profile.lastName} onChange={(value) => setProfile({ ...profile, lastName: value })} />
              </TwoCols>
              <TwoCols>
                <Field label="Suffix" value={profile.suffix ?? ""} onChange={(value) => setProfile({ ...profile, suffix: value })} />
                <Field label="Mobile number" value={profile.mobileNumber} onChange={(value) => setProfile({ ...profile, mobileNumber: value })} />
              </TwoCols>
              <TwoCols>
                <Field label="Birthday" type="date" value={toDateInput(profile.birthdate)} onChange={(value) => setProfile({ ...profile, birthdate: value })} />
                <label className="grid gap-2 text-sm font-semibold text-primary">
                  Sex
                  <select
                    value={profile.sex}
                    onChange={(event) => setProfile({ ...profile, sex: event.target.value as PatientProfile["sex"] })}
                    className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm outline-none"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </label>
              </TwoCols>
            </ProfileCard>

            <ProfileCard title="Health details">
              <TwoCols>
                <Field label="Weight (kg)" type="number" value={String(profile.weightKg)} onChange={(value) => setProfile({ ...profile, weightKg: Number(value) })} />
                <Field label="Height (cm)" type="number" value={String(profile.heightCm)} onChange={(value) => setProfile({ ...profile, heightCm: Number(value) })} />
              </TwoCols>
              <TwoCols>
                <Field label="Emergency contact" value={profile.emergencyContactName ?? ""} onChange={(value) => setProfile({ ...profile, emergencyContactName: value })} />
                <Field label="Emergency number" value={profile.emergencyContactNumber ?? ""} onChange={(value) => setProfile({ ...profile, emergencyContactNumber: value })} />
              </TwoCols>
              <Field label="Allergies" value={profile.allergies.join(", ")} onChange={(value) => setProfile({ ...profile, allergies: splitItems(value) })} />
              <Field label="Existing conditions" value={profile.existingConditions.join(", ")} onChange={(value) => setProfile({ ...profile, existingConditions: splitItems(value) })} />
              <Field label="Current medications" value={profile.currentMedications.join(", ")} onChange={(value) => setProfile({ ...profile, currentMedications: splitItems(value) })} />
              <TextArea label="Basic medical history" value={profile.basicMedicalHistory ?? ""} onChange={(value) => setProfile({ ...profile, basicMedicalHistory: value })} />
            </ProfileCard>

            <ProfileCard title="Location">
              {!hasSavedLocation ? (
                <div className="rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm leading-6 text-primary">
                  No saved location found yet. Please choose your Philippine
                  address, then save your profile so doctors can match care
                  near your area.
                </div>
              ) : (
                <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3 text-sm leading-6 text-primary">
                  Current saved location:{" "}
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
            </ProfileCard>

            <div className="xl:col-span-2">
              <Button className="h-11 rounded-xl" disabled={saving} type="submit">
                <Save className="size-4" />
                {saving ? "Saving..." : "Save profile"}
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
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-primary">
      {label}
      <input
        type={type}
        value={value}
        disabled={disabled}
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
