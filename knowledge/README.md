# EPHS Knowledge Base — how to add & update info

Everything the assistant knows comes from the markdown files in this folder. It will
**only** answer from what's here — it never invents EPHS facts. The more accurate,
well-sourced files you add, the more useful the assistant becomes.

## Verified-only policy

The current knowledge base is built from **verified sources**:

- The official **2026–27 EPHS Course Guide** (PDF you provided).
- Facts confirmed via search on **edenpr.org / my.edenpr.org** (contacts, hours,
  total credits, counseling structure).
- The **counselor Acuity booking link** you provided.

> Note: edenpr.org blocks automated scraping, so pages could not be bulk-imported.
> Where a detail isn't verified (e.g. exact bell-period times, the full club roster,
> the full 2026–27 calendar), the file intentionally says so and links the official
> page instead of guessing. Please keep this approach when you add content.

## The golden rules

1. **One topic per file.** Keep each file focused.
2. **Always fill `source_url`** with the official EPHS page the info comes from.
3. **Write in plain language.** Short sentences, student/parent-level.
4. **Keep facts verifiable.** If you're not sure, say so and link the official page —
   that's better than a wrong answer.
5. **No personal data** (no student names, IDs, grades).
6. **No login-gated content.**

## File format

```md
---
topic: Graduation Requirements
category: academics        # academics | schedule | staff | clubs | logistics | support | college
source_url: https://my.edenpr.org/high-school/graduation
last_updated: 2026-06-23
---

# Graduation Requirements

Plain-language EPHS info goes here.
```

### Category folders

| Folder        | Use it for                                                |
| ------------- | --------------------------------------------------------- |
| `academics/`  | Graduation/credit requirements, course catalog, AP/PSEO, Pathways |
| `schedule/`   | Course selection process/timeline, schedule changes       |
| `staff/`      | Counseling team (SST), school contacts                    |
| `clubs/`      | Clubs, activities, athletics                              |
| `logistics/`  | Hours/bell schedule, calendar, parking, transportation    |
| `support/`    | Mental health, crisis & support resources                 |
| `college/`    | College/career planning, PSEO, college credit             |

## Key official links (use as `source_url`)

- Graduation: https://my.edenpr.org/high-school/graduation
- Calendar: https://my.edenpr.org/high-school/calendar
- Counseling team (SST): https://my.edenpr.org/high-school/counseling-team-at-ephs
- Course Selection Hub: https://www.edenpr.org/ephs-courses
- Registration: https://my.edenpr.org/ephs-registration
- Parking: https://my.edenpr.org/parking
- Mental health: https://my.edenpr.org/mental-health
- EPHS home: https://www.edenpr.org/high-school
- Counselor booking (Acuity): https://app.acuityscheduling.com/schedule/1c840dc8

## To verify / update next

- [ ] Per-subject credit breakdown for graduation (English/Math/Science/etc.).
- [ ] Exact daily **bell schedule** period times + special-day schedules.
- [ ] Full **2026–27 calendar** (first/last day, breaks, conferences, no-school days).
- [ ] Full **clubs & athletics** roster.
- [ ] Full **Pathways** list and individual course descriptions.

## Notes

- `README.md` files are ignored by the loader, so these notes won't reach the AI.
- Files are loaded and cached when the server starts. After editing, restart
  `npm run dev` (or redeploy) to pick up changes.
