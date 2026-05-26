import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, HeartPulse, ShieldCheck } from "lucide-react";

export default function PrivacyNoticePage() {
  return (
    <main className="min-h-screen bg-background px-5 py-7">
      <div className="mx-auto max-w-3xl">
        <Link href="/auth/signup" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" />
          Back to onboarding
        </Link>
        <article className="mt-7 rounded-[2rem] border border-border bg-card p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <HeartPulse className="size-6" />
            </span>
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">Click Klinik</p>
              <h1 className="text-2xl font-bold">Patient Privacy Notice</h1>
            </div>
          </div>
          <p className="mt-7 text-sm leading-7 text-muted-foreground">
            This MVP collects patient profile and health information to provide telehealth account setup, appointment coordination, and doctor-ready care context. Health information is sensitive personal information and should be protected accordingly.
          </p>
          <section className="mt-8 space-y-6 text-sm leading-7">
            <NoticeBlock title="What we collect">
              Name, contact details, birthday, sex, height, weight, emergency contact, reported allergies, conditions, medications, and basic medical history.
            </NoticeBlock>
            <NoticeBlock title="Why we collect it">
              To prepare consultations, support continuity of care, and let authorized doctors understand the patient context needed for telehealth services.
            </NoticeBlock>
            <NoticeBlock title="Access and AI use">
              Only authorized roles should access health records. AI-assisted summaries are optional, labelled as support for doctor review, and do not diagnose or replace medical advice.
            </NoticeBlock>
            <NoticeBlock title="Your choice">
              Required profile and health-data consent is needed to use patient telehealth features. AI-assisted summary consent is optional.
            </NoticeBlock>
          </section>
          <div className="mt-9 flex gap-3 rounded-2xl bg-primary p-5 text-sm leading-7 text-primary-foreground">
            <ShieldCheck className="mt-1 size-5 shrink-0 text-secondary" />
            <p>
              This prototype is designed with privacy and access-control safeguards in mind. Formal legal and security compliance review is required before production deployment.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}

function NoticeBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-muted-foreground">{children}</p>
    </div>
  );
}
