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

function generateHmac(data: string): string {
  const hmac = crypto.createHmac('sha256', TIPALTI_CONFIG.apiKey)
  hmac.update(data)
  return hmac.digest('hex')
}

function getTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

// Known payees with their expected details (fallback if API fails)
const KNOWN_PAYEES: Record<string, { name: string; email: string; company?: string }> = {
  'RP-STOSH001': { name: 'Stosh Cohen', email: 'smc92589@gmail.com' },
  'RP-APRIL001': { name: 'April Economides', email: 'aprileconomides@gmail.com' },
  'LP-PHENIX-EV': { name: 'Frank Lopez', email: 'flopez@phenixsalonsuites.com', company: 'Phenix-East Village' },
  'LP-PHENIX-SBV': { name: 'Frank Lopez', email: 'phenixsealbeachvillage@gmail.com', company: 'Phenix Seal Beach Village, LP' },
  'LP-PHENIX-WH': { name: 'Frank Lopez', email: 'phenixwhittier@gmail.com', company: 'Phenix Whittier, LP' },
  'LP-PHENIX-CE': { name: 'Frank Lopez', email: 'phenixcypresseast@gmail.com', company: 'Phenix Cypress East, LP' },
  'LP-PHENIX-TC': { name: 'Frank Lopez', email: 'phenixtorrancecrossroads@gmail.com', company: 'Phenix Torrance Crossroads, LP' },
}

// Historical payment data (from Tipalti CSV export)
const HISTORICAL_PAYMENTS: Record<string, { amount: number; status: string; paidAt: string }[]> = {
  'RP-STOSH001': [
    { amount: 1.00, status: 'Deferred', paidAt: '' },
    { amount: 3.00, status: 'Paid', paidAt: '2025-10-16' },
  ],
  'RP-APRIL001': [
    { amount: 200.00, status: 'Paid', paidAt: '2025-11-21' },
  ],
  'LP-PHENIX-EV': [
    { amount: 200.00, status: 'Paid', paidAt: '2025-12-12' },
  ],
  'LP-PHENIX-SBV': [
    { amount: 200.00, status: 'Paid', paidAt: '2025-12-12' },
  ],
  'LP-PHENIX-WH': [
    { amount: 200.00, status: 'Paid', paidAt: '2025-12-12' },
  ],
  'LP-PHENIX-CE': [
    { amount: 200.00, status: 'Paid', paidAt: '2025-12-12' },
  ],
  'LP-PHENIX-TC': [
    { amount: 200.00, status: 'Paid', paidAt: '2025-12-12' },
  ],
}

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
    if (text.includes('Payee not found') || text.includes('<errorCode>') || text.includes('Fault')) {
      console.log(`Payee ${payeeId} not found in Tipalti`)
      return null
    }
    
    // Better XML parsing - try multiple patterns
    const extractField = (xml: string, fieldName: string): string | null => {
      // Try with namespace prefix
      let match = xml.match(new RegExp(`<tip:${fieldName}>([^<]*)</tip:${fieldName}>`, 'i'))
      if (match) return match[1]
      
      // Try without namespace
      match = xml.match(new RegExp(`<${fieldName}>([^<]*)</${fieldName}>`, 'i'))
      if (match) return match[1]
      
      // Try with a]> pattern for Name which might have special chars
      match = xml.match(new RegExp(`<${fieldName}[^>]*>([^<]*)</${fieldName}>`, 'i'))
      if (match) return match[1]
      
      return null
    }
    
    const name = extractField(text, 'Name')
    const firstName = extractField(text, 'FirstName')
    const lastName = extractField(text, 'LastName')
    const company = extractField(text, 'CompanyName')
    const email = extractField(text, 'Email')
    const payeeStatus = extractField(text, 'PayeeStatus')
    const isPayableStr = extractField(text, 'IsPayable')
    const paymentMethod = extractField(text, 'PreferredPayerPaymentMethod')
    
    // Construct full name
    let fullName = name
    if (!fullName && (firstName || lastName)) {
      fullName = [firstName, lastName].filter(Boolean).join(' ')
    }
    
    return {
      name: fullName,
      company,
      email,
      payeeStatus: payeeStatus || 'Active',
      isPayable: isPayableStr?.toLowerCase() === 'true',
      paymentMethod,
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
    let paymentsFromDb: any[] = []
    try {
      let query = supabase
        .from('tipalti_payments')
        .select('*')
        .order('paid_at', { ascending: false, nullsFirst: false })
      
      if (startDate) {
        query = query.gte('paid_at', startDate)
      }
      if (endDate) {
        query = query.lte('paid_at', endDate)
      }
      
      const { data, error } = await query
      if (!error && data) {
        paymentsFromDb = data
      }
    } catch (err) {
      console.error('Error fetching from Supabase:', err)
    }

    // Group DB payments by payee_id
    const dbPaymentsByPayee = new Map<string, any[]>()
    for (const payment of paymentsFromDb) {
      const payeeId = payment.payee_id
      if (!dbPaymentsByPayee.has(payeeId)) {
        dbPaymentsByPayee.set(payeeId, [])
      }
      dbPaymentsByPayee.get(payeeId)!.push(payment)
    }

    // Build payee list
    const payees: any[] = []
    let totalPaid = 0
    let totalPending = 0
    let payableCount = 0

    for (const [payeeId, fallbackInfo] of Object.entries(KNOWN_PAYEES)) {
      // Get live details from Tipalti
      const tipaltiDetails = await getPayeeDetails(payeeId)
      
      // Get payments - first from DB, then fallback to historical
      let payments = dbPaymentsByPayee.get(payeeId) || []
      const historicalPayments = HISTORICAL_PAYMENTS[payeeId] || []
      
      // Calculate totals from historical if no DB payments
      let payeeTotalPaid = 0
      let payeePendingAmount = 0
      let lastPaymentDate: string | null = null
      let lastPaymentAmount: number | null = null
      
      if (payments.length > 0) {
        // Use DB data
        const paidPayments = payments.filter(p => 
          p.status === 'Paid' || p.status === 'paid' || p.status === 'Completed'
        )
        const pendingPayments = payments.filter(p => 
          p.status === 'Pending' || p.status === 'pending' || p.status === 'Deferred'
        )
        payeeTotalPaid = paidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        payeePendingAmount = pendingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        
        const lastPayment = paidPayments[0] || payments[0]
        lastPaymentDate = lastPayment?.paid_at || lastPayment?.submitted_at || null
        lastPaymentAmount = lastPayment ? parseFloat(lastPayment.amount) || 0 : null
      } else if (historicalPayments.length > 0) {
        // Use historical data
        for (const hp of historicalPayments) {
          if (hp.status === 'Paid') {
            payeeTotalPaid += hp.amount
            if (!lastPaymentDate || hp.paidAt > lastPaymentDate) {
              lastPaymentDate = hp.paidAt
              lastPaymentAmount = hp.amount
            }
          } else {
            payeePendingAmount += hp.amount
          }
        }
      }
      
      // Determine if payable (from Tipalti or default to true for known payees)
      const isPayable = tipaltiDetails?.isPayable ?? true
      
      // Build payee object
      const payeeData = {
        payeeId,
        name: tipaltiDetails?.name || fallbackInfo.name,
        email: tipaltiDetails?.email || fallbackInfo.email,
        company: tipaltiDetails?.company || fallbackInfo.company || null,
        paymentMethod: tipaltiDetails?.paymentMethod || 'ACH',
        payeeStatus: tipaltiDetails?.payeeStatus || 'Active',
        isPayable,
        totalPaid: payeeTotalPaid,
        pendingAmount: payeePendingAmount,
        lastPaymentDate,
        lastPaymentAmount,
        payments: historicalPayments.map((hp, i) => ({
          refCode: `${payeeId}-${i}`,
          amount: hp.amount,
          status: hp.status,
          paidAt: hp.paidAt || null,
        })),
        invoices: [],
        partnerType: getPartnerType(payeeId),
      }
      
      payees.push(payeeData)
      totalPaid += payeeTotalPaid
      totalPending += payeePendingAmount
      if (isPayable) payableCount++
    }

    // Sort by total paid descending, then by name
    payees.sort((a, b) => {
      if (b.totalPaid !== a.totalPaid) return b.totalPaid - a.totalPaid
      return a.name.localeCompare(b.name)
    })

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
