// components/ImpersonationBanner.tsx
// Shows a banner when admin is impersonating a user

'use client'

import { useImpersonation } from '@/hooks/useImpersonation'
import { X, Eye, ArrowLeft } from 'lucide-react'

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUser, userType, stopImpersonation, isLoading } = useImpersonation()

  if (isLoading || !isImpersonating || !impersonatedUser) {
    return null
  }

  const userTypeLabels: Record<string, string> = {
    location_partner: 'Location Partner',
    referral_partner: 'Referral Partner',
    channel_partner: 'Channel Partner',
    relationship_partner: 'Relationship Partner',
    contractor: 'Contractor',
    employee: 'Employee',
    calculator_user: 'Calculator User',
    admin: 'Admin',
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-black px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5" />
          <span className="font-medium">
            Viewing as: {impersonatedUser.first_name} {impersonatedUser.last_name}
          </span>
          <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm">
            {userTypeLabels[userType || ''] || userType}
          </span>
          <span className="text-amber-800 text-sm">
            ({impersonatedUser.email})
          </span>
        </div>
        
        <button
          onClick={() => stopImpersonation()}
          className="flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit & Return to Admin
        </button>
      </div>
    </div>
  )
}

// Wrapper component to add padding when banner is shown
export function ImpersonationAwareLayout({ children }: { children: React.ReactNode }) {
  const { isImpersonating, isLoading } = useImpersonation()

  return (
    <div className={isImpersonating && !isLoading ? 'pt-12' : ''}>
      <ImpersonationBanner />
      {children}
    </div>
  )
}
