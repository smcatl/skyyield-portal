// app/api/pipeline/contractors/route.ts
// Contractors CRUD API
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch contractors
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const stage = searchParams.get('stage')
  const status = searchParams.get('status')
  const state = searchParams.get('state') // Filter by service area
  const limit = parseInt(searchParams.get('limit') || '100')

  try {
    if (id) {
      const { data: contractor, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Get installations done by this contractor
      const { data: installations } = await supabase
        .from('venues')
        .select('id, venue_id, venue_name, installation_date, status')
        .eq('installation_contractor_id', id)
        .order('installation_date', { ascending: false })

      // Get activity log
      const { data: activityLog } = await supabase
        .from('activity_log')
        .select('*')
        .eq('entity_type', 'contractor')
        .eq('entity_id', id)
        .order('created_at', { ascending: false })
        .limit(50)

      return NextResponse.json({ 
        contractor, 
        installations: installations || [],
        activityLog: activityLog || [] 
      })
    }

    // List contractors with filters
    let query = supabase
      .from('contractors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (stage) query = query.eq('pipeline_stage', stage)
    if (status) query = query.eq('status', status)
    if (state) query = query.eq('state', state)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ contractors: data })
  } catch (error: any) {
    console.error('GET /api/pipeline/contractors error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new contractor (from application)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate contractor_id: CON-XXXXXXXX
    const randomId = Math.random().toString(36).substring(2, 10).toUpperCase()
    const contractorId = `CON-${randomId}`

    const insertData = {
      contractor_id: contractorId,

      // Entity info
      entity_type: body.entity_type || 'individual',
      legal_name: body.legal_name,
      dba_name: body.dba_name,
      ein: body.ein,

      // Contact
      contact_full_name: body.contact_full_name,
      contact_first_name: body.contact_first_name,
      contact_last_name: body.contact_last_name,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone,
      contact_title: body.contact_title,

      // Address / Service Area
      address_line_1: body.address_line_1,
      address_line_2: body.address_line_2,
      city: body.city,
      state: body.state,
      zip: body.zip,
      country: body.country || 'USA',
      service_radius_miles: body.service_radius_miles || 50,

      // Qualifications
      years_experience: body.years_experience,
      certifications: body.certifications || [],
      services_offered: body.services_offered || [],
      tools_owned: body.tools_owned,
      vehicle_type: body.vehicle_type,

      // Rates
      hourly_rate: body.hourly_rate,
      per_install_rate: body.per_install_rate,
      availability: body.availability,

      // Additional
      portfolio_url: body.portfolio_url,
      notes: body.notes,
      referral_source: body.referral_source || 'website',

      // Pipeline
      pipeline_stage: 'application',
      status: 'pending',

      // DocuSeal tracking
      agreement_status: 'not_sent',
      nda_status: 'not_sent',
      background_check_status: 'not_started',

      // Stats
      total_installs: 0,
      average_rating: null,

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('contractors')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_log').insert([{
      entity_type: 'contractor',
      entity_id: data.id,
      entity_name: data.legal_name || data.contact_full_name,
      action: 'application_submitted',
      action_category: 'pipeline',
      description: `Contractor application submitted from ${data.city}, ${data.state}`,
      new_values: { 
        pipeline_stage: 'application', 
        status: 'pending',
        services: data.services_offered,
      },
    }])

    return NextResponse.json({ success: true, contractor: data })
  } catch (error: any) {
    console.error('POST /api/pipeline/contractors error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update contractor
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Contractor ID required' }, { status: 400 })
    }

    // Get current state
    const { data: oldContractor } = await supabase
      .from('contractors')
      .select('pipeline_stage, status, agreement_status, legal_name, contact_full_name')
      .eq('id', id)
      .single()

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('contractors')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log significant changes
    const changes: string[] = []
    if (updates.pipeline_stage && oldContractor?.pipeline_stage !== updates.pipeline_stage) {
      changes.push(`stage: ${oldContractor?.pipeline_stage} → ${updates.pipeline_stage}`)
    }
    if (updates.status && oldContractor?.status !== updates.status) {
      changes.push(`status: ${oldContractor?.status} → ${updates.status}`)
    }

    if (changes.length > 0) {
      await supabase.from('activity_log').insert([{
        entity_type: 'contractor',
        entity_id: id,
        entity_name: oldContractor?.legal_name || oldContractor?.contact_full_name,
        user_id: userId || null,
        action: updates.pipeline_stage ? 'stage_changed' : 'updated',
        action_category: 'pipeline',
        description: changes.join(', '),
        old_values: oldContractor,
        new_values: updates,
      }])
    }

    return NextResponse.json({ success: true, contractor: data })
  } catch (error: any) {
    console.error('PUT /api/pipeline/contractors error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Deactivate contractor
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Contractor ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('contractors')
      .update({ 
        status: 'inactive', 
        pipeline_stage: 'inactive',
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'contractor',
      entity_id: id,
      entity_name: data.legal_name || data.contact_full_name,
      user_id: userId || null,
      action: 'deactivated',
      action_category: 'pipeline',
      description: 'Contractor deactivated',
    }])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/pipeline/contractors error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
