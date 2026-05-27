"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

import { getMyApprovedDoctorAccess, type DoctorApplication } from "@/lib/doctor-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type DoctorWorkspaceContextValue = {
  configured: boolean;
  loading: boolean;
  message: string;
  user: User | null;
  doctor: DoctorApplication | null;
  signOutDoctor: () => Promise<void>;
};

const DoctorWorkspaceContext = createContext<DoctorWorkspaceContextValue | null>(
  null,
);

export function DoctorWorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const configured = isFirebaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [doctor, setDoctor] = useState<DoctorApplication | null>(null);
  const [message, setMessage] = useState(
    configured
      ? "Checking your approved professional access..."
      : "Authentication is not configured yet.",
  );

  useEffect(() => {
    if (!configured) {
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      if (!nextUser) {
        router.replace("/auth");
        return;
      }

      void getMyApprovedDoctorAccess(nextUser)
        .then((approvedDoctor) => {
          setUser(nextUser);
          setDoctor(approvedDoctor);
          setLoading(false);
        })
        .catch((error: unknown) => {
          setMessage(
            error instanceof Error
              ? error.message
              : "Doctor access is not available.",
          );
          setLoading(false);
          if (pathname !== "/auth") {
            router.replace("/auth");
          }
        });
    });
  }, [configured, pathname, router]);

  async function signOutDoctor(): Promise<void> {
    if (configured) {
      await signOut(getFirebaseAuth());
    }
    router.replace("/auth");
  }

  return (
    <DoctorWorkspaceContext.Provider
      value={{
        configured,
        loading,
        message,
        user,
        doctor,
        signOutDoctor,
      }}
    >
      {children}
    </DoctorWorkspaceContext.Provider>
  );
}

export function useDoctorWorkspace(): DoctorWorkspaceContextValue {
  const context = useContext(DoctorWorkspaceContext);

  if (!context) {
    throw new Error("useDoctorWorkspace must be used inside the doctor workspace provider.");
  }

  return context;
}
