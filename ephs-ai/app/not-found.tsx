import Link from "next/link";
import { Compass } from "lucide-react";
import { EPHSLogo } from "@/components/EPHSLogo";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-ep-bg">
      <header className="flex h-16 items-center border-b border-ep-border/70 px-4 sm:px-6">
        <EPHSLogo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <EmptyState
            icon={Compass}
            title="Page not found"
            action={
              <Link
                href="/"
                className="rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark"
              >
                Back to home
              </Link>
            }
          >
            The page or course you&apos;re looking for doesn&apos;t exist in the
            current guide.
          </EmptyState>
        </div>
      </main>
    </div>
  );
}
