import Link from "next/link";
import { Logo } from "@/components/Logo";
import { brand } from "@/config/brand";
import { helpCards, howItWorks } from "@/config/content";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-center py-16 text-center sm:py-24">
        <Logo size={56} showWordmark={false} className="mb-6" />
        <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
          {brand.name}
        </h1>
        <p className="mt-3 text-xl font-semibold text-scarlet sm:text-2xl">
          {brand.tagline}
        </p>
        <p className="mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
          {brand.description}
        </p>
        <Link
          href="/chat"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-scarlet px-8 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-scarlet/90"
        >
          Ask {brand.name} →
        </Link>
        <p className="mt-3 text-sm text-gray-500">
          No login. No accounts. Zero personal data collected.
        </p>
      </section>

      {/* Help cards */}
      <section aria-labelledby="help-heading" className="py-12">
        <h2
          id="help-heading"
          className="text-center text-2xl font-bold text-ink sm:text-3xl"
        >
          What can {brand.name} help with?
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {helpCards.map((card) => (
            <li
              key={card.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-scarlet/30 hover:shadow-md"
            >
              <span className="text-3xl" aria-hidden="true">
                {card.icon}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-ink">
                {card.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{card.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="py-12">
        <h2
          id="how-heading"
          className="text-center text-2xl font-bold text-ink sm:text-3xl"
        >
          How it works
        </h2>
        <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {howItWorks.map((s) => (
            <li key={s.step} className="relative rounded-2xl bg-scarlet-tint p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-scarlet text-lg font-bold text-white">
                {s.step}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-700">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Disclaimer band (in-page, calm) */}
      <section className="my-12 rounded-2xl border border-scarlet/20 bg-scarlet-tint p-6 text-center sm:p-8">
        <p className="text-base text-ink sm:text-lg">
          <span className="font-semibold">
            {brand.name} is a student-built helper, not an official{" "}
            {brand.school.shortName} source.
          </span>{" "}
          Always confirm important decisions with your counselor.
        </p>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center pb-20 text-center">
        <h2 className="text-2xl font-bold text-ink">Ready to ask?</h2>
        <Link
          href="/chat"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-scarlet px-8 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-scarlet/90"
        >
          Ask {brand.name} →
        </Link>
      </section>
    </div>
  );
}
