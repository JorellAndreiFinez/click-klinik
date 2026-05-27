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
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  LockKeyhole,
  Phone,
  Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhAddressFields } from "@/components/forms/ph-address-fields";
import { doctorSpecializations } from "@/features/doctors/specializations";
import { checkDoctorMobileAvailability, checkDoctorSignupEligibility, submitDoctorApplication } from "@/lib/doctor-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type Notice = { kind: "error" | "success"; message: string } | null;
type DoctorSignUpStep = "account" | "password" | "mobile" | "profile" | "submitted";

const passwordPolicy =
  "At least 12 characters with uppercase, lowercase, a number, and a special character.";

export default function DoctorApplicationPage() {
  const firebaseConfigured = isFirebaseConfigured();
  const [step, setStep] = useState<DoctorSignUpStep>("account");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [suffix, setSuffix] = useState("MD");
  const [specialization, setSpecialization] = useState("");
  const [publicProfile, setPublicProfile] = useState(false);

  async function handleEmailSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const form = new FormData(event.currentTarget);
    const submittedFirstName = String(form.get("firstName") ?? "").trim();
    const submittedLastName = String(form.get("lastName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    try {
      validatePassword(password, confirmPassword);
      const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      await checkDoctorSignupEligibility(credential.user);
      await updateProfile(credential.user, {
        displayName: `${submittedFirstName} ${submittedLastName}`.trim(),
      });
      setFirstName(submittedFirstName);
      setLastName(submittedLastName);
      setAccountEmail(email);
      setStep("mobile");
      setNotice({ kind: "success", message: "Your professional account has been created. Add a contact number to continue." });
    } catch (error) {
      setNotice({ kind: "error", message: getAuthErrorMessage(error) });
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
        throw new Error("Your Google account does not include an email address.");
      }
      await checkDoctorSignupEligibility(credential.user);
      const name = splitDisplayName(credential.user.displayName);
      setFirstName(name.firstName);
      setLastName(name.lastName);
      setAccountEmail(credential.user.email);
      setStep("password");
    } catch (error) {
      setNotice({ kind: "error", message: getAuthErrorMessage(error) });
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
      validatePassword(password, confirmPassword);
      const user = getFirebaseAuth().currentUser;
      if (!user || !accountEmail) {
        throw new Error("Your sign-up session expired. Please begin again.");
      }
      await linkWithCredential(user, EmailAuthProvider.credential(accountEmail, password));
      setStep("mobile");
      setNotice({ kind: "success", message: "Your account is secured. Add a contact number to continue." });
    } catch (error) {
      setNotice({ kind: "error", message: getAuthErrorMessage(error) });
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
        throw new Error("Your sign-up session expired. Please begin again.");
      }
      const formattedNumber = toPhilippineE164(mobileNumber);
      await checkDoctorMobileAvailability(user, formattedNumber);
      setMobileNumber(formattedNumber);
      setStep("profile");
    } catch (error) {
      setNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to check your contact number.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const form = new FormData(event.currentTarget);

    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) {
        throw new Error("Your sign-up session expired. Please begin again.");
      }

      await submitDoctorApplication(user, {
        firstName: String(form.get("firstName") ?? "").trim(),
        lastName: String(form.get("lastName") ?? "").trim(),
        suffix,
        otherSuffix: String(form.get("otherSuffix") ?? "").trim() || undefined,
        mobileNumber,
        prcLicenseNumber: String(form.get("prcLicenseNumber") ?? "").trim(),
        specializationCode: specialization,
        otherSpecialization: String(form.get("otherSpecialization") ?? "").trim() || undefined,
        clinicOrHospital: String(form.get("clinicOrHospital") ?? "").trim() || undefined,
        location: String(form.get("location") ?? "").trim() || undefined,
        regionCode: String(form.get("regionCode") ?? "").trim(),
        regionName: String(form.get("regionName") ?? "").trim(),
        provinceCode: String(form.get("provinceCode") ?? "").trim() || undefined,
        provinceName: String(form.get("provinceName") ?? "").trim() || undefined,
        cityMunicipalityCode: String(form.get("cityMunicipalityCode") ?? "").trim(),
        cityMunicipalityName: String(form.get("cityMunicipalityName") ?? "").trim(),
        barangayCode: String(form.get("barangayCode") ?? "").trim(),
        barangayName: String(form.get("barangayName") ?? "").trim(),
        yearsOfExperience: Number(form.get("yearsOfExperience")),
        bio: String(form.get("bio") ?? "").trim(),
        displayOnPublicWebsite: publicProfile,
        credentialReviewConsent: form.get("credentialReviewConsent") === "on",
      });
      setStep("submitted");
      setNotice(null);
    } catch (error) {
      setNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to submit your application.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="clinic-grid min-h-screen px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-6xl">
          <header className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3" aria-label="Click Klinik home">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Stethoscope className="size-6" />
              </span>
              <span className="text-lg font-bold tracking-tight">Click Klinik</span>
            </Link>
            <Link href="/auth" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <ArrowLeft className="size-4" />
              Doctor login
            </Link>
          </header>

          <div className="mt-6 grid overflow-hidden rounded-[2rem] border border-primary/10 bg-card shadow-[0_28px_84px_-44px_rgba(8,43,69,0.45)] lg:grid-cols-[0.82fr_1.18fr]">
            <DoctorGuide step={step} />
            <section className="order-first px-5 py-7 sm:px-10 lg:order-last lg:px-11 lg:py-10">
              <div className="mx-auto max-w-xl">
                <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Professional onboarding</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight">Apply as a telehealth doctor.</h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Create a protected account first, then submit credentials for review before doctor access is activated.
                </p>
                <DoctorProgress step={step} />
                {!firebaseConfigured && <FirebaseSetupNotice />}
                {notice && <AuthNotice notice={notice} />}
                {step === "account" && (
                  <AccountForm
                    busy={busy}
                    disabled={!firebaseConfigured}
                    onEmailSignUp={handleEmailSignUp}
                    onGoogleSignUp={handleGoogleSignUp}
                  />
                )}
                {step === "password" && (
                  <GooglePasswordSetup
                    busy={busy}
                    email={accountEmail}
                    onSubmit={handleGooglePasswordSetup}
                  />
                )}
                {step === "mobile" && (
                  <MobileRegistration
                    busy={busy}
                    mobileNumber={mobileNumber}
                    setMobileNumber={setMobileNumber}
                    onSubmit={handleSaveMobileNumber}
                  />
                )}
                {step === "profile" && (
                  <ProfessionalProfileForm
                    busy={busy}
                    firstName={firstName}
                    lastName={lastName}
                    accountEmail={accountEmail}
                    mobileNumber={mobileNumber}
                    suffix={suffix}
                    setSuffix={setSuffix}
                    specialization={specialization}
                    setSpecialization={setSpecialization}
                    publicProfile={publicProfile}
                    setPublicProfile={setPublicProfile}
                    onSubmit={handleSubmitProfile}
                  />
                )}
                {step === "submitted" && <SubmittedApplication firstName={firstName} />}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function DoctorGuide({ step }: { step: DoctorSignUpStep }) {
  return (
    <aside className="relative hidden overflow-hidden bg-primary p-9 text-primary-foreground lg:block">
      <div className="absolute -top-14 -left-20 size-48 rounded-full bg-secondary/16" />
      <div className="relative">
        <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-secondary uppercase">
          <BadgeCheck className="size-4" />
          Licensed professionals
        </p>
        <h2 className="mt-5 text-3xl leading-tight font-bold">Serbisyong medikal, mas malapit sa pamilya.</h2>
        <p className="mt-4 text-sm leading-7 text-primary-foreground/68">
          Your professional identity is reviewed before patients can discover or book your services.
        </p>
        <div className="mt-10 space-y-3">
          <GuideItem done={step !== "account" && step !== "password"} icon={<Stethoscope />} title="Secure professional account" />
          <GuideItem done={step === "profile" || step === "submitted"} icon={<Phone />} title="Registered contact number" />
          <GuideItem done={step === "submitted"} icon={<FileCheck2 />} title="Credentials submitted for review" />
          <GuideItem done={false} icon={<CalendarDays />} title="Scheduling after approval" />
        </div>
        <p className="mt-10 text-xs leading-6 text-primary-foreground/55">
          Click Klinik handles professional details only for access review and telehealth operations under its privacy notice.
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

function DoctorProgress({ step }: { step: DoctorSignUpStep }) {
  const labels = ["Account", "Contact", "Credentials"];
  const currentStep = step === "account" || step === "password" ? 1 : step === "mobile" ? 2 : 3;

  return (
    <div className="relative mt-7 grid grid-cols-3 gap-2" aria-label={`Step ${currentStep} of 3`}>
      <span className="absolute top-3 right-[17%] left-[17%] h-px bg-border" aria-hidden="true" />
      {labels.map((label, index) => (
        <div key={label} className="relative flex flex-col items-center gap-2 text-center">
          <span className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${index + 1 <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {index + 1}
          </span>
          <span className={`text-xs font-semibold ${index + 1 <= currentStep ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function AccountForm({
  busy,
  disabled,
  onEmailSignUp,
  onGoogleSignUp,
}: {
  busy: boolean;
  disabled: boolean;
  onEmailSignUp: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onGoogleSignUp: () => Promise<void>;
}) {
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <div className="mt-7">
      <Button type="button" variant="outline" disabled={busy || disabled} onClick={onGoogleSignUp} className="h-12 w-full rounded-xl border-primary/15 bg-background">
        <span className="flex size-7 items-center justify-center rounded-full bg-card text-base font-bold text-[#4285F4] shadow-sm">G</span>
        Sign up with Google
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs font-medium text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or use email
        <span className="h-px flex-1 bg-border" />
      </div>
      <form className="grid gap-4" onSubmit={onEmailSignUp}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field required label="First name">
            <Input required name="firstName" placeholder="Maria" className="h-12 rounded-xl bg-background" />
          </Field>
          <Field required label="Last name">
            <Input required name="lastName" placeholder="Santos" className="h-12 rounded-xl bg-background" />
          </Field>
        </div>
        <Field required label="Professional email address">
          <Input required name="email" type="email" placeholder="doctor@email.com" className="h-12 rounded-xl bg-background" />
        </Field>
        <Field required label="Create password">
          <PasswordInput name="password" visible={visible} onToggle={() => setVisible((value) => !value)} />
        </Field>
        <Field required label="Retype password">
          <PasswordInput name="confirmPassword" visible={confirmVisible} onToggle={() => setConfirmVisible((value) => !value)} />
        </Field>
        <PasswordPolicy />
        <Button disabled={busy || disabled} className="mt-1 h-12 w-full rounded-xl">
          {busy ? "Creating account..." : "Continue to contact number"}
          {!busy && <ArrowRight className="size-4" />}
        </Button>
      </form>
      <p className="mt-7 border-t border-border pt-5 text-center text-sm text-muted-foreground">
        Already an approved doctor?{" "}
        <Link href="/auth" className="font-bold text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}

function GooglePasswordSetup({
  busy,
  email,
  onSubmit,
}: {
  busy: boolean;
  email: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <form className="mt-7 grid gap-4" onSubmit={onSubmit}>
      <div className="rounded-xl bg-primary/5 p-4">
        <h2 className="text-sm font-bold">Secure your professional account</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Google sign-up succeeded. Create a backup password before continuing your application.</p>
        <p className="mt-3 text-xs font-semibold text-primary">{email}</p>
      </div>
      <Field required label="Create password">
        <PasswordInput name="password" visible={visible} onToggle={() => setVisible((value) => !value)} />
      </Field>
      <Field required label="Retype password">
        <PasswordInput name="confirmPassword" visible={confirmVisible} onToggle={() => setConfirmVisible((value) => !value)} />
      </Field>
      <PasswordPolicy />
      <Button disabled={busy} className="mt-1 h-12 w-full rounded-xl">
        {busy ? "Saving password..." : "Continue to contact number"}
        {!busy && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}

function MobileRegistration({
  busy,
  mobileNumber,
  setMobileNumber,
  onSubmit,
}: {
  busy: boolean;
  mobileNumber: string;
  setMobileNumber: (mobileNumber: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <div className="mt-7">
      <div className="flex items-start gap-3 rounded-xl bg-secondary/24 p-4">
        <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-xs leading-5 text-muted-foreground">
          For the MVP, we check that this Philippine mobile number is not already used in another doctor application. No SMS OTP is sent.
        </p>
      </div>
      <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
        <Field required label="Professional mobile number">
          <div className="flex overflow-hidden rounded-xl border border-input bg-background focus-within:ring-3 focus-within:ring-ring/45">
            <span className="flex items-center border-r border-border px-4 text-sm font-bold text-primary">+63</span>
            <input required value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value)} placeholder="917 123 4567" className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground" />
          </div>
        </Field>
        <Button disabled={busy} className="h-12 w-full rounded-xl">
          {busy ? "Checking number..." : "Continue to credentials"}
          {!busy && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </div>
  );
}

function ProfessionalProfileForm({
  busy,
  firstName,
  lastName,
  accountEmail,
  mobileNumber,
  suffix,
  setSuffix,
  specialization,
  setSpecialization,
  publicProfile,
  setPublicProfile,
  onSubmit,
}: {
  busy: boolean;
  firstName: string;
  lastName: string;
  accountEmail: string;
  mobileNumber: string;
  suffix: string;
  setSuffix: (suffix: string) => void;
  specialization: string;
  setSpecialization: (specialization: string) => void;
  publicProfile: boolean;
  setPublicProfile: (publicProfile: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
      <div className="rounded-xl bg-primary/5 p-4 sm:col-span-2">
        <h2 className="text-sm font-bold">Credential review profile</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Account email: {accountEmail} | Contact: {mobileNumber}</p>
      </div>
      <ApplicationField required name="firstName" label="First name" defaultValue={firstName} />
      <ApplicationField required name="lastName" label="Last name" defaultValue={lastName} />
      <SelectField required label="Professional suffix" value={suffix} onChange={setSuffix}>
        <option value="MD">MD</option>
        <option value="DO">DO</option>
        <option value="RPsy">RPsy</option>
        <option value="RPT">RPT</option>
        <option value="Other">Other</option>
      </SelectField>
      {suffix === "Other" && <ApplicationField required name="otherSuffix" label="Other suffix" placeholder="Professional credential" />}
      <ApplicationField required name="prcLicenseNumber" label="PRC license number" placeholder="License number" />
      <ApplicationField required name="yearsOfExperience" label="Years of practice" placeholder="5" type="number" min="0" max="70" />
      <div className="min-w-0 sm:col-span-2">
        <SelectField required label="Specialization" value={specialization} onChange={setSpecialization}>
          <option value="">Select specialization</option>
          {doctorSpecializations.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
          <option value="OTHER">Other specialization</option>
        </SelectField>
      </div>
      {specialization === "OTHER" && (
        <div className="min-w-0 sm:col-span-2">
          <ApplicationField required name="otherSpecialization" label="Other specialization" placeholder="Enter specialization" />
        </div>
      )}
      <div className="min-w-0 sm:col-span-2">
        <ApplicationField name="clinicOrHospital" label="Clinic or hospital affiliation" placeholder="Optional" />
      </div>
      <div className="rounded-xl bg-primary/5 p-4 sm:col-span-2">
        <h2 className="text-sm font-bold">Practice location</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Choose your region, city or municipality, and barangay using PSGC location data.
        </p>
      </div>
      <div className="sm:col-span-2">
        <PhAddressFields />
      </div>
      <label className="grid gap-2 sm:col-span-2">
        <span className="text-sm font-semibold">Practice introduction<RequiredMark /></span>
        <textarea required name="bio" maxLength={600} className="min-h-28 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" placeholder="Share your teleconsult experience, patient groups, and care focus..." />
      </label>
      <label className="flex items-start justify-between gap-4 rounded-2xl border border-primary/10 bg-background p-4 sm:col-span-2">
        <span>
          <span className="block text-sm font-bold">Display my profile publicly after approval</span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">When enabled, this doctor can appear on public-facing pages only after credential approval.</span>
        </span>
        <input type="checkbox" checked={publicProfile} onChange={(event) => setPublicProfile(event.target.checked)} className="mt-1 size-5 accent-primary" />
      </label>
      <label className="flex items-start gap-3 rounded-2xl border border-border p-4 text-xs leading-5 text-muted-foreground sm:col-span-2">
        <input required name="credentialReviewConsent" type="checkbox" className="mt-1 accent-primary" />
        <span>
          I confirm these details are accurate and consent to credential review and secure processing for telehealth onboarding.
          <RequiredMark />
        </span>
      </label>
      <Button disabled={busy} className="mt-2 h-12 w-full rounded-xl sm:col-span-2">
        {busy ? "Submitting for review..." : "Submit professional application"}
      </Button>
    </form>
  );
}

function SubmittedApplication({ firstName }: { firstName: string }) {
  return (
    <div className="mt-7 rounded-2xl bg-primary px-6 py-9 text-center text-primary-foreground">
      <CheckCircle2 className="mx-auto size-12 text-secondary" />
      <p className="mt-4 text-xs font-bold tracking-[0.18em] text-secondary uppercase">Application received</p>
      <h2 className="mt-3 text-2xl font-bold">Salamat, Dr. {firstName}.</h2>
      <p className="mt-3 text-sm leading-6 text-primary-foreground/70">
        Your account is created and your credentials are pending admin review. Doctor scheduling and consultation access are enabled only after approval.
      </p>
      <Button asChild className="mt-7 h-12 rounded-xl bg-secondary px-7 text-secondary-foreground hover:bg-secondary/90">
        <Link href="/auth">Return to login</Link>
      </Button>
    </div>
  );
}

function ApplicationField({
  label,
  name,
  placeholder,
  defaultValue,
  type = "text",
  required = false,
  min,
  max,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <Field label={label} required={required}>
      <Input required={required} name={name} type={type} min={min} max={max} defaultValue={defaultValue} placeholder={placeholder} className="h-12 rounded-xl bg-background" />
    </Field>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <Field required={required} label={label}>
      <select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
        {children}
      </select>
    </Field>
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
      <span className="text-sm font-semibold">{label}{required && <RequiredMark />}</span>
      {children}
    </label>
  );
}

function PasswordInput({
  name,
  visible,
  onToggle,
}: {
  name: "password" | "confirmPassword";
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative min-w-0">
      <LockKeyhole className="absolute top-4 left-3.5 size-4 text-muted-foreground" />
      <Input required name={name} type={visible ? "text" : "password"} minLength={12} placeholder="Create password" className="h-12 rounded-xl bg-background pr-12 pl-10" />
      <button type="button" onClick={onToggle} aria-label={visible ? "Hide password" : "Show password"} className="absolute top-0 right-0 flex h-12 w-12 items-center justify-center text-muted-foreground hover:text-primary">
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function PasswordPolicy() {
  return <p className="-mt-1 rounded-xl bg-secondary/20 px-4 py-3 text-xs leading-5 text-muted-foreground">{passwordPolicy}</p>;
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
      <p className="mt-1 text-muted-foreground">Add Firebase Web App values in <code className="font-mono">apps/web/.env.local</code>, then restart the web server.</p>
    </div>
  );
}

function toPhilippineE164(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "").replace(/^0/, "");
  if (!/^9\d{9}$/.test(digits)) {
    throw new Error("Enter a valid Philippine mobile number, for example 917 123 4567.");
  }
  return `+63${digits}`;
}

function splitDisplayName(displayName: string | null): { firstName: string; lastName: string } {
  const parts = (displayName ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts.shift() ?? "Doctor", lastName: parts.join(" ") };
}

function validatePassword(password: string, confirmPassword: string): void {
  if (password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }
  if (!(password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password))) {
    throw new Error(passwordPolicy);
  }
}

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const knownErrors: Record<string, string> = {
      "auth/email-already-in-use": "This email is already registered. Please log in instead.",
      "auth/credential-already-in-use": "This email is already registered. Please log in instead.",
      "auth/provider-already-linked": "This login method is already attached to your account.",
      "auth/weak-password": passwordPolicy,
      "auth/popup-closed-by-user": "Google sign-up was closed before completion.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
    };
    return knownErrors[error.code] ?? "Unable to create your professional account.";
  }
  return error instanceof Error ? error.message : "Unable to complete professional onboarding.";
}
