// app/api/admin/store-products/route.ts
// Store Products API - Full CRUD with Supabase sync

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all products
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isVisible = searchParams.get('visible')
    const search = searchParams.get('search')

    let query = supabase
      .from('store_products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (isVisible === 'true') {
      query = query.eq('is_visible', true)
    } else if (isVisible === 'false') {
      query = query.eq('is_visible', false)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Get category counts
    const { data: categories } = await supabase
      .from('store_products')
      .select('category')
    
    const categoryCounts: Record<string, number> = {}
    categories?.forEach(p => {
      const cat = p.category || 'Uncategorized'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      products: data || [],
      categories: Object.keys(categoryCounts).sort(),
      categoryCounts,
      total: data?.length || 0
    })

  } catch (error) {
    console.error('Store products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Generate product_id if not provided
    if (!body.product_id) {
      const { count } = await supabase
        .from('store_products')
        .select('*', { count: 'exact', head: true })
      body.product_id = `PROD-${String((count || 0) + 1).padStart(4, '0')}`
    }

    // Calculate store_price if not provided
    if (!body.store_price && body.msrp && body.markup) {
      body.store_price = body.msrp * (1 + body.markup)
    }

    // Set partner_price to MSRP if not provided
    if (!body.partner_price && body.msrp) {
      body.partner_price = body.msrp
    }

    const { data, error } = await supabase
      .from('store_products')
      .insert([body])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Product with this SKU already exists' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      product: data,
      message: 'Product created successfully'
    })

  } catch (error) {
    console.error('Store products POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update existing product
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Recalculate store_price if msrp or markup changed
    if (updates.msrp !== undefined || updates.markup !== undefined) {
      const { data: existing } = await supabase
        .from('store_products')
        .select('msrp, markup')
        .eq('id', id)
        .single()

      const msrp = updates.msrp ?? existing?.msrp ?? 0
      const markup = updates.markup ?? existing?.markup ?? 0.2
      updates.store_price = msrp * (1 + markup)
    }

    const { data, error } = await supabase
      .from('store_products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      product: data,
      message: 'Product updated successfully'
    })

  } catch (error) {
    console.error('Store products PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('store_products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Store products DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
