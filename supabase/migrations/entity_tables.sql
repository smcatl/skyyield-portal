-- Additional Entity Tables Migration
-- Run this in Supabase SQL Editor
-- Creates employees, calculator_users, and customers tables with consistent ID patterns

-- ============================================
-- 1. EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Unique identifier for integrations
  employee_id TEXT UNIQUE GENERATED ALWAYS AS ('EMP-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8))) STORED,
  
  -- Personal info
  legal_name TEXT NOT NULL,
  preferred_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  ssn_last_four TEXT, -- Only store last 4 for reference
  
  -- Address
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  address_country TEXT DEFAULT 'US',
  
  -- Employment details
  department TEXT,
  job_title TEXT,
  employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
  start_date DATE,
  end_date DATE,
  manager_id UUID REFERENCES employees(id),
  salary DECIMAL(10,2),
  pay_frequency TEXT CHECK (pay_frequency IN ('weekly', 'biweekly', 'semimonthly', 'monthly')),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'on_leave', 'terminated')),
  
  -- Document tracking (DocuSeal)
  offer_letter_status TEXT DEFAULT 'not_sent' CHECK (offer_letter_status IN ('not_sent', 'sent', 'signed', 'declined')),
  offer_letter_docuseal_id TEXT,
  offer_letter_signed_at TIMESTAMPTZ,
  
  non_compete_status TEXT DEFAULT 'not_sent' CHECK (non_compete_status IN ('not_sent', 'sent', 'signed', 'declined', 'not_required')),
  non_compete_docuseal_id TEXT,
  non_compete_signed_at TIMESTAMPTZ,
  
  nda_status TEXT DEFAULT 'not_sent' CHECK (nda_status IN ('not_sent', 'sent', 'signed', 'declined')),
  nda_docuseal_id TEXT,
  nda_signed_at TIMESTAMPTZ,
  
  -- Write-ups (can have multiple, store as array or separate table)
  writeup_count INTEGER DEFAULT 0,
  last_writeup_date DATE,
  last_writeup_docuseal_id TEXT,
  
  -- Termination
  termination_reason TEXT,
  termination_docuseal_id TEXT,
  termination_date DATE,
  
  -- QuickBooks Payroll integration (NOT Tipalti)
  qb_employee_id TEXT UNIQUE,
  qb_payroll_status TEXT DEFAULT 'not_created',
  qb_last_synced TIMESTAMPTZ,
  
  -- Clerk integration
  clerk_user_id TEXT UNIQUE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_clerk ON employees(clerk_user_id);

-- ============================================
-- 2. EMPLOYEE WRITE-UPS TABLE (for multiple write-ups per employee)
-- ============================================
CREATE TABLE IF NOT EXISTS employee_writeups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Write-up details
  writeup_date DATE NOT NULL DEFAULT CURRENT_DATE,
  writeup_type TEXT CHECK (writeup_type IN ('verbal_warning', 'written_warning', 'final_warning', 'suspension', 'other')),
  reason TEXT NOT NULL,
  description TEXT,
  
  -- Document
  docuseal_submission_id TEXT,
  docuseal_status TEXT DEFAULT 'not_sent',
  signed_at TIMESTAMPTZ,
  
  -- Who issued it
  issued_by UUID REFERENCES employees(id),
  issued_by_name TEXT,
  
  -- Acknowledgment
  employee_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_writeups_employee ON employee_writeups(employee_id);

-- ============================================
-- 3. CALCULATOR_USERS TABLE (Location Intelligence Calculator)
-- ============================================
CREATE TABLE IF NOT EXISTS calculator_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Unique identifier
  calculator_user_id TEXT UNIQUE GENERATED ALWAYS AS ('CALC-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8))) STORED,
  
  -- Personal/Company info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  company_name TEXT,
  job_title TEXT,
  
  -- Subscription
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'trial', 'active', 'cancelled', 'expired')),
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_start_date DATE,
  subscription_end_date DATE,
  
  -- Usage tracking
  reports_used_this_month INTEGER DEFAULT 0,
  reports_limit INTEGER DEFAULT 5, -- Free tier gets 5
  total_reports_generated INTEGER DEFAULT 0,
  last_report_date TIMESTAMPTZ,
  
  -- Clerk integration
  clerk_user_id TEXT UNIQUE,
  
  -- Lead tracking (potential partner conversion)
  lead_score INTEGER DEFAULT 0,
  interested_in_partnership BOOLEAN DEFAULT FALSE,
  converted_to_partner BOOLEAN DEFAULT FALSE,
  converted_partner_id UUID,
  converted_partner_type TEXT,
  
  -- Metadata
  referral_source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calculator_users_email ON calculator_users(email);
CREATE INDEX IF NOT EXISTS idx_calculator_users_clerk ON calculator_users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_users_subscription ON calculator_users(subscription_status);

-- ============================================
-- 4. CUSTOMERS TABLE (End users of WiFi service)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Unique identifier
  customer_id TEXT UNIQUE GENERATED ALWAYS AS ('CUST-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8))) STORED,
  
  -- Personal info
  full_name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Optional account info
  has_account BOOLEAN DEFAULT FALSE,
  clerk_user_id TEXT UNIQUE,
  
  -- Usage tracking
  first_connection_at TIMESTAMPTZ,
  last_connection_at TIMESTAMPTZ,
  total_sessions INTEGER DEFAULT 0,
  total_data_used_mb DECIMAL(12,2) DEFAULT 0,
  
  -- Location association
  primary_location_id UUID, -- References location_partners if needed
  locations_visited UUID[], -- Array of location IDs
  
  -- Marketing
  opted_in_marketing BOOLEAN DEFAULT FALSE,
  opted_in_at TIMESTAMPTZ,
  
  -- Metadata
  device_type TEXT,
  referral_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_clerk ON customers(clerk_user_id);

-- ============================================
-- 5. UPDATE TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calculator_users_updated_at ON calculator_users;
CREATE TRIGGER update_calculator_users_updated_at
    BEFORE UPDATE ON calculator_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. COMPREHENSIVE ENTITY ID VIEW
-- ============================================
CREATE OR REPLACE VIEW all_entity_ids AS
-- Location Partners (Tipalti)
SELECT 
  'location_partner' as entity_type,
  id as uuid,
  'LP-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)) as entity_id,
  contact_full_name as name,
  contact_email as email,
  company_legal_name as company,
  tipalti_payee_id as payment_system_id,
  'tipalti' as payment_system
FROM location_partners
UNION ALL
-- Referral Partners (Tipalti)
SELECT 
  'referral_partner' as entity_type,
  id as uuid,
  'RP-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)) as entity_id,
  contact_full_name as name,
  contact_email as email,
  company_name as company,
  tipalti_payee_id as payment_system_id,
  'tipalti' as payment_system
FROM referral_partners
UNION ALL
-- Channel Partners (Tipalti)
SELECT 
  'channel_partner' as entity_type,
  id as uuid,
  'CP-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)) as entity_id,
  contact_full_name as name,
  contact_email as email,
  company_name as company,
  tipalti_payee_id as payment_system_id,
  'tipalti' as payment_system
FROM channel_partners
UNION ALL
-- Relationship Partners (Tipalti)
SELECT 
  'relationship_partner' as entity_type,
  id as uuid,
  'REL-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)) as entity_id,
  contact_full_name as name,
  contact_email as email,
  company_name as company,
  tipalti_payee_id as payment_system_id,
  'tipalti' as payment_system
FROM relationship_partners
UNION ALL
-- Contractors (QuickBooks Bill Pay)
SELECT 
  'contractor' as entity_type,
  id as uuid,
  'CON-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)) as entity_id,
  COALESCE(dba_name, legal_name) as name,
  contact_email as email,
  legal_name as company,
  qb_vendor_id as payment_system_id,
  'quickbooks_billpay' as payment_system
FROM contractors
UNION ALL
-- Employees (QuickBooks Payroll)
SELECT 
  'employee' as entity_type,
  id as uuid,
  employee_id as entity_id,
  legal_name as name,
  email as email,
  NULL as company,
  qb_employee_id as payment_system_id,
  'quickbooks_payroll' as payment_system
FROM employees
UNION ALL
-- Calculator Users (No payments)
SELECT 
  'calculator_user' as entity_type,
  id as uuid,
  calculator_user_id as entity_id,
  full_name as name,
  email as email,
  company_name as company,
  NULL as payment_system_id,
  'none' as payment_system
FROM calculator_users
UNION ALL
-- Customers (No payments)
SELECT 
  'customer' as entity_type,
  id as uuid,
  customer_id as entity_id,
  full_name as name,
  email as email,
  NULL as company,
  NULL as payment_system_id,
  'none' as payment_system
FROM customers;

-- ============================================
-- DONE!
-- ============================================
-- 
-- Entity ID formats:
--   LP-XXXXXXXX   = Location Partner
--   RP-XXXXXXXX   = Referral Partner
--   CP-XXXXXXXX   = Channel Partner
--   REL-XXXXXXXX  = Relationship Partner
--   CON-XXXXXXXX  = Contractor
--   EMP-XXXXXXXX  = Employee
--   CALC-XXXXXXXX = Calculator User
--   CUST-XXXXXXXX = Customer
--
-- The entity_id columns are auto-generated from the UUID!
