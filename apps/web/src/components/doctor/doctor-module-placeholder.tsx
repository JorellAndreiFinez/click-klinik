"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function DoctorModulePlaceholder({
  eyebrow,
  title,
  description,
  icon,
  highlights,
  primaryCta,
  secondaryCta,
  status,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  highlights: Array<{ title: string; copy: string }>;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  status: string;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="grid gap-5 xl:grid-cols-[1fr_0.4fr]">
        <section className="landing-rise relative overflow-hidden rounded-[2rem] bg-primary p-7 text-primary-foreground sm:p-9">
          <div className="absolute -top-20 -right-20 size-56 rounded-full border border-primary-foreground/10" />
          <div className="relative">
            <p className="text-xs font-bold tracking-[0.22em] text-secondary uppercase">
              {eyebrow}
            </p>
            <div className="mt-4 flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-primary-foreground/10 text-secondary">
                {icon}
              </span>
              <div>
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-primary-foreground/70">
                  {description}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {primaryCta && (
                <Button
                  asChild
                  className="h-11 rounded-xl bg-secondary px-5 text-secondary-foreground hover:bg-secondary/90"
                >
                  <Link href={primaryCta.href}>{primaryCta.label}</Link>
                </Button>
              )}
              {secondaryCta && (
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-xl border-primary-foreground/16 bg-primary-foreground/[0.03] px-5 text-primary-foreground hover:bg-primary-foreground/[0.08]"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <aside className="landing-rise-late rounded-[2rem] border border-primary/10 bg-card p-6">
          <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-primary uppercase">
            <ShieldCheck className="size-4" />
            Module status
          </p>
          <div className="mt-5 rounded-2xl bg-[#e8f5ee] px-4 py-3 text-sm font-semibold text-[#12734b]">
            {status}
          </div>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            Designed for a doctor-first telehealth flow with privacy, fast scanning, and a calm workspace layout.
          </p>
        </aside>
      </div>

      <section className="mt-6 rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              What doctors need here
            </p>
            <h2 className="mt-2 text-xl font-bold">Frontend module structure</h2>
          </div>
          {primaryCta && (
            <Link
              href={primaryCta.href}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Open linked module
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.5rem] border border-border bg-background p-5"
            >
              <Badge variant="outline" className="rounded-full px-3">
                Doctor workflow
              </Badge>
              <p className="mt-4 text-base font-bold">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.copy}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
