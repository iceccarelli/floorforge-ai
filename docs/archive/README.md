# `docs/archive/`

Point-in-time reports and superseded planning documents, moved here from the repo
root in `FLOORFORGE_01_repo_hygiene.patch`.

**Nothing here was deleted, and nothing here was rewritten.** These are someone
else's work product, and several record decisions that are still load-bearing —
`AUDIT_2026-07-31.md` in particular already names most of the backend gaps the
Phase 0 audit found, and reached compatible conclusions. They are archived
because a root directory carrying 22 markdown files makes the living documents
hard to find, not because the work stopped mattering.

## Still living, still at the repo root

`README.md` · `AGENTS.md` · `TOOLS.md` · `IDENTITY.md` · `DESIGN_SYSTEM.md` ·
`PAGE_UX_CONTRACTS.md` · `API_REFERENCE.md` · `BACKEND_SETUP.md` ·
`PRODUCT_SERVICE_DEFINITION.md` · `SOFTWARE_HARDWARE_CONTRACT.md` ·
`PRODUCT_SERVICE_ROADMAP.md` · `SHARED_INTERFACE_NOTES.md`

## Archived here

| File | What it is |
|---|---|
| `ALIGNMENT_SUMMARY.md` | Point-in-time alignment summary |
| `AUDIT_2026-07-31.md` | Technical and business architecture audit, 2026-07-31 |
| `BACKEND_INDEX.md` | Index of the backend skeleton as built |
| `BACKEND_SKELETON_REPORT.md` | Backend skeleton delivery report |
| `IMPLEMENTATION_SUMMARY.md` | Implementation summary for a completed phase |
| `INTEGRATION_READINESS_REPORT.md` | Integration readiness assessment |
| `MISSION_COMPLETE.md` | Completion report for a prior engagement |
| `OPERATOR_SURFACE_REPORT.md` | Operator console delivery report |
| `PRODUCT_ALIGNMENT.md` | Product alignment notes, superseded by `PRODUCT_SERVICE_DEFINITION.md` |
| `REPORT.md` | Build-fix report for commit `43bf65d` (Next.js 16 route params) |
| `SITE_ARCHITECTURE_SUMMARY.md` | Site architecture summary |

## One disagreement, recorded rather than silently corrected

`DESIGN_SYSTEM.md` stays at the root and stays authoritative, with one exception:
its "Contrast & Accessibility" section publishes four WCAG ratios that are
overstated by up to 55 %. Recomputed from the same tokens with
`audit/scripts/token-contrast.mjs` — pure arithmetic, no browser, identical
output every run:

| Pair | The doc claims | Measured |
|---|---|---|
| `#64748b` on `#ffffff` | 7.1:1 | **4.76:1** |
| `#b45309` on `#ffffff` | 7.8:1 | **5.02:1** |
| `#b45309` on `#fef3c7` | 6.2:1 | **4.51:1** |
| `#0f172a` on `#ffffff` | 16.3:1 | **17.85:1** |

All four still pass AA, so nothing is broken *because* of the table. The damage
is downstream: a team that believes `--muted-foreground` has 2.6 of headroom on
white will happily put it on a tinted background. It has 0.26 — and on
`--accent-light`, the pair the document does not list, it fails at 4.27:1.

Full reasoning in `audit/DESIGN_SYSTEM.md` §4, which recommends replacing that
hand-written table with generated output so it cannot drift from the tokens
again.
