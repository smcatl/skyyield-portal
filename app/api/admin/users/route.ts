// app/api/admin/users/route.ts
// API to fetch users for admin panel

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Get counts of partners who have portal users
async function getPartnerCounts() {
  const tables = [
    { type: 'location_partner', table: 'location_partners' },
    { type: 'referral_partner', table: 'referral_partners' },
    { type: 'channel_partner', table: 'channel_partners' },
    { type: 'relationship_partner', table: 'relationship_partners' },
    { type: 'contractor', table: 'contractors' },
    { type: 'employee', table: 'employees' },
    { type: 'calculator_user', table: 'calculator_users' },
    { type: 'customer', table: 'customers' },
  ]

  const counts: Record<string, number> = {}

  for (const { type, table } of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    counts[type] = count || 0
  }

  return counts
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const partnerType = searchParams.get('partner_type')
    const partnerId = searchParams.get('partner_id')
    const userType = searchParams.get('user_type')
    const search = searchParams.get('search')

    // Find user by partner record
    if (partnerType && partnerId) {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, clerk_id, email, first_name, last_name, user_type, is_approved')
        .eq('user_type', partnerType)
        .eq('partner_record_id', partnerId)
        .single()

      if (error || !user) {
        return NextResponse.json({ user: null, message: 'No user linked to this partner' })
      }

      return NextResponse.json({ user })
    }

    // List all users with optional filters
    let query = supabase
      .from('users')
      .select(`
        id,
        clerk_id,
        email,
        first_name,
        last_name,
        user_type,
        partner_record_id,
        is_admin,
        is_approved,
        portal_status,
        last_login_at,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (userType) {
      query = query.eq('user_type', userType)
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }

    const { data: users, error } = await query.limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by user type for easier display
    const grouped = {
      admin: users?.filter(u => u.is_admin) || [],
      location_partner: users?.filter(u => u.user_type === 'location_partner') || [],
      referral_partner: users?.filter(u => u.user_type === 'referral_partner') || [],
      channel_partner: users?.filter(u => u.user_type === 'channel_partner') || [],
      relationship_partner: users?.filter(u => u.user_type === 'relationship_partner') || [],
      contractor: users?.filter(u => u.user_type === 'contractor') || [],
      employee: users?.filter(u => u.user_type === 'employee') || [],
      calculator_user: users?.filter(u => u.user_type === 'calculator_user') || [],
      customer: users?.filter(u => u.user_type === 'customer') || [],
    }

    // Also fetch counts from actual partner tables for types with no users yet
    const counts = await getPartnerCounts()

    return NextResponse.json({
      users,
      grouped,
      counts,
      total: users?.length || 0,
    })

  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
