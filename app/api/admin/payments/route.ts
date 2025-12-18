// app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { getPayeeDetails, getPaymentHistory, getPayeeInvoices } from '@/lib/tipalti'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Known Tipalti payee IDs - add new ones here as partners are added
const KNOWN_TIPALTI_IDS = [
  // Location Partners (Frank's venues)
  'LP-PHENIX-EV',
  'LP-PHENIX-SBV', 
  'LP-PHENIX-WH',
  'LP-PHENIX-CE',
  'LP-PHENIX-TC',
  // Referral Partners
  'RP-STOSH001',
  'RP-APRIL001',
  // Legacy numeric IDs (if any still exist)
  '1', '2', '3', '4', '5', '6', '7',
  // Test/Vendor IDs to check
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
    const view = searchParams.get('view') || 'all' // all, payments, invoices

    const payees: PayeeData[] = []

    // Fetch data for all known Tipalti IDs
    for (const payeeId of KNOWN_TIPALTI_IDS) {
      try {
        // Get payee details
        const detailsResult = await getPayeeDetails(payeeId)
        
        if (!detailsResult.success || !detailsResult.data?.email) {
          continue // Skip if payee doesn't exist
        }

        const details = detailsResult.data

        // Get payment history
        const paymentsResult = await getPaymentHistory(payeeId)
        const payments = paymentsResult.success ? (paymentsResult.payments || []) : []

        // Get invoices
        const invoicesResult = await getPayeeInvoices(payeeId)
        const invoices = invoicesResult.success ? (invoicesResult.invoices || []) : []

        // Calculate totals
        const paidPayments = payments.filter((p: any) => 
          p.status?.toLowerCase() === 'paid' || p.status?.toLowerCase() === 'completed'
        )
        const totalPaid = paidPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

        const pendingInvoices = invoices.filter((i: any) => 
          i.status?.toLowerCase() === 'pending' || i.status?.toLowerCase() === 'approved'
        )
        const pendingAmount = pendingInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0)

        // Get last payment
        const sortedPayments = [...paidPayments].sort((a: any, b: any) => 
          new Date(b.paymentDate || 0).getTime() - new Date(a.paymentDate || 0).getTime()
        )
        const lastPayment = sortedPayments[0]

        payees.push({
          payeeId,
          name: details.name || `${details.firstName || ''} ${details.lastName || ''}`.trim() || 'Unknown',
          email: details.email || '',
          company: details.company || null,
          paymentMethod: details.paymentMethod || null,
          payeeStatus: details.payeeStatus || null,
          isPayable: details.isPayable || false,
          totalPaid,
          pendingAmount,
          lastPaymentDate: lastPayment?.paymentDate || null,
          lastPaymentAmount: lastPayment?.amount || null,
          payments: view === 'all' || view === 'payments' ? payments : [],
          invoices: view === 'all' || view === 'invoices' ? invoices : [],
        })

      } catch (err) {
        console.error(`Error fetching payee ${payeeId}:`, err)
        // Continue to next payee
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
