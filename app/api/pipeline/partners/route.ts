// API Route: Pipeline Partners (Supabase)
// app/api/pipeline/partners/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// Helper: Calculate trial days remaining
function calculateTrialDays(endDate?: string): number | undefined {
  if (!endDate) return undefined
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

// Helper: Log activity
async function logActivity(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  entityId: string,
  action: string,
  description: string,
  userId?: string
) {
  await supabase.from('activity_log').insert({
    entity_type: 'location_partner',
    entity_id: entityId,
    action,
    description,
    user_id: userId,
  })
}

// Helper: Send email via internal API
async function sendEmail(templateId: string, partner: any, extraData?: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await fetch(`${baseUrl}/api/pipeline/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, partner, extraData }),
    })
    console.log(`✉️ Sent ${templateId} to ${partner.contact_email}`)
  } catch (e) {
    console.error('Email error:', e)
  }
}

// Helper: Handle stage transitions
async function handleStageTransition(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  partner: any,
  prevStage: string,
  newStage: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Application approved → Send intro call Calendly
  if (prevStage === 'initial_review' && newStage === 'post_form_approval') {
    await sendEmail('applicationApproved', partner)
  }

  // Application denied
  if (prevStage === 'initial_review' && newStage === 'declined') {
    await sendEmail('applicationDenied', partner)
  }

  // Post-call approved → Send venue setup form
  if (prevStage === 'post_form_approval' && newStage === 'venue_device_setup') {
    await sendEmail('postCallApproved', partner, {
      venuesFormUrl: `${baseUrl}/pipeline/venues/${partner.id}`,
    })
  }

  // LOI signed → Send install scheduling Calendly
  if (newStage === 'loi_signed' && prevStage !== 'loi_signed') {
    await sendEmail('loiSigned', partner)

    // Auto-create device purchase request if SkyYield owns devices
    if (partner.loi_device_ownership === 'skyyield_owned' && partner.loi_device_count > 0) {
      await supabase.from('device_purchase_requests').insert({
        source: 'loi_auto',
        location_partner_id: partner.id,
        product_name: partner.loi_device_type || 'TBD',
        quantity: partner.loi_device_count,
        ownership: 'skyyield_owned',
        status: 'auto_created',
        notes: `Auto-created from LOI signature`,
      })
    }
  }

  // Trial started → Send portal + Tipalti invites
  if (newStage === 'trial_active' && prevStage !== 'trial_active') {
    await sendEmail('trialStarted', partner, { trialEndDate: partner.trial_end_date })

    // Update Tipalti status
    await supabase
      .from('location_partners')
      .update({
        tipalti_status: 'invite_sent',
        tipalti_invite_sent_at: new Date().toISOString(),
        portal_invite_sent_at: new Date().toISOString(),
      })
      .eq('id', partner.id)

    await sendEmail('tipaltiInvite', partner)
    await sendEmail('portalInvite', partner)
  }

  // Trial ending
  if (newStage === 'trial_ending' && prevStage !== 'trial_ending') {
    await sendEmail('trialEnding', partner, {
      daysRemaining: partner.trial_days_remaining || 10,
    })
  }

  // Contract signed → Move to active
  if (newStage === 'active' && prevStage === 'contract_signed') {
    await sendEmail('welcomeActive', partner)
  }
}

// Helper: Transform DB partner to frontend format
function transformPartner(p: any) {
  return {
    ...p,
    // Map to expected frontend field names
    stage: p.pipeline_stage,
    contactFullName: `${p.contact_first_name || ''} ${p.contact_last_name || ''}`.trim(),
    contactEmail: p.contact_email,
    contactPhone: p.contact_phone,
    companyLegalName: p.company_legal_name,
    companyDBA: p.dba_name,
    companyCity: p.city,
    companyState: p.state,
    initialReviewStatus: p.pipeline_stage === 'initial_review' ? 'pending' : 'complete',
    postCallReviewStatus: p.intro_call_calendly_status,
    discoveryCallStatus: p.intro_call_calendly_status,
    trialDaysRemaining: p.trial_days_remaining,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    status: p.pipeline_stage === 'inactive' ? 'inactive' : 'active',
    partnerType: 'Location Partner',
  }
}

// GET: Fetch partners
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Single partner fetch
    if (id) {
      const { data: partner, error } = await supabase
        .from('location_partners')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !partner) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      // Calculate trial days
      partner.trial_days_remaining = calculateTrialDays(partner.trial_end_date)

      // Get activity log
      const { data: activityLog } = await supabase
        .from('activity_log')
        .select('*')
        .eq('entity_type', 'location_partner')
        .eq('entity_id', id)
        .order('created_at', { ascending: false })
        .limit(50)

      // Get venues
      const { data: venues } = await supabase
        .from('venues')
        .select('*')
        .eq('location_partner_id', id)

      // Get referral partner if exists
      let referralPartner = null
      if (partner.referred_by_partner_id) {
        const { data } = await supabase
          .from('referral_partners')
          .select('*')
          .eq('id', partner.referred_by_partner_id)
          .single()
        referralPartner = data
      }

      return NextResponse.json({
        partner,
        activityLog: activityLog || [],
        venues: venues || [],
        referralPartner,
      })
    }

    // List partners with filters
    let query = supabase.from('location_partners').select('*')

    const stage = searchParams.get('stage')
    const search = searchParams.get('search')?.toLowerCase()
    const status = searchParams.get('status')

    if (stage) {
      query = query.eq('pipeline_stage', stage)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(
        `company_legal_name.ilike.%${search}%,dba_name.ilike.%${search}%,contact_email.ilike.%${search}%,contact_first_name.ilike.%${search}%,contact_last_name.ilike.%${search}%`
      )
    }

    const { data: partners, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate trial days for each partner
    const partnersWithTrialDays = (partners || []).map((p) => ({
      ...p,
      trial_days_remaining: calculateTrialDays(p.trial_end_date),
    }))

    // Calculate stats
    const stats = {
      total: partnersWithTrialDays.length,
      byStage: {} as Record<string, number>,
      pendingReview: 0,
      inTrial: 0,
      trialEndingSoon: 0,
      active: 0,
    }

    partnersWithTrialDays.forEach((p) => {
      stats.byStage[p.pipeline_stage] = (stats.byStage[p.pipeline_stage] || 0) + 1
      if (p.pipeline_stage === 'initial_review') stats.pendingReview++
      if (p.pipeline_stage === 'trial_active' || p.pipeline_stage === 'trial_ending') stats.inTrial++
      if (p.pipeline_stage === 'trial_active' && (p.trial_days_remaining || 999) <= 10)
        stats.trialEndingSoon++
      if (p.pipeline_stage === 'active') stats.active++
    })

    // Transform partners for frontend
    const transformedPartners = partnersWithTrialDays.map(transformPartner)

    return NextResponse.json({ partners: transformedPartners, stats })
  } catch (error) {
    console.error('GET /api/pipeline/partners error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create new partner
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    // Prepare partner data
    const partnerData = {
      company_legal_name: body.companyLegalName || body.company_legal_name,
      dba_name: body.companyDBA || body.dba_name,
      contact_first_name: body.contactFirstName || body.contact_first_name,
      contact_last_name: body.contactLastName || body.contact_last_name,
      contact_email: body.contactEmail || body.contact_email,
      contact_phone: body.contactPhone || body.contact_phone,
      address_line_1: body.companyAddress1 || body.address_line_1,
      city: body.companyCity || body.city,
      state: body.companyState || body.state,
      zip: body.companyZip || body.zip,
      pipeline_stage: 'form_submitted',
      referral_code_used: body.referralCode || body.referral_code_used,
      referral_source: body.source || body.referral_source || 'website',
      intro_call_calendly_status: 'not_sent',
      loi_status: 'not_created',
      install_status: 'not_scheduled',
      contract_status: 'not_created',
      tipalti_status: 'not_invited',
      notes: body.notes,
      tags: body.tags || [],
    }

    // Look up referral partner by code
    if (partnerData.referral_code_used) {
      const { data: refPartner } = await supabase
        .from('referral_partners')
        .select('id, contact_name')
        .eq('referral_code', partnerData.referral_code_used)
        .single()

      if (refPartner) {
        ;(partnerData as any).referred_by_partner_id = refPartner.id
        ;(partnerData as any).referred_by_name = refPartner.contact_name
      }
    }

    // Insert partner
    const { data: partner, error } = await supabase
      .from('location_partners')
      .insert(partnerData)
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await logActivity(
      supabase,
      partner.id,
      'created',
      `Application submitted for ${partner.dba_name || partner.company_legal_name}`
    )

    // Auto-move to initial_review
    await supabase
      .from('location_partners')
      .update({
        pipeline_stage: 'initial_review',
        pipeline_stage_changed_at: new Date().toISOString(),
      })
      .eq('id', partner.id)

    await logActivity(supabase, partner.id, 'stage_change', 'Moved to Initial Review')

    return NextResponse.json({ partner }, { status: 201 })
  } catch (error) {
    console.error('POST /api/pipeline/partners error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update partner
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    // Get current partner
    const { data: currentPartner, error: fetchError } = await supabase
      .from('location_partners')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentPartner) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const previousStage = currentPartner.pipeline_stage

    // Map camelCase to snake_case if needed
    const updateData: Record<string, any> = {}

    const fieldMap: Record<string, string> = {
      stage: 'pipeline_stage',
      pipelineStage: 'pipeline_stage',
      companyLegalName: 'company_legal_name',
      companyDBA: 'dba_name',
      contactFirstName: 'contact_first_name',
      contactLastName: 'contact_last_name',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone',
      loiStatus: 'loi_status',
      contractStatus: 'contract_status',
      tipaltiStatus: 'tipalti_status',
      installStatus: 'install_status',
      trialStartDate: 'trial_start_date',
      trialEndDate: 'trial_end_date',
      introCallCalendlyStatus: 'intro_call_calendly_status',
      introCallScheduledAt: 'intro_call_scheduled_at',
      loiDeviceOwnership: 'loi_device_ownership',
      loiDeviceCount: 'loi_device_count',
      loiDeviceType: 'loi_device_type',
    }

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key] || key
      updateData[dbField] = value
    }

    // If stage is changing, update timestamp
    if (updateData.pipeline_stage && updateData.pipeline_stage !== previousStage) {
      updateData.pipeline_stage_changed_at = new Date().toISOString()

      // Set trial dates if moving to trial_active
      if (updateData.pipeline_stage === 'trial_active' && !currentPartner.trial_start_date) {
        const now = new Date()
        updateData.trial_start_date = now.toISOString().split('T')[0]
        updateData.trial_end_date = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
        updateData.trial_status = 'active'
      }
    }

    // Update partner
    const { data: partner, error: updateError } = await supabase
      .from('location_partners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log stage change
    if (updateData.pipeline_stage && updateData.pipeline_stage !== previousStage) {
      await logActivity(
        supabase,
        id,
        'stage_change',
        `Stage: ${previousStage} → ${updateData.pipeline_stage}`
      )

      // Handle stage transition emails/actions
      await handleStageTransition(supabase, partner, previousStage, updateData.pipeline_stage)
    }

    // Calculate trial days
    partner.trial_days_remaining = calculateTrialDays(partner.trial_end_date)

    return NextResponse.json({ partner })
  } catch (error) {
    console.error('PUT /api/pipeline/partners error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove partner
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase.from('location_partners').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logActivity(supabase, id, 'deleted', 'Partner deleted')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/pipeline/partners error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
