// app/api/admin/payments/route.ts
// Admin payments API - fetches payees from Tipalti and payments from Supabase
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
  baseUrl: process.env.TIPALTI_ENVIRONMENT === 'production'
    ? 'https://api.tipalti.com'
    : 'https://api.sandbox.tipalti.com',
}

// Generate HMAC signature
function generateHmac(data: string): string {
  const hmac = crypto.createHmac('sha256', TIPALTI_CONFIG.apiKey)
  hmac.update(data)
  return hmac.digest('hex')
}

function getTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

// Known payee IDs - these should eventually come from your database
const KNOWN_PAYEES = [
  'RP-STOSH001',
  'RP-APRIL001', 
  'LP-PHENIX-EV',
  'LP-PHENIX-SBV',
  'LP-PHENIX-WH',
  'LP-PHENIX-CE',
  'LP-PHENIX-TC',
]

// Get payee details from Tipalti
async function getPayeeDetails(payeeId: string): Promise<any> {
  const timestamp = getTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const key = generateHmac(dataToSign)
  
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPayeeDetails>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${key}</tip:key>
    </tip:GetPayeeDetails>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(`${TIPALTI_CONFIG.baseUrl}/v11/PayeeFunctions.asmx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://Tipalti.org/GetPayeeDetails"',
      },
      body: soapEnvelope,
    })
    
    const text = await response.text()
    
    // Check for errors
    if (text.includes('Payee not found') || text.includes('Error')) {
      return null
    }
    
    // Parse response - handle various XML formats
    const getName = (xml: string) => {
      const match = xml.match(/<Name>([^<]*)<\/Name>/i) || 
                    xml.match(/<tip:Name>([^<]*)<\/tip:Name>/i)
      return match?.[1] || null
    }
    
    const getField = (xml: string, field: string) => {
      const regex = new RegExp(`<${field}>([^<]*)<\/${field}>`, 'i')
      const match = xml.match(regex)
      return match?.[1] || null
    }
    
    return {
      name: getName(text),
      company: getField(text, 'CompanyName'),
      email: getField(text, 'Email'),
      payeeStatus: getField(text, 'PayeeStatus'),
      isPayable: getField(text, 'IsPayable')?.toLowerCase() === 'true',
      paymentMethod: getField(text, 'PreferredPayerPaymentMethod'),
    }
  } catch (error) {
    console.error(`Error getting payee ${payeeId}:`, error)
    return null
  }
}

// Get partner type from payee ID prefix
function getPartnerType(payeeId: string): string {
  if (payeeId.startsWith('LP-')) return 'Location Partner'
  if (payeeId.startsWith('RP-')) return 'Referral Partner'
  if (payeeId.startsWith('CP-')) return 'Channel Partner'
  if (payeeId.startsWith('REL-')) return 'Relationship Partner'
  if (payeeId.startsWith('CON-')) return 'Contractor'
  return 'Partner'
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Get payments from Supabase
    let paymentsQuery = supabase
      .from('tipalti_payments')
      .select('*')
      .order('paid_at', { ascending: false, nullsFirst: false })
    
    if (startDate) {
      paymentsQuery = paymentsQuery.gte('paid_at', startDate)
    }
    if (endDate) {
      paymentsQuery = paymentsQuery.lte('paid_at', endDate)
    }
    
    const { data: payments, error: paymentsError } = await paymentsQuery
    
    if (paymentsError) {
      console.error('Supabase error:', paymentsError)
    }

    // Group payments by payee_id
    const paymentsByPayee = new Map<string, any[]>()
    for (const payment of (payments || [])) {
      const payeeId = payment.payee_id
      if (!paymentsByPayee.has(payeeId)) {
        paymentsByPayee.set(payeeId, [])
      }
      paymentsByPayee.get(payeeId)!.push(payment)
    }

    // Get unique payee IDs - combine from payments and known list
    const allPayeeIds = new Set([
      ...KNOWN_PAYEES,
      ...paymentsByPayee.keys()
    ])

    // Fetch live payee details from Tipalti
    const payees: any[] = []
    let totalPaid = 0
    let totalPending = 0
    let payableCount = 0

    for (const payeeId of allPayeeIds) {
      // Get live details from Tipalti
      const tipaltiDetails = await getPayeeDetails(payeeId)
      
      // Get payments for this payee
      const payeePayments = paymentsByPayee.get(payeeId) || []
      
      // Calculate totals
      const paidPayments = payeePayments.filter(p => 
        p.status === 'Paid' || p.status === 'paid' || p.status === 'Completed'
      )
      const pendingPayments = payeePayments.filter(p => 
        p.status === 'Pending' || p.status === 'pending' || p.status === 'Deferred'
      )
      
      const payeeTotalPaid = paidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      const payeePendingAmount = pendingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      
      // Get last payment
      const lastPayment = paidPayments[0] || payeePayments[0]
      const metadata = lastPayment?.metadata || {}
      
      // Build payee object
      const payeeData = {
        payeeId,
        name: tipaltiDetails?.name || metadata.payee_name || payeeId,
        email: tipaltiDetails?.email || metadata.email || '',
        company: tipaltiDetails?.company || metadata.company || null,
        paymentMethod: tipaltiDetails?.paymentMethod || metadata.payment_method || null,
        payeeStatus: tipaltiDetails?.payeeStatus || 'Active',
        isPayable: tipaltiDetails?.isPayable ?? true,
        totalPaid: payeeTotalPaid,
        pendingAmount: payeePendingAmount,
        lastPaymentDate: lastPayment?.paid_at || lastPayment?.submitted_at || null,
        lastPaymentAmount: lastPayment ? parseFloat(lastPayment.amount) || 0 : null,
        payments: payeePayments.map(p => ({
          refCode: p.tipalti_payment_id,
          amount: parseFloat(p.amount) || 0,
          status: p.status,
          paidAt: p.paid_at,
          submittedAt: p.submitted_at,
        })),
        invoices: [],
        partnerType: getPartnerType(payeeId),
      }
      
      // Only add if we got valid data from Tipalti or have payments
      if (tipaltiDetails || payeePayments.length > 0) {
        payees.push(payeeData)
        totalPaid += payeeTotalPaid
        totalPending += payeePendingAmount
        if (payeeData.isPayable) payableCount++
      }
    }

    // Sort by total paid descending
    payees.sort((a, b) => b.totalPaid - a.totalPaid)

    return NextResponse.json({
      success: true,
      payees,
      summary: {
        totalPayees: payees.length,
        totalPaid,
        totalPending,
        payableCount,
      },
    })

  } catch (error) {
    console.error('Admin payments error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to load payment data',
      details: String(error),
      payees: [],
      summary: {
        totalPayees: 0,
        totalPaid: 0,
        totalPending: 0,
        payableCount: 0,
      }
    }, { status: 500 })
  }
}
