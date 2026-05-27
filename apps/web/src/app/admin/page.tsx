"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { BadgeCheck, HeartPulse, LogOut, ShieldCheck, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDoctorApplications, reviewDoctorApplication, type DoctorApplication } from "@/lib/admin-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type Notice = { kind: "error" | "success"; message: string } | null;

export default function AdminPage() {
  const router = useRouter();
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<DoctorApplication[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [checkingSession, setCheckingSession] = useState(configured);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (signedInUser) => {
      if (!signedInUser) {
        router.replace("/auth");
        return;
      }

      void getDoctorApplications(signedInUser)
        .then((data) => {
          setUser(signedInUser);
          setApplications(data);
        })
        .catch(() => {
          router.replace("/auth");
        })
        .finally(() => setCheckingSession(false));
    });

    return unsubscribe;
  }, [configured, router]);

  async function handleReview(
    id: string,
    action: "approved" | "rejected",
    reviewNotes: string,
  ) {
    if (!user) return;
    setBusy(true);
    setNotice(null);

    try {
      const reviewed = await reviewDoctorApplication(user, id, action, reviewNotes);
      setApplications((current) =>
        current.map((application) =>
          application._id === reviewed._id ? reviewed : application,
        ),
      );
      setNotice({
        kind: "success",
        message: action === "approved" ? "Doctor application approved." : "Doctor application rejected.",
      });
    } catch (error) {
      setNotice({ kind: "error", message: getMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await signOut(getFirebaseAuth());
    setUser(null);
    setApplications([]);
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <HeartPulse className="size-6" />
            </span>
            <div>
              <p className="font-bold">Click Klinik</p>
              <p className="text-xs text-muted-foreground">Superadmin control center</p>
            </div>
          </Link>
          {user && (
            <Button variant="outline" className="h-11 rounded-xl" onClick={handleLogout}>
              <LogOut className="size-4" />
              Log out
            </Button>
          )}
        </div>
      </header>

      {!user ? (
        <AccessCheck checkingSession={checkingSession} configured={configured} notice={notice} />
      ) : (
        <Dashboard applications={applications} busy={busy} notice={notice} onReview={handleReview} />
      )}
    </main>
  );
}

function AccessCheck({
  checkingSession,
  configured,
  notice,
}: {
  checkingSession: boolean;
  configured: boolean;
  notice: Notice;
}) {
  return (
    <section className="clinic-grid flex min-h-[70vh] items-center justify-center px-5">
      <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
        <ShieldCheck className="mx-auto size-10 text-primary" />
        <p className="mt-5 text-sm text-muted-foreground">
          {!configured
            ? "Authentication is not configured."
            : checkingSession
              ? "Checking access..."
              : "This area is restricted."}
        </p>
        {notice && <AdminNotice kind={notice.kind} message={notice.message} />}
      </div>
    </section>
  );
}

function Dashboard({
  applications,
  busy,
  notice,
  onReview,
}: {
  applications: DoctorApplication[];
  busy: boolean;
  notice: Notice;
  onReview: (id: string, action: "approved" | "rejected", reviewNotes: string) => Promise<void>;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-8">
      <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Doctor applications</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold">Review queue</h1>
        <Badge variant="secondary">{applications.filter((item) => item.applicationStatus === "pending_review").length} pending</Badge>
      </div>
      {notice && <AdminNotice kind={notice.kind} message={notice.message} />}
      <div className="mt-7 grid gap-5">
        {applications.map((application) => (
          <ApplicationReview key={application._id} application={application} busy={busy} onReview={onReview} />
        ))}
        {applications.length === 0 && (
          <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">No doctor applications submitted yet.</div>
        )}
      </div>
    </section>
  );
}

function ApplicationReview({
  application,
  busy,
  onReview,
}: {
  application: DoctorApplication;
  busy: boolean;
  onReview: (id: string, action: "approved" | "rejected", reviewNotes: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(application.reviewNotes ?? "");

  return (
    <article className="rounded-3xl border border-border bg-card p-5 sm:p-7">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold">{application.firstName} {application.lastName}, {application.suffix}</h2>
            <StatusBadge status={application.applicationStatus} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{application.specializationName} / PRC {application.prcLicenseNumber}</p>
        </div>
        {application.displayOnPublicWebsite && (
          <Badge variant="outline">Public profile requested</Badge>
        )}
      </div>
      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <Detail label="Email" value={application.professionalEmail} />
        <Detail label="Mobile" value={application.mobileNumber} />
        <Detail label="Practice years" value={String(application.yearsOfExperience)} />
      </div>
      <p className="mt-5 rounded-xl bg-muted/45 p-4 text-sm leading-7 text-muted-foreground">{application.bio}</p>
      <label className="mt-5 grid gap-2">
        <span className="text-sm font-semibold">Review notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={application.applicationStatus !== "pending_review"}
          maxLength={300}
          className="min-h-20 rounded-xl border border-input bg-background p-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/45"
          placeholder="Optional internal note for this review..."
        />
      </label>
      {application.applicationStatus === "pending_review" ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <Button disabled={busy} onClick={() => onReview(application._id, "approved", notes)} className="h-11 rounded-xl bg-[#12734b] px-5 hover:bg-[#0f6240]">
            <BadgeCheck className="size-4" />
            Approve doctor
          </Button>
          <Button disabled={busy} variant="destructive" onClick={() => onReview(application._id, "rejected", notes)} className="h-11 rounded-xl px-5">
            <XCircle className="size-4" />
            Reject
          </Button>
        </div>
      ) : (
        <div className={`mt-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
          application.applicationStatus === "approved"
            ? "border-[#12734b]/20 bg-[#e6f7ee] text-[#12734b]"
            : "border-destructive/20 bg-destructive/6 text-destructive"
        }`}>
          {application.applicationStatus === "approved" ? (
            <BadgeCheck className="size-5" />
          ) : (
            <XCircle className="size-5" />
          )}
          {application.applicationStatus === "approved"
            ? "Approved doctor account. Doctor access is now enabled."
            : "Doctor application rejected. Access remains disabled."}
        </div>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: DoctorApplication["applicationStatus"] }) {
  if (status === "approved") return <Badge className="bg-[#12734b]">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary">Pending review</Badge>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border p-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}

function AdminNotice({ kind, message }: { kind: "error" | "success"; message: string }) {
  return (
    <div role="alert" className={`mt-5 rounded-xl border px-4 py-3 text-sm ${kind === "success" ? "border-[#12734b]/20 bg-[#e6f7ee] text-[#12734b]" : "border-destructive/20 bg-destructive/6 text-destructive"}`}>
      {message}
    </div>
  );
}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to authenticate superadmin account.";
}
