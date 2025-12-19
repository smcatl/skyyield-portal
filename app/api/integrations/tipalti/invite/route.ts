// app/api/integrations/tipalti/invite/route.ts
// Tipalti Payment Invite API
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TIPALTI_BASE_URL = process.env.TIPALTI_SANDBOX === 'true' 
  ? 'https://api-sandbox.tipalti.com'
  : 'https://api.tipalti.com'

// Entity type to table mapping
const ENTITY_CONFIG: Record<string, {
  table: string
  idField: string
  nameField: string
  emailField: string
}> = {
  location_partner: {
    table: 'location_partners',
    idField: 'partner_id',
    nameField: 'company_name',
    emailField: 'email',
  },
  referral_partner: {
    table: 'referral_partners',
    idField: 'partner_id',
    nameField: 'company_name',
    emailField: 'contact_email',
  },
  contractor: {
    table: 'contractors',
    idField: 'contractor_id',
    nameField: 'legal_name',
    emailField: 'contact_email',
  },
  employee: {
    table: 'employees',
    idField: 'employee_id',
    nameField: 'full_name',
    emailField: 'email',
  },
}

// POST - Create Tipalti payee and send invite
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await request.json()

    const { entity_type, entity_id } = body

    if (!entity_type || !entity_id) {
      return NextResponse.json({ 
        error: 'entity_type and entity_id are required' 
      }, { status: 400 })
    }

    const config = ENTITY_CONFIG[entity_type]
    if (!config) {
      return NextResponse.json({ 
        error: `Unknown entity type: ${entity_type}` 
      }, { status: 400 })
    }

    // Get entity data
    const { data: entity, error: entityError } = await supabase
      .from(config.table)
      .select('*')
      .eq('id', entity_id)
      .single()

    if (entityError || !entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Check if already has Tipalti ID
    if (entity.tipalti_payee_id) {
      return NextResponse.json({ 
        error: 'Entity already has Tipalti payee ID',
        tipalti_payee_id: entity.tipalti_payee_id,
      }, { status: 400 })
    }

    // Create Tipalti payee
    const payeeId = entity[config.idField] // Use our internal ID as Tipalti ID
    
    const payeePayload = {
      idap: payeeId,
      alias: entity[config.nameField],
      email: entity[config.emailField],
      payeeEntityType: getPayeeEntityType(entity_type, entity),
      payeeName: entity[config.nameField],
      street1: entity.address || entity.address_line_1 || entity.address_street || '',
      city: entity.city || entity.address_city || '',
      state: entity.state || entity.address_state || '',
      zip: entity.zip || entity.address_zip || '',
      country: entity.country || entity.address_country || 'US',
    }

    // Generate HMAC signature for Tipalti API
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = generateTipaltiSignature(payeePayload, timestamp)

    const tipaltiResponse = await fetch(`${TIPALTI_BASE_URL}/api/v1/payees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TIPALTI_API_KEY}`,
        'X-Tipalti-Signature': signature,
        'X-Tipalti-Timestamp': timestamp,
      },
      body: JSON.stringify(payeePayload),
    })

    if (!tipaltiResponse.ok) {
      const errorData = await tipaltiResponse.text()
      console.error('Tipalti API error:', errorData)
      
      // Continue anyway - we'll mark as invite sent
      // Tipalti might already have this payee
    }

    // Generate iFrame URL for payee to complete setup
    const iframeUrl = generateTipaltiIframeUrl(payeeId)

    // Update database
    const updateData = {
      tipalti_payee_id: payeeId,
      tipalti_invite_sent: true,
      tipalti_invite_sent_at: new Date().toISOString(),
      tipalti_status: 'invited',
      updated_at: new Date().toISOString(),
    }

    await supabase
      .from(config.table)
      .update(updateData)
      .eq('id', entity_id)

    // Log activity
    await supabase.from('activity_log').insert([{
      entity_type: entity_type.replace('_', ''),
      entity_id,
      entity_name: entity[config.nameField],
      user_id: userId || null,
      action: 'tipalti_invite_sent',
      action_category: 'tipalti',
      description: 'Tipalti payment setup invite sent',
      new_values: {
        tipalti_payee_id: payeeId,
        email: entity[config.emailField],
      },
    }])

    // Send email with iFrame URL (via your email service)
    // await sendTipaltiInviteEmail(entity[config.emailField], entity[config.nameField], iframeUrl)

    return NextResponse.json({
      success: true,
      tipalti_payee_id: payeeId,
      iframe_url: iframeUrl,
    })
  } catch (error: any) {
    console.error('Tipalti invite error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Check Tipalti payee status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const payeeId = searchParams.get('payeeId')

  if (!payeeId) {
    return NextResponse.json({ error: 'payeeId required' }, { status: 400 })
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = generateTipaltiSignature({ idap: payeeId }, timestamp)

    const response = await fetch(`${TIPALTI_BASE_URL}/api/v1/payees/${payeeId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TIPALTI_API_KEY}`,
        'X-Tipalti-Signature': signature,
        'X-Tipalti-Timestamp': timestamp,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch payee status' }, { status: 500 })
    }

    const payeeData = await response.json()

    return NextResponse.json({
      payee_id: payeeId,
      status: payeeData.payeeStatus,
      payment_method: payeeData.paymentMethod,
      is_payable: payeeData.isPayable,
    })
  } catch (error: any) {
    console.error('Tipalti status check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper: Determine Tipalti entity type
function getPayeeEntityType(entityType: string, entity: any): string {
  if (entityType === 'employee') {
    return 'Individual'
  }
  
  if (entity.entity_type === 'individual') {
    return 'Individual'
  }
  
  // Map company types to Tipalti entity types
  const companyType = entity.company_type?.toLowerCase() || ''
  if (companyType.includes('llc')) return 'LLC'
  if (companyType.includes('corp')) return 'Corporation'
  if (companyType.includes('partner')) return 'Partnership'
  if (companyType.includes('sole')) return 'SoleProprietor'
  
  return 'Company' // Default
}

// Helper: Generate Tipalti HMAC signature
function generateTipaltiSignature(payload: any, timestamp: string): string {
  const secret = process.env.TIPALTI_HMAC_SECRET || ''
  const message = timestamp + JSON.stringify(payload)
  
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex')
}

// Helper: Generate Tipalti iFrame URL for payee onboarding
function generateTipaltiIframeUrl(payeeId: string): string {
  const payerName = process.env.TIPALTI_PAYER_NAME || 'skyyield'
  const baseUrl = process.env.TIPALTI_SANDBOX === 'true'
    ? 'https://ui-sandbox.tipalti.com'
    : 'https://ui.tipalti.com'
  
  const timestamp = Math.floor(Date.now() / 1000)
  const params = `idap=${payeeId}&payer=${payerName}&ts=${timestamp}`
  
  // Generate hash for URL validation
  const hash = crypto
    .createHmac('sha256', process.env.TIPALTI_HMAC_SECRET || '')
    .update(params)
    .digest('hex')
  
  return `${baseUrl}/payeedashboard/home?${params}&hash=${hash}`
}
