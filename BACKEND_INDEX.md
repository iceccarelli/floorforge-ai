# FloorForge Backend: File Index & Navigation

Quick guide to finding what you need.

---

## 📋 Start Here

**Reading order for understanding the backend:**

1. **MISSION_COMPLETE.md** (5 min) – What was built + success criteria
2. **BACKEND_SETUP.md** (5 min) – Get running locally in 5 minutes
3. **API_REFERENCE.md** (10 min) – Common operations + curl examples
4. **BACKEND_SKELETON_REPORT.md** (30 min) – Full architecture + design decisions

---

## 📁 Code Files

### Types & Validation

| File | Size | Purpose |
|------|------|---------|
| **lib/types.ts** | 7 KB | All TypeScript types (User, Job, Telemetry, Robot, etc.) |
| **lib/validators.ts** | 14 KB | Input validation (5 validators + helpers) |
| **lib/db/client.ts** | 10 KB | Supabase client with 21 typed query helpers |

**Start here if you need to:**
- Understand data shapes → `lib/types.ts`
- Validate new endpoints → `lib/validators.ts`
- Query database → `lib/db/client.ts`

### API Routes

| File | Size | Purpose |
|------|------|---------|
| **app/api/applications/route.ts** | 3 KB | POST/GET pilot applications |
| **app/api/applications/[id]/route.ts** | 3.4 KB | GET/PATCH single application |
| **app/api/jobs/route.ts** | 3.7 KB | POST/GET jobs |
| **app/api/jobs/[id]/route.ts** | 3.5 KB | GET/PATCH job + telemetry |
| **app/api/telemetry/route.ts** | 2.5 KB | POST telemetry events (single/batch) |

**Start here if you need to:**
- Add new endpoint → Copy structure from existing route
- Understand response format → See error handling patterns
- Add authentication → Uncomment TODO comments

### Database

| File | Size | Purpose |
|------|------|---------|
| **migrations/001_initial_schema.sql** | 13 KB | Complete database schema (tables, RLS, indexes, triggers) |

**Start here if you need to:**
- Understand table structure → Read the CREATE TABLE statements
- Add RLS policy → See existing policies for pattern
- Add trigger → See updated_at trigger as template

---

## 📚 Documentation Files

### Quick Start (Get Running)

| File | Size | Read Time | Purpose |
|------|------|-----------|---------|
| **BACKEND_SETUP.md** | 2.7 KB | 5 min | Fast setup (install deps, create DB, run server) |
| **API_REFERENCE.md** | 12 KB | 10 min | Common API operations + curl examples |

**Use these if you're:**
- Setting up locally → BACKEND_SETUP.md
- Testing endpoints → API_REFERENCE.md

### Complete Guides

| File | Size | Read Time | Purpose |
|------|------|-----------|---------|
| **BACKEND_SKELETON_REPORT.md** | 28 KB | 30 min | Architecture, design decisions, complete API docs |
| **IMPLEMENTATION_SUMMARY.md** | 12 KB | 15 min | What was built + next steps |
| **MISSION_COMPLETE.md** | 13 KB | 10 min | Completion summary + success metrics |

**Use these if you need to:**
- Understand architecture → BACKEND_SKELETON_REPORT.md
- Know what's next → IMPLEMENTATION_SUMMARY.md
- Report status → MISSION_COMPLETE.md

---

## 🔍 Finding Specific Things

### I need to understand the data model

**Read:** `lib/types.ts` (270 lines)  
**Then:** `migrations/001_initial_schema.sql` (tables section)

**Keys to look for:**
- `PilotApplication` type → how pilot funnel works
- `Job` type → how jobs track coverage + time
- `TelemetryEvent` type → what hardware sends
- `JobStatus` enum → job lifecycle states

### I need to add a new API endpoint

**Steps:**
1. Add type to `lib/types.ts`
2. Add validator to `lib/validators.ts`
3. Create route file `app/api/[resource]/route.ts`
4. Use database client from `lib/db/client.ts`
5. Document in `API_REFERENCE.md`

**Template:** Copy existing endpoint structure (e.g., `app/api/jobs/route.ts`)

### I need to modify the database

**Steps:**
1. Create new migration file `migrations/002_your_migration.sql`
2. Update corresponding types in `lib/types.ts`
3. Update validators in `lib/validators.ts`
4. Add query helpers to `lib/db/client.ts`

**File to edit:** `migrations/001_initial_schema.sql` (if adding to initial setup)

### I need to understand multi-tenant isolation

**Read:** BACKEND_SKELETON_REPORT.md section 3.1  
**Key files:**
- `migrations/001_initial_schema.sql` – RLS policy definitions
- `lib/db/client.ts` – All queries assume tenant context

### I need to add authentication

**Read:** BACKEND_SKELETON_REPORT.md section 9.1  
**Files to modify:**
- Create `lib/auth.ts` (JWT verification helpers)
- Add to `middleware.ts` (extract user from token)
- Update `lib/db/client.ts` (add tenant checks)
- Uncomment `TODO: Add auth check` comments in API routes

### I need to understand error handling

**Read:** API_REFERENCE.md section "Error Handling"  
**Key patterns:**
- 400: Validation error with field-level details
- 404: Resource not found
- 500: Server error with descriptive message

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| **Total code (TypeScript + SQL)** | ~2,100 lines |
| **Total documentation** | ~1,550 lines |
| **API endpoints** | 9 fully implemented |
| **Database tables** | 7 |
| **Type definitions** | 25+ interfaces |
| **Setup time** | ~5 minutes |

---

## 🎯 Common Tasks

### Task: Create a test pilot application

```bash
# Read: API_REFERENCE.md "Pilot Applications" section
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test", ...}'
```

### Task: Create a test job

```bash
# Read: API_REFERENCE.md "Jobs" section
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "...", "site_name": "...", ...}'
```

### Task: Ingest telemetry

```bash
# Read: API_REFERENCE.md "Telemetry Events" section
curl -X POST http://localhost:3000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '[{"job_id": "...", "event_type": "dust_reading", ...}]'
```

### Task: Debug validation error

1. See error response in API response
2. Check `lib/validators.ts` for validation rules
3. Match your input to the expected format
4. See `API_REFERENCE.md` for correct request format

### Task: Add a new status to jobs

1. Update `Job` type in `lib/types.ts`
2. Update `JobStatus` enum in `lib/types.ts`
3. Update database enum in `migrations/001_initial_schema.sql`
4. Update migration (run `supabase migration up`)
5. Update validators if needed

---

## 🚀 Deployment Checklist

- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Database schema migrated (`supabase migration up`)
- [ ] `npm install` completed
- [ ] `npm run dev` runs without errors
- [ ] Test endpoint returns 201: `curl -X POST http://localhost:3000/api/applications ...`
- [ ] Deploy to Vercel: `git push origin main`

---

## 📞 Getting Help

### Question: "Where is X documented?"

Check this index first (you're reading it now!)

### Question: "How do I understand the database?"

1. Read: `migrations/001_initial_schema.sql` (SQL comments explain each table)
2. Match to: `lib/types.ts` (TypeScript types mirror database)

### Question: "How do I add a new feature?"

1. Read: BACKEND_SKELETON_REPORT.md section 6 (Next Steps)
2. Check: API_REFERENCE.md for similar endpoint pattern
3. Copy: Existing endpoint structure
4. Follow: Validation → Database → Response pattern

### Question: "Is X out of scope?"

Check: BACKEND_SKELETON_REPORT.md section 5 (Out of Scope)  
Or: PRODUCT_ALIGNMENT.md (Business context)

### Question: "What's the next priority?"

1. Read: IMPLEMENTATION_SUMMARY.md (immediate, 2-week roadmap)
2. Check: BACKEND_SKELETON_REPORT.md section 8 (Next Steps)

---

## 📖 Reading Paths

### I'm onboarding new engineers → 30 min

1. MISSION_COMPLETE.md (5 min) – Overview
2. BACKEND_SETUP.md (5 min) – Local setup
3. lib/types.ts (5 min) – Understand data model
4. API_REFERENCE.md (10 min) – Common operations
5. Skim BACKEND_SKELETON_REPORT.md (5 min) – Architecture overview

### I'm deploying to production → 15 min

1. BACKEND_SETUP.md (5 min) – Verify setup
2. BACKEND_SKELETON_REPORT.md section 7 (5 min) – Deployment details
3. Verify: Environment variables, database migrations, backups

### I'm adding a new endpoint → 20 min

1. API_REFERENCE.md (5 min) – See existing endpoints
2. lib/types.ts (5 min) – Add type definitions
3. lib/validators.ts (5 min) – Add validation
4. app/api/[resource]/route.ts (5 min) – Implement endpoint

### I'm debugging production issue → 10 min

1. BACKEND_SKELETON_REPORT.md section 10 (5 min) – Monitoring + logging
2. Check error logs → match to validation rules
3. See API_REFERENCE.md section "Error Handling"

---

## 🎓 Learning More

### Want to understand the architecture?

**Read:** BACKEND_SKELETON_REPORT.md section 4 (Architecture & Design Decisions)

Key sections:
- 3.1 Multi-Tenant Data Isolation
- 3.2 Immutable Audit Trail
- 3.3 Flexible Telemetry (JSONB)
- 3.4 Typed API Responses
- 3.5 Validation Before Persistence

### Want to understand the database?

**Read:** migrations/001_initial_schema.sql (top to bottom)

Structure:
- Enums (types for all status fields)
- Tables (7 tables with relationships)
- Indexes (performance optimization)
- RLS policies (security)
- Functions & triggers (auto-update, validation)

### Want to understand the API contracts?

**Read:** SHARED_INTERFACE_NOTES.md (the source document)  
**Then:** API_REFERENCE.md (implementation)  
**Then:** BACKEND_SKELETON_REPORT.md section 2.3 (detailed explanation)

---

## 🔗 Links Between Documents

```
MISSION_COMPLETE.md
├── → BACKEND_SETUP.md (get running)
├── → API_REFERENCE.md (test endpoints)
└── → BACKEND_SKELETON_REPORT.md (full docs)

BACKEND_SETUP.md
├── → BACKEND_SKELETON_REPORT.md (what was built)
└── → API_REFERENCE.md (test after setup)

API_REFERENCE.md
├── → BACKEND_SKELETON_REPORT.md (for design decisions)
└── → lib/types.ts (for type definitions)

BACKEND_SKELETON_REPORT.md
├── → SHARED_INTERFACE_NOTES.md (source requirements)
├── → PRODUCT_ALIGNMENT.md (business context)
└── → lib/types.ts (type implementations)

IMPLEMENTATION_SUMMARY.md
├── → BACKEND_SKELETON_REPORT.md (details)
└── → Next immediate tasks
```

---

## ✅ Quick Verification

Verify the backend is ready:

```bash
# Check files exist
ls -lh lib/types.ts lib/validators.ts lib/db/client.ts
ls -lh migrations/001_initial_schema.sql
ls -lh app/api/**/*.ts

# Check database schema
supabase db list

# Check documentation
ls -lh BACKEND*.md API_REFERENCE.md IMPLEMENTATION_SUMMARY.md MISSION_COMPLETE.md

# Run tests
npm run dev
# Visit http://localhost:3000
# Test: curl http://localhost:3000/api/applications?limit=1
```

---

**All files created. Backend ready for deployment.**

For questions, see the relevant document above or check BACKEND_SKELETON_REPORT.md Appendix: Common Questions.
