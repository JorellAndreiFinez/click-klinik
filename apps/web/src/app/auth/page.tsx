"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSelector } from "@/features/localization/language-selector";
import { useLocale } from "@/features/localization/locale-provider";
import { patientAuthTranslations, type PatientLoginCopy } from "@/features/localization/patient-auth-translations";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { getMyPatientProfile } from "@/lib/patient-api";

type Notice = { kind: "error" | "success"; message: string } | null;
type LoginRole = "patient" | "doctor";

export default function PatientLoginPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = patientAuthTranslations[locale].login;
  const firebaseConfigured = isFirebaseConfigured();
  const [notice, setNotice] = useState<Notice>(null);
  const [signedInName, setSignedInName] = useState("");
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<LoginRole>("patient");

  function chooseRole(nextRole: LoginRole) {
    setRole(nextRole);
    setNotice(null);
    setSignedInName("");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (role === "patient") {
        await getMyPatientProfile(credential.user);
        router.push("/patient/portal");
        return;
      }
      setSignedInName(credential.user.displayName ?? "Patient");
      setNotice({ kind: "success", message: t.doctorSuccess });
    } catch (error) {
      setNotice({ kind: "error", message: getAuthErrorMessage(error, t) });
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setBusy(true);
    setNotice(null);

    try {
      const credential = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      if (role === "patient") {
        await getMyPatientProfile(credential.user);
        router.push("/patient/portal");
        return;
      }
      setSignedInName(credential.user.displayName ?? "Doctor");
      setNotice({ kind: "success", message: t.doctorSuccess });
    } catch (error) {
      setNotice({ kind: "error", message: getAuthErrorMessage(error, t) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="clinic-grid min-h-screen px-4 py-4 sm:px-6 sm:py-6 xl:flex xl:items-center xl:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <AuthHeader copy={t} />
          <div className="mt-5 xl:grid xl:overflow-hidden xl:rounded-[2.25rem] xl:border xl:border-primary/10 xl:bg-card xl:shadow-[0_28px_84px_-44px_rgba(8,43,69,0.5)] xl:grid-cols-[0.9fr_1.1fr]">
            <CareWelcome copy={t} />

            <section className="mx-auto w-full max-w-[500px] rounded-[1.6rem] border border-primary/10 bg-card px-5 py-7 shadow-[0_22px_64px_-42px_rgba(8,43,69,0.42)] sm:px-10 sm:py-10 xl:max-w-none xl:rounded-none xl:border-0 xl:px-14 xl:py-14 xl:shadow-none">
              <div className="mx-auto w-full max-w-[410px]">
                <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
                  {t.eyebrow}
                </p>
                <h1 className="mt-3 text-[1.85rem] leading-tight font-bold tracking-tight sm:text-4xl">
                  {t.title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t.description}
                </p>
                <div className="mt-6 flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground xl:hidden">
                  <HeartPulse className="size-5 shrink-0 text-secondary" />
                  <span>{t.mobileBanner}</span>
                </div>

                {notice && <AuthNotice notice={notice} />}
                {!firebaseConfigured && <FirebaseSetupNotice />}

                <RoleSelector role={role} onChange={chooseRole} copy={t} />

                <LoginForm busy={busy} disabled={!firebaseConfigured} onSubmit={handleLogin} onGoogleLogin={handleGoogleLogin} signedInName={signedInName} copy={t} role={role} />

                {!signedInName && (
                  <div className="mt-8 rounded-2xl border border-primary/10 bg-[#f6f0e4] p-5 text-center">
                    <p className="text-sm font-semibold">
                      {role === "patient" ? t.noAccount : t.doctorQuestion}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {role === "patient" ? t.createPrompt : t.doctorPrompt}
                    </p>
                    <Button asChild variant="outline" className="mt-4 h-11 w-full rounded-xl border-primary/15 bg-card">
                      <Link href={role === "patient" ? "/auth/signup" : "/professionals/apply"}>
                        {role === "patient" ? t.createAccount : t.professionalApplication}
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function AuthHeader({ copy }: { copy: PatientLoginCopy }) {
  return (
    <header className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3" aria-label="Click Klinik home">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:size-11 sm:rounded-2xl">
          <HeartPulse className="size-6" />
        </span>
        <span>
          <span className="block text-lg font-bold tracking-tight sm:text-xl">Click Klinik</span>
          <span className="hidden text-xs text-muted-foreground sm:block">
            {copy.brandTagline}
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <LanguageSelector />
        <Link
          href="/"
          className="hidden items-center gap-2 rounded-xl border border-primary/10 bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:inline-flex sm:px-4 sm:text-sm"
        >
          <ArrowLeft className="size-4" />
          {copy.back}
        </Link>
      </div>
    </header>
  );
}

function CareWelcome({ copy }: { copy: PatientLoginCopy }) {
  return (
    <aside className="landing-rise relative hidden overflow-hidden bg-primary p-9 text-primary-foreground xl:block xl:p-12">
      <div className="absolute -top-20 -left-20 size-60 rounded-full bg-secondary/16" />
      <div className="absolute right-10 bottom-20 size-36 rounded-full border border-primary-foreground/10" />
      <div className="relative flex h-full min-h-[590px] flex-col">
        <p className="flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-secondary uppercase">
          <HeartPulse className="size-4" />
          {copy.sideEyebrow}
        </p>
        <h2 className="mt-8 max-w-sm text-[2.7rem] leading-[1.08] font-bold tracking-[-0.055em]">
          {copy.sideTitle}
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-7 text-primary-foreground/68">
          {copy.sideDescription}
        </p>
        <div className="mt-12 rounded-[1.5rem] border border-primary-foreground/10 bg-primary-foreground/[0.06] p-5">
          <p className="text-xs font-bold tracking-[0.16em] text-secondary uppercase">
            {copy.sideJourney}
          </p>
          <div className="mt-5 space-y-4">
            <TrustItem icon={<Smartphone />} label={copy.trustItems[0]} />
            <TrustItem icon={<ShieldCheck />} label={copy.trustItems[1]} />
            <TrustItem icon={<HeartPulse />} label={copy.trustItems[2]} />
          </div>
        </div>
        <p className="mt-auto pt-12 text-xs leading-6 text-primary-foreground/55">
          {copy.safety}
        </p>
      </div>
    </aside>
  );
}

function RoleSelector({
  role,
  onChange,
  copy,
}: {
  role: LoginRole;
  onChange: (role: LoginRole) => void;
  copy: PatientLoginCopy;
}) {
  return (
    <fieldset className="mt-7">
      <legend className="mb-3 text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {copy.chooseRole}
      </legend>
      <div className="grid grid-cols-2 gap-3">
        <RoleCard
          selected={role === "patient"}
          onClick={() => onChange("patient")}
          icon={<UserRound />}
          title={copy.patientRole}
          description={copy.patientRoleDescription}
        />
        <RoleCard
          selected={role === "doctor"}
          onClick={() => onChange("doctor")}
          icon={<Stethoscope />}
          title={copy.doctorRole}
          description={copy.doctorRoleDescription}
        />
      </div>
      {role === "doctor" && (
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          {copy.roleSafety}
        </p>
      )}
    </fieldset>
  );
}

function RoleCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition-colors sm:p-4 ${
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/25"
      }`}
    >
      <span className={`flex size-9 items-center justify-center rounded-xl ${selected ? "bg-secondary text-primary" : "bg-primary/8 text-primary"} [&_svg]:size-5`}>
        {icon}
      </span>
      <span className="mt-3 block text-sm font-bold">{title}</span>
      <span className={`mt-1 hidden text-xs leading-5 sm:block ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        {description}
      </span>
    </button>
  );
}

function LoginForm({
  busy,
  disabled,
  onSubmit,
  onGoogleLogin,
  signedInName,
  copy,
  role,
}: {
  busy: boolean;
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  signedInName: string;
  copy: PatientLoginCopy;
  role: LoginRole;
}) {
  const [visible, setVisible] = useState(false);

  if (signedInName) {
    return (
      <div className="mt-8 rounded-2xl bg-primary/5 px-5 py-9 text-center">
        <CheckCircle2 className="mx-auto size-10 text-[#12734b]" />
        <p className="mt-4 text-lg font-bold">{copy.welcome}, {signedInName}.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {role === "patient" ? copy.sessionReady : copy.doctorSuccess}
        </p>
        <Button asChild className="mt-6 h-11 rounded-xl px-6">
          <Link href="/">{copy.returnHome}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Button type="button" variant="outline" disabled={busy || disabled} onClick={onGoogleLogin} className="h-12 w-full rounded-xl border-primary/15 bg-background">
        <span className="flex size-7 items-center justify-center rounded-full bg-card text-base font-bold text-[#4285F4] shadow-sm">G</span>
        {copy.google}
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs font-medium text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {copy.emailDivider}
        <span className="h-px flex-1 bg-border" />
      </div>
      <form className="grid gap-5" onSubmit={onSubmit}>
        <Field label={copy.email}>
          <Input required name="email" type="email" placeholder="you@email.com" className="h-12 rounded-xl bg-background" />
        </Field>
        <Field label={copy.password}>
          <PasswordInput visible={visible} onToggle={() => setVisible((current) => !current)} copy={copy} />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="accent-primary" />
            {copy.remember}
          </label>
          <button type="button" className="font-semibold text-primary hover:underline">
            {copy.forgot}
          </button>
        </div>
        <Button disabled={busy || disabled} className="mt-1 h-12 w-full rounded-xl text-base">
          {busy ? copy.submitting : role === "patient" ? copy.submit : copy.doctorSubmit}
          {!busy && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function PasswordInput({ visible, onToggle, copy }: { visible: boolean; onToggle: () => void; copy: PatientLoginCopy }) {
  return (
    <div className="relative min-w-0">
      <LockKeyhole className="absolute top-4 left-3.5 size-4 text-muted-foreground" />
      <Input
        required
        name="password"
        type={visible ? "text" : "password"}
        placeholder={copy.passwordPlaceholder}
        className="h-12 rounded-xl bg-background pr-12 pl-10"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? copy.hidePassword : copy.showPassword}
        className="absolute top-0 right-0 flex h-12 w-12 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function TrustItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-primary-foreground/[0.06] px-4 py-3.5 text-sm font-medium text-primary-foreground">
      <span className="text-secondary [&_svg]:size-5">{icon}</span>
      {label}
    </div>
  );
}

function AuthNotice({ notice }: { notice: Exclude<Notice, null> }) {
  return (
    <div
      role="alert"
      className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
        notice.kind === "error"
          ? "border-destructive/20 bg-destructive/6 text-destructive"
          : "border-[#12734b]/20 bg-[#e6f7ee] text-[#12734b]"
      }`}
    >
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

function getAuthErrorMessage(error: unknown, copy: PatientLoginCopy): string {
  if (error instanceof FirebaseError) {
    const knownErrors: Record<string, string> = {
      "auth/invalid-credential": copy.invalidCredentials,
      "auth/too-many-requests": copy.tooManyRequests,
      "auth/popup-closed-by-user": copy.popupClosed,
    };

    return knownErrors[error.code] ?? copy.authError;
  }

  return error instanceof Error ? error.message : copy.authError;
}
