import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/features/localization/locale-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Click Klinik | Everyday Telehealth for Filipino Families",
  description:
    "A Filipino-focused telehealth companion for guided care navigation and online consultation.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
