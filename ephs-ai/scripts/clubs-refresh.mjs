#!/usr/bin/env node
/**
 * Refresh the EPHS clubs dataset from the official source.
 *
 *   node scripts/clubs-refresh.mjs [path-or-url]
 *
 * The official clubs page (https://eagles.edenpr.org/clubs) is a dynamic
 * single-page app, so this script accepts EITHER:
 *   - a URL it will fetch (when network access to the source is allowed), or
 *   - a path to a saved HTML file of the rendered clubs page.
 *
 * It extracts candidate club names, compares them to data/ephs-clubs.json, and
 * prints a diff (new clubs on the source, clubs missing from the source).
 * Existing records are keyed by their stable slug id, so administrator edits
 * and hand-curated fields are preserved: pass --write to append newly found
 * clubs as inactive drafts for review (never auto-activating unverified data).
 *
 * This keeps the dataset refreshable without ever fabricating official detail:
 * new clubs are added as drafts with fields left "Not listed" for a human (or
 * the admin dashboard) to fill in from the official page.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "ephs-clubs.json");
const SOURCE_DEFAULT = "https://eagles.edenpr.org/clubs";

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function loadSource(arg) {
  if (!arg || /^https?:\/\//.test(arg ?? SOURCE_DEFAULT)) {
    const url = arg || SOURCE_DEFAULT;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ephs-ai-clubs-refresh)" },
    });
    if (!res.ok) throw new Error(`Fetch failed: HTTP ${res.status} for ${url}`);
    return res.text();
  }
  return fs.readFileSync(arg, "utf8");
}

/** Heuristically pull candidate club names from rendered HTML. */
function extractNames(html) {
  const names = new Set();
  // Common containers for club/activity titles on rSchoolToday/Finalsite pages.
  const patterns = [
    /<(?:h[2-4]|a|span|div)[^>]*class="[^"]*(?:title|name|club|activity)[^"]*"[^>]*>([^<]{3,80})</gi,
    /<h[2-4][^>]*>([^<]{3,80})<\/h[2-4]>/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html))) {
      const t = m[1].replace(/\s+/g, " ").trim();
      if (t && /[a-z]/i.test(t) && !/^(home|clubs?|activities|menu|search)$/i.test(t)) {
        names.add(t);
      }
    }
  }
  return [...names];
}

async function main() {
  const arg = process.argv[2];
  const write = process.argv.includes("--write");
  const dataset = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const bySlug = new Map(dataset.clubs.map((c) => [c.id, c]));

  let html;
  try {
    html = await loadSource(arg);
  } catch (err) {
    console.error(`Could not load source: ${err.message}`);
    console.error(
      "Tip: save the rendered clubs page to an .html file and pass its path, e.g.\n" +
        "  node scripts/clubs-refresh.mjs ./clubs.html --write",
    );
    process.exit(1);
  }

  const sourceNames = extractNames(html);
  const sourceSlugs = new Set(sourceNames.map(slugify));
  const newOnes = sourceNames.filter((n) => !bySlug.has(slugify(n)));
  const missing = dataset.clubs.filter((c) => c.active && !sourceSlugs.has(c.id));

  console.log(`Source clubs found: ${sourceNames.length}`);
  console.log(`New on source (not in dataset): ${newOnes.length}`);
  newOnes.forEach((n) => console.log(`  + ${n}`));
  console.log(`In dataset but not seen on source: ${missing.length}`);
  missing.forEach((c) => console.log(`  - ${c.name}`));

  if (write && newOnes.length) {
    for (const name of newOnes) {
      const id = slugify(name);
      if (bySlug.has(id)) continue;
      dataset.clubs.push({
        id,
        name,
        description: "Not listed",
        descriptionSource: "general",
        category: "Interest",
        advisor: null,
        studentLeaders: [],
        meetingDays: [],
        meetingTime: null,
        meetingFrequency: null,
        location: null,
        grades: ["9", "10", "11", "12"],
        membershipRequirements: null,
        contactEmail: null,
        joinInstructions: null,
        website: null,
        registrationUrl: null,
        additionalNotes: "Imported as a draft from the official page; verify details.",
        sourceUrl: SOURCE_DEFAULT,
        active: false,
      });
    }
    fs.writeFileSync(DATA, JSON.stringify(dataset, null, 2) + "\n");
    console.log(`\nWrote ${newOnes.length} draft club(s) to data/ephs-clubs.json (inactive, pending review).`);
  } else if (newOnes.length) {
    console.log("\nRe-run with --write to append these as inactive drafts for review.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
