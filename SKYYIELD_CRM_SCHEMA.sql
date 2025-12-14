-- ============================================
-- CRM SCHEMA FOR SKYYIELD
-- Run this in Supabase SQL Editor
-- ============================================

-- Prospect types enum
CREATE TYPE prospect_type AS ENUM (
  'location_partner',
  'referral_partner', 
  'channel_partner',
  'relationship_partner',
  'contractor'
);

-- Prospect status enum
CREATE TYPE prospect_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiating',
  'won',
  'lost',
  'archived'
);

-- Activity types enum
CREATE TYPE activity_type AS ENUM (
  'email',
  'call',
  'meeting',
  'note',
  'status_change',
  'form_sent'
);

-- ============================================
-- PROSPECTS TABLE
-- ============================================
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type and Status
  prospect_type prospect_type NOT NULL DEFAULT 'location_partner',
  status prospect_status NOT NULL DEFAULT 'new',
  
  -- Contact Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  title VARCHAR(100),
  
  -- Company Information
  company_name VARCHAR(255),
  company_type VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(50),
  
  -- Lead Information
  source VARCHAR(100),
  source_detail VARCHAR(255),
  estimated_value DECIMAL(12,2),
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  
  -- Follow-up Tracking
  last_contact_date TIMESTAMPTZ,
  next_follow_up_date TIMESTAMPTZ,
  follow_up_count INTEGER DEFAULT 0,
  
  -- Notes and Tags
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for prospects
CREATE INDEX idx_prospects_type ON prospects(prospect_type);
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_email ON prospects(email);
CREATE INDEX idx_prospects_company ON prospects(company_name);
CREATE INDEX idx_prospects_assigned ON prospects(assigned_to);
CREATE INDEX idx_prospects_created ON prospects(created_at DESC);

-- ============================================
-- PROSPECT ACTIVITIES TABLE
-- ============================================
CREATE TABLE prospect_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  
  created_by VARCHAR(255) DEFAULT 'System',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for activities
CREATE INDEX idx_prospect_activities_prospect ON prospect_activities(prospect_id);
CREATE INDEX idx_prospect_activities_created ON prospect_activities(created_at DESC);

-- ============================================
-- ADDITIONAL PARTNER TABLES (if not exist)
-- ============================================

-- Channel Partners
CREATE TABLE IF NOT EXISTS channel_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id VARCHAR(50) UNIQUE,
  
  -- Company Info
  company_name VARCHAR(255) NOT NULL,
  company_type VARCHAR(100),
  
  -- Contact Info
  contact_name VARCHAR(200) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  contact_title VARCHAR(100),
  
  -- Location
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  
  -- Pipeline
  pipeline_stage VARCHAR(50) DEFAULT 'application',
  
  -- Commission
  commission_tier VARCHAR(50) DEFAULT 'standard',
  commission_percentage DECIMAL(5,2) DEFAULT 10,
  total_clients_referred INTEGER DEFAULT 0,
  total_revenue_generated DECIMAL(12,2) DEFAULT 0,
  
  -- Payment
  tipalti_payee_id VARCHAR(100),
  tipalti_status VARCHAR(50) DEFAULT 'not_invited',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationship Partners
CREATE TABLE IF NOT EXISTS relationship_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id VARCHAR(50) UNIQUE,
  
  -- Company Info
  company_name VARCHAR(255) NOT NULL,
  company_type VARCHAR(100),
  
  -- Contact Info
  contact_name VARCHAR(200) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  contact_title VARCHAR(100),
  
  -- Location
  city VARCHAR(100),
  state VARCHAR(50),
  
  -- Pipeline
  pipeline_stage VARCHAR(50) DEFAULT 'application',
  
  -- Revenue Sharing
  revenue_share_percentage DECIMAL(5,2) DEFAULT 15,
  total_portfolio_value DECIMAL(12,2) DEFAULT 0,
  
  -- Payment
  tipalti_payee_id VARCHAR(100),
  tipalti_status VARCHAR(50) DEFAULT 'not_invited',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractors
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id VARCHAR(50) UNIQUE,
  
  -- Personal Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  
  -- Location (service area)
  address_line_1 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  service_radius_miles INTEGER DEFAULT 50,
  
  -- Qualifications
  certifications TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  years_experience INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, active, inactive
  background_check_status VARCHAR(50),
  background_check_date DATE,
  
  -- Payment
  hourly_rate DECIMAL(8,2),
  per_install_rate DECIMAL(8,2),
  tipalti_payee_id VARCHAR(100),
  tipalti_status VARCHAR(50) DEFAULT 'not_invited',
  
  -- Stats
  total_jobs_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs/Installations table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number VARCHAR(50) UNIQUE,
  
  -- Assignment
  contractor_id UUID REFERENCES contractors(id),
  venue_id UUID REFERENCES venues(id),
  location_partner_id UUID REFERENCES location_partners(id),
  
  -- Job Details
  job_type VARCHAR(50) NOT NULL, -- install, maintenance, removal, repair
  description TEXT,
  
  -- Scheduling
  scheduled_date DATE,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, assigned, scheduled, in_progress, completed, cancelled
  
  -- Equipment
  equipment_list JSONB DEFAULT '[]',
  equipment_serial_numbers TEXT[] DEFAULT '{}',
  
  -- Completion
  completion_notes TEXT,
  completion_photos TEXT[] DEFAULT '{}',
  customer_signature TEXT,
  
  -- Payment
  payment_amount DECIMAL(8,2),
  payment_status VARCHAR(50) DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for jobs
CREATE INDEX idx_jobs_contractor ON jobs(contractor_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled ON jobs(scheduled_date);

-- ============================================
-- AUTO-GENERATE IDS TRIGGERS
-- ============================================

-- Function to generate partner IDs
CREATE OR REPLACE FUNCTION generate_partner_id()
RETURNS TRIGGER AS $$
DECLARE
  prefix VARCHAR(10);
  year_part VARCHAR(4);
  seq_num INTEGER;
  new_id VARCHAR(50);
BEGIN
  -- Determine prefix based on table
  CASE TG_TABLE_NAME
    WHEN 'channel_partners' THEN prefix := 'CP';
    WHEN 'relationship_partners' THEN prefix := 'RP';
    WHEN 'contractors' THEN prefix := 'CON';
    ELSE prefix := 'PTR';
  END CASE;
  
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number
  EXECUTE format('SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM ''[0-9]+$'') AS INTEGER)), 0) + 1 FROM %I WHERE %I IS NOT NULL', 
    CASE TG_TABLE_NAME 
      WHEN 'contractors' THEN 'contractor_id'
      ELSE 'partner_id'
    END,
    TG_TABLE_NAME,
    CASE TG_TABLE_NAME 
      WHEN 'contractors' THEN 'contractor_id'
      ELSE 'partner_id'
    END
  ) INTO seq_num;
  
  new_id := prefix || '-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  IF TG_TABLE_NAME = 'contractors' THEN
    NEW.contractor_id := new_id;
  ELSE
    NEW.partner_id := new_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER set_channel_partner_id
  BEFORE INSERT ON channel_partners
  FOR EACH ROW
  WHEN (NEW.partner_id IS NULL)
  EXECUTE FUNCTION generate_partner_id();

CREATE TRIGGER set_relationship_partner_id
  BEFORE INSERT ON relationship_partners
  FOR EACH ROW
  WHEN (NEW.partner_id IS NULL)
  EXECUTE FUNCTION generate_partner_id();

CREATE TRIGGER set_contractor_id
  BEFORE INSERT ON contractors
  FOR EACH ROW
  WHEN (NEW.contractor_id IS NULL)
  EXECUTE FUNCTION generate_partner_id();

-- Job number trigger
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part VARCHAR(4);
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM jobs
  WHERE job_number IS NOT NULL;
  
  NEW.job_number := 'JOB-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_number
  BEFORE INSERT ON jobs
  FOR EACH ROW
  WHEN (NEW.job_number IS NULL)
  EXECUTE FUNCTION generate_job_number();

-- ============================================
-- RLS POLICIES (optional - enable as needed)
-- ============================================

-- ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prospect_activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE channel_partners ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE relationship_partners ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DONE!
-- ============================================
SELECT 'CRM Schema created successfully!' as status;
