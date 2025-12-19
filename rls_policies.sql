-- ============================================
-- COMPREHENSIVE RLS POLICIES FOR SKYYIELD
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. HELPER FUNCTIONS
-- ============================================

-- Get current user's role from users table
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE clerk_id = auth.uid()::text
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get current user's linked entity IDs
CREATE OR REPLACE FUNCTION get_user_partner_id()
RETURNS UUID AS $$
  SELECT 
    COALESCE(
      location_partner_id,
      referral_partner_id,
      contractor_id,
      employee_id
    )
  FROM users WHERE clerk_id = auth.uid()::text
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is admin or employee with admin privileges
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE clerk_id = auth.uid()::text 
    AND role IN ('admin', 'super_admin')
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is any SkyYield internal role
CREATE OR REPLACE FUNCTION is_internal()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE clerk_id = auth.uid()::text 
    AND role IN ('admin', 'super_admin', 'employee')
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- 3. USERS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;

-- Users can see their own record
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (clerk_id = auth.uid()::text);

-- Admins can see all users
CREATE POLICY "users_select_admin" ON users
  FOR SELECT USING (is_admin());

-- Anyone can insert (for registration via Clerk webhook)
CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (true);

-- Users can update their own record
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (clerk_id = auth.uid()::text);

-- Admins can update any user
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE USING (is_admin());

-- ============================================
-- 4. LOCATION PARTNERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "lp_select_own" ON location_partners;
DROP POLICY IF EXISTS "lp_select_admin" ON location_partners;
DROP POLICY IF EXISTS "lp_select_referrer" ON location_partners;
DROP POLICY IF EXISTS "lp_insert" ON location_partners;
DROP POLICY IF EXISTS "lp_update_own" ON location_partners;
DROP POLICY IF EXISTS "lp_update_admin" ON location_partners;

-- Location partners can see their own record
CREATE POLICY "lp_select_own" ON location_partners
  FOR SELECT USING (
    id = (SELECT location_partner_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins and employees can see all location partners
CREATE POLICY "lp_select_admin" ON location_partners
  FOR SELECT USING (is_internal());

-- Referral partners can see location partners they referred
CREATE POLICY "lp_select_referrer" ON location_partners
  FOR SELECT USING (
    referred_by_partner_id = (SELECT referral_partner_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Anyone can insert (application forms)
CREATE POLICY "lp_insert" ON location_partners
  FOR INSERT WITH CHECK (true);

-- Location partners can update their own record (limited fields)
CREATE POLICY "lp_update_own" ON location_partners
  FOR UPDATE USING (
    id = (SELECT location_partner_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins can update any location partner
CREATE POLICY "lp_update_admin" ON location_partners
  FOR UPDATE USING (is_admin());

-- ============================================
-- 5. REFERRAL PARTNERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "rp_select_own" ON referral_partners;
DROP POLICY IF EXISTS "rp_select_admin" ON referral_partners;
DROP POLICY IF EXISTS "rp_insert" ON referral_partners;
DROP POLICY IF EXISTS "rp_update_own" ON referral_partners;
DROP POLICY IF EXISTS "rp_update_admin" ON referral_partners;

-- Referral partners can see their own record
CREATE POLICY "rp_select_own" ON referral_partners
  FOR SELECT USING (
    id = (SELECT referral_partner_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins and employees can see all referral partners
CREATE POLICY "rp_select_admin" ON referral_partners
  FOR SELECT USING (is_internal());

-- Anyone can insert (application forms)
CREATE POLICY "rp_insert" ON referral_partners
  FOR INSERT WITH CHECK (true);

-- Referral partners can update their own record
CREATE POLICY "rp_update_own" ON referral_partners
  FOR UPDATE USING (
    id = (SELECT referral_partner_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins can update any referral partner
CREATE POLICY "rp_update_admin" ON referral_partners
  FOR UPDATE USING (is_admin());

-- ============================================
-- 6. CONTRACTORS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "con_select_own" ON contractors;
DROP POLICY IF EXISTS "con_select_admin" ON contractors;
DROP POLICY IF EXISTS "con_insert" ON contractors;
DROP POLICY IF EXISTS "con_update_own" ON contractors;
DROP POLICY IF EXISTS "con_update_admin" ON contractors;

-- Contractors can see their own record
CREATE POLICY "con_select_own" ON contractors
  FOR SELECT USING (
    id = (SELECT contractor_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins and employees can see all contractors
CREATE POLICY "con_select_admin" ON contractors
  FOR SELECT USING (is_internal());

-- Anyone can insert (application forms)
CREATE POLICY "con_insert" ON contractors
  FOR INSERT WITH CHECK (true);

-- Contractors can update their own record
CREATE POLICY "con_update_own" ON contractors
  FOR UPDATE USING (
    id = (SELECT contractor_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins can update any contractor
CREATE POLICY "con_update_admin" ON contractors
  FOR UPDATE USING (is_admin());

-- ============================================
-- 7. EMPLOYEES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "emp_select_own" ON employees;
DROP POLICY IF EXISTS "emp_select_admin" ON employees;
DROP POLICY IF EXISTS "emp_insert" ON employees;
DROP POLICY IF EXISTS "emp_update_own" ON employees;
DROP POLICY IF EXISTS "emp_update_admin" ON employees;

-- Employees can see their own record
CREATE POLICY "emp_select_own" ON employees
  FOR SELECT USING (
    id = (SELECT employee_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins can see all employees
CREATE POLICY "emp_select_admin" ON employees
  FOR SELECT USING (is_admin());

-- Anyone can insert (application forms)
CREATE POLICY "emp_insert" ON employees
  FOR INSERT WITH CHECK (true);

-- Employees can update their own record (limited fields)
CREATE POLICY "emp_update_own" ON employees
  FOR UPDATE USING (
    id = (SELECT employee_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins can update any employee
CREATE POLICY "emp_update_admin" ON employees
  FOR UPDATE USING (is_admin());

-- ============================================
-- 8. VENUES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "venues_select_own" ON venues;
DROP POLICY IF EXISTS "venues_select_admin" ON venues;
DROP POLICY IF EXISTS "venues_insert_admin" ON venues;
DROP POLICY IF EXISTS "venues_update_admin" ON venues;

-- Location partners can see venues linked to them
CREATE POLICY "venues_select_own" ON venues
  FOR SELECT USING (
    location_partner_id = (SELECT location_partner_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins and employees can see all venues
CREATE POLICY "venues_select_admin" ON venues
  FOR SELECT USING (is_internal());

-- Only admins can insert venues
CREATE POLICY "venues_insert_admin" ON venues
  FOR INSERT WITH CHECK (is_internal());

-- Only admins can update venues
CREATE POLICY "venues_update_admin" ON venues
  FOR UPDATE USING (is_internal());

-- ============================================
-- 9. DEVICES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "devices_select_own" ON devices;
DROP POLICY IF EXISTS "devices_select_admin" ON devices;
DROP POLICY IF EXISTS "devices_insert_admin" ON devices;
DROP POLICY IF EXISTS "devices_update_admin" ON devices;

-- Location partners can see devices at their venues
CREATE POLICY "devices_select_own" ON devices
  FOR SELECT USING (
    venue_id IN (
      SELECT id FROM venues 
      WHERE location_partner_id = (SELECT location_partner_id FROM users WHERE clerk_id = auth.uid()::text)
    )
  );

-- Contractors can see devices assigned to them
CREATE POLICY "devices_select_contractor" ON devices
  FOR SELECT USING (
    assigned_contractor_id = (SELECT contractor_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins and employees can see all devices
CREATE POLICY "devices_select_admin" ON devices
  FOR SELECT USING (is_internal());

-- Only admins can insert devices
CREATE POLICY "devices_insert_admin" ON devices
  FOR INSERT WITH CHECK (is_internal());

-- Only admins can update devices
CREATE POLICY "devices_update_admin" ON devices
  FOR UPDATE USING (is_internal());

-- ============================================
-- 10. FORM SUBMISSIONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "submissions_select_own" ON form_submissions;
DROP POLICY IF EXISTS "submissions_select_admin" ON form_submissions;
DROP POLICY IF EXISTS "submissions_insert" ON form_submissions;
DROP POLICY IF EXISTS "submissions_update_admin" ON form_submissions;

-- Users can see their own submissions
CREATE POLICY "submissions_select_own" ON form_submissions
  FOR SELECT USING (
    user_id = auth.uid()::text 
    OR email = (SELECT email FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins can see all submissions
CREATE POLICY "submissions_select_admin" ON form_submissions
  FOR SELECT USING (is_internal());

-- Anyone can insert (public forms)
CREATE POLICY "submissions_insert" ON form_submissions
  FOR INSERT WITH CHECK (true);

-- Only admins can update submissions
CREATE POLICY "submissions_update_admin" ON form_submissions
  FOR UPDATE USING (is_internal());

-- ============================================
-- 11. FORMS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "forms_select_public" ON forms;
DROP POLICY IF EXISTS "forms_select_admin" ON forms;
DROP POLICY IF EXISTS "forms_insert_admin" ON forms;
DROP POLICY IF EXISTS "forms_update_admin" ON forms;
DROP POLICY IF EXISTS "forms_delete_admin" ON forms;

-- Anyone can see active forms
CREATE POLICY "forms_select_public" ON forms
  FOR SELECT USING (status = 'active');

-- Admins can see all forms (including drafts)
CREATE POLICY "forms_select_admin" ON forms
  FOR SELECT USING (is_internal());

-- Only admins can insert forms
CREATE POLICY "forms_insert_admin" ON forms
  FOR INSERT WITH CHECK (is_admin());

-- Only admins can update forms
CREATE POLICY "forms_update_admin" ON forms
  FOR UPDATE USING (is_admin());

-- Only admins can delete forms
CREATE POLICY "forms_delete_admin" ON forms
  FOR DELETE USING (is_admin());

-- ============================================
-- 12. ACTIVITY LOG TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "activity_select_own" ON activity_log;
DROP POLICY IF EXISTS "activity_select_admin" ON activity_log;
DROP POLICY IF EXISTS "activity_insert" ON activity_log;

-- Users can see activity for their own entities
CREATE POLICY "activity_select_own" ON activity_log
  FOR SELECT USING (
    (entity_type = 'location_partner' AND entity_id::uuid = (SELECT location_partner_id FROM users WHERE clerk_id = auth.uid()::text))
    OR (entity_type = 'referral_partner' AND entity_id::uuid = (SELECT referral_partner_id FROM users WHERE clerk_id = auth.uid()::text))
    OR (entity_type = 'contractor' AND entity_id::uuid = (SELECT contractor_id FROM users WHERE clerk_id = auth.uid()::text))
    OR (entity_type = 'employee' AND entity_id::uuid = (SELECT employee_id FROM users WHERE clerk_id = auth.uid()::text))
    OR user_id = auth.uid()::text
  );

-- Admins can see all activity
CREATE POLICY "activity_select_admin" ON activity_log
  FOR SELECT USING (is_internal());

-- Anyone can insert activity (logged by system)
CREATE POLICY "activity_insert" ON activity_log
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 13. DOCUMENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "docs_select_own" ON documents;
DROP POLICY IF EXISTS "docs_select_admin" ON documents;
DROP POLICY IF EXISTS "docs_insert_admin" ON documents;
DROP POLICY IF EXISTS "docs_update_admin" ON documents;

-- Users can see documents linked to their entity
CREATE POLICY "docs_select_own" ON documents
  FOR SELECT USING (
    (entity_type = 'location_partner' AND entity_id = (SELECT location_partner_id FROM users WHERE clerk_id = auth.uid()::text))
    OR (entity_type = 'referral_partner' AND entity_id = (SELECT referral_partner_id FROM users WHERE clerk_id = auth.uid()::text))
    OR (entity_type = 'contractor' AND entity_id = (SELECT contractor_id FROM users WHERE clerk_id = auth.uid()::text))
    OR (entity_type = 'employee' AND entity_id = (SELECT employee_id FROM users WHERE clerk_id = auth.uid()::text))
  );

-- Admins can see all documents
CREATE POLICY "docs_select_admin" ON documents
  FOR SELECT USING (is_internal());

-- Only admins can insert documents
CREATE POLICY "docs_insert_admin" ON documents
  FOR INSERT WITH CHECK (is_internal());

-- Only admins can update documents
CREATE POLICY "docs_update_admin" ON documents
  FOR UPDATE USING (is_internal());

-- ============================================
-- 14. PAYMENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "payments_select_own" ON payments;
DROP POLICY IF EXISTS "payments_select_admin" ON payments;
DROP POLICY IF EXISTS "payments_insert_admin" ON payments;
DROP POLICY IF EXISTS "payments_update_admin" ON payments;

-- Users can see their own payments
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    partner_id = (SELECT location_partner_id FROM users WHERE clerk_id = auth.uid()::text)
    OR partner_id = (SELECT referral_partner_id FROM users WHERE clerk_id = auth.uid()::text)
    OR partner_id = (SELECT contractor_id FROM users WHERE clerk_id = auth.uid()::text)
    OR partner_id = (SELECT employee_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins can see all payments
CREATE POLICY "payments_select_admin" ON payments
  FOR SELECT USING (is_internal());

-- Only admins can insert payments
CREATE POLICY "payments_insert_admin" ON payments
  FOR INSERT WITH CHECK (is_admin());

-- Only admins can update payments
CREATE POLICY "payments_update_admin" ON payments
  FOR UPDATE USING (is_admin());

-- ============================================
-- 15. COMMISSIONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "commissions_select_own" ON commissions;
DROP POLICY IF EXISTS "commissions_select_admin" ON commissions;
DROP POLICY IF EXISTS "commissions_insert_admin" ON commissions;

-- Referral partners can see their own commissions
CREATE POLICY "commissions_select_own" ON commissions
  FOR SELECT USING (
    partner_id = (SELECT referral_partner_id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Admins can see all commissions
CREATE POLICY "commissions_select_admin" ON commissions
  FOR SELECT USING (is_internal());

-- Only admins can insert commissions
CREATE POLICY "commissions_insert_admin" ON commissions
  FOR INSERT WITH CHECK (is_admin());

-- ============================================
-- 16. SERVICE ROLE BYPASS
-- ============================================
-- Note: The service role key bypasses RLS by default
-- This is used for API routes that need full access

-- ============================================
-- 17. VERIFY POLICIES
-- ============================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
