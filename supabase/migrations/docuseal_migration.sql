-- DocuSeal Migration
-- Run this in Supabase SQL Editor to add DocuSeal support
-- This migrates from PandaDocs to DocuSeal

-- ============================================
-- 1. UPDATE DOCUMENTS TABLE
-- ============================================

-- Add DocuSeal columns (keep PandaDocs columns for historical data)
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS docuseal_submission_id INTEGER,
  ADD COLUMN IF NOT EXISTS docuseal_slug TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS download_url TEXT,
  ADD COLUMN IF NOT EXISTS recipient_signed_at TIMESTAMPTZ;

-- Create index for DocuSeal lookups
CREATE INDEX IF NOT EXISTS idx_documents_docuseal_submission_id 
  ON documents(docuseal_submission_id);

-- ============================================
-- 2. UPDATE LOCATION PARTNERS TABLE
-- ============================================

-- Add DocuSeal document IDs (keep PandaDocs IDs for historical)
ALTER TABLE location_partners
  ADD COLUMN IF NOT EXISTS loi_docuseal_id INTEGER,
  ADD COLUMN IF NOT EXISTS contract_docuseal_id INTEGER,
  ADD COLUMN IF NOT EXISTS loi_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_viewed_at TIMESTAMPTZ;

-- ============================================
-- 3. UPDATE PARTNER TABLES FOR AGREEMENTS
-- ============================================

-- Referral Partners
ALTER TABLE referral_partners
  ADD COLUMN IF NOT EXISTS agreement_status TEXT DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS agreement_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_docuseal_id INTEGER;

-- Channel Partners
ALTER TABLE channel_partners
  ADD COLUMN IF NOT EXISTS agreement_status TEXT DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS agreement_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_docuseal_id INTEGER;

-- Relationship Partners  
ALTER TABLE relationship_partners
  ADD COLUMN IF NOT EXISTS agreement_status TEXT DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS agreement_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_docuseal_id INTEGER;

-- Contractors
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS agreement_status TEXT DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS agreement_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_docuseal_id INTEGER;

-- ============================================
-- 4. CREATE DOCUMENT TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS document_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- DocuSeal template info
  docuseal_template_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  
  -- Template type
  template_type TEXT NOT NULL UNIQUE CHECK (
    template_type IN (
      'loi',
      'deployment_contract', 
      'referral_agreement',
      'channel_agreement',
      'relationship_agreement',
      'contractor_agreement',
      'nda',
      'other'
    )
  ),
  
  -- Which partner types can use this
  applicable_partner_types TEXT[] DEFAULT ARRAY['location_partner'],
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for template lookups
CREATE INDEX IF NOT EXISTS idx_document_templates_type 
  ON document_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_document_templates_docuseal_id 
  ON document_templates(docuseal_template_id);

-- ============================================
-- 5. SAMPLE TEMPLATE DATA (Update with your real IDs)
-- ============================================

-- After creating templates in DocuSeal, update these IDs:
/*
INSERT INTO document_templates (docuseal_template_id, name, template_type, is_default) VALUES
  (1, 'Location Partner LOI', 'loi', true),
  (2, 'Deployment Agreement', 'deployment_contract', true),
  (3, 'Referral Partner Agreement', 'referral_agreement', true),
  (4, 'Channel Partner Agreement', 'channel_agreement', true),
  (5, 'Relationship Partner Agreement', 'relationship_agreement', true),
  (6, 'Contractor Agreement', 'contractor_agreement', true);
*/

-- ============================================
-- 6. UPDATE SETTINGS TABLE FOR DOCUSEAL CONFIG
-- ============================================

-- Add DocuSeal settings if settings table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pipeline_settings') THEN
    INSERT INTO pipeline_settings (key, value, description) VALUES
      ('docuseal_api_url', 'https://api.docuseal.co', 'DocuSeal API URL (use your self-hosted URL if applicable)'),
      ('docuseal_loi_template_id', '', 'DocuSeal template ID for LOI documents'),
      ('docuseal_contract_template_id', '', 'DocuSeal template ID for deployment contracts'),
      ('docuseal_referral_template_id', '', 'DocuSeal template ID for referral partner agreements'),
      ('docuseal_channel_template_id', '', 'DocuSeal template ID for channel partner agreements'),
      ('docuseal_relationship_template_id', '', 'DocuSeal template ID for relationship partner agreements'),
      ('docuseal_contractor_template_id', '', 'DocuSeal template ID for contractor agreements')
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 7. CREATE VIEW FOR DOCUMENT STATUS
-- ============================================

CREATE OR REPLACE VIEW document_status_summary AS
SELECT 
  d.entity_type,
  d.entity_id,
  d.document_type,
  d.status,
  d.name,
  d.sent_at,
  d.viewed_at,
  d.signed_at,
  d.completed_at,
  d.recipient_email,
  d.recipient_name,
  d.docuseal_submission_id,
  d.download_url,
  CASE 
    WHEN d.status = 'signed' THEN 'completed'
    WHEN d.status = 'viewed' THEN 'in_progress'
    WHEN d.status = 'sent' THEN 'pending'
    ELSE d.status
  END as status_category,
  EXTRACT(EPOCH FROM (d.signed_at - d.sent_at))/3600 as hours_to_sign
FROM documents d
WHERE d.docuseal_submission_id IS NOT NULL
ORDER BY d.created_at DESC;

-- ============================================
-- DONE! 
-- ============================================
-- 
-- Next steps:
-- 1. Create templates in DocuSeal dashboard
-- 2. Copy template IDs to environment variables or settings table
-- 3. Configure webhook URL in DocuSeal: https://yourdomain.com/api/webhooks/docuseal
-- 4. Test with a sample document
--
-- Environment variables to set:
--   DOCUSEAL_API_URL=https://api.docuseal.co (or your self-hosted URL)
--   DOCUSEAL_API_KEY=your-api-key
--   DOCUSEAL_WEBHOOK_SECRET=your-webhook-secret (optional)
--   DOCUSEAL_LOI_TEMPLATE_ID=1
--   DOCUSEAL_CONTRACT_TEMPLATE_ID=2
--   DOCUSEAL_REFERRAL_PARTNER_TEMPLATE_ID=3
--   DOCUSEAL_CHANNEL_PARTNER_TEMPLATE_ID=4
--   DOCUSEAL_RELATIONSHIP_PARTNER_TEMPLATE_ID=5
--   DOCUSEAL_CONTRACTOR_TEMPLATE_ID=6
