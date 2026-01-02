// app/api/pipeline/partners/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Transform database fields to UI-expected format for location partners
const transformLocationPartner = (p: any) => ({
  ...p,
  partnerType: 'Location Partner',
  contactFullName: p.contact_full_name || `${p.contact_first_name || ''} ${p.contact_last_name || ''}`.trim() || p.contact_name,
  contactEmail: p.contact_email || p.email,
  contactPhone: p.contact_phone || p.phone,
  companyLegalName: p.company_legal_name || p.company_name,
  companyDBA: p.dba_name || p.company_dba,
  companyCity: p.city,
  companyState: p.state,
  stage: p.pipeline_stage || p.stage,
  initialReviewStatus: p.initial_review_status,
  postCallReviewStatus: p.post_call_review_status,
  discoveryCallStatus: p.discovery_call_status,
  trialDaysRemaining: p.trial_days_remaining,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
})

// Transform for referral/channel/relationship partners
const transformReferralPartner = (p: any, partnerType: string) => ({
  ...p,
  partnerType,
  contactFullName: p.contact_full_name || `${p.contact_first_name || ''} ${p.contact_last_name || ''}`.trim(),
  contactEmail: p.contact_email,
  contactPhone: p.contact_phone,
  companyLegalName: p.company_name,
  companyCity: p.city,
  companyState: p.state,
  stage: p.pipeline_stage,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
})

// Transform for contractors
const transformContractor = (p: any) => ({
  ...p,
  partnerType: 'Contractor',
  contactFullName: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
  contactEmail: p.email,
  contactPhone: p.phone,
  companyLegalName: p.company_name || p.full_name,
  companyCity: p.city,
  companyState: p.state,
  stage: p.pipeline_stage,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const partnerType = searchParams.get('partnerType')
  const stage = searchParams.get('stage')
  const status = searchParams.get('status')
  const includeVenues = searchParams.get('includeVenues') === 'true'

  try {
    // Single partner fetch by ID
    if (id) {
      // Try each table to find the partner
      let partner = null
      let entityType = ''

      const { data: lp } = await supabase.from('location_partners').select('*').eq('id', id).single()
      if (lp) {
        partner = transformLocationPartner(lp)
        entityType = 'location_partner'
      }

      if (!partner) {
        const { data: rp } = await supabase.from('referral_partners').select('*').eq('id', id).single()
        if (rp) {
          const type = rp.partner_type === 'channel' ? 'Channel Partner' : rp.partner_type === 'relationship' ? 'Relationship Partner' : 'Referral Partner'
          partner = transformReferralPartner(rp, type)
          entityType = 'referral_partner'
        }
      }

      if (!partner) {
        const { data: cp } = await supabase.from('channel_partners').select('*').eq('id', id).single()
        if (cp) {
          partner = transformReferralPartner(cp, 'Channel Partner')
          entityType = 'channel_partner'
        }
      }

      if (!partner) {
        const { data: relp } = await supabase.from('relationship_partners').select('*').eq('id', id).single()
        if (relp) {
          partner = transformReferralPartner(relp, 'Relationship Partner')
          entityType = 'relationship_partner'
        }
      }

      if (!partner) {
        const { data: con } = await supabase.from('contractors').select('*').eq('id', id).single()
        if (con) {
          partner = transformContractor(con)
          entityType = 'contractor'
        }
      }

      if (!partner) {
        return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
      }

      const response: any = { partner }
      if (includeVenues && entityType === 'location_partner') {
        const { data: venues } = await supabase.from('venues').select('*').eq('location_partner_id', id)
        response.venues = venues || []
      }
      const { data: activityLog } = await supabase
        .from('activity_log').select('*')
        .eq('entity_type', entityType).eq('entity_id', id)
        .order('created_at', { ascending: false }).limit(50)
      response.activityLog = activityLog || []
      return NextResponse.json(response)
    }

    // Fetch all partner types in parallel
    const [lpResult, rpResult, cpResult, relpResult, conResult] = await Promise.all([
      supabase.from('location_partners').select('*').neq('pipeline_stage', 'inactive').order('created_at', { ascending: false }).limit(500),
      supabase.from('referral_partners').select('*').neq('pipeline_stage', 'inactive').order('created_at', { ascending: false }).limit(100),
      supabase.from('channel_partners').select('*').neq('pipeline_stage', 'inactive').order('created_at', { ascending: false }).limit(100),
      supabase.from('relationship_partners').select('*').neq('pipeline_stage', 'inactive').order('created_at', { ascending: false }).limit(100),
      supabase.from('contractors').select('*').neq('pipeline_stage', 'inactive').order('created_at', { ascending: false }).limit(100),
    ])

    // Group location_partners by clerk_user_id
    const locationPartners = lpResult.data || []
    const groupedByClerk = new Map<string, any[]>()
    const ungroupedPartners: any[] = []

    for (const lp of locationPartners) {
      if (lp.clerk_user_id) {
        const existing = groupedByClerk.get(lp.clerk_user_id) || []
        existing.push(lp)
        groupedByClerk.set(lp.clerk_user_id, existing)
      } else {
        ungroupedPartners.push(lp)
      }
    }

    // Transform grouped location partners
    const groupedLocationPartners: any[] = []
    for (const [clerkUserId, partners] of groupedByClerk) {
      // Sort by created_at to get the earliest (primary) partner first
      partners.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      const primary = partners[0]
      const transformed = transformLocationPartner(primary)

      // Add all location_partner records as nested venues array
      transformed.venues = partners.map(p => transformLocationPartner(p))
      transformed.venueCount = partners.length
      transformed.clerkUserId = clerkUserId

      // Use the most advanced pipeline stage among all partners
      const stageOrder = ['application', 'initial_review', 'discovery_call', 'post_call_review', 'site_survey', 'agreement', 'payment_setup', 'trial_pending', 'trial_active', 'contract', 'active']
      let maxStageIndex = -1
      for (const p of partners) {
        const idx = stageOrder.indexOf(p.pipeline_stage)
        if (idx > maxStageIndex) {
          maxStageIndex = idx
          transformed.stage = p.pipeline_stage
        }
      }

      groupedLocationPartners.push(transformed)
    }

    // Transform ungrouped location partners (no clerk_user_id)
    const ungroupedTransformed = ungroupedPartners.map(p => {
      const transformed = transformLocationPartner(p)
      transformed.venues = [transformed]
      transformed.venueCount = 1
      return transformed
    })

    // Transform and combine all partners
    const allPartners = [
      ...groupedLocationPartners,
      ...ungroupedTransformed,
      ...(rpResult.data || []).map(p => {
        const type = p.partner_type === 'channel' ? 'Channel Partner' : p.partner_type === 'relationship' ? 'Relationship Partner' : 'Referral Partner'
        return transformReferralPartner(p, type)
      }),
      ...(cpResult.data || []).map(p => transformReferralPartner(p, 'Channel Partner')),
      ...(relpResult.data || []).map(p => transformReferralPartner(p, 'Relationship Partner')),
      ...(conResult.data || []).map(p => transformContractor(p)),
    ]

    // Apply filters
    let filtered = allPartners
    if (partnerType && partnerType !== 'all') {
      filtered = filtered.filter(p => p.partnerType === partnerType)
    }
    if (stage) {
      filtered = filtered.filter(p => p.stage === stage)
    }
    if (status) {
      filtered = filtered.filter(p => p.status === status)
    }

    // Sort by created date descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ partners: filtered })
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
    return NextResponse.json({ success: true, partner: transformLocationPartner(data) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper to find partner and its table
async function findPartnerTable(id: string): Promise<{ table: string; entityType: string; data: any } | null> {
  const { data: lp } = await supabase.from('location_partners').select('*').eq('id', id).single()
  if (lp) return { table: 'location_partners', entityType: 'location_partner', data: lp }

  const { data: rp } = await supabase.from('referral_partners').select('*').eq('id', id).single()
  if (rp) return { table: 'referral_partners', entityType: 'referral_partner', data: rp }

  const { data: cp } = await supabase.from('channel_partners').select('*').eq('id', id).single()
  if (cp) return { table: 'channel_partners', entityType: 'channel_partner', data: cp }

  const { data: relp } = await supabase.from('relationship_partners').select('*').eq('id', id).single()
  if (relp) return { table: 'relationship_partners', entityType: 'relationship_partner', data: relp }

  const { data: con } = await supabase.from('contractors').select('*').eq('id', id).single()
  if (con) return { table: 'contractors', entityType: 'contractor', data: con }

  return null
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Find which table this partner is in
    const partnerInfo = await findPartnerTable(id)
    if (!partnerInfo) return NextResponse.json({ error: 'Partner not found' }, { status: 404 })

    const { table, entityType, data: old } = partnerInfo
    const partnerName = old.company_legal_name || old.company_name || old.contact_full_name || old.full_name

    updates.updated_at = new Date().toISOString()

    // Handle stage updates - map from UI name to DB name if needed
    if (updates.stage) {
      updates.pipeline_stage = updates.stage
      delete updates.stage
    }

    if (updates.pipeline_stage && old?.pipeline_stage !== updates.pipeline_stage) {
      updates.stage_entered_at = new Date().toISOString()
    }

    const { data, error } = await supabase.from(table)
      .update(updates).eq('id', id).select().single()
    if (error) throw error

    if (updates.pipeline_stage && old?.pipeline_stage !== updates.pipeline_stage) {
      await supabase.from('activity_log').insert([{
        entity_type: entityType,
        entity_id: id,
        entity_name: partnerName,
        user_id: userId,
        action: 'stage_changed',
        action_category: 'pipeline',
        description: `Stage: ${old?.pipeline_stage} → ${updates.pipeline_stage}`,
      }])
    }

    // Transform based on partner type
    let transformed
    if (table === 'location_partners') {
      transformed = transformLocationPartner(data)
    } else if (table === 'contractors') {
      transformed = transformContractor(data)
    } else {
      const type = table === 'channel_partners' ? 'Channel Partner' : table === 'relationship_partners' ? 'Relationship Partner' : 'Referral Partner'
      transformed = transformReferralPartner(data, type)
    }

    return NextResponse.json({ success: true, partner: transformed })
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

    // Find which table this partner is in
    const partnerInfo = await findPartnerTable(id)
    if (!partnerInfo) return NextResponse.json({ error: 'Partner not found' }, { status: 404 })

    const { table, entityType, data: old } = partnerInfo
    const partnerName = old.company_legal_name || old.company_name || old.contact_full_name || old.full_name

    const { error } = await supabase.from(table)
      .update({ status: 'inactive', pipeline_stage: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: entityType,
      entity_id: id,
      entity_name: partnerName,
      user_id: userId,
      action: 'deactivated',
      action_category: 'pipeline',
    }])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
