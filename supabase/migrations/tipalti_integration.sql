-- Tipalti Integration Migration
-- Run this in Supabase SQL Editor
-- Adds Tipalti fields to all partner tables and creates commission_payments table

-- ============================================
-- 1. ADD TIPALTI FIELDS TO LOCATION_PARTNERS
-- ============================================
ALTER TABLE location_partners
  ADD COLUMN IF NOT EXISTS tipalti_payee_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tipalti_status TEXT DEFAULT 'not_created',
  ADD COLUMN IF NOT EXISTS tipalti_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS tipalti_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tipalti_onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tipalti_last_synced TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_amount DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_location_partners_tipalti_payee_id ON location_partners(tipalti_payee_id);

-- ============================================
-- 2. ADD TIPALTI FIELDS TO REFERRAL_PARTNERS
-- ============================================
ALTER TABLE referral_partners
  ADD COLUMN IF NOT EXISTS tipalti_payee_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tipalti_status TEXT DEFAULT 'not_created',
  ADD COLUMN IF NOT EXISTS tipalti_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS tipalti_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tipalti_onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tipalti_last_synced TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_amount DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_referral_partners_tipalti_payee_id ON referral_partners(tipalti_payee_id);

-- ============================================
-- 3. ADD TIPALTI FIELDS TO CHANNEL_PARTNERS
-- ============================================
ALTER TABLE channel_partners
  ADD COLUMN IF NOT EXISTS tipalti_payee_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tipalti_status TEXT DEFAULT 'not_created',
  ADD COLUMN IF NOT EXISTS tipalti_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS tipalti_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tipalti_onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tipalti_last_synced TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_amount DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_channel_partners_tipalti_payee_id ON channel_partners(tipalti_payee_id);

-- ============================================
-- 4. ADD TIPALTI FIELDS TO RELATIONSHIP_PARTNERS
-- ============================================
ALTER TABLE relationship_partners
  ADD COLUMN IF NOT EXISTS tipalti_payee_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tipalti_status TEXT DEFAULT 'not_created',
  ADD COLUMN IF NOT EXISTS tipalti_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS tipalti_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tipalti_onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tipalti_last_synced TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_amount DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_relationship_partners_tipalti_payee_id ON relationship_partners(tipalti_payee_id);

-- ============================================
-- 5. ADD QUICKBOOKS FIELDS TO CONTRACTORS (Bill Pay, not Tipalti)
-- ============================================
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS qb_vendor_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS qb_sync_status TEXT DEFAULT 'not_synced',
  ADD COLUMN IF NOT EXISTS qb_last_synced TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_amount DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_contractors_qb_vendor_id ON contractors(qb_vendor_id);

-- ============================================
-- 6. CREATE COMMISSION_PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS commission_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Partner reference
  partner_type TEXT NOT NULL CHECK (partner_type IN ('location', 'referral', 'channel', 'relationship', 'contractor')),
  partner_id UUID NOT NULL,
  tipalti_payee_id TEXT NOT NULL,
  
  -- Invoice/Bill details
  invoice_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  commission_month DATE,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Payment details
  payment_method TEXT,
  failure_reason TEXT,
  
  -- Metadata
  calculation_details JSONB
);

CREATE INDEX IF NOT EXISTS idx_commission_payments_partner ON commission_payments(partner_type, partner_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_payee ON commission_payments(tipalti_payee_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_status ON commission_payments(status);
CREATE INDEX IF NOT EXISTS idx_commission_payments_month ON commission_payments(commission_month);

-- ============================================
-- 7. CREATE TIPALTI STATUS VIEW
-- ============================================
CREATE OR REPLACE VIEW tipalti_payees_summary AS
SELECT 
  'location' as partner_type,
  id as partner_id,
  company_legal_name as name,
  contact_email as email,
  tipalti_payee_id,
  tipalti_status,
  tipalti_payment_method,
  tipalti_onboarded_at,
  last_payment_date,
  last_payment_amount
FROM location_partners WHERE tipalti_payee_id IS NOT NULL
UNION ALL
SELECT 
  'referral' as partner_type,
  id as partner_id,
  company_name as name,
  contact_email as email,
  tipalti_payee_id,
  tipalti_status,
  tipalti_payment_method,
  tipalti_onboarded_at,
  last_payment_date,
  last_payment_amount
FROM referral_partners WHERE tipalti_payee_id IS NOT NULL
UNION ALL
SELECT 
  'channel' as partner_type,
  id as partner_id,
  company_name as name,
  contact_email as email,
  tipalti_payee_id,
  tipalti_status,
  tipalti_payment_method,
  tipalti_onboarded_at,
  last_payment_date,
  last_payment_amount
FROM channel_partners WHERE tipalti_payee_id IS NOT NULL
UNION ALL
SELECT 
  'relationship' as partner_type,
  id as partner_id,
  company_name as name,
  contact_email as email,
  tipalti_payee_id,
  tipalti_status,
  tipalti_payment_method,
  tipalti_onboarded_at,
  last_payment_date,
  last_payment_amount
FROM relationship_partners WHERE tipalti_payee_id IS NOT NULL
UNION ALL
SELECT 
  'contractor' as partner_type,
  id as partner_id,
  full_name as name,
  email as email,
  tipalti_payee_id,
  tipalti_status,
  tipalti_payment_method,
  tipalti_onboarded_at,
  last_payment_date,
  last_payment_amount
FROM contractors WHERE tipalti_payee_id IS NOT NULL;

-- ============================================
-- 8. CREATE PAYMENT SUMMARY VIEW
-- ============================================
CREATE OR REPLACE VIEW commission_payments_summary AS
SELECT 
  commission_month,
  partner_type,
  COUNT(*) as payment_count,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
  SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as total_failed,
  SUM(amount) as total_amount
FROM commission_payments
GROUP BY commission_month, partner_type
ORDER BY commission_month DESC, partner_type;

-- ============================================
-- DONE!
-- ============================================
-- 
-- Env vars to add to Vercel:
--   TIPALTI_PAYER_NAME=SkyYield
--   TIPALTI_API_KEY=your-primary-key
--   TIPALTI_WEBHOOK_SECRET=your-webhook-secret
--
-- Webhook URL to configure in Tipalti:
--   https://skyyield.io/api/webhooks/tipalti
