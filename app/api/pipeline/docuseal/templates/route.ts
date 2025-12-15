// DocuSeal Template Management - Full PandaDocs Migration
// Creates all 9 SkyYield templates with exact field parity

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

const DOCUSEAL_API_BASE = process.env.DOCUSEAL_API_URL || 'https://api.docuseal.co'

async function docusealFetch(endpoint: string, options: RequestInit = {}) {
  const apiKey = process.env.DOCUSEAL_API_KEY
  if (!apiKey) throw new Error('DOCUSEAL_API_KEY not configured')

  const res = await fetch(`${DOCUSEAL_API_BASE}${endpoint}`, {
    ...options,
    headers: { 'X-Auth-Token': apiKey, 'Content-Type': 'application/json', ...options.headers },
  })

  if (!res.ok) throw new Error(`DocuSeal API error: ${res.status} - ${await res.text()}`)
  return res.json()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const templateId = searchParams.get('id')

  try {
    if (templateId) {
      const template = await docusealFetch(`/templates/${templateId}`)
      return NextResponse.json({ success: true, template })
    }
    const templates = await docusealFetch('/templates?limit=100')
    return NextResponse.json({ success: true, templates })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, templateType } = await request.json()

    if (action === 'create_all') {
      const types = ['contractor_contract', 'nda', 'loi', 'location_deployment', 'referral_agreement', 'non_compete', 'employee_writeup', 'offer_letter', 'termination']
      const results = []
      for (const type of types) {
        try {
          const result = await createTemplate(type)
          results.push({ type, success: true, ...result })
        } catch (e) {
          results.push({ type, success: false, error: String(e) })
        }
      }
      return NextResponse.json({ success: true, message: `Created ${results.filter(r => r.success).length}/${types.length}`, results })
    }

    if (action === 'create_single') return NextResponse.json({ success: true, ...(await createTemplate(templateType)) })
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

async function createTemplate(type: string) {
  const templates: Record<string, { name: string; html: string }> = {
    contractor_contract: { name: 'SkyYield - Contractor Contract', html: contractorHTML() },
    nda: { name: 'SkyYield - NDA', html: ndaHTML() },
    loi: { name: 'SkyYield - LOI', html: loiHTML() },
    location_deployment: { name: 'SkyYield - Deployment Agreement', html: deploymentHTML() },
    referral_agreement: { name: 'SkyYield - Partner Agreement', html: referralHTML() },
    non_compete: { name: 'SkyYield - Non-Compete', html: nonCompeteHTML() },
    employee_writeup: { name: 'SkyYield - Employee Write-Up', html: writeupHTML() },
    offer_letter: { name: 'SkyYield - Offer Letter', html: offerHTML() },
    termination: { name: 'SkyYield - Termination Letter', html: terminationHTML() },
  }

  const t = templates[type]
  if (!t) throw new Error(`Unknown type: ${type}`)

  const result = await docusealFetch('/templates/html', {
    method: 'POST',
    body: JSON.stringify({ name: t.name, html: t.html, folder_name: 'SkyYield Templates' }),
  })

  const supabase = getSupabaseAdmin()
  await supabase.from('document_templates').upsert({
    docuseal_template_id: result.id, name: t.name, slug: result.slug, template_type: type, is_active: true, is_default: true,
  }, { onConflict: 'template_type' })

  return { id: result.id, name: result.name, slug: result.slug, templateType: type }
}

const css = `body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:10pt;line-height:1.4;color:#333;margin:30px 40px}.header{text-align:center;margin-bottom:25px;border-bottom:2px solid #0EA5E9;padding-bottom:15px}.logo{font-size:28pt;font-weight:bold;color:#0EA5E9}.title{font-size:14pt;margin-top:8px;color:#0A0F2C;text-transform:uppercase}.section{margin-bottom:15px}.section-title{font-weight:bold;font-size:11pt;color:#0A0F2C;background:#f5f5f5;padding:8px 12px;margin-bottom:10px;border-left:3px solid #0EA5E9}.field-row{display:flex;margin-bottom:8px;align-items:center}.field-label{width:180px;font-weight:500;color:#555}.signature-block{margin-top:30px;display:flex;justify-content:space-between}.signature-party{width:45%;border:1px solid #ddd;padding:15px;border-radius:5px}.signature-party h4{margin:0 0 15px 0;color:#0A0F2C;border-bottom:1px solid #eee;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:12px 0;font-size:9pt}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0A0F2C;color:white}.highlight{background:#E3F2FD;padding:12px;border-radius:5px;margin:12px 0;border-left:3px solid #0EA5E9}.warning{background:#FFF3E0;border-left-color:#FF9800}`

// 1. Contractor Contract
function contractorHTML() {
  return `<!DOCTYPE html><html><head><style>${css}</style></head><body>
<div class="header"><div class="logo">SkyYield</div><div class="title">Independent Contractor Agreement</div></div>
<p>Effective Date: <date-field name="effective_date" role="SkyYield" required="true" style="width:130px;"></date-field></p>
<div class="section"><div class="section-title">CONTRACTOR</div>
<div class="field-row"><span class="field-label">Name:</span><text-field name="contractor_name" role="Contractor" required="true" style="width:250px;"></text-field></div>
<div class="field-row"><span class="field-label">Legal Name:</span><text-field name="contractor_legal_name" role="Contractor" style="width:250px;"></text-field></div>
<div class="field-row"><span class="field-label">Entity Type:</span><select-field name="contractor_entity_type" role="Contractor" required="true" style="width:200px;"><option>Individual</option><option>LLC</option><option>Corporation</option></select-field></div>
<div class="field-row"><span class="field-label">State:</span><text-field name="contractor_state_residence" role="Contractor" required="true" style="width:150px;"></text-field></div>
</div>
<div class="section"><div class="section-title">ADDRESS</div>
<div class="field-row"><span class="field-label">Address 1:</span><text-field name="contractor_address_1" role="Contractor" required="true" style="width:300px;"></text-field></div>
<div class="field-row"><span class="field-label">Address 2:</span><text-field name="contractor_address_2" role="Contractor" style="width:300px;"></text-field></div>
<div class="field-row"><span class="field-label">City:</span><text-field name="contractor_city" role="Contractor" required="true" style="width:150px;"></text-field></div>
<div class="field-row"><span class="field-label">State:</span><text-field name="contractor_state" role="Contractor" required="true" style="width:100px;"></text-field></div>
<div class="field-row"><span class="field-label">ZIP:</span><text-field name="contractor_zip" role="Contractor" required="true" style="width:100px;"></text-field></div>
<div class="field-row"><span class="field-label">Attn:</span><text-field name="contractor_attn" role="Contractor" style="width:200px;"></text-field></div>
</div>
<div class="section"><div class="section-title">TERMS</div>
<div class="field-row"><span class="field-label">Engagement Term:</span><text-field name="engagement_term" role="SkyYield" required="true" style="width:200px;"></text-field></div>
<p>Scope of Work:</p><textarea-field name="scope_of_work" role="SkyYield" required="true" style="width:100%;height:80px;"></textarea-field>
<p>Fees:</p><textarea-field name="contractor_fees" role="SkyYield" required="true" style="width:100%;height:60px;"></textarea-field>
</div>
<p>Initials: SkyYield <initials-field name="skyyield_initials" role="SkyYield" required="true" style="width:60px;height:30px;"></initials-field> Contractor <initials-field name="contractor_initials" role="Contractor" required="true" style="width:60px;height:30px;"></initials-field></p>
<div class="signature-block">
<div class="signature-party"><h4>SkyYield LLC</h4><signature-field name="skyyield_signature" role="SkyYield" required="true" style="height:50px;"></signature-field>
<p>Title: <text-field name="skyyield_signer_title" role="SkyYield" required="true" style="width:150px;"></text-field></p>
<p>Date: <date-field name="skyyield_signature_date" role="SkyYield" required="true" style="width:120px;"></date-field></p></div>
<div class="signature-party"><h4>Contractor</h4><signature-field name="contractor_signature" role="Contractor" required="true" style="height:50px;"></signature-field>
<p>Title: <text-field name="contractor_signer_title" role="Contractor" style="width:150px;"></text-field></p>
<p>Date: <date-field name="contractor_signature_date" role="Contractor" required="true" style="width:120px;"></date-field></p></div>
</div></body></html>`
}

// 2. NDA
function ndaHTML() {
  return `<!DOCTYPE html><html><head><style>${css}</style></head><body>
<div class="header"><div class="logo">SkyYield</div><div class="title">Non-Disclosure Agreement</div></div>
<div class="section"><div class="section-title">DISCLOSING PARTY</div>
<div class="field-row"><span class="field-label">Name:</span><text-field name="disclosing_party_name" role="SkyYield" required="true" style="width:250px;">SkyYield LLC</text-field></div>
<div class="field-row"><span class="field-label">Address:</span><text-field name="disclosing_party_address" role="SkyYield" required="true" style="width:350px;"></text-field></div>
</div>
<div class="section"><div class="section-title">RECEIVING PARTY</div>
<div class="field-row"><span class="field-label">Name:</span><text-field name="receiving_party_name" role="Client" required="true" style="width:250px;"></text-field></div>
<div class="field-row"><span class="field-label">Address:</span><text-field name="receiving_party_address" role="Client" required="true" style="width:350px;"></text-field></div>
</div>
<div class="signature-block">
<div class="signature-party"><h4>Disclosing Party</h4><signature-field name="disclosing_party_signature" role="SkyYield" required="true" style="height:50px;"></signature-field>
<p>Name: <text-field name="disclosing_party_signer_name" role="SkyYield" required="true" style="width:150px;"></text-field></p>
<p>Title: <text-field name="disclosing_party_signer_title" role="SkyYield" required="true" style="width:150px;"></text-field></p>
<p>Date: <date-field name="disclosing_party_signature_date" role="SkyYield" required="true" style="width:120px;"></date-field></p></div>
<div class="signature-party"><h4>Receiving Party</h4><signature-field name="receiving_party_signature" role="Client" required="true" style="height:50px;"></signature-field>
<p>Name: <text-field name="receiving_party_signer_name" role="Client" required="true" style="width:150px;"></text-field></p>
<p>Title: <text-field name="receiving_party_signer_title" role="Client" style="width:150px;"></text-field></p>
<p>Date: <date-field name="receiving_party_signature_date" role="Client" required="true" style="width:120px;"></date-field></p></div>
</div></body></html>`
}

// 3. LOI
function loiHTML() {
  return `<!DOCTYPE html><html><head><style>${css}</style></head><body>
<div class="header"><div class="logo">SkyYield</div><div class="title">Letter of Intent</div></div>
<p>Date: <date-field name="loi_date" role="SkyYield" required="true" style="width:130px;"></date-field></p>
<div class="section"><div class="section-title">LOCATION PARTNER</div>
<div class="field-row"><span class="field-label">Company:</span><text-field name="lp_company_name" role="Client" required="true" style="width:280px;"></text-field></div>
<div class="field-row"><span class="field-label">Address:</span><text-field name="lp_address_1" role="Client" required="true" style="width:280px;"></text-field></div>
<div class="field-row"><span class="field-label">Address 2:</span><text-field name="lp_address_2" role="Client" style="width:280px;"></text-field></div>
<div class="field-row"><span class="field-label">City:</span><text-field name="lp_city" role="Client" required="true" style="width:150px;"></text-field> State: <text-field name="lp_state" role="Client" required="true" style="width:60px;"></text-field> ZIP: <text-field name="lp_zip" role="Client" required="true" style="width:80px;"></text-field></div>
<div class="field-row"><span class="field-label">Contact:</span><text-field name="lp_contact_name" role="Client" required="true" style="width:200px;"></text-field></div>
<div class="field-row"><span class="field-label">Title:</span><text-field name="lp_contact_title" role="Client" style="width:200px;"></text-field></div>
<div class="field-row"><span class="field-label">Email:</span><text-field name="lp_contact_email" role="Client" required="true" style="width:250px;"></text-field></div>
</div>
<div class="section"><div class="section-title">TRIAL PERIOD</div>
<div class="highlight">
<div class="field-row"><span class="field-label">Start:</span><date-field name="trial_start_date" role="SkyYield" required="true" style="width:130px;"></date-field></div>
<div class="field-row"><span class="field-label">End:</span><date-field name="trial_end_date" role="SkyYield" required="true" style="width:130px;"></date-field></div>
</div></div>
<div class="section"><div class="section-title">EQUIPMENT</div>
<table><tr><th>Type</th><th>PPU</th><th>Units</th><th>Total</th></tr>
<tr><td>AP Indoor</td><td>$<number-field name="ap_inside_ppu" role="SkyYield" style="width:70px;"></number-field></td><td><number-field name="ap_inside_units" role="SkyYield" style="width:50px;"></number-field></td><td>$<number-field name="ap_inside_total" role="SkyYield" style="width:80px;"></number-field></td></tr>
<tr><td>AP Outdoor</td><td>$<number-field name="ap_outside_ppu" role="SkyYield" style="width:70px;"></number-field></td><td><number-field name="ap_outside_units" role="SkyYield" style="width:50px;"></number-field></td><td>$<number-field name="ap_outside_total" role="SkyYield" style="width:80px;"></number-field></td></tr>
<tr><td>Router</td><td>$<number-field name="router_ppu" role="SkyYield" style="width:70px;"></number-field></td><td><number-field name="router_units" role="SkyYield" style="width:50px;"></number-field></td><td>$<number-field name="router_total" role="SkyYield" style="width:80px;"></number-field></td></tr>
<tr><td>Switch</td><td>$<number-field name="switch_ppu" role="SkyYield" style="width:70px;"></number-field></td><td><number-field name="switch_units" role="SkyYield" style="width:50px;"></number-field></td><td>$<number-field name="switch_total" role="SkyYield" style="width:80px;"></number-field></td></tr>
<tr><td>Software</td><td>$<number-field name="software_ppu" role="SkyYield" style="width:70px;"></number-field></td><td><number-field name="software_units" role="SkyYield" style="width:50px;"></number-field></td><td>$<number-field name="software_total" role="SkyYield" style="width:80px;"></number-field></td></tr>
<tr><td>Installation</td><td>$<number-field name="installation_ppu" role="SkyYield" style="width:70px;"></number-field></td><td><number-field name="installation_units" role="SkyYield" style="width:50px;"></number-field></td><td>$<number-field name="installation_total" role="SkyYield" style="width:80px;"></number-field></td></tr>
<tr style="background:#f5f5f5;font-weight:bold;"><td colspan="3" style="text-align:right;">TOTAL:</td><td>$<number-field name="total_cost" role="SkyYield" style="width:80px;"></number-field></td></tr>
</table></div>
<div class="signature-block">
<div class="signature-party"><h4>SkyYield LLC</h4><signature-field name="skyyield_signature" role="SkyYield" required="true" style="height:50px;"></signature-field>
<p>Name: <text-field name="skyyield_signer_name" role="SkyYield" required="true" style="width:150px;"></text-field></p>
<p>Title: <text-field name="skyyield_signer_title" role="SkyYield" required="true" style="width:150px;"></text-field></p>
<p>Date: <date-field name="skyyield_signature_date" role="SkyYield" required="true" style="width:120px;"></date-field></p></div>
<div class="signature-party"><h4>Location Partner</h4><signature-field name="lp_signature" role="Client" required="true" style="height:50px;"></signature-field>
<p>Name: <text-field name="lp_signer_name" role="Client" required="true" style="width:150px;"></text-field></p>
<p>Title: <text-field name="lp_signer_title" role="Client" style="width:150px;"></text-field></p>
<p>Date: <date-field name="lp_signature_date" role="Client" required="true" style="width:120px;"></date-field></p></div>
</div></body></html>`
}

// 4. Deployment Agreement
function deploymentHTML() {
  return `<!DOCTYPE html><html><head><style>${css}</style></head><body>
<div class="header"><div class="logo">SkyYield</div><div class="title">Deployment Agreement</div></div>
<p>Date: <date-field name="agreement_date" role="SkyYield" required="true" style="width:130px;"></date-field></p>
<div class="section"><div class="section-title">PARTNER</div>
<div class="field-row"><span class="field-label">Company:</span><text-field name="lp_company_name" role="Client" required="true" style="width:280px;"></text-field></div>
<div class="field-row"><span class="field-label">Address:</span><text-field name="lp_address" role="Client" required="true" style="width:350px;"></text-field></div>
<div class="field-row"><span class="field-label">Option:</span><text-field name="deployment_option" role="SkyYield" required="true" style="width:250px;"></text-field></div>
</div>
<div class="section"><div class="section-title">EQUIPMENT</div>
<table><tr><th>Type</th><th>PPU</th><th>Units</th><th>Total</th><th>Payment</th><th>Owner</th></tr>
<tr><td>AP Indoor</td><td>$<number-field name="ap_inside_ppu" role="SkyYield" style="width:55px;"></number-field></td><td><number-field name="ap_inside_units" role="SkyYield" style="width:35px;"></number-field></td><td>$<number-field name="ap_inside_total" role="SkyYield" style="width:60px;"></number-field></td><td><select-field name="ap_inside_payment" role="SkyYield" style="width:75px;"><option>SkyYield</option><option>Partner</option></select-field></td><td><select-field name="ap_inside_ownership" role="SkyYield" style="width:75px;"><option>SkyYield</option><option>Partner</option></select-field></td></tr>
<tr><td>AP Outdoor</td><td>$<number-field name="ap_outside_ppu" role="SkyYield" style="width:55px;"></number-field></td><td><number-field name="ap_outside_units" role="SkyYield" style="width:35px;"></number-field></td><td>$<number-field name="ap_outside_total" role="SkyYield" style="width:60px;"></number-field></td><td><select-field name="ap_outside_payment" role="SkyYield" style="width:75px;"><option>SkyYield</option><option>Partner</option></select-field></td><td><select-field name="ap_outside_ownership" role="SkyYield" style="width:75px;"><option>SkyYield</option><option>Partner</option></select-field></td></tr>
<tr><td>Router</td><td>$<number-field name="router_ppu" role="SkyYield" style="width:55px;"></number-field></td><td><number-field name="router_units" role="SkyYield" style="width:35px;"></number-field></td><td>$<number-field name="router_total" role="SkyYield" style="width:60px;"></number-field></td><td><select-field name="router_payment" role="SkyYield" style="width:75px;"><option>SkyYield</option><option>Partner</option></select-field></td><td><select-field name="router_ownership" role="SkyYield" style="width:75px;"><option>SkyYield</option><option>Partner</option></select-field></td></tr>
<tr><td>Switch</td><td>$<number-field name="switch_ppu" role="SkyYield" style="width:55px;"></number-field></td><td><number-field name="switch_units" role="SkyYield" style="width:35px;"></number-field></td><td>$<number-field name="switch_total" role="SkyYield" style="width:60px;"></number-field></td><td><select-field name="switch_payment" role="SkyYield" style="width:75px;"><option>SkyYield</option><option>Partner</option></select-field></td><td><select-field name="switch_ownership" role="SkyYield" style="width:75px;"><option>SkyYield</option><option>Partner</option></select-field></td></tr>
<tr><td>Software</td><td>$<number-field name="software_ppu" role="SkyYield" style="width:55px;"></number-field></td><td><number-field name="software_units" role="SkyYield" style="width:35px;"></number-field></td><td>$<number-field name="software_total" role="SkyYield" style="width:60px;"></number-field></td><td><select-field name="software_payment" role="SkyYield" style="width:75px;"><option>SkyYield</option><option>Partner</option></select-field></td><td><select-field name="software_ownership" role="SkyYield" style="width:75px;"><option>SkyYield</option><option>Partner</option></select-field></td></tr>
<tr><td>Install</td><td>$<number-field name="installation_ppu" role="SkyYield" style="width:55px;"></number-field></td><td><number-field name="installation_units" role="SkyYield" style="width:35px;"></number-field></td><td>$<number-field name="installation_total" role="SkyYield" style="width:60px;"></number-field></td><td><select-field name="installation_payment" role="SkyYield" style="width:75px;"><option>SkyYield</option><option>Partner</option></select-field></td><td><select-field name="installation_ownership" role="SkyYield" style="width:75px;"><option>SkyYield</option><option>Partner</option></select-field></td></tr>
</table>
<p>Partner Total: $<number-field name="total_to_lp" role="SkyYield" style="width:100px;"></number-field> | SkyYield Total: $<number-field name="total_to_skyyield" role="SkyYield" style="width:100px;"></number-field></p>
</div>
<div class="section"><div class="section-title">REVENUE</div>
<div class="highlight"><p>Partner Share: <number-field name="revenue_payout" role="SkyYield" required="true" style="width:80px;"></number-field>%</p></div>
</div>
<div class="signature-block">
<div class="signature-party"><h4>SkyYield LLC</h4><signature-field name="skyyield_signature" role="SkyYield" required="true" style="height:50px;"></signature-field>
<p>Name: <text-field name="skyyield_signer_name" role="SkyYield" required="true" style="width:150px;"></text-field></p>
<p>Title: <text-field name="skyyield_signer_title" role="SkyYield" required="true" style="width:150px;"></text-field></p>
<p>Date: <date-field name="skyyield_signature_date" role="SkyYield" required="true" style="width:120px;"></date-field></p></div>
<div class="signature-party"><h4>Partner</h4><signature-field name="lp_signature" role="Client" required="true" style="height:50px;"></signature-field>
<p>Name: <text-field name="lp_signer_name" role="Client" required="true" style="width:150px;"></text-field></p>
<p>Title: <text-field name="lp_signer_title" role="Client" style="width:150px;"></text-field></p>
<p>Date: <date-field name="lp_signature_date" role="Client" required="true" style="width:120px;"></date-field></p></div>
</div></body></html>`
}

// 5. Referral/Partner Agreement
function referralHTML() {
  return `<!DOCTYPE html><html><head><style>${css}</style></head><body>
<div class="header"><div class="logo">SkyYield</div><div class="title">Partner Agreement</div></div>
<div class="section"><div class="section-title">PARTNER</div>
<div class="field-row"><span class="field-label">Name:</span><text-field name="partner_name" role="Partner" required="true" style="width:250px;"></text-field></div>
<div class="field-row"><span class="field-label">Company:</span><text-field name="partner_company" role="Partner" style="width:250px;"></text-field></div>
<div class="field-row"><span class="field-label">Address:</span><text-field name="partner_address" role="Partner" required="true" style="width:350px;"></text-field></div>
</div>
<div class="section"><div class="section-title">COMMISSION</div>
<table><tr><th>Type</th><th>Rate</th><th>Duration</th></tr>
<tr><td>Referral</td><td><number-field name="referral_commission_pct" role="SkyYield" style="width:60px;"></number-field>%</td><td>24 months</td></tr>
<tr><td>Relationship</td><td><number-field name="relationship_commission_pct" role="SkyYield" style="width:60px;"></number-field>%</td><td>12 months</td></tr>
<tr><td>Channel</td><td><number-field name="channel_commission_pct" role="SkyYield" style="width:60px;"></number-field>%</td><td>Lifetime</td></tr>
</table>
<div class="highlight"><p>Your Rate: <number-field name="partner_commission_pct" role="SkyYield" required="true" style="width:60px;"></number-field>%</p>
<p>Details: <text-field name="partner_commission_text" role="SkyYield" style="width:300px;"></text-field></p></div>
</div>
<div class="signature-block">
<div class="signature-party"><h4>SkyYield LLC</h4><signature-field name="skyyield_signature" role="SkyYield" required="true" style="height:50px;"></signature-field>
<p>Name: <text-field name="skyyield_signer_name" role="SkyYield" required="true" style="width:150px;"></text-field></p>
<p>Title: <text-field name="skyyield_signer_title" role="SkyYield" required="true" style="width:150px;"></text-field></p>
<p>Date: <date-field name="skyyield_signature_date" role="SkyYield" required="true" style="width:120px;"></date-field></p></div>
<div class="signature-party"><h4>Partner</h4><signature-field name="partner_signature" role="Partner" required="true" style="height:50px;"></signature-field>
<p>Name: <text-field name="signing_partner_name" role="Partner" required="true" style="width:150px;"></text-field></p>
<p>Title: <text-field name="partner_title" role="Partner" style="width:150px;"></text-field></p>
<p>Date: <date-field name="partner_signature_date" role="Partner" required="true" style="width:120px;"></date-field></p></div>
</div></body></html>`
}

// 6. Non-Compete
function nonCompeteHTML() {
  return `<!DOCTYPE html><html><head><style>${css}</style></head><body>
<div class="header"><div class="logo">SkyYield</div><div class="title">Non-Compete Agreement</div></div>
<p>Effective: <date-field name="effective_date" role="SkyYield" required="true" style="width:130px;"></date-field></p>
<div class="section"><div class="section-title">EMPLOYEE</div>
<div class="field-row"><span class="field-label">Address:</span><text-field name="employee_address_1" role="Employee" required="true" style="width:300px;"></text-field></div>
<div class="field-row"><span class="field-label">Address 2:</span><text-field name="employee_address_2" role="Employee" style="width:300px;"></text-field></div>
<div class="field-row"><span class="field-label">City:</span><text-field name="employee_city" role="Employee" required="true" style="width:150px;"></text-field></div>
<div class="field-row"><span class="field-label">State:</span><text-field name="employee_state" role="Employee" required="true" style="width:100px;"></text-field></div>
<div class="field-row"><span class="field-label">ZIP:</span><text-field name="employee_zip" role="Employee" required="true" style="width:100px;"></text-field></div>
<div class="field-row"><span class="field-label">Attn:</span><text-field name="employee_attn" role="Employee" style="width:200px;"></text-field></div>
<div class="field-row"><span class="field-label">Fax:</span><text-field name="employee_facsimile" role="Employee" style="width:150px;"></text-field></div>
<div class="field-row"><span class="field-label">Email:</span><text-field name="employee_email" role="Employee" required="true" style="width:250px;"></text-field></div>
</div>
<div class="section"><div class="section-title">RESTRICTION</div>
<div class="highlight warning"><p>Period: <number-field name="restricted_period_months" role="SkyYield" required="true" style="width:60px;"></number-field> months after termination</p></div>
</div>
<div class="section"><div class="section-title">PRIOR INVENTIONS</div>
<textarea-field name="prior_inventions" role="Employee" style="width:100%;height:80px;"></textarea-field>
</div>
<div class="signature-block">
<div class="signature-party" style="width:100%;"><h4>Employee</h4><signature-field name="employee_signature" role="Employee" required="true" style="height:50px;"></signature-field>
<p>Date: <date-field name="employee_signing_date" role="Employee" required="true" style="width:130px;"></date-field></p></div>
</div></body></html>`
}

// 7. Employee Write-Up
function writeupHTML() {
  return `<!DOCTYPE html><html><head><style>${css}</style></head><body>
<div class="header"><div class="logo">SkyYield</div><div class="title">Employee Write-Up</div></div>
<div class="section"><div class="section-title">DETAILS</div>
<div class="field-row"><span class="field-label">Date:</span><date-field name="writeup_date" role="SkyYield" required="true" style="width:130px;"></date-field></div>
<div class="field-row"><span class="field-label">Employee:</span><text-field name="employee_name" role="SkyYield" required="true" style="width:250px;"></text-field></div>
<div class="field-row"><span class="field-label">Manager:</span><text-field name="manager_name" role="SkyYield" required="true" style="width:250px;"></text-field></div>
</div>
<div class="section"><div class="section-title">REASON</div>
<textarea-field name="reason_for_writeup" role="SkyYield" required="true" style="width:100%;height:100px;"></textarea-field>
</div>
<div class="section"><div class="section-title">PROBATION</div>
<div class="highlight warning">
<div class="field-row"><span class="field-label">Start:</span><date-field name="probation_start_date" role="SkyYield" required="true" style="width:130px;"></date-field></div>
<div class="field-row"><span class="field-label">End:</span><date-field name="probation_end_date" role="SkyYield" required="true" style="width:130px;"></date-field></div>
</div></div>
<div class="section"><div class="section-title">GOALS</div>
<textarea-field name="goals_during_probation" role="SkyYield" required="true" style="width:100%;height:80px;"></textarea-field>
</div>
<div class="field-row"><span class="field-label">If Failed:</span><select-field name="failed_probation_result" role="SkyYield" required="true" style="width:200px;"><option>Suspension</option><option>Termination</option></select-field></div>
<div class="signature-block">
<div class="signature-party"><h4>Manager</h4><signature-field name="manager_signature" role="SkyYield" required="true" style="height:50px;"></signature-field>
<p>Date: <date-field name="manager_signature_date" role="SkyYield" required="true" style="width:130px;"></date-field></p></div>
<div class="signature-party"><h4>Employee</h4><signature-field name="employee_signature" role="Employee" required="true" style="height:50px;"></signature-field>
<p>Date: <date-field name="employee_signature_date" role="Employee" required="true" style="width:130px;"></date-field></p></div>
</div></body></html>`
}

// 8. Offer Letter
function offerHTML() {
  return `<!DOCTYPE html><html><head><style>${css}</style></head><body>
<div class="header"><div class="logo">SkyYield</div><div class="title">Employment Offer</div></div>
<p><date-field name="offer_date" role="SkyYield" required="true" style="width:130px;"></date-field></p>
<p>Dear <text-field name="candidate_name" role="SkyYield" required="true" style="width:200px;"></text-field>,</p>
<p>We are pleased to offer you employment at SkyYield LLC:</p>
<div class="section"><div class="section-title">POSITION</div>
<div class="field-row"><span class="field-label">Title:</span><text-field name="job_title" role="SkyYield" required="true" style="width:250px;"></text-field></div>
<p>Description:</p><textarea-field name="job_description" role="SkyYield" required="true" style="width:100%;height:80px;"></textarea-field>
<div class="field-row"><span class="field-label">Start Date:</span><date-field name="start_date" role="SkyYield" required="true" style="width:130px;"></date-field></div>
</div>
<div class="section"><div class="section-title">COMPENSATION</div>
<div class="highlight">
<div class="field-row"><span class="field-label">Bi-Monthly:</span>$<number-field name="bimonthly_pay" role="SkyYield" required="true" style="width:100px;"></number-field></div>
<div class="field-row"><span class="field-label">Annual:</span>$<number-field name="annual_pay" role="SkyYield" required="true" style="width:100px;"></number-field></div>
</div></div>
<div class="section"><div class="section-title">TIME OFF</div>
<div class="field-row"><span class="field-label">Vacation Weeks:</span><number-field name="vacation_weeks" role="SkyYield" required="true" style="width:60px;"></number-field></div>
<div class="field-row"><span class="field-label">Vacation Days:</span><number-field name="vacation_days" role="SkyYield" required="true" style="width:60px;"></number-field></div>
<div class="field-row"><span class="field-label">Flex Days:</span><number-field name="flex_days" role="SkyYield" required="true" style="width:60px;"></number-field></div>
</div>
<div class="signature-block">
<div class="signature-party"><h4>SkyYield LLC</h4><signature-field name="skyyield_signature" role="SkyYield" required="true" style="height:50px;"></signature-field>
<p>Name: <text-field name="skyyield_signer_name" role="SkyYield" required="true" style="width:150px;"></text-field></p>
<p>Date: <date-field name="skyyield_signature_date" role="SkyYield" required="true" style="width:130px;"></date-field></p></div>
<div class="signature-party"><h4>Candidate</h4><signature-field name="candidate_signature" role="Candidate" required="true" style="height:50px;"></signature-field>
<p>Date: <date-field name="candidate_signature_date" role="Candidate" required="true" style="width:130px;"></date-field></p></div>
</div></body></html>`
}

// 9. Termination Letter
function terminationHTML() {
  return `<!DOCTYPE html><html><head><style>${css}</style></head><body>
<div class="header"><div class="logo">SkyYield</div><div class="title">Termination Letter</div></div>
<p><date-field name="termination_letter_date" role="SkyYield" required="true" style="width:130px;"></date-field></p>
<p>To: <text-field name="employee_name" role="SkyYield" required="true" style="width:200px;"></text-field></p>
<p><text-field name="employee_address" role="SkyYield" required="true" style="width:300px;"></text-field></p>
<p><text-field name="employee_address_2" role="SkyYield" style="width:300px;"></text-field></p>
<p><text-field name="employee_city" role="SkyYield" required="true" style="width:150px;"></text-field>, <text-field name="employee_state" role="SkyYield" required="true" style="width:50px;"></text-field> <text-field name="employee_zip" role="SkyYield" required="true" style="width:80px;"></text-field></p>
<p>From: <text-field name="skyyield_representative" role="SkyYield" required="true" style="width:200px;"></text-field>, SkyYield LLC</p>
<div class="section"><div class="section-title">DETAILS</div>
<div class="field-row"><span class="field-label">Position:</span><text-field name="job_title" role="SkyYield" required="true" style="width:200px;"></text-field></div>
<div class="field-row"><span class="field-label">Date:</span><date-field name="termination_date" role="SkyYield" required="true" style="width:130px;"></date-field></div>
<div class="field-row"><span class="field-label">Time:</span><text-field name="termination_time" role="SkyYield" required="true" style="width:100px;"></text-field></div>
</div>
<div class="section"><div class="section-title">REASON</div>
<textarea-field name="termination_reasons" role="SkyYield" required="true" style="width:100%;height:80px;"></textarea-field>
</div>
<div class="section"><div class="section-title">FINAL</div>
<div class="highlight warning">
<div class="field-row"><span class="field-label">Equipment Return:</span><date-field name="equipment_return_date" role="SkyYield" required="true" style="width:130px;"></date-field> at <text-field name="equipment_return_time" role="SkyYield" required="true" style="width:100px;"></text-field></div>
<div class="field-row"><span class="field-label">Final Pay:</span><date-field name="final_pay_date" role="SkyYield" required="true" style="width:130px;"></date-field></div>
</div></div>
<div class="signature-block">
<div class="signature-party"><h4>SkyYield</h4><signature-field name="skyyield_signature" role="SkyYield" required="true" style="height:50px;"></signature-field></div>
<div class="signature-party"><h4>Employee</h4><signature-field name="employee_signature" role="Employee" required="true" style="height:50px;"></signature-field></div>
</div></body></html>`
}
