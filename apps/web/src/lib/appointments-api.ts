import type { User } from "firebase/auth";

export type AppointmentStatus =
  | "booked"
  | "confirmed"
  | "active_consultation"
  | "completed"
  | "cancelled";

export type AppointmentPaymentStatus =
  | "mock_pending"
  | "pending"
  | "paid"
  | "unpaid";

export type AppointmentAddOn = {
  code: string;
  label: string;
  feePhp: number;
};

export type Appointment = {
  _id: string;
  patientId: string;
  patientEmail: string;
  patientName: string;
  doctorApplicationId: string;
  doctorEmail: string;
  doctorName: string;
  specializationName: string;
  doctorLocation?: string;
  consultationCode: string;
  consultationLabel: string;
  addOns: AppointmentAddOn[];
  baseFeePhp: number;
  addOnsTotalPhp: number;
  totalFeePhp: number;
  currency: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  scheduleSlotId: string;
  status: AppointmentStatus;
  googleCalendarEventId?: string;
  googleMeetLink?: string;
  googleCalendarHtmlLink?: string;
  paymentProvider: "pay_later" | "paymongo" | "xendit";
  paymentStatus: AppointmentPaymentStatus;
  paymentReferenceId?: string;
  paymentProviderPaymentId?: string;
  paymentCheckoutUrl?: string;
  createdAt: string;
};

export async function createAppointment(
  user: User,
  input: {
    doctorId: string;
    scheduleSlotId: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    consultationCode: string;
    addOnCodes: string[];
    paymentProvider: "pay_later" | "paymongo" | "xendit";
  },
): Promise<Appointment> {
  return appointmentRequest<Appointment>(user, "/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMyPatientAppointments(user: User): Promise<Appointment[]> {
  return appointmentRequest<Appointment[]>(user, "/appointments/me/patient");
}

export async function getMyDoctorAppointments(user: User): Promise<Appointment[]> {
  return appointmentRequest<Appointment[]>(user, "/appointments/me/doctor");
}

export async function updateAppointmentStatus(
  user: User,
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  return appointmentRequest<Appointment>(user, `/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function joinAppointment(
  user: User,
  id: string,
): Promise<{ meetLink?: string; appointment: Appointment }> {
  return appointmentRequest<{ meetLink?: string; appointment: Appointment }>(
    user,
    `/appointments/${id}/join`,
    {
      method: "POST",
    },
  );
}

async function appointmentRequest<T>(
  user: User,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("The API URL is not configured.");
  }

  const token = await user.getIdToken();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const result: unknown = await response.json().catch(() => null);
    const message =
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : "Unable to complete the consultation request.";
    throw new Error(message);
  }

  return (await response.json()) as T;
}
