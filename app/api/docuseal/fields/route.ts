import { NextRequest, NextResponse } from 'next/server'

const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY!
const DOCUSEAL_API_URL = 'https://api.docuseal.co'

// All template fields organized by template
const TEMPLATE_FIELDS: Record<string, Array<{
  name: string
  type: string
  role: string
  required: boolean
}>> = {
  // Contractor Agreement - F88qMS4Hfd3gUA
  'contractor-agreement': [
    { name: 'effective_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'contractor_name', type: 'text', role: 'Contractor', required: true },
    { name: 'contractor_legal_name', type: 'text', role: 'Contractor', required: true },
    { name: 'contractor_entity_type', type: 'text', role: 'Contractor', required: true },
    { name: 'contractor_state_residence', type: 'text', role: 'Contractor', required: true },
    { name: 'contractor_initials', type: 'initials', role: 'Contractor', required: true },
    { name: 'skyyield_initials', type: 'initials', role: 'SkyYield', required: true },
    { name: 'engagement_term', type: 'text', role: 'SkyYield', required: true },
    { name: 'skyyield_signature', type: 'signature', role: 'SkyYield', required: true },
    { name: 'skyyield_signer_title', type: 'text', role: 'SkyYield', required: true },
    { name: 'skyyield_signature_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'contractor_signature', type: 'signature', role: 'Contractor', required: true },
    { name: 'contractor_signer_title', type: 'text', role: 'Contractor', required: true },
    { name: 'contractor_signature_date', type: 'date', role: 'Contractor', required: true },
    { name: 'contractor_address_1', type: 'text', role: 'Contractor', required: true },
    { name: 'contractor_address_2', type: 'text', role: 'Contractor', required: false },
    { name: 'contractor_city', type: 'text', role: 'Contractor', required: true },
    { name: 'contractor_state', type: 'text', role: 'Contractor', required: true },
    { name: 'contractor_zip', type: 'text', role: 'Contractor', required: true },
    { name: 'contractor_attn', type: 'text', role: 'Contractor', required: false },
    { name: 'scope_of_work', type: 'text', role: 'SkyYield', required: true },
    { name: 'contractor_fees', type: 'text', role: 'SkyYield', required: true },
  ],

  // Letter of Intent - 4PdGsJnFJSUDxS
  'loi': [
    { name: 'loi_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'lp_name', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_address_1', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_address_2', type: 'text', role: 'Location Partner', required: false },
    { name: 'lp_city', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_state', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_zip', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_contact_name', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_contact_title', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_contact_email', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_company_name', type: 'text', role: 'Location Partner', required: true },
    { name: 'trial_start_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'trial_end_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'ap_inside_price', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_outside_price', type: 'text', role: 'SkyYield', required: true },
    { name: 'router_price', type: 'text', role: 'SkyYield', required: true },
    { name: 'switch_price', type: 'text', role: 'SkyYield', required: true },
    { name: 'software_price', type: 'text', role: 'SkyYield', required: true },
    { name: 'installation_price', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_inside_count', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_outside_count', type: 'text', role: 'SkyYield', required: true },
    { name: 'router_count', type: 'text', role: 'SkyYield', required: true },
    { name: 'switch_count', type: 'text', role: 'SkyYield', required: true },
    { name: 'software_count', type: 'text', role: 'SkyYield', required: true },
    { name: 'installation_count', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_inside_total', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_outside_total', type: 'text', role: 'SkyYield', required: true },
    { name: 'router_total', type: 'text', role: 'SkyYield', required: true },
    { name: 'switch_total', type: 'text', role: 'SkyYield', required: true },
    { name: 'software_total', type: 'text', role: 'SkyYield', required: true },
    { name: 'installation_total', type: 'text', role: 'SkyYield', required: true },
    { name: 'total_cost_skyyield', type: 'text', role: 'SkyYield', required: true },
    { name: 'skyyield_signature', type: 'signature', role: 'SkyYield', required: true },
    { name: 'skyyield_signer_name', type: 'text', role: 'SkyYield', required: true },
    { name: 'skyyield_signer_title', type: 'text', role: 'SkyYield', required: true },
    { name: 'skyyield_signature_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'lp_signature', type: 'signature', role: 'Location Partner', required: true },
    { name: 'lp_signer_name', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_signer_title', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_signature_date', type: 'date', role: 'Location Partner', required: true },
  ],

  // Location Deployment Agreement - JmbxtjQLnqZT4i
  'location-deployment': [
    { name: 'agreement_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'lp_address', type: 'text', role: 'Location Partner', required: true },
    { name: 'skyyield_signature', type: 'signature', role: 'SkyYield', required: true },
    { name: 'skyyield_signer_name', type: 'text', role: 'SkyYield', required: true },
    { name: 'skyyield_signer_title', type: 'text', role: 'SkyYield', required: true },
    { name: 'skyyield_signature_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'lp_company_name', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_signature', type: 'signature', role: 'Location Partner', required: true },
    { name: 'lp_signer_name', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_signer_title', type: 'text', role: 'Location Partner', required: true },
    { name: 'lp_signature_date', type: 'date', role: 'Location Partner', required: true },
    { name: 'deployment_option', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_inside_price', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_outside_price', type: 'text', role: 'SkyYield', required: true },
    { name: 'router_price', type: 'text', role: 'SkyYield', required: true },
    { name: 'switch_price', type: 'text', role: 'SkyYield', required: true },
    { name: 'software_price', type: 'text', role: 'SkyYield', required: true },
    { name: 'installation_price', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_inside_count', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_outside_count', type: 'text', role: 'SkyYield', required: true },
    { name: 'router_count', type: 'text', role: 'SkyYield', required: true },
    { name: 'switch_count', type: 'text', role: 'SkyYield', required: true },
    { name: 'software_count', type: 'text', role: 'SkyYield', required: true },
    { name: 'installation_count', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_inside_total', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_outside_total', type: 'text', role: 'SkyYield', required: true },
    { name: 'router_total', type: 'text', role: 'SkyYield', required: true },
    { name: 'switch_total', type: 'text', role: 'SkyYield', required: true },
    { name: 'software_total', type: 'text', role: 'SkyYield', required: true },
    { name: 'installation_total', type: 'text', role: 'SkyYield', required: true },
    { name: 'total_cost_lp', type: 'text', role: 'SkyYield', required: true },
    { name: 'total_cost_skyyield', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_inside_payment_resp', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_outside_payment_resp', type: 'text', role: 'SkyYield', required: true },
    { name: 'router_payment_resp', type: 'text', role: 'SkyYield', required: true },
    { name: 'switch_payment_resp', type: 'text', role: 'SkyYield', required: true },
    { name: 'software_payment_resp', type: 'text', role: 'SkyYield', required: true },
    { name: 'installation_payment_resp', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_inside_ownership', type: 'text', role: 'SkyYield', required: true },
    { name: 'ap_outside_ownership', type: 'text', role: 'SkyYield', required: true },
    { name: 'router_ownership', type: 'text', role: 'SkyYield', required: true },
    { name: 'switch_ownership', type: 'text', role: 'SkyYield', required: true },
    { name: 'software_ownership', type: 'text', role: 'SkyYield', required: true },
    { name: 'installation_ownership', type: 'text', role: 'SkyYield', required: true },
    { name: 'revenue_distribution', type: 'text', role: 'SkyYield', required: true },
  ],

  // NDA - h3ptapBbrtW1Et
  'nda': [
    { name: 'disclosing_party_name', type: 'text', role: 'SkyYield', required: true },
    { name: 'disclosing_party_signature', type: 'signature', role: 'SkyYield', required: true },
    { name: 'disclosing_party_signer_name', type: 'text', role: 'SkyYield', required: true },
    { name: 'disclosing_party_signer_title', type: 'text', role: 'SkyYield', required: true },
    { name: 'disclosing_party_signature_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'disclosing_party_address', type: 'text', role: 'SkyYield', required: true },
    { name: 'receiving_party_name', type: 'text', role: 'Receiving Party', required: true },
    { name: 'receiving_party_signature', type: 'signature', role: 'Receiving Party', required: true },
    { name: 'receiving_party_signer_name', type: 'text', role: 'Receiving Party', required: true },
    { name: 'receiving_party_signer_title', type: 'text', role: 'Receiving Party', required: true },
    { name: 'receiving_party_signature_date', type: 'date', role: 'Receiving Party', required: true },
    { name: 'receiving_party_address', type: 'text', role: 'Receiving Party', required: true },
  ],

  // Non-Compete - Y3fjzopfSHZ1Bg
  'non-compete': [
    { name: 'effective_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'employee_signature', type: 'signature', role: 'Employee', required: true },
    { name: 'employee_signature_date', type: 'date', role: 'Employee', required: true },
    { name: 'employee_address_1', type: 'text', role: 'Employee', required: true },
    { name: 'employee_address_2', type: 'text', role: 'Employee', required: false },
    { name: 'employee_city', type: 'text', role: 'Employee', required: true },
    { name: 'employee_state', type: 'text', role: 'Employee', required: true },
    { name: 'employee_zip', type: 'text', role: 'Employee', required: true },
    { name: 'employee_attn', type: 'text', role: 'Employee', required: false },
    { name: 'employee_facsimile', type: 'text', role: 'Employee', required: false },
    { name: 'employee_email', type: 'text', role: 'Employee', required: true },
    { name: 'employee_prior_inventions', type: 'text', role: 'Employee', required: false },
    { name: 'restricted_period_months', type: 'text', role: 'SkyYield', required: true },
  ],

  // Offer Letter - mGZkXDW9f7AGQf
  'offer-letter': [
    { name: 'offer_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'candidate_name', type: 'text', role: 'Candidate', required: true },
    { name: 'job_title', type: 'text', role: 'SkyYield', required: true },
    { name: 'job_description', type: 'text', role: 'SkyYield', required: true },
    { name: 'bimonthly_pay', type: 'text', role: 'SkyYield', required: true },
    { name: 'annual_pay', type: 'text', role: 'SkyYield', required: true },
    { name: 'start_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'candidate_signature', type: 'signature', role: 'Candidate', required: true },
    { name: 'candidate_signature_date', type: 'date', role: 'Candidate', required: true },
    { name: 'skyyield_signature', type: 'signature', role: 'SkyYield', required: true },
    { name: 'skyyield_signer_name', type: 'text', role: 'SkyYield', required: true },
    { name: 'skyyield_signature_date', type: 'date', role: 'SkyYield', required: true },
  ],

  // Referral Partner Agreement - fmECW5ixhVoLY3
  'referral-agreement': [
    { name: 'partner_name', type: 'text', role: 'Partner', required: true },
    { name: 'partner_address', type: 'text', role: 'Partner', required: true },
    { name: 'referral_commission_pct', type: 'text', role: 'SkyYield', required: true },
    { name: 'relationship_commission_pct', type: 'text', role: 'SkyYield', required: false },
    { name: 'channel_commission_pct', type: 'text', role: 'SkyYield', required: false },
    { name: 'commission_text', type: 'text', role: 'SkyYield', required: true },
    { name: 'commission_pct', type: 'text', role: 'SkyYield', required: true },
    { name: 'partner_signer_name', type: 'text', role: 'Partner', required: true },
    { name: 'partner_company', type: 'text', role: 'Partner', required: false },
    { name: 'partner_signature', type: 'signature', role: 'Partner', required: true },
    { name: 'partner_signer_title', type: 'text', role: 'Partner', required: true },
    { name: 'partner_signature_date', type: 'date', role: 'Partner', required: true },
    { name: 'skyyield_signature', type: 'signature', role: 'SkyYield', required: true },
    { name: 'skyyield_signer_name', type: 'text', role: 'SkyYield', required: true },
    { name: 'skyyield_signer_title', type: 'text', role: 'SkyYield', required: true },
    { name: 'skyyield_signature_date', type: 'date', role: 'SkyYield', required: true },
  ],

  // Employee Write-Up - wrsM6NzZkxxhyw
  'employee-writeup': [
    { name: 'writeup_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'employee_name', type: 'text', role: 'Employee', required: true },
    { name: 'employee_manager', type: 'text', role: 'SkyYield', required: true },
    { name: 'reason_for_writeup', type: 'text', role: 'SkyYield', required: true },
    { name: 'probation_start_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'probation_end_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'goals_to_achieve', type: 'text', role: 'SkyYield', required: true },
    { name: 'failed_probation_result', type: 'text', role: 'SkyYield', required: true },
    { name: 'manager_signature', type: 'signature', role: 'SkyYield', required: true },
    { name: 'manager_signature_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'employee_signature', type: 'signature', role: 'Employee', required: true },
    { name: 'employee_signature_date', type: 'date', role: 'Employee', required: true },
  ],

  // Termination Letter - P6BrWWpXHHfvRC
  'termination': [
    { name: 'skyyield_representative', type: 'text', role: 'SkyYield', required: true },
    { name: 'termination_letter_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'employee_name', type: 'text', role: 'Employee', required: true },
    { name: 'employee_address', type: 'text', role: 'Employee', required: true },
    { name: 'employee_address_2', type: 'text', role: 'Employee', required: false },
    { name: 'employee_city', type: 'text', role: 'Employee', required: true },
    { name: 'employee_state', type: 'text', role: 'Employee', required: true },
    { name: 'employee_zip', type: 'text', role: 'Employee', required: true },
    { name: 'termination_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'termination_time', type: 'text', role: 'SkyYield', required: true },
    { name: 'job_title', type: 'text', role: 'SkyYield', required: true },
    { name: 'reasons_for_termination', type: 'text', role: 'SkyYield', required: true },
    { name: 'equipment_return_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'equipment_return_time', type: 'text', role: 'SkyYield', required: true },
    { name: 'final_pay_date', type: 'date', role: 'SkyYield', required: true },
    { name: 'skyyield_signature', type: 'signature', role: 'SkyYield', required: true },
    { name: 'employee_signature', type: 'signature', role: 'Employee', required: true },
  ],
}

// Template slug to DocuSeal ID mapping
const TEMPLATE_IDS: Record<string, string> = {
  'contractor-agreement': 'F88qMS4Hfd3gUA',
  'employee-writeup': 'wrsM6NzZkxxhyw',
  'location-deployment': 'JmbxtjQLnqZT4i',
  'loi': '4PdGsJnFJSUDxS',
  'nda': 'h3ptapBbrtW1Et',
  'non-compete': 'Y3fjzopfSHZ1Bg',
  'offer-letter': 'mGZkXDW9f7AGQf',
  'referral-agreement': 'fmECW5ixhVoLY3',
  'termination': 'P6BrWWpXHHfvRC',
}

// GET - List all templates and their fields
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const templateSlug = searchParams.get('template')

  if (templateSlug) {
    const fields = TEMPLATE_FIELDS[templateSlug]
    const templateId = TEMPLATE_IDS[templateSlug]
    
    if (!fields) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({
      template: templateSlug,
      docusealId: templateId,
      fields,
      fieldCount: fields.length,
    })
  }

  // Return all templates
  const templates = Object.entries(TEMPLATE_FIELDS).map(([slug, fields]) => ({
    slug,
    docusealId: TEMPLATE_IDS[slug],
    fieldCount: fields.length,
    roles: [...new Set(fields.map(f => f.role))],
  }))

  return NextResponse.json({ templates })
}

// POST - Push fields to DocuSeal (generates field tag document)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateSlug, action } = body

    if (action === 'list-docuseal-templates') {
      // Fetch actual templates from DocuSeal
      const response = await fetch(`${DOCUSEAL_API_URL}/templates`, {
        headers: {
          'X-Auth-Token': DOCUSEAL_API_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch DocuSeal templates' }, { status: 500 })
      }

      const templates = await response.json()
      return NextResponse.json({ templates })
    }

    if (action === 'get-template-details') {
      // Get specific template details from DocuSeal
      const templateId = TEMPLATE_IDS[templateSlug]
      if (!templateId) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      const response = await fetch(`${DOCUSEAL_API_URL}/templates/${templateId}`, {
        headers: {
          'X-Auth-Token': DOCUSEAL_API_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch template from DocuSeal' }, { status: 500 })
      }

      const template = await response.json()
      return NextResponse.json({ 
        template,
        ourFields: TEMPLATE_FIELDS[templateSlug],
      })
    }

    if (action === 'generate-field-tags') {
      // Generate a document with field tags that can be copied into the template
      const fields = TEMPLATE_FIELDS[templateSlug]
      if (!fields) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      // Generate field tag strings for DocuSeal
      // Format: {{field_name;role=RoleName;type=fieldtype}}
      const fieldTags = fields.map(f => {
        const typeMap: Record<string, string> = {
          'text': 'text',
          'date': 'date',
          'signature': 'signature',
          'initials': 'initials',
          'checkbox': 'checkbox',
        }
        const docusealType = typeMap[f.type] || 'text'
        return {
          name: f.name,
          tag: `{{${f.name};role=${f.role};type=${docusealType}}}`,
          type: f.type,
          role: f.role,
          required: f.required,
        }
      })

      return NextResponse.json({
        templateSlug,
        docusealId: TEMPLATE_IDS[templateSlug],
        fieldCount: fieldTags.length,
        fieldTags,
        instructions: 'Copy these tags into your DocuSeal template document. Place each tag where you want the field to appear.',
      })
    }

    if (action === 'create-html-template') {
      // Create a new template via HTML API with embedded fields
      const fields = TEMPLATE_FIELDS[templateSlug]
      if (!fields) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      // Group fields by role
      const roleGroups: Record<string, typeof fields> = {}
      fields.forEach(f => {
        if (!roleGroups[f.role]) roleGroups[f.role] = []
        roleGroups[f.role].push(f)
      })

      // Generate HTML with field tags
      let html = `<html><body style="font-family: Arial, sans-serif; padding: 40px;">
        <h1 style="text-align: center;">SkyYield - ${templateSlug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</h1>
        <hr style="margin: 20px 0;" />`

      Object.entries(roleGroups).forEach(([role, roleFields]) => {
        html += `<h2>${role}</h2><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">`
        
        roleFields.forEach(f => {
          const fieldHtml = f.type === 'signature' 
            ? `<signature-field name="${f.name}" role="${role}" style="width: 200px; height: 60px; border: 1px solid #ccc;"></signature-field>`
            : f.type === 'initials'
            ? `<initials-field name="${f.name}" role="${role}" style="width: 80px; height: 40px; border: 1px solid #ccc;"></initials-field>`
            : f.type === 'date'
            ? `<date-field name="${f.name}" role="${role}" style="width: 150px; border: 1px solid #ccc;"></date-field>`
            : `<text-field name="${f.name}" role="${role}" ${f.required ? 'required="true"' : ''} style="width: 250px; border: 1px solid #ccc;"></text-field>`

          html += `<tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; width: 200px;"><strong>${f.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${fieldHtml}</td>
          </tr>`
        })
        
        html += `</table>`
      })

      html += `</body></html>`

      // Create template in DocuSeal
      const response = await fetch(`${DOCUSEAL_API_URL}/templates/html`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': DOCUSEAL_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `SkyYield - ${templateSlug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} (Generated)`,
          html,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json({ 
          error: 'Failed to create template in DocuSeal',
          details: errorText 
        }, { status: 500 })
      }

      const newTemplate = await response.json()
      return NextResponse.json({
        success: true,
        message: 'Template created in DocuSeal',
        template: newTemplate,
        fieldCount: fields.length,
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use: list-docuseal-templates, get-template-details, generate-field-tags, or create-html-template' }, { status: 400 })
  } catch (error) {
    console.error('DocuSeal fields error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
