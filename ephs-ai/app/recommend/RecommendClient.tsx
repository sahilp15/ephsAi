"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useStudent } from "@/lib/client/student-context";
import type { RecommendationResponse } from "@/lib/ai/schema";
import {
  CounselorVerificationNotice,
  SourceCitation,
  WarningBanner,
} from "@/components/ui";
import clsx from "clsx";

interface ApiResult {
  mode: "ai" | "smart_match";
  model?: string;
  response: RecommendationResponse;
}

const HISTORY_KEY = "ephs-ai:recommendations:v1";

interface HistoryItem {
  question: string;
  mode: string;
  at: string;
  summary: string;
}

const ELIGIBILITY_STYLE: Record<string, string> = {
  eligible: "bg-emerald-50 text-emerald-800 border-emerald-200",
  possibly_eligible: "bg-amber-50 text-amber-800 border-amber-200",
  not_currently_eligible: "bg-ep-red-soft text-ep-red-dark border-ep-red/30",
  counselor_verification_required: "bg-ep-bg text-ep-ink border-ep-border",
};

const ELIGIBILITY_LABEL: Record<string, string> = {
  eligible: "Eligible",
  possibly_eligible: "Possibly eligible",
  not_currently_eligible: "Not currently eligible",
  counselor_verification_required: "Counselor verification required",
};

export function RecommendClient({ aiConfigured }: { aiConfigured: boolean }) {
  const searchParams = useSearchParams();
  const { profile, plan, catalogMeta } = useStudent();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const about = searchParams.get("about");
    if (about) setMessage(`Tell me about ${about}. Would it be a good fit for me?`);
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw) as HistoryItem[]);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          profile: {
            graduationYear: profile.graduationYear,
            currentGrade: profile.currentGrade,
            interests: profile.interests,
            careerIdeas: profile.careerIdeas,
            rigor: profile.rigor,
            apInterest: profile.apInterest,
            pathwayIds: profile.pathwayIds,
          },
          completedCourseIds: profile.completedCourseIds,
          plannedCourseIds: plan.map((p) => p.courseId),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as ApiResult;
      setResult(data);
      const item: HistoryItem = {
        question: message.trim(),
        mode: data.mode,
        at: new Date().toISOString(),
        summary: data.response.summary,
      };
      setHistory((prev) => {
        const next = [item, ...prev].slice(0, 10);
        try {
          window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const examples = [
    "I am interested in medicine and engineering. What should I consider for 11th grade?",
    "I want one AP class but do not want an overloaded schedule.",
    "What courses support the Business & Management pathway?",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ep-charcoal">
          <Sparkles aria-hidden className="h-6 w-6 text-ep-red" />
          EPHS AI Advisor
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ep-muted">
          Ask in plain language. Every recommendation is a real course from the
          2026-27 guide, checked by the school&apos;s deterministic rules
          engine and cited page by page.
        </p>
      </div>

      {!aiConfigured ? (
        <WarningBanner severity="info" title="Smart match mode active">
          The AI model is not configured, so recommendations use the built-in
          deterministic matcher. Everything remains grounded in the official
          guide.
        </WarningBanner>
      ) : null}

      {!profile.onboardingCompleted ? (
        <WarningBanner severity="info" title="Better results with a profile">
          <Link href="/onboarding" className="font-semibold text-ep-red-dark underline">
            Set up your profile
          </Link>{" "}
          (grade, interests, completed courses) so recommendations can be
          personalized and eligibility-checked.
        </WarningBanner>
      ) : null}

      <form onSubmit={submit} className="rounded-xl border border-ep-border-soft bg-white p-4 shadow-card">
        <label htmlFor="question" className="text-sm font-semibold text-ep-charcoal">
          Your question
        </label>
        <textarea
          id="question"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="e.g. I love robotics and want to become a mechanical engineer. What should I take next year?"
          className="mt-2 w-full rounded-md border border-ep-border px-3 py-2 text-sm"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setMessage(ex)}
                className="rounded-full border border-ep-border bg-ep-bg px-3 py-1 text-xs text-ep-muted hover:border-ep-red hover:text-ep-red-dark"
              >
                {ex.length > 48 ? `${ex.slice(0, 48)}…` : ex}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark disabled:opacity-50"
          >
            {loading ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <Send aria-hidden className="h-4 w-4" />
            )}
            {loading ? "Thinking…" : "Get recommendations"}
          </button>
        </div>
      </form>

      {error ? (
        <WarningBanner severity="error" title="Recommendation request failed">
          {error} The catalog and planner remain fully available.
        </WarningBanner>
      ) : null}

      {result ? (
        <section aria-label="Recommendations" className="space-y-4">
          <div className="rounded-xl border border-ep-border-soft bg-white p-4 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wide text-ep-faint">
              {result.mode === "ai" ? "AI advisor" : "Smart match mode"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ep-ink">
              {result.response.summary}
            </p>
          </div>

          {result.response.recommendations.length === 0 ? (
            <WarningBanner severity="info" title="No matching courses">
              Try describing your interests differently, or browse the catalog.
            </WarningBanner>
          ) : (
            <ol className="space-y-4">
              {result.response.recommendations.map((rec) => {
                const meta = catalogMeta.get(rec.courseId);
                return (
                  <li
                    key={rec.courseId}
                    className="rounded-xl border border-ep-border-soft bg-white p-5 shadow-card"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-ep-faint">
                          #{rec.rank}
                        </p>
                        <h2 className="text-base font-bold text-ep-charcoal">
                          <Link href={`/courses/${rec.courseId}`} className="hover:text-ep-red-dark">
                            {meta?.title ?? rec.courseId}
                          </Link>
                        </h2>
                        {meta ? (
                          <p className="text-xs text-ep-muted">
                            {meta.department} · Grades {meta.grades.join(", ")} ·
                            Credits {meta.creditsRaw ?? "see guide"}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={clsx(
                          "rounded-full border px-2.5 py-1 text-xs font-semibold",
                          ELIGIBILITY_STYLE[rec.eligibilityStatus],
                        )}
                      >
                        {ELIGIBILITY_LABEL[rec.eligibilityStatus]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-ep-ink">{rec.fitSummary}</p>
                    <p className="mt-1 text-sm text-ep-muted">{rec.whyItMatches}</p>
                    {rec.prerequisiteExplanation ? (
                      <p className="mt-2 text-sm text-ep-muted">
                        <span className="font-semibold text-ep-ink">Prerequisites: </span>
                        {rec.prerequisiteExplanation}
                      </p>
                    ) : null}
                    {rec.graduationOrPathwayValue ? (
                      <p className="mt-1 text-sm text-ep-muted">
                        <span className="font-semibold text-ep-ink">Requirement / pathway value: </span>
                        {rec.graduationOrPathwayValue}
                      </p>
                    ) : null}
                    {rec.planningConsiderations ? (
                      <p className="mt-1 text-sm text-ep-muted">
                        <span className="font-semibold text-ep-ink">Planning: </span>
                        {rec.planningConsiderations}
                      </p>
                    ) : null}
                    {rec.alternativeCourseIds.length > 0 ? (
                      <p className="mt-1 text-sm text-ep-muted">
                        <span className="font-semibold text-ep-ink">Alternatives: </span>
                        {rec.alternativeCourseIds.map((id, i) => (
                          <span key={id}>
                            {i > 0 ? ", " : ""}
                            <Link href={`/courses/${id}`} className="text-ep-red-dark hover:underline">
                              {catalogMeta.get(id)?.title ?? id}
                            </Link>
                          </span>
                        ))}
                      </p>
                    ) : null}
                    <SourceCitation pages={rec.sourcePages} className="mt-3" />
                  </li>
                );
              })}
            </ol>
          )}

          {result.response.questionsForStudent.length > 0 ? (
            <div className="rounded-xl border border-ep-border-soft bg-white p-4 shadow-card">
              <h2 className="text-sm font-bold text-ep-charcoal">To refine these suggestions</h2>
              <ul className="mt-1 list-inside list-disc text-sm text-ep-muted">
                {result.response.questionsForStudent.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.response.counselorVerificationItems.length > 0 ? (
            <WarningBanner severity="info" title="Verify with your counselor">
              <ul className="list-inside list-disc">
                {result.response.counselorVerificationItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </WarningBanner>
          ) : null}
        </section>
      ) : null}

      {history.length > 0 && !result ? (
        <section aria-label="Recent questions">
          <h2 className="text-sm font-bold text-ep-charcoal">Recent questions</h2>
          <ul className="mt-2 space-y-1.5">
            {history.map((h) => (
              <li key={h.at}>
                <button
                  type="button"
                  onClick={() => setMessage(h.question)}
                  className="w-full rounded-lg border border-ep-border-soft bg-white p-3 text-left text-sm text-ep-ink shadow-card hover:border-ep-red"
                >
                  <span className="font-medium">{h.question}</span>
                  <span className="mt-0.5 block text-xs text-ep-faint">
                    {new Date(h.at).toLocaleString()} ·{" "}
                    {h.mode === "ai" ? "AI advisor" : "Smart match"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CounselorVerificationNotice />
    </div>
  );
}
