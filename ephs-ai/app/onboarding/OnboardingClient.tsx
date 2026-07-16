"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useStudent } from "@/lib/client/student-context";
import type { GradeYear, RigorPreference } from "@/lib/domain/plan-types";
import { GRADE_YEARS } from "@/lib/domain/plan-types";

/**
 * Onboarding collects only data useful for planning — no sensitive personal
 * information. Everything stays in the student's browser.
 */
export function OnboardingClient({
  pathways,
}: {
  pathways: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const { profile, setProfile, catalogList, metaReady } = useStudent();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear);
  const [currentGrade, setCurrentGrade] = useState<GradeYear>(profile.currentGrade);
  const [interests, setInterests] = useState(profile.interests.join(", "));
  const [careers, setCareers] = useState(profile.careerIdeas.join(", "));
  const [rigor, setRigor] = useState<RigorPreference>(profile.rigor);
  const [apInterest, setApInterest] = useState(profile.apInterest);
  const [pathwayIds, setPathwayIds] = useState<string[]>(profile.pathwayIds);
  const [completed, setCompleted] = useState<string[]>(profile.completedCourseIds);
  const [historyQuery, setHistoryQuery] = useState("");

  const historyMatches = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return catalogList
      .filter((c) => c.title.toLowerCase().includes(q) && !completed.includes(c.id))
      .slice(0, 6);
  }, [historyQuery, catalogList, completed]);

  const titleOf = (id: string) =>
    catalogList.find((c) => c.id === id)?.title ?? id;

  function save(e: React.FormEvent) {
    e.preventDefault();
    setProfile({
      ...profile,
      displayName: displayName.trim(),
      graduationYear,
      currentGrade,
      interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
      careerIdeas: careers.split(",").map((s) => s.trim()).filter(Boolean),
      rigor,
      apInterest,
      pathwayIds,
      completedCourseIds: completed,
      onboardingCompleted: true,
    });
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ep-charcoal">
          Set up your planning profile
        </h1>
        <p className="mt-1 text-sm text-ep-muted">
          Only planning-relevant info — it stays in your browser and is never
          sent with your name attached.
        </p>
      </div>

      <form onSubmit={save} className="space-y-5 rounded-xl border border-ep-border-soft bg-white p-6 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ob-name" className="block text-sm font-semibold text-ep-charcoal">
              Display name <span className="font-normal text-ep-faint">(optional)</span>
            </label>
            <input
              id="ob-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-md border border-ep-border px-3 py-2 text-sm"
              placeholder="How the app greets you"
            />
          </div>
          <div>
            <label htmlFor="ob-grade" className="block text-sm font-semibold text-ep-charcoal">
              Current grade
            </label>
            <select
              id="ob-grade"
              value={currentGrade}
              onChange={(e) => {
                const g = Number(e.target.value) as GradeYear;
                setCurrentGrade(g);
                setGraduationYear(2026 + (12 - g) + 1);
              }}
              className="mt-1 w-full rounded-md border border-ep-border bg-white px-3 py-2 text-sm"
            >
              {GRADE_YEARS.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ob-gradyear" className="block text-sm font-semibold text-ep-charcoal">
              Graduation year
            </label>
            <select
              id="ob-gradyear"
              value={graduationYear}
              onChange={(e) => setGraduationYear(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-ep-border bg-white px-3 py-2 text-sm"
            >
              {[2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y}>
                  Class of {y}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ep-faint">
              Graduation rules differ for the Class of 2027 vs 2028 and beyond.
            </p>
          </div>
          <div>
            <label htmlFor="ob-rigor" className="block text-sm font-semibold text-ep-charcoal">
              Preferred challenge level
            </label>
            <select
              id="ob-rigor"
              value={rigor}
              onChange={(e) => setRigor(e.target.value as RigorPreference)}
              className="mt-1 w-full rounded-md border border-ep-border bg-white px-3 py-2 text-sm"
            >
              <option value="standard">Keep it manageable</option>
              <option value="balanced">Balanced</option>
              <option value="challenging">Challenge me</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="ob-interests" className="block text-sm font-semibold text-ep-charcoal">
            Interests <span className="font-normal text-ep-faint">(comma separated)</span>
          </label>
          <input
            id="ob-interests"
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="mt-1 w-full rounded-md border border-ep-border px-3 py-2 text-sm"
            placeholder="e.g. robotics, theatre, sports medicine"
          />
        </div>

        <div>
          <label htmlFor="ob-careers" className="block text-sm font-semibold text-ep-charcoal">
            Possible careers or majors <span className="font-normal text-ep-faint">(optional)</span>
          </label>
          <input
            id="ob-careers"
            type="text"
            value={careers}
            onChange={(e) => setCareers(e.target.value)}
            className="mt-1 w-full rounded-md border border-ep-border px-3 py-2 text-sm"
            placeholder="e.g. nursing, mechanical engineering"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-ep-charcoal">
            Pathway interests
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {pathways.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm text-ep-ink">
                <input
                  type="checkbox"
                  checked={pathwayIds.includes(p.id)}
                  onChange={(e) =>
                    setPathwayIds((prev) =>
                      e.target.checked
                        ? [...prev, p.id]
                        : prev.filter((id) => id !== p.id),
                    )
                  }
                  className="h-4 w-4 rounded border-ep-border accent-[#D8272E]"
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm text-ep-ink">
          <input
            type="checkbox"
            checked={apInterest}
            onChange={(e) => setApInterest(e.target.checked)}
            className="h-4 w-4 rounded border-ep-border accent-[#D8272E]"
          />
          I&apos;m interested in AP / Honors coursework
        </label>

        <div>
          <label htmlFor="ob-history" className="block text-sm font-semibold text-ep-charcoal">
            Courses you&apos;ve completed or are taking now
          </label>
          <input
            id="ob-history"
            type="search"
            value={historyQuery}
            onChange={(e) => setHistoryQuery(e.target.value)}
            disabled={!metaReady}
            className="mt-1 w-full rounded-md border border-ep-border px-3 py-2 text-sm"
            placeholder={metaReady ? "Search the catalog…" : "Loading catalog…"}
          />
          {historyMatches.length > 0 ? (
            <ul className="mt-2 divide-y divide-ep-border-soft rounded-md border border-ep-border">
              {historyMatches.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 p-2 text-sm">
                  <span>{m.title}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCompleted((prev) => [...prev, m.id]);
                      setHistoryQuery("");
                    }}
                    className="rounded-md bg-ep-red px-2.5 py-1 text-xs font-semibold text-white hover:bg-ep-red-dark"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {completed.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {completed.map((id) => (
                <li key={id}>
                  <span className="inline-flex items-center gap-1 rounded-full border border-ep-border bg-ep-bg px-2.5 py-1 text-xs text-ep-ink">
                    {titleOf(id)}
                    <button
                      type="button"
                      aria-label={`Remove ${titleOf(id)}`}
                      onClick={() => setCompleted((prev) => prev.filter((c) => c !== id))}
                      className="text-ep-faint hover:text-ep-red-dark"
                    >
                      <X aria-hidden className="h-3 w-3" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-ep-red px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark"
          >
            Save and continue
          </button>
        </div>
      </form>
    </div>
  );
}
