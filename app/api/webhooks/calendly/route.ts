// app/api/webhooks/calendly/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WEBHOOK_SIGNING_KEY = process.env.CALENDLY_WEBHOOK_SIGNING_KEY

// Verify Calendly webhook signature
function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SIGNING_KEY) {
    console.warn('No webhook signing key configured')
    return true // Allow in development
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SIGNING_KEY)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('calendly-webhook-signature') || ''
    
    // Verify signature in production
    if (process.env.NODE_ENV === 'production' && WEBHOOK_SIGNING_KEY) {
      // Calendly signature format: t=timestamp,v1=signature
      const signatureParts = signature.split(',')
      const v1Signature = signatureParts.find(p => p.startsWith('v1='))?.replace('v1=', '')
      
      if (!v1Signature || !verifySignature(rawBody, v1Signature)) {
        console.error('Invalid Calendly webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const body = JSON.parse(rawBody)
    const { event, payload } = body
    
    const inviteeEmail = payload?.invitee?.email?.toLowerCase()
    const inviteeName = payload?.invitee?.name
    const scheduledTime = payload?.event?.start_time
    const eventName = payload?.event_type?.name
    const calendlyEventUri = payload?.event?.uri
    
    console.log(`Calendly webhook: ${event} for ${inviteeEmail}`)

    if (!inviteeEmail) {
      return NextResponse.json({ message: 'No invitee email' })
    }

    // Try to find partner by email
    const { data: partner } = await supabase
      .from('location_partners')
      .select('id, stage, company_name, partner_id')
      .eq('email', inviteeEmail)
      .single()

    if (!partner) {
      // Also check referral partners
      const { data: referralPartner } = await supabase
        .from('referral_partners')
        .select('id, pipeline_stage, company_name, contact_full_name, partner_id')
        .eq('contact_email', inviteeEmail)
        .single()

      if (referralPartner) {
        // Handle referral partner scheduling
        await supabase.from('referral_partners')
          .update({
            call_status: event === 'invitee.created' ? 'scheduled' : 'canceled',
            call_scheduled_at: scheduledTime,
            updated_at: new Date().toISOString(),
          })
          .eq('id', referralPartner.id)

        await supabase.from('activity_log').insert([{
          entity_type: 'referral_partner',
          entity_id: referralPartner.id,
          entity_name: referralPartner.company_name || referralPartner.contact_full_name,
          action: event === 'invitee.created' ? 'call_scheduled' : 'call_canceled',
          action_category: 'calendly',
          new_values: { scheduled_time: scheduledTime, event_name: eventName },
        }])

        return NextResponse.json({ success: true, partnerId: referralPartner.partner_id })
      }

      console.log(`Partner not found for email: ${inviteeEmail}`)
      return NextResponse.json({ message: 'Partner not found' })
    }

    const updates: Record<string, any> = { 
      updated_at: new Date().toISOString(),
      calendly_event_uri: calendlyEventUri,
    }

    if (event === 'invitee.created') {
      // Determine call type based on current stage
      if (['application', 'initial_review'].includes(partner.stage)) {
        // Discovery call
        updates.discovery_call_status = 'scheduled'
        updates.discovery_call_scheduled_at = scheduledTime
        updates.stage = 'discovery_scheduled'
        updates.stage_entered_at = new Date().toISOString()
      } else if (['loi_signed', 'venues_setup'].includes(partner.stage)) {
        // Installation planning call
        updates.install_call_status = 'scheduled'
        updates.install_call_scheduled_at = scheduledTime
        updates.stage = 'install_scheduled'
        updates.stage_entered_at = new Date().toISOString()
      }
    } else if (event === 'invitee.canceled') {
      if (['application', 'initial_review', 'discovery_scheduled'].includes(partner.stage)) {
        updates.discovery_call_status = 'canceled'
        // Revert stage
        updates.stage = 'initial_review'
        updates.stage_entered_at = new Date().toISOString()
      } else {
        updates.install_call_status = 'canceled'
      }
    }

    await supabase.from('location_partners').update(updates).eq('id', partner.id)

    await supabase.from('activity_log').insert([{
      entity_type: 'location_partner',
      entity_id: partner.id,
      entity_name: partner.company_name,
      action: event === 'invitee.created' ? 'call_scheduled' : 'call_canceled',
      action_category: 'calendly',
      description: `${eventName || 'Call'} ${event === 'invitee.created' ? 'scheduled' : 'canceled'}`,
      new_values: { 
        scheduled_time: scheduledTime, 
        stage: updates.stage,
        event_name: eventName,
        invitee_name: inviteeName,
      },
    }])

    return NextResponse.json({ success: true, partnerId: partner.partner_id })
  } catch (error: any) {
    console.error('Calendly webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ 
    status: 'Calendly webhook active',
    signing_key_configured: !!WEBHOOK_SIGNING_KEY,
  })
}
