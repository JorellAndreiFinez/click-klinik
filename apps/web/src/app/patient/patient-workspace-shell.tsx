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
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { WorkspaceNotifications } from "@/components/workspace-notifications";
import { LanguageSelector } from "@/features/localization/language-selector";
import { useLocale } from "@/features/localization/locale-provider";
import { workspaceTranslations } from "@/features/localization/workspace-translations";
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
  "https://firebasestorage.googleapis.com/v0/b/miolms.firebasestorage.app/o/click-klinik%2Flogo-textline_transparent.png?alt=media&token=926c192d-e291-4d7d-ab56-a65a20756dfd";

export function PatientWorkspaceShell({
  children,
  patientName = "Patient",
  onSignOut,
}: PatientWorkspaceShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { locale } = useLocale();
  const t = workspaceTranslations[locale].shared;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncCollapsed = () => setCollapsed(mediaQuery.matches);

    syncCollapsed();
    mediaQuery.addEventListener("change", syncCollapsed);

    return () => mediaQuery.removeEventListener("change", syncCollapsed);
  }, []);

  const localizedPatientLinks = [
    { ...patientLinks[0], label: t.patientNav.home },
    { ...patientLinks[1], label: t.patientNav.findCare },
    { ...patientLinks[2], label: t.patientNav.appointments },
    { ...patientLinks[3], label: t.patientNav.records },
    { ...patientLinks[4], label: t.patientNav.monitoring },
    { ...patientLinks[5], label: t.patientNav.profile },
  ] as const;

  return (
    <main className="min-h-dvh bg-[#f7f2e8]">
      <div
        className={cn(
          "grid min-h-dvh",
          collapsed
            ? "grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[82px_minmax(0,1fr)]"
            : "grid-cols-[196px_minmax(0,1fr)]",
        )}
      >
        <aside className="sticky top-0 flex h-dvh min-h-dvh flex-col self-start overflow-hidden border-r border-white/10 bg-[#07304a] px-0 py-0 text-primary-foreground shadow-[18px_0_60px_-48px_rgba(8,43,69,0.9)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(255,217,46,0.16),transparent_62%)]" />
          <div
            className={cn(
              "relative flex h-[74px] items-center border-b border-[#12324d]/10 bg-white shadow-[0_12px_30px_-24px_rgba(8,43,69,0.85)]",
              collapsed ? "justify-center px-2" : "px-4",
            )}
          >
            <Link href="/patient/portal" className="block">
              <img
                src={logoTextUrl}
                alt="Click Klinik"
                className={cn(
                  "h-17 w-auto object-contain",
                  collapsed && "h-12 max-w-12 object-contain object-left",
                )}
              />
            </Link>
          </div>

          <div className={cn("relative mt-4 px-3.5", collapsed && "px-2")}>
            <div
              className={cn(
                "rounded-2xl border border-white/10 bg-white/[0.06] p-2",
                collapsed
                  ? "flex justify-center"
                  : "flex items-center justify-between gap-3",
              )}
            >
              <LanguageSelector
                className={cn(
                  collapsed
                    ? "w-12 justify-center px-2"
                    : "w-full justify-center",
                )}
              />
            </div>
          </div>

          <div
            className={cn(
              "relative mx-3.5 mt-4 rounded-2xl border border-white/12 bg-white/[0.06] px-3 py-3",
              collapsed && "hidden",
            )}
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-primary-foreground/80">
                {t.patientAccount}
              </p>
              <p className="mt-1 truncate text-sm font-bold text-primary-foreground">
                {patientName}
              </p>
            </div>
          </div>

          <nav className="relative mt-6 grid flex-1 content-start gap-2 overflow-y-auto px-3.5">
            {localizedPatientLinks.map((link) => {
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
                  <span className={cn(collapsed && "hidden")}>
                    {link.label}
                  </span>
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
              {collapsed ? (
                <ChevronsRight className="size-4" />
              ) : (
                <ChevronsLeft className="size-4" />
              )}
              <span className={cn(collapsed && "hidden")}>{t.collapse}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => void onSignOut?.()}
              className="h-11 w-full rounded-2xl border-white/12 bg-white/[0.05] text-primary-foreground hover:bg-white/[0.1] hover:text-primary-foreground"
            >
              <LogOut className="size-4" />
              <span className={cn(collapsed && "hidden")}>{t.logout}</span>
            </Button>
          </div>
        </aside>

        <section className="min-w-0 bg-[#f7f2e8]">{children}</section>
      </div>
      <WorkspaceNotifications />
    </main>
  );
}
