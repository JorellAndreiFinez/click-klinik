import Link from "next/link";
import { ArrowLeft, BadgeCheck, BriefcaseMedical, CalendarDays, FileCheck2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const applicationSteps = [
  {
    icon: <BriefcaseMedical className="size-5" />,
    title: "Professional profile",
    copy: "Share your practice details and clinical specialization.",
  },
  {
    icon: <FileCheck2 className="size-5" />,
    title: "Credential review",
    copy: "Submit your PRC license details for verification.",
  },
  {
    icon: <CalendarDays className="size-5" />,
    title: "Online availability",
    copy: "Once approved, set time slots for teleconsultations.",
  },
];

export default function DoctorApplicationPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to Click Klinik
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2rem] bg-primary p-7 text-primary-foreground sm:p-10">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-secondary uppercase">
              <BadgeCheck className="size-4" />
              Healthcare professionals
            </p>
            <h1 className="mt-5 text-4xl leading-tight font-bold tracking-[-0.05em]">
              Apply to provide telehealth care.
            </h1>
            <p className="mt-4 text-sm leading-7 text-primary-foreground/70">
              Doctor accounts use a verification process separate from patient registration to
              help families consult trusted professionals.
            </p>
            <div className="mt-10 space-y-4">
              {applicationSteps.map((step, index) => (
                <article key={step.title} className="flex gap-4 rounded-2xl bg-primary-foreground/8 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    {step.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-primary-foreground/55">
                      Step {index + 1}
                    </p>
                    <h2 className="font-bold">{step.title}</h2>
                    <p className="mt-1 text-xs leading-5 text-primary-foreground/68">{step.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-6 sm:p-9">
            <div className="mb-8">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Professional application
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Tell us about your practice.</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                This onboarding form is for licensed telehealth professionals, not patients.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-primary/10 bg-background px-4 py-3 text-sm">
                <span className="text-muted-foreground">Already an approved doctor?</span>
                <Link href="/auth" className="font-bold text-primary hover:underline">
                  Log in as doctor
                </Link>
              </div>
            </div>

            <form className="grid gap-4 sm:grid-cols-2">
              <ApplicationField label="Full name" placeholder="Dr. Juan Dela Cruz" />
              <ApplicationField label="Professional email" placeholder="doctor@email.com" type="email" />
              <ApplicationField label="PRC license number" placeholder="License number" />
              <ApplicationField label="Specialization" placeholder="Family Medicine" />
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-semibold">Practice introduction</span>
                <textarea
                  className="min-h-28 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="Tell patients about your teleconsult experience and preferred care focus..."
                />
              </label>
              <div className="mt-3 flex flex-col-reverse gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                  Submissions require document verification before an account is activated.
                </p>
                <Button type="button" className="h-12 rounded-xl px-7">
                  Submit for review
                </Button>
              </div>
            </form>

            <p className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
              Looking for patient care?{" "}
              <Link href="/auth" className="font-bold text-primary hover:underline">
                Sign in or register as a patient
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function ApplicationField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <Input type={type} placeholder={placeholder} className="h-12 rounded-xl bg-background" />
    </label>
  );
}
