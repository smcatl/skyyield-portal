// app/api/admin/settings/dropdowns/route.ts
// CRUD for dropdowns table

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List all dropdowns or dropdown items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')
    const includeItems = searchParams.get('includeItems') === 'true'

    if (id) {
      const { data: dropdown, error } = await supabase
        .from('dropdowns')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Optionally include dropdown items
      if (includeItems) {
        const { data: items } = await supabase
          .from('dropdown_items')
          .select('*')
          .eq('dropdown_id', id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        return NextResponse.json({ dropdown, items: items || [] })
      }

      return NextResponse.json({ dropdown })
    }

    let query = supabase
      .from('dropdowns')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    // Optionally include items for each dropdown
    if (includeItems && data) {
      const dropdownIds = data.map(d => d.id)
      const { data: allItems } = await supabase
        .from('dropdown_items')
        .select('*')
        .in('dropdown_id', dropdownIds)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      const dropdownsWithItems = data.map(dropdown => ({
        ...dropdown,
        items: (allItems || []).filter(item => item.dropdown_id === dropdown.id)
      }))

      return NextResponse.json({ dropdowns: dropdownsWithItems })
    }

    return NextResponse.json({ dropdowns: data || [] })
  } catch (error: any) {
    console.error('GET /api/admin/settings/dropdowns error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new dropdown or dropdown item
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // If dropdown_id is provided, create a dropdown item
    if (body.dropdown_id) {
      const { data: maxOrder } = await supabase
        .from('dropdown_items')
        .select('sort_order')
        .eq('dropdown_id', body.dropdown_id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

      const itemData = {
        dropdown_id: body.dropdown_id,
        label: body.label,
        value: body.value || body.label.toLowerCase().replace(/\s+/g, '_'),
        description: body.description || null,
        metadata: body.metadata || null,
        sort_order: body.sort_order ?? (maxOrder?.sort_order || 0) + 1,
        is_active: body.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('dropdown_items')
        .insert([itemData])
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, item: data })
    }

    // Create new dropdown
    const dropdownData = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '_'),
      category: body.category || 'general',
      description: body.description || null,
      is_multi_select: body.is_multi_select || false,
      is_required: body.is_required || false,
      is_active: body.is_active !== false,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('dropdowns')
      .insert([dropdownData])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, dropdown: data })
  } catch (error: any) {
    console.error('POST /api/admin/settings/dropdowns error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update dropdown or dropdown item
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, itemId, ...updates } = body

    updates.updated_at = new Date().toISOString()

    // Update dropdown item
    if (itemId) {
      const { data, error } = await supabase
        .from('dropdown_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, item: data })
    }

    // Update dropdown
    if (!id) {
      return NextResponse.json({ error: 'Dropdown ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('dropdowns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, dropdown: data })
  } catch (error: any) {
    console.error('PUT /api/admin/settings/dropdowns error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete dropdown or dropdown item
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const itemId = searchParams.get('itemId')

    // Delete dropdown item
    if (itemId) {
      const { error } = await supabase
        .from('dropdown_items')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', itemId)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    // Delete dropdown
    if (!id) {
      return NextResponse.json({ error: 'Dropdown ID required' }, { status: 400 })
    }

    // Soft delete dropdown and its items
    const { error: itemsError } = await supabase
      .from('dropdown_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('dropdown_id', id)

    if (itemsError) throw itemsError

    const { error } = await supabase
      .from('dropdowns')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/admin/settings/dropdowns error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
