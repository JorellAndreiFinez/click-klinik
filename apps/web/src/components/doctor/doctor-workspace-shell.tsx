"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BookOpenText,
  CalendarDays,
  CalendarRange,
  CalendarCheck2,
  ClipboardPenLine,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDoctorWorkspace } from "@/features/doctor-workspace/doctor-workspace-provider";

type WorkspaceLink = {
  href: string;
  label: string;
  icon: ReactNode;
};

const workspaceLinks: WorkspaceLink[] = [
  {
    href: "/doctor/dashboard",
    label: "Home",
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    href: "/doctor/records",
    label: "Records",
    icon: <BookOpenText className="size-4" />,
  },
  {
    href: "/doctor/schedule",
    label: "Availability",
    icon: <CalendarDays className="size-4" />,
  },
  {
    href: "/doctor/schedule/calendar",
    label: "Calendar",
    icon: <CalendarRange className="size-4" />,
  },
  {
    href: "/doctor/consultations",
    label: "Consultations",
    icon: <CalendarCheck2 className="size-4" />,
  },
  {
    href: "/doctor/notes",
    label: "Notes & Rx",
    icon: <ClipboardPenLine className="size-4" />,
  },
  {
    href: "/doctor/session",
    label: "Session",
    icon: <MonitorSmartphone className="size-4" />,
  },
] as const;

export function DoctorWorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { configured, doctor, loading, message, signOutDoctor } =
    useDoctorWorkspace();

  if (loading || !doctor) {
    return (
      <main className="clinic-grid flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
          <Stethoscope className="mx-auto size-10 text-primary" />
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            {message}
          </p>
          {!configured && (
            <Button asChild className="mt-6 h-11 rounded-xl">
              <Link href="/auth">Return to login</Link>
            </Button>
          )}
        </div>
      </main>
    );
  }

  const displayName = `Dr. ${doctor.firstName} ${doctor.lastName}${doctor.suffix ? `, ${doctor.suffix}` : ""}`;

  return (
    <main className="min-h-screen bg-[#f7f2e8]">
      <div className="grid min-h-screen lg:grid-cols-[220px_1fr]">
        <aside className="border-r border-[#12324d]/12 bg-[#0a2e49] px-4 py-4 text-primary-foreground lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:self-start">
          <div className="flex items-center gap-3 border-b border-primary-foreground/14 pb-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <HeartPulse className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-[0.08em]">
                Click Klinik
              </p>
              <p className="text-xs text-primary-foreground/60">Doctor care</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-primary-foreground/14 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="mt-1 truncate text-xs text-primary-foreground/62">
                  {doctor.specializationName}
                </p>
              </div>
              <Badge className="shrink-0 rounded-full border border-primary-foreground/14 bg-primary-foreground/[0.06] px-2 text-[10px] text-secondary shadow-none">
                <ShieldCheck className="size-3" />
              </Badge>
            </div>
          </div>

          <nav className="mt-5 grid gap-2">
            {workspaceLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href === "/doctor/schedule" &&
                  pathname === "/doctor/schedule") ||
                (link.href === "/doctor/schedule/calendar" &&
                  pathname.startsWith("/doctor/schedule/calendar"));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex h-12 items-center gap-3 rounded-xl border px-3 text-sm font-semibold transition-colors",
                    active
                      ? "border-secondary bg-secondary text-secondary-foreground"
                      : "border-primary-foreground/12 bg-primary-foreground/[0.03] text-primary-foreground/75 hover:bg-primary-foreground/[0.08] hover:text-primary-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg",
                      active
                        ? "bg-secondary-foreground/10"
                        : "bg-primary-foreground/[0.08] text-secondary",
                    )}
                  >
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4">
            <Button
              variant="outline"
              onClick={() => void signOutDoctor()}
              className="h-11 w-full rounded-xl border-primary-foreground/16 bg-primary-foreground/[0.05] text-primary-foreground hover:bg-primary-foreground/[0.1] hover:text-primary-foreground"
            >
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>
        </aside>

        <section className="min-w-0 bg-[#f7f2e8] px-0 py-0">
          {children}
        </section>
      </div>
    </main>
  );
}
