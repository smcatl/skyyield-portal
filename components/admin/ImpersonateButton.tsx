// components/admin/ImpersonateButton.tsx
// Button to impersonate a user from the admin panel

'use client'

import { useState } from 'react'
import { useImpersonation } from '@/hooks/useImpersonation'
import { Eye, Loader2 } from 'lucide-react'

interface ImpersonateButtonProps {
  userId: string
  userName: string
  userType: string
  variant?: 'button' | 'icon' | 'dropdown'
}

export function ImpersonateButton({ 
  userId, 
  userName, 
  userType,
  variant = 'button' 
}: ImpersonateButtonProps) {
  const { startImpersonation } = useImpersonation()
  const [isLoading, setIsLoading] = useState(false)

  const handleImpersonate = async () => {
    if (!confirm(`View portal as ${userName}? You'll be redirected to their dashboard.`)) {
      return
    }

    setIsLoading(true)
    const result = await startImpersonation(userId)
    
    if (!result.success) {
      alert(`Failed to impersonate: ${result.error}`)
      setIsLoading(false)
    }
    // On success, the hook will redirect automatically
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleImpersonate}
        disabled={isLoading}
        className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
        title={`View as ${userName}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    )
  }

  if (variant === 'dropdown') {
    return (
      <button
        onClick={handleImpersonate}
        disabled={isLoading}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        View as User
      </button>
    )
  }

  return (
    <button
      onClick={handleImpersonate}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
      View as User
    </button>
  )
}

// Component to show all impersonation options for a partner
interface ImpersonatePartnerProps {
  partnerType: 'location_partner' | 'referral_partner' | 'channel_partner' | 'relationship_partner' | 'contractor' | 'employee' | 'calculator_user'
  partnerId: string
  partnerName: string
}

export function ImpersonatePartner({ partnerType, partnerId, partnerName }: ImpersonatePartnerProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch the associated user ID when component mounts
  const fetchUserId = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/users?partner_type=${partnerType}&partner_id=${partnerId}`)
      const data = await res.json()
      
      if (data.user) {
        setUserId(data.user.id)
      } else {
        setError('No portal user linked to this partner')
      }
    } catch (err) {
      setError('Failed to find user')
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
  }

  if (error) {
    return <span className="text-xs text-gray-500">{error}</span>
  }

  if (!userId) {
    return (
      <button
        onClick={fetchUserId}
        className="text-xs text-cyan-400 hover:text-cyan-300"
      >
        Load user access
      </button>
    )
  }

  return (
    <ImpersonateButton
      userId={userId}
      userName={partnerName}
      userType={partnerType}
      variant="icon"
    />
  )
}
