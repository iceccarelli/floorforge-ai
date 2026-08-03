# FloorForge Backend Setup Guide

Quick start for pilots and developers.

## Prerequisites

- Node.js ≥ 18.0.0 (check: `node --version`)
- Supabase account (free tier sufficient)
- `.env.local` file with Supabase credentials

## Step 1: Get Supabase Credentials

1. Visit `https://app.supabase.com`
2. Create a new project (or use existing)
3. Wait for it to provision (~2 minutes)
4. Go to **Settings** → **API**
5. Copy:
   - `Project URL` (looks like `https://xxxxx.supabase.co`)
   - `anon` public key (long string starting with `eyJ`)

## Step 2: Create `.env.local`

```bash
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EOF
```

## Step 3: Create Database Schema

**Option A: Supabase CLI (Recommended)**

```bash
# Install CLI (macOS)
brew install supabase/tap/supabase

# Login
supabase login

# Link project
supabase link --project-ref xxxxx

# Run migrations
supabase migration up
```

**Option B: Manual SQL Import**

1. Open Supabase dashboard
2. Go to **SQL Editor**
3. Create new query
4. Paste contents of `migrations/001_initial_schema.sql`
5. Click **Run**

## Step 4: Verify Database

```bash
supabase db list
```

You should see 7 tables:
- tenants
- users
- robots
- pilot_applications
- jobs
- post_job_reports
- telemetry_events

## Step 5: Install Dependencies & Run

```bash
# Install npm packages
npm install

# Start development server
npm run dev

# Server runs on http://localhost:3000
```

## Step 6: Test API

Create a pilot application:

```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "company": "Test Corp",
    "monthly_sqft_target": 5000,
    "source": "floorforge-site"
  }'
```

Expected response (201 Created):
```json
{
  "data": {
    "id": "...",
    "email": "test@example.com",
    "status": "new",
    "created_at": "2026-08-03T...",
    ...
  }
}
```

## Common Issues

### Error: "Supabase credentials missing"

**Fix:** Verify `.env.local` exists and has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Error: "PGRST..." from Supabase

**Fix:** Check that database migrations ran successfully. Run `supabase migration up` again or manually import SQL.

### Port 3000 already in use

**Fix:** Kill existing process or use different port:
```bash
npm run dev -- -p 3001
```

## Next Steps

- Read `BACKEND_SKELETON_REPORT.md` for full architecture
- Wire dashboard to API (replace hardcoded sample jobs)
- Add authentication (Clerk/SSO integration)
- Deploy to Vercel

## Support

Questions? Email hello@floorforge.ai or check `BACKEND_SKELETON_REPORT.md` appendix.
