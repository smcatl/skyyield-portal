import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
})

interface CartItem {
  product: {
    id: string
    name: string
    sku: string
    partnerPrice: number
    description: string
    priceId?: string
  }
  quantity: number
  addOns: string[]
}

// Add-on services - these could also be Stripe products
const addOnServices = [
  { id: "warranty-1yr", name: "Extended Warranty - 1 Year", priceType: "percentage" as const, value: 0.10 },
  { id: "warranty-3yr", name: "Extended Warranty - 3 Years", priceType: "percentage" as const, value: 0.25 },
  { id: "pro-install", name: "Professional Installation", priceType: "flat" as const, value: 149.00 },
  { id: "pre-config", name: "Pre-Configuration Service", priceType: "flat" as const, value: 49.00 }
]

function calculateAddOnPrice(addOnId: string, productPrice: number, quantity: number): number {
  const addOn = addOnServices.find(a => a.id === addOnId)
  if (!addOn) return 0
  return addOn.priceType === "percentage" 
    ? productPrice * addOn.value * quantity 
    : addOn.value * quantity
}

export async function POST(request: NextRequest) {
  try {
    const { cartItems, customerEmail } = await request.json() as { 
      cartItems: CartItem[]
      customerEmail?: string 
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Build line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    for (const item of cartItems) {
      // If we have a Stripe price ID, use it directly
      if (item.product.priceId) {
        lineItems.push({
          price: item.product.priceId,
          quantity: item.quantity,
        })
      } else {
        // Fallback: create price data on the fly (for backwards compatibility)
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.product.name,
              description: `SKU: ${item.product.sku} - ${item.product.description}`,
              metadata: {
                sku: item.product.sku,
                product_id: item.product.id.toString()
              }
            },
            unit_amount: Math.round(item.product.partnerPrice * 100),
          },
          quantity: item.quantity,
        })
      }

      // Add any add-on services for this product
      for (const addOnId of item.addOns) {
        const addOn = addOnServices.find(a => a.id === addOnId)
        if (addOn) {
          const addOnPrice = calculateAddOnPrice(addOnId, item.product.partnerPrice, 1)
          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: `${addOn.name} - for ${item.product.name}`,
                description: `Service add-on for ${item.product.sku}`,
                metadata: {
                  type: "add-on",
                  add_on_id: addOnId,
                  parent_product_id: item.product.id.toString()
                }
              },
              unit_amount: Math.round(addOnPrice * 100),
            },
            quantity: item.quantity,
          })
        }
      }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${request.headers.get("origin")}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/store?canceled=true`,
      customer_email: customerEmail,
      automatic_tax: { enabled: false },
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "usd" },
            display_name: "Free Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 2500, currency: "usd" },
            display_name: "Express Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 3 },
            },
          },
        },
      ],
      metadata: {
        order_source: "skyyield_partner_store",
        item_count: cartItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0).toString()
      }
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}