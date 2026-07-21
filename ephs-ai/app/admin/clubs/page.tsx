import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { adminListClubs } from "@/lib/clubs/admin";
import { getClubCategories } from "@/lib/clubs/data";
import { WarningBanner } from "@/components/ui";
import { ClubsManager } from "@/components/admin/ClubsManager";

export const metadata: Metadata = { title: "Manage Clubs" };
export const dynamic = "force-dynamic";

export default async function AdminClubsPage() {
  await requireAdmin(); // Defense in depth; the layout already gates.
  const [{ clubs, deletedClubs, persistence }, categories] = await Promise.all([
    adminListClubs(),
    Promise.resolve(getClubCategories()),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-ep-charcoal">Manage clubs &amp; activities</h2>
        <p className="mt-0.5 text-sm text-ep-muted">
          Add, edit, activate/deactivate, and remove clubs. Changes apply
          instantly to the student Clubs page and the chatbot.
        </p>
      </div>

      {!persistence ? (
        <WarningBanner severity="info" title="Read-only">
          Supabase is not configured in this environment, so the list below is
          the official seed dataset and edits cannot be saved. Configure Supabase
          to enable club management.
        </WarningBanner>
      ) : null}

      <ClubsManager
        initialClubs={clubs}
        deletedClubs={deletedClubs}
        categories={categories}
        persistence={persistence}
      />
    </div>
  );
}
