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
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { WorkspaceNotifications } from "@/components/workspace-notifications";
import { LanguageSelector } from "@/features/localization/language-selector";
import { useLocale } from "@/features/localization/locale-provider";
import { workspaceTranslations } from "@/features/localization/workspace-translations";
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
  "https://firebasestorage.googleapis.com/v0/b/miolms.firebasestorage.app/o/click-klinik%2Flogo-textline_transparent.png?alt=media&token=926c192d-e291-4d7d-ab56-a65a20756dfd";

export function DoctorWorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { locale } = useLocale();
  const t = workspaceTranslations[locale].shared;
  const { configured, doctor, loading, message, signOutDoctor } =
    useDoctorWorkspace();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncCollapsed = () => setCollapsed(mediaQuery.matches);

    syncCollapsed();
    mediaQuery.addEventListener("change", syncCollapsed);

    return () => mediaQuery.removeEventListener("change", syncCollapsed);
  }, []);

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
  const localizedWorkspaceLinks = [
    { ...workspaceLinks[0], label: t.doctorNav.home },
    { ...workspaceLinks[1], label: t.doctorNav.records },
    { ...workspaceLinks[2], label: t.doctorNav.availability },
    { ...workspaceLinks[3], label: t.doctorNav.calendar },
    { ...workspaceLinks[4], label: t.doctorNav.notes },
    { ...workspaceLinks[5], label: t.doctorNav.session },
    { ...workspaceLinks[6], label: t.doctorNav.profile },
  ] as const;

  return (
    <main className="min-h-dvh bg-[#f7f2e8]">
      <div
        className={cn(
          "grid min-h-dvh",
          collapsed
            ? "grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[82px_minmax(0,1fr)]"
            : "grid-cols-[212px_minmax(0,1fr)]",
        )}
      >
        <aside className="sticky top-0 flex h-dvh min-h-dvh flex-col self-start overflow-hidden border-r border-[#d8d0c2] bg-[#082b45] px-0 py-0 text-primary-foreground shadow-[22px_0_70px_-58px_rgba(8,43,69,0.95)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_50%_0%,rgba(255,217,46,0.14),transparent_64%)]" />
          <div
            className={cn(
              "relative flex h-[76px] items-center border-b border-[#d8d0c2] bg-white shadow-[0_12px_30px_-24px_rgba(8,43,69,0.85)]",
              collapsed ? "justify-center px-2" : "px-4",
            )}
          >
            <Link href="/doctor/dashboard" className="block">
              <img
                src={logoTextUrl}
                alt="Click Klinik"
                className={cn(
                  "h-12 w-auto object-contain",
                  collapsed && "h-10 max-w-12 object-contain object-left",
                )}
              />
            </Link>
          </div>

          <div className={cn("relative mt-4 px-3.5", collapsed && "px-2")}>
            <div
              className={cn(
                "rounded-2xl border border-white/10 bg-white/[0.06] p-2",
                "flex justify-center",
              )}
            >
              <LanguageSelector
                className={cn(
                  collapsed ? "w-12 justify-center px-2" : "w-full justify-center",
                )}
              />
            </div>
          </div>

          <div
            className={cn(
              "relative mx-3.5 mt-4 rounded-2xl border border-white/12 bg-white/[0.07] px-3 py-3",
              collapsed && "hidden",
            )}
          >
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                {t.doctorAccount}
              </p>
              <p className="mt-1 truncate text-sm font-bold text-primary-foreground">
                {displayName}
              </p>
            </div>
          </div>

          <nav className="relative mt-5 grid flex-1 content-start gap-1.5 overflow-y-auto px-3.5">
            {localizedWorkspaceLinks.map((link) => {
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
                      ? "bg-secondary text-secondary-foreground shadow-[0_16px_32px_-24px_rgba(255,217,46,0.9)]"
                      : "text-primary-foreground/72 hover:bg-white/[0.08] hover:text-primary-foreground",
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

          <div className="relative mt-auto shrink-0 px-3.5 pb-4 pt-3">
            <Button
              variant="ghost"
              onClick={() => setCollapsed((current) => !current)}
              className="mb-2 h-10 w-full rounded-2xl text-primary-foreground/70 hover:bg-white/[0.08] hover:text-primary-foreground"
            >
              {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
              <span className={cn(collapsed && "hidden")}>{t.collapse}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => void signOutDoctor()}
              className="h-11 w-full rounded-2xl border-white/12 bg-white/[0.06] text-primary-foreground hover:bg-white/[0.1] hover:text-primary-foreground"
            >
              <LogOut className="size-4" />
              <span className={cn(collapsed && "hidden")}>{t.logout}</span>
            </Button>
          </div>
        </aside>

        <section className="min-w-0 bg-[#f7f2e8] px-0 py-0">
          {children}
        </section>
      </div>
      <WorkspaceNotifications />
    </main>
  );
}
