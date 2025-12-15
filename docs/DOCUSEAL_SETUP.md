# DocuSeal Setup Guide for SkyYield

This guide walks you through setting up DocuSeal to replace PandaDocs for document signing.

## Cost Comparison

| Service | PandaDocs | DocuSeal Cloud | DocuSeal Self-Hosted |
|---------|-----------|----------------|----------------------|
| Upfront | $2,000 | $0 | $0 |
| Monthly | $19-65/user | $20/user | **FREE** |
| Per Doc (API) | Varies | $0.20 | **FREE** |

**Estimated Annual Savings: $2,000+**

---

## Option A: Self-Hosted (Recommended - FREE)

### Step 1: Deploy DocuSeal

**Using Docker (easiest):**

```bash
# Create directory
mkdir docuseal && cd docuseal

# Download docker-compose
curl https://raw.githubusercontent.com/docusealco/docuseal/master/docker-compose.yml > docker-compose.yml

# Start (replace YOUR_DOMAIN)
HOST=docs.skyyield.io docker compose up -d
```

**Using Railway/Render/Fly.io:**
- Fork: https://github.com/docusealco/docuseal
- Connect to your preferred platform
- Set `SECRET_KEY_BASE` environment variable

### Step 2: Configure DocuSeal

1. Open your DocuSeal URL (e.g., `https://docs.skyyield.io`)
2. Create admin account on first visit
3. Go to **Settings → API** and copy your API key

### Step 3: Create Templates

Create these templates in DocuSeal:

#### LOI Template
- Name: "Location Partner LOI"
- Fields to include:
  - `partner_name` (text)
  - `company_name` (text)
  - `company_legal_name` (text)
  - `contact_email` (text)
  - `contact_phone` (text)
  - `venue_address` (text)
  - `venue_count` (text)
  - `date` (text)
  - `trial_duration` (text)
  - `revenue_share` (text)
  - Signature field

#### Deployment Contract Template
- Name: "Deployment Agreement"
- Fields: Similar to LOI + contract duration, trial earnings

#### Partner Agreement Templates
- Referral Partner Agreement
- Channel Partner Agreement
- Relationship Partner Agreement
- Contractor Agreement

### Step 4: Configure Webhook

In DocuSeal Settings → Webhooks:

- **URL:** `https://skyyield.io/api/webhooks/docuseal`
- **Events:** Select all
- **Secret:** Generate and save (optional but recommended)

---

## Option B: DocuSeal Cloud

1. Sign up at https://docuseal.co
2. Choose Pro plan ($20/month)
3. Create templates (same as above)
4. Get API key from Settings
5. Configure webhook URL

---

## Environment Variables

Add these to your Vercel project:

```env
# DocuSeal Configuration
DOCUSEAL_API_URL=https://docs.skyyield.io  # Or https://api.docuseal.co for cloud
DOCUSEAL_API_KEY=your-api-key-here
DOCUSEAL_WEBHOOK_SECRET=your-webhook-secret  # Optional

# Template IDs (get from DocuSeal after creating templates)
DOCUSEAL_LOI_TEMPLATE_ID=1
DOCUSEAL_CONTRACT_TEMPLATE_ID=2
DOCUSEAL_REFERRAL_PARTNER_TEMPLATE_ID=3
DOCUSEAL_CHANNEL_PARTNER_TEMPLATE_ID=4
DOCUSEAL_RELATIONSHIP_PARTNER_TEMPLATE_ID=5
DOCUSEAL_CONTRACTOR_TEMPLATE_ID=6
```

---

## Database Migration

Run the SQL migration in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/docuseal_migration.sql`
3. Run the migration

This adds:
- DocuSeal columns to documents table
- Agreement tracking to partner tables
- Document templates table

---

## API Usage

### Send LOI to Partner

```typescript
const response = await fetch('/api/pipeline/docuseal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create_loi',
    partner: {
      id: 'partner-uuid',
      contact_email: 'partner@example.com',
      contact_name: 'John Smith',
      company_legal_name: 'Smith Coffee LLC',
      // ... other fields
    }
  })
});

// Returns: { success: true, submission: { id, status, signingUrl } }
```

### Send Deployment Contract

```typescript
const response = await fetch('/api/pipeline/docuseal', {
  method: 'POST',
  body: JSON.stringify({
    action: 'create_contract',
    partner: { /* partner data */ }
  })
});
```

### Send Partner Agreement

```typescript
const response = await fetch('/api/pipeline/docuseal', {
  method: 'POST',
  body: JSON.stringify({
    action: 'create_partner_agreement',
    partnerType: 'referral_partner', // or channel_partner, etc.
    partner: { /* partner data */ }
  })
});
```

### Check Document Status

```typescript
const response = await fetch('/api/pipeline/docuseal?action=submission&submissionId=123');
// Returns submission details including status
```

### List Templates

```typescript
const response = await fetch('/api/pipeline/docuseal?action=templates');
// Returns all available templates
```

---

## Webhook Events

DocuSeal sends these events:

| Event | Description | Action |
|-------|-------------|--------|
| `form.viewed` | Signer opened document | Update status to 'viewed' |
| `form.started` | Signer began filling | Log activity |
| `form.completed` | Signer finished signing | Update status, trigger next steps |
| `submission.completed` | All signers done (multi-signer) | Same as form.completed |

The webhook handler automatically:
- Updates document status in database
- Updates partner pipeline stage
- Creates device purchase requests (when LOI signed with SkyYield ownership)
- Sends follow-up emails (portal invites, welcome messages)
- Logs all activity

---

## Embed Signing Form (Optional)

For in-app signing instead of email links:

```jsx
import { DocusealForm } from '@docuseal/react';

function SigningPage({ submissionSlug, signerEmail }) {
  return (
    <DocusealForm
      src={`https://docs.skyyield.io/d/${submissionSlug}`}
      email={signerEmail}
      onComplete={(data) => {
        console.log('Document signed!', data);
        // Handle completion
      }}
    />
  );
}
```

---

## Troubleshooting

### Webhook not receiving events
1. Check webhook URL is correct in DocuSeal settings
2. Verify your domain is publicly accessible
3. Check Vercel function logs for errors

### Template fields not populating
1. Ensure field names match exactly (case-sensitive)
2. Check that fields exist in the DocuSeal template
3. Verify partner data includes all required fields

### API errors
1. Check DOCUSEAL_API_KEY is set correctly
2. For self-hosted, verify DOCUSEAL_API_URL points to your instance
3. Check DocuSeal logs for server-side errors

---

## Migration from PandaDocs

The new system keeps all PandaDocs history intact:
- Old `pandadoc_id` columns remain in database
- New `docuseal_submission_id` columns added alongside
- Historical documents still accessible

To fully switch:
1. Stop sending new documents via PandaDocs
2. Create all templates in DocuSeal
3. Update admin UI to use new `/api/pipeline/docuseal` endpoint
4. Cancel PandaDocs subscription

---

## Support

- DocuSeal Docs: https://www.docuseal.co/docs
- DocuSeal Discord: https://discord.gg/docuseal
- DocuSeal GitHub: https://github.com/docusealco/docuseal
