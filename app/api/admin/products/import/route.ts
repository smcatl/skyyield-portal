import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
})

interface ProductImport {
  name: string
  description: string
  sku: string
  category: string
  manufacturer: string
  msrp: number
  storePrice: number
  markup: number
  features: string
  typeLayer: string
  availability: string
  productUrl: string
  images: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { products } = await request.json() as { products: ProductImport[] }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Products array is required" }, { status: 400 })
    }

    const results = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Get existing products to check for duplicates
    const existingProducts = await stripe.products.list({ limit: 100, active: true })
    const existingSkus = new Set(existingProducts.data.map(p => p.metadata.sku).filter(Boolean))

    for (const productData of products) {
      try {
        // Skip if SKU already exists
        if (productData.sku && existingSkus.has(productData.sku)) {
          results.skipped++
          results.errors.push(`Skipped: ${productData.name} (SKU ${productData.sku} already exists)`)
          continue
        }

        // Create product in Stripe
        const product = await stripe.products.create({
          name: productData.name,
          description: productData.description || undefined,
          images: productData.images?.filter(img => img).slice(0, 8) || [], // Stripe allows max 8 images
          metadata: {
            sku: productData.sku || "",
            category: productData.category || "Uncategorized",
            manufacturer: productData.manufacturer || "",
            msrp: productData.msrp?.toString() || "0",
            markup: productData.markup?.toString() || "0.2",
            features: productData.features || "",
            type_layer: productData.typeLayer || "",
            availability: productData.availability || "In Stock",
            product_url: productData.productUrl || "",
          },
        })

        // Create price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round((productData.storePrice || 0) * 100),
          currency: "usd",
        })

        // Set default price
        await stripe.products.update(product.id, {
          default_price: price.id,
        })

        results.created++
        existingSkus.add(productData.sku) // Add to set to prevent duplicates within same import
      } catch (error) {
        results.failed++
        results.errors.push(`Failed: ${productData.name} - ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Error importing products:", error)
    return NextResponse.json({ error: "Failed to import products" }, { status: 500 })
  }
}