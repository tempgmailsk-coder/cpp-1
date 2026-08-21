import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ORG_NAME, TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: `${ORG_NAME} (CPP) — Membership & Positions Portal`,
    template: `%s · ${ORG_NAME} (CPP)`,
  },
  description: `Official membership registration and internal position-application portal of the ${ORG_NAME}. ${TAGLINE}`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
