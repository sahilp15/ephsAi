import type { Metadata } from "next";
import { getPathways } from "@/lib/catalog/store";
import { requireStudent } from "@/lib/auth/session";
import { loadOnboardingDraft } from "@/lib/data/onboarding";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata: Metadata = { title: "Get Started" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireStudent();
  const [draft, pathways] = await Promise.all([
    loadOnboardingDraft(user.id),
    Promise.resolve(getPathways().map((p) => ({ id: p.id, name: p.name }))),
  ]);
  const firstName = draft.preferredFirstName || user.displayName.split(" ")[0] || "";
  return (
    <div className="py-2">
      <OnboardingWizard initialDraft={draft} pathways={pathways} firstName={firstName} />
    </div>
  );
}
