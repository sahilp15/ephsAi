import Link from "next/link";
import { brand } from "@/config/brand";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-600 sm:flex-row">
        <p>
          {brand.madeBy}{" "}
          <span className="text-gray-400">Go {brand.school.mascot}.</span>
        </p>
        <nav aria-label="Footer" className="flex items-center gap-4">
          <Link href="/about" className="hover:text-scarlet">
            About
          </Link>
          <Link href="/feedback" className="hover:text-scarlet">
            Feedback
          </Link>
          <a
            href={brand.links.officialSite}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-scarlet"
          >
            Official {brand.school.shortName} site ↗
          </a>
        </nav>
      </div>
    </footer>
  );
}
