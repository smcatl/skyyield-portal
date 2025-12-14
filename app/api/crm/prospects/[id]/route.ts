// API Route: Single Prospect Operations
// app/api/crm/prospects/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// GET: Fetch single prospect
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    
    const { data: prospect, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
    }
    
    // Get activities
    const { data: activities } = await supabase
      .from('prospect_activities')
      .select('*')
      .eq('prospect_id', id)
      .order('created_at', { ascending: false })
    
    return NextResponse.json({ 
      prospect: { ...prospect, activities: activities || [] } 
    })
  } catch (error) {
    console.error('GET /api/crm/prospects/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update prospect
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    
    // Get current prospect for status change logging
    const { data: currentProspect } = await supabase
      .from('prospects')
      .select('status')
      .eq('id', id)
      .single()
    
    const { data: prospect, error } = await supabase
      .from('prospects')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating prospect:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Log status change if status was updated
    if (body.status && currentProspect?.status !== body.status) {
      await supabase.from('prospect_activities').insert({
        prospect_id: id,
        type: 'status_change',
        description: `Status changed from "${currentProspect?.status}" to "${body.status}"`,
        created_by: 'System',
        metadata: { old_status: currentProspect?.status, new_status: body.status },
      })
    }
    
    return NextResponse.json({ prospect })
  } catch (error) {
    console.error('PATCH /api/crm/prospects/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete prospect
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    
    // Delete activities first
    await supabase
      .from('prospect_activities')
      .delete()
      .eq('prospect_id', id)
    
    // Delete prospect
    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting prospect:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/crm/prospects/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
