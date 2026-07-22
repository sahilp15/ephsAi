"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Upload,
} from "lucide-react";
import { ChipInput } from "@/components/forms/ChipInput";
import type { OnboardingDraft } from "@/lib/data/onboarding";
import { autosaveOnboarding, completeOnboarding } from "./actions";

const PROGRAMS = [
  { id: "honors", label: "Honors" },
  { id: "ap", label: "Advanced Placement (AP)" },
  { id: "cis", label: "College in the Schools (CIS)" },
  { id: "pseo", label: "PSEO" },
  { id: "ep_online", label: "EP Online" },
] as const;

const POST_GRAD = [
  { id: "four_year", label: "Four-year college" },
  { id: "two_year", label: "Two-year college" },
  { id: "technical", label: "Technical program" },
  { id: "workforce", label: "Workforce" },
  { id: "military", label: "Military" },
  { id: "undecided", label: "Undecided" },
] as const;

const STEPS = [
  "About you",
  "Goals & interests",
  "Rigor & programs",
  "Life & plans",
  "Your history",
  "Review",
];

export function OnboardingWizard({
  initialDraft,
  pathways,
  firstName,
  demo = false,
}: {
  initialDraft: OnboardingDraft;
  pathways: { id: string; name: string }[];
  firstName: string;
  /**
   * Demo mode renders the exact student onboarding UI but never touches the
   * database or the authenticated server actions. Used by the public `/demo`
   * preview so the student experience can be shown without a real sign-in.
   */
  demo?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = useCallback(<K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);

  // Debounced autosave whenever the draft changes. Skipped entirely in demo
  // mode, which has no authenticated session to save against.
  useEffect(() => {
    if (demo) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      const res = await autosaveOnboarding(draft, step);
      setSaveState(res.ok ? "saved" : "error");
    }, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function toggleArray(key: keyof OnboardingDraft, value: string) {
    const arr = (draft[key] as string[]) ?? [];
    set(
      key,
      (arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]) as never,
    );
  }

  async function next() {
    if (!demo) {
      setSaveState("saving");
      const res = await autosaveOnboarding(draft, step + 1);
      setSaveState(res.ok ? "saved" : "error");
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    // In demo mode there is nothing to persist — go straight to the demo
    // dashboard so the reviewer can see where onboarding lands a student.
    if (demo) {
      router.push("/demo/dashboard");
      return;
    }
    const res = await completeOnboarding(draft);
    if (!res.ok) {
      setSubmitError("We couldn't save your onboarding. Please try again.");
      setSubmitting(false);
      return;
    }
    if (res.studentType === "returning") {
      router.push("/transcript?from=onboarding");
    } else {
      router.push("/dashboard");
    }
  }

  const canContinue = step !== 4 || draft.studentType !== null;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <p className="kicker text-ep-red">
            Step {step + 1} of {STEPS.length}
          </p>
          <SaveIndicator state={saveState} />
        </div>
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-ep-red" : "bg-ep-border"
              }`}
            />
          ))}
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold uppercase leading-none text-ep-charcoal sm:text-4xl">
          {STEPS[step]}
        </h1>
      </div>

      <div className="rounded-2xl border border-ep-border-soft bg-white p-5 shadow-card sm:p-6">
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-ep-muted">
              Welcome{firstName ? `, ${firstName}` : ""}! Let&apos;s set up your
              EPHS AI plan. You can change any of this later from your profile.
            </p>
            <Field label="Preferred first name">
              <input
                className={inputClass}
                value={draft.preferredFirstName}
                onChange={(e) => set("preferredFirstName", e.target.value)}
                placeholder="What should we call you?"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Current grade">
                <select
                  className={inputClass}
                  value={draft.currentGrade}
                  onChange={(e) => {
                    const g = Number(e.target.value);
                    set("currentGrade", g);
                    set("graduationYear", 2027 + (12 - g));
                  }}
                >
                  {[9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Expected graduation year">
                <select
                  className={inputClass}
                  value={draft.graduationYear}
                  onChange={(e) => set("graduationYear", Number(e.target.value))}
                >
                  {[2026, 2027, 2028, 2029, 2030, 2031].map((y) => (
                    <option key={y} value={y}>
                      Class of {y}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Current school">
                <input
                  className={inputClass}
                  value={draft.currentSchool}
                  onChange={(e) => set("currentSchool", e.target.value)}
                />
              </Field>
              <Field label="Counselor (if known)">
                <input
                  className={inputClass}
                  value={draft.counselorName}
                  onChange={(e) => set("counselorName", e.target.value)}
                  placeholder="Optional"
                />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Field label="What are your academic or career goals?">
              <textarea
                className={`${inputClass} min-h-[90px]`}
                value={draft.goals}
                onChange={(e) => set("goals", e.target.value)}
                placeholder="e.g. I want to study engineering and take challenging math and science courses."
              />
            </Field>
            <ChipInput
              label="Possible college or career interests"
              values={draft.collegeCareerInterests}
              onChange={(v) => set("collegeCareerInterests", v)}
              placeholder="e.g. engineering, nursing, business"
              suggestions={["Engineering", "Health sciences", "Business", "Computer science", "Arts", "Education"]}
            />
            <ChipInput
              label="Favorite subjects"
              values={draft.favoriteSubjects}
              onChange={(v) => set("favoriteSubjects", v)}
              suggestions={["Math", "Science", "English", "History", "Art", "World Language", "Technology"]}
            />
            <ChipInput
              label="Subjects you find challenging"
              values={draft.challengingSubjects}
              onChange={(v) => set("challengingSubjects", v)}
              suggestions={["Math", "Science", "English", "History", "World Language"]}
            />
            <ChipInput
              label="Interests & activities (keywords)"
              values={draft.interests}
              onChange={(v) => set("interests", v)}
              placeholder="e.g. robotics, theatre, coding"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field label="How rigorous do you want your schedule to feel?">
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["rigorous", "Rigorous", "Challenge me"],
                    ["balanced", "Balanced", "A healthy mix"],
                    ["lighter", "Lighter", "Keep it manageable"],
                  ] as const
                ).map(([value, title, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("schedulePreference", value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      draft.schedulePreference === value
                        ? "border-ep-red bg-ep-red-soft"
                        : "border-ep-border bg-white hover:border-ep-red/40"
                    }`}
                  >
                    <p className="font-semibold text-ep-charcoal">{title}</p>
                    <p className="text-xs text-ep-muted">{hint}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Which programs are you interested in?">
              <div className="flex flex-wrap gap-2">
                {PROGRAMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleArray("programInterests", p.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      draft.programInterests.includes(p.id)
                        ? "border-ep-red bg-ep-red text-white"
                        : "border-ep-border bg-white text-ep-ink hover:border-ep-red/40"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>

            <label className="flex items-center gap-2 text-sm text-ep-ink">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#D8272E]"
                checked={draft.apInterest}
                onChange={(e) => set("apInterest", e.target.checked)}
              />
              I&apos;m interested in taking AP courses
            </label>

            <Field label="Pathways you're curious about">
              <div className="grid gap-2 sm:grid-cols-2">
                {pathways.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 rounded-md border border-ep-border-soft bg-ep-bg/50 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#D8272E]"
                      checked={draft.pathwayIds.includes(p.id)}
                      onChange={() => toggleArray("pathwayIds", p.id)}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <ChipInput
              label="Sports, clubs, jobs, or family responsibilities"
              values={draft.commitments}
              onChange={(v) => set("commitments", v)}
              placeholder="e.g. varsity soccer, part-time job, caring for siblings"
              suggestions={["Sports", "Music", "Theatre", "Part-time job", "Family responsibilities", "Volunteering"]}
            />
            <p className="text-xs text-ep-muted">
              These help us avoid overloading your schedule during busy seasons.
            </p>
            <Field label="After high school, you're most likely to…">
              <div className="grid gap-2 sm:grid-cols-2">
                {POST_GRAD.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set("postGradPlan", p.id)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      draft.postGradPlan === p.id
                        ? "border-ep-red bg-ep-red-soft text-ep-red-dark"
                        : "border-ep-border bg-white text-ep-ink hover:border-ep-red/40"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-ep-muted">
              Have you already completed any high school courses? This tells us
              whether to start your plan fresh or import your history.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => set("studentType", "new")}
                className={`rounded-xl border-2 p-4 text-left transition-colors ${
                  draft.studentType === "new"
                    ? "border-ep-red bg-ep-red-soft"
                    : "border-ep-border bg-white hover:border-ep-red/40"
                }`}
              >
                <GraduationCap className="h-6 w-6 text-ep-red" aria-hidden />
                <p className="mt-2 font-display text-lg font-bold uppercase text-ep-charcoal">
                  New student
                </p>
                <p className="mt-1 text-sm text-ep-muted">
                  I&apos;m starting with an empty academic history. Build my plan
                  from scratch.
                </p>
              </button>
              <button
                type="button"
                onClick={() => set("studentType", "returning")}
                className={`rounded-xl border-2 p-4 text-left transition-colors ${
                  draft.studentType === "returning"
                    ? "border-ep-red bg-ep-red-soft"
                    : "border-ep-border bg-white hover:border-ep-red/40"
                }`}
              >
                <Upload className="h-6 w-6 text-ep-red" aria-hidden />
                <p className="mt-2 font-display text-lg font-bold uppercase text-ep-charcoal">
                  Current / returning
                </p>
                <p className="mt-1 text-sm text-ep-muted">
                  I&apos;ve completed courses already. I&apos;ll upload my
                  transcript so they&apos;re added automatically.
                </p>
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-ep-muted">
              Review your answers. You can go back to edit anything, or finish
              and start planning.
            </p>
            <ReviewRow label="Name">{draft.preferredFirstName || "—"}</ReviewRow>
            <ReviewRow label="Grade / Class">
              Grade {draft.currentGrade} · Class of {draft.graduationYear}
            </ReviewRow>
            <ReviewRow label="Goals">{draft.goals || "—"}</ReviewRow>
            <ReviewRow label="Interests">
              {[...draft.collegeCareerInterests, ...draft.interests].join(", ") || "—"}
            </ReviewRow>
            <ReviewRow label="Schedule preference">{draft.schedulePreference}</ReviewRow>
            <ReviewRow label="Programs">
              {draft.programInterests
                .map((p) => PROGRAMS.find((x) => x.id === p)?.label ?? p)
                .join(", ") || "—"}
            </ReviewRow>
            <ReviewRow label="After high school">
              {POST_GRAD.find((p) => p.id === draft.postGradPlan)?.label ?? "—"}
            </ReviewRow>
            <ReviewRow label="Student type">
              {draft.studentType === "returning"
                ? "Current / returning — will upload transcript"
                : draft.studentType === "new"
                  ? "New student"
                  : "Not selected"}
            </ReviewRow>
            {submitError ? (
              <div role="alert" className="rounded-r-lg border-l-4 border-ep-red bg-ep-red-soft p-3 text-sm text-ep-red-dark">
                {submitError}
              </div>
            ) : null}
          </div>
        )}

        {/* Controls */}
        <div className="mt-6 flex items-center justify-between border-t border-ep-border-soft pt-4">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-ep-muted transition-colors hover:text-ep-charcoal disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canContinue}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark disabled:opacity-50"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting || draft.studentType === null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {draft.studentType === "returning" ? "Finish & upload transcript" : "Finish & start planning"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-ep-border bg-white px-3 py-2 text-sm text-ep-charcoal outline-none focus:border-ep-red";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ep-charcoal">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-ep-border-soft py-2 text-sm last:border-0">
      <span className="w-40 flex-shrink-0 font-semibold text-ep-faint">{label}</span>
      <span className="text-ep-ink">{children}</span>
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  if (state === "saving")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ep-muted">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  if (state === "saved")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <Check className="h-3 w-3" /> Saved
      </span>
    );
  if (state === "error")
    return <span className="text-xs text-ep-red-dark">Couldn&apos;t save</span>;
  return null;
}
