import { EPHSLogo } from "@/components/EPHSLogo";

/**
 * Focused shell for sign-in and onboarding: a slim brand bar and a centered
 * content column, with no sidebar or footer chrome competing for attention.
 */
export default function FocusedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ep-bg">
      <header className="flex h-16 items-center border-b border-ep-border/70 px-4 sm:px-6">
        <EPHSLogo />
      </header>
      <main
        id="main-content"
        className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12"
      >
        {children}
      </main>
    </div>
  );
}
