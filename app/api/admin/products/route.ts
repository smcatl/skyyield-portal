// app/api/admin/products/route.ts
// Syncs products between Supabase (catalog) and Stripe (payments)
import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import Stripe from "stripe"

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
})

// GET - Fetch all products from Supabase
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('store_products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message, products: [] }, { status: 500 })
    }

    // Map Supabase fields to portal format
    const products = (data || []).map(p => ({
      id: p.id,
      priceId: p.stripe_price_id || p.product_id || p.id,
      stripeProductId: p.stripe_product_id || null,
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

// POST - Create product in both Supabase and Stripe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Calculate prices
    const msrp = body.msrp || 0
    const markup = body.markup || 0.2
    const storePrice = body.storePrice || Math.round(msrp * (1 + markup) * 100) / 100

    // 1. Create in Stripe first to get IDs
    let stripeProduct: Stripe.Product | null = null
    let stripePrice: Stripe.Price | null = null

    try {
      // Create Stripe product
      stripeProduct = await stripe.products.create({
        name: body.name,
        description: body.description || undefined,
        images: (body.images || []).filter(Boolean).slice(0, 8),
        metadata: {
          sku: body.sku || '',
          category: body.category || '',
          manufacturer: body.manufacturer || 'Ubiquiti',
          msrp: String(msrp),
          markup: String(markup),
          features: body.features || '',
          type_layer: body.typeLayer || '',
          availability: body.availability || 'In Stock',
          product_url: body.productUrl || '',
          show_in_store: body.showInStore !== false ? 'true' : 'false',
        },
      })

      // Create Stripe price
      stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(storePrice * 100), // Convert to cents
        currency: 'usd',
      })

      // Set as default price
      await stripe.products.update(stripeProduct.id, {
        default_price: stripePrice.id,
      })
    } catch (stripeError) {
      console.error('Stripe error (continuing with Supabase only):', stripeError)
    }

    // 2. Generate product_id for Supabase
    const { count } = await supabase
      .from('store_products')
      .select('*', { count: 'exact', head: true })
    const productId = `PROD-${String((count || 0) + 1).padStart(4, '0')}`

    // 3. Create in Supabase with Stripe IDs
    const { data, error } = await supabase
      .from('store_products')
      .insert([{
        product_id: productId,
        stripe_product_id: stripeProduct?.id || null,
        stripe_price_id: stripePrice?.id || null,
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
      // If Supabase fails but Stripe succeeded, we should clean up Stripe
      if (stripeProduct) {
        try {
          await stripe.products.update(stripeProduct.id, { active: false })
        } catch (e) {
          console.error('Failed to deactivate Stripe product:', e)
        }
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      product: {
        id: data.id,
        priceId: stripePrice?.id || data.product_id,
        stripeProductId: stripeProduct?.id,
        name: data.name,
      }
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// PUT - Update product in both Supabase and Stripe
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Get existing product to find Stripe IDs
    const { data: existing } = await supabase
      .from('store_products')
      .select('stripe_product_id, stripe_price_id, store_price')
      .eq('id', id)
      .single()

    // Calculate prices
    const msrp = body.msrp || 0
    const markup = body.markup || 0.2
    const storePrice = body.storePrice || Math.round(msrp * (1 + markup) * 100) / 100
    const priceChanged = existing?.store_price !== storePrice

    // 1. Update Stripe if we have a Stripe product
    if (existing?.stripe_product_id) {
      try {
        // Update product metadata
        await stripe.products.update(existing.stripe_product_id, {
          name: body.name,
          description: body.description || undefined,
          images: (body.images || []).filter(Boolean).slice(0, 8),
          metadata: {
            sku: body.sku || '',
            category: body.category || '',
            manufacturer: body.manufacturer || 'Ubiquiti',
            msrp: String(msrp),
            markup: String(markup),
            features: body.features || '',
            type_layer: body.typeLayer || '',
            availability: body.availability || 'In Stock',
            product_url: body.productUrl || '',
            show_in_store: body.showInStore !== false ? 'true' : 'false',
          },
          active: body.showInStore !== false,
        })

        // If price changed, create new price (Stripe prices are immutable)
        if (priceChanged) {
          const newPrice = await stripe.prices.create({
            product: existing.stripe_product_id,
            unit_amount: Math.round(storePrice * 100),
            currency: 'usd',
          })

          // Set as default price
          await stripe.products.update(existing.stripe_product_id, {
            default_price: newPrice.id,
          })

          // Deactivate old price
          if (existing.stripe_price_id) {
            await stripe.prices.update(existing.stripe_price_id, { active: false })
          }

          // Update Supabase with new price ID
          body.stripe_price_id = newPrice.id
        }
      } catch (stripeError) {
        console.error('Stripe update error (continuing with Supabase):', stripeError)
      }
    }

    // 2. Update Supabase
    const updateData: Record<string, any> = {
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
    }

    // Add stripe_price_id if it was updated
    if (body.stripe_price_id) {
      updateData.stripe_price_id = body.stripe_price_id
    }

    const { data, error } = await supabase
      .from('store_products')
      .update(updateData)
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

// DELETE - Deactivate product in both Supabase and Stripe
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Get Stripe ID before deleting
    const { data: existing } = await supabase
      .from('store_products')
      .select('stripe_product_id')
      .eq('id', id)
      .single()

    // 1. Deactivate in Stripe (don't delete, just archive)
    if (existing?.stripe_product_id) {
      try {
        await stripe.products.update(existing.stripe_product_id, { active: false })
      } catch (stripeError) {
        console.error('Stripe deactivation error:', stripeError)
      }
    }

    // 2. Delete from Supabase (or set is_active = false to soft delete)
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
