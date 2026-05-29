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
  | "refunded"
  | "unpaid";
export type AppointmentPaymentPlan = "pay_now" | "pay_after_consultation";

export type AppointmentAddOn = {
  code: string;
  label: string;
  feePhp: number;
};

export type AppointmentTriage = {
  consultMethod: "google_meet" | "physical_visit" | "cellular";
  chiefComplaint: string;
  detailedSymptoms: string;
  onsetDate: string;
  medications: string[];
  allergies: string[];
  healthProblems: string[];
  smokes: "yes" | "no" | "prefer_not_to_say";
  drinksAlcohol: "yes" | "no" | "prefer_not_to_say";
  insurancePartnersConsent: boolean;
  laboratoryPartnersConsent: boolean;
  pharmacyPartnersConsent: boolean;
  emergencyDisclosureConsent: boolean;
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
  triage?: AppointmentTriage;
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
  paymentProvider: "xendit";
  paymentPlan: AppointmentPaymentPlan;
  paymentStatus: AppointmentPaymentStatus;
  paymentReferenceId?: string;
  paymentProviderPaymentId?: string;
  paymentCheckoutUrl?: string;
  paymentDueAt?: string;
  payoutId?: string;
  platformCommissionRate?: number;
  platformCommissionPhp?: number;
  doctorPayoutPhp?: number;
  doctorPayoutStatus?: "pending_payment" | "available" | "paid_out";
  refundStatus?: "none" | "requested" | "approved" | "rejected" | "refunded";
  refundRequestedAt?: string;
  refundReason?: string;
  patientHasRatedDoctor?: boolean;
  doctorRatingStars?: number;
  doctorRatingComment?: string;
  doctorRatedAt?: string;
  createdAt: string;
};

export type DoctorPayoutStatus =
  | "pending_payment"
  | "available"
  | "refund_requested"
  | "refunded"
  | "cancelled"
  | "paid_out";

export type DoctorPayout = {
  _id: string;
  appointmentId: string;
  patientId: string;
  patientEmail: string;
  patientName: string;
  doctorApplicationId: string;
  doctorEmail: string;
  doctorName: string;
  grossAmountPhp: number;
  platformCommissionRate: number;
  platformCommissionPhp: number;
  doctorPayoutPhp: number;
  currency: string;
  status: DoctorPayoutStatus;
  paymentProvider: "xendit";
  paymentReferenceId?: string;
  paymentProviderPaymentId?: string;
  paidAt?: string;
  refundRequestedAt?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type DoctorPayoutSummary = {
  totals: {
    grossAmountPhp: number;
    platformCommissionPhp: number;
    doctorPayoutPhp: number;
    availablePayoutPhp: number;
    pendingPayoutPhp: number;
    refundedPhp: number;
  };
  payouts: DoctorPayout[];
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
    paymentProvider: "xendit";
    paymentPlan?: AppointmentPaymentPlan;
    triage: AppointmentTriage;
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

export async function getMyDoctorPayouts(user: User): Promise<DoctorPayoutSummary> {
  return appointmentRequest<DoctorPayoutSummary>(user, "/appointments/me/doctor/payouts");
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

export async function rateAppointmentDoctor(
  user: User,
  id: string,
  input: { stars: number; comment?: string },
): Promise<Appointment> {
  return appointmentRequest<Appointment>(user, `/appointments/${id}/rating`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function requestAppointmentRefund(
  user: User,
  id: string,
  reason: string,
): Promise<Appointment> {
  try {
    return await appointmentRequest<Appointment>(user, `/appointments/${id}/refund-request`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes("Cannot POST")
    ) {
      throw error;
    }

    return appointmentRequest<Appointment>(user, `/appointments/${id}/refund`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }
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

export async function refreshAppointmentPaymentStatus(
  user: User,
  id: string,
  _referenceId?: string,
): Promise<Appointment> {
  return appointmentRequest<Appointment>(user, `/appointments/${id}/refresh-payment`, {
    method: "POST",
  });
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
