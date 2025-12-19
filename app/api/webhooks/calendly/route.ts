// app/api/webhooks/calendly/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, payload } = body
    const inviteeEmail = payload?.invitee?.email?.toLowerCase()
    const scheduledTime = payload?.event?.start_time

    if (!inviteeEmail) {
      return NextResponse.json({ message: 'No invitee email' })
    }

    const { data: partner } = await supabase
      .from('location_partners')
      .select('id, stage, company_name')
      .eq('email', inviteeEmail)
      .single()

    if (!partner) {
      return NextResponse.json({ message: 'Partner not found' })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (event === 'invitee.created') {
      if (['application', 'initial_review'].includes(partner.stage)) {
        updates.discovery_call_status = 'scheduled'
        updates.discovery_call_scheduled_at = scheduledTime
        updates.stage = 'discovery_scheduled'
        updates.stage_entered_at = new Date().toISOString()
      } else if (partner.stage === 'loi_signed') {
        updates.install_call_status = 'scheduled'
        updates.install_call_scheduled_at = scheduledTime
        updates.stage = 'install_scheduled'
        updates.stage_entered_at = new Date().toISOString()
      }
    } else if (event === 'invitee.canceled') {
      updates.discovery_call_status = 'canceled'
    }

    await supabase.from('location_partners').update(updates).eq('id', partner.id)

    await supabase.from('activity_log').insert([{
      entity_type: 'location_partner',
      entity_id: partner.id,
      entity_name: partner.company_name,
      action: event === 'invitee.created' ? 'call_scheduled' : 'call_canceled',
      action_category: 'calendly',
      new_values: { scheduled_time: scheduledTime, stage: updates.stage },
    }])

    return NextResponse.json({ success: true, partnerId: partner.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
