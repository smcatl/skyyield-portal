// app/api/tipalti/generate-iframe-url/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Tipalti configuration
const TIPALTI_CONFIG = {
  sandbox: {
    baseUrl: 'https://ui2.sandbox.tipalti.com',
    payerName: process.env.TIPALTI_PAYER_NAME || 'SkyYield',
    apiKey: process.env.TIPALTI_API_KEY || ''
  },
  production: {
    baseUrl: 'https://ui2.tipalti.com',
    payerName: process.env.TIPALTI_PAYER_NAME || 'SkyYield',
    apiKey: process.env.TIPALTI_API_KEY || ''
  }
}

interface IFrameRequest {
  payeeId: string
  viewType: 'paymentHistory' | 'invoiceHistory' | 'paymentDetails'
  environment: 'sandbox' | 'production'
}

// Generate HMAC-SHA256 signature
function generateHmacSignature(data: string, apiKey: string): string {
  const key = Buffer.from(apiKey, 'utf-8')
  const hmac = crypto.createHmac('sha256', key)
  hmac.update(Buffer.from(data, 'utf-8'))
  return hmac.digest('hex')
}

function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

export async function POST(request: NextRequest) {
  try {
    const body: IFrameRequest = await request.json()
    const { payeeId, viewType, environment = 'sandbox' } = body

    if (!payeeId) {
      return NextResponse.json(
        { error: 'Payee ID is required' },
        { status: 400 }
      )
    }

    const config = TIPALTI_CONFIG[environment]
    
    if (!config.apiKey) {
      return NextResponse.json(
        { error: 'Tipalti API key not configured' },
        { status: 500 }
      )
    }

    // Generate timestamp
    const timestamp = generateTimestamp()
    
    // Build the query string WITHOUT hashkey first
    // Order matters: idap, payer, ts
    const queryParams = `idap=${payeeId}&payer=${config.payerName}&ts=${timestamp}`
    
    // Generate HMAC from the query string (this is what Tipalti expects)
    const hashkey = generateHmacSignature(queryParams, config.apiKey)

    // Determine path based on view type
    let path = ''
    switch (viewType) {
      case 'paymentHistory':
        path = 'PayeeDashboard/PaymentsHistory'
        break
      case 'invoiceHistory':
        path = 'PayeeDashboard/Invoices'
        break
      case 'paymentDetails':
        path = 'payeedashboard/home'
        break
      default:
        path = 'PayeeDashboard/PaymentsHistory'
    }

    // Construct the full iFrame URL
    const iframeUrl = `${config.baseUrl}/${path}?${queryParams}&hashkey=${hashkey}`

    console.log('Tipalti iFrame URL generated:', {
      payeeId,
      viewType,
      path,
      timestamp,
      queryParams,
      // Don't log hashkey for security
    })

    return NextResponse.json({ 
      iframeUrl,
      payeeId,
      viewType,
      timestamp,
      debug: {
        path,
        payerName: config.payerName,
        baseUrl: config.baseUrl,
        queryParams,
      }
    })

  } catch (error) {
    console.error('Error generating Tipalti iFrame URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate iFrame URL', details: String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint to test configuration
export async function GET(request: NextRequest) {
  const env = process.env.TIPALTI_ENVIRONMENT || 'sandbox'
  const config = TIPALTI_CONFIG[env as 'sandbox' | 'production']
  
  // Test with a sample payee
  const testPayeeId = 'RP-APRIL001'
  const timestamp = generateTimestamp()
  const queryParams = `idap=${testPayeeId}&payer=${config.payerName}&ts=${timestamp}`
  const hashkey = config.apiKey ? generateHmacSignature(queryParams, config.apiKey) : 'NO_API_KEY'
  
  return NextResponse.json({
    status: 'Tipalti iFrame URL generator',
    environment: env,
    payerName: config.payerName,
    apiKeyConfigured: !!config.apiKey,
    apiKeyLength: config.apiKey?.length || 0,
    baseUrl: config.baseUrl,
    testUrl: `${config.baseUrl}/PayeeDashboard/PaymentsHistory?${queryParams}&hashkey=${hashkey}`,
  })
}
