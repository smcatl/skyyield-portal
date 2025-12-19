-- ============================================
-- ADD DISPLAY ORDER TO FORMS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Add display_order column if it doesn't exist
ALTER TABLE forms ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set initial order based on name within each category
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY name) - 1 as new_order
  FROM forms
)
UPDATE forms 
SET display_order = ordered.new_order
FROM ordered 
WHERE forms.id = ordered.id;

-- Create index for faster ordering
CREATE INDEX IF NOT EXISTS idx_forms_display_order ON forms(category, display_order);

-- Verify
SELECT name, category, display_order FROM forms ORDER BY category, display_order;
