# SkyYield Complete Implementation Package

## 📦 What's Included

### API Routes (app/api/)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/pipeline/partners` | GET, POST, PUT, DELETE | Location Partner CRUD |
| `/api/pipeline/venues` | GET, POST, PUT, DELETE | Venue management |
| `/api/pipeline/devices` | GET, POST, PUT, DELETE, PATCH | Device inventory |
| `/api/pipeline/referral-partners` | GET, POST, PUT, DELETE | Referral/Channel/Relationship Partners |
| `/api/pipeline/contractors` | GET, POST, PUT, DELETE | Contractor management |
| `/api/pipeline/employees` | GET, POST, PUT, DELETE | Employee management |
| `/api/webhooks/calendly` | POST | Auto-update call status |
| `/api/webhooks/docuseal` | POST, GET | Auto-update document status |
| `/api/integrations/docuseal/send` | POST, GET | Send documents via DocuSeal |
| `/api/integrations/tipalti/invite` | POST, GET | Send payment setup invites |
| `/api/cron/trial-check` | GET, POST | Daily trial status check |

---

## 🚀 Installation

### Step 1: Copy Files
```bash
# In your skyyield-portal directory
cp -r app/api/* your-project/app/api/
```

### Step 2: Add Environment Variables
Add these to your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx

# DocuSeal
DOCUSEAL_API_KEY=your_api_key
DOCUSEAL_LOI_TEMPLATE_ID=123
DOCUSEAL_CONTRACT_TEMPLATE_ID=124
DOCUSEAL_REFERRAL_AGREEMENT_TEMPLATE_ID=125
DOCUSEAL_CONTRACTOR_AGREEMENT_TEMPLATE_ID=126
DOCUSEAL_NDA_TEMPLATE_ID=127
DOCUSEAL_NONCOMPETE_TEMPLATE_ID=128
DOCUSEAL_OFFER_LETTER_TEMPLATE_ID=129
SKYYIELD_CONTRACTS_EMAIL=contracts@skyyield.io

# Tipalti
TIPALTI_API_KEY=your_api_key
TIPALTI_HMAC_SECRET=your_hmac_secret
TIPALTI_PAYER_NAME=skyyield
TIPALTI_SANDBOX=true

# Cron
CRON_SECRET=your_random_secret
```

### Step 3: Configure Vercel Cron (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/trial-check",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Step 4: Configure Webhooks

**Calendly:**
1. Go to Calendly → Integrations → Webhooks
2. URL: `https://portal.skyyield.io/api/webhooks/calendly`
3. Events: `invitee.created`, `invitee.canceled`

**DocuSeal:**
1. Go to DocuSeal → Settings → Webhooks
2. URL: `https://portal.skyyield.io/api/webhooks/docuseal`
3. Events: `form.sent`, `form.viewed`, `form.completed`

---

## 📋 Pipeline Stages

### Location Partners (12 stages)
```
application → initial_review → discovery_scheduled → discovery_complete →
venues_setup → loi_sent → loi_signed → install_scheduled →
trial_active → trial_ending → contract_decision → active
```

### Referral/Channel/Relationship Partners (5 stages)
```
application → review → agreement_sent → agreement_signed → active
```

### Contractors (6 stages)
```
application → review → background_check → agreement_sent → agreement_signed → active
```

### Employees (7 stages)
```
application → interview → offer_sent → offer_signed → 
noncompete_sent → onboarding → active
```

---

## 🔗 API Usage Examples

### Create Location Partner
```bash
curl -X POST https://portal.skyyield.io/api/pipeline/partners \
  -H "Content-Type: application/json" \
  -d '{
    "contact_name": "John Doe",
    "email": "john@cafe.com",
    "phone": "404-555-0123",
    "company_name": "Downtown Cafe",
    "city": "Atlanta",
    "state": "GA",
    "zip": "30309"
  }'
```

### Update Stage
```bash
curl -X PUT https://portal.skyyield.io/api/pipeline/partners \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid-here",
    "stage": "discovery_scheduled",
    "initial_review_status": "approved"
  }'
```

### Send DocuSeal Document
```bash
curl -X POST https://portal.skyyield.io/api/integrations/docuseal/send \
  -H "Content-Type: application/json" \
  -d '{
    "document_type": "loi",
    "entity_id": "uuid-here",
    "entity_type": "location_partner",
    "custom_values": {
      "trial_start_date": "2025-02-01",
      "trial_end_date": "2025-04-01"
    }
  }'
```

### Send Tipalti Invite
```bash
curl -X POST https://portal.skyyield.io/api/integrations/tipalti/invite \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "location_partner",
    "entity_id": "uuid-here"
  }'
```

---

## ✅ Checklist

- [ ] Copy all API routes to project
- [ ] Add environment variables
- [ ] Run database migrations (if needed)
- [ ] Configure Calendly webhook
- [ ] Configure DocuSeal webhook
- [ ] Set up DocuSeal templates with field mappings
- [ ] Configure Tipalti payer account
- [ ] Set up Vercel cron job
- [ ] Test all endpoints
- [ ] Deploy to Vercel

---

## 📊 Database Tables Required

Your Supabase should have these tables:
- `location_partners`
- `referral_partners`
- `contractors`
- `employees`
- `venues`
- `devices`
- `activity_log`

All pipeline columns should be added (see previous SQL migrations).

---

## 🆘 Support

Questions? Check the project documentation or contact the development team.
