import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";

import "@/app/globals.css";
import { appName } from "@/lib/utils";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: {
    default: `${appName()} | Healthcare recruitment platform`,
    template: `%s | ${appName()}`
  },
  description:
    "Professional healthcare recruitment platform connecting doctors with hospitals and clinics."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}
