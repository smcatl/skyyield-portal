// app/api/admin/payments/debug/route.ts
// Debug endpoint to test Tipalti API responses
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import crypto from 'crypto'

const TIPALTI_CONFIG = {
  payerName: process.env.TIPALTI_PAYER_NAME || 'SkyYield',
  apiKey: process.env.TIPALTI_API_KEY || '',
  baseUrl: process.env.TIPALTI_ENVIRONMENT === 'production'
    ? 'https://api.tipalti.com'
    : 'https://api.sandbox.tipalti.com',
}

// REST API config
const TIPALTI_REST_CONFIG = {
  clientId: process.env.TIPALTI_REST_CLIENT_ID,
  clientSecret: process.env.TIPALTI_REST_CLIENT_SECRET,
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

// Call a SOAP endpoint
async function callSoapEndpoint(
  endpoint: string,
  soapAction: string,
  body: string,
  apiPath: string = 'PayeeFunctions'
): Promise<{ success: boolean; data?: any; error?: string; raw?: string }> {
  try {
    const response = await fetch(`${TIPALTI_CONFIG.baseUrl}/v11/${apiPath}.asmx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"http://Tipalti.org/${soapAction}"`,
      },
      body,
    })
    
    const text = await response.text()
    
    if (text.includes('Error') || text.includes('Fault') || text.includes('did not recognize')) {
      return { 
        success: false, 
        error: text.match(/<faultstring>([^<]+)<\/faultstring>/)?.[1] || 
               text.match(/<Message>([^<]+)<\/Message>/)?.[1] ||
               'Unknown error',
        raw: text.substring(0, 500)
      }
    }
    
    return { success: true, raw: text.substring(0, 2000) }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const payeeId = searchParams.get('payeeId') || 'LP-PHENIX-EV'
  
  const timestamp = getTimestamp()
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    payeeId,
    config: {
      payerName: TIPALTI_CONFIG.payerName,
      environment: process.env.TIPALTI_ENVIRONMENT || 'sandbox',
      apiKeySet: !!TIPALTI_CONFIG.apiKey,
      restClientIdSet: !!TIPALTI_REST_CONFIG.clientId,
      restClientSecretSet: !!TIPALTI_REST_CONFIG.clientSecret,
    },
    endpoints: {},
  }

  // 1. GetPayeeDetails (known to work)
  {
    const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
    const key = generateHmac(dataToSign)
    
    const body = `<?xml version="1.0" encoding="utf-8"?>
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
    
    results.endpoints.getPayeeDetails = await callSoapEndpoint('GetPayeeDetails', 'GetPayeeDetails', body)
  }

  // 2. GetLastPaymentDetailsByIdap
  {
    const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
    const key = generateHmac(dataToSign)
    
    const body = `<?xml version="1.0" encoding="utf-8"?>
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
    
    results.endpoints.getLastPaymentDetails = await callSoapEndpoint('GetLastPaymentDetailsByIdap', 'GetLastPaymentDetailsByIdap', body)
  }

  // 3. GetExtendedPayeeDetails
  {
    const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
    const key = generateHmac(dataToSign)
    
    const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetExtendedPayeeDetails>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${key}</tip:key>
    </tip:GetExtendedPayeeDetails>
  </soap:Body>
</soap:Envelope>`
    
    results.endpoints.getExtendedPayeeDetails = await callSoapEndpoint('GetExtendedPayeeDetails', 'GetExtendedPayeeDetails', body)
  }

  // 4. GetBalances (Payer endpoint)
  {
    const dataToSign = `${TIPALTI_CONFIG.payerName}${timestamp}`
    const key = generateHmac(dataToSign)
    
    const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetBalances>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${key}</tip:key>
    </tip:GetBalances>
  </soap:Body>
</soap:Envelope>`
    
    results.endpoints.getBalances = await callSoapEndpoint('GetBalances', 'GetBalances', body, 'PayerFunctions')
  }

  // 5. GetUpdatedPayments (Payer endpoint)
  {
    const dataToSign = `${TIPALTI_CONFIG.payerName}${timestamp}`
    const key = generateHmac(dataToSign)
    const sinceDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    
    const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetUpdatedPayments>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${key}</tip:key>
      <tip:changedSince>${sinceDate}</tip:changedSince>
    </tip:GetUpdatedPayments>
  </soap:Body>
</soap:Envelope>`
    
    results.endpoints.getUpdatedPayments = await callSoapEndpoint('GetUpdatedPayments', 'GetUpdatedPayments', body, 'PayerFunctions')
  }

  // 6. GetPayeeInvoicesListDetails (Payer endpoint)
  {
    const dataToSign = `${TIPALTI_CONFIG.payerName}${timestamp}`
    const key = generateHmac(dataToSign)
    
    const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPayeeInvoicesListDetails>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${key}</tip:key>
      <tip:idap>${payeeId}</tip:idap>
    </tip:GetPayeeInvoicesListDetails>
  </soap:Body>
</soap:Envelope>`
    
    results.endpoints.getPayeeInvoices = await callSoapEndpoint('GetPayeeInvoicesListDetails', 'GetPayeeInvoicesListDetails', body, 'PayerFunctions')
  }

  // 7. REST API - Get Access Token
  if (TIPALTI_REST_CONFIG.clientId && TIPALTI_REST_CONFIG.clientSecret) {
    try {
      const credentials = Buffer.from(
        `${TIPALTI_REST_CONFIG.clientId}:${TIPALTI_REST_CONFIG.clientSecret}`
      ).toString('base64')
      
      const tokenResponse = await fetch(`${TIPALTI_REST_CONFIG.baseUrl}/api/v1/oauth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      })
      
      const tokenData = await tokenResponse.json()
      results.endpoints.restOAuth = {
        success: !!tokenData.access_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scopes: tokenData.scope,
        error: tokenData.error,
      }
      
      // If we got a token, try to get payments
      if (tokenData.access_token) {
        // Try GET /api/v1/payments
        const paymentsResponse = await fetch(`${TIPALTI_REST_CONFIG.baseUrl}/api/v1/payments?limit=10`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json()
          results.endpoints.restPayments = {
            success: true,
            status: paymentsResponse.status,
            data: paymentsData,
          }
        } else {
          const errorText = await paymentsResponse.text()
          results.endpoints.restPayments = {
            success: false,
            status: paymentsResponse.status,
            error: errorText.substring(0, 500),
          }
        }
        
        // Try GET /api/v1/payees
        const payeesResponse = await fetch(`${TIPALTI_REST_CONFIG.baseUrl}/api/v1/payees?limit=10`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (payeesResponse.ok) {
          const payeesData = await payeesResponse.json()
          results.endpoints.restPayees = {
            success: true,
            status: payeesResponse.status,
            data: payeesData,
          }
        } else {
          const errorText = await payeesResponse.text()
          results.endpoints.restPayees = {
            success: false,
            status: payeesResponse.status,
            error: errorText.substring(0, 500),
          }
        }
        
        // Try GET /api/v1/payment-batches
        const batchesResponse = await fetch(`${TIPALTI_REST_CONFIG.baseUrl}/api/v1/payment-batches?limit=10`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (batchesResponse.ok) {
          const batchesData = await batchesResponse.json()
          results.endpoints.restBatches = {
            success: true,
            status: batchesResponse.status,
            data: batchesData,
          }
        } else {
          const errorText = await batchesResponse.text()
          results.endpoints.restBatches = {
            success: false,
            status: batchesResponse.status,
            error: errorText.substring(0, 500),
          }
        }
      }
    } catch (error) {
      results.endpoints.restOAuth = {
        success: false,
        error: String(error),
      }
    }
  } else {
    results.endpoints.restOAuth = {
      success: false,
      error: 'REST API credentials not configured',
    }
  }

  // Summary
  results.summary = {
    workingEndpoints: Object.entries(results.endpoints)
      .filter(([_, v]: [string, any]) => v.success)
      .map(([k]) => k),
    failingEndpoints: Object.entries(results.endpoints)
      .filter(([_, v]: [string, any]) => !v.success)
      .map(([k]) => k),
  }

  return NextResponse.json(results)
}
