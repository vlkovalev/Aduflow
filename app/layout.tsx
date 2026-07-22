import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { readEnv } from "../lib/env";

const siteUrl = readEnv("NEXT_PUBLIC_SITE_URL") ?? "https://aduflow.ca";

export const metadata: Metadata = {
  title: "ADUflow - ADU Pre-Construction OS",
  description:
    "Turn a property address into a preliminary feasibility screen, budget range, and builder-reviewed proposal. Built for modular ADU and garden suite builders across North America.",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "ADUflow - ADU Pre-Construction OS",
    description:
      "Preliminary feasibility, factory vs. site cost split, permit checklist, and lender draw plan for modular ADU builders.",
    siteName: "ADUflow",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ADUflow - Make backyard housing feasible, financeable, and buildable",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ADUflow - ADU Pre-Construction OS",
    description:
      "Preliminary feasibility, budget range, and permit checklist for modular ADU builders.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
