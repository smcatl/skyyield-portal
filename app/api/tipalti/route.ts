// app/api/tipalti/route.ts
// Main Tipalti API endpoint for SkyYield
// Handles: create payee, get payee, create bill, get payments

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { 
  createOrUpdatePayee, 
  getPayeeDetails, 
  generateOnboardingUrl,
  generatePaymentHistoryUrl,
  createBill,
  getPaymentHistory,
  getPayeeInvoices,
  getAllPayees
} from '@/lib/tipalti'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const payeeId = searchParams.get('payeeId')

  try {
    switch (action) {
      case 'payee': {
        if (!payeeId) return NextResponse.json({ error: 'payeeId required' }, { status: 400 })
        const result = await getPayeeDetails(payeeId)
        return NextResponse.json(result)
      }

      case 'onboarding_url': {
        if (!payeeId) return NextResponse.json({ error: 'payeeId required' }, { status: 400 })
        const url = generateOnboardingUrl(payeeId)
        return NextResponse.json({ success: true, url })
      }

      case 'payment_history_url': {
        if (!payeeId) return NextResponse.json({ error: 'payeeId required' }, { status: 400 })
        const url = generatePaymentHistoryUrl(payeeId)
        return NextResponse.json({ success: true, url })
      }

      case 'payments': {
        if (!payeeId) return NextResponse.json({ error: 'payeeId required' }, { status: 400 })
        const result = await getPaymentHistory(payeeId)
        return NextResponse.json(result)
      }

      case 'invoices': {
        if (!payeeId) return NextResponse.json({ error: 'payeeId required' }, { status: 400 })
        const result = await getPayeeInvoices(payeeId)
        return NextResponse.json(result)
      }

      case 'list_payees': {
        // Get all partners with tipalti_payee_id from database
        const supabase = getSupabaseAdmin()
        const { data: locationPartners } = await supabase
          .from('location_partners')
          .select('id, company_legal_name, contact_full_name, contact_email, tipalti_payee_id, tipalti_status')
          .not('tipalti_payee_id', 'is', null)
        
        const { data: referralPartners } = await supabase
          .from('referral_partners')
          .select('id, company_name, contact_full_name, contact_email, tipalti_payee_id, tipalti_status')
          .not('tipalti_payee_id', 'is', null)

        const { data: channelPartners } = await supabase
          .from('channel_partners')
          .select('id, company_name, contact_full_name, contact_email, tipalti_payee_id, tipalti_status')
          .not('tipalti_payee_id', 'is', null)

        const { data: relationshipPartners } = await supabase
          .from('relationship_partners')
          .select('id, company_name, contact_full_name, contact_email, tipalti_payee_id, tipalti_status')
          .not('tipalti_payee_id', 'is', null)

        const { data: contractors } = await supabase
          .from('contractors')
          .select('id, full_name, email, tipalti_payee_id, tipalti_status')
          .not('tipalti_payee_id', 'is', null)

        return NextResponse.json({
          success: true,
          payees: {
            location_partners: locationPartners || [],
            referral_partners: referralPartners || [],
            channel_partners: channelPartners || [],
            relationship_partners: relationshipPartners || [],
            contractors: contractors || [],
          }
        })
      }

      case 'pull_from_tipalti': {
        // Pull all payees directly from Tipalti
        const result = await getAllPayees()
        return NextResponse.json(result)
      }

      case 'generate_partner_ids': {
        // Generate the Tipalti IDs that each partner SHOULD have
        // Use this to manually update existing Tipalti payees
        const supabase = getSupabaseAdmin()
        
        const { data: locationPartners } = await supabase
          .from('location_partners')
          .select('id, company_legal_name, contact_full_name, contact_email')
        
        const { data: referralPartners } = await supabase
          .from('referral_partners')
          .select('id, company_name, contact_full_name, contact_email')

        const { data: channelPartners } = await supabase
          .from('channel_partners')
          .select('id, company_name, contact_full_name, contact_email')

        const { data: relationshipPartners } = await supabase
          .from('relationship_partners')
          .select('id, company_name, contact_full_name, contact_email')

        const { data: contractors } = await supabase
          .from('contractors')
          .select('id, legal_name, dba_name, contact_email')

        const { data: employees } = await supabase
          .from('employees')
          .select('id, legal_name, preferred_name, email')

        const generateId = (prefix: string, uuid: string) => 
          `${prefix}-${uuid.replace(/-/g, '').substring(0, 8).toUpperCase()}`

        const mappings = {
          location_partners: (locationPartners || []).map(p => ({
            supabase_id: p.id,
            tipalti_id: generateId('LP', p.id),
            name: p.contact_full_name,
            company: p.company_legal_name,
            email: p.contact_email,
          })),
          referral_partners: (referralPartners || []).map(p => ({
            supabase_id: p.id,
            tipalti_id: generateId('RP', p.id),
            name: p.contact_full_name,
            company: p.company_name,
            email: p.contact_email,
          })),
          channel_partners: (channelPartners || []).map(p => ({
            supabase_id: p.id,
            tipalti_id: generateId('CP', p.id),
            name: p.contact_full_name,
            company: p.company_name,
            email: p.contact_email,
          })),
          relationship_partners: (relationshipPartners || []).map(p => ({
            supabase_id: p.id,
            tipalti_id: generateId('REL', p.id),
            name: p.contact_full_name,
            company: p.company_name,
            email: p.contact_email,
          })),
          contractors: (contractors || []).map(p => ({
            supabase_id: p.id,
            entity_id: generateId('CON', p.id),
            name: p.legal_name || p.dba_name,
            email: p.contact_email,
            payment_system: 'quickbooks_billpay',
          })),
          employees: (employees || []).map(p => ({
            supabase_id: p.id,
            entity_id: generateId('EMP', p.id),
            name: p.legal_name,
            preferred_name: p.preferred_name,
            email: p.email,
            payment_system: 'quickbooks_payroll',
          })),
        }

        return NextResponse.json({
          success: true,
          message: 'Update Tipalti payee IDs to match these values for PARTNERS ONLY. Contractors/Employees use QuickBooks.',
          id_format: {
            'LP-XXXXXXXX': 'Location Partner → Tipalti',
            'RP-XXXXXXXX': 'Referral Partner → Tipalti', 
            'CP-XXXXXXXX': 'Channel Partner → Tipalti',
            'REL-XXXXXXXX': 'Relationship Partner → Tipalti',
            'CON-XXXXXXXX': 'Contractor → QuickBooks Bill Pay',
            'EMP-XXXXXXXX': 'Employee → QuickBooks Payroll',
            'CALC-XXXXXXXX': 'Calculator User → No payments',
            'CUST-XXXXXXXX': 'Customer → No payments',
          },
          tipalti_payable: ['location_partners', 'referral_partners', 'channel_partners', 'relationship_partners'],
          quickbooks_payable: ['contractors', 'employees'],
          mappings
        })
      }

      case 'sync_from_tipalti': {
        // Pull payees from Tipalti and update Supabase records
        const supabase = getSupabaseAdmin()
        const tipaltiResult = await getAllPayees()
        
        if (!tipaltiResult.success || !tipaltiResult.payees) {
          return NextResponse.json({ error: 'Failed to fetch from Tipalti' }, { status: 500 })
        }

        const results: any[] = []

        for (const payee of tipaltiResult.payees) {
          const { payeeId, name, email, company, paymentMethod, isPayable } = payee
          
          // Determine partner type from ID prefix (only Tipalti-payable types)
          let tableName: string | null = null
          if (payeeId.startsWith('LP-')) tableName = 'location_partners'
          else if (payeeId.startsWith('RP-')) tableName = 'referral_partners'
          else if (payeeId.startsWith('CP-')) tableName = 'channel_partners'
          else if (payeeId.startsWith('REL-')) tableName = 'relationship_partners'
          // CON- and EMP- are paid via QuickBooks, not Tipalti
          
          if (!tableName) {
            results.push({ payeeId, status: 'skipped', reason: 'Unknown ID format' })
            continue
          }

          // Find partner with this tipalti_payee_id
          const { data: existing } = await supabase
            .from(tableName)
            .select('id')
            .eq('tipalti_payee_id', payeeId)
            .single()

          if (existing) {
            // Update existing record
            const { error } = await supabase
              .from(tableName)
              .update({
                tipalti_status: isPayable ? 'active' : 'pending_onboarding',
                tipalti_payment_method: paymentMethod,
                tipalti_last_synced: new Date().toISOString(),
              })
              .eq('tipalti_payee_id', payeeId)

            results.push({ 
              payeeId, 
              status: error ? 'error' : 'updated', 
              table: tableName,
              error: error?.message 
            })
          } else {
            results.push({ 
              payeeId, 
              status: 'not_found', 
              reason: 'No partner with this tipalti_payee_id',
              table: tableName
            })
          }
        }

        return NextResponse.json({
          success: true,
          synced: results.filter(r => r.status === 'updated').length,
          notFound: results.filter(r => r.status === 'not_found').length,
          skipped: results.filter(r => r.status === 'skipped').length,
          results
        })
      }

      case 'debug_payee': {
        // Debug: Get raw Tipalti response for a payee
        if (!payeeId) return NextResponse.json({ error: 'payeeId required' }, { status: 400 })
        
        const timestamp = Math.floor(Date.now() / 1000)
        const crypto = await import('crypto')
        const apiKey = process.env.TIPALTI_API_KEY || ''
        const payerName = process.env.TIPALTI_PAYER_NAME || 'SkyYield'
        
        const dataToSign = `${payerName}${payeeId}${timestamp}`
        const hmac = crypto.createHmac('sha256', apiKey)
        hmac.update(dataToSign)
        const signature = hmac.digest('hex')

        const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tip="http://Tipalti.org/">
  <soap:Body>
    <tip:GetPayeeDetails>
      <tip:payerName>${payerName}</tip:payerName>
      <tip:idap>${payeeId}</tip:idap>
      <tip:timestamp>${timestamp}</tip:timestamp>
      <tip:key>${signature}</tip:key>
    </tip:GetPayeeDetails>
  </soap:Body>
</soap:Envelope>`

        const response = await fetch('https://api.tipalti.com/v14/PayeeFunctions.asmx', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://Tipalti.org/GetPayeeDetails',
          },
          body: soapEnvelope,
        })

        const rawXml = await response.text()
        return NextResponse.json({ success: true, rawXml })
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid action',
          validActions: ['payee', 'onboarding_url', 'payment_history_url', 'payments', 'invoices', 'list_payees', 'pull_from_tipalti']
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Tipalti GET error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    const supabase = getSupabaseAdmin()

    switch (action) {
      // Create payee in Tipalti and update our database
      case 'create_payee': {
        const { partnerType, partnerId } = body
        
        // Get partner data from database
        let partner: any
        let tableName: string
        let payeeIdPrefix: string

        switch (partnerType) {
          case 'location':
            tableName = 'location_partners'
            payeeIdPrefix = 'LP'
            break
          case 'referral':
            tableName = 'referral_partners'
            payeeIdPrefix = 'RP'
            break
          case 'channel':
            tableName = 'channel_partners'
            payeeIdPrefix = 'CP'
            break
          case 'relationship':
            tableName = 'relationship_partners'
            payeeIdPrefix = 'REL'
            break
          case 'contractor':
          case 'employee':
            return NextResponse.json({ 
              error: `${partnerType}s are paid via QuickBooks, not Tipalti`,
              hint: 'Use QuickBooks Bill Pay for contractors, QuickBooks Payroll for employees'
            }, { status: 400 })
          default:
            return NextResponse.json({ error: 'Invalid partnerType. Use: location, referral, channel, relationship' }, { status: 400 })
        }

        const { data, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', partnerId)
          .single()

        if (fetchError || !data) {
          return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
        }
        partner = data

        // Generate standardized payee ID: PREFIX-FIRST8CHARS
        // e.g., LP-ABC12345, RP-DEF67890
        const payeeId = `${payeeIdPrefix}-${partnerId.replace(/-/g, '').substring(0, 8).toUpperCase()}`

        // Parse name based on partner type
        let fullName = ''
        if (partnerType === 'contractor') {
          fullName = partner.legal_name || partner.dba_name || ''
        } else {
          fullName = partner.contact_full_name || ''
        }
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || 'Partner'
        const lastName = nameParts.slice(1).join(' ') || payeeIdPrefix

        // Get email
        const email = partner.contact_email || partner.email

        // Create in Tipalti
        const result = await createOrUpdatePayee({
          payeeId,
          firstName,
          lastName,
          email,
          companyName: partner.company_legal_name || partner.company_name || partner.dba_name,
          street1: partner.company_address_street || partner.address,
          city: partner.company_address_city || partner.city,
          state: partner.company_address_state || partner.state,
          zip: partner.company_address_zip || partner.zip,
          country: 'US',
          payeeType: (partner.company_legal_name || partner.company_name) ? 'company' : 'individual',
        })

        if (result.success) {
          // Update our database with tipalti info
          await supabase
            .from(tableName)
            .update({
              tipalti_payee_id: payeeId,
              tipalti_status: 'pending_onboarding',
              tipalti_created_at: new Date().toISOString(),
            })
            .eq('id', partnerId)

          // Generate onboarding URL
          const onboardingUrl = generateOnboardingUrl(payeeId)

          return NextResponse.json({
            success: true,
            payeeId,
            onboardingUrl,
            message: `Payee created with ID ${payeeId}. Send them the onboarding URL to complete setup.`
          })
        } else {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 })
        }
      }

      // Create a bill/invoice for payment
      case 'create_bill': {
        const { payeeId, amount, description, invoiceNumber, partnerType, partnerId } = body

        if (!payeeId || !amount) {
          return NextResponse.json({ error: 'payeeId and amount required' }, { status: 400 })
        }

        // Generate invoice number if not provided
        const invNumber = invoiceNumber || `INV-${Date.now()}`

        const result = await createBill({
          payeeId,
          invoiceNumber: invNumber,
          invoiceDate: new Date(),
          amount: parseFloat(amount),
          description: description || 'SkyYield Partner Commission',
        })

        if (result.success) {
          // Log the bill in our database
          await supabase.from('commission_payments').insert({
            partner_type: partnerType,
            partner_id: partnerId,
            tipalti_payee_id: payeeId,
            invoice_number: invNumber,
            amount: parseFloat(amount),
            description,
            status: 'pending',
            created_at: new Date().toISOString(),
          })

          return NextResponse.json({
            success: true,
            invoiceNumber: invNumber,
            amount,
            message: 'Bill created successfully. Payment will be processed according to your Tipalti payment schedule.'
          })
        } else {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 })
        }
      }

      // Process monthly commissions for all partners
      case 'process_commissions': {
        const { month, year, dryRun = true } = body
        
        // Get all partners with tipalti_payee_id who are active and payable
        const { data: locationPartners } = await supabase
          .from('location_partners')
          .select('*')
          .eq('pipeline_status', 'active')
          .not('tipalti_payee_id', 'is', null)

        const { data: referralPartners } = await supabase
          .from('referral_partners')
          .select('*')
          .eq('status', 'active')
          .not('tipalti_payee_id', 'is', null)

        const { data: channelPartners } = await supabase
          .from('channel_partners')
          .select('*')
          .eq('status', 'active')
          .not('tipalti_payee_id', 'is', null)

        const { data: relationshipPartners } = await supabase
          .from('relationship_partners')
          .select('*')
          .eq('status', 'active')
          .not('tipalti_payee_id', 'is', null)

        // Calculate commissions (simplified - you'd have real revenue data)
        const commissions: any[] = []
        const periodLabel = `${month}/${year}`

        // Location Partners - commission based on revenue share
        for (const lp of locationPartners || []) {
          const commission = lp.monthly_revenue_estimate * (lp.revenue_share_percentage || 50) / 100
          if (commission > 0) {
            commissions.push({
              partnerType: 'location',
              partnerId: lp.id,
              payeeId: lp.tipalti_payee_id,
              name: lp.contact_full_name,
              company: lp.company_legal_name,
              amount: commission,
              description: `Location Partner Commission - ${periodLabel}`,
            })
          }
        }

        // Referral Partners - commission based on referral revenue
        for (const rp of referralPartners || []) {
          // Get active referrals and their revenue
          const { data: referrals } = await supabase
            .from('location_partners')
            .select('monthly_revenue_estimate')
            .eq('referred_by_partner_id', rp.id)
            .eq('pipeline_status', 'active')

          const totalReferralRevenue = referrals?.reduce((sum, r) => sum + (r.monthly_revenue_estimate || 0), 0) || 0
          const commission = totalReferralRevenue * (rp.commission_percentage || 10) / 100

          if (commission > 0) {
            commissions.push({
              partnerType: 'referral',
              partnerId: rp.id,
              payeeId: rp.tipalti_payee_id,
              name: rp.contact_full_name,
              company: rp.company_name,
              amount: commission,
              description: `Referral Partner Commission - ${periodLabel}`,
            })
          }
        }

        // Similar logic for channel and relationship partners...

        if (dryRun) {
          return NextResponse.json({
            success: true,
            dryRun: true,
            period: periodLabel,
            totalCommissions: commissions.reduce((sum, c) => sum + c.amount, 0),
            partnerCount: commissions.length,
            commissions,
            message: 'Dry run complete. Set dryRun=false to actually create bills.'
          })
        }

        // Actually create bills in Tipalti
        const results: any[] = []
        for (const comm of commissions) {
          const invoiceNumber = `COMM-${comm.partnerType.toUpperCase()}-${month}${year}-${comm.partnerId.slice(0, 8)}`
          
          const result = await createBill({
            payeeId: comm.payeeId,
            invoiceNumber,
            invoiceDate: new Date(),
            amount: comm.amount,
            description: comm.description,
          })

          results.push({
            ...comm,
            invoiceNumber,
            success: result.success,
            error: result.error,
          })

          if (result.success) {
            // Log in commission_payments table
            await supabase.from('commission_payments').insert({
              partner_type: comm.partnerType,
              partner_id: comm.partnerId,
              tipalti_payee_id: comm.payeeId,
              invoice_number: invoiceNumber,
              amount: comm.amount,
              description: comm.description,
              commission_month: `${year}-${month.padStart(2, '0')}-01`,
              status: 'pending',
              created_at: new Date().toISOString(),
            })
          }
        }

        return NextResponse.json({
          success: true,
          period: periodLabel,
          totalProcessed: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          totalAmount: results.filter(r => r.success).reduce((sum, r) => sum + r.amount, 0),
          results,
        })
      }

      // Sync payee status from Tipalti
      case 'sync_payee_status': {
        const { payeeId, partnerType, partnerId } = body
        
        const result = await getPayeeDetails(payeeId)
        
        if (result.success && result.data) {
          let tableName: string
          switch (partnerType) {
            case 'location': tableName = 'location_partners'; break
            case 'referral': tableName = 'referral_partners'; break
            case 'channel': tableName = 'channel_partners'; break
            case 'relationship': tableName = 'relationship_partners'; break
            case 'contractor': tableName = 'contractors'; break
            default: return NextResponse.json({ error: 'Invalid partnerType' }, { status: 400 })
          }

          // Map Tipalti status to our status
          let tipaltiStatus = 'unknown'
          if (result.data.isPayable) {
            tipaltiStatus = 'active'
          } else if (result.data.paymentMethod) {
            tipaltiStatus = 'pending_approval'
          } else {
            tipaltiStatus = 'pending_onboarding'
          }

          await supabase
            .from(tableName)
            .update({
              tipalti_status: tipaltiStatus,
              tipalti_payment_method: result.data.paymentMethod,
              tipalti_last_synced: new Date().toISOString(),
            })
            .eq('id', partnerId)

          return NextResponse.json({
            success: true,
            payeeId,
            tipaltiData: result.data,
            updatedStatus: tipaltiStatus,
          })
        }

        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid action',
          validActions: ['create_payee', 'create_bill', 'process_commissions', 'sync_payee_status']
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Tipalti POST error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
