// lib/tipalti.ts
// Complete Tipalti API Integration for SkyYield
// Production-ready - no sandbox

import crypto from 'crypto'

// Configuration
const TIPALTI_CONFIG = {
  payerName: process.env.TIPALTI_PAYER_NAME || 'SkyYield',
  apiKey: process.env.TIPALTI_API_KEY || '',
  webhookSecret: process.env.TIPALTI_WEBHOOK_SECRET || '',
  // Production URLs
  soapPayeeUrl: 'https://api.tipalti.com/v14/PayeeFunctions.asmx',
  soapPayerUrl: 'https://api.tipalti.com/v14/PayerFunctions.asmx',
  portalUrl: 'https://suppliers.tipalti.com',
}

// Generate HMAC signature for Tipalti authentication
export function generateHmacSignature(dataToSign: string): string {
  const hmac = crypto.createHmac('sha256', TIPALTI_CONFIG.apiKey)
  hmac.update(dataToSign)
  return hmac.digest('hex')
}

// Generate timestamp (seconds since epoch)
export function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

// Verify webhook signature
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', TIPALTI_CONFIG.webhookSecret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('base64')
  return signature === expectedSignature
}

// ============================================
// PAYEE MANAGEMENT
// ============================================

interface CreatePayeeParams {
  payeeId: string           // Unique ID (use partner ID like "LP-2025-001")
  firstName: string
  lastName: string
  email: string
  companyName?: string
  street1?: string
  city?: string
  state?: string
  zip?: string
  country?: string          // ISO 2-letter code, default "US"
  payeeType?: 'individual' | 'company'
}

// Create or Update Payee via SOAP API
export async function createOrUpdatePayee(params: CreatePayeeParams): Promise<{ success: boolean; error?: string }> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${params.payeeId}${timestamp}${params.street1 || ''}`
  const signature = generateHmacSignature(dataToSign)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:UpdateOrCreatePayeeInfo>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${params.payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
      <tip:skipNulls>1</tip:skipNulls>
      <tip:overridePayableCountry>false</tip:overridePayableCountry>
      <tip:item>
        <tip:Idap>${params.payeeId}</tip:Idap>
        <tip:FirstName>${escapeXml(params.firstName)}</tip:FirstName>
        <tip:LastName>${escapeXml(params.lastName)}</tip:LastName>
        <tip:Email>${escapeXml(params.email)}</tip:Email>
        ${params.companyName ? `<tip:Company>${escapeXml(params.companyName)}</tip:Company>` : ''}
        ${params.street1 ? `<tip:Street1>${escapeXml(params.street1)}</tip:Street1>` : ''}
        ${params.city ? `<tip:City>${escapeXml(params.city)}</tip:City>` : ''}
        ${params.state ? `<tip:State>${escapeXml(params.state)}</tip:State>` : ''}
        ${params.zip ? `<tip:Zip>${escapeXml(params.zip)}</tip:Zip>` : ''}
        <tip:Country>${params.country || 'US'}</tip:Country>
        <tip:PayeeEntityType>${params.payeeType === 'company' ? 'Company' : 'Individual'}</tip:PayeeEntityType>
      </tip:item>
    </tip:UpdateOrCreatePayeeInfo>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://Tipalti.org/UpdateOrCreatePayeeInfo',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    
    // Parse SOAP response for success/error
    if (responseText.includes('<b>OK</b>') || responseText.includes('errorCode>0<')) {
      return { success: true }
    } else {
      const errorMatch = responseText.match(/<errorMessage>([^<]+)<\/errorMessage>/)
      return { success: false, error: errorMatch?.[1] || 'Unknown error' }
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// Get Payee Details
export async function getPayeeDetails(payeeId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPayeeDetails>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
    </tip:GetPayeeDetails>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://Tipalti.org/GetPayeeDetails',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    // Parse the XML response into a usable object
    const data = parsePayeeDetailsResponse(responseText)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// Generate Supplier Hub Onboarding URL
// This gives the partner a link to enter their banking details
export function generateOnboardingUrl(payeeId: string): string {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  return `${TIPALTI_CONFIG.portalUrl}/Payees/PayeeDashboard/Home?` +
    `payer=${encodeURIComponent(TIPALTI_CONFIG.payerName)}` +
    `&idap=${encodeURIComponent(payeeId)}` +
    `&ts=${timestamp}` +
    `&hashkey=${signature}`
}

// Generate Payment History URL for payee
export function generatePaymentHistoryUrl(payeeId: string): string {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  return `${TIPALTI_CONFIG.portalUrl}/PaymentsHistory?` +
    `payer=${encodeURIComponent(TIPALTI_CONFIG.payerName)}` +
    `&idap=${encodeURIComponent(payeeId)}` +
    `&ts=${timestamp}` +
    `&hashkey=${signature}`
}

// ============================================
// PAYMENT / BILL MANAGEMENT
// ============================================

interface CreateBillParams {
  payeeId: string
  invoiceNumber: string     // Unique invoice/bill number
  invoiceDate: Date
  amount: number
  currency?: string         // Default USD
  description?: string
  dueDate?: Date
}

// Create Invoice/Bill for payment
export async function createBill(params: CreateBillParams): Promise<{ success: boolean; error?: string }> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  const invoiceDate = params.invoiceDate.toISOString().split('T')[0]
  const dueDate = params.dueDate?.toISOString().split('T')[0] || invoiceDate

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:CreateOrUpdateInvoices>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
      <tip:invoices>
        <tip:TipaltiInvoiceItemRequest>
          <tip:Idap>${params.payeeId}</tip:Idap>
          <tip:InvoiceRefCode>${params.invoiceNumber}</tip:InvoiceRefCode>
          <tip:InvoiceDate>${invoiceDate}</tip:InvoiceDate>
          <tip:InvoiceDueDate>${dueDate}</tip:InvoiceDueDate>
          <tip:Description>${escapeXml(params.description || 'SkyYield Partner Commission')}</tip:Description>
          <tip:InvoiceLines>
            <tip:TipaltiInvoiceLineItemRequest>
              <tip:Amount>${params.amount.toFixed(2)}</tip:Amount>
              <tip:Currency>${params.currency || 'USD'}</tip:Currency>
              <tip:Description>${escapeXml(params.description || 'Partner Commission Payment')}</tip:Description>
            </tip:TipaltiInvoiceLineItemRequest>
          </tip:InvoiceLines>
        </tip:TipaltiInvoiceItemRequest>
      </tip:invoices>
    </tip:CreateOrUpdateInvoices>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://Tipalti.org/CreateOrUpdateInvoices',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    
    if (responseText.includes('errorCode>0<') || responseText.includes('<b>OK</b>')) {
      return { success: true }
    } else {
      const errorMatch = responseText.match(/<errorMessage>([^<]+)<\/errorMessage>/)
      return { success: false, error: errorMatch?.[1] || 'Unknown error' }
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// Get payment history for a payee
export async function getPaymentHistory(payeeId: string): Promise<{ success: boolean; payments?: any[]; error?: string }> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPayeePaymentsHistory>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
    </tip:GetPayeePaymentsHistory>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://Tipalti.org/GetPayeePaymentsHistory',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    const payments = parsePaymentsResponse(responseText)
    return { success: true, payments }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// Get payee's invoices/bills
export async function getPayeeInvoices(payeeId: string): Promise<{ success: boolean; invoices?: any[]; error?: string }> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPayeeInvoicesList>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
    </tip:GetPayeeInvoicesList>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://Tipalti.org/GetPayeeInvoicesList',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    const invoices = parseInvoicesResponse(responseText)
    return { success: true, invoices }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function parsePayeeDetailsResponse(xml: string): any {
  // Extract key fields from SOAP response
  const extractValue = (tag: string) => {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'))
    return match?.[1] || null
  }

  // Parse the combined address
  const addressRaw = extractValue('Address')
  let street1 = null, city = null, state = null, zip = null, country = null
  if (addressRaw) {
    const addressParts = addressRaw.split(/\r?\n/)
    street1 = addressParts[0] || null
    city = addressParts[1] || null
    // Parse "GA 30062" format
    if (addressParts[2]) {
      const stateZip = addressParts[2].match(/([A-Z]{2})\s*(\d{5}(-\d{4})?)/)
      if (stateZip) {
        state = stateZip[1]
        zip = stateZip[2]
      }
    }
    country = addressParts[3] || null
  }

  // Parse full name into first/last
  const fullName = extractValue('Name')
  let firstName = null, lastName = null
  if (fullName) {
    const nameParts = fullName.split(' ')
    firstName = nameParts[0]
    lastName = nameParts.slice(1).join(' ')
  }

  return {
    payeeId: extractValue('Idap') || extractValue('idap'),
    name: fullName,
    firstName,
    lastName,
    email: extractValue('Email'),
    company: extractValue('Company') || extractValue('CompanyName'),
    paymentMethod: extractValue('PaymentMethod'),
    payeeStatus: extractValue('PayeeStatus') || extractValue('Status'),
    isPayable: extractValue('PaymentMethod') !== 'NoPM',
    street1,
    city,
    state,
    zip,
    country,
  }
}

function parsePaymentsResponse(xml: string): any[] {
  const payments: any[] = []
  const paymentMatches = xml.matchAll(/<TipaltiPaymentHistoryItem>([\s\S]*?)<\/TipaltiPaymentHistoryItem>/g)
  
  for (const match of paymentMatches) {
    const paymentXml = match[1]
    const extractValue = (tag: string) => {
      const m = paymentXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m?.[1] || null
    }

    payments.push({
      refCode: extractValue('RefCode'),
      amount: parseFloat(extractValue('Amount') || '0'),
      currency: extractValue('Currency'),
      paymentDate: extractValue('PaymentDate'),
      status: extractValue('Status'),
      paymentMethod: extractValue('PaymentMethod'),
    })
  }

  return payments
}

function parseInvoicesResponse(xml: string): any[] {
  const invoices: any[] = []
  const invoiceMatches = xml.matchAll(/<TipaltiInvoiceItem>([\s\S]*?)<\/TipaltiInvoiceItem>/g)
  
  for (const match of invoiceMatches) {
    const invoiceXml = match[1]
    const extractValue = (tag: string) => {
      const m = invoiceXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m?.[1] || null
    }

    invoices.push({
      refCode: extractValue('InvoiceRefCode'),
      amount: parseFloat(extractValue('TotalAmount') || '0'),
      currency: extractValue('Currency'),
      invoiceDate: extractValue('InvoiceDate'),
      dueDate: extractValue('InvoiceDueDate'),
      status: extractValue('Status'),
      description: extractValue('Description'),
    })
  }

  return invoices
}

// ============================================
// GET ALL PAYEES FROM TIPALTI
// ============================================

export async function getAllPayees(): Promise<{ success: boolean; payees?: any[]; rawXml?: string; error?: string }> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  // Use GetPayeeStatusList from Payer API
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPayeeStatusList>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
    </tip:GetPayeeStatusList>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://Tipalti.org/GetPayeeStatusList',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    const payees = parsePayeeListResponse(responseText)
    return { success: true, payees, rawXml: responseText.substring(0, 3000) }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

function parsePayeeListResponse(xml: string): any[] {
  const payees: any[] = []
  
  // Try multiple possible item tag names
  const itemPatterns = [
    /<PayeeDetails>([\s\S]*?)<\/PayeeDetails>/gi,
    /<TipaltiPayeeDetails>([\s\S]*?)<\/TipaltiPayeeDetails>/gi,
    /<PayeeItem>([\s\S]*?)<\/PayeeItem>/gi,
    /<ExtendedPayeeStatusItem>([\s\S]*?)<\/ExtendedPayeeStatusItem>/gi,
  ]
  
  for (const pattern of itemPatterns) {
    const matches = xml.matchAll(pattern)
    for (const match of matches) {
      const payeeXml = match[1]
      const extractValue = (tag: string) => {
        const m = payeeXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'))
        return m?.[1] || null
      }

      const fullName = extractValue('Name')
      let firstName = null, lastName = null
      if (fullName) {
        const nameParts = fullName.split(' ')
        firstName = nameParts[0]
        lastName = nameParts.slice(1).join(' ')
      }

      payees.push({
        payeeId: extractValue('Idap') || extractValue('idap') || extractValue('PayeeId'),
        name: fullName,
        firstName: firstName || extractValue('FirstName'),
        lastName: lastName || extractValue('LastName'),
        email: extractValue('Email'),
        company: extractValue('Company') || extractValue('CompanyName'),
        paymentMethod: extractValue('PaymentMethod'),
        payeeStatus: extractValue('PayeeStatus') || extractValue('Status'),
        isPayable: extractValue('PaymentMethod') !== 'NoPM' && extractValue('PaymentMethod') !== null,
      })
    }
    
    if (payees.length > 0) break
  }

  return payees
}

// Export all functions
export const Tipalti = {
  createOrUpdatePayee,
  getPayeeDetails,
  generateOnboardingUrl,
  generatePaymentHistoryUrl,
  createBill,
  getPaymentHistory,
  getPayeeInvoices,
  getAllPayees,
  verifyWebhookSignature,
}
