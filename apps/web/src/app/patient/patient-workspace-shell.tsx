"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarDays,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Search,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PatientWorkspaceShellProps = {
  children: ReactNode;
  patientName?: string;
  onSignOut?: () => Promise<void> | void;
};

const patientLinks = [
  {
    href: "/patient/portal",
    label: "Overview",
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    href: "/patient/doctors",
    label: "Find doctors",
    icon: <Search className="size-4" />,
  },
  {
    href: "/patient/appointments",
    label: "Appointments",
    icon: <CalendarDays className="size-4" />,
  },
  {
    href: "/patient/records",
    label: "Medical records",
    icon: <FileText className="size-4" />,
  },
] as const;

export function PatientWorkspaceShell({
  children,
  patientName = "Patient",
  onSignOut,
}: PatientWorkspaceShellProps) {
  const pathname = usePathname();

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
                Patient portal
              </p>
            </div>
          </div>

          <div className="mt-5 border border-primary-foreground/10 bg-primary-foreground/[0.05] px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{patientName}</p>
                <p className="mt-1 truncate text-xs text-primary-foreground/62">
                  Secure telehealth access
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary-foreground/14 bg-primary-foreground/[0.06] px-2.5 py-1 text-[10px] text-secondary">
                <ShieldCheck className="size-3" />
                Active
              </span>
            </div>
          </div>

          <nav className="mt-5 grid gap-1.5">
            {patientLinks.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
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
              );
            })}
          </nav>

          <div className="mt-auto pt-5">
            <div className="border border-primary-foreground/8 bg-primary-foreground/[0.04] px-3.5 py-3">
              <p className="text-[11px] font-bold tracking-[0.18em] text-secondary uppercase">
                Quick focus
              </p>
              <p className="mt-2 text-xs leading-6 text-primary-foreground/62">
                Find the right doctor, manage appointments, and keep your health
                records organized.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => void onSignOut?.()}
              className="mt-3 h-11 w-full border-primary-foreground/12 bg-primary-foreground/[0.04] text-primary-foreground hover:bg-primary-foreground/[0.08] hover:text-primary-foreground"
            >
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>
        </aside>

        <section className="min-w-0 bg-[#f7f2e8]">{children}</section>
      </div>
    </main>
  );
}
