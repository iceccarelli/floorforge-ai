# FloorForge — Product-Truth Reconciliation

**Base commit:** `eedf792`
**Date:** 2026-08-12
**Method:** every product claim rendered by `app/**`, `components/**`, `lib/**` and
`public/llms.txt` extracted and diffed against every product fact asserted in the eight
root source-of-truth documents (`PRODUCT_SERVICE_DEFINITION.md`,
`PRODUCT_SERVICE_ROADMAP.md`, `SOFTWARE_HARDWARE_CONTRACT.md`, `API_REFERENCE.md`,
`SHARED_INTERFACE_NOTES.md`, `PAGE_UX_CONTRACTS.md`, `IDENTITY.md`, `README.md`).

Every row carries a `file:line` on **both** sides. Where a number is derived, the
arithmetic is shown so it can be checked rather than believed.

This document changes no behaviour. It is the evidence base for the decisions listed in
§8, most of which are the owner's to make and not mine.

---

## 0. Why this audit exists

`audit/FINDINGS.md` asked whether the site *works*. This asks a different question:
**does the site describe the same product the engineering documents describe?**

That question is the whole of what separates a site like `aws.amazon.com` from a
brochure. On AWS, the name on the marketing page is the name in the API, the number in
the pricing table is the number on the invoice, and the limit in the docs is the limit
the service enforces. Nothing in that discipline is about visual design. It is about a
single vocabulary surviving all the way from the hardware to the headline.

FloorForge does not have that yet. It has **two vocabularies that do not share a single
platform name**, and **four different answers to how long a floor takes**.

---

## 1. Severity summary

| Sev | Count | Definition |
|---|---|---|
| **T0** | 4 | A number or claim on the site that contradicts the product's own definition of what may be claimed, or that cannot be true |
| **T1** | 3 | The site and the engineering documents describe the same thing by different names or values |
| **T2** | 3 | Internal inconsistency inside one side, visible to a customer |
| **T3** | 3 | Documentation defects that will become site defects when the docs are used |

**None of these are bugs.** Everything below builds, lints, passes axe and ships. That is
what makes them worth writing down: no instrument in `audit/scripts/` can see any of it.

---

## 2. T0 — the site claims more than the product definition permits

### T0-1 · The ROI calculator's shipped output exceeds the labour-savings figure the product definition explicitly forbids claiming

| Side | Evidence |
|---|---|
| **Site** | `components/ROICalculator.tsx:26` — `const baseRobotEfficiency = 0.38; // 62% time reduction baseline`; job-type multiplier `1.15` commercial / `0.92` residential (`:25`) |
| **Docs — what is permitted** | `PAGE_UX_CONTRACTS.md:115` — approved site copy is **"Targeting 50% labor time savings"** |
| **Docs — what is forbidden** | `PRODUCT_SERVICE_DEFINITION.md:276` lists, under claims that must **not** be made: **"'FloorForge saves 60% of labor' (unvalidated; depends on job type)"** |

Computed across the full range of both sliders (`sqft` 1,500–45,000; `manualHours`
20–280), the figure the calculator actually displays is:

| Job type | Displayed "TIME SAVED" | vs sanctioned 50% | vs forbidden 60% |
|---|---|---|---|
| Commercial (the shipped default) | **55–57 %** | +5 to +7 pp | under |
| Residential | **64–67 %** | +14 to +17 pp | **over** |

With the shipped defaults (8,500 sqft · 95 hours · Commercial) a first-time visitor sees
**56 % time saved · 53 hours · 4 robots · $4,134 labour saved**. Switch the job type to
Residential — the first segment the site lists (`app/page.tsx:89`) — and the headline
becomes **65 %**.

So the single largest number on the homepage is above the number the product definition
says is permitted, and in the residential case it is above the number the product
definition names as an example of a claim that must not be made.

**A second, separable defect.** The chatbot states the assumption as *"a 62% baseline
time-reduction target"* (`components/Chatbot.tsx:31`) and the tile footnote says the same
(`ROICalculator.tsx:204`). **The calculator never displays 62 % for any input in range** —
the job-type multiplier is applied after the baseline, so 62 % is a number the user is
told about but can never reproduce. For a component whose stated selling point is
*"A transparent model… estimates from the assumptions below"* (`ROICalculator.tsx:62`),
an unreproducible stated assumption is the one flaw that undoes the whole premise.

**Why a customer cares.** This is the number a contractor will quote back in the first
pilot call. If the field data lands at 50 % — which is what the roadmap targets
(`PRODUCT_SERVICE_ROADMAP.md:23`, "Contractors report ≥ 50% time savings") — the site
will have overpromised by fifteen points to exactly the people whose goodwill the pilot
depends on.

**This is a claims decision, not a code fix.** Part VII.6. See §8, Decision 1.

---

### T0-4 · The site has a complete lead pipeline and the waitlist form does not use it

| Side | Evidence |
|---|---|
| **Built** | `POST /api/applications` with full validation (`app/api/applications/route.ts:14-55`); `pilot_applications` table (`lib/db/client.ts:33`); a ten-state lifecycle `new → contacted → engaged → qualified → accepted → onboarded → piloting → completed/declined/churned` (`lib/types.ts:63-73`); an operator console to triage it (`app/operator/applications/page.tsx:76`) |
| **Used** | The waitlist posts to `https://formspree.io/f/${FORMSPREE_ID}` (`components/WaitlistCTA.tsx:85`) |

The `source` enum's first value is literally `"floorforge-site"` (`lib/types.ts:86`,
`lib/validators.ts:412`). Every field the form collects has a home in
`PilotApplication`:

| Form sends | `PilotApplication` field |
|---|---|
| `name` | `name` |
| `email` | `email` |
| `company` | `company` |
| `monthly_sqft` | `monthly_sqft_target` |
| `interest` | `robot_interest` |
| `source` | `source` — the enum value `"floorforge-site"` exists for exactly this |

**The form was designed for this endpoint and was never connected to it.**

**What it costs.** The operator console has never had a row to triage. The ten-state
lifecycle has never advanced once. And the site's only conversion path depends on a
third-party service nobody configured — while the equivalent system FloorForge owns,
tested and shipped sits idle behind it.

It also reframes the environment-variable problem that has led every report in this
engagement. `NEXT_PUBLIC_FORMSPREE_FORM_ID` buys one thing: form submissions. Supabase
credentials buy the same submissions *plus* the dashboard, the operator console,
telemetry ingestion and the job pipeline — and the product needs them regardless.
Formspree is a second dependency that duplicates a system already built.

**Resolved in `FLOORFORGE_16_lead_pipeline.patch`** — three tiers, in order: the pilot
API, then Formspree if configured, then a prefilled mailto. The CTA is dead at no tier,
and no tier claims a submission that did not happen.

### T0-2 · Four sources of truth give four different answers to "how long does my floor take", spread 15×

This is the first question every contractor asks. The site, the API reference, the
firmware contract and the ROI calculator each answer it differently, and none of them
cites another.

| Source | What it says | Implied sander throughput |
|---|---|---|
| Simulator platform spec | `coverageM2PerHour: 55` for `sand` — `lib/robots.ts:90` | **592 sqft/h per pass** |
| ROI calculator | `~2200 sqft per robot per day for full multi-grit + finish` — `components/ROICalculator.tsx:33` | **275 sqft/h** (8-h day, all passes) |
| `API_REFERENCE.md:170-175` | `"sqft": 5000, "sqm": 465, … "estimated_duration_hours": 8` | **625 sqft/h** (all passes) |
| `SOFTWARE_HARDWARE_CONTRACT.md:727, :752` | worked example — 12,500 sqft completed in `2h 58m 22s` across 3 passes | **4,205 sqft/h** (all passes) |

Spread between the slowest and fastest: **15.3×**.

The conflict is not academic, because the site *computes with* its number. The
simulator's job estimate is `((roomW * roomL) / coverageM2PerHour) * 3600 * passCount`
(`components/simulator/FloorScene.tsx:155`). Applying that to the firmware contract's own
worked example:

```
12,500 sqft = 1,161.3 m²   ×  3 passes  ÷  55 m²/h  =  63.3 hours
SOFTWARE_HARDWARE_CONTRACT.md says the same job took 2 h 58 m.
```

**The simulator on the website would take 21× longer to finish the job the hardware
contract says the machine already finished.** Both documents are FloorForge's. A hardware
partner or an investor who reads both in the same afternoon will find this in minutes,
and the honest answer today is that nobody knows which figure is real — the machine does
not exist yet, which is precisely why the number needs one owner instead of four.

**Not a claims problem — an engineering-truth problem.** See §8, Decision 2.

---

### T0-3 · The dashboard cites an OSHA benchmark that does not exist

| Side | Evidence |
|---|---|
| **Site** | `app/dashboard/page.tsx:227` — `µg/m³ — 87% below OSHA action level`; `:119` — `Well below OSHA limit` |
| **Docs** | The string "OSHA" appears in **none** of the eight source documents. No upstream source exists for either statement. |

The regulatory facts, from OSHA directly:

| Benchmark | Value | 12.1 µg/m³ is… |
|---|---|---|
| OSHA PEL, wood dust as nuisance dust, total, 8-h TWA | 15 mg/m³ = 15,000 µg/m³ | **99.92 % below** |
| OSHA PEL, respirable fraction | 5 mg/m³ = 5,000 µg/m³ | 99.76 % below |
| NIOSH REL (recommendation, not an OSHA limit) | 1 mg/m³ = 1,000 µg/m³ | 98.8 % below |
| "OSHA action level" for wood dust | **does not exist** | — |

Two independent problems:

1. **The concept is wrong.** OSHA publishes action levels for a handful of specifically
   regulated substances. Wood dust is not one of them; it is covered by the generic
   nuisance-dust PEL. There is nothing to be 87 % below.
2. **The arithmetic is wrong under every reading.** For 12.1 µg/m³ to be "87 % below" a
   limit, the limit would have to be ≈ 93 µg/m³ — which is not any published figure for
   wood dust from OSHA, NIOSH or ACGIH. The true figure against the strictest cited
   benchmark is **98.8 %**.

The dashboard is labelled sample data twice (`:55`, `:235`), and that labelling is real
and should stay. But a regulatory comparison is not the kind of claim a sample-data
banner covers: it asserts a relationship to a federal exposure standard, and a
prospect's safety officer is exactly the person who will check it. The site is
*understating* its own modelled performance while citing a standard incorrectly — the
worst of both.

**Fixable without a judgement call?** Removing an unsupported regulatory claim does not
weaken an honesty disclaimer; it removes an over-claim. But it changes rendered copy, so
it is listed as Decision 3 rather than executed.

---

## 3. T1 — the site and the engineering documents describe different products

### T1-1 · The customer-facing platform names and the API's platform names share no strings

| Site (`lib/robots.ts:80-182`) | Source-of-truth docs | Agreement |
|---|---|---|
| `ForgeSand D1` | `Sander D1` — `PRODUCT_SERVICE_DEFINITION.md:155`; `robot_type: "Sander D1"` — `API_REFERENCE.md:173` | codename `D1` only |
| `ForgeEdge E1` | `Edger E1` — `PRODUCT_SERVICE_DEFINITION.md:194` | codename `E1` only |
| `ForgeCoat **C1**` | `Finisher **F1**` — `PRODUCT_SERVICE_DEFINITION.md:219`, `PAGE_UX_CONTRACTS.md:237` | **none — the codename letter differs** |
| `ForgeLay L1` | `Plank Layer L1` — `PRODUCT_SERVICE_DEFINITION.md:28` | codename `L1` only |
| `ForgeScan **S1**` | `Inspector **I1**` — `PRODUCT_SERVICE_DEFINITION.md:28` | **none — the codename letter differs** |

Two of five differ in the codename itself, not merely the prefix. A pilot customer who
opens a support ticket about "my ForgeCoat C1" cannot be matched to anything in
`API_REFERENCE.md`, `PRODUCT_SERVICE_ROADMAP.md` or the firmware contract. The single
place the docs come close is a data-flow diagram in `SHARED_INTERFACE_NOTES.md:548`,
which says `Coater C1` — agreeing with the site's letter and with neither of the two
names the product definition uses.

The platform **codes** are the one thing that does align: `RobotPlatform` is
`"sand" | "edge" | "coat" | "lay" | "scan"` in both `lib/types.ts:258` and
`SHARED_INTERFACE_NOTES.md:387`. So the machine-readable layer agrees and only the human
layer diverges, which is the easier of the two problems to have.

**Robot ID formats — three conventions, and the site's fail the contract's own regex.**

| Source | Format | Example |
|---|---|---|
| `SOFTWARE_HARDWARE_CONTRACT.md:100` | `FF-S[0-9]{3}` | `FF-S001` |
| `SHARED_INTERFACE_NOTES.md:163` | free-form | `FF-03A` |
| `lib/db/client.ts:357-363` | platform-letter prefix | `FF-S…`, `FF-E…`, `FF-C…`, `FF-L…`, `FF-X…` |
| `app/dashboard/page.tsx:257` (sample) | no platform letter | `FF-03A`, `FF-07B`, `FF-12C`, `FF-04A` |

The dashboard's sample IDs do not match the regex the firmware contract says the device
will send. The generator in `lib/db/client.ts` uses `FF-X` for `scan`, which matches
neither `S1` nor `I1`.

**Brand decision.** See §8, Decision 4.

---

### T1-2 · The published grit sequence has four different values, and the simulator disagrees with the spec chip printed beside it

| Value | Where |
|---|---|
| `36 → 80 → 120` | `PRODUCT_SERVICE_DEFINITION.md:34, :162`; `SOFTWARE_HARDWARE_CONTRACT.md:34, :139, :285, :429`; `API_REFERENCE.md:171`; `SHARED_INTERFACE_NOTES.md:159`. **`PAGE_UX_CONTRACTS.md:264` sanctions the site copy "Designed for 36→80→120 grit sequence".** |
| `36 → 180` | `app/page.tsx:26`; `lib/robots.ts:92, :101`; `lib/showcase.ts:39`; `public/llms.txt:43` |
| `36 → 120` | `components/simulator/ProTeardown.tsx:43` — "ribbed abrasive · 36→120 grit" |
| `36/40, 60, 80, 120, 150/180` | `components/Chatbot.tsx:29` |

And the simulator itself runs **three** passes ending at 120 (`lib/robots.ts:95-97`)
while the chip directly above it says the grit range is `36 → 180` (`lib/robots.ts:101`)
and the showcase lists a fourth `180 · polish` step (`lib/showcase.ts:40`). A visitor can
see both at once.

`grit_sequence` is not decoration: it is a field the firmware reads to plan the job
(`SOFTWARE_HARDWARE_CONTRACT.md:423-433`) and a field the post-job report writes back as
`grit_sequence_executed` (`lib/types.ts:151`). If marketing says 180 and the firmware
ships `["36","80","120"]`, the first pilot job produces a customer-facing report that
contradicts the website that sold it.

---

### T1-3 · Every price on the site was invented at the website layer

| Side | Evidence |
|---|---|
| **Site** | `$299 /mo base` + `$149 /robot /month` (`app/page.tsx:367-370`); `$799 /mo base` + `$99 /robot /month` (`:386-389`); `Custom` (`:405`). Restated in `components/Chatbot.tsx:28`. |
| **Docs — names** | `PAGE_UX_CONTRACTS.md:118-119` — "Essentials, Professional, Enterprise" · "Pricing tiers: Indicative (not final)" |
| **Docs — figures** | **None.** `PRODUCT_SERVICE_DEFINITION.md:299` says literally `$X/month per robot`. `:303` — "Pricing not locked until: Post-pilot manufacturing cost, supply chain validation, and field ROI data". The only concrete price anywhere in the corpus is `~$15–25K (indicative)` for a Sander D1 unit (`:288`). |

The tier *names* trace to a document. The four dollar figures do not trace to anything.

This is not dishonesty — the site labels the section `PLANNED PRICING` and says
"Indicative pricing for the launch phase — subject to change as the pilot program defines
the product" (`app/page.tsx:353-358`), which is more hedging than most pre-launch sites
manage. But there is a structural problem underneath it: the pricing page and the pricing
model are not connected, so nothing propagates. When manufacturing quotes come back and
the real number is $1,400/mo, the site will not know.

There is also a **model mismatch**, which matters more than the figures. The product
definition's post-pilot model is *hardware sale + SaaS subscription per robot*
(`PRODUCT_SERVICE_DEFINITION.md:298-299`) — the contractor buys the robot for
$15–25K and pays a monthly fee. The site's pricing table shows **only** the monthly fee,
with no hardware line at all. A contractor reading `$799/mo` will not budget $15–25K per
machine, and will find out during the sales conversation. That is the single most
expensive expectation gap on the page.

**See §8, Decision 5.**

---

## 4. T2 — internal inconsistencies a customer can see

### T2-1 · `ForgeLay L1` is a platform everywhere except the two places that count the platforms

| Present | Absent |
|---|---|
| `lib/robots.ts:157-175`; homepage chip row `app/page.tsx:194-205`; simulator picker `components/simulator/ControlPanel.tsx:69`; pro teardown `ProTeardown.tsx:62-64` | `lib/showcase.ts:36-54` — five categories, but one is "Dust Containment" attributed to D1, so L1 has no renders. `public/llms.txt:40-51` — says **"Five platforms appear across the site"** then names four |

The file whose entire purpose is telling AI assistants the truth about the product
undercounts the product line by one. `PRODUCT_SERVICE_DEFINITION.md:28` confirms five:
"Sander D1, Edger E1, Finisher F1, Plank Layer L1, Inspector I1".

**Safe to fix.** Purely additive and factually supported on both sides.

### T2-2 · The dashboard names two products that exist in no document, and one model number that implies four shipped predecessors

| String | Where | Doc support |
|---|---|---|
| `Start walls & ceilings quote in DryForge` | `app/dashboard/page.tsx:205` | none |
| `deep-link into DryForge / PaintForge` | `app/dashboard/page.tsx:275` | none |
| `Sander Pro v4.2 • Online` (every fleet row) | `app/dashboard/page.tsx:260` | none — and it is a *sixth* name for the sanding platform, after `ForgeSand D1` and `Sander D1` |

The roadmap's only forward statement is "expand to 3+ platforms" by end of 2027
(`PRODUCT_SERVICE_ROADMAP.md:495`), unnamed.

`v4.2` is the string that most directly implies a shipped product anywhere on the site.
Version numbers are a claim shape: `v4.2` asserts that v1 through v4.1 existed and were
superseded. The machine has not been built. The sample-data banner covers *values*; it
does not naturally cover *the existence of a product line*.

### T2-3 · The ROI calculator's own stated assumption is not reproducible from the tool

Covered under T0-1. Listed separately here because it survives whatever is decided about
the 62 % figure: even if 62 % stays, the displayed number should be derivable from the
assumptions shown, or the assumptions shown should be the ones actually applied.

---

## 5. T3 — documentation defects that will become site defects

These are outside the site's scope (Part II.4 excludes `app/api/**` behaviour and the
schema), so they are reported, not fixed. Each will surface on the site the moment the
docs are used as the source they claim to be.

### T3-1 · Two incompatible telemetry vocabularies, and a unit conflict inside them

| | Firmware side — `SOFTWARE_HARDWARE_CONTRACT.md:103` (8 types) | Platform side — `API_REFERENCE.md:413-423`, `SHARED_INTERFACE_NOTES.md:270-281` (11 types) |
|---|---|---|
| Shared | `pass_started`, `pass_completed`, `dust_reading`, `error` | same |
| Only here | `pressure_reading`, `coverage_checkpoint`, `job_paused`, `job_resumed` | `coverage_check`, `robot_paused`, `robot_resumed`, `finish_applied`, `quality_approved`, `quality_failed`, `heartbeat` |

`lib/types.ts:175-186` implements the **platform** vocabulary. So the four event types the
firmware contract tells the hardware team to emit are types the ingest layer's type
system does not define.

Field-level conflicts in the events that *do* share a name:

| Concept | Firmware side | Platform side |
|---|---|---|
| pass duration | `duration_sec` (`:262`) | `actual_duration_sec` (`SHARED_INTERFACE_NOTES.md:296`) |
| **average pressure** | **`avg_pressure_psi`** (`:265`) | **`avg_pressure_bar`** (`lib/types.ts:212`) |
| error identity | `code` / `message` (`:302-304`) | `error_code` / `error_message` (`:329-330`) |
| error severity | `info \| warning \| error` (`:303`) | `warning \| error \| fatal` (`lib/types.ts:250`) |
| clock skew tolerance | `±5 minutes` (`:107`) | `within 1 hour` (`SHARED_INTERFACE_NOTES.md:586`) |

The pressure one is the dangerous entry: same quantity, two units, **14.5 × apart**, with
no conversion documented anywhere. A firmware engineer sending `3.0` PSI into a field
named `avg_pressure_bar` produces a reading 14.5 × high, and every downstream approval
check (`SOFTWARE_HARDWARE_CONTRACT.md:469`, "Avg pressure 2–4 PSI") silently fails.

### T3-2 · The firmware contract's worked example has an internal unit error

`SOFTWARE_HARDWARE_CONTRACT.md:427-429` — `"sqft": 12500` with
`"target_coverage_area_m2": 835`. 12,500 sqft is **1,161 m²**; 835 m² is **8,988 sqft**.
A 28 % discrepancy inside a single JSON object that hardware will parse.

### T3-3 · Four API hostnames and a contact address the site does not use

| Host | Source |
|---|---|
| `https://api.floorforge.io` | `API_REFERENCE.md:9` |
| `https://api.floorforge.ai` | `SOFTWARE_HARDWARE_CONTRACT.md:74` |
| `https://floorforge.api.ecowoods.com` | `SHARED_INTERFACE_NOTES.md:478` |
| `https://floorforge-ai.vercel.app` | `app/layout.tsx:14` (site) |

And `API_REFERENCE.md:601` gives the contact address as **`hello@floorforge.ai`** — a
domain address, already written down, while the site uses a personal Gmail
(`lib/contact.ts:16`, and `audit/FINDINGS.md` P1-6). Whoever wrote the API reference had
already decided this question.

---

## 6. What is already aligned — and it is more than the above suggests

Recording this because an audit that lists only failures misrepresents the thing it
audits.

- **The honesty layer exceeds what the documents require.** `PAGE_UX_CONTRACTS.md:114`
  permits "Designed to achieve 98% dust capture"; the site says exactly that and never
  more (`lib/robots.ts:102`, `lib/showcase.ts:46`). Every numeric spec on every platform
  carries `(target)`. `public/llms.txt` — "No hardware ships today and no customer has run
  a job" (`:4`) — goes beyond anything any document asks for.
- **The machine-readable vocabulary matches exactly.** All eleven `EventType` members, all
  ten `PilotApplicationStatus` members, all nine `JobStatus` members, `UserRole`,
  `TenantStatus`, `CustomerSegment`, `RobotStatus` and `RobotPlatform` in `lib/types.ts`
  are string-for-string identical to `SHARED_INTERFACE_NOTES.md`. That is real
  engineering discipline and it is why T1-1 is a naming problem rather than a data
  problem.
- **The API validation matches the spec.** `sqft > 100`, `coverage_pct` 0–100,
  `approval_score` 0–100, applications forced to `status: "new"`, jobs defaulted to
  `draft` — `lib/validators.ts` implements what `SHARED_INTERFACE_NOTES.md:573-594`
  specifies.
- **The dust figure is consistent everywhere** — 98 %, always marked target, in five
  places on the site and four in the docs. It is the one number in this audit that has a
  single value.
- **The sample dashboard reuses the firmware contract's worked example.** "Meridian",
  12,500 sqft (`app/dashboard/page.tsx:26-28` vs `SOFTWARE_HARDWARE_CONTRACT.md:426-427`).
  Someone connected those on purpose.
- **No fabricated structured data.** No `aggregateRating`, no reviews, no `Offer` markup,
  and the invented prices are deliberately **not** exposed to crawlers
  (`components/StructuredData.tsx:6-11`).

---

## 7. What this audit did not check

- **Whether any number is physically achievable.** This document checks agreement, not
  truth. Four sources agreeing on 55 m²/h would still not make 55 m²/h correct.
- **The 3D geometry against any mechanical drawing.** No CAD exists in the repo.
- **The Supabase schema against `migrations/`.** Out of scope per Part II.4.
- **`DESIGN_SYSTEM.md` §-by-§** — already reconciled in `audit/DESIGN_SYSTEM.md`.
- **Whether the roadmap dates are current.** `PRODUCT_SERVICE_ROADMAP.md` describes weeks
  and phases with no anchor date I could verify, so "Q4 2026" and "2027" are recorded as
  written and not judged.

---

## 8. Decisions this audit cannot make

Per Part VII.6, each of these is a claims, pricing or brand judgement, and each is the
owner's.

| # | Decision | The cheap option | The expensive-but-right option |
|---|---|---|---|
| 1 | **The ROI baseline.** 62 % is above the 50 % the docs sanction and the residential path exceeds the 60 % the docs forbid. | Re-anchor `baseRobotEfficiency` to the sanctioned 50 % and make the displayed % reproduce the stated assumption | Keep 62 % and amend `PRODUCT_SERVICE_DEFINITION.md` to sanction it — but then the pilot has to hit it |
| 2 | **Sander throughput.** Four sources, 15× spread. | Pick one figure, put it in one file, make the other three cite it | Model it properly from drum width × feed rate × overlap and replace all four |
| 3 | **The OSHA line.** Cites a benchmark that does not exist. | Delete the regulatory comparison; keep the µg/m³ reading | Replace with a correctly-sourced comparison to the 15 mg/m³ PEL |
| 4 | **Platform names.** `ForgeCoat C1` vs `Finisher F1`, `ForgeScan S1` vs `Inspector I1`. | Site wins — rename in the docs; the Forge prefix is the stronger brand | Docs win — rename on the site; but `ForgeSand` is better than `Sander` and everyone knows it |
| 5 | **Pricing.** Four dollar figures with no upstream source, and no hardware line at all. | Add "plus hardware" to the pricing table so the $15–25K unit cost is not a surprise | Hold pricing until manufacturing quotes, and show the tiers without figures |
| 6 | **`DryForge` / `PaintForge` / `Sander Pro v4.2`.** Named products with no documents. | Remove `v4.2`; keep the cross-sell as an explicitly future concept | Write the product definitions, since the cross-sell story is genuinely good |

My recommendation on each, if it is wanted: **1 →** re-anchor to 50 % and fix the
reproducibility, because being caught overpromising to your first five customers is the
one thing a pilot cannot survive. **2 →** pick one and cite it, today; model it properly
later. **3 →** delete the comparison. **4 →** site wins; `Forge*` is a real brand system
and `Sander D1` is a description. **5 →** add the hardware line — the omission, not the
figure, is what will cost a deal. **6 →** drop `v4.2`, keep the rest labelled as concept.

---

*Reconciliation performed at `eedf792` on 2026-08-12. Every claim above carries a
`file:line` on both sides; every derived number shows its arithmetic. Where I could not
settle a question, the row says so.*
