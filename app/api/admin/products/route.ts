import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
})

// Helper to clean category names (remove "SkyYield " prefix)
const cleanCategory = (cat: string) => {
  return cat?.replace(/^SkyYield\s+/i, "") || "Uncategorized"
}

// GET - Fetch all products from Stripe
export async function GET() {
  try {
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
      limit: 100,
    })

    const storeProducts = products.data
      .filter(product => product.default_price)
      .map(product => {
        const price = product.default_price as Stripe.Price
        const unitAmount = price.unit_amount || 0
        const storePrice = unitAmount / 100

        return {
          id: product.id,
          priceId: price.id,
          name: product.name,
          description: product.description || "",
          sku: product.metadata.sku || "",
          category: cleanCategory(product.metadata.category),
          manufacturer: product.metadata.manufacturer || "",
          msrp: parseFloat(product.metadata.msrp || "0"),
          storePrice: storePrice,
          markup: parseFloat(product.metadata.markup || "0.2"),
          features: product.metadata.features || "",
          typeLayer: product.metadata.type_layer || "",
          availability: product.metadata.availability || "In Stock",
          showInStore: product.metadata.show_in_store !== "false",
          productUrl: product.metadata.product_url || "",
          images: product.images || [],
          active: product.active,
          createdAt: product.created,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ products: storeProducts })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

// POST - Create a new product in Stripe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      sku,
      category,
      manufacturer,
      msrp,
      storePrice,
      markup,
      features,
      typeLayer,
      availability,
      showInStore,
      productUrl,
      images,
    } = body

    if (!name || !storePrice) {
      return NextResponse.json({ error: "Name and store price are required" }, { status: 400 })
    }

    // Create product in Stripe
    const product = await stripe.products.create({
      name,
      description: description || undefined,
      images: images?.filter((img: string) => img).slice(0, 8) || [],
      metadata: {
        sku: sku || "",
        category: category || "Uncategorized",
        manufacturer: manufacturer || "",
        msrp: msrp?.toString() || "0",
        markup: markup?.toString() || "0.2",
        features: features || "",
        type_layer: typeLayer || "",
        availability: availability || "In Stock",
        show_in_store: showInStore === false ? "false" : "true",
        product_url: productUrl || "",
      },
    })

    // Create price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(storePrice * 100),
      currency: "usd",
    })

    // Update product with default price
    await stripe.products.update(product.id, {
      default_price: price.id,
    })

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        priceId: price.id,
        name: product.name,
        description: product.description,
        sku,
        category,
        manufacturer,
        msrp,
        storePrice,
        markup,
        features,
        typeLayer,
        availability,
        productUrl,
        images: product.images,
      },
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

// PUT - Update an existing product in Stripe
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      priceId,
      name,
      description,
      sku,
      category,
      manufacturer,
      msrp,
      storePrice,
      markup,
      features,
      typeLayer,
      availability,
      showInStore,
      productUrl,
      images,
    } = body

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Update product in Stripe
    const product = await stripe.products.update(id, {
      name,
      description: description || "",
      images: images?.filter((img: string) => img).slice(0, 8) || [],
      metadata: {
        sku: sku || "",
        category: category || "Uncategorized",
        manufacturer: manufacturer || "",
        msrp: msrp?.toString() || "0",
        markup: markup?.toString() || "0.2",
        features: features || "",
        type_layer: typeLayer || "",
        availability: availability || "In Stock",
        show_in_store: showInStore === false ? "false" : "true",
        product_url: productUrl || "",
      },
    })

    // Check if price changed
    let finalPriceId = priceId
    if (priceId) {
      const existingPrice = await stripe.prices.retrieve(priceId)
      const newAmount = Math.round(storePrice * 100)

      if (existingPrice.unit_amount !== newAmount) {
        // Archive old price and create new one
        await stripe.prices.update(priceId, { active: false })
        
        const newPrice = await stripe.prices.create({
          product: id,
          unit_amount: newAmount,
          currency: "usd",
        })
        
        await stripe.products.update(id, {
          default_price: newPrice.id,
        })
        
        finalPriceId = newPrice.id
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        priceId: finalPriceId,
        name: product.name,
        description: product.description,
        sku,
        category,
        manufacturer,
        msrp,
        storePrice,
        markup,
        features,
        typeLayer,
        availability,
        productUrl,
        images: product.images,
      },
    })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// DELETE - Archive a product in Stripe
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    await stripe.products.update(id, { active: false })

    return NextResponse.json({ success: true, message: "Product archived successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}