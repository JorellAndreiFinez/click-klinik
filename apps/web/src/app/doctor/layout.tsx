"use client";

import type { ReactNode } from "react";

import { DoctorWorkspaceShell } from "@/components/doctor/doctor-workspace-shell";
import { DoctorWorkspaceProvider } from "@/features/doctor-workspace/doctor-workspace-provider";

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <DoctorWorkspaceProvider>
      <DoctorWorkspaceShell>{children}</DoctorWorkspaceShell>
    </DoctorWorkspaceProvider>
  );
}
