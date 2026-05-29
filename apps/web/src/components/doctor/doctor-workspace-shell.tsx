"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BookOpenText,
  CalendarDays,
  CalendarRange,
  ChevronsLeft,
  ChevronsRight,
  ClipboardPenLine,
  LayoutDashboard,
  LogOut,
  MonitorSmartphone,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useState } from "react";

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
    href: "/doctor/notes",
    label: "Notes & Rx",
    icon: <ClipboardPenLine className="size-4" />,
  },
  {
    href: "/doctor/session",
    label: "Session",
    icon: <MonitorSmartphone className="size-4" />,
  },
  {
    href: "/doctor/profile",
    label: "Profile",
    icon: <UserRound className="size-4" />,
  },
] as const;

const logoTextUrl =
  "https://firebasestorage.googleapis.com/v0/b/miolms.firebasestorage.app/o/click-klinik%2Flogo-with_bg.jpg?alt=media&token=1be21a6e-cba7-4cb1-a4b9-da1df3617fe7";

export function DoctorWorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
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
            <Link href="/doctor/dashboard" className="block w-fit">
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
              Doctor account
            </p>
            <p className="mt-1 truncate text-sm font-bold text-primary-foreground">
              {displayName}
            </p>
          </div>

          <nav className="relative mt-6 grid gap-2">
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
              onClick={() => void signOutDoctor()}
              className="h-11 w-full rounded-2xl border-white/12 bg-white/[0.05] text-primary-foreground hover:bg-white/[0.1] hover:text-primary-foreground"
            >
              <LogOut className="size-4" />
              <span className={cn(collapsed && "hidden")}>Log out</span>
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
