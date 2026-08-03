-- FloorForge Initial Schema
-- Run with: supabase migration up
-- Target: Supabase PostgreSQL

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM (
  'pilot_admin',
  'pilot_technician',
  'pilot_customer',
  'support',
  'system_admin'
);

CREATE TYPE customer_segment AS ENUM (
  'residential_high_end',
  'commercial_office',
  'commercial_retail',
  'specialty_wood',
  'facilities_management',
  'other'
);

CREATE TYPE tenant_status AS ENUM (
  'prospect',
  'pilot_candidate',
  'piloting',
  'trial',
  'active_paid',
  'churned'
);

CREATE TYPE pilot_application_status AS ENUM (
  'new',
  'contacted',
  'engaged',
  'qualified',
  'accepted',
  'onboarded',
  'piloting',
  'completed',
  'declined',
  'churned'
);

CREATE TYPE job_status AS ENUM (
  'draft',
  'queued',
  'in_progress',
  'paused',
  'completed',
  'approved',
  'rework',
  'failed',
  'archived'
);

CREATE TYPE report_status AS ENUM (
  'draft',
  'signed',
  'archived'
);

CREATE TYPE robot_platform AS ENUM (
  'sand',
  'edge',
  'coat',
  'lay',
  'scan'
);

CREATE TYPE robot_status AS ENUM (
  'available',
  'in_use',
  'in_transit',
  'maintenance',
  'error',
  'retired'
);

CREATE TYPE event_type AS ENUM (
  'pass_started',
  'pass_completed',
  'dust_reading',
  'coverage_check',
  'robot_paused',
  'robot_resumed',
  'finish_applied',
  'quality_approved',
  'quality_failed',
  'error',
  'heartbeat'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Tenants (Multi-tenant context)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  location TEXT,
  segment customer_segment NOT NULL DEFAULT 'other',
  robot_count INTEGER NOT NULL DEFAULT 0,
  status tenant_status NOT NULL DEFAULT 'prospect',
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Users (Auth context; keyed by Clerk or EcoWoods SSO)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'pilot_customer',
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Robots (Fleet units)
CREATE TABLE robots (
  id TEXT PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  platform robot_platform NOT NULL,
  serial_number TEXT NOT NULL UNIQUE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status robot_status NOT NULL DEFAULT 'available',
  location TEXT,
  hardware_version TEXT NOT NULL,
  firmware_version TEXT,
  last_firmware_check TIMESTAMP WITH TIME ZONE,
  battery_soc NUMERIC(5, 2),
  motor_hours NUMERIC(10, 2),
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  health_score NUMERIC(5, 2),
  next_service_due TIMESTAMP WITH TIME ZONE,
  service_log JSONB DEFAULT '[]'::jsonb,
  current_job_id TEXT,
  assigned_to_technician UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Pilot Applications (Interest capture, funnel)
CREATE TABLE pilot_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  monthly_sqft_target INTEGER NOT NULL,
  segment customer_segment,
  state TEXT,
  phone TEXT,
  robot_interest TEXT,
  challenge TEXT,
  source TEXT NOT NULL DEFAULT 'floorforge-site',
  source_details TEXT,
  status pilot_application_status NOT NULL DEFAULT 'new',
  status_reason TEXT,
  internal_notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  onboarded_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_monthly_sqft CHECK (monthly_sqft_target > 0)
);

-- Jobs (Floor refinishing projects)
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  site_address TEXT,
  site_notes TEXT,
  floor_type TEXT,
  floor_condition TEXT,
  sqft INTEGER NOT NULL,
  sqm NUMERIC(10, 2) NOT NULL,
  grit_sequence TEXT[] DEFAULT '{}'::text[],
  robot_id TEXT NOT NULL REFERENCES robots(id) ON DELETE RESTRICT,
  robot_type TEXT,
  operator_ids UUID[] DEFAULT '{}'::uuid[],
  estimated_duration_hours NUMERIC(10, 2),
  status job_status NOT NULL DEFAULT 'draft',
  current_pass INTEGER,
  coverage_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
  coverage_area_m2 NUMERIC(10, 2) NOT NULL DEFAULT 0,
  time_elapsed_sec INTEGER NOT NULL DEFAULT 0,
  time_remaining_sec INTEGER,
  approval_score NUMERIC(5, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_sqft CHECK (sqft > 100),
  CONSTRAINT valid_coverage CHECK (coverage_pct >= 0 AND coverage_pct <= 100)
);

-- Post-Job Reports
CREATE TABLE post_job_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  status report_status NOT NULL DEFAULT 'draft',
  grit_sequence_executed TEXT[] NOT NULL DEFAULT '{}'::text[],
  total_coverage_area_m2 NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_time_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
  coverage_approval BOOLEAN NOT NULL DEFAULT FALSE,
  coverage_approval_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  avg_dust_ugm3 NUMERIC(10, 2) NOT NULL DEFAULT 0,
  dust_peak_ugm3 NUMERIC(10, 2) NOT NULL DEFAULT 0,
  dust_samples_count INTEGER NOT NULL DEFAULT 0,
  finish_type TEXT,
  finish_coverage_m2 NUMERIC(10, 2),
  film_build_um NUMERIC(10, 2),
  photos TEXT[] DEFAULT '{}'::text[],
  signed_by UUID,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_notes TEXT,
  gc_email TEXT,
  property_manager TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Telemetry Events
CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  robot_id TEXT NOT NULL REFERENCES robots(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type event_type NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_robots_tenant_id ON robots(tenant_id);
CREATE INDEX idx_robots_status ON robots(status);
CREATE INDEX idx_pilot_applications_status ON pilot_applications(status);
CREATE INDEX idx_pilot_applications_email ON pilot_applications(email);
CREATE INDEX idx_pilot_applications_tenant_id ON pilot_applications(tenant_id);
CREATE INDEX idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX idx_jobs_robot_id ON jobs(robot_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_telemetry_events_job_id ON telemetry_events(job_id);
CREATE INDEX idx_telemetry_events_robot_id ON telemetry_events(robot_id);
CREATE INDEX idx_telemetry_events_timestamp ON telemetry_events(timestamp);
CREATE INDEX idx_telemetry_events_event_type ON telemetry_events(event_type);
CREATE INDEX idx_post_job_reports_job_id ON post_job_reports(job_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE robots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_job_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;

-- Tenants: Users can only see tenants they belong to
CREATE POLICY "Users see own tenant" ON tenants
  FOR SELECT
  USING (
    id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Users: Users see other users in their tenant or are system_admin
CREATE POLICY "Users see tenant members" ON users
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Robots: Users see robots in their tenant
CREATE POLICY "Users see tenant robots" ON robots
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Jobs: Users see jobs in their tenant
CREATE POLICY "Users see tenant jobs" ON jobs
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Pilot Applications: Only system_admin and pilot_admin can see
CREATE POLICY "Admins see all applications" ON pilot_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('system_admin', 'pilot_admin', 'support')
    )
  );

-- Post-Job Reports: Users see reports for jobs in their tenant
CREATE POLICY "Users see tenant reports" ON post_job_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = post_job_reports.job_id
      AND jobs.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Telemetry Events: Users see events for jobs in their tenant
CREATE POLICY "Users see tenant telemetry" ON telemetry_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = telemetry_events.job_id
      AND jobs.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin')
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER robots_updated_at BEFORE UPDATE ON robots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER pilot_applications_updated_at BEFORE UPDATE ON pilot_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER post_job_reports_updated_at BEFORE UPDATE ON post_job_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Validate job status transitions
CREATE OR REPLACE FUNCTION validate_job_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow any status for draft (first creation)
  -- draft → queued, in_progress, failed, archived
  -- queued → in_progress, failed, archived
  -- in_progress → paused, completed, failed, archived
  -- paused → in_progress, failed, archived
  -- completed → approved, rework, failed, archived
  -- approved → archived
  -- rework → queued, failed, archived
  -- failed → archived
  -- archived → no changes allowed

  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'archived' THEN
    RAISE EXCEPTION 'Cannot transition from archived status';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_job_status BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION validate_job_status_transition();
