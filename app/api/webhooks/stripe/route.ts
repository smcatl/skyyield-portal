// API Route: Stripe Webhook
// app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log(`💳 Stripe Webhook: ${event.type}`)

    // Log all webhook events
    await supabase.from('activity_log').insert({
      entity_type: 'stripe_webhook',
      entity_id: event.id,
      action: event.type,
      description: `Stripe event: ${event.type}`,
    })

    switch (event.type) {
      // ===== CHECKOUT EVENTS =====
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Create order record
        const { data: order } = await supabase
          .from('orders')
          .insert({
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            customer_email: session.customer_details?.email,
            customer_name: session.customer_details?.name,
            shipping_address: (session as any).shipping_details?.address,
            subtotal: (session.amount_subtotal || 0) / 100,
            shipping_cost: (session.total_details?.amount_shipping || 0) / 100,
            tax: (session.total_details?.amount_tax || 0) / 100,
            total: (session.amount_total || 0) / 100,
            status: 'paid',
            metadata: session.metadata,
          })
          .select()
          .single()

        if (order) {
          console.log(`✅ Order created: ${order.id}`)

          // Try to link to user/partner
          if (session.customer_details?.email) {
            const { data: user } = await supabase
              .from('users')
              .select('id')
              .eq('email', session.customer_details.email)
              .single()

            if (user) {
              await supabase.from('orders').update({ user_id: user.id }).eq('id', order.id)
            }
          }
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`⏰ Checkout expired: ${session.id}`)
        break
      }

      // ===== PAYMENT EVENTS =====
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`✅ Payment succeeded: ${paymentIntent.id}`)

        // Update order status
        await supabase
          .from('orders')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`❌ Payment failed: ${paymentIntent.id}`)

        await supabase
          .from('orders')
          .update({
            status: 'payment_failed',
            failure_reason: paymentIntent.last_payment_error?.message,
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)
        break
      }

      // ===== SUBSCRIPTION EVENTS (for Calculator subscriptions) =====
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const customerEmail = await getCustomerEmail(subscription.customer as string)

        if (customerEmail) {
          // Find user and update subscription status
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', customerEmail)
            .single()

          if (user) {
            await supabase
              .from('users')
              .update({
                stripe_customer_id: subscription.customer as string,
                stripe_subscription_id: subscription.id,
                subscription_status: subscription.status,
                subscription_plan: subscription.items.data[0]?.price?.id,
              })
              .eq('id', user.id)

            console.log(`✅ Subscription created for user ${user.id}`)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('users')
          .update({
            subscription_status: subscription.status,
            subscription_plan: subscription.items.data[0]?.price?.id,
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`📝 Subscription updated: ${subscription.id}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('users')
          .update({
            subscription_status: 'canceled',
            subscription_ended_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`❌ Subscription canceled: ${subscription.id}`)
        break
      }

      // ===== INVOICE EVENTS =====
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`💰 Invoice paid: ${invoice.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`❌ Invoice payment failed: ${invoice.id}`)

        // Could trigger email notification here
        break
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`)
    }

    return NextResponse.json({ received: true, type: event.type })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Helper: Get customer email from Stripe customer ID
async function getCustomerEmail(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return null
    return (customer as Stripe.Customer).email
  } catch {
    return null
  }
}

// GET endpoint for verification
export async function GET() {
  return NextResponse.json({ status: 'Stripe webhook endpoint active' })
}
