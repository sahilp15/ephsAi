import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `About — ${brand.name}`,
  description: `What ${brand.name} is and how it stays safe and accurate.`,
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        About {brand.name}
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-gray-700">
        The {brand.name} is a friendly, student-built guide for{" "}
        {brand.school.name} ({brand.school.shortName}) {brand.school.mascot} —
        for students and families alike. With around 2,800 students and 425+
        courses, it's easy to feel lost in the details: which classes to take,
        how many credits you need, how to change your schedule, what clubs exist,
        and who to email. The {brand.name} makes those answers easy to find, in
        plain language, any time of day — so families spend less time hunting
        through pages and more time making good decisions. Every answer comes
        from official EPHS information and links back to the real source, and it
        always points you to a real counselor for the big decisions. It's a head
        start, not a replacement for the people who know you.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-ink">
          How {brand.name} stays safe and accurate
        </h2>
        <ul className="mt-4 space-y-4 text-gray-700">
          <li>
            <strong className="text-ink">Grounded in official info.</strong>{" "}
            {brand.name} answers only from a knowledge base built from
            public, official EPHS material — it doesn't make facts up. If it
            doesn't know, it says so and points you to the right office and the
            official website.
          </li>
          <li>
            <strong className="text-ink">Always links the source.</strong>{" "}
            When an answer is based on an official page, {brand.name} shows the
            link so you can verify it yourself.
          </li>
          <li>
            <strong className="text-ink">Knows its limits.</strong> {brand.name}{" "}
            is not a counselor, doctor, or administrator. For mental health,
            safety, discipline, or legal questions, it gently points you to a real
            person and trusted resources — including the 988 Suicide &amp; Crisis
            Lifeline (call or text 988, any time).
          </li>
          <li>
            <strong className="text-ink">Zero personal data.</strong> There are
            no accounts and no logins. {brand.name} never asks for or stores your
            name, student ID, grades, or any personal details.
          </li>
          <li>
            <strong className="text-ink">Honest about what it is.</strong> {" "}
            {brand.name} is a student project — a helpful starting point, not an
            official EPHS source. Always confirm important decisions with your
            counselor.
          </li>
        </ul>
      </section>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/chat"
          className="rounded-full bg-scarlet px-6 py-3 font-semibold text-white transition hover:bg-scarlet/90"
        >
          Ask the Assistant →
        </Link>
        <Link
          href="/feedback"
          className="rounded-full border border-gray-200 px-6 py-3 font-semibold text-ink transition hover:border-scarlet"
        >
          Share feedback
        </Link>
      </div>
    </article>
  );
}
