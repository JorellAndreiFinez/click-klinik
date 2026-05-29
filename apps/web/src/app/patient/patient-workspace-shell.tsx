"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  HeartPulse,
  Home,
  LogOut,
  Search,
  UserRound,
} from "lucide-react";
import { useState } from "react";

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
  {
    href: "/patient/monitoring",
    label: "Monitoring",
    icon: <HeartPulse className="size-4" />,
  },
  {
    href: "/patient/profile",
    label: "Profile",
    icon: <UserRound className="size-4" />,
  },
] as const;

const logoTextUrl =
  "https://firebasestorage.googleapis.com/v0/b/miolms.firebasestorage.app/o/click-klinik%2Flogo-with_bg.jpg?alt=media&token=1be21a6e-cba7-4cb1-a4b9-da1df3617fe7";

export function PatientWorkspaceShell({
  children,
  patientName = "Patient",
  onSignOut,
}: PatientWorkspaceShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <main className="min-h-screen bg-[#f7f2e8]">
      <div
        className={cn(
          "grid min-h-screen",
          collapsed
            ? "grid-cols-[82px_minmax(0,1fr)]"
            : "grid-cols-[196px_minmax(0,1fr)]",
        )}
      >
        <aside className="sticky top-0 flex h-screen flex-col self-start overflow-hidden border-r border-white/10 bg-[#07304a] px-3.5 py-4 text-primary-foreground shadow-[18px_0_60px_-48px_rgba(8,43,69,0.9)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(255,217,46,0.16),transparent_62%)]" />
          <div className="relative">
            <Link href="/patient/portal" className="block w-fit">
              <img
                src={logoTextUrl}
                alt="Click Klinik"
                className={cn(
                  "h-14 w-auto rounded-2xl object-contain",
                  collapsed && "h-12 w-12 object-cover",
                )}
              />
            </Link>
          </div>

          <div
            className={cn(
              "relative mt-5 rounded-2xl border border-white/12 bg-white/[0.06] px-3 py-3",
              collapsed && "hidden",
            )}
          >
            <p className="truncate text-xs font-semibold text-primary-foreground/80">
              Patient account
            </p>
            <p className="mt-1 truncate text-sm font-bold text-primary-foreground">
              {patientName}
            </p>
          </div>

          <nav className="relative mt-6 grid gap-2">
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
                    "group flex h-11 w-full items-center gap-2.5 rounded-2xl px-3 text-sm font-semibold transition-all",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-secondary text-secondary-foreground shadow-[0_18px_34px_-24px_rgba(255,217,46,0.9)]"
                      : "text-primary-foreground/70 hover:bg-white/[0.08] hover:text-primary-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                      active
                        ? "bg-secondary-foreground/10"
                        : "bg-white/[0.04] text-secondary/80 group-hover:bg-white/[0.08]",
                    )}
                  >
                    {link.icon}
                  </span>
                  <span className={cn(collapsed && "hidden")}>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="relative mt-auto pt-4">
            <Button
              variant="ghost"
              onClick={() => setCollapsed((current) => !current)}
              className="mb-2 h-10 w-full rounded-2xl text-primary-foreground/70 hover:bg-white/[0.08] hover:text-primary-foreground"
            >
              {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
              <span className={cn(collapsed && "hidden")}>Collapse</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => void onSignOut?.()}
              className="h-11 w-full rounded-2xl border-white/12 bg-white/[0.05] text-primary-foreground hover:bg-white/[0.1] hover:text-primary-foreground"
            >
              <LogOut className="size-4" />
              <span className={cn(collapsed && "hidden")}>Log out</span>
            </Button>
          </div>
        </aside>

        <section className="min-w-0 bg-[#f7f2e8]">{children}</section>
      </div>
    </main>
  );
}
