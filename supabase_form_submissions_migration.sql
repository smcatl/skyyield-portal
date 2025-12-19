-- ============================================
-- FORM SUBMISSIONS TABLE
-- Stores all form submissions with links to pipeline records
-- ============================================

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    form_name TEXT NOT NULL,
    form_slug TEXT,
    data JSONB NOT NULL DEFAULT '{}',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_by JSONB,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'approved', 'rejected', 'archived')),
    notes TEXT,
    -- Link to pipeline record (if applicable)
    pipeline_type TEXT, -- 'location_partner', 'referral_partner', 'contractor'
    pipeline_id UUID,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_pipeline ON form_submissions(pipeline_type, pipeline_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_form_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER trigger_form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_form_submissions_updated_at();

-- Add form_submission_id column to pipeline tables if not exists
DO $$
BEGIN
    -- Location Partners
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'location_partners' AND column_name = 'form_submission_id') THEN
        ALTER TABLE location_partners ADD COLUMN form_submission_id TEXT;
    END IF;
    
    -- Referral Partners
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'referral_partners' AND column_name = 'form_submission_id') THEN
        ALTER TABLE referral_partners ADD COLUMN form_submission_id TEXT;
    END IF;
    
    -- Contractors
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contractors' AND column_name = 'form_submission_id') THEN
        ALTER TABLE contractors ADD COLUMN form_submission_id TEXT;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
CREATE POLICY "Admins full access to form_submissions" ON form_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access to form_submissions" ON form_submissions
    FOR ALL USING (auth.role() = 'service_role');

-- Anyone can INSERT (public form submissions)
CREATE POLICY "Anyone can submit forms" ON form_submissions
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON form_submissions TO authenticated;
GRANT ALL ON form_submissions TO service_role;
GRANT INSERT ON form_submissions TO anon;

-- ============================================
-- VERIFY SETUP
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Form submissions table created successfully!';
    RAISE NOTICE 'Pipeline tables updated with form_submission_id column';
END $$;
