# FloorForge

**An operating system for autonomous hardwood floor refinishing — early stage, pilot program forming.**

Marketing and waitlist site for FloorForge at floorforge.ai. The site presents the product vision honestly: hardware and software are **in development**, all specifications are design targets, pricing is indicative, and the ROI calculator is a transparent model with stated assumptions — not measured customer results. The one conversion path is the pilot waitlist.

## Status

- ✅ Landing page, ROI model, planned pricing, pilot waitlist
- ✅ Scripted demo chatbot (clearly labeled — not a live agent)
- ✅ Dashboard preview at `/dashboard` (clearly labeled sample data)
- 🚧 No shipped hardware or production software yet — that is what the pilot program exists to build

## Tech Stack

- Next.js 16 (App Router) + TypeScript (strict)
- Tailwind CSS v4 + shadcn-style primitives (Radix, cva)
- Framer Motion, Lucide, Sonner
- Geist fonts self-hosted via the `geist` package (no Google Fonts fetch at build time)
- Clerk (optional), Supabase (optional), Formspree (optional)

## Deploy on Vercel — zero configuration required

The site **builds and deploys with no environment variables**. Auth, database, and the waitlist form backend are all optional and activate automatically when their env vars are present.

1. Import the repo in Vercel (framework preset: Next.js, root directory: repo root)
2. Deploy — that's it

### Optional environment variables

| Variable | Effect when set |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | Enables Sign in UI and protects `/dashboard` |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enables the Supabase client (`getSupabase()` returns `null` otherwise) |
| `NEXT_PUBLIC_FORMSPREE_FORM_ID` | Waitlist form posts to Formspree; without it, the CTA falls back to a mailto link |

Copy `.env.example` → `.env.local` for local development.

## Local Development

```bash
npm install
npm run dev   # http://localhost:3000
npm run build # production build (works with zero env vars)
npm run lint
```

## Architecture Notes

- `middleware.ts` is a pass-through unless both Clerk keys are set — the site can never 500 for lack of auth config
- `lib/auth.ts` exposes `authEnabled` (build-time inlined) used by the layout and header to conditionally mount Clerk components
- `lib/supabase/client.ts` is guarded and lazy; importing it never throws
- `components/WaitlistCTA.tsx` is the single conversion path (Formspree → mailto fallback)
- All landing copy avoids fabricated metrics, testimonials, and deployment claims by design. Keep it that way: no numbers go on the site that don't come from real, sourced data.

## Supabase schema (future production data layer)

See `docs/` history or the schema comment in `lib/supabase/client.ts` for the planned tables: `jobs`, `sanding_reports`, `finish_applications`, `robots`, `quotes`.

## License

Proprietary — Grimaldi Engineering.
