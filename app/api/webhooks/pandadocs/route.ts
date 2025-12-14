// API Route: PandaDoc Webhook (Supabase)
// app/api/webhooks/pandadocs/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import crypto from 'crypto'

// Verify webhook signature from PandaDoc
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return signature === expectedSignature
}

// Detect document type from name
function detectDocumentType(name: string): 'loi' | 'contract' | 'other' {
  const nameLower = name.toLowerCase()
  if (nameLower.includes('letter of intent') || nameLower.includes('loi')) return 'loi'
  if (nameLower.includes('deployment') || nameLower.includes('contract')) return 'contract'
  return 'other'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.text()
    const signature = request.headers.get('x-pandadoc-signature') || ''
    const webhookSecret = process.env.PANDADOC_WEBHOOK_SECRET

    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      if (!verifySignature(body, signature, webhookSecret)) {
        console.error('❌ PandaDoc webhook signature verification failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const data = JSON.parse(body)
    console.log('📄 PandaDoc Webhook Received:', JSON.stringify(data, null, 2))

    const { event, data: eventData } = data

    // Log the webhook
    await supabase.from('activity_log').insert({
      entity_type: 'pandadoc_webhook',
      entity_id: eventData?.id || 'unknown',
      action: event,
      description: `PandaDoc event: ${event}`,
    })

    // Handle document state changes
    if (event === 'document_state_changed') {
      const { id: documentId, name, status, metadata } = eventData
      const partnerId = metadata?.partner_id
      const documentType = detectDocumentType(name)

      console.log(`📄 Document "${name}" (${documentId}) status: ${status}`)

      // Update or create document record
      await supabase.from('documents').upsert(
        {
          pandadoc_id: documentId,
          document_type: documentType,
          name,
          status: status.replace('document.', ''),
          entity_type: 'location_partner',
          entity_id: partnerId,
          ...(status === 'document.sent' && { sent_at: new Date().toISOString() }),
          ...(status === 'document.viewed' && { viewed_at: new Date().toISOString() }),
          ...(status === 'document.completed' && {
            signed_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          }),
        },
        { onConflict: 'pandadoc_id' }
      )

      // Update partner if we have partner_id
      if (partnerId) {
        const updateData: Record<string, any> = {}

        if (documentType === 'loi') {
          // LOI status updates
          switch (status) {
            case 'document.sent':
              updateData.loi_status = 'sent'
              updateData.loi_sent_at = new Date().toISOString()
              updateData.loi_pandadoc_id = documentId
              break
            case 'document.viewed':
              updateData.loi_status = 'viewed'
              updateData.loi_viewed_at = new Date().toISOString()
              break
            case 'document.completed':
              updateData.loi_status = 'signed'
              updateData.loi_signed_at = new Date().toISOString()
              updateData.pipeline_stage = 'loi_signed'
              updateData.pipeline_stage_changed_at = new Date().toISOString()

              // Extract device ownership from metadata if present
              if (metadata?.device_ownership) {
                updateData.loi_device_ownership = metadata.device_ownership
              }
              if (metadata?.device_count) {
                updateData.loi_device_count = parseInt(metadata.device_count)
              }
              if (metadata?.device_type) {
                updateData.loi_device_type = metadata.device_type
              }
              break
          }
        } else if (documentType === 'contract') {
          // Deployment contract status updates
          switch (status) {
            case 'document.sent':
              updateData.contract_status = 'sent'
              updateData.contract_sent_at = new Date().toISOString()
              updateData.contract_pandadoc_id = documentId
              updateData.pipeline_stage = 'contract_sent'
              break
            case 'document.viewed':
              updateData.contract_status = 'viewed'
              updateData.contract_viewed_at = new Date().toISOString()
              break
            case 'document.completed':
              updateData.contract_status = 'signed'
              updateData.contract_signed_at = new Date().toISOString()
              updateData.pipeline_stage = 'active'
              updateData.pipeline_stage_changed_at = new Date().toISOString()
              updateData.payments_blocked_until_contract = false
              break
          }
        }

        if (Object.keys(updateData).length > 0) {
          await supabase.from('location_partners').update(updateData).eq('id', partnerId)

          // Log activity
          await supabase.from('activity_log').insert({
            entity_type: 'location_partner',
            entity_id: partnerId,
            action: `document_${status.replace('document.', '')}`,
            description: `${documentType.toUpperCase()} ${status.replace('document.', '')}: "${name}"`,
          })

          // If LOI signed with SkyYield ownership, create purchase request
          if (
            documentType === 'loi' &&
            status === 'document.completed' &&
            updateData.loi_device_ownership === 'skyyield_owned' &&
            updateData.loi_device_count > 0
          ) {
            await supabase.from('device_purchase_requests').insert({
              source: 'loi_auto',
              source_document_id: documentId,
              location_partner_id: partnerId,
              product_name: updateData.loi_device_type || 'TBD',
              quantity: updateData.loi_device_count,
              ownership: 'skyyield_owned',
              status: 'auto_created',
              notes: `Auto-created from LOI signature (${name})`,
            })

            console.log(`📦 Auto-created purchase request for ${updateData.loi_device_count} devices`)
          }

          // Send appropriate emails
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

          if (documentType === 'loi' && status === 'document.completed') {
            // Send LOI signed email with Calendly for install
            await fetch(`${baseUrl}/api/pipeline/email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                templateId: 'loiSigned',
                partnerId,
              }),
            })
          }

          if (documentType === 'contract' && status === 'document.completed') {
            // Send welcome to active email
            await fetch(`${baseUrl}/api/pipeline/email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                templateId: 'welcomeActive',
                partnerId,
              }),
            })
          }

          console.log(`✅ Updated partner ${partnerId} for ${documentType} ${status}`)
        }
      } else {
        console.log('⚠️ No partner_id in document metadata')
      }
    }

    // Handle recipient completed
    if (event === 'recipient_completed') {
      const { document_id, recipient } = eventData
      console.log(`✍️ Recipient ${recipient?.email} signed document ${document_id}`)

      // Update document with signer info
      await supabase
        .from('documents')
        .update({
          recipient_email: recipient?.email,
          recipient_name: recipient?.first_name
            ? `${recipient.first_name} ${recipient.last_name || ''}`
            : undefined,
        })
        .eq('pandadoc_id', document_id)
    }

    return NextResponse.json({ received: true, event })
  } catch (error) {
    console.error('PandaDoc webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    status: 'PandaDoc webhook endpoint active',
    timestamp: new Date().toISOString(),
  })
}
