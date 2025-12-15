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
            tableName = 'contractors'
            payeeIdPrefix = 'CON'
            break
          default:
            return NextResponse.json({ error: 'Invalid partnerType' }, { status: 400 })
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

        // Generate unique payee ID
        const payeeId = `${payeeIdPrefix}-${partnerId.slice(0, 8).toUpperCase()}`

        // Parse name
        const fullName = partner.contact_full_name || partner.full_name || ''
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || 'Partner'
        const lastName = nameParts.slice(1).join(' ') || payeeIdPrefix

        // Create in Tipalti
        const result = await createOrUpdatePayee({
          payeeId,
          firstName,
          lastName,
          email: partner.contact_email || partner.email,
          companyName: partner.company_legal_name || partner.company_name,
          street1: partner.company_address_street || partner.address,
          city: partner.company_address_city || partner.city,
          state: partner.company_address_state || partner.state,
          zip: partner.company_address_zip || partner.zip,
          country: 'US',
          payeeType: partner.company_legal_name ? 'company' : 'individual',
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
            message: 'Payee created in Tipalti. Send them the onboarding URL to complete setup.'
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
