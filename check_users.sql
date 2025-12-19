-- ============================================
-- CHECK AND FIX USER-PARTNER LINKING
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check current users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Add missing columns if needed
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_partner_id UUID REFERENCES location_partners(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_partner_id UUID REFERENCES referral_partners(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS contractor_id UUID REFERENCES contractors(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 3. Add portal access columns to partner tables
ALTER TABLE location_partners ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE location_partners ADD COLUMN IF NOT EXISTS portal_access BOOLEAN DEFAULT false;
ALTER TABLE location_partners ADD COLUMN IF NOT EXISTS portal_invited_at TIMESTAMPTZ;

ALTER TABLE referral_partners ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE referral_partners ADD COLUMN IF NOT EXISTS portal_access BOOLEAN DEFAULT false;
ALTER TABLE referral_partners ADD COLUMN IF NOT EXISTS portal_invited_at TIMESTAMPTZ;

ALTER TABLE contractors ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS portal_access BOOLEAN DEFAULT false;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS portal_invited_at TIMESTAMPTZ;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS portal_access BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS portal_invited_at TIMESTAMPTZ;

-- 4. Check current location partners (to find Frank/April)
SELECT id, partner_id, contact_name, email, company_name, status, stage, user_id, portal_access
FROM location_partners
ORDER BY created_at DESC;

-- 5. Check current referral partners
SELECT id, partner_id, contact_full_name, contact_email, company_name, status, user_id, portal_access
FROM referral_partners
ORDER BY created_at DESC;

-- 6. Check current users
SELECT id, clerk_id, email, full_name, role, status, 
       location_partner_id, referral_partner_id, contractor_id, employee_id
FROM users
ORDER BY created_at DESC;

-- ============================================
-- MANUAL LINKING EXAMPLES
-- Replace UUIDs with actual values from queries above
-- ============================================

-- Example: Link existing user to location partner
-- UPDATE users 
-- SET location_partner_id = 'location-partner-uuid-here',
--     role = 'location_partner'
-- WHERE email = 'frank@example.com';

-- Example: Update location partner with user_id
-- UPDATE location_partners
-- SET user_id = 'clerk-user-id-here',
--     portal_access = true,
--     portal_invited_at = NOW()
-- WHERE email = 'frank@example.com';
