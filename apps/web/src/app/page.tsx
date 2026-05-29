"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  HeartPulse,
  Menu,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  UserRound,
  Video,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/features/localization/language-selector";
import { useLocale } from "@/features/localization/locale-provider";
import { landingTranslations, type LandingCopy } from "@/features/localization/translations";

const featuredDoctorPhoto =
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=960&q=80";

export default function Home() {
  const { locale } = useLocale();
  const t = landingTranslations[locale];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Click Klinik home">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground sm:size-11">
              <HeartPulse className="size-5 sm:size-6" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold tracking-tight text-primary sm:text-xl">Click Klinik</span>
              <span className="hidden truncate text-xs text-muted-foreground sm:block">{t.brandTagline}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
            <Link href="/auth" className="transition-colors hover:text-primary">
              {t.nav.consult}
            </Link>
            <Link href="#features" className="transition-colors hover:text-primary">
              {t.nav.portals}
            </Link>
            <Link href="#professionals" className="transition-colors hover:text-primary">
              {t.nav.professionals}
            </Link>
            <Link href="#safety" className="transition-colors hover:text-primary">
              {t.nav.safety}
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageSelector />
            <Button asChild className="hidden h-11 rounded-xl px-5 text-sm sm:inline-flex">
              <Link href="/auth">
                {t.nav.patientAuth}
              </Link>
            </Button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-primary lg:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen ? (
          <div className="border-t border-border/70 bg-background px-4 py-4 shadow-[0_18px_45px_-35px_rgba(8,43,69,0.85)] lg:hidden">
            <nav className="mx-auto grid max-w-md gap-2 text-sm font-semibold text-primary">
              <MobileNavLink href="/auth" onClick={() => setMobileMenuOpen(false)}>
                {t.nav.consult}
              </MobileNavLink>
              <MobileNavLink href="#features" onClick={() => setMobileMenuOpen(false)}>
                {t.nav.portals}
              </MobileNavLink>
              <MobileNavLink href="/professionals/apply" onClick={() => setMobileMenuOpen(false)}>
                {t.nav.professionals}
              </MobileNavLink>
              <MobileNavLink href="#safety" onClick={() => setMobileMenuOpen(false)}>
                {t.nav.safety}
              </MobileNavLink>
              <Button asChild className="mt-2 h-11 rounded-xl">
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                  {t.nav.patientAuth}
                </Link>
              </Button>
            </nav>
          </div>
        ) : null}
      </header>

      <section className="clinic-grid">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-16">
          <div className="landing-rise">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/6 px-4 py-2 text-sm font-medium text-primary">
              <ShieldCheck className="size-4" />
              {t.hero.kicker}
            </div>
            <h1 className="max-w-xl text-5xl leading-[1.06] font-bold tracking-[-0.06em] text-foreground sm:text-6xl">
              {t.hero.title}
              <span className="block text-primary">{t.hero.highlight}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
              {t.hero.description}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-13 rounded-xl px-7 text-base">
                <Link href="/auth">
                  {t.hero.book}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-13 rounded-xl border-primary/15 bg-card px-7 text-base"
              >
                <Link href="/professionals/apply">
                  <Stethoscope className="size-4" />
                  {t.hero.doctorPortal}
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
              <HeroMetric icon={<Stethoscope />} title={t.ribbon[0]} />
              <HeroMetric icon={<Video />} title={t.ribbon[2]} />
              <HeroMetric icon={<FileText />} title={t.ribbon[3]} />
            </div>
          </div>

          <BookingPreview copy={t} />
        </div>
      </section>

      <CareJourney copy={t} />

      <FeaturedDoctors copy={t} />

      <ConsultationHandoff copy={t} />

      <ProfessionalCallout copy={t} />

      <section id="safety" className="mx-auto max-w-7xl px-5 pb-14 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-primary text-primary-foreground">
          <div className="grid md:grid-cols-[1fr_auto]">
            <div className="p-7 sm:p-10">
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-secondary uppercase">
                <ShieldCheck className="size-4" />
                {t.safety.eyebrow}
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight">
                {t.safety.title}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-primary-foreground/70">
                {t.safety.description}
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3 border-t border-primary-foreground/12 p-6 md:w-[300px] md:border-t-0 md:border-l">
              {t.safety.items.map((item, index) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary-foreground/10 text-secondary">
                    {index + 1}
                  </span>
                  {item}
                </div>
              ))}
              <Button
                asChild
                className="mt-3 h-12 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                <Link href="/auth">
                  {t.hero.book}
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-7 text-sm text-muted-foreground sm:flex-row lg:px-8">
          <p>{t.footer.label}</p>
          <p>{t.footer.emergency}</p>
        </div>
      </footer>
    </main>
  );
}

function CareJourney({ copy }: { copy: LandingCopy }) {
  return (
    <section id="features" className="border-y border-border/80 bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <div className="lg:pr-10">
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            {copy.process.eyebrow}
          </p>
          <h2 className="mt-4 text-4xl leading-tight font-bold tracking-[-0.04em]">
            {copy.process.title}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            {copy.process.description}
          </p>
          <div className="mt-9 border-l-2 border-secondary pl-5">
            <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">
              {copy.family.eyebrow}
            </p>
            <p className="mt-3 text-lg leading-7 font-medium">{copy.family.title}</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-8 bottom-8 left-[30px] hidden w-px bg-primary/10 sm:block" />
          <div className="space-y-3">
            {copy.process.steps.map((step, index) => (
              <article
                key={step.code}
                className={`relative grid gap-4 rounded-3xl border border-border bg-background p-5 sm:grid-cols-[56px_1fr_auto] sm:items-center ${
                  index === 1 ? "sm:ml-10" : index === 2 ? "sm:ml-20" : ""
                }`}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.code}
                </span>
                <div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.copy}</p>
                </div>
                <span className="hidden rounded-full bg-secondary/45 px-3 py-2 text-xs font-semibold text-primary sm:block">
                  {copy.process.tags[index]}
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedDoctors({ copy }: { copy: LandingCopy }) {
  const doctor = copy.featuredDoctors.doctor;

  return (
    <section className="mx-auto max-w-7xl px-5 pt-16 lg:px-8">
      <article className="overflow-hidden rounded-[2rem] bg-primary text-primary-foreground">
        <div className="grid lg:grid-cols-[0.84fr_1.16fr]">
          <div className="relative min-h-[390px] overflow-hidden">
            <Image
              src={featuredDoctorPhoto}
              alt={`${doctor.name}, ${doctor.role}`}
              fill
              className="object-cover object-top"
              sizes="(min-width: 1024px) 42vw, 100vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/95 via-primary/20 to-transparent px-6 pt-20 pb-6">
              <span className="inline-flex rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground">
                {copy.featuredDoctors.available}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between p-7 sm:p-10">
            <div>
              <p className="text-xs font-bold tracking-[0.21em] text-secondary uppercase">
                {copy.featuredDoctors.eyebrow} / Best Rated
              </p>
              <h2 className="mt-5 max-w-lg text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                {copy.featuredDoctors.title}
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-primary-foreground/70">
                {copy.featuredDoctors.description}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-primary-foreground/15 py-5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="size-5 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-xl font-bold">5.0</p>
                <p className="text-sm text-primary-foreground/65">
                  120+ {copy.featuredDoctors.reviews}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-2xl font-bold">{doctor.name}</p>
                <p className="mt-1 text-sm text-primary-foreground/65">{doctor.role}</p>
                <div className="mt-5 flex items-center gap-3 text-sm">
                  <CalendarDays className="size-4 text-secondary" />
                  <div>
                    <p className="text-primary-foreground/55">{copy.featuredDoctors.available}</p>
                    <p className="font-semibold text-secondary">{doctor.nextSlot}</p>
                  </div>
                </div>
              </div>
              <Button
                asChild
                className="h-12 rounded-xl bg-secondary px-6 text-secondary-foreground hover:bg-secondary/90"
              >
                <Link href="/auth">
                  {copy.featuredDoctors.book}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

function ConsultationHandoff({ copy }: { copy: LandingCopy }) {
  return (
    <section id="doctor-portal" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
          {copy.handoff.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {copy.handoff.title}
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card">
        <div className="absolute top-0 left-1/2 hidden h-full w-px bg-border lg:block" />
        <div className="grid lg:grid-cols-2">
          <HandoffSide
            eyebrow={copy.patientPortal.eyebrow}
            title={copy.patientPortal.title}
            icon={<UserRound />}
            items={copy.patientPortal.tools}
          />
          <HandoffSide
            eyebrow={copy.doctorPortal.eyebrow}
            title={copy.doctorPortal.title}
            icon={<Stethoscope />}
            items={copy.doctorPortal.tools}
            doctor
          />
        </div>
        <div className="flex flex-col gap-4 border-t border-border bg-muted/45 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-foreground">
              {copy.appointment.confirmed}
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              {copy.appointment.scheduleValue}
            </span>
            <span className="flex items-center gap-2">
              <Video className="size-4 text-primary" />
              {copy.appointment.whereValue}
            </span>
          </div>
          <Button asChild className="h-11 rounded-xl px-5">
            <Link href="/auth">{copy.hero.book}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ProfessionalCallout({ copy }: { copy: LandingCopy }) {
  return (
    <section id="professionals" className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/12 bg-[#f5efe1]">
        <div className="absolute -top-24 -right-20 size-72 rounded-full bg-secondary/35" />
        <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[0.93fr_1.07fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-primary uppercase">
              <BadgeCheck className="size-4" />
              {copy.professionals.eyebrow}
            </p>
            <h2 className="mt-4 max-w-xl text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              {copy.professionals.title}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
              {copy.professionals.description}
            </p>
            <Button asChild size="lg" className="mt-8 h-12 rounded-xl px-7">
              <Link href="/professionals/apply">
                {copy.professionals.cta}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-[1.5rem] border border-primary/10 bg-card p-5 sm:p-7">
            <div className="space-y-4">
              {copy.professionals.steps.map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-2xl bg-background px-4 py-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{step}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
              <ShieldCheck className="mt-1 size-4 shrink-0 text-primary" />
              {copy.professionals.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BookingPreview({ copy }: { copy: LandingCopy }) {
  const specialistCards = [
    {
      name: "Dr. Maria Santos",
      specialty: copy.bookingPreview.specialties[0],
      slot: "10:30 AM",
      initials: "MS",
    },
    {
      name: "Dr. Carlo Reyes",
      specialty: copy.bookingPreview.specialties[1],
      slot: "1:00 PM",
      initials: "CR",
    },
  ];

  return (
    <div id="find-doctor" className="landing-rise-late rounded-[2rem] border border-border bg-card p-4 shadow-[0_24px_65px_-32px_rgba(8,43,69,0.3)] sm:p-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            {copy.bookingPreview.label}
          </p>
          <h2 className="mt-1 text-xl font-bold">{copy.bookingPreview.title}</h2>
        </div>
        <span className="rounded-full bg-[#e6f7ee] px-3 py-1.5 text-xs font-semibold text-[#12734b]">
          {copy.bookingPreview.availableNow}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
        <Search className="size-4" />
        {copy.bookingPreview.searchPlaceholder}
      </div>

      <div className="mt-5 flex gap-2 overflow-hidden text-xs font-semibold">
        <span className="rounded-full bg-primary px-3 py-2 text-primary-foreground">{copy.bookingPreview.specialties[0]}</span>
        <span className="rounded-full bg-muted px-3 py-2 text-muted-foreground">{copy.bookingPreview.specialties[1]}</span>
        <span className="rounded-full bg-muted px-3 py-2 text-muted-foreground">{copy.bookingPreview.specialties[2]}</span>
      </div>

      <div className="mt-5 space-y-3">
        {specialistCards.map((doctor, index) => (
          <div
            key={doctor.name}
            className={`rounded-2xl border p-4 ${index === 0 ? "border-primary bg-primary/[0.035]" : "border-border"}`}
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                {doctor.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{doctor.name}</p>
                <p className="text-xs text-muted-foreground">
                  {doctor.specialty} / {copy.bookingPreview.physicianStatus}
                </p>
              </div>
              <span className="rounded-lg bg-muted px-2.5 py-2 text-xs font-semibold text-primary">
                {doctor.slot}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-primary p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{copy.appointment.label}</p>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">
            {copy.appointment.confirmed}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <AppointmentDetail icon={<CalendarDays />} value={copy.appointment.scheduleValue} />
          <AppointmentDetail icon={<Video />} value={copy.appointment.whereValue} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button asChild className="h-11 rounded-xl">
          <Link href="/auth">
            Start patient booking
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-xl bg-background">
          <Link href="/professionals/apply">
            Doctor application
          </Link>
        </Button>
      </div>
    </div>
  );
}

function AppointmentDetail({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-primary-foreground/10 px-3 py-3">
      <span className="text-secondary [&_svg]:size-4">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex h-12 items-center justify-between rounded-xl border border-border bg-card px-4 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
    >
      <span>{children}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

function HeroMetric({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-4 text-center">
      <span className="mx-auto mb-2 flex size-9 items-center justify-center rounded-xl bg-primary/8 text-primary [&_svg]:size-4">
        {icon}
      </span>
      <p className="text-xs leading-5 font-medium text-muted-foreground">{title}</p>
    </div>
  );
}

function HandoffSide({
  eyebrow,
  title,
  icon,
  items,
  doctor = false,
}: {
  eyebrow: string;
  title: string;
  icon: ReactNode;
  items: string[];
  doctor?: boolean;
}) {
  return (
    <div className={`p-7 sm:p-9 ${doctor ? "bg-primary/[0.025]" : ""}`}>
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">{eyebrow}</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight">{title}</h3>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary [&_svg]:size-6">
          {icon}
        </span>
      </div>
      <ul className="mt-8 space-y-4">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
