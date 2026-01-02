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
    console.log('[dropdowns] GET request received')

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const includeItems = searchParams.get('includeItems') === 'true'

    if (id) {
      const { data: dropdown, error } = await supabase
        .from('dropdowns')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('[dropdowns] Single fetch error:', error.code, error.message, error.details)
        throw error
      }

      // Optionally include dropdown items
      if (includeItems) {
        const { data: items, error: itemsError } = await supabase
          .from('dropdown_items')
          .select('*')
          .eq('dropdown_id', id)

        if (itemsError) {
          console.error('[dropdowns] Items fetch error:', itemsError.code, itemsError.message)
        }

        return NextResponse.json({ dropdown, items: items || [] })
      }

      return NextResponse.json({ dropdown })
    }

    // Simple query - no is_active filter since column doesn't exist
    console.log('[dropdowns] Fetching all dropdowns')
    const { data, error } = await supabase
      .from('dropdowns')
      .select('*')

    if (error) {
      console.error('[dropdowns] List error:', error.code, error.message, error.details)
      throw error
    }

    console.log('[dropdowns] Found', data?.length || 0, 'dropdowns')

    // Optionally include items for each dropdown
    if (includeItems && data && data.length > 0) {
      const dropdownIds = data.map(d => d.id)
      console.log('[dropdowns] Fetching items for', dropdownIds.length, 'dropdowns')

      const { data: allItems, error: itemsError } = await supabase
        .from('dropdown_items')
        .select('*')
        .in('dropdown_id', dropdownIds)

      if (itemsError) {
        console.error('[dropdowns] Items fetch error:', itemsError.code, itemsError.message)
      }

      console.log('[dropdowns] Found', allItems?.length || 0, 'items')

      const dropdownsWithItems = data.map(dropdown => ({
        ...dropdown,
        items: (allItems || []).filter(item => item.dropdown_id === dropdown.id)
      }))

      return NextResponse.json({ dropdowns: dropdownsWithItems })
    }

    return NextResponse.json({ dropdowns: data || [] })
  } catch (error: any) {
    console.error('[dropdowns] GET error:', error.code, error.message, error.details, error)
    return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 })
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
      const itemData: any = {
        dropdown_id: body.dropdown_id,
        label: body.label,
        value: body.value || body.label.toLowerCase().replace(/\s+/g, '_'),
      }

      // Only add optional fields if they exist
      if (body.description) itemData.description = body.description
      if (body.metadata) itemData.metadata = body.metadata
      if (body.sort_order !== undefined) itemData.sort_order = body.sort_order

      const { data, error } = await supabase
        .from('dropdown_items')
        .insert([itemData])
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, item: data })
    }

    // Create new dropdown
    const dropdownData: any = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '_'),
    }

    // Only add optional fields if they exist
    if (body.category) dropdownData.category = body.category
    if (body.description) dropdownData.description = body.description

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

// DELETE - Delete dropdown or dropdown item (hard delete)
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
        .delete()
        .eq('id', itemId)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    // Delete dropdown
    if (!id) {
      return NextResponse.json({ error: 'Dropdown ID required' }, { status: 400 })
    }

    // Delete dropdown items first
    const { error: itemsError } = await supabase
      .from('dropdown_items')
      .delete()
      .eq('dropdown_id', id)

    if (itemsError) throw itemsError

    // Then delete the dropdown
    const { error } = await supabase
      .from('dropdowns')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/admin/settings/dropdowns error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
