// app/api/portal/user-roles/route.ts
// API to fetch current user's roles and Tipalti payee ID

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

    // Get user by clerk_id
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        user_type,
        user_roles,
        is_admin,
        tipalti_payee_id,
        referral_partner_id,
        location_partner_ids,
        channel_partner_id,
        relationship_partner_id,
        contractor_id,
        employee_id
      `)
      .eq('clerk_id', userId)
      .single()

    if (error || !user) {
      // Try to find by email from Clerk user
      return NextResponse.json({ 
        user_roles: [],
        is_admin: false,
        tipalti_payee_id: null,
        error: 'User not found' 
      })
    }

    // If user_roles is empty, use user_type as fallback
    const roles = user.user_roles?.length > 0 
      ? user.user_roles 
      : [user.user_type].filter(Boolean)

    // Add admin to roles if is_admin is true
    if (user.is_admin && !roles.includes('admin')) {
      roles.push('admin')
    }

    // If no tipalti_payee_id on user, try to get from linked partner records
    let tipaltiPayeeId = user.tipalti_payee_id

    if (!tipaltiPayeeId) {
      // Try location partner
      if (user.location_partner_ids?.length > 0) {
        const { data: lp } = await supabase
          .from('location_partners')
          .select('tipalti_payee_id')
          .eq('id', user.location_partner_ids[0])
          .single()
        if (lp?.tipalti_payee_id) tipaltiPayeeId = lp.tipalti_payee_id
      }
      
      // Try referral partner
      if (!tipaltiPayeeId && user.referral_partner_id) {
        const { data: rp } = await supabase
          .from('referral_partners')
          .select('tipalti_payee_id')
          .eq('id', user.referral_partner_id)
          .single()
        if (rp?.tipalti_payee_id) tipaltiPayeeId = rp.tipalti_payee_id
      }
      
      // Try channel partner
      if (!tipaltiPayeeId && user.channel_partner_id) {
        const { data: cp } = await supabase
          .from('channel_partners')
          .select('tipalti_payee_id')
          .eq('id', user.channel_partner_id)
          .single()
        if (cp?.tipalti_payee_id) tipaltiPayeeId = cp.tipalti_payee_id
      }
      
      // Try relationship partner
      if (!tipaltiPayeeId && user.relationship_partner_id) {
        const { data: relp } = await supabase
          .from('relationship_partners')
          .select('tipalti_payee_id')
          .eq('id', user.relationship_partner_id)
          .single()
        if (relp?.tipalti_payee_id) tipaltiPayeeId = relp.tipalti_payee_id
      }
    }

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      user_roles: roles,
      is_admin: user.is_admin || false,
      tipalti_payee_id: tipaltiPayeeId,
      referral_partner_id: user.referral_partner_id,
      location_partner_ids: user.location_partner_ids || [],
      channel_partner_id: user.channel_partner_id,
      relationship_partner_id: user.relationship_partner_id,
      contractor_id: user.contractor_id,
      employee_id: user.employee_id,
    })

  } catch (error) {
    console.error('User roles error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
