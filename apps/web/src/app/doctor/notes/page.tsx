"use client";

import { ClipboardPenLine, FileText, Pill, Plus, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const prescriptionItems = [
  {
    medicine: "Losartan 50 mg",
    instruction: "1 tablet once daily",
    duration: "30 days",
  },
  {
    medicine: "Omeprazole 20 mg",
    instruction: "1 capsule before breakfast",
    duration: "14 days",
  },
] as const;

export default function DoctorNotesPage() {
  return (
    <div className="w-full bg-[linear-gradient(180deg,#f7f2e8_0%,#f4ecde_100%)]">
      <section className="border-b border-[#12324d]/10 bg-[linear-gradient(135deg,#0d3553_0%,#123f63_58%,#15496f_100%)] text-primary-foreground">
        <div className="grid xl:grid-cols-[1.08fr_0.92fr]">
          <div className="px-6 py-7 sm:px-8">
            <p className="text-xs font-bold tracking-[0.22em] text-secondary uppercase">
              Notes & prescriptions
            </p>
            <h1 className="mt-3 text-3xl font-bold">
              Document the consult while the care context is fresh.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-primary-foreground/68">
              Complete consultation notes, recommendations, and medications in
              one doctor-friendly telehealth workflow.
            </p>
          </div>
          <div className="border-t border-primary-foreground/10 px-6 py-7 sm:px-8 xl:border-t-0 xl:border-l xl:border-primary-foreground/10">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-secondary uppercase">
              <ShieldCheck className="size-4" />
              Documentation safety
            </p>
            <div className="mt-4 rounded-xl bg-[#e8f5ee] px-4 py-3 text-sm text-[#12734b]">
              This tool provides guidance only and does not replace professional medical advice.
            </div>
            <p className="mt-3 text-sm text-primary-foreground/66">
              Final notes, prescriptions, and medical decisions remain the
              doctor&apos;s responsibility.
            </p>
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-[1.08fr_0.92fr]">
        <div className="border-r border-[#12324d]/10 bg-[#fffdf8] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <FileText className="size-5" />
            </span>
            <div>
              <p className="font-bold">Consultation note</p>
              <p className="text-sm text-muted-foreground">
                Structured telehealth summary
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <FieldBlock
              label="Chief concern"
              value="Intermittent chest tightness with mild shortness of breath during stairs."
            />
            <FieldBlock
              label="Clinical findings"
              value="Patient is alert, oriented, and able to speak in full sentences during teleconsultation. Home BP readings remain elevated in the evenings."
            />
            <FieldBlock
              label="Assessment"
              value="Ongoing hypertension monitoring with possible reflux-related chest discomfort. No current red-flag symptoms reported during the call."
            />
            <FieldBlock
              label="Plan and recommendations"
              value="Continue antihypertensive therapy, reinforce low-sodium diet, record BP twice daily for one week, and schedule follow-up teleconsult."
            />
            <FieldBlock
              label="Patient summary"
              value="Your blood pressure still needs close monitoring. Continue your medicines, reduce salty meals, and seek urgent care if severe chest pain or breathing difficulty happens."
            />
          </div>
        </div>

        <aside className="bg-[#fcfaf5] px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <Pill className="size-5" />
              </span>
              <div>
                <p className="font-bold">Prescription builder</p>
                <p className="text-sm text-muted-foreground">
                  Add medication entries
                </p>
              </div>
            </div>
            <Button variant="outline" className="h-10 rounded-xl">
              <Plus className="size-4" />
              Add item
            </Button>
          </div>

          <div className="mt-5 space-y-2">
            {prescriptionItems.map((item) => (
              <article
                key={item.medicine}
                className="rounded-xl border border-[#12324d]/10 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">{item.medicine}</p>
                  <Badge variant="outline">{item.duration}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.instruction}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-[#12324d]/10 bg-white px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <ClipboardPenLine className="size-5" />
              </span>
              <div>
                <p className="font-bold">Ready to finalize</p>
                <p className="text-sm text-muted-foreground">
                  Save summary and release prescriptions
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button className="h-11 rounded-xl">Save notes</Button>
              <Button variant="outline" className="h-11 rounded-xl">
                Preview patient copy
              </Button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <textarea
        defaultValue={value}
        rows={4}
        className="min-h-28 rounded-xl border border-[#12324d]/10 bg-white px-4 py-3 text-sm leading-6 outline-none"
      />
    </label>
  );
}
