"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarDays,
  FileText,
  HeartPulse,
  Home,
  LogOut,
  Search,
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
    label: "Home",
    icon: <Home className="size-4" />,
  },
  {
    href: "/patient/doctors",
    label: "Find care",
    icon: <Search className="size-4" />,
  },
  {
    href: "/patient/appointments",
    label: "Appointments",
    icon: <CalendarDays className="size-4" />,
  },
  {
    href: "/patient/records",
    label: "Records",
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
              <p className="text-xs text-primary-foreground/60">Patient care</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-primary-foreground/14 px-3 py-3">
            <p className="truncate text-sm font-semibold">{patientName}</p>
            <p className="mt-1 text-xs text-primary-foreground/58">
              Secure account
            </p>
          </div>

          <nav className="mt-5 grid gap-2">
            {patientLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href === "/patient/doctors" &&
                  pathname.startsWith("/patient/doctors/"));

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
              onClick={() => void onSignOut?.()}
              className="h-11 w-full rounded-xl border-primary-foreground/16 bg-primary-foreground/[0.05] text-primary-foreground hover:bg-primary-foreground/[0.1] hover:text-primary-foreground"
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
