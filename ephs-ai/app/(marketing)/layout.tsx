import { PublicHeader } from "@/components/navigation/PublicHeader";
import { Footer } from "@/components/Footer";

/** Public marketing shell: light header on the warm paper background + footer. */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-shell flex-1 px-4 py-10 sm:px-6"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
