"use client";

import { useState } from "react";
import {
  Clock3,
  FileText,
  Pill,
  Search,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  mockDoctorPatients,
  type DoctorPatientRecord,
} from "@/features/doctor/mock-doctor-patients";

export default function DoctorRecordsPage() {
  const [query, setQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(
    mockDoctorPatients[0]?.id ?? "",
  );

  const value = query.trim().toLowerCase();
  const filteredPatients = !value
    ? mockDoctorPatients
    : mockDoctorPatients.filter((patient) =>
        `${patient.name} ${patient.primaryConcern} ${patient.medicalHistory}`
          .toLowerCase()
          .includes(value),
      );

  const selectedPatient =
    filteredPatients.find((patient) => patient.id === selectedPatientId) ??
    filteredPatients[0] ??
    null;

  return (
    <div className="w-full bg-[linear-gradient(180deg,#f7f2e8_0%,#f4ecde_100%)]">
      <section className="border-b border-[#12324d]/10 bg-[linear-gradient(135deg,#0d3553_0%,#123f63_58%,#15496f_100%)] text-primary-foreground">
        <div className="grid xl:grid-cols-[1.12fr_0.88fr]">
          <div className="px-6 py-7 sm:px-8">
            <p className="text-xs font-bold tracking-[0.22em] text-secondary uppercase">
              Medical records
            </p>
            <h1 className="mt-3 text-3xl font-bold">
              Review records across your patient list.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-primary-foreground/68">
              Browse patient charts, appointment history, previous notes, and
              prescriptions before the next teleconsultation.
            </p>
          </div>
          <div className="border-t border-primary-foreground/10 px-6 py-7 sm:px-8 xl:border-t-0 xl:border-l xl:border-primary-foreground/10">
            <p className="text-xs font-bold tracking-[0.18em] text-secondary uppercase">
              Assigned patients
            </p>
            <p className="mt-3 text-3xl font-bold">{mockDoctorPatients.length}</p>
            <p className="mt-2 text-sm text-primary-foreground/66">
              patient charts currently visible in this doctor workspace
            </p>
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-[320px_1fr]">
        <aside className="border-r border-[#12324d]/10 bg-[#fcfaf5] px-6 py-5 sm:px-8">
          <div className="flex h-11 items-center gap-3 rounded-xl border border-[#12324d]/10 bg-white px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search patient, concern, or history"
              className="w-full bg-transparent text-sm outline-none"
              aria-label="Search patient records"
            />
          </div>

          <div className="mt-5 space-y-2">
            {filteredPatients.map((patient) => {
              const active = selectedPatient?.id === patient.id;
              return (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`w-full border px-4 py-4 text-left transition-colors ${
                    active
                      ? "rounded-xl border-primary bg-primary/[0.045]"
                      : "rounded-xl border-[#12324d]/10 bg-white hover:bg-primary/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{patient.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {patient.age} years old • {patient.sex}
                      </p>
                    </div>
                    <Badge
                      variant={patient.status === "Waiting" ? "secondary" : "outline"}
                      className="h-fit"
                    >
                      {patient.status}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {patient.primaryConcern}
                  </p>
                </button>
              );
            })}

            {filteredPatients.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white px-4 py-6 text-sm text-muted-foreground">
                No matching patients found.
              </div>
            ) : null}
          </div>
        </aside>

        <div className="bg-[#fffdf8] px-6 py-5 sm:px-8">
          {selectedPatient ? (
            <PatientRecordPanels patient={selectedPatient} />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-white px-5 py-10 text-sm text-muted-foreground">
              Select a patient to open the record view.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PatientRecordPanels({ patient }: { patient: DoctorPatientRecord }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="space-y-6">
        <section className="rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <UserRound className="size-5" />
            </span>
            <div>
              <p className="font-bold">{patient.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {patient.age} years old • {patient.sex}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <InfoRow label="Primary concern" value={patient.primaryConcern} />
            <InfoRow label="Known history" value={patient.medicalHistory} />
            <InfoRow label="Allergies" value={patient.allergies} />
          </div>
        </section>

        <section>
          <SectionHeader
            icon={<Clock3 className="size-5" />}
            title="Appointment history"
            copy="Previous and upcoming sessions for this patient"
            badge={`${patient.appointments.length} records`}
          />
          <div className="mt-3 space-y-2">
            {patient.appointments.map((item) => (
              <article
                key={`${patient.id}-${item.date}-${item.time}`}
                className="grid gap-3 rounded-xl border border-[#12324d]/10 bg-white px-4 py-4 sm:grid-cols-[140px_1fr_auto]"
              >
                <div>
                  <p className="text-sm font-bold text-primary">{item.date}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
                </div>
                <div>
                  <p className="font-semibold">{item.type}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.concern}
                  </p>
                </div>
                <Badge
                  variant={item.status === "Upcoming" ? "secondary" : "outline"}
                  className="h-fit"
                >
                  {item.status}
                </Badge>
              </article>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            icon={<FileText className="size-5" />}
            title="Consultation notes"
            copy="Previous doctor-authored summaries"
          />
          <div className="mt-3 grid gap-2">
            {patient.notes.map((item) => (
              <article
                key={`${patient.id}-${item.title}`}
                className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4"
              >
                <p className="text-sm font-bold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section>
          <SectionHeader
            icon={<Pill className="size-5" />}
            title="Prescription history"
            copy="Recently issued medications and instructions"
          />
          <div className="mt-3 space-y-2">
            {patient.prescriptions.map((item) => (
              <article
                key={`${patient.id}-${item.name}-${item.issued}`}
                className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">{item.name}</p>
                  <Badge variant="outline">Issued {item.issued}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.instruction}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-5 py-5">
          <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
            Doctor action
          </p>
          <p className="mt-2 text-lg font-bold">Continue care for this patient</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button className="h-11 rounded-xl">Open consult room</Button>
            <Button variant="outline" className="h-11 rounded-xl">
              Write new notes
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  copy,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
          {icon}
        </span>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm text-muted-foreground">{copy}</p>
        </div>
      </div>
      {badge ? <Badge variant="outline">{badge}</Badge> : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[58%] text-right font-medium">{value}</span>
    </div>
  );
}
