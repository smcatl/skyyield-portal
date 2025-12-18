// app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { getPayeeDetails, getPaymentHistory, getPayeeInvoices } from '@/lib/tipalti'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Current Tipalti payee IDs (from hub.tipalti.com)
const TIPALTI_PAYEES = [
  // New format IDs
  { id: 'RP-STOSH001', name: 'Stosh Cohen', type: 'Referral Partner' },
  { id: 'RP-APRIL001', name: 'April Economides', type: 'Referral Partner' },
  { id: 'LP-PHENIX-EV', name: 'Frank Lopez', company: 'Phenix-East Village', type: 'Location Partner' },
  { id: 'LP-PHENIX-SBV', name: 'Frank Lopez', company: 'Phenix Seal Beach Village, LP', type: 'Location Partner' },
  { id: 'LP-PHENIX-WH', name: 'Frank Lopez', company: 'Phenix Whittier, LP', type: 'Location Partner' },
  { id: 'LP-PHENIX-CE', name: 'Frank Lopez', company: 'Phenix Cypress East. LP', type: 'Location Partner' },
  { id: 'LP-PHENIX-TC', name: 'Frank Lopez', company: 'Phenix Torrance Crossroads, LP', type: 'Location Partner' },
  // Legacy IDs that have payment history
  { id: '1', name: 'Stosh Cohen', type: 'Referral Partner', legacy: true },
  { id: '2', name: 'Frank Lopez', company: 'Phenix-East Village', type: 'Location Partner', legacy: true },
  { id: '3', name: 'Frank Lopez', company: 'Phenix Seal Beach Village, LP', type: 'Location Partner', legacy: true },
  { id: '4', name: 'Frank Lopez', company: 'Phenix Whittier, LP', type: 'Location Partner', legacy: true },
  { id: '5', name: 'Frank Lopez', company: 'Phenix Cypress East. LP', type: 'Location Partner', legacy: true },
  { id: '6', name: 'Frank Lopez', company: 'Phenix Torrance Crossroads, LP', type: 'Location Partner', legacy: true },
  { id: '7', name: 'April Economides', type: 'Referral Partner', legacy: true },
]

// Map legacy IDs to new IDs for consolidation
const LEGACY_TO_NEW_MAP: Record<string, string> = {
  '1': 'RP-STOSH001',
  '2': 'LP-PHENIX-EV',
  '3': 'LP-PHENIX-SBV',
  '4': 'LP-PHENIX-WH',
  '5': 'LP-PHENIX-CE',
  '6': 'LP-PHENIX-TC',
  '7': 'RP-APRIL001',
}

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

    // Consolidated payees map (new ID -> data)
    const payeesMap = new Map<string, PayeeData>()

    // Process each known payee
    for (const payeeInfo of TIPALTI_PAYEES) {
      try {
        // Get payee details from Tipalti
        const detailsResult = await getPayeeDetails(payeeInfo.id)
        
        if (!detailsResult.success || !detailsResult.data?.email) {
          continue // Skip if payee doesn't exist in Tipalti
        }

        const details = detailsResult.data

        // Get payment history
        const paymentsResult = await getPaymentHistory(payeeInfo.id)
        let payments = paymentsResult.success ? (paymentsResult.payments || []) : []

        // Get invoices
        const invoicesResult = await getPayeeInvoices(payeeInfo.id)
        let invoices = invoicesResult.success ? (invoicesResult.invoices || []) : []

        // Filter by date if provided
        if (startDate) {
          const start = new Date(startDate)
          payments = payments.filter((p: any) => p.paymentDate && new Date(p.paymentDate) >= start)
          invoices = invoices.filter((i: any) => i.invoiceDate && new Date(i.invoiceDate) >= start)
        }
        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          payments = payments.filter((p: any) => p.paymentDate && new Date(p.paymentDate) <= end)
          invoices = invoices.filter((i: any) => i.invoiceDate && new Date(i.invoiceDate) <= end)
        }

        // Calculate totals from payments
        const paidPayments = payments.filter((p: any) => 
          p.status?.toLowerCase() === 'paid' || 
          p.status?.toLowerCase() === 'completed'
        )
        const totalPaid = paidPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)

        // Calculate pending from invoices
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

        // Determine the key for this payee (use new ID format)
        const consolidatedId = payeeInfo.legacy ? LEGACY_TO_NEW_MAP[payeeInfo.id] : payeeInfo.id
        
        if (!consolidatedId) continue

        // Get or create payee entry
        const existing = payeesMap.get(consolidatedId)
        
        if (existing) {
          // Merge payment data from legacy ID into new ID
          existing.totalPaid += totalPaid
          existing.pendingAmount += pendingAmount
          existing.payments = [...existing.payments, ...payments]
          existing.invoices = [...existing.invoices, ...invoices]
          
          // Update last payment if this one is more recent
          if (lastPayment && (!existing.lastPaymentDate || new Date(lastPayment.paymentDate) > new Date(existing.lastPaymentDate))) {
            existing.lastPaymentDate = lastPayment.paymentDate
            existing.lastPaymentAmount = lastPayment.amount
          }
        } else {
          // Create new entry
          payeesMap.set(consolidatedId, {
            payeeId: consolidatedId,
            name: details.name || payeeInfo.name || `${details.firstName || ''} ${details.lastName || ''}`.trim() || 'Unknown',
            email: details.email || '',
            company: details.company || payeeInfo.company || null,
            paymentMethod: details.paymentMethod || null,
            payeeStatus: details.payeeStatus || null,
            isPayable: details.isPayable || details.paymentMethod !== 'NoPM',
            totalPaid,
            pendingAmount,
            lastPaymentDate: lastPayment?.paymentDate || null,
            lastPaymentAmount: lastPayment?.amount || null,
            payments,
            invoices,
            partnerType: payeeInfo.type
          })
        }

      } catch (err) {
        console.error(`Error fetching payee ${payeeInfo.id}:`, err)
      }
    }

    // Convert map to array and sort
    const payees = Array.from(payeesMap.values()).sort((a, b) => a.name.localeCompare(b.name))

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
