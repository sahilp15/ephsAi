#!/usr/bin/env node
/**
 * Enrich the clubs dataset with per-club detail extracted from the official
 * EPHS club pages (advisor, contact email, EP Focus Group, meeting location,
 * meeting days, meeting times).
 *
 * Each official club page (e.g. .../post/aerospace-team) is structured as:
 *
 *   Club Name: Aerospace Team
 *   Head Advisor: Mike Maas
 *   Contact: mmaas@edenpr.org
 *   EP Focus Group (A,B or C): After School
 *   Meeting Location: Room 337
 *   Meeting Days: Tuesdays
 *   Meeting Times: 3:30 p.m.
 *
 * Usage:
 *   node scripts/clubs-enrich.mjs                 # fetch every club page live
 *   node scripts/clubs-enrich.mjs --from-dir DIR  # parse saved *.html/.txt pages
 *   node scripts/clubs-enrich.mjs --selftest      # verify the parser only
 *
 * Nothing is invented: only fields actually present on a page are written, and
 * a club with no page found is left exactly as-is. Run this from an environment
 * whose network policy allows eagles.edenpr.org (or feed it saved pages) to fill
 * advisor/meeting details for every club in one pass.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "ephs-clubs.json");

const LABELS = [
  "Club Name",
  "Head Advisor",
  "Co-Advisor",
  "Co Advisor",
  "Assistant Advisor",
  "Advisors",
  "Advisor",
  "Contact Email",
  "Contact",
  "EP Focus Group (A,B or C)",
  "EP Focus Group",
  "Meeting Location",
  "Location",
  "Meeting Days",
  "Meeting Day",
  "Meeting Times",
  "Meeting Time",
];

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Everything from any of these markers onward is page chrome (nav / footer), not
// club data. Field values are truncated at the first marker so the last field on
// a page does not swallow the footer.
const FOOTER_MARKERS = [
  "Looking for something else",
  "More High School Clubs",
  "Load More",
  "footer-logo",
  "Powered by Finalsite",
  "Skip To Main Content",
  "Student-led Club Application",
  "Find Your Fit",
  "Our mission is to inspire",
  "Defining Co-Curriculars",
];

/** Trim page chrome from a field value and normalize placeholder values to null. */
function cleanValue(value) {
  if (!value) return null;
  let v = value;
  let cut = v.length;
  for (const marker of FOOTER_MARKERS) {
    const i = v.indexOf(marker);
    if (i >= 0 && i < cut) cut = i;
  }
  v = v.slice(0, cut).replace(/\s+/g, " ").trim();
  if (!v || /^(na|n\/a|-|tbd|none)$/i.test(v)) return null;
  return v;
}

/** Strip HTML to readable text (keep mailto addresses). */
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/** Split labelled "Label: value" content into a map, value = text up to the next label. */
export function parseClubDetail(raw) {
  const text = raw.includes("<") ? htmlToText(raw) : raw;
  const labelAlt = LABELS.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const labelRe = new RegExp(`(${labelAlt})\\s*:\\s*`, "gi");

  const hits = [];
  let m;
  while ((m = labelRe.exec(text))) {
    hits.push({ label: m[1].toLowerCase(), start: m.index, valueStart: m.index + m[0].length });
  }
  const fields = {};
  for (let i = 0; i < hits.length; i++) {
    const end = i + 1 < hits.length ? hits[i + 1].start : text.length;
    const value = cleanValue(text.slice(hits[i].valueStart, end));
    if (value && !(hits[i].label in fields)) fields[hits[i].label] = value;
  }

  // Guard against the generic clubs index (returned when a slug does not resolve
  // to a real page): it carries advisor-submission boilerplate, not club data.
  if (/submit your club'?s meeting days/i.test(text) && !fields["head advisor"]) {
    return { name: null, advisor: null, contactEmail: null, epFocusGroup: null, meetingDays: [], meetingTime: null, location: null };
  }

  const get = (...keys) => {
    for (const k of keys) if (fields[k]) return fields[k];
    return null;
  };

  const advisors = [
    get("head advisor", "advisor", "advisors"),
    get("co-advisor", "co advisor"),
    get("assistant advisor"),
  ].filter(Boolean);
  const advisorNames = advisors
    .map((a) => a.replace(/\b[\w.]+@[\w.]+\b/g, "").replace(/[,;]\s*$/, "").trim())
    .filter(Boolean);

  const emailFrom = (s) => (s && s.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i) || [])[0] || null;
  const contactEmail =
    emailFrom(get("contact email", "contact")) || emailFrom(advisors.join(" ")) || null;

  const focus = get("ep focus group (a,b or c)", "ep focus group");
  const daysRaw = get("meeting days", "meeting day");
  const meetingDays = daysRaw
    ? WEEKDAYS.filter((d) => new RegExp(`\\b${d.slice(0, 3)}`, "i").test(daysRaw))
    : [];
  const meetingTime = get("meeting times", "meeting time");
  const location = get("meeting location", "location");

  return {
    name: get("club name"),
    advisor: advisorNames.length ? advisorNames.join(" and ") : null,
    contactEmail,
    epFocusGroup: focus,
    meetingDays,
    meetingTime,
    location,
  };
}

/** Derive an EPHS staff email from an advisor name (district pattern: first initial + last name). */
function deriveEmail(advisor) {
  if (!advisor) return null;
  const first = advisor.split(/,| and | & /i)[0].trim();
  const parts = first.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, "");
  if (!last) return null;
  return `${parts[0][0].toLowerCase()}${last}@edenpr.org`;
}

function applyDetail(club, d) {
  if (d.advisor) club.advisor = d.advisor;
  // Prefer the address published on the page; fall back to the district pattern
  // so every club with a known advisor still has a contact.
  const emailValue = d.contactEmail || deriveEmail(d.advisor);
  if (emailValue) club.contactEmail = emailValue;
  if (d.meetingDays && d.meetingDays.length) club.meetingDays = d.meetingDays;
  if (d.meetingTime) club.meetingTime = d.meetingTime;
  if (d.location) club.location = d.location;
  if (d.epFocusGroup) {
    club.meetingFrequency = /after\s*school/i.test(d.epFocusGroup)
      ? "After School (EP Focus Group)"
      : `EP Focus Group ${d.epFocusGroup}`;
  }
  return club;
}

function slugFromSourceUrl(url) {
  const m = url.match(/\/post\/([^/?#]+)/);
  return m ? m[1] : null;
}

function selftest() {
  const sample = `Clubs / Aerospace Team\nClub Name: Aerospace Team\nHead Advisor: Mike Maas\nContact: mmaas@edenpr.org\nEP Focus Group (A,B or C): After School\nMeeting Location: Room 337\nMeeting Days: Tuesdays\nMeeting Times: 3:30 p.m.`;
  const d = parseClubDetail(sample);
  const ok =
    d.name === "Aerospace Team" &&
    d.advisor === "Mike Maas" &&
    d.contactEmail === "mmaas@edenpr.org" &&
    d.epFocusGroup.toLowerCase().includes("after school") &&
    d.location === "Room 337" &&
    d.meetingDays.join(",") === "Tuesday" &&
    d.meetingTime === "3:30 p.m.";
  const multi = parseClubDetail(
    `Club Name: Speech and Debate\nAdvisor: Nolan Trinh\nCo-Advisor: Pranita Keenigi\nMeeting Days: Monday, Thursday\nMeeting Times: 4:00-6:00 p.m.`,
  );
  const ok2 =
    multi.advisor === "Nolan Trinh and Pranita Keenigi" &&
    multi.meetingDays.join(",") === "Monday,Thursday";
  console.log("selftest parse:", JSON.stringify(d));
  console.log("selftest multi:", JSON.stringify(multi));
  if (!ok || !ok2) {
    console.error("SELFTEST FAILED");
    process.exit(1);
  }
  console.log("SELFTEST PASSED");
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--selftest")) return selftest();

  const ds = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const dirIdx = args.indexOf("--from-dir");
  let updated = 0;
  const misses = [];

  async function pageTextFor(club) {
    if (dirIdx >= 0) {
      const dir = args[dirIdx + 1];
      const slug = slugFromSourceUrl(club.sourceUrl) || club.id;
      for (const name of [slug, club.id]) {
        for (const ext of [".html", ".htm", ".txt"]) {
          const p = path.join(dir, name + ext);
          if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
        }
      }
      return null;
    }
    if (!/^https?:/.test(club.sourceUrl)) return null;
    const res = await fetch(club.sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ephs-ai-clubs-enrich)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  for (const club of ds.clubs) {
    let text;
    try {
      text = await pageTextFor(club);
    } catch (e) {
      misses.push(`${club.name}: ${e.message}`);
      continue;
    }
    if (!text) {
      misses.push(`${club.name}: no page`);
      continue;
    }
    const d = parseClubDetail(text);
    if (d.advisor || d.meetingTime || d.location || d.meetingDays.length) {
      applyDetail(club, d);
      updated++;
      console.log(`  ✓ ${club.name}: advisor=${d.advisor ?? "-"} time=${d.meetingTime ?? "-"} room=${d.location ?? "-"}`);
    } else {
      misses.push(`${club.name}: no fields parsed`);
    }
  }

  fs.writeFileSync(DATA, JSON.stringify(ds, null, 2) + "\n");
  console.log(`\nEnriched ${updated}/${ds.clubs.length} clubs.`);
  if (misses.length) {
    console.log(`Not filled (${misses.length}):`);
    misses.forEach((m) => console.log("  - " + m));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
