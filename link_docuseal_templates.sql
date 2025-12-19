-- ============================================
-- LINK DOCUSEAL TEMPLATES TO FORMS
-- Run this in Supabase SQL Editor
-- ============================================

-- Update forms with DocuSeal template slugs
UPDATE forms SET docuseal_template_id = 'F88qMS4Hfd3gUA' WHERE slug = 'contractor-agreement';
UPDATE forms SET docuseal_template_id = 'wrsM6NzZkxxhyw' WHERE slug = 'employee-writeup';
UPDATE forms SET docuseal_template_id = 'JmbxtjQLnqZT4i' WHERE slug = 'location-deployment';
UPDATE forms SET docuseal_template_id = '4PdGsJnFJSUDxS' WHERE slug = 'loi';
UPDATE forms SET docuseal_template_id = 'h3ptapBbrtW1Et' WHERE slug = 'nda';
UPDATE forms SET docuseal_template_id = 'Y3fjzopfSHZ1Bg' WHERE slug = 'non-compete';
UPDATE forms SET docuseal_template_id = 'mGZkXDW9f7AGQf' WHERE slug = 'offer-letter';
UPDATE forms SET docuseal_template_id = 'fmECW5ixhVoLY3' WHERE slug = 'referral-agreement';
UPDATE forms SET docuseal_template_id = 'P6BrWWpXHHfvRC' WHERE slug = 'termination';

-- Verify the updates
SELECT name, slug, docuseal_template_id, requires_signature 
FROM forms 
WHERE requires_signature = true
ORDER BY name;
