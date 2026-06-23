import Link from "next/link";
import { Logo } from "@/components/Logo";
import { brand } from "@/config/brand";
import { helpCards, howItWorks, quickActions } from "@/config/content";

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-scarlet-tint/60 to-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center sm:py-24">
          <Logo size={56} showWordmark={false} className="mb-6" />
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
            {brand.shortName} Assistant
          </h1>
          <p className="mt-3 max-w-2xl text-lg font-semibold text-scarlet sm:text-xl">
            {brand.tagline}
          </p>
          <p className="mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
            {brand.description}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-scarlet px-8 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-scarlet/90"
            >
              Ask the Assistant →
            </Link>
            <a
              href={brand.links.counselorBooking}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-4 text-base font-semibold text-ink transition hover:border-scarlet"
            >
              Meet a counselor
            </a>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            No login. No accounts. Zero personal data collected.
          </p>
        </div>
      </section>

      {/* Quick actions */}
      <section
        aria-labelledby="quick-heading"
        className="mx-auto max-w-5xl px-4 py-12"
      >
        <h2
          id="quick-heading"
          className="text-center text-sm font-semibold uppercase tracking-wide text-gray-500"
        >
          Jump right in
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickActions.map((a) => (
            <li key={a.label}>
              <Link
                href={`/chat?prompt=${encodeURIComponent(a.prompt)}`}
                className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-5 text-center transition hover:border-scarlet hover:bg-scarlet-tint"
              >
                <span className="text-2xl" aria-hidden="true">
                  {a.icon}
                </span>
                <span className="text-sm font-semibold text-ink">
                  {a.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Help cards */}
      <section
        aria-labelledby="help-heading"
        className="mx-auto max-w-5xl px-4 py-12"
      >
        <h2
          id="help-heading"
          className="text-center text-2xl font-bold text-ink sm:text-3xl"
        >
          What can it help with?
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
      <section
        aria-labelledby="how-heading"
        className="mx-auto max-w-5xl px-4 py-12"
      >
        <h2
          id="how-heading"
          className="text-center text-2xl font-bold text-ink sm:text-3xl"
        >
          How it works
        </h2>
        <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {howItWorks.map((s) => (
            <li key={s.step} className="rounded-2xl bg-scarlet-tint p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-scarlet text-lg font-bold text-white">
                {s.step}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-700">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Disclaimer band */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-scarlet/20 bg-scarlet-tint p-6 text-center sm:p-8">
          <p className="text-base text-ink sm:text-lg">
            <span className="font-semibold">
              The {brand.shortName} Assistant is a student-built helper, not an
              official {brand.school.shortName} source.
            </span>{" "}
            Always confirm important decisions with your counselor.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-20 text-center">
        <h2 className="text-2xl font-bold text-ink">Ready to ask?</h2>
        <Link
          href="/chat"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-scarlet px-8 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-scarlet/90"
        >
          Ask the Assistant →
        </Link>
      </section>
    </div>
  );
}
