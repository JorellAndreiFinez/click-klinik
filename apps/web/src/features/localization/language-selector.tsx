"use client";

import { Languages } from "lucide-react";

import { useLocale } from "./locale-provider";
import { localeOptions, type Locale } from "./translations";

export function LanguageSelector() {
  const { locale, setLocale } = useLocale();

  return (
    <label className="language-picker">
      <Languages className="size-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">Select language</span>
      <select
        aria-label="Select language"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {localeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
