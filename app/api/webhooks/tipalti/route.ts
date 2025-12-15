// app/api/webhooks/tipalti/route.ts
// Webhook handler for Tipalti events
// Events: payee_onboarded, payment_submitted, payment_completed, payment_failed

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { verifyWebhookSignature } from '@/lib/tipalti'

interface TipaltiWebhookEvent {
  eventType: string
  payeeId?: string
  paymentId?: string
  invoiceRefCode?: string
  amount?: number
  currency?: string
  status?: string
  paymentMethod?: string
  timestamp?: string
  errorMessage?: string
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-tipalti-signature') || ''

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Tipalti webhook: Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: TipaltiWebhookEvent = JSON.parse(rawBody)
    console.log('Tipalti webhook received:', event.eventType, event)

    const supabase = getSupabaseAdmin()

    switch (event.eventType) {
      // Payee completed onboarding (entered bank details)
      case 'payee_onboarded':
      case 'payee.onboarded':
      case 'PayeeOnboarded': {
        if (!event.payeeId) break

        // Find and update the partner
        const tables = ['location_partners', 'referral_partners', 'channel_partners', 'relationship_partners', 'contractors']
        
        for (const table of tables) {
          const { data, error } = await supabase
            .from(table)
            .update({
              tipalti_status: 'active',
              tipalti_onboarded_at: new Date().toISOString(),
              tipalti_payment_method: event.paymentMethod,
            })
            .eq('tipalti_payee_id', event.payeeId)
            .select()

          if (data && data.length > 0) {
            console.log(`Updated ${table} for payee ${event.payeeId}`)
            
            // Log activity
            await supabase.from('activity_log').insert({
              entity_type: 'tipalti_webhook',
              entity_id: event.payeeId,
              action: 'payee_onboarded',
              details: { table, payeeId: event.payeeId, paymentMethod: event.paymentMethod },
              created_at: new Date().toISOString(),
            })
            break
          }
        }
        break
      }

      // Payment was submitted for processing
      case 'payment_submitted':
      case 'payment.submitted':
      case 'PaymentSubmitted': {
        if (!event.invoiceRefCode) break

        await supabase
          .from('commission_payments')
          .update({
            status: 'processing',
            submitted_at: new Date().toISOString(),
          })
          .eq('invoice_number', event.invoiceRefCode)

        await supabase.from('activity_log').insert({
          entity_type: 'tipalti_webhook',
          entity_id: event.invoiceRefCode,
          action: 'payment_submitted',
          details: event,
          created_at: new Date().toISOString(),
        })
        break
      }

      // Payment completed successfully
      case 'payment_completed':
      case 'payment.completed':
      case 'PaymentCompleted': {
        if (!event.invoiceRefCode) break

        await supabase
          .from('commission_payments')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: event.paymentMethod,
          })
          .eq('invoice_number', event.invoiceRefCode)

        // Also update the partner's last payment info
        if (event.payeeId) {
          const tables = ['location_partners', 'referral_partners', 'channel_partners', 'relationship_partners', 'contractors']
          for (const table of tables) {
            await supabase
              .from(table)
              .update({
                last_payment_date: new Date().toISOString(),
                last_payment_amount: event.amount,
              })
              .eq('tipalti_payee_id', event.payeeId)
          }
        }

        await supabase.from('activity_log').insert({
          entity_type: 'tipalti_webhook',
          entity_id: event.invoiceRefCode,
          action: 'payment_completed',
          details: event,
          created_at: new Date().toISOString(),
        })
        break
      }

      // Payment failed
      case 'payment_failed':
      case 'payment.failed':
      case 'PaymentFailed': {
        if (!event.invoiceRefCode) break

        await supabase
          .from('commission_payments')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            failure_reason: event.errorMessage,
          })
          .eq('invoice_number', event.invoiceRefCode)

        await supabase.from('activity_log').insert({
          entity_type: 'tipalti_webhook',
          entity_id: event.invoiceRefCode,
          action: 'payment_failed',
          details: event,
          created_at: new Date().toISOString(),
        })
        break
      }

      // Payee updated their payment details
      case 'payee_updated':
      case 'payee.updated':
      case 'PayeeUpdated': {
        if (!event.payeeId) break

        const tables = ['location_partners', 'referral_partners', 'channel_partners', 'relationship_partners', 'contractors']
        
        for (const table of tables) {
          await supabase
            .from(table)
            .update({
              tipalti_payment_method: event.paymentMethod,
              tipalti_last_synced: new Date().toISOString(),
            })
            .eq('tipalti_payee_id', event.payeeId)
        }

        await supabase.from('activity_log').insert({
          entity_type: 'tipalti_webhook',
          entity_id: event.payeeId,
          action: 'payee_updated',
          details: event,
          created_at: new Date().toISOString(),
        })
        break
      }

      default:
        console.log('Unhandled Tipalti webhook event:', event.eventType)
    }

    return NextResponse.json({ success: true, received: event.eventType })
  } catch (error) {
    console.error('Tipalti webhook error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// Health check / verification endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'tipalti-webhook',
    timestamp: new Date().toISOString()
  })
}
