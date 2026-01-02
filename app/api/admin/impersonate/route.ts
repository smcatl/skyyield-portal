// app/api/admin/impersonate/route.ts
// Allows admins to view the portal as any user for testing

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the requesting user is an admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, targetUserId } = body

    if (action === 'start') {
      if (!targetUserId) {
        return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })
      }

      // Get the target user details
      const { data: targetUser, error } = await supabase
        .from('users')
        .select(`
          id,
          clerk_id,
          email,
          first_name,
          last_name,
          user_type,
          partner_record_id,
          is_admin
        `)
        .eq('id', targetUserId)
        .single()

      if (error || !targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Get partner details based on user_type
      let partnerDetails = null
      if (targetUser.partner_record_id) {
        const tableMap: Record<string, string> = {
          location_partner: 'location_partners',
          referral_partner: 'referral_partners',
          channel_partner: 'channel_partners',
          relationship_partner: 'relationship_partners',
          contractor: 'contractors',
          employee: 'employees',
          calculator_user: 'calculator_users',
        }

        const tableName = tableMap[targetUser.user_type]
        if (tableName) {
          const { data } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', targetUser.partner_record_id)
            .single()
          partnerDetails = data
        }
      }

      // Create response with impersonation cookie
      const response = NextResponse.json({
        success: true,
        impersonating: {
          userId: targetUser.id,
          clerkId: targetUser.clerk_id,
          email: targetUser.email,
          name: `${targetUser.first_name} ${targetUser.last_name}`,
          userType: targetUser.user_type,
          partnerRecordId: targetUser.partner_record_id,
          partnerDetails,
        },
        redirectTo: getPortalRoute(targetUser.user_type),
      })

      // Set impersonation cookie (expires in 1 hour)
      response.cookies.set('impersonate_user_id', targetUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
        path: '/',
      })

      response.cookies.set('impersonate_user_type', targetUser.user_type, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
        path: '/',
      })

      response.cookies.set('impersonate_partner_id', targetUser.partner_record_id || '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
        path: '/',
      })

      // Store admin's original ID so they can return
      response.cookies.set('original_admin_clerk_id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
        path: '/',
      })

      return response
    }

    if (action === 'stop') {
      const response = NextResponse.json({
        success: true,
        message: 'Impersonation ended',
        redirectTo: '/portals/admin',
      })

      // Clear all impersonation cookies
      response.cookies.delete('impersonate_user_id')
      response.cookies.delete('impersonate_user_type')
      response.cookies.delete('impersonate_partner_id')
      response.cookies.delete('original_admin_clerk_id')

      return response
    }

    return NextResponse.json({ error: 'Invalid action. Use "start" or "stop"' }, { status: 400 })

  } catch (error) {
    console.error('Impersonation error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if currently impersonating
    const impersonateUserId = request.cookies.get('impersonate_user_id')?.value
    const impersonateUserType = request.cookies.get('impersonate_user_type')?.value
    const impersonatePartnerId = request.cookies.get('impersonate_partner_id')?.value
    const originalAdminId = request.cookies.get('original_admin_clerk_id')?.value

    if (impersonateUserId) {
      // Get impersonated user details
      const { data: targetUser } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, user_type')
        .eq('id', impersonateUserId)
        .single()

      return NextResponse.json({
        isImpersonating: true,
        impersonatedUser: targetUser,
        userType: impersonateUserType,
        partnerId: impersonatePartnerId,
        originalAdminId,
      })
    }

    return NextResponse.json({
      isImpersonating: false,
    })

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

function getPortalRoute(userType: string): string {
  const routes: Record<string, string> = {
    admin: '/portals/admin',
    location_partner: '/portals/location',
    referral_partner: '/portals/referral',
    channel_partner: '/portals/channel',
    relationship_partner: '/portals/relationship',
    contractor: '/portals/contractor',
    employee: '/portals/employee',
    calculator_user: '/portals/calculator',
  }
  return routes[userType] || '/portals/admin'
}
