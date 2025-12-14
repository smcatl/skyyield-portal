// API Route: Log Prospect Activity
// app/api/crm/prospects/[id]/activity/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// POST: Log activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    
    const { data: activity, error } = await supabase
      .from('prospect_activities')
      .insert({
        prospect_id: id,
        type: body.type,
        description: body.description,
        created_by: body.created_by || 'Admin',
        metadata: body.metadata || {},
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error logging activity:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Update last contact date on prospect
    if (['email', 'call', 'meeting'].includes(body.type)) {
      await supabase
        .from('prospects')
        .update({
          last_contact_date: new Date().toISOString(),
          follow_up_count: supabase.rpc('increment_follow_up_count', { prospect_id: id }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    }
    
    return NextResponse.json({ activity })
  } catch (error) {
    console.error('POST /api/crm/prospects/[id]/activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Get activities for prospect
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    
    const { data: activities, error } = await supabase
      .from('prospect_activities')
      .select('*')
      .eq('prospect_id', id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ activities })
  } catch (error) {
    console.error('GET /api/crm/prospects/[id]/activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
