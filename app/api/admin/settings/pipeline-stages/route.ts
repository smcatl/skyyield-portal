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
      .select('*')
      .order('sort_order', { ascending: true })

    if (partnerType) {
      query = query.eq('partner_type', partnerType)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ stages: data || [] })
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

    // Get max sort_order for the partner type
    const { data: maxOrder } = await supabase
      .from('pipeline_stages')
      .select('sort_order')
      .eq('partner_type', body.partner_type || 'location_partner')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const insertData = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '_'),
      description: body.description || null,
      partner_type: body.partner_type || 'location_partner',
      color: body.color || 'bg-gray-500/20',
      sort_order: (maxOrder?.sort_order || 0) + 1,
      is_active: body.is_active !== false,
      requires_action: body.requires_action || false,
      action_type: body.action_type || null,
      auto_advance_days: body.auto_advance_days || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('pipeline_stages')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, stage: data })
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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Stage ID required' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('pipeline_stages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, stage: data })
  } catch (error: any) {
    console.error('PUT /api/admin/settings/pipeline-stages error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete pipeline stage
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
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/admin/settings/pipeline-stages error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
