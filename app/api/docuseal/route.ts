import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY!
const DOCUSEAL_API_URL = 'https://api.docuseal.co'

// Template IDs from DocuSeal - Extract from URLs
// Format: https://docuseal.com/d/{TEMPLATE_SLUG}
const DOCUSEAL_TEMPLATES: Record<string, {
  slug: string
  name: string
  formSlug: string
  formType: string
}> = {
  'contractor-agreement': {
    slug: 'F88qMS4Hfd3gUA',
    name: 'SkyYield-Contractor-Contract-Template',
    formSlug: 'contractor-agreement',
    formType: 'contractor'
  },
  'employee-writeup': {
    slug: 'wrsM6NzZkxxhyw',
    name: 'Employee Write-Up (PIP)',
    formSlug: 'employee-writeup',
    formType: 'employee'
  },
  'location-deployment': {
    slug: 'JmbxtjQLnqZT4i',
    name: 'Location Deployment Agreement',
    formSlug: 'location-deployment',
    formType: 'location_partner'
  },
  'loi': {
    slug: '4PdGsJnFJSUDxS',
    name: 'Letter of Intent',
    formSlug: 'loi',
    formType: 'location_partner'
  },
  'nda': {
    slug: 'h3ptapBbrtW1Et',
    name: 'Non-Disclosure Agreement',
    formSlug: 'nda',
    formType: 'general'
  },
  'non-compete': {
    slug: 'Y3fjzopfSHZ1Bg',
    name: 'Non-Compete/Non-Solicitation',
    formSlug: 'non-compete',
    formType: 'employee'
  },
  'offer-letter': {
    slug: 'mGZkXDW9f7AGQf',
    name: 'Offer Letter',
    formSlug: 'offer-letter',
    formType: 'employee'
  },
  'referral-agreement': {
    slug: 'fmECW5ixhVoLY3',
    name: 'Referral Partner Agreement',
    formSlug: 'referral-agreement',
    formType: 'referral_partner'
  },
  'termination': {
    slug: 'P6BrWWpXHHfvRC',
    name: 'Termination Letter',
    formSlug: 'termination',
    formType: 'employee'
  },
}

// Field mappings: DocuSeal field name -> Pipeline table column
const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  // Contractor Agreement
  'contractor-agreement': {
    'effective_date': 'effective_date',
    'contractor_name': 'contact_full_name',
    'contractor_legal_name': 'legal_name',
    'contractor_entity_type': 'entity_type',
    'contractor_state_residence': 'state',
    'contractor_address_1': 'address_line_1',
    'contractor_address_2': 'address_line_2',
    'contractor_city': 'city',
    'contractor_state': 'state',
    'contractor_zip': 'zip',
    'contractor_signer_title': 'contact_title',
    'contractor_email': 'contact_email',
    'contractor_phone': 'contact_phone',
  },
  // Location Deployment Agreement
  'location-deployment': {
    'agreement_date': 'created_at',
    'lp_company_name': 'company_name',
    'lp_address': 'address',
    'lp_signer_name': 'contact_name',
    'lp_signer_title': 'contact_title',
    'lp_email': 'email',
    'lp_phone': 'phone',
  },
  // Letter of Intent
  'loi': {
    'loi_date': 'created_at',
    'lp_name': 'contact_name',
    'lp_company_name': 'company_name',
    'lp_address_1': 'address',
    'lp_address_2': 'address_line_2',
    'lp_city': 'city',
    'lp_state': 'state',
    'lp_zip': 'zip',
    'lp_contact_name': 'contact_name',
    'lp_contact_title': 'contact_title',
    'lp_contact_email': 'email',
  },
  // NDA
  'nda': {
    'receiving_party_name': 'contact_name',
    'receiving_party_address': 'address',
    'receiving_party_signer_name': 'contact_name',
    'receiving_party_signer_title': 'contact_title',
  },
  // Referral Partner Agreement
  'referral-agreement': {
    'partner_name': 'contact_full_name',
    'partner_address': 'address_line_1',
    'partner_company': 'company_name',
    'partner_signer_name': 'contact_full_name',
    'partner_signer_title': 'contact_title',
    'partner_email': 'contact_email',
  },
  // Employee Write-up
  'employee-writeup': {
    'employee_name': 'full_name',
    'employee_email': 'personal_email',
  },
  // Offer Letter
  'offer-letter': {
    'candidate_name': 'full_name',
    'candidate_email': 'personal_email',
  },
  // Non-Compete
  'non-compete': {
    'employee_name': 'full_name',
    'employee_address_1': 'address_line_1',
    'employee_address_2': 'address_line_2',
    'employee_city': 'city',
    'employee_state': 'state',
    'employee_zip': 'zip',
    'employee_email': 'personal_email',
  },
  // Termination
  'termination': {
    'employee_name': 'full_name',
    'employee_address': 'address_line_1',
    'employee_city': 'city',
    'employee_state': 'state',
    'employee_zip': 'zip',
    'job_title': 'job_title',
  },
}

// GET - List templates or get template details
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const templateSlug = searchParams.get('template')
  const action = searchParams.get('action')

  try {
    // List all templates
    if (action === 'list' || !templateSlug) {
      // Fetch templates from DocuSeal API
      const response = await fetch(`${DOCUSEAL_API_URL}/templates`, {
        headers: {
          'X-Auth-Token': DOCUSEAL_API_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return NextResponse.json({ 
          templates: Object.entries(DOCUSEAL_TEMPLATES).map(([key, val]) => ({
            key,
            ...val,
            url: `https://docuseal.com/d/${val.slug}`
          }))
        })
      }

      const templates = await response.json()
      return NextResponse.json({ templates })
    }

    // Get specific template fields
    const template = DOCUSEAL_TEMPLATES[templateSlug]
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Try to get template details from DocuSeal API
    const response = await fetch(`${DOCUSEAL_API_URL}/templates/${template.slug}`, {
      headers: {
        'X-Auth-Token': DOCUSEAL_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const templateDetails = await response.json()
      return NextResponse.json({ 
        template: {
          ...template,
          details: templateDetails,
          fieldMappings: FIELD_MAPPINGS[templateSlug] || {}
        }
      })
    }

    return NextResponse.json({ 
      template: {
        ...template,
        fieldMappings: FIELD_MAPPINGS[templateSlug] || {}
      }
    })
  } catch (error) {
    console.error('DocuSeal GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST - Send a document for signature
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      templateSlug,        // Which template to use
      recipientEmail,      // Who should sign
      recipientName,       // Signer's name
      entityType,          // 'location_partner', 'referral_partner', 'contractor', 'employee'
      entityId,            // UUID of the record
      additionalFields,    // Any extra fields to prefill
      sendEmail = true,    // Whether to send email notification
      message,             // Custom message to include
    } = body

    if (!templateSlug || !recipientEmail || !entityType || !entityId) {
      return NextResponse.json({ 
        error: 'Missing required fields: templateSlug, recipientEmail, entityType, entityId' 
      }, { status: 400 })
    }

    // Get template config
    const template = DOCUSEAL_TEMPLATES[templateSlug]
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Get entity data from pipeline table
    const tableMap: Record<string, string> = {
      'location_partner': 'location_partners',
      'referral_partner': 'referral_partners',
      'contractor': 'contractors',
      'employee': 'employees',
    }

    const tableName = tableMap[entityType]
    if (!tableName) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    const { data: entityData, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', entityId)
      .single()

    if (fetchError || !entityData) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Build prefilled fields
    const fieldMappings = FIELD_MAPPINGS[templateSlug] || {}
    const prefilledFields: Array<{ name: string; default_value: string }> = []

    // Map entity data to DocuSeal fields
    for (const [docusealField, entityColumn] of Object.entries(fieldMappings)) {
      const value = entityData[entityColumn]
      if (value !== null && value !== undefined) {
        prefilledFields.push({
          name: docusealField,
          default_value: String(value)
        })
      }
    }

    // Add any additional fields
    if (additionalFields) {
      for (const [fieldName, fieldValue] of Object.entries(additionalFields)) {
        prefilledFields.push({
          name: fieldName,
          default_value: String(fieldValue)
        })
      }
    }

    // Add SkyYield prefilled fields (common across all templates)
    prefilledFields.push(
      { name: 'skyyield_signer_name', default_value: 'Stosh Cohen' },
      { name: 'skyyield_signer_title', default_value: 'CEO' },
      { name: 'disclosing_party_name', default_value: 'SkyYield, Inc.' },
      { name: 'disclosing_party_address', default_value: '123 Tech Park Dr, Atlanta, GA 30301' },
      { name: 'disclosing_party_signer_name', default_value: 'Stosh Cohen' },
      { name: 'disclosing_party_signer_title', default_value: 'CEO' },
    )

    // Create submission in DocuSeal
    const docusealPayload = {
      template_id: template.slug,
      send_email: sendEmail,
      submitters: [
        {
          email: recipientEmail,
          name: recipientName || entityData.contact_name || entityData.contact_full_name || entityData.full_name,
          role: 'Signer',
          fields: prefilledFields,
        }
      ],
      message: message || `Please review and sign the ${template.name}.`,
    }

    console.log('DocuSeal payload:', JSON.stringify(docusealPayload, null, 2))

    const response = await fetch(`${DOCUSEAL_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': DOCUSEAL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(docusealPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DocuSeal API error:', errorText)
      return NextResponse.json({ 
        error: 'Failed to create DocuSeal submission',
        details: errorText
      }, { status: response.status })
    }

    const submission = await response.json()

    // Update entity with document status
    const docFieldPrefix = templateSlug.replace(/-/g, '_')
    const updateFields: Record<string, any> = {
      [`${docFieldPrefix}_status`]: 'sent',
      [`${docFieldPrefix}_sent_at`]: new Date().toISOString(),
      [`${docFieldPrefix}_submission_id`]: submission.id || submission[0]?.id,
    }

    // Try to update (some fields may not exist in table)
    await supabase
      .from(tableName)
      .update(updateFields)
      .eq('id', entityId)
      .catch(e => console.log('Update field error (may be expected):', e))

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: entityType,
      entity_id: entityId,
      action: `${templateSlug}_sent`,
      category: 'Documents',
      details: {
        template: template.name,
        recipient: recipientEmail,
        submission_id: submission.id || submission[0]?.id,
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ 
      success: true,
      submission,
      message: `${template.name} sent to ${recipientEmail}`,
      prefilledFields: prefilledFields.length,
    })
  } catch (error) {
    console.error('DocuSeal POST error:', error)
    return NextResponse.json({ error: 'Failed to send document' }, { status: 500 })
  }
}

// PUT - Update template mapping in forms table
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { formSlug, docusealTemplateId } = body

    if (!formSlug || !docusealTemplateId) {
      return NextResponse.json({ 
        error: 'formSlug and docusealTemplateId required' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('forms')
      .update({ 
        docuseal_template_id: docusealTemplateId,
        updated_at: new Date().toISOString()
      })
      .eq('slug', formSlug)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      form: data,
      message: `DocuSeal template linked to ${formSlug}`
    })
  } catch (error) {
    console.error('DocuSeal PUT error:', error)
    return NextResponse.json({ error: 'Failed to update template mapping' }, { status: 500 })
  }
}
