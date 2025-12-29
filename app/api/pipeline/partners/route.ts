// app/api/pipeline/partners/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Transform database fields to UI-expected format
const transformPartner = (p: any) => ({
  ...p,
  // Map snake_case to camelCase for UI
  contactFullName: p.contact_full_name || `${p.contact_first_name || ''} ${p.contact_last_name || ''}`.trim() || p.contact_name,
  contactEmail: p.contact_email || p.email,
  contactPhone: p.contact_phone || p.phone,
  companyLegalName: p.company_legal_name || p.company_name,
  companyDBA: p.dba_name || p.company_dba,
  companyCity: p.city,
  companyState: p.state,
  // Stage mapping (handle different stage naming conventions)
  stage: p.pipeline_stage || p.stage,
  initialReviewStatus: p.initial_review_status,
  postCallReviewStatus: p.post_call_review_status,
  discoveryCallStatus: p.discovery_call_status,
  trialDaysRemaining: p.trial_days_remaining,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const stage = searchParams.get('stage')
  const status = searchParams.get('status')
  const includeVenues = searchParams.get('includeVenues') === 'true'

  try {
    if (id) {
      const { data: partner, error } = await supabase
        .from('location_partners').select('*').eq('id', id).single()
      if (error) throw error

      const response: any = { partner: transformPartner(partner) }
      if (includeVenues) {
        const { data: venues } = await supabase
          .from('venues').select('*').eq('location_partner_id', id)
        response.venues = venues || []
      }
      const { data: activityLog } = await supabase
        .from('activity_log').select('*')
        .eq('entity_type', 'location_partner').eq('entity_id', id)
        .order('created_at', { ascending: false }).limit(50)
      response.activityLog = activityLog || []
      return NextResponse.json(response)
    }

    let query = supabase.from('location_partners').select('*')
      .order('created_at', { ascending: false }).limit(100)
    if (stage) query = query.eq('pipeline_stage', stage)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ partners: (data || []).map(transformPartner) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const year = new Date().getFullYear()
    const { count } = await supabase.from('location_partners')
      .select('*', { count: 'exact', head: true })
    const partnerId = `LP-${year}-${((count || 0) + 1).toString().padStart(4, '0')}`

    const { data, error } = await supabase.from('location_partners').insert([{
      partner_id: partnerId,
      contact_name: body.contact_name || body.contactFullName,
      contact_first_name: body.contact_first_name,
      contact_last_name: body.contact_last_name,
      contact_email: body.email || body.contactEmail,
      contact_phone: body.phone || body.contactPhone,
      company_legal_name: body.company_name || body.companyLegalName,
      company_type: body.company_type,
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      referred_by_partner_id: body.referred_by_partner_id,
      referral_source: body.referral_source || 'website',
      pipeline_stage: 'application',
      status: 'pending',
      initial_review_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select().single()
    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'location_partner',
      entity_id: data.id,
      entity_name: data.company_legal_name,
      action: 'application_submitted',
      action_category: 'pipeline',
      description: `Application submitted by ${data.contact_first_name} ${data.contact_last_name}`,
    }])
    return NextResponse.json({ success: true, partner: transformPartner(data) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { data: old } = await supabase.from('location_partners')
      .select('pipeline_stage, status, company_legal_name').eq('id', id).single()

    updates.updated_at = new Date().toISOString()
    
    // Handle stage updates - map from UI name to DB name if needed
    if (updates.stage) {
      updates.pipeline_stage = updates.stage
      delete updates.stage
    }
    
    if (updates.pipeline_stage && old?.pipeline_stage !== updates.pipeline_stage) {
      updates.stage_entered_at = new Date().toISOString()
    }

    const { data, error } = await supabase.from('location_partners')
      .update(updates).eq('id', id).select().single()
    if (error) throw error

    if (updates.pipeline_stage && old?.pipeline_stage !== updates.pipeline_stage) {
      await supabase.from('activity_log').insert([{
        entity_type: 'location_partner',
        entity_id: id,
        entity_name: old?.company_legal_name,
        user_id: userId,
        action: 'stage_changed',
        action_category: 'pipeline',
        description: `Stage: ${old?.pipeline_stage} → ${updates.pipeline_stage}`,
      }])
    }
    return NextResponse.json({ success: true, partner: transformPartner(data) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { data, error } = await supabase.from('location_partners')
      .update({ status: 'inactive', pipeline_stage: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'location_partner',
      entity_id: id,
      entity_name: data.company_legal_name,
      user_id: userId,
      action: 'deactivated',
      action_category: 'pipeline',
    }])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
