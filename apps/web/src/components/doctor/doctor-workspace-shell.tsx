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
  children?: Array<{
    href: string;
    label: string;
  }>;
};

const workspaceLinks: WorkspaceLink[] = [
  {
    href: "/doctor/dashboard",
    label: "Overview",
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    href: "/doctor/records",
    label: "Records",
    icon: <BookOpenText className="size-4" />,
  },
  {
    href: "/doctor/schedule",
    label: "Schedule",
    icon: <CalendarDays className="size-4" />,
    children: [
      {
        href: "/doctor/schedule",
        label: "Availability",
      },
      {
        href: "/doctor/schedule/calendar",
        label: "Calendar",
      },
    ],
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
    label: "Consult room",
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
    <main className="min-h-screen bg-[#f5efe4]">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="border-r border-[#12324d]/12 bg-[linear-gradient(180deg,rgba(10,46,73,1)_0%,rgba(8,37,60,1)_100%)] px-4 py-4 text-primary-foreground lg:h-screen lg:px-4 lg:py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-primary">
              <HeartPulse className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-[0.08em]">
                Click Klinik
              </p>
              <p className="text-[11px] text-primary-foreground/58">
                Doctor portal
              </p>
            </div>
          </div>

          <div className="mt-5 border border-primary-foreground/10 bg-primary-foreground/[0.05] px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="mt-1 truncate text-xs text-primary-foreground/62">
                  {doctor.specializationName}
                </p>
              </div>
              <Badge className="shrink-0 rounded-full border border-primary-foreground/14 bg-primary-foreground/[0.06] px-2.5 text-[10px] text-secondary shadow-none">
                <ShieldCheck className="size-3" />
                Active
              </Badge>
            </div>
          </div>

          <nav className="mt-5 grid gap-1.5">
            {workspaceLinks.map((link) => {
              const active =
                pathname === link.href ||
                link.children?.some((child) => pathname === child.href);

              return (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-secondary text-secondary-foreground"
                        : "text-primary-foreground/70 hover:bg-primary-foreground/[0.06] hover:text-primary-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-xl",
                        active
                          ? "bg-secondary-foreground/10"
                          : "bg-primary-foreground/[0.08] text-secondary",
                      )}
                    >
                      {link.icon}
                    </span>
                    <span className="font-medium">{link.label}</span>
                  </Link>

                  {link.children ? (
                    <div className="mt-1 ml-11 grid gap-1">
                      {link.children.map((child) => {
                        const childActive = pathname === child.href;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors",
                              childActive
                                ? "bg-primary-foreground/[0.1] text-secondary"
                                : "text-primary-foreground/52 hover:bg-primary-foreground/[0.05] hover:text-primary-foreground",
                            )}
                          >
                            <CalendarRange className="size-3.5" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="mt-auto pt-5">
            <div className="border border-primary-foreground/8 bg-primary-foreground/[0.04] px-3.5 py-3">
              <p className="text-[11px] font-bold tracking-[0.18em] text-secondary uppercase">
                Quick focus
              </p>
              <p className="mt-2 text-xs leading-6 text-primary-foreground/62">
                Review chart, confirm schedule, document immediately after consult.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void signOutDoctor()}
              className="mt-3 h-11 w-full border-primary-foreground/12 bg-primary-foreground/[0.04] text-primary-foreground hover:bg-primary-foreground/[0.08] hover:text-primary-foreground"
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
