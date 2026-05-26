"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

import type { Locale } from "./translations";

const STORAGE_KEY = "click-klinik.locale";
const localeListeners = new Set<() => void>();

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "fil" || value === "ceb" || value === "ilo";
}

function getLocaleSnapshot(): Locale {
  const storedLocale = window.localStorage.getItem(STORAGE_KEY);

  return isLocale(storedLocale) ? storedLocale : "en";
}

function getServerLocaleSnapshot(): Locale {
  return "en";
}

function subscribeToLocale(callback: () => void): () => void {
  function handleStorageUpdate(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  }

  localeListeners.add(callback);
  window.addEventListener("storage", handleStorageUpdate);

  return () => {
    localeListeners.delete(callback);
    window.removeEventListener("storage", handleStorageUpdate);
  };
}

function saveLocale(locale: Locale) {
  window.localStorage.setItem(STORAGE_KEY, locale);
  localeListeners.forEach((listener) => listener());
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <LocaleContext.Provider value={{ locale, setLocale: saveLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider.");
  }

  return context;
}
