// app/api/admin/payments/debug/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { 
  getPayeeDetails, 
  getExtendedPayeeDetails,
  getPaymentHistory, 
  getPayeeInvoices,
  getAllPayeesExtended,
  getAllPaymentsBatch
} from '@/lib/tipalti'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const payeeId = searchParams.get('payeeId') || 'LP-PHENIX-EV'

    const results: any = {
      payeeId,
      timestamp: new Date().toISOString(),
    }

    // Test 1: Get Basic Payee Details
    console.log('Testing getPayeeDetails...')
    const detailsResult = await getPayeeDetails(payeeId)
    results.payeeDetails = {
      success: detailsResult.success,
      data: detailsResult.data,
      error: detailsResult.error
    }

    // Test 2: Get Extended Payee Details (includes balance, total paid)
    console.log('Testing getExtendedPayeeDetails...')
    const extendedResult = await getExtendedPayeeDetails(payeeId)
    results.extendedPayeeDetails = {
      success: extendedResult.success,
      data: extendedResult.data,
      error: extendedResult.error,
      rawXml: extendedResult.rawXml?.substring(0, 2000) // Truncate for readability
    }

    // Test 3: Get Payment History for this payee
    console.log('Testing getPaymentHistory...')
    const historyResult = await getPaymentHistory(payeeId)
    results.paymentHistory = {
      success: historyResult.success,
      payments: historyResult.payments,
      count: historyResult.payments?.length || 0,
      error: historyResult.error,
      rawXml: historyResult.rawXml?.substring(0, 2000)
    }

    // Test 4: Get Invoices for this payee
    console.log('Testing getPayeeInvoices...')
    const invoicesResult = await getPayeeInvoices(payeeId)
    results.invoices = {
      success: invoicesResult.success,
      invoices: invoicesResult.invoices,
      count: invoicesResult.invoices?.length || 0,
      error: invoicesResult.error,
      rawXml: invoicesResult.rawXml?.substring(0, 2000)
    }

    // Test 5: Get all payees list
    console.log('Testing getAllPayeesExtended...')
    const payeesResult = await getAllPayeesExtended()
    results.allPayees = {
      success: payeesResult.success,
      payees: payeesResult.payees,
      count: payeesResult.payees?.length || 0,
      error: payeesResult.error,
      rawXml: payeesResult.rawXml?.substring(0, 3000)
    }

    // Test 6: Get all payments batch
    console.log('Testing getAllPaymentsBatch...')
    const batchResult = await getAllPaymentsBatch()
    results.allPayments = {
      success: batchResult.success,
      payments: batchResult.payments,
      count: batchResult.payments?.length || 0,
      error: batchResult.error,
      rawXml: batchResult.rawXml?.substring(0, 3000)
    }

    return NextResponse.json(results, { 
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
