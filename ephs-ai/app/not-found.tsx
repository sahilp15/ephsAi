import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState
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
  );
}
