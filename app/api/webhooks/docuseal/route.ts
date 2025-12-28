// app/api/webhooks/docuseal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WEBHOOK_SECRET = process.env.DOCUSEAL_WEBHOOK_SECRET

const DOC_CONFIG: Record<string, {
  table: string
  statusField: string
  signedField: string
  nextStage?: string
  activate?: boolean
}> = {
  loi: { table: 'location_partners', statusField: 'loi_status', signedField: 'loi_signed_at', nextStage: 'loi_signed' },
  contract: { table: 'location_partners', statusField: 'contract_status', signedField: 'contract_signed_at', nextStage: 'active', activate: true },
  agreement: { table: 'referral_partners', statusField: 'agreement_status', signedField: 'agreement_signed_at', activate: true },
  contractor_agreement: { table: 'contractors', statusField: 'agreement_status', signedField: 'agreement_signed_at' },
  offer_letter: { table: 'employees', statusField: 'offer_letter_status', signedField: 'offer_letter_signed_at' },
  noncompete: { table: 'employees', statusField: 'noncompete_status', signedField: 'noncompete_signed_at' },
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    if (WEBHOOK_SECRET) {
      const headerSecret = request.headers.get('X-Webhook-Secret')
      if (headerSecret !== WEBHOOK_SECRET) {
        console.error('Invalid DocuSeal webhook secret')
        return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { event_type, data } = body
    const metadata = data?.metadata || {}
    const partnerId = metadata.partner_id
    const documentType = metadata.document_type

    if (!partnerId || !documentType) {
      return NextResponse.json({ message: 'Missing metadata' })
    }

    const config = DOC_CONFIG[documentType]
    if (!config) {
      return NextResponse.json({ message: 'Unknown document type' })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (event_type === 'form.completed' || event_type === 'submission.completed') {
      updates[config.statusField] = 'signed'
      updates[config.signedField] = new Date().toISOString()
      if (config.nextStage) {
        updates.stage = config.nextStage
        updates.stage_entered_at = new Date().toISOString()
      }
      if (config.activate) {
        updates.status = 'active'
        updates.activation_date = new Date().toISOString().split('T')[0]
      }
    } else if (event_type === 'form.viewed') {
      updates[config.statusField] = 'viewed'
    } else if (event_type === 'form.sent') {
      updates[config.statusField] = 'sent'
    }

    const { data: record } = await supabase
      .from(config.table)
      .update(updates)
      .eq('id', partnerId)
      .select('company_name, contact_name, contact_full_name, full_name')
      .single()

    await supabase.from('activity_log').insert([{
      entity_type: documentType.includes('employee') ? 'employee' : 'partner',
      entity_id: partnerId,
      entity_name: record?.company_name || record?.contact_name || record?.contact_full_name || record?.full_name,
      action: `document_${event_type.split('.')[1]}`,
      action_category: 'docuseal',
      description: `${documentType.toUpperCase()} ${event_type.split('.')[1]}`,
    }])

    return NextResponse.json({ success: true, partnerId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'DocuSeal webhook active' })
}