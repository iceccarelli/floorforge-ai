-- FloorForge — Telemetry Integrity
-- Run with: supabase migration up
-- Target: Supabase PostgreSQL 15+
--
-- ============================================================================
-- WHY THIS MIGRATION EXISTS
-- ============================================================================
--
-- 001 shipped a schema that cannot accept the telemetry the product produces
-- and cannot accept a write of any kind. Four separate defects, one mission,
-- because none of them can be fixed alone:
--
--   1. The `event_type` enum (001:83-95) holds eleven values. `lib/types.ts`
--      and `lib/validators.ts` accept fifteen. The four extra are exactly the
--      four SOFTWARE_HARDWARE_CONTRACT.md:103 gives to the firmware, including
--      `pressure_reading` — the 1 Hz stream. A device following the contract
--      passed validation and was rejected by Postgres, surfacing as a 500.
--
--   2. RLS is enabled on all seven tables (001:274-280) with seven policies
--      (001:283-347), every one of them FOR SELECT. RLS enabled with no
--      permissive policy for a verb denies that verb, so every INSERT and
--      UPDATE in the product was denied. Fixing (1) alone changes nothing
--      while this holds.
--
--   3. There is no device identity, so RLS cannot be opened for devices
--      without opening it for the internet. Quality evidence, warranty
--      evidence and the training corpus were all forgeable by anyone who could
--      reach the endpoint.
--
--   4. There is no provenance column, so a simulated run and a measured run
--      are indistinguishable once stored. lib/simulation.ts emits events in
--      the exact shape of the firmware contract into the same endpoint. The
--      first day both a simulator and a machine write to this table, the
--      dataset becomes permanently inadmissible and every quality claim built
--      on it becomes unprovable. This is cheap now and impossible later.
--
-- The shape of the answer: devices never hold a database key. The server
-- authenticates the device against `device_credentials`, then writes with the
-- service role. So `telemetry_events` gets no anon or authenticated write
-- policy at all — that absence is deliberate and is documented in §5.

-- ============================================================================
-- 1. EVENT VOCABULARY — close the drift
-- ============================================================================
--
-- PostgreSQL 12+ permits ALTER TYPE ... ADD VALUE inside a transaction block
-- provided the new value is not *used* in the same transaction. Nothing below
-- uses them, so this is safe under `supabase migration up`, which wraps each
-- file in a transaction. On a pre-12 server, run this section on its own.
--
-- lib/types.ts:191-209 is the source of truth for this list. They are kept in
-- lockstep by tests/contract/event-vocabulary.test.mjs, which fails the build
-- when they disagree — this drift is a two-line difference between two files
-- in the same repository and it survived a dedicated product-truth audit that
-- cited both of them, because nothing compared them.

ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'pressure_reading';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'coverage_checkpoint';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'job_paused';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'job_resumed';

-- ============================================================================
-- 2. PROVENANCE
-- ============================================================================
--
-- FLOORFORGE_SYSTEM_BASELINE.md §3.6. Every value the platform stores must say
-- what kind of thing it is. The vocabulary is fixed and closed; adding to it is
-- a schema change on purpose, because "roughly measured" is how a design target
-- becomes a KPI.
--
-- Note what is NOT here: no value means "trust me". A row is measured only if a
-- credential registered as `hardware` produced it, and the server decides that
-- from the credential, never from the request body. A simulator cannot claim
-- measurement even if it asks to.

CREATE TYPE data_provenance AS ENUM (
  'measured',                -- a sensor on a real machine produced this
  'simulated',               -- lib/simulation.ts or another model produced this
  'model_estimated',         -- inferred by a model from other data
  'operator_entered',        -- a human typed it
  'manufacturer_specified',  -- from a datasheet
  'design_target',           -- what we are aiming for; not evidence of anything
  'historical'               -- carried forward from a previous job
);

CREATE TYPE device_kind AS ENUM (
  'hardware',       -- a physical machine. Stamps 'measured'.
  'simulator',      -- lib/simulation.ts and successors. Stamps 'simulated'.
  'test_harness'    -- CI and load tests. Stamps 'simulated'.
);

CREATE TYPE credential_status AS ENUM ('active', 'revoked');

-- ============================================================================
-- 3. DEVICE IDENTITY
-- ============================================================================
--
-- One row per issued credential, not per machine: a machine can hold several
-- (rotation, a staging key), and revoking one must not brick the other.
--
-- The key itself is never stored. `key_hash` is the SHA-256 of the presented
-- token; `key_prefix` is the first eight characters, stored in clear so an
-- operator can tell two credentials apart in a list and so a leaked key can be
-- traced from a log line without the log holding the secret.

CREATE TABLE device_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_id TEXT NOT NULL REFERENCES robots(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind device_kind NOT NULL,
  label TEXT,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  status credential_status NOT NULL DEFAULT 'active',
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT key_hash_is_sha256 CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT revoked_has_timestamp CHECK (
    (status = 'revoked') = (revoked_at IS NOT NULL)
  )
);

CREATE INDEX idx_device_credentials_robot_id ON device_credentials(robot_id);
CREATE INDEX idx_device_credentials_tenant_id ON device_credentials(tenant_id);
CREATE INDEX idx_device_credentials_active
  ON device_credentials(key_hash) WHERE status = 'active';

-- ============================================================================
-- 4. TELEMETRY — idempotency, resume, provenance
-- ============================================================================
--
-- A machine on a job site loses the network. The contract that makes that
-- survivable is at-least-once delivery from the edge plus exactly-once storage
-- here, which needs three things 001 did not have:
--
--   seq          monotonically increasing per (robot_id, job_id), assigned by
--                the edge before the event leaves the machine. This is what
--                makes a retry recognisable as a retry rather than a second
--                reading.
--   uniqueness   the unique index below. A duplicate insert is absorbed by
--                ON CONFLICT DO NOTHING and reported as `duplicate` — an
--                accepted outcome, not an error. The edge may then drop the
--                event from its buffer.
--   resume       max(seq) per (robot_id, job_id), which the ingest response
--                returns so a machine coming back online knows what the
--                platform already holds instead of replaying the whole job.
--
-- `seq` is nullable so that any row written before this migration stays valid.
-- The unique index below is deliberately NOT partial: Postgres treats NULLs as
-- distinct, so legacy rows with a null seq never collide with each other, and a
-- plain index is one ON CONFLICT can infer. A partial index would need its
-- predicate repeated in every ON CONFLICT clause, which the Supabase client
-- cannot express — the constraint would then be unusable by the code that
-- depends on it. Events reaching the hardened ingest path always carry a seq.

ALTER TABLE telemetry_events
  ADD COLUMN seq BIGINT,
  ADD COLUMN provenance data_provenance,
  ADD COLUMN device_credential_id UUID REFERENCES device_credentials(id) ON DELETE SET NULL,
  ADD COLUMN firmware_version TEXT,
  ADD COLUMN software_version TEXT;

-- Existing rows predate device authentication, so their provenance is not
-- knowable. They are marked as such rather than being assumed measured: an
-- unprovable row is worth less than no row, and far less than a row that
-- quietly claims to be evidence.
UPDATE telemetry_events SET provenance = 'model_estimated' WHERE provenance IS NULL;

ALTER TABLE telemetry_events
  ALTER COLUMN provenance SET NOT NULL;

-- Deliberately NO default. Every insert must state what kind of data it is.
-- A default here is how 'measured' eventually becomes the value nobody chose.

ALTER TABLE telemetry_events
  ADD CONSTRAINT seq_is_non_negative CHECK (seq IS NULL OR seq >= 0);

CREATE UNIQUE INDEX idx_telemetry_events_idempotency
  ON telemetry_events(robot_id, job_id, seq);

CREATE INDEX idx_telemetry_events_job_seq
  ON telemetry_events(job_id, seq DESC)
  WHERE seq IS NOT NULL;

CREATE INDEX idx_telemetry_events_provenance ON telemetry_events(provenance);

-- ----------------------------------------------------------------------------
-- Dead letter
-- ----------------------------------------------------------------------------
--
-- An event that fails validation used to vanish into a 500. That is the worst
-- available outcome: the machine cannot tell a rejected event from a network
-- failure, so it either retries a poison payload forever or drops evidence.
--
-- Rejects land here with the raw body intact. No foreign keys — the reason a
-- row is here may be that its job_id or robot_id does not exist.

CREATE TABLE telemetry_rejects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  device_credential_id UUID REFERENCES device_credentials(id) ON DELETE SET NULL,
  claimed_robot_id TEXT,
  claimed_job_id TEXT,
  reason_code TEXT NOT NULL,
  reason TEXT NOT NULL,
  raw JSONB NOT NULL
);

CREATE INDEX idx_telemetry_rejects_received_at ON telemetry_rejects(received_at DESC);
CREATE INDEX idx_telemetry_rejects_reason_code ON telemetry_rejects(reason_code);
CREATE INDEX idx_telemetry_rejects_credential ON telemetry_rejects(device_credential_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY — the write half
-- ============================================================================
--
-- 001 enabled RLS everywhere and then wrote SELECT policies only, which denied
-- every write in the product. The fix is not "add anon write policies". Who is
-- allowed to write what:
--
--   anon           may INSERT one thing: a pilot application, with status
--                  forced to 'new'. That is the public waitlist form and
--                  nothing else. It may not read them back.
--   authenticated  may write jobs, reports and robots inside its own tenant.
--   service_role   writes telemetry, rejects and credentials. It bypasses RLS
--                  by design, which is why it may only ever be used from a
--                  route handler that has already authenticated the caller,
--                  and why lib/db/service.ts refuses to load in a browser.
--
-- The absence of a telemetry write policy below is the design, not an
-- oversight. A credential that can write to the database directly is a
-- credential that can forge quality evidence.

ALTER TABLE device_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_rejects ENABLE ROW LEVEL SECURITY;

-- device_credentials gets no policy of any kind: not even SELECT. Key hashes
-- are readable only by the service role. An operator UI that needs to list
-- credentials reads key_prefix through a server route, never the table.

-- telemetry_rejects: tenant-scoped read so an operator can see what their own
-- machine sent that was refused. No write policy — the server writes these.
CREATE POLICY "Users see own tenant rejects" ON telemetry_rejects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = telemetry_rejects.claimed_job_id
      AND jobs.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin')
  );

-- ----------------------------------------------------------------------------
-- Pilot applications — the one public write in the product
-- ----------------------------------------------------------------------------
--
-- The waitlist form (lib/waitlist.ts:103) posts here from the browser with no
-- account. The WITH CHECK is what keeps that from being an open door: a
-- submission may only ever arrive as a new lead. Without it, anyone could
-- insert a row already marked 'qualified' with internal notes attached, into
-- the table the operator console treats as the sales pipeline.
--
-- There is still no anon SELECT policy, so the form can write and cannot read.

CREATE POLICY "Anyone may submit a pilot application" ON pilot_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND internal_notes IS NULL
    AND status_reason IS NULL
    AND contacted_at IS NULL
    AND onboarded_at IS NULL
    AND source IN ('floorforge-site', 'ecowoods-referral', 'partner', 'direct')
  );

CREATE POLICY "Admins update applications" ON pilot_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('system_admin', 'pilot_admin', 'support')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('system_admin', 'pilot_admin', 'support')
    )
  );

-- ----------------------------------------------------------------------------
-- Jobs, reports, robots — tenant-scoped writes for signed-in users
-- ----------------------------------------------------------------------------

CREATE POLICY "Users create jobs in own tenant" ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users update jobs in own tenant" ON jobs
  FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users create reports for own tenant jobs" ON post_job_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = post_job_reports.job_id
      AND jobs.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users update reports for own tenant jobs" ON post_job_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = post_job_reports.job_id
      AND jobs.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = post_job_reports.job_id
      AND jobs.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users update robots in own tenant" ON robots
  FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- ============================================================================
-- 6. JOB STATE MACHINE — enforce the table that was only ever a comment
-- ============================================================================
--
-- 001:380-406 writes out nine transition rules in a comment and then enforces
-- exactly one of them (nothing leaves 'archived'). Everything else was legal,
-- so a job could go draft -> approved without ever having run, and
-- app/api/jobs/[id]/route.ts:56 wrote `status` straight from the request body
-- with no enum check at all.
--
-- The table below is the same one 001 described. It is kept identical to
-- JOB_TRANSITIONS in lib/jobState.ts, and tests/contract/job-state-machine.test.mjs
-- fails when the two disagree. Two enforcement points are deliberate: the
-- application rejects a bad transition with a 409 and a useful message, and the
-- database refuses it even if a future code path forgets to ask.

CREATE OR REPLACE FUNCTION validate_job_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  allowed job_status[];
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  allowed := CASE OLD.status
    WHEN 'draft'       THEN ARRAY['queued','in_progress','failed','archived']::job_status[]
    WHEN 'queued'      THEN ARRAY['in_progress','draft','failed','archived']::job_status[]
    WHEN 'in_progress' THEN ARRAY['paused','completed','failed','archived']::job_status[]
    WHEN 'paused'      THEN ARRAY['in_progress','failed','archived']::job_status[]
    WHEN 'completed'   THEN ARRAY['approved','rework','failed','archived']::job_status[]
    WHEN 'approved'    THEN ARRAY['archived']::job_status[]
    WHEN 'rework'      THEN ARRAY['queued','failed','archived']::job_status[]
    WHEN 'failed'      THEN ARRAY['archived']::job_status[]
    WHEN 'archived'    THEN ARRAY[]::job_status[]
  END;

  IF NOT (NEW.status = ANY(allowed)) THEN
    RAISE EXCEPTION
      'Illegal job status transition: % -> %. Allowed from %: %',
      OLD.status, NEW.status, OLD.status,
      COALESCE(array_to_string(allowed, ', '), '(terminal)')
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. RESUME SUPPORT
-- ============================================================================
--
-- What a machine asks for when it reconnects: "what is the last thing you have
-- from me on this job?" Answered from the index created in §4, so it stays
-- cheap as a job accumulates hours of 1 Hz samples.

CREATE OR REPLACE FUNCTION telemetry_max_seq(p_robot_id TEXT, p_job_id TEXT)
RETURNS BIGINT AS $$
  SELECT MAX(seq) FROM telemetry_events
  WHERE robot_id = p_robot_id AND job_id = p_job_id AND seq IS NOT NULL;
$$ LANGUAGE sql STABLE;
