// app/api/admin/users/roles/route.ts
// API for managing user roles (add/remove partner types)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Add a role to user
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_id', clerkUserId)
      .single()

    if (!adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, role, partnerId, action } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    // Valid roles
    const validRoles = [
      'location_partner',
      'referral_partner', 
      'channel_partner',
      'relationship_partner',
      'contractor',
      'employee',
      'calculator_user',
      'customer',
      'admin'
    ]

    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (action === 'remove') {
      // Remove role
      const { data, error } = await supabase.rpc('remove_user_role', {
        p_user_id: userId,
        p_role: role
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // Add role
    if (role === 'referral_partner' && !partnerId) {
      // Create new referral partner record for this user
      const { data, error } = await supabase.rpc('make_user_referral_partner', {
        p_user_id: userId,
        p_referral_code: null, // Auto-generate
        p_commission_percentage: 15.00
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // Add role with existing partner ID
    const { data, error } = await supabase.rpc('add_user_role', {
      p_user_id: userId,
      p_role: role,
      p_partner_id: partnerId || null
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('User roles error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// GET - Get user's roles and linked partners
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get user with all role details
    const { data: user, error } = await supabase
      .from('users_with_roles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // View might not exist, fall back to direct query
      const { data: fallbackUser, error: fallbackError } = await supabase
        .from('users')
        .select(`
          *,
          referral_partner:referral_partners(id, referral_code, commission_type, commission_percentage, total_earned)
        `)
        .eq('id', userId)
        .single()

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }

      return NextResponse.json({ user: fallbackUser })
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('Get user roles error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}