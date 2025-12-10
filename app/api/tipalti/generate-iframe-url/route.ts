import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Tipalti configuration - uses environment variables
const TIPALTI_CONFIG = {
  sandbox: {
    baseUrl: 'https://ui2.sandbox.tipalti.com',
    payerName: process.env.TIPALTI_PAYER_NAME || '',
    apiKey: process.env.TIPALTI_API_KEY || ''
  },
  production: {
    baseUrl: 'https://ui2.tipalti.com',
    payerName: process.env.TIPALTI_PAYER_NAME || '',
    apiKey: process.env.TIPALTI_API_KEY || ''
  }
}

interface IFrameRequest {
  payeeId: string
  viewType: 'paymentHistory' | 'invoiceHistory' | 'paymentDetails'
  environment: 'sandbox' | 'production'
}

/**
 * Generate HMAC-SHA256 signature for Tipalti authentication
 * Per Tipalti docs: sign payerName + timestamp + payeeId
 */
function generateHmacSignature(data: string, apiKey: string): string {
  const hmac = crypto.createHmac('sha256', apiKey)
  hmac.update(data)
  return hmac.digest('hex')
}

/**
 * Get current Unix timestamp (seconds)
 */
function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

export async function POST(request: NextRequest) {
  try {
    const body: IFrameRequest = await request.json()
    const { payeeId, viewType, environment = 'production' } = body

    // Validate payeeId
    if (!payeeId || payeeId.trim() === '') {
      return NextResponse.json(
        { error: 'Payee ID is required' },
        { status: 400 }
      )
    }

    const config = TIPALTI_CONFIG[environment]
    
    // Check for required config
    if (!config.payerName) {
      console.error('TIPALTI_PAYER_NAME not configured')
      return NextResponse.json(
        { error: 'Tipalti payer name not configured. Please set TIPALTI_PAYER_NAME environment variable.' },
        { status: 500 }
      )
    }

    if (!config.apiKey) {
      console.error('TIPALTI_API_KEY not configured')
      return NextResponse.json(
        { error: 'Tipalti API key not configured. Please set TIPALTI_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    // Generate timestamp for authentication
    const timestamp = generateTimestamp()
    
    // Create the data string for HMAC signature
    // Format per Tipalti docs: payerName + timestamp + payeeId
    const dataToSign = `${config.payerName}${timestamp}${payeeId}`
    
    // Generate HMAC signature
    const signature = generateHmacSignature(dataToSign, config.apiKey)

    // Build the iFrame URL path based on view type
    // Per Tipalti docs: https://documentation.tipalti.com/docs/iframe-request-structure
    let path = ''
    switch (viewType) {
      case 'paymentHistory':
        path = 'PayeeDashboard/PaymentsHistory'
        break
      case 'invoiceHistory':
        path = 'PayeeDashboard/Invoices'
        break
      case 'paymentDetails':
        path = 'PayeeDashboard/Home'
        break
      default:
        path = 'PayeeDashboard/PaymentsHistory'
    }

    // Construct the authenticated iFrame URL
    // Parameters per Tipalti docs:
    // - payer: Your payer name in Tipalti
    // - idap: The payee's unique identifier (Payee ID)
    // - ts: Unix timestamp
    // - hashkey: HMAC-SHA256 signature
    const iframeUrl = `${config.baseUrl}/${path}?` +
      `payer=${encodeURIComponent(config.payerName)}` +
      `&idap=${encodeURIComponent(payeeId)}` +
      `&ts=${timestamp}` +
      `&hashkey=${signature}`

    console.log(`Generated Tipalti URL for payee ${payeeId}, view: ${viewType}, env: ${environment}`)

    return NextResponse.json({ 
      iframeUrl,
      payeeId,
      viewType,
      timestamp,
      environment
    })

  } catch (error) {
    console.error('Error generating Tipalti iFrame URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate iFrame URL. Please check server logs.' },
      { status: 500 }
    )
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const payeeId = searchParams.get('payeeId')
  const viewType = searchParams.get('viewType') as IFrameRequest['viewType'] || 'paymentHistory'
  const environment = searchParams.get('environment') as IFrameRequest['environment'] || 'production'

  if (!payeeId) {
    return NextResponse.json(
      { error: 'payeeId query parameter is required' },
      { status: 400 }
    )
  }

  // Reuse POST logic
  const fakeRequest = {
    json: async () => ({ payeeId, viewType, environment })
  } as NextRequest

  return POST(fakeRequest)
}