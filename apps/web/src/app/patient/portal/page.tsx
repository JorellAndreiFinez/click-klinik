"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  CalendarDays,
  FileText,
  HeartPulse,
  LogOut,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { getMyPatientProfile, type PatientProfile } from "@/lib/patient-api";

export default function PatientPortalPage() {
  const router = useRouter();
  const firebaseConfigured = isFirebaseConfigured();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [message, setMessage] = useState(
    firebaseConfigured
      ? "Loading your secure patient profile..."
      : "Authentication is not configured yet. Add Firebase Web App values before opening the patient portal.",
  );

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
          setMessage("Your patient profile is incomplete. Please finish onboarding first.");
        });
    });
  }, [firebaseConfigured, router]);

  async function handleSignOut() {
    if (!firebaseConfigured) {
      router.replace("/auth");
      return;
    }

    await signOut(getFirebaseAuth());
    router.replace("/auth");
  }

  if (!profile) {
    return (
      <main className="clinic-grid flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
          <HeartPulse className="mx-auto size-10 text-primary" />
          <p className="mt-5 text-sm text-muted-foreground">{message}</p>
          {message.includes("incomplete") && (
            <Button asChild className="mt-6 h-11 rounded-xl">
              <Link href="/auth/signup">Finish onboarding</Link>
            </Button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <HeartPulse className="size-6" />
            </span>
            <div>
              <p className="font-bold">Click Klinik</p>
              <p className="text-xs text-muted-foreground">Patient portal</p>
            </div>
          </Link>
          <Button variant="outline" onClick={handleSignOut} className="h-11 rounded-xl px-4">
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </header>

      <section className="clinic-grid px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[2rem] bg-primary p-7 text-primary-foreground sm:p-9">
            <p className="text-xs font-bold tracking-[0.2em] text-secondary uppercase">
              Patient home
            </p>
            <h1 className="mt-4 text-3xl font-bold">Mabuhay, {profile.fullName}.</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-primary-foreground/70">
              Your health profile is ready for teleconsult booking and doctor-reviewed care.
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.76fr]">
            <div className="grid gap-4 sm:grid-cols-3">
              <PortalAction icon={<Stethoscope />} title="Find a doctor" copy="Browse specialties and schedules." />
              <PortalAction icon={<CalendarDays />} title="Appointments" copy="No upcoming consult yet." />
              <PortalAction icon={<FileText />} title="Records" copy="Prescriptions will appear here." />
            </div>
            <aside className="rounded-3xl border border-border bg-card p-6">
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-primary uppercase">
                <ShieldCheck className="size-4" />
                Privacy and safety
              </p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Health profile consent recorded. Your information is used for telehealth care coordination and shown only to authorized care roles.
              </p>
              <Link href="/privacy" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">
                View Privacy Notice
              </Link>
            </aside>
          </div>

          <div className="mt-6 rounded-3xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Health snapshot</h2>
            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <ProfileDetail label="Mobile" value={profile.mobileNumber} />
              <ProfileDetail label="Height" value={`${profile.heightCm} cm`} />
              <ProfileDetail label="Weight" value={`${profile.weightKg} kg`} />
              <ProfileDetail label="Allergies" value={profile.allergies.join(", ") || "None reported"} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PortalAction({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5">
      <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary [&_svg]:size-5">
        {icon}
      </span>
      <h2 className="mt-5 font-bold">{title}</h2>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">{copy}</p>
    </article>
  );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/45 px-4 py-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}
