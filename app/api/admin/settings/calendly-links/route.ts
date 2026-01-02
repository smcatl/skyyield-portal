// app/api/admin/settings/calendly-links/route.ts
// CRUD for calendly_links table

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List all Calendly links
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const linkType = searchParams.get('type')

    if (id) {
      const { data, error } = await supabase
        .from('calendly_links')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return NextResponse.json({ link: data })
    }

    let query = supabase
      .from('calendly_links')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (linkType) {
      query = query.eq('link_type', linkType)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ links: data || [] })
  } catch (error: any) {
    console.error('GET /api/admin/settings/calendly-links error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new Calendly link
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Get max sort_order
    const { data: maxOrder } = await supabase
      .from('calendly_links')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const insertData = {
      name: body.name,
      url: body.url,
      link_type: body.link_type || 'discovery_call',
      description: body.description || null,
      duration_minutes: body.duration_minutes || 30,
      partner_types: body.partner_types || ['location_partner'],
      assigned_to_user_id: body.assigned_to_user_id || null,
      sort_order: (maxOrder?.sort_order || 0) + 1,
      is_active: body.is_active !== false,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('calendly_links')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, link: data })
  } catch (error: any) {
    console.error('POST /api/admin/settings/calendly-links error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update Calendly link
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Link ID required' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('calendly_links')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, link: data })
  } catch (error: any) {
    console.error('PUT /api/admin/settings/calendly-links error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete Calendly link
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Link ID required' }, { status: 400 })
    }

    // Soft delete
    const { error } = await supabase
      .from('calendly_links')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/admin/settings/calendly-links error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
