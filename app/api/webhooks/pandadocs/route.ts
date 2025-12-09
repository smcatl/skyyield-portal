// API Route: PandaDoc Webhook
// app/api/webhooks/pandadoc/route.ts

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Verify webhook signature from PandaDoc
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
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

    // Handle different document events
    switch (event) {
      case 'document_state_changed': {
        const { id: documentId, name, status, metadata } = eventData
        const partnerId = metadata?.partner_id

        console.log(`📄 Document "${name}" (${documentId}) status: ${status}`)

        if (partnerId) {
          // Update partner based on document status
          switch (status) {
            case 'document.viewed':
              console.log(`👁️ Partner ${partnerId} viewed document`)
              // Log activity: "Partner viewed LOI"
              await logPartnerActivity(partnerId, 'document_viewed', { documentId, name })
              break

            case 'document.completed':
              console.log(`✅ Partner ${partnerId} signed document`)
              // Update stage based on document type
              if (name.toLowerCase().includes('letter of intent') || name.toLowerCase().includes('loi')) {
                await updatePartnerStage(partnerId, 'loi_signed', { documentId, name })
                // Trigger loiSigned email
                await sendPartnerEmail(partnerId, 'loiSigned')
              } else if (name.toLowerCase().includes('deployment') || name.toLowerCase().includes('contract')) {
                await updatePartnerStage(partnerId, 'active', { documentId, name })
                // Trigger welcomeActive email
                await sendPartnerEmail(partnerId, 'welcomeActive')
              }
              break

            case 'document.sent':
              console.log(`📤 Document sent to partner ${partnerId}`)
              await logPartnerActivity(partnerId, 'document_sent', { documentId, name })
              break

            case 'document.draft':
              console.log(`📝 Document ${documentId} is in draft`)
              break

            case 'document.voided':
              console.log(`🚫 Document ${documentId} was voided`)
              await logPartnerActivity(partnerId, 'document_voided', { documentId, name })
              break

            default:
              console.log(`📄 Document status: ${status}`)
          }
        } else {
          console.log('⚠️ No partner_id in document metadata')
        }
        break
      }

      case 'recipient_completed': {
        const { document_id, recipient } = eventData
        console.log(`✍️ Recipient ${recipient.email} signed document ${document_id}`)
        break
      }

      default:
        console.log(`📄 Unknown PandaDoc event: ${event}`)
    }

    return NextResponse.json({ received: true, event })

  } catch (error) {
    console.error('PandaDoc webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Helper: Log activity to partner record
async function logPartnerActivity(partnerId: string, action: string, details: any) {
  try {
    // TODO: Replace with your actual database call
    console.log(`📝 Logging activity for partner ${partnerId}: ${action}`, details)
    
    // Example: Update partner in database
    // await db.partnerActivity.create({
    //   data: { partnerId, action, details: JSON.stringify(details), timestamp: new Date() }
    // })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

// Helper: Update partner stage
async function updatePartnerStage(partnerId: string, newStage: string, details: any) {
  try {
    console.log(`🔄 Updating partner ${partnerId} to stage: ${newStage}`)
    
    // Call internal API to update partner
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await fetch(`${baseUrl}/api/pipeline/partners/${partnerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        stage: newStage,
        activity: {
          action: 'document_signed',
          details
        }
      })
    })
  } catch (error) {
    console.error('Failed to update partner stage:', error)
  }
}

// Helper: Send email to partner
async function sendPartnerEmail(partnerId: string, templateId: string) {
  try {
    console.log(`📧 Sending ${templateId} email to partner ${partnerId}`)
    
    // Get partner data first, then send email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Fetch partner
    const partnerRes = await fetch(`${baseUrl}/api/pipeline/partners/${partnerId}`)
    if (!partnerRes.ok) {
      console.error('Failed to fetch partner for email')
      return
    }
    const { partner } = await partnerRes.json()
    
    // Send email
    await fetch(`${baseUrl}/api/pipeline/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, partner })
    })
  } catch (error) {
    console.error('Failed to send partner email:', error)
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({ 
    status: 'PandaDoc webhook endpoint active',
    timestamp: new Date().toISOString()
  })
}