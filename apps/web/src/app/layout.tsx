import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/features/localization/locale-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Click Klinik | Everyday Telehealth for Filipino Families",
  description:
    "A Filipino-focused telehealth companion for guided care navigation and online consultation.",
  icons: {
    icon: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/miolms.firebasestorage.app/o/click-klinik%2Flogo-circle.jpg?alt=media&token=704ab2aa-de27-4425-86f8-48d8e13ddc1e",
        type: "image/jpeg",
      },
    ],
    apple: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/miolms.firebasestorage.app/o/click-klinik%2Flogo-circle.jpg?alt=media&token=704ab2aa-de27-4425-86f8-48d8e13ddc1e",
        type: "image/jpeg",
      },
    ],
  },
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
