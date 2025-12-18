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
  apiBaseUrl: 'https://api.tipalti.com/v1',
}

// Get OAuth access token
async function getAccessToken(): Promise<string | null> {
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

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token error:', response.status, errorText)
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting access token:', error)
    return null
  }
}

// Get all payments from REST API
async function getPayments(accessToken: string): Promise<any[]> {
  try {
    const response = await fetch(`${TIPALTI_REST_CONFIG.apiBaseUrl}/payments?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Payments API error:', response.status, errorText)
      return []
    }

    const data = await response.json()
    return data.items || data.payments || data || []
  } catch (error) {
    console.error('Error getting payments:', error)
    return []
  }
}

// Get payment batches from REST API
async function getPaymentBatches(accessToken: string): Promise<any[]> {
  try {
    const response = await fetch(`${TIPALTI_REST_CONFIG.apiBaseUrl}/payment-batches?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Payment batches API error:', response.status, errorText)
      return []
    }

    const data = await response.json()
    return data.items || data.batches || data || []
  } catch (error) {
    console.error('Error getting payment batches:', error)
    return []
  }
}

// Get payees from REST API
async function getPayees(accessToken: string): Promise<any[]> {
  try {
    const response = await fetch(`${TIPALTI_REST_CONFIG.apiBaseUrl}/payees?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Payees API error:', response.status, errorText)
      return []
    }

    const data = await response.json()
    return data.items || data.payees || data || []
  } catch (error) {
    console.error('Error getting payees:', error)
    return []
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
    const accessToken = await getAccessToken()
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Failed to get Tipalti access token',
        hint: 'Check client ID and secret'
      }, { status: 500 })
    }

    // Fetch data from REST API
    const [payments, batches, payees] = await Promise.all([
      getPayments(accessToken),
      getPaymentBatches(accessToken),
      getPayees(accessToken),
    ])

    const saved: string[] = []
    const errors: string[] = []

    // Save payments to Supabase
    for (const payment of payments) {
      try {
        const { error: saveError } = await supabase
          .from('tipalti_payments')
          .upsert({
            payee_id: payment.payeeId || payment.payee_id,
            amount: payment.amount?.amount || payment.amountSubmitted?.amount || payment.amount || 0,
            currency: payment.amount?.currency || payment.amountSubmitted?.currency || 'USD',
            status: payment.status || 'Unknown',
            paid_at: payment.paidDate || payment.valueDate || null,
            submitted_at: payment.submittedDate || payment.createdDate || null,
            tipalti_payment_id: payment.refCode || payment.id || payment.paymentId,
            metadata: {
              source: 'rest_api_sync',
              raw: payment,
              synced_at: new Date().toISOString(),
            }
          }, {
            onConflict: 'tipalti_payment_id'
          })

        if (saveError) {
          errors.push(`Payment ${payment.refCode}: ${saveError.message}`)
        } else {
          saved.push(payment.refCode || payment.id)
        }
      } catch (err) {
        errors.push(`Payment error: ${String(err)}`)
      }
    }

    return NextResponse.json({
      success: true,
      tokenObtained: !!accessToken,
      payments: {
        count: payments.length,
        data: payments,
      },
      batches: {
        count: batches.length,
        data: batches,
      },
      payees: {
        count: payees.length,
        data: payees,
      },
      saved,
      errors,
    })

  } catch (error) {
    console.error('REST sync error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// GET endpoint to check status
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const configured = !!(TIPALTI_REST_CONFIG.clientId && TIPALTI_REST_CONFIG.clientSecret)

  return NextResponse.json({
    status: 'Tipalti REST API sync endpoint',
    configured,
    clientIdSet: !!TIPALTI_REST_CONFIG.clientId,
    clientSecretSet: !!TIPALTI_REST_CONFIG.clientSecret,
    instructions: configured 
      ? 'POST to this endpoint to sync payments via REST API'
      : 'Add TIPALTI_REST_CLIENT_ID and TIPALTI_REST_CLIENT_SECRET to environment variables'
  })
}
