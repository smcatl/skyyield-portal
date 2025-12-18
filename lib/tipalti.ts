// lib/tipalti.ts
// Complete Tipalti API Integration for SkyYield
// Production-ready - no sandbox

import crypto from 'crypto'

// Configuration
const TIPALTI_CONFIG = {
  payerName: process.env.TIPALTI_PAYER_NAME || 'SkyYield',
  apiKey: process.env.TIPALTI_API_KEY || '',
  webhookSecret: process.env.TIPALTI_WEBHOOK_SECRET || '',
  // Production URLs - using v11 which has better documentation
  soapPayeeUrl: 'https://api.tipalti.com/v11/PayeeFunctions.asmx',
  soapPayerUrl: 'https://api.tipalti.com/v11/PayerFunctions.asmx',
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
  payeeId: string
  firstName: string
  lastName: string
  email: string
  companyName?: string
  street1?: string
  city?: string
  state?: string
  zip?: string
  country?: string
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
        'SOAPAction': '"http://Tipalti.org/UpdateOrCreatePayeeInfo"',
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
        'SOAPAction': '"http://Tipalti.org/GetPayeeDetails"',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    
    if (responseText.includes('PayeeUnknown') || responseText.includes('errorCode>1<')) {
      return { success: false, error: 'Payee not found' }
    }

    const data = parsePayeeDetailsResponse(responseText)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// Get Extended Payee Details (includes payment status)
export async function getExtendedPayeeDetails(payeeId: string): Promise<{ success: boolean; data?: any; error?: string; rawXml?: string }> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetExtendedPayeeDetails>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
    </tip:GetExtendedPayeeDetails>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://Tipalti.org/GetExtendedPayeeDetails"',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    
    if (responseText.includes('PayeeUnknown') || responseText.includes('errorCode>1<')) {
      return { success: false, error: 'Payee not found' }
    }

    const data = parseExtendedPayeeDetailsResponse(responseText)
    return { success: true, data, rawXml: responseText }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// Generate Tipalti iFrame URL for payee onboarding/management
export function generateOnboardingUrl(payeeId: string): string {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const signature = generateHmacSignature(dataToSign)
  
  return `${TIPALTI_CONFIG.portalUrl}/PayeeDashboard/Home?idap=${encodeURIComponent(payeeId)}&payer=${encodeURIComponent(TIPALTI_CONFIG.payerName)}&ts=${timestamp}&hashkey=${signature}`
}

// Generate Tipalti payment history URL
export function generatePaymentHistoryUrl(payeeId: string): string {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const signature = generateHmacSignature(dataToSign)
  
  return `${TIPALTI_CONFIG.portalUrl}/payeePaymentHistory.aspx?idap=${encodeURIComponent(payeeId)}&payer=${encodeURIComponent(TIPALTI_CONFIG.payerName)}&ts=${timestamp}&hashkey=${signature}`
}

// Create Bill/Invoice in Tipalti
interface CreateBillParams {
  payeeId: string
  invoiceNumber: string
  amount: number
  description?: string
  invoiceDate?: Date
  dueDate?: Date
  currency?: string
}

export async function createBill(params: CreateBillParams): Promise<{ success: boolean; error?: string }> {
  const timestamp = generateTimestamp()
  const invoiceDate = (params.invoiceDate || new Date()).toISOString().split('T')[0]
  const dueDate = (params.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
  
  const dataToSign = `${TIPALTI_CONFIG.payerName}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

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
        'SOAPAction': '"http://Tipalti.org/CreateOrUpdateInvoices"',
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
export async function getPaymentHistory(payeeId: string): Promise<{ success: boolean; payments?: any[]; error?: string; rawXml?: string }> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPaymentsHistoryReport>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
    </tip:GetPaymentsHistoryReport>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://Tipalti.org/GetPaymentsHistoryReport"',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    const payments = parsePaymentsResponse(responseText)
    return { success: true, payments, rawXml: responseText }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// Get payee's invoices/bills
export async function getPayeeInvoices(payeeId: string): Promise<{ success: boolean; invoices?: any[]; error?: string; rawXml?: string }> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${payeeId}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPayeeInvoiceList>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
    </tip:GetPayeeInvoiceList>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://Tipalti.org/GetPayeeInvoiceList"',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    const invoices = parseInvoicesResponse(responseText)
    return { success: true, invoices, rawXml: responseText }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// Get all payees with extended status
export async function getAllPayeesExtended(): Promise<{ success: boolean; payees?: any[]; error?: string; rawXml?: string }> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetExtendedPayeeStatusList>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
    </tip:GetExtendedPayeeStatusList>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://Tipalti.org/GetExtendedPayeeStatusList"',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    const payees = parsePayeeListResponse(responseText)
    return { success: true, payees, rawXml: responseText }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// Get all payments for payer (batch)
export async function getAllPaymentsBatch(pageIndex: number = 0, pageSize: number = 100): Promise<{ success: boolean; payments?: any[]; error?: string; rawXml?: string }> {
  const timestamp = generateTimestamp()
  const dataToSign = `${TIPALTI_CONFIG.payerName}${timestamp}`
  const signature = generateHmacSignature(dataToSign)

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPaymentsReport>
      <tip:payerName>${TIPALTI_CONFIG.payerName}</tip:payerName>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
    </tip:GetPaymentsReport>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(TIPALTI_CONFIG.soapPayerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://Tipalti.org/GetPaymentsReport"',
      },
      body: soapEnvelope,
    })

    const responseText = await response.text()
    const payments = parsePaymentsBatchResponse(responseText)
    return { success: true, payments, rawXml: responseText }
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
  const extractValue = (tag: string) => {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'))
    return match?.[1] || null
  }

  const addressRaw = extractValue('Address')
  let street1 = null, city = null, state = null, zip = null, country = null
  if (addressRaw) {
    const addressParts = addressRaw.split(/\r?\n/)
    street1 = addressParts[0] || null
    city = addressParts[1] || null
    if (addressParts[2]) {
      const stateZip = addressParts[2].split(' ')
      state = stateZip[0]
      zip = stateZip[1]
    }
    country = addressParts[3] || null
  }

  return {
    name: extractValue('Name'),
    firstName: extractValue('FirstName'),
    lastName: extractValue('LastName'),
    company: extractValue('CompanyName') || extractValue('Company'),
    email: extractValue('Email'),
    paymentMethod: extractValue('PaymentMethod'),
    payeeStatus: extractValue('PayeeStatus'),
    isPayable: extractValue('PaymentMethod') !== 'NoPM' && extractValue('PaymentMethod') !== null,
    street1,
    city,
    state,
    zip,
    country,
  }
}

function parseExtendedPayeeDetailsResponse(xml: string): any {
  const extractValue = (tag: string) => {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'))
    return match?.[1] || null
  }

  return {
    name: extractValue('Name'),
    firstName: extractValue('FirstName'),
    lastName: extractValue('LastName'),
    company: extractValue('CompanyName') || extractValue('Company'),
    email: extractValue('Email'),
    paymentMethod: extractValue('PaymentMethod'),
    payeeStatus: extractValue('PayeeStatus'),
    isPayable: extractValue('IsPayable') === 'true' || (extractValue('PaymentMethod') !== 'NoPM' && extractValue('PaymentMethod') !== null),
    balance: parseFloat(extractValue('Balance') || '0'),
    totalPaid: parseFloat(extractValue('TotalPaid') || extractValue('PaidAmount') || '0'),
    pendingAmount: parseFloat(extractValue('PendingAmount') || '0'),
  }
}

function parsePaymentsResponse(xml: string): any[] {
  const payments: any[] = []
  
  // Try multiple possible item patterns
  const patterns = [
    /<TipaltiPaymentHistoryItem>([\s\S]*?)<\/TipaltiPaymentHistoryItem>/gi,
    /<PaymentHistoryItem>([\s\S]*?)<\/PaymentHistoryItem>/gi,
    /<Payment>([\s\S]*?)<\/Payment>/gi,
    /<PaymentItem>([\s\S]*?)<\/PaymentItem>/gi,
  ]
  
  for (const pattern of patterns) {
    const matches = xml.matchAll(pattern)
    for (const match of matches) {
      const paymentXml = match[1]
      const extractValue = (tag: string) => {
        const m = paymentXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'))
        return m?.[1] || null
      }

      payments.push({
        refCode: extractValue('RefCode') || extractValue('PaymentRefCode') || extractValue('InvoiceRefCode'),
        amount: parseFloat(extractValue('Amount') || extractValue('PaymentAmount') || '0'),
        currency: extractValue('Currency'),
        paymentDate: extractValue('PaymentDate') || extractValue('SubmitDate'),
        status: extractValue('Status') || extractValue('PaymentStatus'),
        paymentMethod: extractValue('PaymentMethod'),
      })
    }
    if (payments.length > 0) break
  }

  return payments
}

function parseInvoicesResponse(xml: string): any[] {
  const invoices: any[] = []
  
  const patterns = [
    /<TipaltiInvoiceItem>([\s\S]*?)<\/TipaltiInvoiceItem>/gi,
    /<InvoiceItem>([\s\S]*?)<\/InvoiceItem>/gi,
    /<Invoice>([\s\S]*?)<\/Invoice>/gi,
  ]
  
  for (const pattern of patterns) {
    const matches = xml.matchAll(pattern)
    for (const match of matches) {
      const invoiceXml = match[1]
      const extractValue = (tag: string) => {
        const m = invoiceXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'))
        return m?.[1] || null
      }

      invoices.push({
        refCode: extractValue('InvoiceRefCode') || extractValue('RefCode'),
        amount: parseFloat(extractValue('TotalAmount') || extractValue('Amount') || '0'),
        currency: extractValue('Currency'),
        invoiceDate: extractValue('InvoiceDate'),
        dueDate: extractValue('InvoiceDueDate') || extractValue('DueDate'),
        status: extractValue('Status') || extractValue('InvoiceStatus'),
        description: extractValue('Description'),
      })
    }
    if (invoices.length > 0) break
  }

  return invoices
}

function parsePayeeListResponse(xml: string): any[] {
  const payees: any[] = []
  
  const patterns = [
    /<ExtendedPayeeStatusItem>([\s\S]*?)<\/ExtendedPayeeStatusItem>/gi,
    /<PayeeDetails>([\s\S]*?)<\/PayeeDetails>/gi,
    /<TipaltiPayeeDetails>([\s\S]*?)<\/TipaltiPayeeDetails>/gi,
    /<PayeeItem>([\s\S]*?)<\/PayeeItem>/gi,
  ]
  
  for (const pattern of patterns) {
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
        isPayable: extractValue('IsPayable') === 'true' || (extractValue('PaymentMethod') !== 'NoPM' && extractValue('PaymentMethod') !== null),
        balance: parseFloat(extractValue('Balance') || '0'),
      })
    }
    
    if (payees.length > 0) break
  }

  return payees
}

function parsePaymentsBatchResponse(xml: string): any[] {
  const payments: any[] = []
  
  const patterns = [
    /<PaymentReportItem>([\s\S]*?)<\/PaymentReportItem>/gi,
    /<TipaltiPaymentItem>([\s\S]*?)<\/TipaltiPaymentItem>/gi,
    /<Payment>([\s\S]*?)<\/Payment>/gi,
  ]
  
  for (const pattern of patterns) {
    const matches = xml.matchAll(pattern)
    for (const match of matches) {
      const paymentXml = match[1]
      const extractValue = (tag: string) => {
        const m = paymentXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'))
        return m?.[1] || null
      }

      payments.push({
        payeeId: extractValue('Idap') || extractValue('PayeeId'),
        refCode: extractValue('RefCode') || extractValue('PaymentRefCode'),
        amount: parseFloat(extractValue('Amount') || extractValue('PaymentAmount') || '0'),
        currency: extractValue('Currency'),
        paymentDate: extractValue('PaymentDate') || extractValue('SubmitDate'),
        status: extractValue('Status') || extractValue('PaymentStatus'),
        paymentMethod: extractValue('PaymentMethod'),
      })
    }
    if (payments.length > 0) break
  }

  return payments
}

// Get all payees (combines multiple methods)
export async function getAllPayees(): Promise<{ success: boolean; payees?: any[]; error?: string }> {
  // First try to get the extended payee list
  const listResult = await getAllPayeesExtended()
  if (listResult.success && listResult.payees && listResult.payees.length > 0) {
    return listResult
  }

  // Fallback: fetch known IDs individually
  const knownIds = [
    'LP-PHENIX-EV', 'LP-PHENIX-SBV', 'LP-PHENIX-WH', 'LP-PHENIX-CE', 'LP-PHENIX-TC',
    'RP-STOSH001', 'RP-APRIL001',
  ]
  
  const payees: any[] = []
  
  for (const id of knownIds) {
    try {
      const result = await getExtendedPayeeDetails(id)
      if (result.success && result.data && result.data.email) {
        payees.push({
          ...result.data,
          payeeId: id
        })
      }
    } catch (e) {
      // Skip failed lookups
    }
  }
  
  return { success: true, payees }
}

// Export all functions
export const Tipalti = {
  createOrUpdatePayee,
  getPayeeDetails,
  getExtendedPayeeDetails,
  generateOnboardingUrl,
  generatePaymentHistoryUrl,
  createBill,
  getPaymentHistory,
  getPayeeInvoices,
  getAllPayees,
  getAllPayeesExtended,
  getAllPaymentsBatch,
  verifyWebhookSignature,
}
