import type { Metadata } from "next";
import { getActiveClubs } from "@/lib/clubs/store";
import { getClubCategories } from "@/lib/clubs/data";
import { meetingDaysOf } from "@/lib/clubs/search";
import { PageHeader } from "@/components/ui";
import { ClubsExplorer } from "./ClubsExplorer";

export const metadata: Metadata = { title: "Clubs" };

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export default async function ClubsPage() {
  const clubs = await getActiveClubs();
  const categories = getClubCategories();
  const days = meetingDaysOf(clubs);

  // All seed records share the official source page; surface the first valid one.
  const sourceUrl = clubs.find((c) => isHttpUrl(c.sourceUrl))?.sourceUrl ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Get Involved"
        title="Clubs & Activities"
        lede="Clubs are the fastest way to find your people at EPHS — try something new, build a skill, lead a project, and turn a free hour into a highlight of your week."
      />

      <p className="max-w-2xl text-sm text-ep-muted">
        Meeting rooms and advisors marked{" "}
        <span className="italic text-ep-faint">Not listed</span> should be
        confirmed with the Activities Office. Club information comes from the
        official EPHS source
        {sourceUrl ? (
          <>
            {" "}
            (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ep-red-dark underline underline-offset-2 hover:text-ep-red"
            >
              view source
            </a>
            )
          </>
        ) : null}
        .
      </p>

      <ClubsExplorer clubs={clubs} categories={categories} meetingDays={days} />
    </div>
  );
}
