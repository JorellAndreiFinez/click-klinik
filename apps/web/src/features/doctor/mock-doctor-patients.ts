export type DoctorPatientRecord = {
  id: string;
  name: string;
  age: number;
  sex: string;
  primaryConcern: string;
  medicalHistory: string;
  allergies: string;
  status: "Waiting" | "Follow-up" | "Stable";
  appointments: Array<{
    date: string;
    time: string;
    type: string;
    concern: string;
    status: "Completed" | "Upcoming";
  }>;
  prescriptions: Array<{
    name: string;
    instruction: string;
    issued: string;
  }>;
  notes: Array<{
    title: string;
    copy: string;
  }>;
};

export const mockDoctorPatients: DoctorPatientRecord[] = [
  {
    id: "p-101",
    name: "Maria Santos",
    age: 43,
    sex: "Female",
    primaryConcern: "Chest discomfort monitoring",
    medicalHistory: "Hypertension, hyperlipidemia",
    allergies: "No known drug allergies",
    status: "Follow-up",
    appointments: [
      {
        date: "May 24, 2026",
        time: "9:00 AM",
        type: "Follow-up",
        concern: "Recurring chest discomfort",
        status: "Completed",
      },
      {
        date: "May 10, 2026",
        time: "2:30 PM",
        type: "Initial consult",
        concern: "Shortness of breath after activity",
        status: "Completed",
      },
      {
        date: "Apr 28, 2026",
        time: "11:15 AM",
        type: "Virtual review",
        concern: "Medication refill review",
        status: "Completed",
      },
    ],
    prescriptions: [
      {
        name: "Amlodipine 5 mg",
        instruction: "1 tablet once daily after breakfast",
        issued: "May 24, 2026",
      },
      {
        name: "Atorvastatin 20 mg",
        instruction: "1 tablet at bedtime",
        issued: "May 10, 2026",
      },
    ],
    notes: [
      {
        title: "Last consultation summary",
        copy: "Patient reports milder chest heaviness compared with the initial visit. No new dizziness. Advised continued BP monitoring and reduced high-sodium meals.",
      },
      {
        title: "Monitoring reminders",
        copy: "Continue home blood pressure log for 7 days and bring readings to the next consult. Escalate immediately if chest pain becomes severe or persistent.",
      },
    ],
  },
  {
    id: "p-102",
    name: "Jose Ramirez",
    age: 57,
    sex: "Male",
    primaryConcern: "Blood pressure follow-up",
    medicalHistory: "Hypertension, gout",
    allergies: "Penicillin",
    status: "Stable",
    appointments: [
      {
        date: "May 26, 2026",
        time: "3:00 PM",
        type: "Tele-follow-up",
        concern: "Home BP review",
        status: "Completed",
      },
      {
        date: "May 05, 2026",
        time: "10:00 AM",
        type: "Medication review",
        concern: "Dizziness after dosage change",
        status: "Completed",
      },
    ],
    prescriptions: [
      {
        name: "Losartan 50 mg",
        instruction: "1 tablet once daily",
        issued: "May 26, 2026",
      },
    ],
    notes: [
      {
        title: "Recent assessment",
        copy: "Blood pressure trend improved. Continue current medication and reduce late-night salty meals.",
      },
    ],
  },
  {
    id: "p-103",
    name: "Ana Dela Cruz",
    age: 31,
    sex: "Female",
    primaryConcern: "Palpitations and anxiety episodes",
    medicalHistory: "Anxiety, occasional GERD",
    allergies: "No known drug allergies",
    status: "Waiting",
    appointments: [
      {
        date: "May 27, 2026",
        time: "10:30 AM",
        type: "Booked teleconsult",
        concern: "Palpitations after stress",
        status: "Upcoming",
      },
      {
        date: "May 11, 2026",
        time: "1:30 PM",
        type: "Initial consult",
        concern: "Heart racing episodes",
        status: "Completed",
      },
    ],
    prescriptions: [
      {
        name: "Omeprazole 20 mg",
        instruction: "1 capsule before breakfast",
        issued: "May 11, 2026",
      },
    ],
    notes: [
      {
        title: "Pre-consult summary",
        copy: "Patient requested follow-up after another palpitations episode related to work stress. No syncope reported.",
      },
    ],
  },
];
