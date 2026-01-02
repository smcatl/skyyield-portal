// app/api/admin/settings/pipeline-stages/route.ts
// CRUD for pipeline_stages table

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List all pipeline stages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerType = searchParams.get('partnerType')

    let query = supabase
      .from('pipeline_stages')
      .select('id, partner_type, stage_key, stage_name, stage_order, color, description, is_active, auto_email_template_id, auto_calendly_link_id, auto_action, days_until_follow_up')
      .eq('is_active', true)
      .order('stage_order', { ascending: true })

    if (partnerType) {
      query = query.eq('partner_type', partnerType)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform to expected format for UI
    const stages = (data || []).map(stage => ({
      id: stage.id,
      partner_type: stage.partner_type,
      slug: stage.stage_key,
      name: stage.stage_name,
      sort_order: stage.stage_order,
      color: stage.color,
      description: stage.description,
      is_active: stage.is_active,
      email_template_id: stage.auto_email_template_id,
      calendly_link_id: stage.auto_calendly_link_id,
      action_type: stage.auto_action,
      days_until_follow_up: stage.days_until_follow_up,
    }))

    return NextResponse.json({ stages })
  } catch (error: any) {
    console.error('GET /api/admin/settings/pipeline-stages error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new pipeline stage
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Get max stage_order for the partner type
    const { data: maxOrder } = await supabase
      .from('pipeline_stages')
      .select('stage_order')
      .eq('partner_type', body.partner_type || 'location_partner')
      .order('stage_order', { ascending: false })
      .limit(1)
      .single()

    const insertData = {
      stage_name: body.name,
      stage_key: body.slug || body.name.toLowerCase().replace(/\s+/g, '_'),
      description: body.description || null,
      partner_type: body.partner_type || 'location_partner',
      color: body.color || 'border-blue-500',
      stage_order: (maxOrder?.stage_order || 0) + 1,
      is_active: body.is_active !== false,
      auto_action: body.action_type || null,
      auto_email_template_id: body.email_template_id || null,
      auto_calendly_link_id: body.calendly_link_id || null,
      days_until_follow_up: body.days_until_follow_up || null,
    }

    const { data, error } = await supabase
      .from('pipeline_stages')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error

    // Transform response
    const stage = {
      id: data.id,
      partner_type: data.partner_type,
      slug: data.stage_key,
      name: data.stage_name,
      sort_order: data.stage_order,
      color: data.color,
      description: data.description,
      is_active: data.is_active,
      email_template_id: data.auto_email_template_id,
      calendly_link_id: data.auto_calendly_link_id,
      action_type: data.auto_action,
      days_until_follow_up: data.days_until_follow_up,
    }

    return NextResponse.json({ success: true, stage })
  } catch (error: any) {
    console.error('POST /api/admin/settings/pipeline-stages error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update pipeline stage
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Stage ID required' }, { status: 400 })
    }

    // Map UI field names to database column names
    const updates: any = {}
    if (body.name !== undefined) updates.stage_name = body.name
    if (body.slug !== undefined) updates.stage_key = body.slug
    if (body.description !== undefined) updates.description = body.description
    if (body.partner_type !== undefined) updates.partner_type = body.partner_type
    if (body.color !== undefined) updates.color = body.color
    if (body.sort_order !== undefined) updates.stage_order = body.sort_order
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.action_type !== undefined) updates.auto_action = body.action_type
    if (body.email_template_id !== undefined) updates.auto_email_template_id = body.email_template_id
    if (body.calendly_link_id !== undefined) updates.auto_calendly_link_id = body.calendly_link_id
    if (body.days_until_follow_up !== undefined) updates.days_until_follow_up = body.days_until_follow_up

    const { data, error } = await supabase
      .from('pipeline_stages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Transform response
    const stage = {
      id: data.id,
      partner_type: data.partner_type,
      slug: data.stage_key,
      name: data.stage_name,
      sort_order: data.stage_order,
      color: data.color,
      description: data.description,
      is_active: data.is_active,
      email_template_id: data.auto_email_template_id,
      calendly_link_id: data.auto_calendly_link_id,
      action_type: data.auto_action,
      days_until_follow_up: data.days_until_follow_up,
    }

    return NextResponse.json({ success: true, stage })
  } catch (error: any) {
    console.error('PUT /api/admin/settings/pipeline-stages error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete pipeline stage (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Stage ID required' }, { status: 400 })
    }

    // Soft delete - just deactivate
    const { error } = await supabase
      .from('pipeline_stages')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/admin/settings/pipeline-stages error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
