import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get user to verify they have access to this partner
    const { data: user } = await supabase
      .from('users')
      .select('user_type, location_partner_ids, is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization
    const isAdmin = user.is_admin || user.user_type === 'admin' || user.user_type === 'employee'
    const hasAccess = isAdmin || (user.location_partner_ids && user.location_partner_ids.includes(id))

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get location partner data
    const { data: partner, error } = await supabase
      .from('location_partners')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    return NextResponse.json(partner)
  } catch (error) {
    console.error('Error fetching partner:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
