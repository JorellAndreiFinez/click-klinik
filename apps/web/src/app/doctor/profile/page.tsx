"use client";

import { useEffect, useState } from "react";
import type { FormEvent, InputHTMLAttributes, ReactNode } from "react";
import { Save } from "lucide-react";

import { PhAddressFields } from "@/components/forms/ph-address-fields";
import { LocationPinPicker } from "@/components/forms/location-pin-picker";
import { Button } from "@/components/ui/button";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";
import { dashboardPageTranslations } from "@/features/localization/dashboard-page-translations";
import { useLocale } from "@/features/localization/locale-provider";
import {
  saveMyDoctorProfile,
  type DoctorApplication,
} from "@/lib/doctor-api";

const suffixes = ["MD", "DO", "RPsy", "RPT", "Other"] as const;

export default function DoctorProfilePage() {
  const { user, doctor } = useDoctorWorkspace();
  const { locale } = useLocale();
  const t = dashboardPageTranslations[locale].doctorProfile;
  const [profile, setProfile] = useState<DoctorApplication | null>(doctor);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
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
    setProfile(doctor);
  }, [doctor]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !profile) return;

    const form = new FormData(event.currentTarget);
    const regionCode = String(form.get("regionCode") ?? "").trim();
    const regionName = String(form.get("regionName") ?? "").trim();
    const provinceCode = String(form.get("provinceCode") ?? "").trim();
    const provinceName = String(form.get("provinceName") ?? "").trim();
    const cityMunicipalityCode = String(
      form.get("cityMunicipalityCode") ?? "",
    ).trim();
    const cityMunicipalityName = String(
      form.get("cityMunicipalityName") ?? "",
    ).trim();
    const barangayCode = String(form.get("barangayCode") ?? "").trim();
    const barangayName = String(form.get("barangayName") ?? "").trim();
    const location = String(form.get("location") ?? "").trim();
    const latitude = optionalNumber(form.get("latitude"));
    const longitude = optionalNumber(form.get("longitude"));

    setSaving(true);
    setMessage("");

    try {
      const saved = await saveMyDoctorProfile(user, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        suffix: suffixes.includes(profile.suffix as (typeof suffixes)[number])
          ? profile.suffix
          : "Other",
        otherSuffix: suffixes.includes(profile.suffix as (typeof suffixes)[number])
          ? undefined
          : profile.suffix,
        mobileNumber: profile.mobileNumber,
        prcLicenseNumber: profile.prcLicenseNumber,
        specializationCode: profile.specializationCode,
        otherSpecialization:
          profile.specializationCode === "OTHER"
            ? profile.specializationName
            : undefined,
        clinicOrHospital: profile.clinicOrHospital,
        location: location || cityMunicipalityName || profile.location,
        regionCode,
        regionName,
        provinceCode: provinceCode || undefined,
        provinceName: provinceName || undefined,
        cityMunicipalityCode,
        cityMunicipalityName,
        barangayCode,
        barangayName,
        latitude,
        longitude,
        yearsOfExperience: profile.yearsOfExperience,
        bio: profile.bio,
        displayOnPublicWebsite: profile.displayOnPublicWebsite,
        credentialReviewConsent: true,
      });
      setProfile(saved);
      setMessage(`${t.save}d.`);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;

  return (
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
        {message ? (
          <div className="mb-4 rounded-xl border border-[#12324d]/10 bg-white px-4 py-3 text-sm text-primary">
            {message}
          </div>
        ) : null}

        <form className="grid gap-5 xl:grid-cols-2" onSubmit={handleSave}>
          <ProfileCard title={t.professional}>
            <Field label={t.professionalEmail} value={profile.professionalEmail} disabled />
            <TwoCols>
              <Field label={t.firstName} value={profile.firstName} onChange={(value) => setProfile({ ...profile, firstName: value })} />
              <Field label={t.lastName} value={profile.lastName} onChange={(value) => setProfile({ ...profile, lastName: value })} />
            </TwoCols>
            <TwoCols>
              <label className="grid gap-2 text-sm font-semibold text-primary">
                {t.suffix}
                <select
                  value={suffixes.includes(profile.suffix as (typeof suffixes)[number]) ? profile.suffix : "Other"}
                  onChange={(event) => setProfile({ ...profile, suffix: event.target.value })}
                  className="h-11 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 text-sm outline-none"
                >
                  {suffixes.map((suffix) => (
                    <option key={suffix} value={suffix}>{suffix}</option>
                  ))}
                </select>
              </label>
              <Field
                label={t.mobile}
                value={profile.mobileNumber}
                inputMode="tel"
                maxLength={13}
                onChange={(value) => setProfile({ ...profile, mobileNumber: toPhilippineE164Input(value) })}
              />
            </TwoCols>
            <TwoCols>
              <Field label={t.prc} value={profile.prcLicenseNumber} onChange={(value) => setProfile({ ...profile, prcLicenseNumber: value })} />
              <Field label={t.years} type="number" value={String(profile.yearsOfExperience)} onChange={(value) => setProfile({ ...profile, yearsOfExperience: Number(value) })} />
            </TwoCols>
          </ProfileCard>

          <ProfileCard title={t.publicProfile}>
            <TwoCols>
              <Field label={t.specializationCode} value={profile.specializationCode} onChange={(value) => setProfile({ ...profile, specializationCode: value })} />
              <Field label={t.specializationName} value={profile.specializationName} disabled />
            </TwoCols>
            <Field label={t.clinic} value={profile.clinicOrHospital ?? ""} onChange={(value) => setProfile({ ...profile, clinicOrHospital: value })} />
            <TextArea label={t.bio} value={profile.bio} onChange={(value) => setProfile({ ...profile, bio: value })} />
            <label className="flex items-center gap-3 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3 text-sm font-semibold text-primary">
              <input
                type="checkbox"
                checked={profile.displayOnPublicWebsite}
                onChange={(event) => setProfile({ ...profile, displayOnPublicWebsite: event.target.checked })}
              />
              {t.showPublic}
            </label>
          </ProfileCard>

          <ProfileCard title={t.location}>
            <p className="text-sm leading-6 text-muted-foreground">
              {t.locationCopy}
            </p>
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
                regionCode: profile.regionCode,
                provinceCode: profile.provinceCode,
                cityMunicipalityCode: profile.cityMunicipalityCode,
                barangayCode: profile.barangayCode,
              }}
            />
            <LocationPinPicker
              defaultLatitude={profile.latitude}
              defaultLongitude={profile.longitude}
              title={t.clinicMapPin}
              description={t.clinicMapPinCopy}
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
        rows={5}
        className="min-h-32 rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-3 py-3 text-sm outline-none"
      />
    </label>
  );
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
