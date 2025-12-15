// API Route: DocuSeal Webhook Handler
// app/api/webhooks/docuseal/route.ts
// Receives webhook events from DocuSeal when documents are viewed/signed

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import crypto from 'crypto'

// Verify webhook signature (if using signed webhooks)
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return true // Skip if not configured
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return signature === expectedSignature || signature === `sha256=${expectedSignature}`
}

// DocuSeal webhook events:
// - form.viewed - Someone opened the signing form
// - form.started - Someone started filling the form  
// - form.completed - Someone completed and signed
// - submission.completed - All parties have signed (multi-signer)
// - submission.archived - Submission was archived

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.text()
    const signature = request.headers.get('x-docuseal-signature') || ''
    const webhookSecret = process.env.DOCUSEAL_WEBHOOK_SECRET

    // Verify signature if configured
    if (webhookSecret && signature) {
      if (!verifySignature(body, signature, webhookSecret)) {
        console.error('❌ DocuSeal webhook signature verification failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const data = JSON.parse(body)
    console.log('📄 DocuSeal Webhook Received:', JSON.stringify(data, null, 2))

    const { event_type, timestamp, data: eventData } = data

    // Log the webhook
    await supabase.from('activity_log').insert({
      entity_type: 'docuseal_webhook',
      entity_id: eventData?.submission_id?.toString() || eventData?.id?.toString() || 'unknown',
      action: event_type,
      description: `DocuSeal event: ${event_type}`,
      metadata: { raw: data },
    })

    // Extract common fields
    const submissionId = eventData?.submission_id || eventData?.id
    const submitterEmail = eventData?.email || eventData?.submitter?.email
    const submitterName = eventData?.name || eventData?.submitter?.name
    
    // Get metadata from submission (contains partner_id, document_type)
    const metadata = eventData?.metadata || eventData?.submission?.metadata || {}
    const partnerId = metadata?.partner_id
    const documentType = metadata?.document_type || detectDocumentType(eventData?.submission?.name || '')
    const partnerType = metadata?.partner_type || 'location_partner'

    // Handle different events
    switch (event_type) {
      case 'form.viewed':
        await handleFormViewed(supabase, submissionId, partnerId, documentType, partnerType)
        break

      case 'form.started':
        await handleFormStarted(supabase, submissionId, partnerId, documentType)
        break

      case 'form.completed':
        await handleFormCompleted(supabase, submissionId, partnerId, documentType, partnerType, eventData)
        break

      case 'submission.completed':
        await handleSubmissionCompleted(supabase, submissionId, partnerId, documentType, partnerType, eventData)
        break

      case 'submission.archived':
        await handleSubmissionArchived(supabase, submissionId)
        break

      default:
        console.log(`⚠️ Unhandled DocuSeal event: ${event_type}`)
    }

    return NextResponse.json({ received: true, event: event_type })

  } catch (error) {
    console.error('DocuSeal webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Detect document type from name
function detectDocumentType(name: string): 'loi' | 'contract' | 'partner_agreement' | 'other' {
  const nameLower = name.toLowerCase()
  if (nameLower.includes('letter of intent') || nameLower.includes('loi')) return 'loi'
  if (nameLower.includes('deployment') || nameLower.includes('contract')) return 'contract'
  if (nameLower.includes('partner') || nameLower.includes('agreement')) return 'partner_agreement'
  return 'other'
}

// Handle form.viewed event
async function handleFormViewed(
  supabase: any, 
  submissionId: number, 
  partnerId: string | undefined,
  documentType: string,
  partnerType: string
) {
  console.log(`👁️ Document ${submissionId} viewed`)

  // Update document record
  await supabase.from('documents')
    .update({ 
      status: 'viewed',
      viewed_at: new Date().toISOString(),
    })
    .eq('docuseal_submission_id', submissionId)

  // Update partner record based on document type
  if (partnerId) {
    if (documentType === 'loi') {
      await supabase.from('location_partners').update({
        loi_status: 'viewed',
        loi_viewed_at: new Date().toISOString(),
      }).eq('id', partnerId)
    } else if (documentType === 'contract') {
      await supabase.from('location_partners').update({
        contract_status: 'viewed',
        contract_viewed_at: new Date().toISOString(),
      }).eq('id', partnerId)
    } else if (documentType === 'partner_agreement') {
      const table = getPartnerTable(partnerType)
      await supabase.from(table).update({
        agreement_status: 'viewed',
        agreement_viewed_at: new Date().toISOString(),
      }).eq('id', partnerId)
    }

    await supabase.from('activity_log').insert({
      entity_type: partnerType,
      entity_id: partnerId,
      action: 'document_viewed',
      description: `${documentType.toUpperCase()} viewed`,
    })
  }
}

// Handle form.started event  
async function handleFormStarted(
  supabase: any,
  submissionId: number,
  partnerId: string | undefined,
  documentType: string
) {
  console.log(`✏️ Document ${submissionId} started`)

  await supabase.from('documents')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .eq('docuseal_submission_id', submissionId)
}

// Handle form.completed event (single signer completed)
async function handleFormCompleted(
  supabase: any,
  submissionId: number,
  partnerId: string | undefined,
  documentType: string,
  partnerType: string,
  eventData: any
) {
  console.log(`✅ Form completed for submission ${submissionId}`)

  // For single-signer documents, form.completed = document signed
  // For multi-signer, we wait for submission.completed
  
  // Check if this is the only signer (most SkyYield docs are single-signer)
  const isSingleSigner = !eventData?.submission?.submitters || 
                         eventData.submission.submitters.length === 1

  if (isSingleSigner) {
    await handleDocumentSigned(supabase, submissionId, partnerId, documentType, partnerType, eventData)
  } else {
    // Multi-signer: just update that this signer completed
    await supabase.from('documents')
      .update({
        status: 'partially_signed',
        recipient_signed_at: new Date().toISOString(),
      })
      .eq('docuseal_submission_id', submissionId)
  }
}

// Handle submission.completed event (all signers done)
async function handleSubmissionCompleted(
  supabase: any,
  submissionId: number,
  partnerId: string | undefined,
  documentType: string,
  partnerType: string,
  eventData: any
) {
  console.log(`🎉 All signers completed for submission ${submissionId}`)
  await handleDocumentSigned(supabase, submissionId, partnerId, documentType, partnerType, eventData)
}

// Common handler for when document is fully signed
async function handleDocumentSigned(
  supabase: any,
  submissionId: number,
  partnerId: string | undefined,
  documentType: string,
  partnerType: string,
  eventData: any
) {
  const now = new Date().toISOString()

  // Update document record
  await supabase.from('documents')
    .update({
      status: 'signed',
      signed_at: now,
      completed_at: now,
      download_url: eventData?.documents?.[0]?.url,
    })
    .eq('docuseal_submission_id', submissionId)

  if (!partnerId) {
    console.log('⚠️ No partner_id in webhook metadata')
    return
  }

  // Extract any form field values from the signed document
  const formValues = eventData?.values || eventData?.fields || {}
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Handle based on document type
  if (documentType === 'loi') {
    // LOI signed - update partner, possibly create purchase request
    const updateData: Record<string, any> = {
      loi_status: 'signed',
      loi_signed_at: now,
      pipeline_stage: 'loi_signed',
      pipeline_stage_changed_at: now,
    }

    // Check if device ownership was specified in form
    if (formValues.device_ownership) {
      updateData.loi_device_ownership = formValues.device_ownership
    }
    if (formValues.device_count) {
      updateData.loi_device_count = parseInt(formValues.device_count)
    }

    await supabase.from('location_partners').update(updateData).eq('id', partnerId)

    // If SkyYield owns devices, auto-create purchase request
    if (updateData.loi_device_ownership === 'skyyield_owned' && updateData.loi_device_count > 0) {
      await supabase.from('device_purchase_requests').insert({
        source: 'loi_auto',
        source_document_id: submissionId.toString(),
        location_partner_id: partnerId,
        product_name: formValues.device_type || 'TBD',
        quantity: updateData.loi_device_count,
        ownership: 'skyyield_owned',
        status: 'auto_created',
        notes: 'Auto-created from LOI signature',
      })
      console.log(`📦 Auto-created purchase request for ${updateData.loi_device_count} devices`)
    }

    // Send LOI signed email with Calendly for install scheduling
    await fetch(`${baseUrl}/api/pipeline/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'loiSigned',
        partnerId,
      }),
    }).catch(e => console.error('Failed to send LOI signed email:', e))

    await supabase.from('activity_log').insert({
      entity_type: 'location_partner',
      entity_id: partnerId,
      action: 'loi_signed',
      description: 'LOI signed via DocuSeal',
    })

  } else if (documentType === 'contract') {
    // Deployment contract signed - partner is now active!
    await supabase.from('location_partners').update({
      contract_status: 'signed',
      contract_signed_at: now,
      pipeline_stage: 'active',
      pipeline_stage_changed_at: now,
      payments_blocked_until_contract: false,
      status: 'active',
    }).eq('id', partnerId)

    // Send welcome to active email
    await fetch(`${baseUrl}/api/pipeline/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'welcomeActive',
        partnerId,
      }),
    }).catch(e => console.error('Failed to send welcome email:', e))

    await supabase.from('activity_log').insert({
      entity_type: 'location_partner',
      entity_id: partnerId,
      action: 'contract_signed',
      description: 'Deployment contract signed - Partner is now ACTIVE',
    })

  } else if (documentType === 'partner_agreement') {
    // Partner agreement signed (Referral, Channel, Relationship)
    const table = getPartnerTable(partnerType)
    
    await supabase.from(table).update({
      agreement_status: 'signed',
      agreement_signed_at: now,
      status: 'approved',
      pipeline_stage: 'active',
    }).eq('id', partnerId)

    // Send portal invite if not already sent
    await fetch(`${baseUrl}/api/pipeline/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerId,
        partnerType,
      }),
    }).catch(e => console.error('Failed to send portal invite:', e))

    await supabase.from('activity_log').insert({
      entity_type: partnerType,
      entity_id: partnerId,
      action: 'agreement_signed',
      description: `${partnerType} agreement signed - Portal invite sent`,
    })
  }

  console.log(`✅ Updated ${partnerType} ${partnerId} for ${documentType} signed`)
}

// Handle submission.archived event
async function handleSubmissionArchived(supabase: any, submissionId: number) {
  console.log(`🗄️ Submission ${submissionId} archived`)
  
  await supabase.from('documents')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    .eq('docuseal_submission_id', submissionId)
}

// Get partner table name from partner type
function getPartnerTable(partnerType: string): string {
  const tables: Record<string, string> = {
    location_partner: 'location_partners',
    referral_partner: 'referral_partners',
    channel_partner: 'channel_partners',
    relationship_partner: 'relationship_partners',
    contractor: 'contractors',
  }
  return tables[partnerType] || 'location_partners'
}

// GET endpoint for webhook verification/health check
export async function GET() {
  return NextResponse.json({
    status: 'DocuSeal webhook endpoint active',
    timestamp: new Date().toISOString(),
    events: [
      'form.viewed',
      'form.started', 
      'form.completed',
      'submission.completed',
      'submission.archived',
    ],
  })
}
