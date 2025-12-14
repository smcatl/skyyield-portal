// API Route: Calendly Webhook (Supabase)
// app/api/webhooks/calendly/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// Map Calendly event types to our fields
const CALENDLY_EVENT_MAP: Record<string, { stageField: string; scheduledField: string; completedField: string }> = {
  'intro': {
    stageField: 'intro_call_calendly_status',
    scheduledField: 'intro_call_scheduled_at',
    completedField: 'intro_call_completed_at',
  },
  'discovery': {
    stageField: 'intro_call_calendly_status',
    scheduledField: 'intro_call_scheduled_at',
    completedField: 'intro_call_completed_at',
  },
  'venue': {
    stageField: 'venue_form_calendly_status',
    scheduledField: 'venue_form_scheduled_at',
    completedField: 'venue_form_completed_at',
  },
  'install': {
    stageField: 'install_calendly_status',
    scheduledField: 'install_scheduled_at',
    completedField: 'install_completed_at',
  },
  'review': {
    stageField: 'trial_review_calendly_status',
    scheduledField: 'trial_review_scheduled_at',
    completedField: 'trial_review_completed_at',
  },
}

// Detect event type from Calendly event name
function detectEventType(eventName: string): string {
  const nameLower = eventName.toLowerCase()
  if (nameLower.includes('intro') || nameLower.includes('discovery')) return 'intro'
  if (nameLower.includes('venue')) return 'venue'
  if (nameLower.includes('install')) return 'install'
  if (nameLower.includes('review') || nameLower.includes('trial')) return 'review'
  return 'intro' // default
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    console.log('📅 Calendly Webhook Received:', JSON.stringify(body, null, 2))

    const { event, payload } = body

    // Log the webhook
    await supabase.from('activity_log').insert({
      entity_type: 'calendly_webhook',
      entity_id: payload?.uri || 'unknown',
      action: event,
      description: `Calendly event: ${event}`,
      details: body,
    })

    switch (event) {
      case 'invitee.created': {
        // New booking created
        const inviteeEmail = payload.email?.toLowerCase()
        const eventName = payload.event_type?.name || ''
        const scheduledTime = payload.scheduled_event?.start_time
        const eventType = detectEventType(eventName)
        const mapping = CALENDLY_EVENT_MAP[eventType]

        console.log(`🎉 New booking: ${eventName} for ${inviteeEmail} at ${scheduledTime}`)

        if (inviteeEmail && mapping) {
          // Try to find partner by email
          const { data: partner } = await supabase
            .from('location_partners')
            .select('id, pipeline_stage')
            .eq('contact_email', inviteeEmail)
            .single()

          if (partner) {
            // Update partner with Calendly status
            const updateData: Record<string, any> = {
              [mapping.stageField]: 'scheduled',
              [mapping.scheduledField]: scheduledTime,
            }

            // Update pipeline stage if appropriate
            if (eventType === 'intro' && partner.pipeline_stage === 'post_form_approval') {
              // Don't change stage, just track the booking
            } else if (eventType === 'install' && partner.pipeline_stage === 'loi_signed') {
              updateData.pipeline_stage = 'install_scheduled'
              updateData.install_status = 'scheduled'
            }

            await supabase.from('location_partners').update(updateData).eq('id', partner.id)

            // Log activity
            await supabase.from('activity_log').insert({
              entity_type: 'location_partner',
              entity_id: partner.id,
              action: 'calendly_booked',
              description: `Calendly ${eventType} call scheduled for ${new Date(scheduledTime).toLocaleString()}`,
            })

            console.log(`✅ Updated partner ${partner.id} with Calendly booking`)
          } else {
            console.log(`⚠️ No partner found with email ${inviteeEmail}`)
          }
        }
        break
      }

      case 'invitee.canceled': {
        const inviteeEmail = payload.email?.toLowerCase()
        const eventName = payload.event_type?.name || ''
        const eventType = detectEventType(eventName)
        const mapping = CALENDLY_EVENT_MAP[eventType]

        console.log(`😢 Booking canceled: ${eventName} for ${inviteeEmail}`)

        if (inviteeEmail && mapping) {
          const { data: partner } = await supabase
            .from('location_partners')
            .select('id')
            .eq('contact_email', inviteeEmail)
            .single()

          if (partner) {
            await supabase
              .from('location_partners')
              .update({
                [mapping.stageField]: 'cancelled',
              })
              .eq('id', partner.id)

            await supabase.from('activity_log').insert({
              entity_type: 'location_partner',
              entity_id: partner.id,
              action: 'calendly_cancelled',
              description: `Calendly ${eventType} call cancelled`,
            })
          }
        }
        break
      }

      default:
        console.log(`Unknown Calendly event: ${event}`)
    }

    // Store meeting record
    if (event === 'invitee.created' && payload.scheduled_event) {
      await supabase.from('meetings').insert({
        source: 'calendly',
        external_id: payload.uri,
        title: payload.event_type?.name,
        meeting_type: detectEventType(payload.event_type?.name || ''),
        status: 'scheduled',
        scheduled_start: payload.scheduled_event.start_time,
        scheduled_end: payload.scheduled_event.end_time,
        location_type: payload.scheduled_event.location?.type || 'video',
        location_url: payload.scheduled_event.location?.join_url,
      })
    }

    return NextResponse.json({ received: true, event })
  } catch (error) {
    console.error('Calendly webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'Calendly webhook endpoint active' })
}
