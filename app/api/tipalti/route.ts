// app/api/tipalti/route.ts
// Tipalti REST API endpoints - NO IFRAME
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getPayee,
  getPayeeStatus,
  getPaymentHistory,
  getBills,
  createPayee,
  createBill,
} from '@/lib/tipalti-rest'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const payeeId = searchParams.get('payeeId')

    if (!payeeId) {
      return NextResponse.json({ error: 'payeeId required' }, { status: 400 })
    }

    switch (action) {
      case 'status':
        return NextResponse.json(await getPayeeStatus(payeeId))
      case 'payee':
        return NextResponse.json(await getPayee(payeeId))
      case 'payments':
        return NextResponse.json(await getPaymentHistory(payeeId))
      case 'bills':
      case 'invoices':
        return NextResponse.json(await getBills(payeeId))
      default:
        const [status, payments] = await Promise.all([
          getPayeeStatus(payeeId),
          getPaymentHistory(payeeId),
        ])
        return NextResponse.json({
          ...status,
          recentPayments: payments.payments?.slice(0, 5) || [],
        })
    }
  } catch (error) {
    console.error('Tipalti API error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'createPayee':
        return NextResponse.json(await createPayee({
          payeeId: body.payeeId,
          name: body.name,
          email: body.email,
          entityType: body.entityType || 'Company',
          address: body.address,
        }))
      case 'createBill':
        return NextResponse.json(await createBill({
          payeeId: body.payeeId,
          invoiceNumber: body.invoiceNumber,
          amount: body.amount,
          currency: body.currency,
          description: body.description,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        }))
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Tipalti API error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
