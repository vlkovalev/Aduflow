import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aduflow.vercel.app";

export const metadata: Metadata = {
  title: "ADUflow — ADU Pre-Construction OS",
  description:
    "Turn any parcel into an instant feasibility check, budget range, and permit-ready proposal. Built for modular ADU and garden suite builders across North America.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "ADUflow — ADU Pre-Construction OS",
    description:
      "Instant feasibility, factory vs. site cost split, permit checklist, and lender draw plan. Built for modular ADU builders.",
    siteName: "ADUflow",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ADUflow — Make backyard housing feasible, financeable, and buildable",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ADUflow — ADU Pre-Construction OS",
    description:
      "Instant feasibility, budget range, and permit checklist for modular ADU builders.",
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
