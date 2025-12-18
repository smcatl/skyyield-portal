// app/api/admin/products/sync-to-stripe/route.ts
// One-time sync: Push all Supabase products to Stripe
import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import Stripe from "stripe"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
})

export async function POST(request: NextRequest) {
  try {
    // Get all products from Supabase that don't have Stripe IDs
    const { data: products, error } = await supabase
      .from('store_products')
      .select('*')
      .is('stripe_product_id', null)
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ 
        message: 'All products already synced to Stripe',
        synced: 0,
        skipped: 0,
        failed: 0
      })
    }

    const results = {
      synced: 0,
      skipped: 0,
      failed: 0,
      details: [] as { sku: string; status: string; error?: string }[]
    }

    for (const product of products) {
      try {
        // Check if product already exists in Stripe by SKU
        const existingProducts = await stripe.products.search({
          query: `metadata['sku']:'${product.sku}'`,
        })

        let stripeProduct: Stripe.Product
        let stripePrice: Stripe.Price

        if (existingProducts.data.length > 0) {
          // Product exists, use existing
          stripeProduct = existingProducts.data[0]
          
          // Get default price
          if (stripeProduct.default_price) {
            stripePrice = await stripe.prices.retrieve(stripeProduct.default_price as string)
          } else {
            // Create price if none exists
            stripePrice = await stripe.prices.create({
              product: stripeProduct.id,
              unit_amount: Math.round((product.store_price || 0) * 100),
              currency: 'usd',
            })
            await stripe.products.update(stripeProduct.id, {
              default_price: stripePrice.id,
            })
          }

          results.details.push({ sku: product.sku, status: 'existing' })
        } else {
          // Create new product in Stripe
          const images = [product.image_1_url, product.image_2_url, product.image_3_url]
            .filter(Boolean)
            .slice(0, 8)

          stripeProduct = await stripe.products.create({
            name: product.name,
            description: product.description || undefined,
            images: images.length > 0 ? images : undefined,
            metadata: {
              sku: product.sku || '',
              category: product.category || '',
              manufacturer: product.manufacturer || 'Ubiquiti',
              msrp: String(product.msrp || 0),
              markup: String(product.markup || 0.2),
              features: product.features || '',
              type_layer: product.type_layer || '',
              availability: product.availability || 'In Stock',
              product_url: product.product_url || '',
              show_in_store: product.is_visible !== false ? 'true' : 'false',
              supabase_id: product.id,
            },
          })

          // Create price
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: Math.round((product.store_price || 0) * 100),
            currency: 'usd',
          })

          // Set as default price
          await stripe.products.update(stripeProduct.id, {
            default_price: stripePrice.id,
          })

          results.details.push({ sku: product.sku, status: 'created' })
        }

        // Update Supabase with Stripe IDs
        await supabase
          .from('store_products')
          .update({
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripePrice.id,
          })
          .eq('id', product.id)

        results.synced++
      } catch (err) {
        console.error(`Failed to sync product ${product.sku}:`, err)
        results.failed++
        results.details.push({ 
          sku: product.sku, 
          status: 'failed', 
          error: err instanceof Error ? err.message : 'Unknown error' 
        })
      }
    }

    return NextResponse.json({
      message: `Sync complete`,
      total: products.length,
      ...results
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Sync failed' 
    }, { status: 500 })
  }
}

// GET - Check sync status
export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('store_products')
      .select('id, sku, name, stripe_product_id, stripe_price_id')
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const synced = products?.filter(p => p.stripe_product_id) || []
    const notSynced = products?.filter(p => !p.stripe_product_id) || []

    return NextResponse.json({
      total: products?.length || 0,
      synced: synced.length,
      notSynced: notSynced.length,
      products: {
        synced: synced.map(p => ({ sku: p.sku, name: p.name })),
        notSynced: notSynced.map(p => ({ sku: p.sku, name: p.name })),
      }
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
