import type { Metadata } from "next";
import {
  Barlow_Condensed,
  IBM_Plex_Mono,
  Instrument_Sans,
} from "next/font/google";
import { StudentProvider } from "@/lib/client/student-context";
import "./globals.css";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "EPHS AI - Course Planning for Eden Prairie High School",
    template: "%s · EPHS AI",
  },
  description:
    "Explore the catalog, build a four-year plan, and get answers grounded in the official 2026-27 EPHS Course Guide.",
};

/**
 * Root layout: fonts, global styles, and the client student store only.
 * The visible chrome lives in per-area shells (route-group layouts) so the
 * public site, focused flows, student app, and staff areas each get the right
 * frame.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ep-charcoal focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <StudentProvider>{children}</StudentProvider>
      </body>
    </html>
  );
}
