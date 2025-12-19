// app/api/integrations/docuseal/send/route.ts
// DocuSeal Document Sending API
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DOCUSEAL_API_URL = 'https://api.docuseal.co'

// Template IDs - set these in your environment variables
const TEMPLATE_IDS: Record<string, string> = {
  loi: process.env.DOCUSEAL_LOI_TEMPLATE_ID || '',
  contract: process.env.DOCUSEAL_CONTRACT_TEMPLATE_ID || '',
  referral_agreement: process.env.DOCUSEAL_REFERRAL_AGREEMENT_TEMPLATE_ID || '',
  contractor_agreement: process.env.DOCUSEAL_CONTRACTOR_AGREEMENT_TEMPLATE_ID || '',
  nda: process.env.DOCUSEAL_NDA_TEMPLATE_ID || '',
  noncompete: process.env.DOCUSEAL_NONCOMPETE_TEMPLATE_ID || '',
  offer_letter: process.env.DOCUSEAL_OFFER_LETTER_TEMPLATE_ID || '',
  writeup: process.env.DOCUSEAL_WRITEUP_TEMPLATE_ID || '',
  termination: process.env.DOCUSEAL_TERMINATION_TEMPLATE_ID || '',
}

// Database table and field mapping for each document type
const DOC_CONFIG: Record<string, {
  table: string
  statusField: string
  sentField: string
  docusealIdField: string
  emailField: string
  nameField: string
}> = {
  loi: {
    table: 'location_partners',
    statusField: 'loi_status',
    sentField: 'loi_sent_at',
    docusealIdField: 'loi_docuseal_id',
    emailField: 'email',
    nameField: 'contact_name',
  },
  contract: {
    table: 'location_partners',
    statusField: 'contract_status',
    sentField: 'contract_sent_at',
    docusealIdField: 'contract_docuseal_id',
    emailField: 'email',
    nameField: 'contact_name',
  },
  referral_agreement: {
    table: 'referral_partners',
    statusField: 'agreement_status',
    sentField: 'agreement_sent_at',
    docusealIdField: 'agreement_docuseal_id',
    emailField: 'contact_email',
    nameField: 'contact_full_name',
  },
  contractor_agreement: {
    table: 'contractors',
    statusField: 'agreement_status',
    sentField: 'agreement_sent_at',
    docusealIdField: 'agreement_docuseal_id',
    emailField: 'contact_email',
    nameField: 'contact_full_name',
  },
  nda: {
    table: 'location_partners', // Can be used for any entity type
    statusField: 'nda_status',
    sentField: 'nda_sent_at',
    docusealIdField: 'nda_docuseal_id',
    emailField: 'email',
    nameField: 'contact_name',
  },
  noncompete: {
    table: 'employees',
    statusField: 'noncompete_status',
    sentField: 'noncompete_sent_at',
    docusealIdField: 'noncompete_docuseal_id',
    emailField: 'email',
    nameField: 'full_name',
  },
  offer_letter: {
    table: 'employees',
    statusField: 'offer_letter_status',
    sentField: 'offer_letter_sent_at',
    docusealIdField: 'offer_letter_docuseal_id',
    emailField: 'email',
    nameField: 'full_name',
  },
}

// POST - Send a document
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await request.json()

    const {
      document_type,
      entity_id,
      entity_type, // location_partner, referral_partner, contractor, employee
      custom_values = {},
      send_email = true,
    } = body

    // Validate
    if (!document_type || !entity_id) {
      return NextResponse.json({ 
        error: 'document_type and entity_id are required' 
      }, { status: 400 })
    }

    const templateId = TEMPLATE_IDS[document_type]
    if (!templateId) {
      return NextResponse.json({ 
        error: `No template configured for document type: ${document_type}` 
      }, { status: 400 })
    }

    const config = DOC_CONFIG[document_type]
    if (!config) {
      return NextResponse.json({ 
        error: `No config for document type: ${document_type}` 
      }, { status: 400 })
    }

    // Get entity data
    const { data: entity, error: entityError } = await supabase
      .from(config.table)
      .select('*')
      .eq('id', entity_id)
      .single()

    if (entityError || !entity) {
      return NextResponse.json({ 
        error: 'Entity not found' 
      }, { status: 404 })
    }

    // Build field values based on document type
    const values = buildFieldValues(document_type, entity, custom_values)

    // Create DocuSeal submission
    const submissionPayload = {
      template_id: parseInt(templateId),
      send_email,
      submitters: [
        {
          role: 'SkyYield',
          email: process.env.SKYYIELD_CONTRACTS_EMAIL || 'contracts@skyyield.io',
          name: 'SkyYield',
        },
        {
          role: getRecipientRole(document_type),
          email: entity[config.emailField],
          name: entity[config.nameField],
        },
      ],
      values,
      metadata: {
        partner_id: entity_id,
        document_type,
        partner_type: entity_type || config.table.replace('_', ''),
      },
    }

    const docusealResponse = await fetch(`${DOCUSEAL_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DOCUSEAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionPayload),
    })

    if (!docusealResponse.ok) {
      const errorData = await docusealResponse.text()
      console.error('DocuSeal API error:', errorData)
      return NextResponse.json({ 
        error: 'Failed to create DocuSeal submission',
        details: errorData,
      }, { status: 500 })
    }

    const submission = await docusealResponse.json()

    // Update database
    const updateData: Record<string, any> = {
      [config.statusField]: 'sent',
      [config.sentField]: new Date().toISOString(),
      [config.docusealIdField]: submission.id.toString(),
      updated_at: new Date().toISOString(),
    }

    // Update stage if LOI
    if (document_type === 'loi') {
      updateData.stage = 'loi_sent'
      updateData.stage_entered_at = new Date().toISOString()
    }

    await supabase
      .from(config.table)
      .update(updateData)
      .eq('id', entity_id)

    // Log activity
    await supabase.from('activity_log').insert([{
      entity_type: entity_type || config.table.replace('s', ''),
      entity_id,
      entity_name: entity[config.nameField],
      user_id: userId || null,
      action: 'document_sent',
      action_category: 'docuseal',
      description: `${document_type.toUpperCase()} sent via DocuSeal`,
      new_values: {
        document_type,
        submission_id: submission.id,
        recipient_email: entity[config.emailField],
      },
    }])

    return NextResponse.json({
      success: true,
      submission_id: submission.id,
      submission_url: submission.submitters?.[1]?.embed_src, // Recipient's signing URL
    })
  } catch (error: any) {
    console.error('DocuSeal send error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Get available templates
export async function GET() {
  const templates = Object.entries(TEMPLATE_IDS)
    .filter(([_, id]) => id)
    .map(([type, id]) => ({
      document_type: type,
      template_id: id,
      configured: true,
    }))

  return NextResponse.json({ templates })
}

// Helper: Get recipient role name for DocuSeal
function getRecipientRole(documentType: string): string {
  const roles: Record<string, string> = {
    loi: 'Location Partner',
    contract: 'Location Partner',
    referral_agreement: 'Partner',
    contractor_agreement: 'Contractor',
    nda: 'Receiving Party',
    noncompete: 'Employee',
    offer_letter: 'Candidate',
    writeup: 'Employee',
    termination: 'Employee',
  }
  return roles[documentType] || 'Recipient'
}

// Helper: Build field values for DocuSeal template
function buildFieldValues(
  documentType: string, 
  entity: any, 
  customValues: Record<string, any>
): Record<string, any> {
  const today = new Date().toISOString().split('T')[0]

  // Base values that apply to most documents
  const baseValues: Record<string, any> = {
    // SkyYield info
    skyyield_signer_name: 'Stosh Cohen',
    skyyield_signer_title: 'Co-Founder',
    disclosing_party_name: 'SkyYield, LLC',
    disclosing_party_address: '925B Peachtree St NE #318, Atlanta, GA 30309',
  }

  // Document-specific values
  switch (documentType) {
    case 'loi':
      return {
        ...baseValues,
        loi_date: today,
        lp_company_name: entity.company_name || entity.company_legal_name,
        lp_address_1: entity.address || entity.address_line_1,
        lp_city: entity.city,
        lp_state: entity.state,
        lp_zip: entity.zip,
        lp_contact_name: entity.contact_name || entity.contact_full_name,
        lp_contact_title: entity.contact_title || 'Owner',
        lp_contact_email: entity.email || entity.contact_email,
        ...customValues, // Trial dates, equipment, etc.
      }

    case 'contract':
      return {
        ...baseValues,
        agreement_date: today,
        lp_company_name: entity.company_name || entity.company_legal_name,
        lp_address: `${entity.address || entity.address_line_1}, ${entity.city}, ${entity.state} ${entity.zip}`,
        ...customValues, // Equipment, payment responsibility, ownership
      }

    case 'referral_agreement':
      return {
        ...baseValues,
        partner_name: entity.contact_full_name,
        partner_company: entity.company_name || entity.contact_full_name,
        partner_address: `${entity.address_line_1 || ''}, ${entity.city}, ${entity.state} ${entity.zip}`,
        partner_title: entity.contact_title || '',
        signing_partner_name: entity.contact_full_name,
        ...customValues, // Commission rates
      }

    case 'contractor_agreement':
      return {
        ...baseValues,
        effective_date: today,
        contractor_name: entity.dba_name || entity.legal_name,
        contractor_legal_name: entity.legal_name,
        contractor_entity_type: entity.entity_type === 'business' ? 'LLC' : 'Individual',
        contractor_address_1: entity.address_line_1,
        contractor_address_2: entity.address_line_2 || '',
        contractor_city: entity.city,
        contractor_state: entity.state,
        contractor_zip: entity.zip,
        ...customValues, // Engagement term, scope, fees
      }

    case 'nda':
      return {
        ...baseValues,
        receiving_party_name: entity.company_name || entity.contact_name || entity.contact_full_name,
        receiving_party_address: `${entity.address || entity.address_line_1 || ''}, ${entity.city}, ${entity.state} ${entity.zip}`,
        ...customValues,
      }

    case 'offer_letter':
      return {
        ...baseValues,
        offer_date: today,
        candidate_name: entity.full_name,
        ...customValues, // Job title, salary, start date, benefits
      }

    case 'noncompete':
      return {
        ...baseValues,
        effective_date: entity.start_date || today,
        employee_email: entity.email,
        employee_address_1: entity.address_street,
        employee_city: entity.address_city,
        employee_state: entity.address_state,
        employee_zip: entity.address_zip,
        ...customValues, // Restricted period
      }

    default:
      return { ...baseValues, ...customValues }
  }
}
