# Eddy Knowledge Base — how to add EPHS info

Everything Eddy knows comes from the markdown files in this folder. Eddy will
**only** answer from what's here — it never invents facts. The more accurate,
well-sourced files you add, the more useful Eddy becomes.

## The golden rules

1. **One topic per file.** Keep each file focused (e.g. "Graduation
   Requirements", "How to Change Your Schedule").
2. **Always fill `source_url`.** Use the official EPHS / Eden Prairie Schools
   page this info comes from. Eddy shows this link so students can verify.
3. **Write in plain language.** Short sentences, student-level. No jargon.
4. **Keep facts verifiable.** Only include info you can point to on an official
   page. If you're not sure, leave it out — Eddy admitting "I'm not certain" is
   better than a wrong answer.
5. **No personal data.** Never put student names, IDs, grades, or private info
   in these files.
6. **No login-gated content.** Only use public/official material — do not paste
   anything from behind a portal login.

## File format

Save files as `.md` inside the right category folder. Each file needs
frontmatter (the block between the `---` lines) plus a plain-language body:

```md
---
topic: Graduation Requirements
category: academics        # academics | schedule | staff | clubs | logistics | support | college
source_url: https://www.edenpr.org/ephs/...   # official EPHS page this is based on
last_updated: 2026-06-22
---

# Graduation Requirements

Plain-language EPHS info goes here. Use short paragraphs and bullet lists.
```

### Category folders

| Folder        | Use it for                                                |
| ------------- | --------------------------------------------------------- |
| `academics/`  | Graduation/credit requirements, course catalog, AP/PSEO   |
| `schedule/`   | Schedule changes, add/drop process, bell schedule         |
| `staff/`      | Counselor & staff directory by what they handle           |
| `clubs/`      | Clubs, activities, athletics, how to join/start one       |
| `logistics/`  | Parking, buses, lunch, calendar, building info            |
| `support/`    | Counseling, mental health, crisis & support resources     |
| `college/`    | College/career planning, PSEO, transcripts, testing       |

## Add this first (high-value checklist)

Start with the topics students ask about most:

- [ ] Graduation / credit requirements (by subject area)
- [ ] Course catalog highlights — AP, honors, PSEO, and pathways
- [ ] Schedule-change process + who to contact + deadlines
- [ ] Club & activity list + how to join or start one
- [ ] Counselor / staff directory organized by what each person handles
- [ ] Bell schedule + school calendar (key dates)
- [ ] Parking, bus, and lunch logistics
- [ ] Support resources (counseling, mental health, crisis lines)

## Notes

- The example files in each folder are marked
  **`EXAMPLE — replace with real EPHS info`**. Delete or overwrite them with
  real, sourced content before going live.
- Files are loaded and cached when the server starts. After editing knowledge
  files, restart `npm run dev` (or redeploy) to pick up changes.
- `README.md` files are ignored by the loader, so these notes won't reach Eddy.
