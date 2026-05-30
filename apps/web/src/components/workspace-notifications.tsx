"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Bell, CheckCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import {
  getMyNotifications,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notifications-api";
import { cn } from "@/lib/utils";

export function WorkspaceNotifications() {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [floating, setFloating] = useState<AppNotification[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!configured) {
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser);
      initializedRef.current = false;
      seenIdsRef.current = new Set(loadSeenNotificationIds(nextUser?.uid));
      setFloating([]);
    });
  }, [configured]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadNotifications = async () => {
      const nextNotifications = await getMyNotifications(user);
      setNotifications(nextNotifications);

      if (!initializedRef.current) {
        const initialUnread = nextNotifications.filter(
          (notification) =>
            !notification.read && !seenIdsRef.current.has(notification._id),
        );
        if (initialUnread.length > 0) {
          const nextFloating = initialUnread.slice(0, 2);
          nextFloating.forEach((notification) => {
            seenIdsRef.current.add(notification._id);
            rememberSeenNotification(user.uid, notification._id);
          });
          setFloating(nextFloating);
        }
        initializedRef.current = true;
        return;
      }

      const newUnread = nextNotifications.filter(
        (notification) =>
          !notification.read && !seenIdsRef.current.has(notification._id),
      );

      if (newUnread.length > 0) {
        newUnread.forEach((notification) => {
          seenIdsRef.current.add(notification._id);
          rememberSeenNotification(user.uid, notification._id);
        });
        setFloating((current) =>
          [...newUnread.slice(0, 2), ...current].slice(0, 2),
        );
      }
    };

    void loadNotifications().catch(() => undefined);
    const intervalId = window.setInterval(() => {
      void loadNotifications().catch(() => undefined);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    if (floating.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFloating((current) => current.slice(0, -1));
    }, 5200);

    return () => window.clearTimeout(timeoutId);
  }, [floating]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  async function handleMarkRead(notification: AppNotification) {
    if (!user || notification.read) {
      return;
    }

    const updated = await markNotificationRead(user, notification._id);
    setNotifications((current) =>
      current.map((item) => (item._id === updated._id ? updated : item)),
    );
  }

  function dismissFloating(notificationId: string) {
    if (user) {
      rememberSeenNotification(user.uid, notificationId);
    }
    setFloating((current) =>
      current.filter((notification) => notification._id !== notificationId),
    );
  }

  return (
    <>
      <div className="fixed top-3 right-3 z-40 sm:top-4 sm:right-4">
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            className="size-11 rounded-2xl border-[#12324d]/10 bg-white/95 p-0 text-primary shadow-[0_18px_48px_-28px_rgba(8,43,69,0.7)] backdrop-blur"
            onClick={() => setOpen((current) => !current)}
            aria-label="Open notifications"
          >
            <Bell className="size-4" />
          </Button>
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-primary">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}

          {open ? (
            <div className="absolute right-0 mt-2 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#12324d]/10 bg-white shadow-[0_24px_70px_-34px_rgba(8,43,69,0.9)]">
              <div className="flex items-center justify-between border-b border-[#12324d]/10 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-primary">
                    Notifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Activity history
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full p-1 text-muted-foreground hover:bg-[#f7f2e8]"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkRead={() => void handleMarkRead(notification)}
                  />
                ))}
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No notifications yet.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none fixed right-3 left-3 top-16 z-40 grid gap-2 sm:left-auto sm:right-4 sm:w-[360px]">
        {floating.map((notification) => (
          <div
            key={notification._id}
            className="pointer-events-auto animate-in slide-in-from-top-2 rounded-2xl border border-[#12324d]/10 bg-white px-4 py-3 shadow-[0_24px_70px_-34px_rgba(8,43,69,0.9)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary">
                  {notification.title}
                </p>
                <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
                  {notification.message}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-[#f7f2e8] hover:text-primary"
                onClick={() => dismissFloating(notification._id)}
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: AppNotification;
  onMarkRead: () => void;
}) {
  const content = (
    <div
      className={cn(
        "border-b border-[#12324d]/8 px-4 py-3 transition-colors last:border-b-0 hover:bg-[#fcfaf5]",
        !notification.read && "bg-secondary/10",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary">{notification.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {notification.message}
          </p>
          <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
            {formatNotificationDate(notification.createdAt)}
          </p>
        </div>
        {!notification.read ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onMarkRead();
            }}
            className="rounded-full p-1.5 text-primary hover:bg-white"
            aria-label="Mark notification as read"
          >
            <CheckCheck className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );

  if (notification.href) {
    return (
      <Link href={notification.href} onClick={onMarkRead}>
        {content}
      </Link>
    );
  }

  return content;
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function loadSeenNotificationIds(uid?: string | null): string[] {
  if (!uid || typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(
      `click-klinik-floating-notifications:${uid}`,
    );
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function rememberSeenNotification(uid: string, notificationId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const key = `click-klinik-floating-notifications:${uid}`;
  const seen = new Set(loadSeenNotificationIds(uid));
  seen.add(notificationId);
  window.localStorage.setItem(key, JSON.stringify([...seen].slice(-120)));
}
