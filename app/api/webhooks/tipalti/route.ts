// app/api/webhooks/tipalti/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WEBHOOK_SECRET = process.env.TIPALTI_WEBHOOK_SECRET || ''

// Verify webhook signature from Tipalti
function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('TIPALTI_WEBHOOK_SECRET not set - skipping verification')
    return true // Allow in dev, but log warning
  }
  
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
  hmac.update(payload)
  const expectedSignature = hmac.digest('base64')
  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-tipalti-signature') || ''

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      console.error('Invalid Tipalti webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(body)
    
    console.log('Tipalti webhook received:', data.eventType, data)

    // Handle different event types
    switch (data.eventType) {
      case 'PaymentCompleted':
      case 'payment.completed':
        await handlePaymentCompleted(data)
        break
        
      case 'PaymentFailed':
      case 'payment.failed':
        await handlePaymentFailed(data)
        break
        
      case 'PaymentSubmitted':
      case 'payment.submitted':
        await handlePaymentSubmitted(data)
        break
        
      case 'BillCreated':
      case 'bill.created':
        await handleBillCreated(data)
        break
        
      case 'BillPaid':
      case 'bill.paid':
        await handleBillPaid(data)
        break
        
      case 'PayeeOnboardingComplete':
      case 'payee.onboarding_complete':
        await handlePayeeOnboarded(data)
        break
        
      default:
        console.log('Unhandled Tipalti event type:', data.eventType)
    }

    return NextResponse.json({ success: true, received: data.eventType })

  } catch (error) {
    console.error('Tipalti webhook error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// Handle payment completed
async function handlePaymentCompleted(data: any) {
  const payment = data.payment || data
  
  const { error } = await supabase
    .from('tipalti_payments')
    .upsert({
      payee_id: payment.payeeId || payment.idap,
      amount: payment.amount || payment.paymentAmount,
      currency: payment.currency || 'USD',
      status: 'Paid',
      paid_at: payment.valueDate || payment.paymentDate || new Date().toISOString(),
      submitted_at: payment.submittedDate || payment.submissionDate,
      tipalti_payment_id: payment.refCode || payment.paymentRefCode,
      metadata: {
        payee_name: payment.payeeName,
        company: payment.companyName,
        ref_code: payment.refCode,
        payment_method: payment.paymentMethod,
        net_to_payee: payment.netAmount || payment.withdrawAmount,
        fee: payment.payeeFee || payment.transactionFee,
        transaction_ref: payment.transactionRef,
        raw_webhook: data
      }
    }, {
      onConflict: 'tipalti_payment_id'
    })

  if (error) {
    console.error('Error saving payment:', error)
  } else {
    console.log('Payment saved:', payment.refCode)
    
    // Update partner's last payment info
    await updatePartnerLastPayment(payment.payeeId || payment.idap, payment)
  }
}

// Handle payment failed
async function handlePaymentFailed(data: any) {
  const payment = data.payment || data
  
  const { error } = await supabase
    .from('tipalti_payments')
    .upsert({
      payee_id: payment.payeeId || payment.idap,
      amount: payment.amount || payment.paymentAmount,
      currency: payment.currency || 'USD',
      status: 'Failed',
      failed_at: new Date().toISOString(),
      failure_reason: payment.errorMessage || payment.failureReason,
      tipalti_payment_id: payment.refCode || payment.paymentRefCode,
      metadata: {
        payee_name: payment.payeeName,
        ref_code: payment.refCode,
        error: payment.errorMessage,
        raw_webhook: data
      }
    }, {
      onConflict: 'tipalti_payment_id'
    })

  if (error) {
    console.error('Error saving failed payment:', error)
  }
}

// Handle payment submitted (pending)
async function handlePaymentSubmitted(data: any) {
  const payment = data.payment || data
  
  const { error } = await supabase
    .from('tipalti_payments')
    .upsert({
      payee_id: payment.payeeId || payment.idap,
      amount: payment.amount || payment.paymentAmount,
      currency: payment.currency || 'USD',
      status: 'Submitted',
      submitted_at: new Date().toISOString(),
      tipalti_payment_id: payment.refCode || payment.paymentRefCode,
      metadata: {
        payee_name: payment.payeeName,
        ref_code: payment.refCode,
        payment_method: payment.paymentMethod,
        raw_webhook: data
      }
    }, {
      onConflict: 'tipalti_payment_id'
    })

  if (error) {
    console.error('Error saving submitted payment:', error)
  }
}

// Handle bill created
async function handleBillCreated(data: any) {
  const bill = data.bill || data
  
  console.log('Bill created:', bill.invoiceRefCode || bill.refCode)
  // You could store bills in a separate table if needed
}

// Handle bill paid
async function handleBillPaid(data: any) {
  const bill = data.bill || data
  
  console.log('Bill paid:', bill.invoiceRefCode || bill.refCode)
  // The PaymentCompleted event should handle the actual payment record
}

// Handle payee onboarding complete
async function handlePayeeOnboarded(data: any) {
  const payee = data.payee || data
  const payeeId = payee.idap || payee.payeeId
  
  console.log('Payee onboarded:', payeeId)
  
  // Update the partner's tipalti_status in the appropriate table
  // Try location_partners first
  let { error } = await supabase
    .from('location_partners')
    .update({ tipalti_status: 'payable' })
    .eq('tipalti_payee_id', payeeId)

  if (error) {
    // Try referral_partners
    await supabase
      .from('referral_partners')
      .update({ tipalti_status: 'payable' })
      .eq('tipalti_payee_id', payeeId)
  }
}

// Update partner's last payment date/amount
async function updatePartnerLastPayment(payeeId: string, payment: any) {
  const updateData = {
    last_payment_date: payment.valueDate || payment.paymentDate || new Date().toISOString(),
    last_payment_amount: payment.amount || payment.paymentAmount
  }

  // Try location_partners first
  const { error: lpError } = await supabase
    .from('location_partners')
    .update(updateData)
    .eq('tipalti_payee_id', payeeId)

  if (lpError) {
    // Try referral_partners
    await supabase
      .from('referral_partners')
      .update(updateData)
      .eq('tipalti_payee_id', payeeId)
  }
}

// GET endpoint to verify webhook is working
export async function GET() {
  return NextResponse.json({ 
    status: 'Tipalti webhook endpoint active',
    timestamp: new Date().toISOString()
  })
}
