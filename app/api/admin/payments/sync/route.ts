// app/api/admin/payments/sync/route.ts
// Sync historical payments from Tipalti to Supabase
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TIPALTI_CONFIG = {
  payerName: process.env.TIPALTI_PAYER_NAME || 'SkyYield',
  apiKey: process.env.TIPALTI_API_KEY || '',
  soapPayeeUrl: 'https://api.tipalti.com/v6/PayeeFunctions.asmx',
  soapPayerUrl: 'https://api.tipalti.com/v6/PayerFunctions.asmx',
}

function generateHmacSignature(dataToSign: string): string {
  const hmac = crypto.createHmac('sha256', TIPALTI_CONFIG.apiKey)
  hmac.update(dataToSign)
  return hmac.digest('hex')
}

function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

// Known payee IDs
const PAYEE_IDS = [
  'RP-STOSH001',
  'RP-APRIL001',
  'LP-PHENIX-EV',
  'LP-PHENIX-SBV',
  'LP-PHENIX-WH',
  'LP-PHENIX-CE',
  'LP-PHENIX-TC',
]

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const results: any[] = []

    // For each payee, get their last payment details
    for (const payeeId of PAYEE_IDS) {
      try {
        // Get last payment for this payee
        const lastPayment = await getLastPaymentDetails(payeeId)
        if (lastPayment) {
          results.push({
            payeeId,
            ...lastPayment,
            source: 'GetLastPaymentDetailsByIdap'
          })

          // If we got a refCode, get extended details
          if (lastPayment.refCode) {
            const extendedDetails = await getExtendedPODetails(lastPayment.refCode)
            if (extendedDetails) {
              // Save to Supabase
              await savePaymentToSupabase(payeeId, { ...lastPayment, ...extendedDetails })
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching payment for ${payeeId}:`, err)
      }
    }

    // Also try PaymentsBetweenDates for aggregate data
    const startDate = new Date('2025-01-01')
    const endDate = new Date()
    const aggregateData = await getPaymentsBetweenDates(startDate, endDate)

    return NextResponse.json({
      success: true,
      synced: results.length,
      results,
      aggregate: aggregateData
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// Get last payment details for a payee
async function getLastPaymentDetails(payeeId: string): Promise<any | null> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetLastPaymentDetailsByIdap>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
    </tip:GetLastPaymentDetailsByIdap>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://Tipalti.org/GetLastPaymentDetailsByIdap',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    console.log(`GetLastPaymentDetailsByIdap ${payeeId}:`, responseText.substring(0, 500))

    // Parse response
    const extractValue = (tag: string) => {
      const match = responseText.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'))
      return match?.[1] || null
    }

    const refCode = extractValue('RefCode')
    if (!refCode) return null

    return {
      refCode,
      lastSubmissionDate: extractValue('LastSubmissionDate'),
      status: extractValue('Status'),
      alerts: extractValue('Alerts'),
      valueDate: extractValue('ValueDate'),
      paymentAmount: parseFloat(extractValue('PaymentAmountInWithdrawCurrency') || '0'),
    }
  } catch (error) {
    console.error(`Error getting last payment for ${payeeId}:`, error)
    return null
  }
}

// Get extended payment order details by refCode
async function getExtendedPODetails(refCode: string): Promise<any | null> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${timestamp}${refCode}`
  const signature = generateHmacSignature(dataToSign)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetExtendedPODetails>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
      <tip:poRefCode>${refCode}</tip:poRefCode>
    </tip:GetExtendedPODetails>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://Tipalti.org/GetExtendedPODetails',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    console.log(`GetExtendedPODetails ${refCode}:`, responseText.substring(0, 500))

    const extractValue = (tag: string) => {
      const match = responseText.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'))
      return match?.[1] || null
    }

    return {
      submissionDate: extractValue('SubmittionDate') || extractValue('SubmissionDate'),
      amountSubmitted: parseFloat(extractValue('AmountSubmitted') || '0'),
      amountSubmittedCurrency: extractValue('AmountSubmittedCurrency'),
      paymentMethod: extractValue('PaymentMethod'),
      status: extractValue('Status'),
      payerFees: parseFloat(extractValue('PayerFees') || '0'),
      payeeFees: parseFloat(extractValue('PayeeFees') || '0'),
      withdrawCurrency: extractValue('WithdrawCurrency'),
      withdrawAmount: parseFloat(extractValue('WithdrawAmount') || '0'),
      valueDate: extractValue('ValueDate'),
      txnReference: extractValue('TxnReference'),
      paymentAmount: parseFloat(extractValue('PaymentAmount') || '0'),
      paymentCurrency: extractValue('PaymentCurrency'),
    }
  } catch (error) {
    console.error(`Error getting PO details for ${refCode}:`, error)
    return null
  }
}

// Get aggregate payment data between dates
async function getPaymentsBetweenDates(startDate: Date, endDate: Date): Promise<any | null> {
  const timestamp = generateTimestamp()
  const fromDateStr = startDate.toISOString().split('T')[0]
  const toDateStr = endDate.toISOString().split('T')[0]
  const dataToSign = `${TIPALTI_CONFIG.payerName}${timestamp}${fromDateStr}`
  const signature = generateHmacSignature(dataToSign)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:PaymentsBetweenDates>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
      <tip:from>${fromDateStr}</tip:from>
      <tip:to>${toDateStr}</tip:to>
    </tip:PaymentsBetweenDates>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://Tipalti.org/PaymentsBetweenDates',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    console.log('PaymentsBetweenDates:', responseText.substring(0, 1000))

    const extractValue = (tag: string) => {
      const match = responseText.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'))
      return match?.[1] || null
    }

    return {
      submitted: parseFloat(extractValue('Submitted') || extractValue('submitted') || '0'),
      pending: parseFloat(extractValue('Pending') || extractValue('pending') || '0'),
      rejected: parseFloat(extractValue('Rejected') || extractValue('rejected') || '0'),
      rawResponse: responseText.substring(0, 500)
    }
  } catch (error) {
    console.error('Error getting payments between dates:', error)
    return null
  }
}

// Save payment to Supabase
async function savePaymentToSupabase(payeeId: string, payment: any) {
  const { error } = await supabase
    .from('tipalti_payments')
    .upsert({
      payee_id: payeeId,
      amount: payment.amountSubmitted || payment.paymentAmount,
      currency: payment.paymentCurrency || payment.amountSubmittedCurrency || 'USD',
      status: payment.status === 'Paid' ? 'Paid' : payment.status,
      paid_at: payment.valueDate,
      submitted_at: payment.submissionDate || payment.lastSubmissionDate,
      tipalti_payment_id: payment.refCode,
      metadata: {
        ref_code: payment.refCode,
        payment_method: payment.paymentMethod,
        net_to_payee: payment.withdrawAmount,
        payer_fees: payment.payerFees,
        payee_fees: payment.payeeFees,
        txn_reference: payment.txnReference,
      }
    }, {
      onConflict: 'tipalti_payment_id'
    })

  if (error) {
    console.error('Error saving payment:', error)
  }
}

// GET endpoint to check status
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    status: 'Tipalti sync endpoint ready',
    payeeIds: PAYEE_IDS,
    instructions: 'POST to this endpoint to sync payments from Tipalti'
  })
}
