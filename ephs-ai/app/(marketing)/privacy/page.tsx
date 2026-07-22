import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { ClearDataButton } from "./ClearDataButton";

export const metadata: Metadata = { title: "Privacy Notice" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="flex items-center gap-2.5 text-4xl font-bold leading-none text-ep-charcoal sm:text-5xl">
        <ShieldCheck aria-hidden className="h-8 w-8 text-ep-red" />
        Privacy Notice
      </h1>

      <div className="space-y-4 rounded-xl border border-ep-border-soft bg-ep-card p-6 text-sm leading-relaxed text-ep-ink shadow-card">
        <p>
          EPHS Student Helper is a course-planning tool. It is designed around
          privacy-first defaults for student users:
        </p>
        <ul className="list-inside list-disc space-y-1.5">
          <li>
            <strong>Your data stays on your device.</strong> Your profile,
            interests, course history, and four-year plan are stored in your
            own browser (localStorage). This deployment does not store them on
            a server.
          </li>
          <li>
            <strong>AI requests are anonymized.</strong> When you chat with
            the assistant, only your messages and planning context are sent:
            grade level, graduation year, interest keywords, and course
            titles/IDs. Your name, email, and counselor notes are never sent
            to the AI model.
          </li>
          <li>
            <strong>No advertising or sale of data.</strong> Student data is
            never used for advertising and never sold.
          </li>
          <li>
            <strong>Minimal collection.</strong> Onboarding asks only for
            planning-relevant information. Nothing sensitive is required.
          </li>
          <li>
            <strong>Rate limiting and logging.</strong> The assistant endpoint
            logs latency and failure categories for reliability - not the
            content of your questions tied to your identity.
          </li>
        </ul>
        <p>
          When school-managed accounts are enabled (Supabase Auth with
          row-level security), each student&apos;s records are readable and
          writable only by that student and, where sharing applies, their
          counselor. See <code>docs/SECURITY_AND_PRIVACY.md</code> in the
          repository for the full policy.
        </p>
      </div>

      <div className="rounded-xl border border-ep-border-soft bg-ep-card p-6 shadow-card">
        <h2 className="text-base font-bold text-ep-charcoal">
          Delete my planning data
        </h2>
        <p className="mt-1 text-sm text-ep-muted">
          Remove your profile, plan, and chat history from this browser. This
          cannot be undone.
        </p>
        <ClearDataButton />
      </div>
    </div>
  );
}
