import type { Metadata } from "next";
import { EPHSHeader } from "@/components/EPHSHeader";
import { Footer } from "@/components/Footer";
import { StudentProvider } from "@/lib/client/student-context";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EPHS AI — Course Planning for Eden Prairie High School",
    template: "%s · EPHS AI",
  },
  description:
    "Explore the official 2026-27 EPHS course catalog, build a four-year plan, and get grounded, source-cited course recommendations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
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
