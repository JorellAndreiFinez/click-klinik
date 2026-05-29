import type { User } from "firebase/auth";

export type ScheduleSlot = {
  _id: string;
  startAt: string;
  endAt: string;
  status: "available" | "unavailable" | "booked";
  note?: string;
};

export type ScheduleNotification = {
  _id: string;
  type: "slot_created" | "slot_updated" | "slot_removed";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type CreateScheduleSlotInput = {
  startAt: string;
  endAt: string;
  status: "available" | "unavailable";
  note?: string;
};

export type WeeklyTemplateEntry = {
  _id?: string;
  dayOfWeek: number;
  status: "off" | "available";
  startTime?: string;
  endTime?: string;
};

export async function getMyScheduleSlots(
  user: User,
  range?: { from?: string; to?: string },
): Promise<ScheduleSlot[]> {
  const query = new URLSearchParams();
  if (range?.from) {
    query.set("from", range.from);
  }
  if (range?.to) {
    query.set("to", range.to);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return scheduleRequest<ScheduleSlot[]>(user, `/schedules/me/slots${suffix}`);
}

export async function getMyWeeklyTemplate(
  user: User,
): Promise<WeeklyTemplateEntry[]> {
  return scheduleRequest<WeeklyTemplateEntry[]>(user, "/schedules/me/weekly-template");
}

export async function saveMyWeeklyTemplate(
  user: User,
  entries: WeeklyTemplateEntry[],
): Promise<WeeklyTemplateEntry[]> {
  return scheduleRequest<WeeklyTemplateEntry[]>(user, "/schedules/me/weekly-template", {
    method: "PUT",
    body: JSON.stringify({ entries }),
  });
}

export async function createMyScheduleSlot(
  user: User,
  input: CreateScheduleSlotInput,
): Promise<ScheduleSlot> {
  return scheduleRequest<ScheduleSlot>(user, "/schedules/me/slots", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateMyScheduleSlot(
  user: User,
  id: string,
  input: {
    status?: "available" | "unavailable";
    startAt?: string;
    endAt?: string;
    note?: string;
  },
): Promise<ScheduleSlot> {
  return scheduleRequest<ScheduleSlot>(user, `/schedules/me/slots/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function removeMyScheduleSlot(user: User, id: string): Promise<void> {
  await scheduleRequest<{ removed: true }>(user, `/schedules/me/slots/${id}`, {
    method: "DELETE",
  });
}

export async function getMyScheduleNotifications(
  user: User,
): Promise<ScheduleNotification[]> {
  return scheduleRequest<ScheduleNotification[]>(user, "/schedules/me/notifications");
}

export async function markScheduleNotificationRead(
  user: User,
  id: string,
): Promise<ScheduleNotification> {
  return scheduleRequest<ScheduleNotification>(user, `/schedules/me/notifications/${id}/read`, {
    method: "PATCH",
  });
}

async function scheduleRequest<T>(
  user: User,
  pathname: string,
  init?: RequestInit,
): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("The API URL is not configured.");
  }

  const token = await user.getIdToken();
  const response = await fetch(`${apiUrl}${pathname}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const result: unknown = await response.json().catch(() => null);
    const message =
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : "Unable to update your consultation schedule.";
    throw new Error(message);
  }

  return (await response.json()) as T;
}
