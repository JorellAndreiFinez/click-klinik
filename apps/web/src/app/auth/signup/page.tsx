"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Phone,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhAddressFields } from "@/components/forms/ph-address-fields";
import { LanguageSelector } from "@/features/localization/language-selector";
import { useLocale } from "@/features/localization/locale-provider";
import { patientAuthTranslations, type PatientSignupCopy } from "@/features/localization/patient-auth-translations";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { checkPatientMobileAvailability, checkPatientSignupEligibility, saveMyPatientProfile } from "@/lib/patient-api";

type Notice = { kind: "error" | "success"; message: string } | null;
type SignUpStep = "account" | "password" | "mobile" | "profile" | "verified";

export default function PatientSignUpPage() {
  const { locale } = useLocale();
  const t = patientAuthTranslations[locale].signup;
  const firebaseConfigured = isFirebaseConfigured();
  const [notice, setNotice] = useState<Notice>(null);
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [step, setStep] = useState<SignUpStep>("account");
  const [busy, setBusy] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");

  function startMobileRegistration(firstName: string, lastName: string) {
    setPatientFirstName(firstName);
    setPatientLastName(lastName);
    setStep("mobile");
    setNotice({
      kind: "success",
      message: t.createdNotice,
    });
  }

  async function handleEmailSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    try {
      validatePatientPassword(password, confirmPassword, t);
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await checkPatientSignupEligibility(credential.user);
      await updateProfile(credential.user, { displayName: `${firstName} ${lastName}`.trim() });
      startMobileRegistration(firstName || "Patient", lastName);
    } catch (error) {
      setNotice({ kind: "error", message: getAuthErrorMessage(error, t) });
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignUp() {
    setBusy(true);
    setNotice(null);

    try {
      const credential = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      if (!credential.user.email) {
        throw new Error(t.onboardingError);
      }
      await checkPatientSignupEligibility(credential.user);
      const parsedName = splitDisplayName(credential.user.displayName);
      setPatientFirstName(parsedName.firstName);
      setPatientLastName(parsedName.lastName);
      setGoogleEmail(credential.user.email);
      setStep("password");
      setNotice(null);
    } catch (error) {
      setNotice({ kind: "error", message: getAuthErrorMessage(error, t) });
    } finally {
      setBusy(false);
    }
  }

  async function handleGooglePasswordSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    try {
      validatePatientPassword(password, confirmPassword, t);

      const user = getFirebaseAuth().currentUser;
      if (!user || !googleEmail) {
        throw new Error(t.expiredError);
      }

      await linkWithCredential(user, EmailAuthProvider.credential(googleEmail, password));
      startMobileRegistration(patientFirstName || "Patient", patientLastName);
    } catch (error) {
      setNotice({ kind: "error", message: getAuthErrorMessage(error, t) });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveMobileNumber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) {
        throw new Error(t.expiredError);
      }

      const formattedMobileNumber = toPhilippineE164(phoneNumber, t);
      await checkPatientMobileAvailability(user, formattedMobileNumber);
      setPhoneNumber(formattedMobileNumber);
      setStep("profile");
      setNotice(null);
    } catch (error) {
      setNotice({ kind: "error", message: getAuthErrorMessage(error, t) });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    const form = new FormData(event.currentTarget);
    const privacyPolicyAccepted = form.get("privacyPolicyAccepted") === "on";
    const healthDataProcessingAccepted = form.get("healthDataProcessingAccepted") === "on";

    try {
      if (!privacyPolicyAccepted || !healthDataProcessingAccepted) {
        throw new Error(t.profileRequired);
      }

      const user = getFirebaseAuth().currentUser;
      if (!user) {
        throw new Error(t.expiredError);
      }

      await saveMyPatientProfile(user, {
        firstName: String(form.get("firstName") ?? "").trim(),
        lastName: String(form.get("lastName") ?? "").trim(),
        suffix: String(form.get("suffix") ?? "").trim() || undefined,
        mobileNumber: phoneNumber,
        birthdate: String(form.get("birthdate") ?? ""),
        sex: String(form.get("sex") ?? "") as "female" | "male" | "prefer_not_to_say",
        weightKg: Number(form.get("weightKg")),
        heightCm: Number(form.get("heightCm")),
        emergencyContactName: String(form.get("emergencyContactName") ?? "").trim(),
        emergencyContactNumber: String(form.get("emergencyContactNumber") ?? "").trim(),
        allergies: splitList(form.get("allergies")),
        existingConditions: splitList(form.get("existingConditions")),
        currentMedications: splitList(form.get("currentMedications")),
        basicMedicalHistory: String(form.get("basicMedicalHistory") ?? "").trim(),
        regionCode: String(form.get("regionCode") ?? "").trim(),
        regionName: String(form.get("regionName") ?? "").trim(),
        provinceCode: String(form.get("provinceCode") ?? "").trim() || undefined,
        provinceName: String(form.get("provinceName") ?? "").trim() || undefined,
        cityMunicipalityCode: String(form.get("cityMunicipalityCode") ?? "").trim(),
        cityMunicipalityName: String(form.get("cityMunicipalityName") ?? "").trim(),
        barangayCode: String(form.get("barangayCode") ?? "").trim(),
        barangayName: String(form.get("barangayName") ?? "").trim(),
        privacyPolicyAccepted,
        healthDataProcessingAccepted,
        aiAssistanceAccepted: form.get("aiAssistanceAccepted") === "on",
      });
      setStep("verified");
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : t.onboardingError });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="clinic-grid min-h-screen px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-5xl">
          <header className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3" aria-label="Click Klinik home">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <HeartPulse className="size-6" />
              </span>
              <span className="text-lg font-bold tracking-tight">Click Klinik</span>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <Link href="/auth" className="hidden items-center gap-2 text-sm font-semibold text-primary sm:inline-flex">
                <ArrowLeft className="size-4" />
                {t.login}
              </Link>
            </div>
          </header>

          <div className="mt-6 grid overflow-hidden rounded-[2rem] border border-primary/10 bg-card shadow-[0_28px_84px_-44px_rgba(8,43,69,0.45)] md:grid-cols-[0.75fr_1fr]">
            <OnboardingGuide step={step} copy={t} />
            <section className="order-first px-5 py-7 sm:px-10 md:order-last md:px-11 md:py-10">
              <div className="mx-auto max-w-md">
                <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
                  {t.eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight">
                  {t.title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t.description}
                </p>
                <SignUpProgress step={step} copy={t} />
                {!firebaseConfigured && <FirebaseSetupNotice />}
                {notice && <AuthNotice notice={notice} />}

                {step === "account" && (
                  <AccountForm busy={busy} disabled={!firebaseConfigured} onEmailSignUp={handleEmailSignUp} onGoogleSignUp={handleGoogleSignUp} copy={t} />
                )}
                {step === "password" && (
                  <GooglePasswordSetup
                    busy={busy}
                    email={googleEmail}
                    onSubmit={handleGooglePasswordSetup}
                    copy={t}
                  />
                )}
                {step === "mobile" && (
                  <MobileRegistration
                    busy={busy}
                    phoneNumber={phoneNumber}
                    setPhoneNumber={setPhoneNumber}
                    onSubmit={handleSaveMobileNumber}
                    copy={t}
                  />
                )}
                {step === "profile" && (
                  <HealthProfileForm
                    busy={busy}
                    patientFirstName={patientFirstName}
                    patientLastName={patientLastName}
                    copy={t}
                    onSubmit={handleSaveProfile}
                  />
                )}
                {step === "verified" && <VerifiedPatient name={patientFirstName} copy={t} />}

                {step === "account" && (
                  <p className="mt-7 border-t border-border pt-5 text-center text-sm text-muted-foreground">
                    {t.existingAccount}{" "}
                    <Link href="/auth" className="font-bold text-primary hover:underline">
                      {t.login}
                    </Link>
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function OnboardingGuide({ step, copy }: { step: SignUpStep; copy: PatientSignupCopy }) {
  return (
    <aside className="relative hidden overflow-hidden bg-primary p-9 text-primary-foreground md:block">
      <div className="absolute -top-14 -left-20 size-48 rounded-full bg-secondary/16" />
      <div className="relative">
        <p className="text-xs font-bold tracking-[0.18em] text-secondary uppercase">
          {copy.sideEyebrow}
        </p>
        <h2 className="mt-5 text-3xl leading-tight font-bold">
          {copy.sideTitle}
        </h2>
        <p className="mt-4 text-sm leading-7 text-primary-foreground/68">
          {copy.sideDescription}
        </p>
        <div className="mt-10 space-y-3">
          <GuideItem done={step === "mobile" || step === "profile" || step === "verified"} icon={<UserRoundPlus />} title={copy.guideItems[0]} />
          <GuideItem done={step === "profile" || step === "verified"} icon={<Phone />} title={copy.guideItems[1]} />
          <GuideItem done={step === "verified"} icon={<ShieldCheck />} title={copy.guideItems[2]} />
        </div>
        <p className="mt-12 text-xs leading-6 text-primary-foreground/55">
          {copy.safety}
        </p>
      </div>
    </aside>
  );
}

function GuideItem({ done, icon, title }: { done: boolean; icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-primary-foreground/[0.07] p-4">
      <span className={`flex size-9 items-center justify-center rounded-lg ${done ? "bg-secondary text-primary" : "bg-primary-foreground/10 text-secondary"}`}>
        {done ? <CheckCircle2 className="size-5" /> : icon}
      </span>
      <span className="text-sm font-semibold">{title}</span>
    </div>
  );
}

function AccountForm({
  busy,
  disabled,
  onEmailSignUp,
  onGoogleSignUp,
  copy,
}: {
  busy: boolean;
  disabled: boolean;
  onEmailSignUp: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onGoogleSignUp: () => Promise<void>;
  copy: PatientSignupCopy;
}) {
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <div className="mt-7">
      <Button type="button" variant="outline" disabled={busy || disabled} onClick={onGoogleSignUp} className="h-12 w-full rounded-xl border-primary/15 bg-background">
        <span className="flex size-7 items-center justify-center rounded-full bg-card text-base font-bold text-[#4285F4] shadow-sm">G</span>
        {copy.google}
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs font-medium text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {copy.emailDivider}
        <span className="h-px flex-1 bg-border" />
      </div>
      <form className="grid gap-4" onSubmit={onEmailSignUp}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field required label={copy.firstName}>
            <Input required name="firstName" placeholder="Juan" className="h-12 rounded-xl bg-background" />
          </Field>
          <Field required label={copy.lastName}>
            <Input required name="lastName" placeholder="Dela Cruz" className="h-12 rounded-xl bg-background" />
          </Field>
        </div>
        <Field required label={copy.email}>
          <Input required name="email" type="email" placeholder="you@email.com" className="h-12 rounded-xl bg-background" />
        </Field>
        <Field required label={copy.password}>
          <PasswordInput name="password" visible={visible} onToggle={() => setVisible((value) => !value)} copy={copy} />
        </Field>
        <Field required label={copy.confirmPassword}>
          <PasswordInput name="confirmPassword" visible={confirmVisible} onToggle={() => setConfirmVisible((value) => !value)} copy={copy} />
        </Field>
        <PasswordPolicy copy={copy} />
        <Button disabled={busy || disabled} className="mt-1 h-12 w-full rounded-xl">
          {busy ? copy.creating : copy.continueMobile}
          {!busy && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </div>
  );
}

function GooglePasswordSetup({
  busy,
  email,
  onSubmit,
  copy,
}: {
  busy: boolean;
  email: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  copy: PatientSignupCopy;
}) {
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <form className="mt-7 grid gap-4" onSubmit={onSubmit}>
      <div className="rounded-xl bg-primary/5 p-4">
        <h2 className="text-sm font-bold">{copy.googlePasswordTitle}</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy.googlePasswordDescription}</p>
        <p className="mt-3 text-xs font-semibold text-primary">{email}</p>
      </div>
      <Field required label={copy.password}>
        <PasswordInput name="password" visible={visible} onToggle={() => setVisible((value) => !value)} copy={copy} />
      </Field>
      <Field required label={copy.confirmPassword}>
        <PasswordInput name="confirmPassword" visible={confirmVisible} onToggle={() => setConfirmVisible((value) => !value)} copy={copy} />
      </Field>
      <PasswordPolicy copy={copy} />
      <Button disabled={busy} className="mt-1 h-12 w-full rounded-xl">
        {busy ? copy.creating : copy.secureGoogleAccount}
        {!busy && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}

function MobileRegistration({
  busy,
  phoneNumber,
  setPhoneNumber,
  onSubmit,
  copy,
}: {
  busy: boolean;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  copy: PatientSignupCopy;
}) {
  return (
    <div className="mt-7">
      <div className="flex items-start gap-3 rounded-xl bg-secondary/24 p-4">
        <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-xs leading-5 text-muted-foreground">
          {copy.mobileDemo}
        </p>
      </div>
      <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
        <Field required label={copy.mobileLabel}>
          <div className="flex overflow-hidden rounded-xl border border-input bg-background focus-within:ring-3 focus-within:ring-ring/45">
            <span className="flex items-center border-r border-border px-4 text-sm font-bold text-primary">+63</span>
            <input required value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder={copy.mobilePlaceholder} className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground" />
          </div>
        </Field>
        <Button disabled={busy} className="h-12 w-full rounded-xl">
          {busy ? copy.requesting : copy.sendCode}
        </Button>
      </form>
    </div>
  );
}

function VerifiedPatient({ name, copy }: { name: string; copy: PatientSignupCopy }) {
  return (
    <div className="mt-7 rounded-2xl bg-primary px-6 py-9 text-center text-primary-foreground">
      <CheckCircle2 className="mx-auto size-12 text-secondary" />
      <p className="mt-4 text-xs font-bold tracking-[0.18em] text-secondary uppercase">{copy.accountReady}</p>
      <h2 className="mt-3 text-2xl font-bold">{copy.greeting}, {name}.</h2>
      <p className="mt-3 text-sm leading-6 text-primary-foreground/70">
        {copy.readyDescription}
      </p>
      <Button asChild className="mt-7 h-12 rounded-xl bg-secondary px-7 text-secondary-foreground hover:bg-secondary/90">
        <Link href="/patient/portal">{copy.continueLogin}</Link>
      </Button>
    </div>
  );
}

function SignUpProgress({ step, copy }: { step: SignUpStep; copy: PatientSignupCopy }) {
  const currentStep = step === "account" || step === "password" ? 1 : step === "mobile" ? 2 : 3;

  return (
    <div className="relative mt-7 grid grid-cols-3 gap-2" aria-label={`Step ${currentStep} of 3`}>
      <span className="absolute top-3 right-[17%] left-[17%] h-px bg-border" aria-hidden="true" />
      {copy.steps.map((label, index) => (
        <div key={label} className="relative flex flex-col items-center gap-2 text-center">
          <span className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${index + 1 <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {index + 1}
          </span>
          <span className={`text-[11px] font-semibold sm:text-xs ${index + 1 <= currentStep ? "text-primary" : "text-muted-foreground"}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function HealthProfileForm({
  busy,
  patientFirstName,
  patientLastName,
  copy,
  onSubmit,
}: {
  busy: boolean;
  patientFirstName: string;
  patientLastName: string;
  copy: PatientSignupCopy;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <form className="mt-7 grid gap-4" onSubmit={onSubmit}>
      <div className="rounded-xl bg-primary/5 p-4">
        <h2 className="text-sm font-bold">{copy.profileTitle}</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy.profileDescription}</p>
      </div>
      <ProfileSection
        title="Personal information"
        description="Use your real identity and contact details so doctors can prepare your teleconsultation safely."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field required label={copy.firstName}>
            <Input required name="firstName" defaultValue={patientFirstName} className="h-12 rounded-xl bg-background" />
          </Field>
          <Field required label={copy.lastName}>
            <Input required name="lastName" defaultValue={patientLastName} className="h-12 rounded-xl bg-background" />
          </Field>
        </div>
        <Field label="Suffix">
          <Input name="suffix" placeholder="Jr., Sr., III" className="h-12 rounded-xl bg-background" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field required label={copy.birthday}>
            <Input required name="birthdate" type="date" className="h-12 rounded-xl bg-background" />
          </Field>
          <Field required label={copy.sex}>
            <select required name="sex" className="h-12 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">{copy.sex}</option>
              <option value="female">{copy.female}</option>
              <option value="male">{copy.male}</option>
              <option value="prefer_not_to_say">{copy.preferNotToSay}</option>
            </select>
          </Field>
        </div>
      </ProfileSection>

      <ProfileSection
        title="Health information"
        description="Only collect details needed to prepare safe teleconsultations."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field required label={copy.weight}>
            <Input required name="weightKg" type="number" min="1" max="400" step="0.1" className="h-12 rounded-xl bg-background" />
          </Field>
          <Field required label={copy.height}>
            <Input required name="heightCm" type="number" min="30" max="260" step="0.1" className="h-12 rounded-xl bg-background" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.emergencyName}>
            <Input name="emergencyContactName" className="h-12 rounded-xl bg-background" />
          </Field>
          <Field label={copy.emergencyNumber}>
            <Input name="emergencyContactNumber" type="tel" className="h-12 rounded-xl bg-background" />
          </Field>
        </div>
        <Field label={copy.allergies}>
          <Input name="allergies" placeholder={copy.listHint} className="h-12 rounded-xl bg-background" />
        </Field>
        <Field label={copy.conditions}>
          <Input name="existingConditions" placeholder={copy.listHint} className="h-12 rounded-xl bg-background" />
        </Field>
        <Field label={copy.medications}>
          <Input name="currentMedications" placeholder={copy.listHint} className="h-12 rounded-xl bg-background" />
        </Field>
        <Field label={copy.medicalHistory}>
          <textarea name="basicMedicalHistory" className="min-h-24 rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
        </Field>
      </ProfileSection>

      <ProfileSection
        title="Location details"
        description="Select your region, city or municipality, and barangay using PSGC data."
      >
      <PhAddressFields />
      </ProfileSection>
      <div className="space-y-3 rounded-xl border border-primary/10 bg-[#f6f0e4] p-4 text-xs leading-5 text-muted-foreground">
        <ConsentInput name="privacyPolicyAccepted" required label={copy.privacyConsent} />
        <ConsentInput name="healthDataProcessingAccepted" required label={copy.healthConsent} />
        <ConsentInput name="aiAssistanceAccepted" label={copy.aiConsent} />
        <Link href="/privacy" target="_blank" className="inline-block font-bold text-primary hover:underline">
          {copy.privacyLink}
        </Link>
      </div>
      <Button disabled={busy} className="h-12 w-full rounded-xl">
        {busy ? copy.savingProfile : copy.saveProfile}
      </Button>
    </form>
  );
}

function ProfileSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded-2xl border border-primary/10 bg-card/70 p-4 sm:p-5">
      <div className="border-b border-border pb-3">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ConsentInput({
  name,
  required = false,
  label,
}: {
  name: string;
  required?: boolean;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3">
      <input required={required} name={name} type="checkbox" className="mt-1 accent-primary" />
      <span>
        {label}
        {required && <RequiredMark />}
      </span>
    </label>
  );
}

function PasswordPolicy({ copy }: { copy: PatientSignupCopy }) {
  return (
    <p className="-mt-1 rounded-xl bg-secondary/20 px-4 py-3 text-xs leading-5 text-muted-foreground">
      {copy.passwordPolicy}
    </p>
  );
}

function PasswordInput({
  name,
  visible,
  onToggle,
  copy,
}: {
  name: "password" | "confirmPassword";
  visible: boolean;
  onToggle: () => void;
  copy: PatientSignupCopy;
}) {
  return (
    <div className="relative min-w-0">
      <LockKeyhole className="absolute top-4 left-3.5 size-4 text-muted-foreground" />
      <Input required name={name} type={visible ? "text" : "password"} minLength={12} placeholder={copy.passwordPlaceholder} className="h-12 rounded-xl bg-background pr-12 pl-10" />
      <button type="button" onClick={onToggle} aria-label={visible ? copy.hidePassword : copy.showPassword} className="absolute top-0 right-0 flex h-12 w-12 items-center justify-center text-muted-foreground hover:text-primary">
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm font-semibold">
        {label}
        {required && <RequiredMark />}
      </span>
      {children}
    </label>
  );
}

function RequiredMark() {
  return <span className="ml-1 text-destructive" aria-hidden="true">*</span>;
}

function AuthNotice({ notice }: { notice: Exclude<Notice, null> }) {
  return (
    <div role="alert" className={`mt-6 rounded-xl border px-4 py-3 text-sm ${notice.kind === "error" ? "border-destructive/20 bg-destructive/6 text-destructive" : "border-[#12734b]/20 bg-[#e6f7ee] text-[#12734b]"}`}>
      {notice.message}
    </div>
  );
}

function FirebaseSetupNotice() {
  return (
    <div role="alert" className="mt-6 rounded-xl border border-secondary bg-secondary/16 px-4 py-3 text-xs leading-6 text-foreground">
      <p className="font-bold">Authentication setup required</p>
      <p className="mt-1 text-muted-foreground">
        Add your Firebase Web App values in <code className="font-mono">apps/web/.env.local</code>, then restart the web server.
      </p>
    </div>
  );
}

function toPhilippineE164(phoneNumber: string, copy?: PatientSignupCopy): string {
  const digits = phoneNumber.replace(/\D/g, "").replace(/^0/, "");
  if (!/^9\d{9}$/.test(digits)) {
    throw new Error(copy?.invalidPhone ?? "Enter a valid Philippine mobile number, for example 917 123 4567.");
  }
  return `+63${digits}`;
}

function splitList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitDisplayName(displayName: string | null): {
  firstName: string;
  lastName: string;
} {
  const parts = (displayName ?? "").trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts.shift() ?? "Patient",
    lastName: parts.join(" "),
  };
}

function getAuthErrorMessage(error: unknown, copy: PatientSignupCopy): string {
  if (error instanceof FirebaseError) {
    const knownErrors: Record<string, string> = {
      "auth/email-already-in-use": copy.emailUsed,
      "auth/credential-already-in-use": copy.emailUsed,
      "auth/provider-already-linked": copy.emailUsed,
      "auth/weak-password": copy.passwordWeak,
      "auth/popup-closed-by-user": copy.popupClosed,
      "auth/too-many-requests": copy.tooManyRequests,
    };
    return knownErrors[error.code] ?? copy.onboardingError;
  }
  return error instanceof Error ? error.message : copy.onboardingError;
}

function validatePatientPassword(
  password: string,
  confirmPassword: string,
  copy: PatientSignupCopy,
): void {
  if (password !== confirmPassword) {
    throw new Error(copy.passwordMismatch);
  }

  const meetsPolicy =
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  if (!meetsPolicy) {
    throw new Error(copy.passwordWeak);
  }
}
