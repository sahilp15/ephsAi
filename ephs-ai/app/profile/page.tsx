import type { Metadata } from "next";
import { getPathways } from "@/lib/catalog/store";
import { requireStudent } from "@/lib/auth/session";
import { loadOnboardingDraft } from "@/lib/data/onboarding";
import { OnboardingWizard } from "../onboarding/OnboardingWizard";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Profile & Settings" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireStudent();
  const [draft, pathways] = await Promise.all([
    loadOnboardingDraft(user.id),
    Promise.resolve(getPathways().map((p) => ({ id: p.id, name: p.name }))),
  ]);
  const firstName = draft.preferredFirstName || user.displayName.split(" ")[0] || "";
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Profile & settings"
        title="Update your information"
        lede="Change your goals, interests, rigor, or student type anytime. Your plan and recommendations update to match."
      />
      <OnboardingWizard initialDraft={draft} pathways={pathways} firstName={firstName} />
    </div>
  );
}
