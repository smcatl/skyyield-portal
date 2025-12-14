// API Route: Products (Supabase)
// app/api/admin/products/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// GET: Fetch products
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Single product fetch
    if (id) {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !product) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      return NextResponse.json({ product })
    }

    // List products
    let query = supabase.from('products').select('*')

    const category = searchParams.get('category')
    if (category) {
      query = query.eq('category', category)
    }

    const visible = searchParams.get('visible')
    if (visible === 'true') {
      query = query.eq('is_visible', true)
    }

    const featured = searchParams.get('featured')
    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    const inStock = searchParams.get('inStock')
    if (inStock === 'true') {
      query = query.eq('in_stock', true)
    }

    const search = searchParams.get('search')?.toLowerCase()
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,manufacturer.ilike.%${search}%`)
    }

    const { data: products, error } = await query.order('sort_order', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error('GET /api/admin/products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create product
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const productData = {
      sku: body.sku,
      name: body.name,
      manufacturer: body.manufacturer,
      category: body.category,
      subcategory: body.subcategory,
      our_cost: body.ourCost || body.our_cost,
      partner_price: body.partnerPrice || body.partner_price,
      retail_price: body.retailPrice || body.retail_price,
      msrp: body.msrp,
      description: body.description,
      specifications: body.specifications || {},
      image_url: body.imageUrl || body.image_url,
      product_url: body.productUrl || body.product_url,
      in_stock: body.inStock ?? body.in_stock ?? true,
      stock_quantity: body.stockQuantity || body.stock_quantity || 0,
      lead_time_days: body.leadTimeDays || body.lead_time_days,
      is_visible: body.isVisible ?? body.is_visible ?? true,
      is_featured: body.isFeatured ?? body.is_featured ?? false,
      sort_order: body.sortOrder || body.sort_order || 0,
      tags: body.tags || [],
      stripe_product_id: body.stripeProductId || body.stripe_product_id,
      stripe_price_id: body.stripePriceId || body.stripe_price_id,
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update product
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    // Map camelCase to snake_case
    const updateData: Record<string, any> = {}
    const fieldMap: Record<string, string> = {
      ourCost: 'our_cost',
      partnerPrice: 'partner_price',
      retailPrice: 'retail_price',
      imageUrl: 'image_url',
      productUrl: 'product_url',
      inStock: 'in_stock',
      stockQuantity: 'stock_quantity',
      leadTimeDays: 'lead_time_days',
      isVisible: 'is_visible',
      isFeatured: 'is_featured',
      sortOrder: 'sort_order',
      stripeProductId: 'stripe_product_id',
      stripePriceId: 'stripe_price_id',
    }

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key] || key
      updateData[dbField] = value
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('PUT /api/admin/products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove product
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
