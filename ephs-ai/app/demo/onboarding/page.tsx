import type { Metadata } from "next";
import { getPathways } from "@/lib/catalog/store";
import { emptyDraft } from "@/lib/data/onboarding";
import { DemoBanner } from "@/components/DemoBanner";
import { OnboardingWizard } from "@/app/onboarding/OnboardingWizard";

export const metadata: Metadata = { title: "Onboarding Demo" };

/**
 * No-login preview of the student onboarding wizard. Renders the exact same
 * `OnboardingWizard` the authenticated flow uses, in `demo` mode so it never
 * autosaves or calls the server actions. Pathways come from the static course
 * catalog (no database), so this works with or without Supabase configured.
 */
export default function DemoOnboardingPage() {
  const pathways = getPathways().map((p) => ({ id: p.id, name: p.name }));
  const draft = emptyDraft({ preferredFirstName: "Alex", currentGrade: 9 });

  return (
    <div className="space-y-6">
      <DemoBanner />
      <OnboardingWizard
        initialDraft={draft}
        pathways={pathways}
        firstName="Alex"
        demo
      />
    </div>
  );
}
