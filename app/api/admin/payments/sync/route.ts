// app/api/admin/payments/sync/route.ts
// Comprehensive Tipalti payment sync using multiple SOAP endpoints
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
  // Use sandbox for testing, production for live
  baseUrl: process.env.TIPALTI_ENVIRONMENT === 'production'
    ? 'https://api.tipalti.com'
    : 'https://api.sandbox.tipalti.com',
}

// REST API config (if available)
const TIPALTI_REST_CONFIG = {
  clientId: process.env.TIPALTI_REST_CLIENT_ID,
  clientSecret: process.env.TIPALTI_REST_CLIENT_SECRET,
  baseUrl: process.env.TIPALTI_ENVIRONMENT === 'production'
    ? 'https://api.tipalti.com'
    : 'https://api.sandbox.tipalti.com',
}

// Generate HMAC signature for SOAP calls
function generateHmac(data: string): string {
  const hmac = crypto.createHmac('sha256', TIPALTI_CONFIG.apiKey)
  hmac.update(data)
  return hmac.digest('hex')
}

function getTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

// Known payee IDs from your Tipalti account
const KNOWN_PAYEES = [
  'RP-STOSH001',
  'RP-APRIL001',
  'LP-PHENIX-EV',
  'LP-PHENIX-SBV',
  'LP-PHENIX-WH',
  'LP-PHENIX-CE',
  'LP-PHENIX-TC',
]

// SOAP: Get last payment details for a payee
async function getLastPaymentDetails(payeeId: string): Promise<any> {
  const timestamp = getTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const key = generateHmac(dataToSign)
  
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetLastPaymentDetailsByIdap>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${key}</tip:key>
    </tip:GetLastPaymentDetailsByIdap>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(`${TIPALTI_CONFIG.baseUrl}/v11/PayeeFunctions.asmx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://Tipalti.org/GetLastPaymentDetailsByIdap"',
      },
      body: soapEnvelope,
    })
    
    const text = await response.text()
    
    // Parse the SOAP response
    const refCodeMatch = text.match(/<RefCode>([^<]+)<\/RefCode>/i)
    const statusMatch = text.match(/<PaymentStatus>([^<]+)<\/PaymentStatus>/i)
    const amountMatch = text.match(/<PaymentAmountInWithdrawCurrency>([^<]+)<\/PaymentAmountInWithdrawCurrency>/i)
    const dateMatch = text.match(/<LastSubmissionDate>([^<]+)<\/LastSubmissionDate>/i)
    const valueDateMatch = text.match(/<ValueDate>([^<]+)<\/ValueDate>/i)
    const paymentMethodMatch = text.match(/<PaymentMethod>([^<]+)<\/PaymentMethod>/i)
    
    return {
      payeeId,
      refCode: refCodeMatch?.[1] || null,
      status: statusMatch?.[1] || null,
      amount: amountMatch?.[1] ? parseFloat(amountMatch[1]) : null,
      submittedDate: dateMatch?.[1] || null,
      valueDate: valueDateMatch?.[1] || null,
      paymentMethod: paymentMethodMatch?.[1] || null,
      rawResponse: text.substring(0, 500), // For debugging
    }
  } catch (error) {
    console.error(`Error getting payment for ${payeeId}:`, error)
    return { payeeId, error: String(error) }
  }
}

// SOAP: Get payee details (works!)
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
    
    // Parse response
    const nameMatch = text.match(/<Name>([^<]+)<\/Name>/i)
    const companyMatch = text.match(/<CompanyName>([^<]+)<\/CompanyName>/i)
    const emailMatch = text.match(/<Email>([^<]+)<\/Email>/i)
    const statusMatch = text.match(/<PayeeStatus>([^<]+)<\/PayeeStatus>/i)
    const isPayableMatch = text.match(/<IsPayable>([^<]+)<\/IsPayable>/i)
    const paymentMethodMatch = text.match(/<PreferredPayerPaymentMethod>([^<]+)<\/PreferredPayerPaymentMethod>/i)
    
    return {
      payeeId,
      name: nameMatch?.[1] || null,
      company: companyMatch?.[1] || null,
      email: emailMatch?.[1] || null,
      payeeStatus: statusMatch?.[1] || null,
      isPayable: isPayableMatch?.[1]?.toLowerCase() === 'true',
      paymentMethod: paymentMethodMatch?.[1] || null,
    }
  } catch (error) {
    console.error(`Error getting payee ${payeeId}:`, error)
    return { payeeId, error: String(error) }
  }
}

// SOAP: Get updated payments (ref codes of POs updated since timestamp)
async function getUpdatedPayments(sinceTimestamp?: string): Promise<any> {
  const timestamp = getTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${timestamp}`
  const key = generateHmac(dataToSign)
  
  // Default to 30 days ago if no timestamp provided
  const since = sinceTimestamp || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetUpdatedPayments>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${key}</tip:key>
      <tip:changedSince>${since}</tip:changedSince>
    </tip:GetUpdatedPayments>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(`${TIPALTI_CONFIG.baseUrl}/v11/PayerFunctions.asmx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://Tipalti.org/GetUpdatedPayments"',
      },
      body: soapEnvelope,
    })
    
    const text = await response.text()
    
    // Parse ref codes from response
    const refCodes: string[] = []
    const refCodeMatches = text.matchAll(/<string>([^<]+)<\/string>/gi)
    for (const match of refCodeMatches) {
      refCodes.push(match[1])
    }
    
    return {
      success: !text.includes('Error'),
      refCodes,
      rawResponse: text.substring(0, 1000),
    }
  } catch (error) {
    console.error('Error getting updated payments:', error)
    return { success: false, error: String(error) }
  }
}

// SOAP: Get balances (payer funds)
async function getBalances(): Promise<any> {
  const timestamp = getTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${timestamp}`
  const key = generateHmac(dataToSign)
  
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetBalances>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${key}</tip:key>
    </tip:GetBalances>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(`${TIPALTI_CONFIG.baseUrl}/v11/PayerFunctions.asmx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://Tipalti.org/GetBalances"',
      },
      body: soapEnvelope,
    })
    
    const text = await response.text()
    
    // Parse balance info
    const balances: any[] = []
    const amountMatches = text.matchAll(/<Amount>([^<]+)<\/Amount>/gi)
    const currencyMatches = text.matchAll(/<Currency>([^<]+)<\/Currency>/gi)
    
    const amounts = [...amountMatches].map(m => m[1])
    const currencies = [...currencyMatches].map(m => m[1])
    
    for (let i = 0; i < amounts.length; i++) {
      balances.push({
        amount: parseFloat(amounts[i]),
        currency: currencies[i] || 'USD',
      })
    }
    
    return { success: true, balances }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// REST API: Get OAuth token
async function getRestAccessToken(): Promise<string | null> {
  if (!TIPALTI_REST_CONFIG.clientId || !TIPALTI_REST_CONFIG.clientSecret) {
    return null
  }
  
  try {
    const credentials = Buffer.from(
      `${TIPALTI_REST_CONFIG.clientId}:${TIPALTI_REST_CONFIG.clientSecret}`
    ).toString('base64')
    
    const response = await fetch(`${TIPALTI_REST_CONFIG.baseUrl}/api/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
    
    const data = await response.json()
    return data.access_token || null
  } catch (error) {
    console.error('Error getting REST token:', error)
    return null
  }
}

// REST API: Get payments list
async function getRestPayments(accessToken: string): Promise<any[]> {
  try {
    const response = await fetch(`${TIPALTI_REST_CONFIG.baseUrl}/api/v1/payments?limit=100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('REST payments error:', error)
      return []
    }
    
    const data = await response.json()
    return data.data || data.payments || data || []
  } catch (error) {
    console.error('Error getting REST payments:', error)
    return []
  }
}

// REST API: Get payment batches
async function getRestBatches(accessToken: string): Promise<any[]> {
  try {
    const response = await fetch(`${TIPALTI_REST_CONFIG.baseUrl}/api/v1/payment-batches?limit=100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data.data || data.batches || data || []
  } catch (error) {
    console.error('Error getting REST batches:', error)
    return []
  }
}

// REST API: Get payees list  
async function getRestPayees(accessToken: string): Promise<any[]> {
  try {
    const response = await fetch(`${TIPALTI_REST_CONFIG.baseUrl}/api/v1/payees?limit=100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data.data || data.payees || data || []
  } catch (error) {
    console.error('Error getting REST payees:', error)
    return []
  }
}

// Main sync function
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    soap: {
      payees: [],
      payments: [],
      updatedPayments: null,
      balances: null,
    },
    rest: {
      tokenObtained: false,
      payments: [],
      batches: [],
      payees: [],
    },
    saved: [],
    errors: [],
  }

  try {
    // 1. SOAP: Get payee details and last payments for all known payees
    console.log('Fetching SOAP data for known payees...')
    
    for (const payeeId of KNOWN_PAYEES) {
      // Get payee details (this works!)
      const payeeDetails = await getPayeeDetails(payeeId)
      results.soap.payees.push(payeeDetails)
      
      // Get last payment details
      const paymentDetails = await getLastPaymentDetails(payeeId)
      results.soap.payments.push(paymentDetails)
      
      // Save to Supabase if we have payment data
      if (paymentDetails.refCode && !paymentDetails.error) {
        try {
          const { error: saveError } = await supabase
            .from('tipalti_payments')
            .upsert({
              payee_id: payeeId,
              amount: paymentDetails.amount || 0,
              currency: 'USD',
              status: paymentDetails.status || 'Unknown',
              paid_at: paymentDetails.valueDate ? new Date(paymentDetails.valueDate).toISOString() : null,
              submitted_at: paymentDetails.submittedDate ? new Date(paymentDetails.submittedDate).toISOString() : null,
              tipalti_payment_id: paymentDetails.refCode,
              metadata: {
                source: 'soap_sync',
                payee_name: payeeDetails.name,
                company: payeeDetails.company,
                payment_method: paymentDetails.paymentMethod || payeeDetails.paymentMethod,
                synced_at: new Date().toISOString(),
              },
            }, {
              onConflict: 'tipalti_payment_id',
            })
          
          if (saveError) {
            results.errors.push(`Save ${payeeId}: ${saveError.message}`)
          } else {
            results.saved.push(payeeId)
          }
        } catch (err) {
          results.errors.push(`Save error ${payeeId}: ${String(err)}`)
        }
      }
    }

    // 2. SOAP: Get updated payments (ref codes)
    console.log('Fetching updated payments...')
    results.soap.updatedPayments = await getUpdatedPayments()

    // 3. SOAP: Get balances
    console.log('Fetching balances...')
    results.soap.balances = await getBalances()

    // 4. REST API: Try to get additional data
    console.log('Attempting REST API...')
    const accessToken = await getRestAccessToken()
    
    if (accessToken) {
      results.rest.tokenObtained = true
      
      // Get REST data in parallel
      const [payments, batches, payees] = await Promise.all([
        getRestPayments(accessToken),
        getRestBatches(accessToken),
        getRestPayees(accessToken),
      ])
      
      results.rest.payments = payments
      results.rest.batches = batches
      results.rest.payees = payees
      
      // Save REST payments to Supabase
      for (const payment of payments) {
        try {
          const payeeId = payment.payeeId || payment.payee_id || payment.idap
          const amount = payment.amount?.amount || payment.amountSubmitted?.amount || payment.amount || 0
          const refCode = payment.refCode || payment.id || payment.paymentId
          
          if (payeeId && refCode) {
            const { error: saveError } = await supabase
              .from('tipalti_payments')
              .upsert({
                payee_id: payeeId,
                amount: typeof amount === 'number' ? amount : parseFloat(amount) || 0,
                currency: payment.amount?.currency || payment.currency || 'USD',
                status: payment.status || 'Unknown',
                paid_at: payment.paidDate || payment.valueDate || null,
                submitted_at: payment.submittedDate || payment.createdDate || null,
                tipalti_payment_id: refCode,
                metadata: {
                  source: 'rest_api_sync',
                  raw: payment,
                  synced_at: new Date().toISOString(),
                },
              }, {
                onConflict: 'tipalti_payment_id',
              })
            
            if (!saveError) {
              results.saved.push(`REST:${payeeId}`)
            }
          }
        } catch (err) {
          results.errors.push(`REST save error: ${String(err)}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.saved.length,
      ...results,
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      ...results,
    }, { status: 500 })
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const soapConfigured = !!TIPALTI_CONFIG.apiKey
  const restConfigured = !!(TIPALTI_REST_CONFIG.clientId && TIPALTI_REST_CONFIG.clientSecret)

  // Get last sync info from Supabase
  const { data: recentPayments } = await supabase
    .from('tipalti_payments')
    .select('payee_id, amount, status, paid_at, metadata')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    status: 'Tipalti Comprehensive Sync Endpoint',
    configuration: {
      soap: {
        configured: soapConfigured,
        payerName: TIPALTI_CONFIG.payerName,
        environment: process.env.TIPALTI_ENVIRONMENT || 'sandbox',
      },
      rest: {
        configured: restConfigured,
        clientIdSet: !!TIPALTI_REST_CONFIG.clientId,
        clientSecretSet: !!TIPALTI_REST_CONFIG.clientSecret,
      },
    },
    knownPayees: KNOWN_PAYEES,
    recentPayments,
    instructions: {
      sync: 'POST to this endpoint to sync all payment data',
      debug: 'GET /api/admin/payments/debug?payeeId=LP-PHENIX-EV to debug specific payee',
    },
  })
}
