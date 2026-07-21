import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Club, ClubsDataset } from "./types";

/**
 * Seed clubs store.
 *
 * The official-grounded seed dataset (`data/ephs-clubs.json`) is loaded once
 * per server process and cached in memory, exactly like the course catalog
 * (`lib/catalog/store.ts`). Administrator edits are layered on top at read time
 * by `lib/clubs/store.ts` (Supabase overlay); this module is the always-present
 * baseline that also lets the app run with no database configured.
 */

let dataset: ClubsDataset | null = null;

export function getClubsDataset(): ClubsDataset {
  if (!dataset) {
    const file = path.join(process.cwd(), "data", "ephs-clubs.json");
    dataset = JSON.parse(fs.readFileSync(file, "utf8")) as ClubsDataset;
  }
  return dataset;
}

/** All seed clubs (including inactive). */
export function getSeedClubs(): Club[] {
  return getClubsDataset().clubs;
}

export function getClubCategories(): string[] {
  return getClubsDataset().categories;
}

/** Turn a club name into a stable slug id (matches the seed generator). */
export function clubSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
