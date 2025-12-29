'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { 
  ChevronDown, Building2, Users, Handshake, UserCircle, 
  Wrench, Briefcase, Calculator, Shield, ArrowLeftRight 
} from 'lucide-react'

interface PortalSwitcherProps {
  currentPortal: string
  variant?: 'header' | 'sidebar' | 'compact'
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

export function PortalSwitcher({ currentPortal, variant = 'header' }: PortalSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user } = useUser()
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSwitch = (portalKey: string) => {
    const config = PORTAL_CONFIG[portalKey]
    if (config) {
      router.push(config.path)
      setIsOpen(false)
    }
  }

  // Don't show if only one role or loading
  if (isLoading || userRoles.length <= 1) {
    return null
  }

  const currentConfig = PORTAL_CONFIG[currentPortal]
  const CurrentIcon = currentConfig?.icon || Building2
  const availablePortals = userRoles.filter(role => PORTAL_CONFIG[role] && role !== currentPortal)

  if (availablePortals.length === 0) {
    return null
  }

  // Compact variant - just an icon button
  if (variant === 'compact') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg hover:border-[#0EA5E9] transition-colors"
          title="Switch Portal"
        >
          <ArrowLeftRight className="w-4 h-4 text-[#94A3B8]" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-[#2D3B5F]">
              <span className="text-[#64748B] text-xs uppercase tracking-wider">Switch Portal</span>
            </div>
            {availablePortals.map(portalKey => {
              const config = PORTAL_CONFIG[portalKey]
              const Icon = config.icon
              return (
                <button
                  key={portalKey}
                  onClick={() => handleSwitch(portalKey)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#0A0F2C] transition-colors"
                >
                  <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm">{config.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Header variant - full dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg hover:border-[#0EA5E9] transition-colors"
      >
        <div className={`w-6 h-6 ${currentConfig?.color || 'bg-gray-500'} rounded flex items-center justify-center`}>
          <CurrentIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-white text-sm hidden sm:inline">{currentConfig?.label || 'Portal'}</span>
        <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Current Portal */}
          <div className="px-4 py-3 border-b border-[#2D3B5F] bg-[#0A0F2C]/50">
            <span className="text-[#64748B] text-xs uppercase tracking-wider">Current Portal</span>
            <div className="flex items-center gap-3 mt-2">
              <div className={`w-10 h-10 ${currentConfig?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center`}>
                <CurrentIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">{currentConfig?.label}</div>
                <div className="text-[#64748B] text-xs">Active</div>
              </div>
            </div>
          </div>

          {/* Other Portals */}
          <div className="py-2">
            <div className="px-4 py-1">
              <span className="text-[#64748B] text-xs uppercase tracking-wider">Switch To</span>
            </div>
            {availablePortals.map(portalKey => {
              const config = PORTAL_CONFIG[portalKey]
              const Icon = config.icon
              return (
                <button
                  key={portalKey}
                  onClick={() => handleSwitch(portalKey)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#0A0F2C] transition-colors"
                >
                  <div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-white text-sm">{config.label}</div>
                    <div className="text-[#64748B] text-xs">Click to switch</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default PortalSwitcher
