import type { Metadata } from "next";
import {
  Barlow_Condensed,
  IBM_Plex_Mono,
  Instrument_Sans,
} from "next/font/google";
import { EPHSHeader } from "@/components/EPHSHeader";
import { Footer } from "@/components/Footer";
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
    "Chat with an assistant grounded in the official 2026-27 EPHS Course Guide, explore the full catalog, and build a four-year plan.",
};

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
      <body className="flex min-h-screen flex-col font-sans">
        <StudentProvider>
          <EPHSHeader />
          <main className="mx-auto w-full max-w-shell flex-1 px-4 py-8 sm:px-6">
            {children}
          </main>
          <Footer />
        </StudentProvider>
      </body>
    </html>
  );
}
