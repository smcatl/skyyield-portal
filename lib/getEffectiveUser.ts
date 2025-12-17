// lib/getEffectiveUser.ts
// Server-side helper to get the effective user (real or impersonated)

import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface EffectiveUser {
  id: string
  clerkId: string | null
  email: string
  firstName: string
  lastName: string
  userType: string
  partnerRecordId: string | null
  isAdmin: boolean
  isImpersonated: boolean
  originalAdminClerkId: string | null
}

export async function getEffectiveUser(): Promise<EffectiveUser | null> {
  const cookieStore = await cookies()
  
  // Check for impersonation
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
  const impersonateUserType = cookieStore.get('impersonate_user_type')?.value
  const impersonatePartnerId = cookieStore.get('impersonate_partner_id')?.value
  const originalAdminClerkId = cookieStore.get('original_admin_clerk_id')?.value

  // If impersonating, verify the original admin is still valid
  if (impersonateUserId && originalAdminClerkId) {
    const { userId: currentClerkId } = await auth()
    
    // Make sure the current Clerk session matches the original admin
    if (currentClerkId !== originalAdminClerkId) {
      // Session mismatch - impersonation invalid
      return null
    }

    // Verify original user is still an admin
    const { data: adminCheck } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_id', originalAdminClerkId)
      .single()

    if (!adminCheck?.is_admin) {
      return null
    }

    // Get the impersonated user
    const { data: impersonatedUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', impersonateUserId)
      .single()

    if (impersonatedUser) {
      return {
        id: impersonatedUser.id,
        clerkId: impersonatedUser.clerk_id,
        email: impersonatedUser.email,
        firstName: impersonatedUser.first_name,
        lastName: impersonatedUser.last_name,
        userType: impersonateUserType || impersonatedUser.user_type,
        partnerRecordId: impersonatePartnerId || impersonatedUser.partner_record_id,
        isAdmin: false, // Impersonated users never have admin access
        isImpersonated: true,
        originalAdminClerkId,
      }
    }
  }

  // Normal auth flow
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return null
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single()

  if (!user) {
    return null
  }

  return {
    id: user.id,
    clerkId: user.clerk_id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    userType: user.user_type,
    partnerRecordId: user.partner_record_id,
    isAdmin: user.is_admin,
    isImpersonated: false,
    originalAdminClerkId: null,
  }
}

// Helper to check if current request is from an impersonated session
export async function isImpersonating(): Promise<boolean> {
  const cookieStore = await cookies()
  return !!cookieStore.get('impersonate_user_id')?.value
}

// Helper to get the partner record for the effective user
export async function getEffectivePartnerRecord(effectiveUser: EffectiveUser) {
  if (!effectiveUser.partnerRecordId) {
    return null
  }

  const tableMap: Record<string, string> = {
    location_partner: 'location_partners',
    referral_partner: 'referral_partners',
    channel_partner: 'channel_partners',
    relationship_partner: 'relationship_partners',
    contractor: 'contractors',
    employee: 'employees',
    calculator_user: 'calculator_users',
  }

  const tableName = tableMap[effectiveUser.userType]
  if (!tableName) {
    return null
  }

  const { data } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', effectiveUser.partnerRecordId)
    .single()

  return data
}
