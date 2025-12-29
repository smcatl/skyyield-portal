// lib/tipalti-rest.ts
// Tipalti REST API Integration - NO IFRAME
import crypto from 'crypto'

const TIPALTI_BASE_URL = process.env.TIPALTI_SANDBOX === 'true'
  ? 'https://api-sandbox.tipalti.com'
  : 'https://api.tipalti.com'

const TIPALTI_API_KEY = process.env.TIPALTI_API_KEY || ''
const TIPALTI_PAYER_NAME = process.env.TIPALTI_PAYER_NAME || 'SkyYield'
const TIPALTI_HMAC_SECRET = process.env.TIPALTI_HMAC_SECRET || ''

function generateSignature(timestamp: string, payload?: string): string {
  const message = payload ? timestamp + payload : timestamp
  return crypto.createHmac('sha256', TIPALTI_HMAC_SECRET).update(message).digest('hex')
}

function getHeaders(timestamp: string, signature: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TIPALTI_API_KEY}`,
    'X-Tipalti-Payer': TIPALTI_PAYER_NAME,
    'X-Tipalti-Timestamp': timestamp,
    'X-Tipalti-Signature': signature,
  }
}

export interface CreatePayeeParams {
  payeeId: string
  name: string
  email: string
  entityType: 'Individual' | 'Company' | 'LLC' | 'Corporation' | 'Partnership'
  address?: { street1?: string; city?: string; state?: string; zip?: string; country?: string }
}

export async function createPayee(params: CreatePayeeParams) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const payload = JSON.stringify({
    idap: params.payeeId,
    alias: params.name,
    email: params.email,
    payeeEntityType: params.entityType,
    payeeName: params.name,
    street1: params.address?.street1 || '',
    city: params.address?.city || '',
    state: params.address?.state || '',
    zip: params.address?.zip || '',
    country: params.address?.country || 'US',
  })
  const signature = generateSignature(timestamp, payload)
  try {
    const response = await fetch(`${TIPALTI_BASE_URL}/api/v1/payees`, {
      method: 'POST',
      headers: getHeaders(timestamp, signature),
      body: payload,
    })
    if (!response.ok) return { success: false, error: await response.text() }
    return { success: true, data: await response.json() }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function getPayee(payeeId: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = generateSignature(timestamp)
  try {
    const response = await fetch(`${TIPALTI_BASE_URL}/api/v1/payees/${payeeId}`, {
      headers: getHeaders(timestamp, signature),
    })
    if (!response.ok) return { success: false, error: await response.text() }
    return { success: true, data: await response.json() }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function getPayeeStatus(payeeId: string) {
  const result = await getPayee(payeeId)
  if (!result.success) return result
  return {
    success: true,
    status: result.data?.payeeStatus || 'unknown',
    isPayable: result.data?.isPayable || false,
    paymentMethod: result.data?.paymentMethod || null,
  }
}

export interface CreateBillParams {
  payeeId: string
  invoiceNumber: string
  amount: number
  currency?: string
  description?: string
  dueDate?: Date
}

export async function createBill(params: CreateBillParams) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const dueDate = params.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const payload = JSON.stringify({
    idap: params.payeeId,
    invoiceRefCode: params.invoiceNumber,
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceDueDate: dueDate.toISOString().split('T')[0],
    currency: params.currency || 'USD',
    invoiceLines: [{ amount: params.amount, description: params.description || 'Partner Commission Payment' }],
  })
  const signature = generateSignature(timestamp, payload)
  try {
    const response = await fetch(`${TIPALTI_BASE_URL}/api/v1/bills`, {
      method: 'POST',
      headers: getHeaders(timestamp, signature),
      body: payload,
    })
    if (!response.ok) return { success: false, error: await response.text() }
    return { success: true, data: await response.json() }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function getPaymentHistory(payeeId: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = generateSignature(timestamp)
  try {
    const response = await fetch(`${TIPALTI_BASE_URL}/api/v1/payees/${payeeId}/payments`, {
      headers: getHeaders(timestamp, signature),
    })
    if (!response.ok) return { success: false, error: await response.text(), payments: [] }
    const data = await response.json()
    return { success: true, payments: data.payments || [] }
  } catch (error) {
    return { success: false, error: String(error), payments: [] }
  }
}

export async function getBills(payeeId: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = generateSignature(timestamp)
  try {
    const response = await fetch(`${TIPALTI_BASE_URL}/api/v1/payees/${payeeId}/bills`, {
      headers: getHeaders(timestamp, signature),
    })
    if (!response.ok) return { success: false, error: await response.text(), bills: [] }
    const data = await response.json()
    return { success: true, bills: data.bills || [] }
  } catch (error) {
    return { success: false, error: String(error), bills: [] }
  }
}
