// components/portal/PortalSwitcher.tsx
// Allows users with multiple roles to switch between their portals

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { ChevronDown, Building2, Users, Handshake, UserCircle, Wrench, Briefcase, Calculator, Shield } from 'lucide-react'

interface PortalSwitcherProps {
  currentPortal: string
}

const PORTAL_CONFIG: Record<string, { label: string; path: string; icon: any; color: string }> = {
  'admin': {
    label: 'Admin',
    path: '/portals/admin',
    icon: Shield,
    color: 'bg-purple-500'
  },
  'location_partner': {
    label: 'Location Partner',
    path: '/portals/location',
    icon: Building2,
    color: 'bg-green-500'
  },
  'referral_partner': {
    label: 'Referral Partner',
    path: '/portals/referral',
    icon: Users,
    color: 'bg-green-500'
  },
  'channel_partner': {
    label: 'Channel Partner',
    path: '/portals/channel',
    icon: Handshake,
    color: 'bg-green-500'
  },
  'relationship_partner': {
    label: 'Relationship Partner',
    path: '/portals/relationship',
    icon: UserCircle,
    color: 'bg-green-500'
  },
  'contractor': {
    label: 'Contractor',
    path: '/portals/contractor',
    icon: Wrench,
    color: 'bg-blue-500'
  },
  'employee': {
    label: 'Employee',
    path: '/portals/employee',
    icon: Briefcase,
    color: 'bg-blue-500'
  },
  'calculator_user': {
    label: 'Calculator',
    path: '/portals/calculator',
    icon: Calculator,
    color: 'bg-yellow-500'
  },
}

export function PortalSwitcher({ currentPortal }: PortalSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch('/api/portal/user-roles')
        if (res.ok) {
          const data = await res.json()
          setUserRoles(data.user_roles || [])
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRoles()
  }, [])

  // Filter to only roles user has
  const availablePortals = userRoles
    .filter(role => PORTAL_CONFIG[role])
    .map(role => ({ role, ...PORTAL_CONFIG[role] }))

  // Don't show switcher if loading or user only has one role
  if (isLoading || availablePortals.length <= 1) {
    return null
  }

  const currentConfig = PORTAL_CONFIG[currentPortal]
  const CurrentIcon = currentConfig?.icon || Briefcase

  const handleSwitch = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg hover:border-[#0EA5E9] transition-colors"
      >
        <CurrentIcon className="w-4 h-4 text-[#0EA5E9]" />
        <span className="text-white text-sm font-medium">
          {currentConfig?.label || 'Portal'}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-[#2D3B5F]">
              <p className="text-xs text-[#64748B] uppercase tracking-wide">Switch Portal</p>
              {user && (
                <p className="text-sm text-white mt-1">{user.firstName} {user.lastName}</p>
              )}
            </div>
            
            <div className="p-2">
              {availablePortals.map(({ role, label, path, icon: Icon, color }) => {
                const isActive = role === currentPortal
                return (
                  <button
                    key={role}
                    onClick={() => handleSwitch(path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-[#0EA5E9]/20 text-[#0EA5E9]' 
                        : 'text-white hover:bg-[#2D3B5F]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${color}/20 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#0EA5E9]' : 'text-white'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{label}</p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}