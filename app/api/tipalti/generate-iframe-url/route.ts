import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Tipalti configuration
const TIPALTI_CONFIG = {
  sandbox: {
    baseUrl: 'https://ui2.sandbox.tipalti.com',
    payerName: process.env.TIPALTI_PAYER_NAME || 'your-company-name',
    apiKey: process.env.TIPALTI_API_KEY || ''
  },
  production: {
    baseUrl: 'https://ui2.tipalti.com',
    payerName: process.env.TIPALTI_PAYER_NAME || 'your-company-name',
    apiKey: process.env.TIPALTI_API_KEY || ''
  }
}

interface IFrameRequest {
  payeeId: string
  viewType: 'paymentHistory' | 'invoiceHistory' | 'paymentDetails'
  environment: 'sandbox' | 'production'
}

function generateHmacSignature(data: string, apiKey: string): string {
  const hmac = crypto.createHmac('sha256', apiKey)
  hmac.update(data)
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

    // Generate timestamp for authentication
    const timestamp = generateTimestamp()
    
    // Create the data string for HMAC signature
    // Format: payerName + timestamp + payeeId
    const dataToSign = `${config.payerName}${timestamp}${payeeId}`
    
    // Generate HMAC signature
    const signature = generateHmacSignature(dataToSign, config.apiKey)

    // Build the iFrame URL based on view type
    let path = ''
    switch (viewType) {
      case 'paymentHistory':
        path = 'PaymentsHistory'
        break
      case 'invoiceHistory':
        path = 'PayeeDashboard/InvoicesHistory'
        break
      case 'paymentDetails':
        path = 'PayeeDashboard/Home'
        break
      default:
        path = 'PaymentsHistory'
    }

    // Construct the authenticated iFrame URL
    const iframeUrl = `${config.baseUrl}/${path}?` +
      `payer=${encodeURIComponent(config.payerName)}` +
      `&idap=${encodeURIComponent(payeeId)}` +
      `&ts=${timestamp}` +
      `&hashkey=${signature}`

    return NextResponse.json({ 
      iframeUrl,
      payeeId,
      viewType,
      timestamp
    })

  } catch (error) {
    console.error('Error generating Tipalti iFrame URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate iFrame URL' },
      { status: 500 }
    )
  }
}