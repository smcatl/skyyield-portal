// app/api/admin/products/route.ts
// Fetches products from Supabase instead of Stripe
import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch all products from Supabase
export async function GET() {
  try {
    console.log('Fetching products from Supabase...')
    
    const { data, error } = await supabase
      .from('store_products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message, products: [] }, { status: 500 })
    }

    console.log(`Found ${data?.length || 0} products in Supabase`)

    // Map Supabase fields to the format the portal expects
    const products = (data || []).map(p => ({
      id: p.id,
      priceId: p.product_id || p.id, // Use product_id as priceId for compatibility
      name: p.name,
      description: p.description || '',
      sku: p.sku || '',
      category: p.category || 'Uncategorized',
      manufacturer: p.manufacturer || '',
      msrp: p.msrp || 0,
      storePrice: p.store_price || 0,
      partnerPrice: p.partner_price || p.msrp || 0,
      markup: p.markup || 0.2,
      features: p.features || '',
      typeLayer: p.type_layer || '',
      availability: p.availability || 'In Stock',
      showInStore: p.is_visible !== false,
      productUrl: p.product_url || '',
      images: [p.image_1_url, p.image_2_url, p.image_3_url].filter(Boolean),
      active: p.is_active !== false,
      createdAt: p.created_at ? new Date(p.created_at).getTime() / 1000 : Date.now() / 1000,
    }))

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products', products: [] }, { status: 500 })
  }
}

// POST - Create a new product in Supabase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Generate product_id
    const { count } = await supabase
      .from('store_products')
      .select('*', { count: 'exact', head: true })
    const productId = `PROD-${String((count || 0) + 1).padStart(4, '0')}`
    
    // Calculate store_price
    const msrp = body.msrp || 0
    const markup = body.markup || 0.2
    const storePrice = body.storePrice || Math.round(msrp * (1 + markup) * 100) / 100

    const { data, error } = await supabase
      .from('store_products')
      .insert([{
        product_id: productId,
        sku: body.sku,
        name: body.name,
        description: body.description,
        manufacturer: body.manufacturer || 'Ubiquiti',
        category: body.category,
        features: body.features,
        type_layer: body.typeLayer,
        msrp: msrp,
        markup: markup,
        store_price: storePrice,
        partner_price: msrp,
        availability: body.availability || 'In Stock',
        is_visible: body.showInStore !== false,
        is_active: true,
        product_url: body.productUrl,
        image_1_url: body.images?.[0] || '',
        image_2_url: body.images?.[1] || '',
        image_3_url: body.images?.[2] || '',
      }])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      product: {
        id: data.id,
        priceId: data.product_id,
        name: data.name,
      }
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// PUT - Update a product in Supabase
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Recalculate store_price if msrp or markup changed
    const msrp = body.msrp || 0
    const markup = body.markup || 0.2
    const storePrice = body.storePrice || Math.round(msrp * (1 + markup) * 100) / 100

    const { data, error } = await supabase
      .from('store_products')
      .update({
        sku: body.sku,
        name: body.name,
        description: body.description,
        manufacturer: body.manufacturer,
        category: body.category,
        features: body.features,
        type_layer: body.typeLayer,
        msrp: msrp,
        markup: markup,
        store_price: storePrice,
        partner_price: body.partnerPrice || msrp,
        availability: body.availability,
        is_visible: body.showInStore !== false,
        product_url: body.productUrl,
        image_1_url: body.images?.[0] || '',
        image_2_url: body.images?.[1] || '',
        image_3_url: body.images?.[2] || '',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE - Delete a product from Supabase
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('store_products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
