// app/api/admin/payments/sync-rest/route.ts
// Sync payments from Tipalti using REST API with OAuth
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TIPALTI_REST_CONFIG = {
  clientId: process.env.TIPALTI_REST_CLIENT_ID || '',
  clientSecret: process.env.TIPALTI_REST_CLIENT_SECRET || '',
  tokenUrl: 'https://sso.tipalti.com/connect/token',
  // Correct base URL from documentation
  apiBaseUrl: 'https://api.tipalti.com',
}

// Get OAuth access token
async function getAccessToken(): Promise<{ token: string | null; error?: string }> {
  try {
    const credentials = Buffer.from(
      `${TIPALTI_REST_CONFIG.clientId}:${TIPALTI_REST_CONFIG.clientSecret}`
    ).toString('base64')

    const response = await fetch(TIPALTI_REST_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'tipalti.api.payment.read tipalti.api.payee.read tipalti.api.payment-batch.read',
      }),
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      console.error('Token error:', response.status, responseText)
      return { token: null, error: `Token error ${response.status}: ${responseText}` }
    }

    const data = JSON.parse(responseText)
    return { token: data.access_token }
  } catch (error) {
    console.error('Error getting access token:', error)
    return { token: null, error: String(error) }
  }
}

// GET /api/v1/payments - List all payments
async function getPayments(accessToken: string): Promise<{ data: any[]; error?: string; raw?: any }> {
  try {
    const response = await fetch(`${TIPALTI_REST_CONFIG.apiBaseUrl}/api/v1/payments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      console.error('Payments API error:', response.status, responseText)
      return { data: [], error: `Payments error ${response.status}: ${responseText.substring(0, 200)}` }
    }

    const data = JSON.parse(responseText)
    // Handle different response structures
    const payments = data.items || data.payments || data.data || (Array.isArray(data) ? data : [])
    return { data: payments, raw: data }
  } catch (error) {
    console.error('Error getting payments:', error)
    return { data: [], error: String(error) }
  }
}

// GET /api/v1/payment-batches - List payment batches
async function getPaymentBatches(accessToken: string): Promise<{ data: any[]; error?: string; raw?: any }> {
  try {
    const response = await fetch(`${TIPALTI_REST_CONFIG.apiBaseUrl}/api/v1/payment-batches`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      console.error('Payment batches API error:', response.status, responseText)
      return { data: [], error: `Batches error ${response.status}: ${responseText.substring(0, 200)}` }
    }

    const data = JSON.parse(responseText)
    const batches = data.items || data.batches || data.data || (Array.isArray(data) ? data : [])
    return { data: batches, raw: data }
  } catch (error) {
    console.error('Error getting payment batches:', error)
    return { data: [], error: String(error) }
  }
}

// GET /api/v1/payees - List all payees
async function getPayees(accessToken: string): Promise<{ data: any[]; error?: string; raw?: any }> {
  try {
    const response = await fetch(`${TIPALTI_REST_CONFIG.apiBaseUrl}/api/v1/payees`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      console.error('Payees API error:', response.status, responseText)
      return { data: [], error: `Payees error ${response.status}: ${responseText.substring(0, 200)}` }
    }

    const data = JSON.parse(responseText)
    const payees = data.items || data.payees || data.data || (Array.isArray(data) ? data : [])
    return { data: payees, raw: data }
  } catch (error) {
    console.error('Error getting payees:', error)
    return { data: [], error: String(error) }
  }
}

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

    // Check if credentials are configured
    if (!TIPALTI_REST_CONFIG.clientId || !TIPALTI_REST_CONFIG.clientSecret) {
      return NextResponse.json({ 
        error: 'Tipalti REST API credentials not configured',
        hint: 'Add TIPALTI_REST_CLIENT_ID and TIPALTI_REST_CLIENT_SECRET to environment variables'
      }, { status: 500 })
    }

    // Get OAuth token
    const tokenResult = await getAccessToken()
    if (!tokenResult.token) {
      return NextResponse.json({ 
        error: 'Failed to get Tipalti access token',
        details: tokenResult.error
      }, { status: 500 })
    }

    const accessToken = tokenResult.token

    // Fetch data from REST API
    const [paymentsResult, batchesResult, payeesResult] = await Promise.all([
      getPayments(accessToken),
      getPaymentBatches(accessToken),
      getPayees(accessToken),
    ])

    const saved: string[] = []
    const errors: string[] = []

    // Collect any API errors
    if (paymentsResult.error) errors.push(paymentsResult.error)
    if (batchesResult.error) errors.push(batchesResult.error)
    if (payeesResult.error) errors.push(payeesResult.error)

    // Save payments to Supabase
    for (const payment of paymentsResult.data) {
      try {
        const payeeId = payment.payeeId || payment.payee_id || payment.idap
        const amount = payment.amount?.amount || payment.amountSubmitted?.amount || payment.amount || 0
        const currency = payment.amount?.currency || payment.amountSubmitted?.currency || payment.currency || 'USD'
        const refCode = payment.refCode || payment.ref_code || payment.id || payment.paymentId

        if (!payeeId || !refCode) {
          errors.push(`Skipping payment - missing payeeId or refCode: ${JSON.stringify(payment).substring(0, 100)}`)
          continue
        }

        const { error: saveError } = await supabase
          .from('tipalti_payments')
          .upsert({
            payee_id: payeeId,
            amount: amount,
            currency: currency,
            status: payment.status || 'Unknown',
            paid_at: payment.paidDate || payment.valueDate || payment.paid_at || null,
            submitted_at: payment.submittedDate || payment.createdDate || payment.submitted_at || null,
            tipalti_payment_id: refCode,
            metadata: {
              source: 'rest_api_sync',
              raw: payment,
              synced_at: new Date().toISOString(),
            }
          }, {
            onConflict: 'tipalti_payment_id'
          })

        if (saveError) {
          errors.push(`Payment ${refCode}: ${saveError.message}`)
        } else {
          saved.push(refCode)
        }
      } catch (err) {
        errors.push(`Payment error: ${String(err)}`)
      }
    }

    return NextResponse.json({
      success: true,
      tokenObtained: true,
      apiBaseUrl: TIPALTI_REST_CONFIG.apiBaseUrl,
      payments: {
        count: paymentsResult.data.length,
        data: paymentsResult.data,
        raw: paymentsResult.raw,
        error: paymentsResult.error,
      },
      batches: {
        count: batchesResult.data.length,
        data: batchesResult.data,
        raw: batchesResult.raw,
        error: batchesResult.error,
      },
      payees: {
        count: payeesResult.data.length,
        data: payeesResult.data,
        raw: payeesResult.raw,
        error: payeesResult.error,
      },
      saved,
      errors,
    })

  } catch (error) {
    console.error('REST sync error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// GET endpoint to check status and test token
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const configured = !!(TIPALTI_REST_CONFIG.clientId && TIPALTI_REST_CONFIG.clientSecret)
  
  let tokenTest = null
  if (configured) {
    const tokenResult = await getAccessToken()
    tokenTest = {
      success: !!tokenResult.token,
      error: tokenResult.error,
    }
  }

  return NextResponse.json({
    status: 'Tipalti REST API sync endpoint',
    configured,
    clientIdSet: !!TIPALTI_REST_CONFIG.clientId,
    clientSecretSet: !!TIPALTI_REST_CONFIG.clientSecret,
    apiBaseUrl: TIPALTI_REST_CONFIG.apiBaseUrl,
    tokenTest,
    endpoints: {
      payments: '/api/v1/payments',
      paymentBatches: '/api/v1/payment-batches',
      payees: '/api/v1/payees',
    },
    instructions: configured 
      ? 'POST to this endpoint to sync payments via REST API'
      : 'Add TIPALTI_REST_CLIENT_ID and TIPALTI_REST_CLIENT_SECRET to environment variables'
  })
}
