-- DocuSeal Migration - CLEAN INSTALL (Removes PandaDocs)
-- Run this in Supabase SQL Editor

-- 1. DOCUMENTS TABLE
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS docuseal_submission_id INTEGER,
  ADD COLUMN IF NOT EXISTS docuseal_slug TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS download_url TEXT,
  ADD COLUMN IF NOT EXISTS recipient_signed_at TIMESTAMPTZ;

ALTER TABLE documents DROP COLUMN IF EXISTS pandadoc_id;

CREATE INDEX IF NOT EXISTS idx_documents_docuseal_submission_id ON documents(docuseal_submission_id);

-- 2. LOCATION PARTNERS TABLE
ALTER TABLE location_partners
  ADD COLUMN IF NOT EXISTS loi_docuseal_id INTEGER,
  ADD COLUMN IF NOT EXISTS contract_docuseal_id INTEGER,
  ADD COLUMN IF NOT EXISTS loi_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_viewed_at TIMESTAMPTZ;

ALTER TABLE location_partners
  DROP COLUMN IF EXISTS loi_pandadoc_id,
  DROP COLUMN IF EXISTS contract_pandadoc_id;

-- 3. PARTNER AGREEMENT COLUMNS
ALTER TABLE referral_partners
  ADD COLUMN IF NOT EXISTS agreement_status TEXT DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS agreement_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_docuseal_id INTEGER;

ALTER TABLE channel_partners
  ADD COLUMN IF NOT EXISTS agreement_status TEXT DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS agreement_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_docuseal_id INTEGER;

ALTER TABLE relationship_partners
  ADD COLUMN IF NOT EXISTS agreement_status TEXT DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS agreement_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_docuseal_id INTEGER;

ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS agreement_status TEXT DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS agreement_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_docuseal_id INTEGER;

-- 4. DOCUMENT TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  docuseal_template_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  template_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(template_type);
