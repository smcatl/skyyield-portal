// API Route: CRM Prospects
// app/api/crm/prospects/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// GET: Fetch prospects
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    
    let query = supabase.from('prospects').select('*')
    
    // Filters
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')?.toLowerCase()
    
    if (type) {
      query = query.eq('prospect_type', type)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`
      )
    }
    
    const { data: prospects, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get activities for each prospect
    const prospectIds = (prospects || []).map(p => p.id)
    let activities: any[] = []
    
    if (prospectIds.length > 0) {
      const { data: activityData } = await supabase
        .from('prospect_activities')
        .select('*')
        .in('prospect_id', prospectIds)
        .order('created_at', { ascending: false })
      
      activities = activityData || []
    }
    
    // Attach activities to prospects
    const prospectsWithActivities = (prospects || []).map(p => ({
      ...p,
      activities: activities.filter(a => a.prospect_id === p.id),
    }))
    
    return NextResponse.json({ prospects: prospectsWithActivities })
  } catch (error) {
    console.error('GET /api/crm/prospects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create prospect
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    
    const prospectData = {
      prospect_type: body.prospect_type || 'location_partner',
      status: body.status || 'new',
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone,
      title: body.title,
      company_name: body.company_name,
      company_type: body.company_type,
      city: body.city,
      state: body.state,
      source: body.source,
      source_detail: body.source_detail,
      estimated_value: body.estimated_value,
      probability: body.probability,
      assigned_to: body.assigned_to,
      notes: body.notes,
      tags: body.tags || [],
      follow_up_count: 0,
    }
    
    const { data: prospect, error } = await supabase
      .from('prospects')
      .insert(prospectData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating prospect:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Log creation activity
    await supabase.from('prospect_activities').insert({
      prospect_id: prospect.id,
      type: 'note',
      description: 'Prospect created',
      created_by: 'System',
    })
    
    return NextResponse.json({ prospect })
  } catch (error) {
    console.error('POST /api/crm/prospects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
