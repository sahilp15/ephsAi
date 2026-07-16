import Link from "next/link";
import {
  BookOpen,
  CalendarRange,
  Compass,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getCourses, getDataset, getPathways } from "@/lib/catalog/store";
import { CounselorVerificationNotice, StatCard } from "@/components/ui";

export default function LandingPage() {
  const dataset = getDataset();
  const courseCount = getCourses().length;
  const pathwayCount = getPathways().length;

  const features = [
    {
      icon: BookOpen,
      title: "Real course catalog",
      body: `Browse and search all ${courseCount} structured courses from the official 2026-27 Course Guide — descriptions, prerequisites, credits, grades, and page citations.`,
      href: "/courses",
    },
    {
      icon: CalendarRange,
      title: "Four-year planner",
      body: "Plan all four grades across EPHS's four-term year, with automatic eligibility and prerequisite checks after every change.",
      href: "/plan",
    },
    {
      icon: GraduationCap,
      title: "Requirement checks",
      body: "See verified graduation rules for your class year — including the Class of 2027 technology rule and the Class of 2028+ personal-finance rule.",
      href: "/requirements",
    },
    {
      icon: Compass,
      title: "Five official pathways",
      body: "Explore capstones and supporting courses for every EPHS pathway and see how your plan aligns.",
      href: "/pathways",
    },
    {
      icon: Sparkles,
      title: "Grounded AI advisor",
      body: "Ask for recommendations in plain language. Every suggestion is a real EPHS course with page-level citations — and a deterministic Smart match mode keeps working even without AI.",
      href: "/recommend",
    },
    {
      icon: ShieldCheck,
      title: "Privacy-first",
      body: "Your plan stays on your device. Recommendation requests carry anonymized planning context only.",
      href: "/privacy",
    },
  ];

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-ep-charcoal px-6 py-12 text-white sm:px-10 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/70">
          Eden Prairie High School
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          Plan your four years with the official{" "}
          <span className="text-[#F2A3A6]">2026-27 Course Guide</span> — and an
          advisor that cites its sources.
        </h1>
        <p className="mt-4 max-w-2xl text-white/80">
          {dataset.generated_from.document_title}: {courseCount} courses,{" "}
          {pathwayCount} official pathways, graduation rules by class year —
          all searchable, plannable, and grounded page by page.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/courses"
            className="rounded-lg bg-ep-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark"
          >
            Explore courses
          </Link>
          <Link
            href="/onboarding"
            className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Set up my profile
          </Link>
          <Link
            href="/counselor"
            className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Demo &amp; counselor view
          </Link>
        </div>
      </section>

      <section aria-label="Catalog statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Structured courses" value={courseCount} hint="From the official guide" />
        <StatCard label="Official pathways" value={pathwayCount} hint="With capstones" />
        <StatCard
          label="Source pages"
          value={dataset.generated_from.page_count}
          hint="Every fact is page-cited"
        />
        <StatCard label="Terms per year" value={4} hint="EPHS four-term model" />
      </section>

      <section aria-label="Features" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const FeatureIcon = feature.icon;
          return (
            <Link
              key={feature.title}
              href={feature.href}
              className="group rounded-xl border border-ep-border-soft bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <FeatureIcon aria-hidden className="h-6 w-6 text-ep-red" />
              <h2 className="mt-3 font-semibold text-ep-charcoal group-hover:text-ep-red-dark">
                {feature.title}
              </h2>
              <p className="mt-1.5 text-sm text-ep-muted">{feature.body}</p>
            </Link>
          );
        })}
      </section>

      <CounselorVerificationNotice />
    </div>
  );
}
