// app/api/partners/referral/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

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

    const { data, error } = await supabase
      .from('referral_partners')
      .select(`
        id,
        company_name,
        contact_name,
        email,
        tipalti_payee_id,
        tipalti_status,
        status,
        commission_percentage,
        created_at
      `)
      .order('contact_name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching referral partners:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
