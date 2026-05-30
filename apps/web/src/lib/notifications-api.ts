import type { User } from "firebase/auth";

export type AppNotification = {
  _id: string;
  recipientRole: "doctor" | "patient";
  recipientId: string;
  type:
    | "appointment_booked"
    | "appointment_status"
    | "payment"
    | "payout"
    | "refund"
    | "medical_record";
  title: string;
  message: string;
  href?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getMyNotifications(user: User): Promise<AppNotification[]> {
  return notificationRequest<AppNotification[]>(user, "/notifications/me");
}

export async function markNotificationRead(
  user: User,
  id: string,
): Promise<AppNotification> {
  return notificationRequest<AppNotification>(user, `/notifications/me/${id}/read`, {
    method: "PATCH",
  });
}

async function notificationRequest<T>(
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
    throw new Error("Unable to load notifications.");
  }

  return (await response.json()) as T;
}
