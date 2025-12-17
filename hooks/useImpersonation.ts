// hooks/useImpersonation.ts
// Hook to manage user impersonation state

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ImpersonatedUser {
  id: string
  email: string
  first_name: string
  last_name: string
  user_type: string
}

interface ImpersonationState {
  isImpersonating: boolean
  impersonatedUser: ImpersonatedUser | null
  userType: string | null
  partnerId: string | null
  originalAdminId: string | null
  isLoading: boolean
}

export function useImpersonation() {
  const router = useRouter()
  const [state, setState] = useState<ImpersonationState>({
    isImpersonating: false,
    impersonatedUser: null,
    userType: null,
    partnerId: null,
    originalAdminId: null,
    isLoading: true,
  })

  // Check impersonation status on mount
  useEffect(() => {
    checkImpersonationStatus()
  }, [])

  const checkImpersonationStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/impersonate')
      const data = await res.json()
      
      setState({
        isImpersonating: data.isImpersonating || false,
        impersonatedUser: data.impersonatedUser || null,
        userType: data.userType || null,
        partnerId: data.partnerId || null,
        originalAdminId: data.originalAdminId || null,
        isLoading: false,
      })
    } catch (error) {
      console.error('Failed to check impersonation status:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const startImpersonation = useCallback(async (targetUserId: string) => {
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', targetUserId }),
      })

      const data = await res.json()

      if (data.success) {
        setState({
          isImpersonating: true,
          impersonatedUser: data.impersonating,
          userType: data.impersonating.userType,
          partnerId: data.impersonating.partnerRecordId,
          originalAdminId: data.impersonating.clerkId,
          isLoading: false,
        })

        // Redirect to the appropriate portal
        router.push(data.redirectTo)
        return { success: true, redirectTo: data.redirectTo }
      }

      return { success: false, error: data.error }
    } catch (error) {
      console.error('Failed to start impersonation:', error)
      return { success: false, error: String(error) }
    }
  }, [router])

  const stopImpersonation = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      })

      const data = await res.json()

      if (data.success) {
        setState({
          isImpersonating: false,
          impersonatedUser: null,
          userType: null,
          partnerId: null,
          originalAdminId: null,
          isLoading: false,
        })

        // Redirect back to admin
        router.push('/admin')
        return { success: true }
      }

      return { success: false, error: data.error }
    } catch (error) {
      console.error('Failed to stop impersonation:', error)
      return { success: false, error: String(error) }
    }
  }, [router])

  return {
    ...state,
    startImpersonation,
    stopImpersonation,
    refreshStatus: checkImpersonationStatus,
  }
}
