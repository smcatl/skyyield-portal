// app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { getPayeeDetails, getPaymentHistory, getPayeeInvoices } from '@/lib/tipalti'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Known Tipalti payee IDs
const KNOWN_TIPALTI_IDS = [
  'LP-PHENIX-EV', 'LP-PHENIX-SBV', 'LP-PHENIX-WH', 'LP-PHENIX-CE', 'LP-PHENIX-TC',
  'RP-STOSH001', 'RP-APRIL001',
  '1', '2', '3', '4', '5', '6', '7',
  't3f6072d3t530bt', 't09993d6dta684t', 'tb3538ab6t2139t',
  't94d1ed53tb2d1t', 't1a5e706bta715t', 'tf6080a90tc8cft'
]

interface PayeeData {
  payeeId: string
  name: string
  email: string
  company: string | null
  paymentMethod: string | null
  payeeStatus: string | null
  isPayable: boolean
  totalPaid: number
  pendingAmount: number
  lastPaymentDate: string | null
  lastPaymentAmount: number | null
  payments: any[]
  invoices: any[]
  partnerType: string | null
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get all partners from Supabase that have Tipalti IDs
    const { data: locationPartners } = await supabase
      .from('location_partners')
      .select('id, company_legal_name, dba_name, contact_first_name, contact_last_name, contact_email, tipalti_payee_id, tipalti_status, last_payment_date, last_payment_amount')
      .not('tipalti_payee_id', 'is', null)

    const { data: referralPartners } = await supabase
      .from('referral_partners')
      .select('id, company_name, contact_name, email, tipalti_payee_id, tipalti_status')
      .not('tipalti_payee_id', 'is', null)

    const { data: channelPartners } = await supabase
      .from('channel_partners')
      .select('id, company_name, contact_name, email, tipalti_payee_id, tipalti_status')
      .not('tipalti_payee_id', 'is', null)

    const { data: relationshipPartners } = await supabase
      .from('relationship_partners')
      .select('id, company_name, contact_name, email, tipalti_payee_id, tipalti_status')
      .not('tipalti_payee_id', 'is', null)

    // Build a map of known payee IDs from Supabase
    const supabasePayees = new Map<string, any>()
    
    locationPartners?.forEach(lp => {
      if (lp.tipalti_payee_id) {
        supabasePayees.set(lp.tipalti_payee_id, {
          name: `${lp.contact_first_name || ''} ${lp.contact_last_name || ''}`.trim() || 'Unknown',
          email: lp.contact_email,
          company: lp.company_legal_name || lp.dba_name,
          tipaltiStatus: lp.tipalti_status,
          lastPaymentDate: lp.last_payment_date,
          lastPaymentAmount: lp.last_payment_amount,
          partnerType: 'Location Partner'
        })
      }
    })

    referralPartners?.forEach(rp => {
      if (rp.tipalti_payee_id) {
        supabasePayees.set(rp.tipalti_payee_id, {
          name: rp.contact_name || 'Unknown',
          email: rp.email,
          company: rp.company_name,
          tipaltiStatus: rp.tipalti_status,
          partnerType: 'Referral Partner'
        })
      }
    })

    channelPartners?.forEach(cp => {
      if (cp.tipalti_payee_id) {
        supabasePayees.set(cp.tipalti_payee_id, {
          name: cp.contact_name || 'Unknown',
          email: cp.email,
          company: cp.company_name,
          tipaltiStatus: cp.tipalti_status,
          partnerType: 'Channel Partner'
        })
      }
    })

    relationshipPartners?.forEach(relp => {
      if (relp.tipalti_payee_id) {
        supabasePayees.set(relp.tipalti_payee_id, {
          name: relp.contact_name || 'Unknown',
          email: relp.email,
          company: relp.company_name,
          tipaltiStatus: relp.tipalti_status,
          partnerType: 'Relationship Partner'
        })
      }
    })

    // Combine Supabase IDs with known Tipalti IDs
    const allPayeeIds = new Set([...KNOWN_TIPALTI_IDS, ...supabasePayees.keys()])

    const payees: PayeeData[] = []

    // Fetch data for all payee IDs
    for (const payeeId of allPayeeIds) {
      try {
        // Get payee details from Tipalti
        const detailsResult = await getPayeeDetails(payeeId)
        
        if (!detailsResult.success || !detailsResult.data?.email) {
          // If not in Tipalti but in Supabase, still show them
          const sbData = supabasePayees.get(payeeId)
          if (sbData) {
            payees.push({
              payeeId,
              name: sbData.name,
              email: sbData.email || '',
              company: sbData.company,
              paymentMethod: null,
              payeeStatus: sbData.tipaltiStatus || 'Not in Tipalti',
              isPayable: false,
              totalPaid: 0,
              pendingAmount: 0,
              lastPaymentDate: sbData.lastPaymentDate || null,
              lastPaymentAmount: sbData.lastPaymentAmount || null,
              payments: [],
              invoices: [],
              partnerType: sbData.partnerType
            })
          }
          continue
        }

        const details = detailsResult.data
        const sbData = supabasePayees.get(payeeId)

        // Get payment history from Tipalti
        const paymentsResult = await getPaymentHistory(payeeId)
        let payments = paymentsResult.success ? (paymentsResult.payments || []) : []
        
        // Log for debugging
        console.log(`Payee ${payeeId} payments:`, payments.length, payments)

        // Get invoices from Tipalti
        const invoicesResult = await getPayeeInvoices(payeeId)
        let invoices = invoicesResult.success ? (invoicesResult.invoices || []) : []

        // Filter by date if provided
        if (startDate) {
          const start = new Date(startDate)
          payments = payments.filter((p: any) => new Date(p.paymentDate) >= start)
          invoices = invoices.filter((i: any) => new Date(i.invoiceDate) >= start)
        }
        if (endDate) {
          const end = new Date(endDate)
          payments = payments.filter((p: any) => new Date(p.paymentDate) <= end)
          invoices = invoices.filter((i: any) => new Date(i.invoiceDate) <= end)
        }

        // Calculate totals
        const paidPayments = payments.filter((p: any) => 
          p.status?.toLowerCase() === 'paid' || 
          p.status?.toLowerCase() === 'completed' ||
          p.status?.toLowerCase() === 'submitted'
        )
        const totalPaid = paidPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)

        const pendingInvoices = invoices.filter((i: any) => 
          i.status?.toLowerCase() === 'pending' || 
          i.status?.toLowerCase() === 'approved' ||
          i.status?.toLowerCase() === 'submitted'
        )
        const pendingAmount = pendingInvoices.reduce((sum: number, i: any) => sum + (parseFloat(i.amount) || 0), 0)

        // Get last payment
        const sortedPayments = [...paidPayments].sort((a: any, b: any) => 
          new Date(b.paymentDate || 0).getTime() - new Date(a.paymentDate || 0).getTime()
        )
        const lastPayment = sortedPayments[0]

        // Use Supabase data as fallback for last payment
        const lastPaymentDate = lastPayment?.paymentDate || sbData?.lastPaymentDate || null
        const lastPaymentAmount = lastPayment?.amount || sbData?.lastPaymentAmount || null

        payees.push({
          payeeId,
          name: details.name || `${details.firstName || ''} ${details.lastName || ''}`.trim() || sbData?.name || 'Unknown',
          email: details.email || sbData?.email || '',
          company: details.company || sbData?.company || null,
          paymentMethod: details.paymentMethod || null,
          payeeStatus: details.payeeStatus || sbData?.tipaltiStatus || null,
          isPayable: details.isPayable || details.paymentMethod !== 'NoPM',
          totalPaid,
          pendingAmount,
          lastPaymentDate,
          lastPaymentAmount,
          payments,
          invoices,
          partnerType: sbData?.partnerType || (payeeId.startsWith('LP-') ? 'Location Partner' : payeeId.startsWith('RP-') ? 'Referral Partner' : null)
        })

      } catch (err) {
        console.error(`Error fetching payee ${payeeId}:`, err)
      }
    }

    // Sort by name
    payees.sort((a, b) => a.name.localeCompare(b.name))

    // Calculate summary stats
    const summary = {
      totalPayees: payees.length,
      totalPaid: payees.reduce((sum, p) => sum + p.totalPaid, 0),
      totalPending: payees.reduce((sum, p) => sum + p.pendingAmount, 0),
      payableCount: payees.filter(p => p.isPayable).length,
    }

    return NextResponse.json({
      success: true,
      payees,
      summary,
      debug: {
        knownIds: KNOWN_TIPALTI_IDS.length,
        supabaseIds: supabasePayees.size,
        totalChecked: allPayeeIds.size
      }
    })

  } catch (error) {
    console.error('Admin payments error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
