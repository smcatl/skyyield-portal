// API Route: DocuSeal Document Management
// app/api/pipeline/docuseal/route.ts
// Replaces PandaDocs - Open source document signing

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// DocuSeal API configuration
// For self-hosted: use your own URL (e.g., https://docs.yourdomain.com)
// For cloud: https://api.docuseal.co
const DOCUSEAL_API_BASE = process.env.DOCUSEAL_API_URL || 'https://api.docuseal.co'

// Helper to make DocuSeal API requests
async function docusealFetch(endpoint: string, options: RequestInit = {}) {
  const apiKey = process.env.DOCUSEAL_API_KEY
  
  if (!apiKey) {
    throw new Error('DOCUSEAL_API_KEY not configured')
  }

  const res = await fetch(`${DOCUSEAL_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'X-Auth-Token': apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`DocuSeal API error: ${res.status} - ${error}`)
  }

  return res.json()
}

// GET: List templates, submissions, or get status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const submissionId = searchParams.get('submissionId')
  const templateId = searchParams.get('templateId')
  const partnerId = searchParams.get('partnerId')

  try {
    switch (action) {
      case 'templates':
        // List all templates
        const templates = await docusealFetch('/templates')
        return NextResponse.json({ 
          success: true, 
          templates: templates.map((t: any) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            createdAt: t.created_at,
            fields: t.fields,
          }))
        })

      case 'submission':
        // Get specific submission status
        if (!submissionId) {
          return NextResponse.json({ error: 'submissionId required' }, { status: 400 })
        }
        const submission = await docusealFetch(`/submissions/${submissionId}`)
        return NextResponse.json({ success: true, submission })

      case 'submissions':
        // List submissions (optionally filtered by template)
        let submissionsUrl = '/submissions?limit=50'
        if (templateId) {
          submissionsUrl += `&template_id=${templateId}`
        }
        const submissions = await docusealFetch(submissionsUrl)
        return NextResponse.json({ success: true, submissions })

      case 'partner_documents':
        // Get all documents for a partner from our database
        if (!partnerId) {
          return NextResponse.json({ error: 'partnerId required' }, { status: 400 })
        }
        const supabase = getSupabaseAdmin()
        const { data: docs } = await supabase
          .from('documents')
          .select('*')
          .eq('entity_id', partnerId)
          .order('created_at', { ascending: false })
        
        return NextResponse.json({ success: true, documents: docs || [] })

      default:
        // List recent submissions
        const recentSubs = await docusealFetch('/submissions?limit=20')
        return NextResponse.json({ success: true, submissions: recentSubs })
    }

  } catch (error) {
    console.error('DocuSeal GET error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch from DocuSeal',
      details: String(error)
    }, { status: 500 })
  }
}

// POST: Create and send documents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, partner, documentType, templateId } = body

    switch (action) {
      case 'create_loi':
        return await createLOI(partner, templateId)
      
      case 'create_contract':
        return await createDeploymentContract(partner, templateId)
      
      case 'create_partner_agreement':
        return await createPartnerAgreement(partner, body.partnerType, templateId)
      
      case 'resend':
        return await resendSubmission(body.submissionId)
      
      case 'download':
        return await downloadDocument(body.submissionId)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('DocuSeal POST error:', error)
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: String(error)
    }, { status: 500 })
  }
}

// Create Letter of Intent
async function createLOI(partner: any, templateId?: string) {
  const supabase = getSupabaseAdmin()
  
  const recipientEmail = partner.contact_email || partner.contactEmail
  const recipientName = partner.contact_name || partner.contactFullName || partner.contact_full_name
  const companyName = partner.dba_name || partner.company_dba || partner.companyDBA || 
                      partner.company_legal_name || partner.companyLegalName

  if (!recipientEmail || !recipientName) {
    return NextResponse.json({ 
      error: 'Partner email and name required' 
    }, { status: 400 })
  }

  // Use configured template or environment variable
  const loiTemplateId = templateId || process.env.DOCUSEAL_LOI_TEMPLATE_ID

  if (!loiTemplateId) {
    return NextResponse.json({ 
      error: 'LOI template not configured. Set DOCUSEAL_LOI_TEMPLATE_ID or pass templateId' 
    }, { status: 400 })
  }

  try {
    // Create submission with pre-filled fields
    const submission = await docusealFetch('/submissions', {
      method: 'POST',
      body: JSON.stringify({
        template_id: parseInt(loiTemplateId),
        send_email: true,
        submitters: [
          {
            email: recipientEmail,
            name: recipientName,
            role: 'Location Partner',
            fields: [
              { name: 'partner_name', default_value: recipientName },
              { name: 'company_name', default_value: companyName },
              { name: 'company_legal_name', default_value: partner.company_legal_name || partner.companyLegalName || companyName },
              { name: 'contact_email', default_value: recipientEmail },
              { name: 'contact_phone', default_value: partner.contact_phone || partner.contactPhone || '' },
              { name: 'venue_address', default_value: partner.venues?.[0]?.address || partner.company_address1 || partner.companyAddress1 || '' },
              { name: 'venue_count', default_value: String(partner.venues?.length || partner.number_of_locations || 1) },
              { name: 'date', default_value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
              { name: 'trial_duration', default_value: '60 days' },
              { name: 'revenue_share', default_value: '50%' },
            ],
          }
        ],
        message: {
          subject: `SkyYield Letter of Intent - ${companyName}`,
          body: `Hi ${recipientName},\n\nPlease review and sign the attached Letter of Intent to proceed with your SkyYield WiFi deployment.\n\nThis document outlines our 60-day trial period and partnership terms.\n\nBest regards,\nSkyYield Team`,
        },
        metadata: {
          partner_id: partner.id,
          document_type: 'loi',
          company_name: companyName,
        },
      }),
    })

    console.log(`📄 Created LOI submission: ${submission.id}`)

    // Store in our database
    const submitter = submission.submitters?.[0]
    await supabase.from('documents').insert({
      docuseal_submission_id: submission.id,
      docuseal_slug: submitter?.slug,
      document_type: 'loi',
      name: `Letter of Intent - ${companyName}`,
      status: 'sent',
      entity_type: 'location_partner',
      entity_id: partner.id,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      sent_at: new Date().toISOString(),
    })

    // Update partner record
    await supabase.from('location_partners').update({
      loi_status: 'sent',
      loi_sent_at: new Date().toISOString(),
      loi_docuseal_id: submission.id,
      pipeline_stage: 'loi_sent',
      pipeline_stage_changed_at: new Date().toISOString(),
    }).eq('id', partner.id)

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'location_partner',
      entity_id: partner.id,
      action: 'loi_sent',
      description: `LOI sent to ${recipientEmail} via DocuSeal`,
    })

    return NextResponse.json({
      success: true,
      message: 'LOI created and sent successfully',
      submission: {
        id: submission.id,
        status: submission.status,
        slug: submitter?.slug,
        signingUrl: submitter?.embed_src,
      }
    })

  } catch (error) {
    console.error('Failed to create LOI:', error)
    return NextResponse.json({ 
      error: 'Failed to create LOI',
      details: String(error)
    }, { status: 500 })
  }
}

// Create Deployment Contract
async function createDeploymentContract(partner: any, templateId?: string) {
  const supabase = getSupabaseAdmin()
  
  const recipientEmail = partner.contact_email || partner.contactEmail
  const recipientName = partner.contact_name || partner.contactFullName || partner.contact_full_name
  const companyName = partner.dba_name || partner.company_dba || partner.companyDBA || 
                      partner.company_legal_name || partner.companyLegalName

  if (!recipientEmail || !recipientName) {
    return NextResponse.json({ 
      error: 'Partner email and name required' 
    }, { status: 400 })
  }

  const contractTemplateId = templateId || process.env.DOCUSEAL_CONTRACT_TEMPLATE_ID

  if (!contractTemplateId) {
    return NextResponse.json({ 
      error: 'Contract template not configured. Set DOCUSEAL_CONTRACT_TEMPLATE_ID or pass templateId' 
    }, { status: 400 })
  }

  try {
    const submission = await docusealFetch('/submissions', {
      method: 'POST',
      body: JSON.stringify({
        template_id: parseInt(contractTemplateId),
        send_email: true,
        submitters: [
          {
            email: recipientEmail,
            name: recipientName,
            role: 'Location Partner',
            fields: [
              { name: 'partner_name', default_value: recipientName },
              { name: 'company_name', default_value: companyName },
              { name: 'company_legal_name', default_value: partner.company_legal_name || partner.companyLegalName || companyName },
              { name: 'contact_email', default_value: recipientEmail },
              { name: 'contact_phone', default_value: partner.contact_phone || partner.contactPhone || '' },
              { name: 'venue_count', default_value: String(partner.venues?.length || 1) },
              { name: 'device_count', default_value: String(partner.device_count || partner.deviceCount || partner.loi_device_count || 1) },
              { name: 'date', default_value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
              { name: 'contract_duration', default_value: '24 months' },
              { name: 'revenue_share', default_value: '50%' },
              { name: 'trial_earnings', default_value: partner.trial_earnings || partner.trialEarnings || '$0.00' },
            ],
          }
        ],
        message: {
          subject: `SkyYield Deployment Agreement - ${companyName}`,
          body: `Hi ${recipientName},\n\nCongratulations on completing your trial period! Please review and sign the Deployment Agreement to continue your partnership with SkyYield.\n\nBest regards,\nSkyYield Team`,
        },
        metadata: {
          partner_id: partner.id,
          document_type: 'deployment_contract',
          company_name: companyName,
        },
      }),
    })

    console.log(`📄 Created Deployment Contract: ${submission.id}`)

    const submitter = submission.submitters?.[0]
    await supabase.from('documents').insert({
      docuseal_submission_id: submission.id,
      docuseal_slug: submitter?.slug,
      document_type: 'contract',
      name: `Deployment Agreement - ${companyName}`,
      status: 'sent',
      entity_type: 'location_partner',
      entity_id: partner.id,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      sent_at: new Date().toISOString(),
    })

    await supabase.from('location_partners').update({
      contract_status: 'sent',
      contract_sent_at: new Date().toISOString(),
      contract_docuseal_id: submission.id,
      pipeline_stage: 'contract_sent',
      pipeline_stage_changed_at: new Date().toISOString(),
    }).eq('id', partner.id)

    await supabase.from('activity_log').insert({
      entity_type: 'location_partner',
      entity_id: partner.id,
      action: 'contract_sent',
      description: `Deployment contract sent to ${recipientEmail} via DocuSeal`,
    })

    return NextResponse.json({
      success: true,
      message: 'Deployment Contract created and sent successfully',
      submission: {
        id: submission.id,
        status: submission.status,
        slug: submitter?.slug,
        signingUrl: submitter?.embed_src,
      }
    })

  } catch (error) {
    console.error('Failed to create contract:', error)
    return NextResponse.json({ 
      error: 'Failed to create contract',
      details: String(error)
    }, { status: 500 })
  }
}

// Create Partner Agreement (for Referral, Channel, Relationship partners)
async function createPartnerAgreement(partner: any, partnerType: string, templateId?: string) {
  const supabase = getSupabaseAdmin()
  
  const recipientEmail = partner.contact_email || partner.email
  const recipientName = partner.contact_name || partner.name
  const companyName = partner.company_name || partner.company

  if (!recipientEmail || !recipientName) {
    return NextResponse.json({ 
      error: 'Partner email and name required' 
    }, { status: 400 })
  }

  // Get template based on partner type
  const templateEnvVar = `DOCUSEAL_${partnerType.toUpperCase()}_TEMPLATE_ID`
  const agreementTemplateId = templateId || process.env[templateEnvVar]

  if (!agreementTemplateId) {
    return NextResponse.json({ 
      error: `Template not configured for ${partnerType}. Set ${templateEnvVar} or pass templateId` 
    }, { status: 400 })
  }

  const partnerTypeLabels: Record<string, string> = {
    referral_partner: 'Referral Partner',
    channel_partner: 'Channel Partner',
    relationship_partner: 'Relationship Partner',
    contractor: 'Contractor',
  }

  try {
    const submission = await docusealFetch('/submissions', {
      method: 'POST',
      body: JSON.stringify({
        template_id: parseInt(agreementTemplateId),
        send_email: true,
        submitters: [
          {
            email: recipientEmail,
            name: recipientName,
            role: partnerTypeLabels[partnerType] || 'Partner',
            fields: [
              { name: 'partner_name', default_value: recipientName },
              { name: 'company_name', default_value: companyName || '' },
              { name: 'contact_email', default_value: recipientEmail },
              { name: 'contact_phone', default_value: partner.phone || '' },
              { name: 'date', default_value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
            ],
          }
        ],
        message: {
          subject: `SkyYield ${partnerTypeLabels[partnerType]} Agreement`,
          body: `Hi ${recipientName},\n\nPlease review and sign the ${partnerTypeLabels[partnerType]} Agreement to finalize your partnership with SkyYield.\n\nBest regards,\nSkyYield Team`,
        },
        metadata: {
          partner_id: partner.id,
          partner_type: partnerType,
          document_type: 'partner_agreement',
        },
      }),
    })

    console.log(`📄 Created ${partnerType} agreement: ${submission.id}`)

    // Store document
    const submitter = submission.submitters?.[0]
    await supabase.from('documents').insert({
      docuseal_submission_id: submission.id,
      docuseal_slug: submitter?.slug,
      document_type: 'partner_agreement',
      name: `${partnerTypeLabels[partnerType]} Agreement - ${recipientName}`,
      status: 'sent',
      entity_type: partnerType,
      entity_id: partner.id,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      sent_at: new Date().toISOString(),
    })

    // Update partner table
    const partnerTable = partnerType === 'referral_partner' ? 'referral_partners' :
                         partnerType === 'channel_partner' ? 'channel_partners' :
                         partnerType === 'relationship_partner' ? 'relationship_partners' :
                         'contractors'

    await supabase.from(partnerTable).update({
      agreement_status: 'sent',
      agreement_sent_at: new Date().toISOString(),
      agreement_docuseal_id: submission.id,
    }).eq('id', partner.id)

    return NextResponse.json({
      success: true,
      message: `${partnerTypeLabels[partnerType]} Agreement sent successfully`,
      submission: {
        id: submission.id,
        status: submission.status,
        slug: submitter?.slug,
        signingUrl: submitter?.embed_src,
      }
    })

  } catch (error) {
    console.error(`Failed to create ${partnerType} agreement:`, error)
    return NextResponse.json({ 
      error: `Failed to create ${partnerType} agreement`,
      details: String(error)
    }, { status: 500 })
  }
}

// Resend submission to signer
async function resendSubmission(submissionId: string) {
  if (!submissionId) {
    return NextResponse.json({ error: 'submissionId required' }, { status: 400 })
  }

  try {
    // Get submission to find submitters
    const submission = await docusealFetch(`/submissions/${submissionId}`)
    
    // Find pending submitters and resend
    const pendingSubmitters = submission.submitters?.filter(
      (s: any) => s.status === 'pending' || s.status === 'sent'
    )

    if (!pendingSubmitters?.length) {
      return NextResponse.json({ 
        error: 'No pending signers to notify',
        status: submission.status
      }, { status: 400 })
    }

    // DocuSeal doesn't have a direct resend - create new submission with same template
    // Or we can just return the signing URL for manual sending
    return NextResponse.json({
      success: true,
      message: 'Use the signing URLs to resend manually or embed',
      submitters: pendingSubmitters.map((s: any) => ({
        email: s.email,
        name: s.name,
        status: s.status,
        signingUrl: s.embed_src,
      }))
    })

  } catch (error) {
    console.error('Failed to resend:', error)
    return NextResponse.json({ 
      error: 'Failed to resend document',
      details: String(error)
    }, { status: 500 })
  }
}

// Download signed document
async function downloadDocument(submissionId: string) {
  if (!submissionId) {
    return NextResponse.json({ error: 'submissionId required' }, { status: 400 })
  }

  try {
    const submission = await docusealFetch(`/submissions/${submissionId}`)
    
    if (submission.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Document not yet completed',
        status: submission.status
      }, { status: 400 })
    }

    // Return download URLs for all documents
    const documents = submission.documents || []
    
    return NextResponse.json({
      success: true,
      documents: documents.map((doc: any) => ({
        name: doc.name,
        url: doc.url,
      })),
      auditLog: submission.audit_log_url,
    })

  } catch (error) {
    console.error('Failed to download:', error)
    return NextResponse.json({ 
      error: 'Failed to get download URL',
      details: String(error)
    }, { status: 500 })
  }
}

// PUT: Update template or submission
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, templateId, submissionId } = body

    switch (action) {
      case 'archive_template':
        await docusealFetch(`/templates/${templateId}/archive`, { method: 'PUT' })
        return NextResponse.json({ success: true, message: 'Template archived' })

      case 'void_submission':
        // DocuSeal doesn't have void - we just update our DB
        const supabase = getSupabaseAdmin()
        await supabase.from('documents')
          .update({ status: 'voided', voided_at: new Date().toISOString() })
          .eq('docuseal_submission_id', submissionId)
        return NextResponse.json({ success: true, message: 'Submission voided in database' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('DocuSeal PUT error:', error)
    return NextResponse.json({ 
      error: 'Failed to update',
      details: String(error)
    }, { status: 500 })
  }
}
