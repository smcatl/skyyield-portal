// hooks/useRolePermissions.ts
// Hook to check role-based tab permissions

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'

interface Permission {
  tab_key: string
  can_view: boolean
  can_edit: boolean
}

interface UseRolePermissionsReturn {
  permissions: Permission[]
  loading: boolean
  canView: (tabKey: string) => boolean
  canEdit: (tabKey: string) => boolean
  refetch: () => Promise<void>
}

export function useRolePermissions(): UseRolePermissionsReturn {
  const { user } = useUser()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  // Get user's role from Clerk metadata
  const getUserRole = useCallback((): string => {
    if (!user) return 'location_partner' // Default role

    // Check publicMetadata first, then privateMetadata
    const metadata = user.publicMetadata as any
    if (metadata?.role) return metadata.role

    // Check if user email domain indicates admin
    const email = user.primaryEmailAddress?.emailAddress || ''
    if (email.endsWith('@skyyield.io') || email.endsWith('@skyyield.com')) {
      return 'admin'
    }

    return 'location_partner' // Default fallback
  }, [user])

  const fetchPermissions = useCallback(async () => {
    const role = getUserRole()
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/settings/role-permissions?role=${role}`)
      const data = await res.json()
      setPermissions(data.permissions || [])
    } catch (err) {
      console.error('Error fetching role permissions:', err)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [getUserRole])

  useEffect(() => {
    if (user) {
      fetchPermissions()
    }
  }, [user, fetchPermissions])

  // Check if user can view a tab
  const canView = useCallback((tabKey: string): boolean => {
    // Admins can always view everything
    if (getUserRole() === 'admin') return true

    // Find permission for this tab
    const perm = permissions.find(p => p.tab_key === tabKey)

    // Default to true if no permission set (allow by default)
    return perm?.can_view ?? true
  }, [permissions, getUserRole])

  // Check if user can edit a tab
  const canEdit = useCallback((tabKey: string): boolean => {
    // Admins can always edit everything
    if (getUserRole() === 'admin') return true

    // Find permission for this tab
    const perm = permissions.find(p => p.tab_key === tabKey)

    // Default to false if no permission set (deny edit by default)
    return perm?.can_edit ?? false
  }, [permissions, getUserRole])

  return {
    permissions,
    loading,
    canView,
    canEdit,
    refetch: fetchPermissions,
  }
}

// Helper to get role display name
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    admin: 'Admin',
    employee: 'Employee',
    location_partner: 'Location Partner',
    referral_partner: 'Referral Partner',
    channel_partner: 'Channel Partner',
    contractor: 'Contractor',
  }
  return roleNames[role] || role
}

// List of all roles
export const ALL_ROLES = [
  'admin',
  'employee',
  'location_partner',
  'referral_partner',
  'channel_partner',
  'contractor',
] as const

export type Role = typeof ALL_ROLES[number]
