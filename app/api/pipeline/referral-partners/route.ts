// API Route: Referral Partners (Supabase)
// app/api/pipeline/referral-partners/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// GET: Fetch referral partners
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Single partner fetch with all associations
    if (id) {
      const { data: partner, error } = await supabase
        .from('referral_partners')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !partner) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      // Get all location partners they referred
      const { data: referrals } = await supabase
        .from('location_partners')
        .select('*, venues(*)')
        .eq('referred_by_partner_id', id)

      // Get all venues from their referrals
      const venueIds = referrals?.flatMap((r) => r.venues?.map((v: any) => v.id) || []) || []

      // Get all devices at those venues
      let devices: any[] = []
      if (venueIds.length > 0) {
        const { data } = await supabase.from('devices').select('*').in('venue_id', venueIds)
        devices = data || []
      }

      // Get data usage for their referrals
      let dataUsage: any[] = []
      if (venueIds.length > 0) {
        const { data } = await supabase
          .from('data_usage')
          .select('*')
          .in('venue_id', venueIds)
          .order('date', { ascending: false })
          .limit(100)
        dataUsage = data || []
      }

      // Get commissions
      const { data: commissions } = await supabase
        .from('commissions')
        .select('*')
        .eq('referral_partner_id', id)
        .order('period_start', { ascending: false })

      // Get activity log
      const { data: activityLog } = await supabase
        .from('activity_log')
        .select('*')
        .eq('entity_type', 'referral_partner')
        .eq('entity_id', id)
        .order('created_at', { ascending: false })
        .limit(50)

      return NextResponse.json({
        partner,
        referrals: referrals || [],
        devices,
        dataUsage,
        commissions: commissions || [],
        activityLog: activityLog || [],
      })
    }

    // List referral partners
    let query = supabase.from('referral_partners').select('*')

    const search = searchParams.get('search')?.toLowerCase()
    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,contact_name.ilike.%${search}%,contact_email.ilike.%${search}%,referral_code.ilike.%${search}%`
      )
    }

    const stage = searchParams.get('stage')
    if (stage) {
      query = query.eq('pipeline_stage', stage)
    }

    const { data: partners, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get referral counts
    const partnersWithCounts = await Promise.all(
      (partners || []).map(async (p) => {
        const { count: totalReferrals } = await supabase
          .from('location_partners')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by_partner_id', p.id)

        const { count: activeReferrals } = await supabase
          .from('location_partners')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by_partner_id', p.id)
          .in('pipeline_stage', ['trial_active', 'active'])

        return {
          ...p,
          total_referrals: totalReferrals || 0,
          active_referrals: activeReferrals || 0,
        }
      })
    )

    return NextResponse.json({ partners: partnersWithCounts })
  } catch (error) {
    console.error('GET /api/pipeline/referral-partners error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create referral partner
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const partnerData = {
      company_name: body.companyName || body.company_name,
      contact_name: body.contactName || body.contact_name,
      contact_email: body.contactEmail || body.contact_email,
      contact_phone: body.contactPhone || body.contact_phone,
      address_line_1: body.address1 || body.address_line_1,
      city: body.city,
      state: body.state,
      zip: body.zip,
      pipeline_stage: 'form_submitted',
      commission_type: body.commissionType || body.commission_type || 'per_referral',
      commission_per_referral: body.commissionPerReferral || body.commission_per_referral || 500,
      commission_percentage: body.commissionPercentage || body.commission_percentage || 0,
      tipalti_status: 'not_invited',
      notes: body.notes,
    }

    const { data: partner, error } = await supabase
      .from('referral_partners')
      .insert(partnerData)
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'referral_partner',
      entity_id: partner.id,
      action: 'created',
      description: `Referral partner "${partner.contact_name}" created with code ${partner.referral_code}`,
    })

    return NextResponse.json({ partner }, { status: 201 })
  } catch (error) {
    console.error('POST /api/pipeline/referral-partners error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update referral partner
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    // Map camelCase to snake_case
    const updateData: Record<string, any> = {}
    const fieldMap: Record<string, string> = {
      companyName: 'company_name',
      contactName: 'contact_name',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone',
      addressLine1: 'address_line_1',
      pipelineStage: 'pipeline_stage',
      commissionType: 'commission_type',
      commissionPerReferral: 'commission_per_referral',
      commissionPercentage: 'commission_percentage',
      tipaltiStatus: 'tipalti_status',
      tipaltiPayeeId: 'tipalti_payee_id',
    }

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key] || key
      updateData[dbField] = value
    }

    const { data: partner, error } = await supabase
      .from('referral_partners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ partner })
  } catch (error) {
    console.error('PUT /api/pipeline/referral-partners error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove referral partner
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase.from('referral_partners').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/pipeline/referral-partners error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
