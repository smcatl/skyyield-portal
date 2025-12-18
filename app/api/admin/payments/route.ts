// app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { getPayeeDetails } from '@/lib/tipalti'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Known Tipalti payee IDs 
const TIPALTI_PAYEE_IDS = [
  'RP-STOSH001',
  'RP-APRIL001', 
  'LP-PHENIX-EV',
  'LP-PHENIX-SBV',
  'LP-PHENIX-WH',
  'LP-PHENIX-CE',
  'LP-PHENIX-TC',
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
    const filterType = searchParams.get('type')

    const payees: PayeeData[] = []

    // Process each known payee
    for (const payeeId of TIPALTI_PAYEE_IDS) {
      try {
        // Get payee details from Tipalti
        const detailsResult = await getPayeeDetails(payeeId)
        
        if (!detailsResult.success || !detailsResult.data?.email) {
          continue
        }

        const details = detailsResult.data

        // Get payment history from Supabase using correct column names
        let paymentsQuery = supabase
          .from('tipalti_payments')
          .select('*')
          .eq('payee_id', payeeId)
          .order('paid_at', { ascending: false, nullsFirst: false })

        if (startDate) {
          paymentsQuery = paymentsQuery.gte('submitted_at', startDate)
        }
        if (endDate) {
          paymentsQuery = paymentsQuery.lte('submitted_at', endDate + 'T23:59:59')
        }

        const { data: payments, error: paymentsError } = await paymentsQuery

        if (paymentsError) {
          console.error(`Error fetching payments for ${payeeId}:`, paymentsError)
        }

        const paymentsList = payments || []

        // Calculate totals - only count Paid status
        const paidPayments = paymentsList.filter(p => 
          p.status?.toLowerCase() === 'paid'
        )
        const totalPaid = paidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

        // Get pending/deferred payments
        const pendingPayments = paymentsList.filter(p => 
          p.status?.toLowerCase() === 'deferred' ||
          p.status?.toLowerCase() === 'pending' ||
          p.status?.toLowerCase() === 'submitted'
        )
        const pendingAmount = pendingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

        // Get last paid payment
        const lastPaidPayment = paidPayments[0]

        // Determine partner type from payee ID
        let partnerType = null
        if (payeeId.startsWith('LP-')) {
          partnerType = 'Location Partner'
        } else if (payeeId.startsWith('RP-')) {
          partnerType = 'Referral Partner'
        } else if (payeeId.startsWith('CP-')) {
          partnerType = 'Channel Partner'
        }

        // Apply type filter if specified
        if (filterType && filterType !== 'all') {
          if (filterType === 'location' && !payeeId.startsWith('LP-')) continue
          if (filterType === 'referral' && !payeeId.startsWith('RP-')) continue
          if (filterType === 'channel' && !payeeId.startsWith('CP-')) continue
        }

        payees.push({
          payeeId,
          name: details.name || `${details.firstName || ''} ${details.lastName || ''}`.trim() || 'Unknown',
          email: details.email || '',
          company: details.company || null,
          paymentMethod: details.paymentMethod || null,
          payeeStatus: details.payeeStatus || null,
          isPayable: details.isPayable || details.paymentMethod !== 'NoPM',
          totalPaid,
          pendingAmount,
          lastPaymentDate: lastPaidPayment?.paid_at || null,
          lastPaymentAmount: lastPaidPayment?.amount || null,
          payments: paymentsList.map(p => ({
            refCode: p.metadata?.ref_code || p.payment_id,
            amount: p.amount,
            netAmount: p.metadata?.net_to_payee,
            fee: p.metadata?.fee,
            currency: p.currency || 'USD',
            paymentDate: p.paid_at || p.submitted_at,
            status: p.status,
            paymentMethod: p.metadata?.payment_method,
            invoiceNumber: p.metadata?.invoice_number,
          })),
          invoices: [],
          partnerType
        })

      } catch (err) {
        console.error(`Error processing payee ${payeeId}:`, err)
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
    })

  } catch (error) {
    console.error('Admin payments error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
