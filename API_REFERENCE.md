# FloorForge API Reference

Quick reference for common operations. See `BACKEND_SKELETON_REPORT.md` for detailed documentation.

## Base URL

```
http://localhost:3000/api  (development)
https://api.floorforge.ai  (production, TBD — domain not yet registered)
```

## Response Format

All responses follow this envelope:

**Success (200, 201):**
```json
{
  "data": { ... }
}
```

**Error (400, 404, 500):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "errors": [...] }
  }
}
```

---

## Pilot Applications

### Create Application (Public)

```
POST /api/applications
Content-Type: application/json

{
  "email": "john@example.com",
  "name": "John Doe",
  "company": "Acme Flooring",
  "monthly_sqft_target": 5000,
  "segment": "commercial_office",
  "state": "CA",
  "phone": "+1-555-0100",
  "robot_interest": "sand",
  "challenge": "Inconsistent grit coverage on large jobs",
  "source": "floorforge-site",
  "source_details": null
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "email": "john@example.com",
    "name": "John Doe",
    "company": "Acme Flooring",
    "monthly_sqft_target": 5000,
    "segment": "commercial_office",
    "state": "CA",
    "phone": "+1-555-0100",
    "robot_interest": "sand",
    "challenge": "Inconsistent grit coverage on large jobs",
    "source": "floorforge-site",
    "status": "new",
    "status_reason": null,
    "internal_notes": null,
    "created_at": "2026-08-03T19:30:00Z",
    "updated_at": "2026-08-03T19:30:00Z",
    "contacted_at": null,
    "onboarded_at": null,
    "user_id": null,
    "tenant_id": null
  }
}
```

### List Applications (Admin Only)

```
GET /api/applications?status=new&limit=20&offset=0
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status` – Filter by status (new, contacted, engaged, qualified, accepted, onboarded, piloting, completed, declined, churned)
- `limit` – Results per page (1–100, default 20)
- `offset` – Pagination offset (default 0)

**Response: 200 OK**
```json
{
  "data": {
    "data": [
      { ... application ... },
      { ... application ... }
    ],
    "total_count": 42,
    "offset": 0,
    "limit": 20,
    "has_more": true
  }
}
```

### Get Single Application

```
GET /api/applications/{id}
Authorization: Bearer <jwt_token>
```

**Response: 200 OK**
```json
{
  "data": { ... application ... }
}
```

### Update Application

```
PATCH /api/applications/{id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "qualified",
  "status_reason": null,
  "internal_notes": "Perfect fit. Willing to test ForgeSand D1.",
  "contacted_at": "2026-08-03T19:35:00Z"
}
```

**Response: 200 OK**
```json
{
  "data": { ... updated application ... }
}
```

---

## Jobs

### Create Job

```
POST /api/jobs
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "site_name": "Meridian Tower Floor 12",
  "site_address": "123 Main St, San Francisco, CA",
  "site_notes": "Furniture already removed. Vents covered. Ready to start.",
  "floor_type": "hardwood",
  "floor_condition": "raw",
  "sqft": 5000,
  "sqm": 465,
  "grit_sequence": ["36", "80", "120"],
  "robot_id": "FF-S001",
  "robot_type": "ForgeSand D1",
  "operator_ids": ["user-uuid-1", "user-uuid-2"],
  "estimated_duration_hours": 8,
  "status": "draft"
}
```

**Required Fields:**
- `tenant_id` – Pilot customer account ID
- `site_name` – Human-readable job name
- `sqft` – Floor area in square feet (min 100)
- `sqm` – Floor area in square meters
- `robot_id` – Robot unit ID (e.g., FF-S001)

**Response: 201 Created**
```json
{
  "data": {
    "id": "job-1693667400123abc",
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "site_name": "Meridian Tower Floor 12",
    "site_address": "123 Main St, San Francisco, CA",
    "sqft": 5000,
    "sqm": 465,
    "robot_id": "FF-S001",
    "status": "draft",
    "coverage_pct": 0,
    "coverage_area_m2": 0,
    "time_elapsed_sec": 0,
    "approval_score": null,
    "created_at": "2026-08-03T19:30:00Z",
    "updated_at": "2026-08-03T19:30:00Z",
    "started_at": null,
    "completed_at": null,
    "post_job_report": {
      "id": "uuid",
      "job_id": "job-1693667400123abc",
      "status": "draft",
      "coverage_approval": false,
      "coverage_approval_score": 0,
      ...
    }
  }
}
```

### List Jobs

```
GET /api/jobs?tenant_id=XXX&status=in_progress&limit=20&offset=0
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `tenant_id` – Required; filter by tenant
- `status` – Optional; filter by job status
- `robot_id` – Optional; filter by robot
- `limit` – Results per page (1–100)
- `offset` – Pagination offset

**Response: 200 OK**
```json
{
  "data": {
    "data": [
      { ... job ... },
      { ... job ... }
    ],
    "total_count": 42,
    "offset": 0,
    "limit": 20,
    "has_more": true
  }
}
```

### Get Single Job (with Telemetry)

```
GET /api/jobs/{id}
Authorization: Bearer <jwt_token>
```

**Response: 200 OK**
```json
{
  "data": {
    "id": "job-1693667400123abc",
    "status": "in_progress",
    "coverage_pct": 67.2,
    "coverage_area_m2": 313,
    "time_elapsed_sec": 1800,
    "time_remaining_sec": 900,
    "current_pass": 1,
    ...job fields...,
    "telemetry_events": [
      {
        "id": "uuid",
        "job_id": "job-1693667400123abc",
        "robot_id": "FF-S001",
        "timestamp": "2026-08-03T09:05:15Z",
        "event_type": "dust_reading",
        "data": {
          "ugm3": 12.3,
          "location_x_pct": 50,
          "location_z_pct": 30
        }
      },
      ...more events...
    ],
    "post_job_report": {
      "id": "uuid",
      "status": "draft",
      "coverage_approval": false,
      ...
    }
  }
}
```

### Update Job

```
PATCH /api/jobs/{id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "in_progress",
  "coverage_pct": 42.5,
  "coverage_area_m2": 197.5,
  "time_elapsed_sec": 1500,
  "time_remaining_sec": 2100,
  "current_pass": 1,
  "site_notes": "Minor debris in corner, cleared."
}
```

**Common Status Transitions:**
- `draft` → `queued` (customer approves)
- `queued` → `in_progress` (robot starts)
- `in_progress` → `paused` (manual intervention needed)
- `paused` → `in_progress` (resumed)
- `in_progress` → `completed` (all passes done)
- `completed` → `approved` (QA passed)
- `completed` → `rework` (QA failed; re-do pass)

**Response: 200 OK**
```json
{
  "data": { ... updated job ... }
}
```

---

## Telemetry Events

### Ingest Single Event

```
POST /api/telemetry
Content-Type: application/json

{
  "job_id": "job-1693667400123abc",
  "robot_id": "FF-S001",
  "timestamp": "2026-08-03T09:05:15Z",
  "event_type": "dust_reading",
  "data": {
    "ugm3": 14.5,
    "location_x_pct": 50,
    "location_z_pct": 30,
    "sample_duration_sec": 5
  }
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "uuid",
    "job_id": "job-1693667400123abc",
    "robot_id": "FF-S001",
    "timestamp": "2026-08-03T09:05:15Z",
    "event_type": "dust_reading",
    "data": { ... },
    "received_at": "2026-08-03T09:05:15.123Z",
    "created_at": "2026-08-03T09:05:15.123Z"
  }
}
```

### Ingest Batch (Recommended)

```
POST /api/telemetry
Content-Type: application/json

[
  {
    "job_id": "job-1693667400123abc",
    "robot_id": "FF-S001",
    "timestamp": "2026-08-03T09:05:00Z",
    "event_type": "pass_started",
    "data": {
      "pass_number": 1,
      "grit_tag": "36",
      "estimated_duration_sec": 3600,
      "coverage_target_area_m2": 465
    }
  },
  {
    "job_id": "job-1693667400123abc",
    "robot_id": "FF-S001",
    "timestamp": "2026-08-03T09:05:15Z",
    "event_type": "dust_reading",
    "data": {
      "ugm3": 12.3,
      "location_x_pct": 10,
      "location_z_pct": 20
    }
  }
]
```

**Response: 201 Created**
```json
{
  "data": [
    { ... event 1 ... },
    { ... event 2 ... }
  ]
}
```

### Event Types

```
pass_started          { pass_number, grit_tag, estimated_duration_sec }
pass_completed        { pass_number, coverage_area_m2, coverage_pct, dust_readings[] }
dust_reading          { ugm3, location_x_pct?, location_z_pct? }
coverage_check        { area_checked_m2, coverage_pct, gaps_detected, recommendation }
robot_paused          { reason, human_action_required }
robot_resumed         { from_event_id? }
finish_applied        { type, film_build_um? }
quality_approved      { approval_result, score }
quality_failed        { reason, recommendation }
error                 { error_code, error_message, severity }
heartbeat             { status, battery_soc?, motor_hours? }
```

---

## Error Handling

### Validation Error (400)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "errors": [
        { "field": "email", "message": "Invalid email format" },
        { "field": "monthly_sqft_target", "message": "Must be greater than 0" }
      ]
    }
  }
}
```

### Not Found (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Application not found"
  }
}
```

### Server Error (500)

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Failed to create pilot application: connection refused"
  }
}
```

---

## Common Workflows

### Workflow 1: Pilot Application → Onboarding

```bash
# 1. Customer submits form
curl -X POST http://localhost:3000/api/applications \
  -d '{ "email": "...", "name": "...", ... }'

# 2. Admin updates status
curl -X PATCH http://localhost:3000/api/applications/{id} \
  -d '{ "status": "qualified" }'

# 3. Customer signs T&Cs, gets user_id + tenant_id
curl -X PATCH http://localhost:3000/api/applications/{id} \
  -d '{ "status": "onboarded", "user_id": "...", "tenant_id": "..." }'
```

### Workflow 2: Job Execution

```bash
# 1. Create job
curl -X POST http://localhost:3000/api/jobs \
  -d '{ "tenant_id": "...", "site_name": "...", ... }'

# 2. Approve and queue
curl -X PATCH http://localhost:3000/api/jobs/{id} \
  -d '{ "status": "queued" }'

# 3. Start job
curl -X PATCH http://localhost:3000/api/jobs/{id} \
  -d '{ "status": "in_progress", "started_at": "..." }'

# 4. Stream telemetry (every 5-10 seconds)
curl -X POST http://localhost:3000/api/telemetry \
  -d '[{ "job_id": "...", "event_type": "dust_reading", ... }]'

# 5. Track progress
curl http://localhost:3000/api/jobs/{id}

# 6. Complete job
curl -X PATCH http://localhost:3000/api/jobs/{id} \
  -d '{ "status": "completed", "completed_at": "..." }'

# 7. Customer reviews report + signs off (future endpoint)
```

---

## Testing with curl

### Create Pilot Application
```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pilot@contractor.com",
    "name": "Jane Pilot",
    "company": "Precision Flooring",
    "monthly_sqft_target": 8000,
    "segment": "commercial_retail",
    "robot_interest": "sand",
    "source": "floorforge-site"
  }'
```

### List Applications
```bash
curl 'http://localhost:3000/api/applications?limit=5'
```

### Create Job
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "site_name": "Downtown Office",
    "sqft": 3500,
    "sqm": 325,
    "robot_id": "FF-S001"
  }'
```

### Ingest Telemetry
```bash
curl -X POST http://localhost:3000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job-1693667400123abc",
    "robot_id": "FF-S001",
    "timestamp": "2026-08-03T09:05:15Z",
    "event_type": "dust_reading",
    "data": { "ugm3": 14.5 }
  }'
```

---

## Rate Limits (Future)

Not yet implemented. Pilot phase is unlimited.

**Planned (post-pilot):**
- 100 requests/minute per API key
- 1,000 telemetry events/second per job

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK – successful GET, PATCH |
| 201 | Created – successful POST |
| 400 | Bad Request – validation failed |
| 401 | Unauthorized – missing/invalid token |
| 403 | Forbidden – insufficient permissions |
| 404 | Not Found – resource doesn't exist |
| 500 | Server Error – internal problem |

---

## Support

- **Documentation:** See `BACKEND_SKELETON_REPORT.md`
- **Setup:** See `BACKEND_SETUP.md`
- **Types:** See `lib/types.ts`
- **Validation:** See `lib/validators.ts`

**Email:** hello@floorforge.ai
