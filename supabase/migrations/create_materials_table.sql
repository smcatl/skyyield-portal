-- Materials Table for Partner Training Resources
-- Run this in Supabase SQL Editor

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('video', 'document', 'article', 'quiz')),
  category TEXT DEFAULT 'General',
  duration TEXT,
  url TEXT NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  partner_types TEXT[] DEFAULT ARRAY['all'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster partner type queries
CREATE INDEX idx_materials_partner_types ON materials USING GIN (partner_types);

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read materials
CREATE POLICY "Materials are viewable by everyone"
  ON materials FOR SELECT
  USING (true);

-- Policy: Only authenticated users with admin role can insert
CREATE POLICY "Admins can insert materials"
  ON materials FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only authenticated users with admin role can update
CREATE POLICY "Admins can update materials"
  ON materials FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Only authenticated users with admin role can delete
CREATE POLICY "Admins can delete materials"
  ON materials FOR DELETE
  USING (auth.role() = 'authenticated');

-- Insert default materials
INSERT INTO materials (title, description, type, category, duration, url, required, partner_types) VALUES
  ('Partner Onboarding Guide', 'Complete guide to getting started with SkyYield', 'document', 'Onboarding', '10 min read', 'https://docs.skyyield.io/onboarding', TRUE, ARRAY['all']),
  ('WiFi Installation Video', 'Step-by-step video guide for installing UniFi access points', 'video', 'Installation', '12:30', 'https://youtube.com/watch?v=example', TRUE, ARRAY['location_partner', 'contractor']),
  ('Commission Structure Explained', 'Understanding how earnings and commissions work', 'article', 'Payments', '5 min read', 'https://docs.skyyield.io/commissions', FALSE, ARRAY['all']),
  ('Referral Best Practices', 'Tips for maximizing your referral conversions', 'article', 'Referrals', '7 min read', 'https://docs.skyyield.io/referrals', FALSE, ARRAY['referral_partner', 'relationship_partner']),
  ('Partner Certification Quiz', 'Test your knowledge and get certified', 'quiz', 'Certification', '15 min', 'https://quiz.skyyield.io/certification', FALSE, ARRAY['all']);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_materials_timestamp ON materials;
CREATE TRIGGER trigger_update_materials_timestamp
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_materials_updated_at();
