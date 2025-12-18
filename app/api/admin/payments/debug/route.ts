// app/api/admin/payments/debug/route.ts
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
  soapPayeeUrl: 'https://api.tipalti.com/v14/PayeeFunctions.asmx',
  soapPayerUrl: 'https://api.tipalti.com/v14/PayerFunctions.asmx',
}

function generateHmacSignature(dataToSign: string): string {
  const hmac = crypto.createHmac('sha256', TIPALTI_CONFIG.apiKey)
  hmac.update(dataToSign)
  return hmac.digest('hex')
}

function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const payeeId = searchParams.get('payeeId') || '1'

    const timestamp = generateTimestamp()
    const results: any = {
      payeeId,
      timestamp,
      config: {
        payerName: TIPALTI_CONFIG.payerName,
        hasApiKey: !!TIPALTI_CONFIG.apiKey,
        apiKeyLength: TIPALTI_CONFIG.apiKey.length
      }
    }

    // Test 1: Get Payee Details
    try {
      const dataToSign1 = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
      const signature1 = generateHmacSignature(dataToSign1)

      const detailsEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPayeeDetails>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature1}</tip:key>
    </tip:GetPayeeDetails>
  </soap:Body>
</soap:Envelope>`

      const detailsRes = await fetch(TIPALTI_CONFIG.soapPayeeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://Tipalti.org/GetPayeeDetails',
        },
        body: detailsEnvelope,
      })

      results.payeeDetails = {
        status: detailsRes.status,
        rawResponse: await detailsRes.text()
      }
    } catch (e) {
      results.payeeDetails = { error: String(e) }
    }

    // Test 2: Get Payment History
    try {
      const timestamp2 = generateTimestamp()
      const dataToSign2 = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp2}`
      const signature2 = generateHmacSignature(dataToSign2)

      const historyEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPayeePaymentsHistory>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp2}</tip:timestamp>
      <tip:key>${signature2}</tip:key>
    </tip:GetPayeePaymentsHistory>
  </soap:Body>
</soap:Envelope>`

      const historyRes = await fetch(TIPALTI_CONFIG.soapPayeeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://Tipalti.org/GetPayeePaymentsHistory',
        },
        body: historyEnvelope,
      })

      results.paymentHistory = {
        status: historyRes.status,
        rawResponse: await historyRes.text()
      }
    } catch (e) {
      results.paymentHistory = { error: String(e) }
    }

    // Test 3: Get Extended Payee Status List (all payees)
    try {
      const timestamp3 = generateTimestamp()
      const dataToSign3 = `${TIPALTI_CONFIG.payerName}${timestamp3}`
      const signature3 = generateHmacSignature(dataToSign3)

      const listEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetExtendedPayeeStatusList>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp3}</tip:timestamp>
      <tip:key>${signature3}</tip:key>
    </tip:GetExtendedPayeeStatusList>
  </soap:Body>
</soap:Envelope>`

      const listRes = await fetch(TIPALTI_CONFIG.soapPayerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://Tipalti.org/GetExtendedPayeeStatusList',
        },
        body: listEnvelope,
      })

      results.payeeList = {
        status: listRes.status,
        rawResponse: await listRes.text()
      }
    } catch (e) {
      results.payeeList = { error: String(e) }
    }

    // Test 4: Get Payment History from Payer API (might have more data)
    try {
      const timestamp4 = generateTimestamp()
      // Try getting all payments for the payer
      const dataToSign4 = `${TIPALTI_CONFIG.payerName}${timestamp4}`
      const signature4 = generateHmacSignature(dataToSign4)

      const paymentsEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPaymentsBatch>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp4}</tip:timestamp>
      <tip:key>${signature4}</tip:key>
      <tip:pageIndex>0</tip:pageIndex>
      <tip:pageSize>100</tip:pageSize>
    </tip:GetPaymentsBatch>
  </soap:Body>
</soap:Envelope>`

      const paymentsRes = await fetch(TIPALTI_CONFIG.soapPayerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://Tipalti.org/GetPaymentsBatch',
        },
        body: paymentsEnvelope,
      })

      results.allPayments = {
        status: paymentsRes.status,
        rawResponse: await paymentsRes.text()
      }
    } catch (e) {
      results.allPayments = { error: String(e) }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
