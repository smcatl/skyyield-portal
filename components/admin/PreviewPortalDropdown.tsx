// components/admin/PreviewPortalDropdown.tsx
// Enhanced dropdown with searchable user lists per type

'use client'

import { useState, useEffect, useRef } from 'react'
import { Eye, ChevronDown, ChevronRight, Search, Loader2, User, X } from 'lucide-react'
import { useImpersonation } from '@/hooks/useImpersonation'

interface UserRecord {
  id: string
  email: string
  first_name: string
  last_name: string
  user_type: string
  is_approved: boolean
  is_admin?: boolean
}

interface UsersByType {
  location_partner: UserRecord[]
  referral_partner: UserRecord[]
  channel_partner: UserRecord[]
  relationship_partner: UserRecord[]
  contractor: UserRecord[]
  employee: UserRecord[]
  calculator_user: UserRecord[]
  customer: UserRecord[]
}

const USER_TYPE_CONFIG = {
  location_partner: { label: 'Location Partner', color: 'bg-green-500', category: 'PREVIEW AS PARTNER' },
  referral_partner: { label: 'Referral Partner', color: 'bg-green-500', category: 'PREVIEW AS PARTNER' },
  channel_partner: { label: 'Channel Partner', color: 'bg-green-500', category: 'PREVIEW AS PARTNER' },
  relationship_partner: { label: 'Relationship Partner', color: 'bg-green-500', category: 'PREVIEW AS PARTNER' },
  contractor: { label: 'Contractor', color: 'bg-blue-500', category: 'OTHER PORTALS' },
  employee: { label: 'Employee', color: 'bg-blue-500', category: 'OTHER PORTALS' },
  calculator_user: { label: 'Location Calculator', color: 'bg-yellow-500', category: 'TOOLS & APPS' },
  customer: { label: 'Customer Portal', color: 'bg-cyan-500', category: 'TOOLS & APPS' },
}

export function PreviewPortalDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedType, setExpandedType] = useState<string | null>(null)
  const [users, setUsers] = useState<UsersByType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { startImpersonation } = useImpersonation()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setExpandedType(null)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch users when dropdown opens
  useEffect(() => {
    if (isOpen && !users) {
      fetchUsers()
    }
  }, [isOpen])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.grouped) {
        setUsers(data.grouped)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
    setIsLoading(false)
  }

  const handleTypeClick = (type: string) => {
    if (expandedType === type) {
      setExpandedType(null)
      setSearchQuery('')
    } else {
      setExpandedType(type)
      setSearchQuery('')
    }
  }

  const handleUserSelect = async (user: UserRecord) => {
    setImpersonating(user.id)
    const result = await startImpersonation(user.id)
    if (!result.success) {
      alert(`Failed to impersonate: ${result.error}`)
      setImpersonating(null)
    }
  }

  const getFilteredUsers = (type: string) => {
    const typeUsers = users?.[type as keyof UsersByType] || []
    if (!searchQuery) return typeUsers

    const query = searchQuery.toLowerCase()
    return typeUsers.filter(user =>
      user.email.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(query)
    )
  }

  const getUserCount = (type: string) => {
    return users?.[type as keyof UsersByType]?.length || 0
  }

  // Group types by category
  const categories = {
    'PREVIEW AS PARTNER': ['location_partner', 'referral_partner', 'channel_partner', 'relationship_partner'],
    'OTHER PORTALS': ['contractor', 'employee'],
    'TOOLS & APPS': ['calculator_user', 'customer'],
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
      >
        <Eye className="w-4 h-4 text-gray-400" />
        <span>Preview Portal</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {Object.entries(categories).map(([category, types]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-800/50 sticky top-0">
                    {category}
                  </div>

                  {/* User Types in Category */}
                  {types.map(type => {
                    const config = USER_TYPE_CONFIG[type as keyof typeof USER_TYPE_CONFIG]
                    const isExpanded = expandedType === type
                    const count = getUserCount(type)
                    const filteredUsers = isExpanded ? getFilteredUsers(type) : []

                    return (
                      <div key={type}>
                        {/* Type Row */}
                        <button
                          onClick={() => handleTypeClick(type)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 transition-colors"
                        >
                          <div className={`w-2 h-2 rounded-full ${config.color}`} />
                          <span className="flex-1 text-left">{config.label}</span>
                          <span className="text-xs text-gray-500 mr-2">{count}</span>
                          {count > 0 ? (
                            isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )
                          ) : null}
                        </button>

                        {/* Expanded User List */}
                        {isExpanded && count > 0 && (
                          <div className="bg-gray-800/30 border-t border-b border-gray-800">
                            {/* Search Bar */}
                            <div className="p-2 border-b border-gray-800">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                  type="text"
                                  placeholder="Search users..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full pl-9 pr-8 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm focus:outline-none focus:border-cyan-500"
                                  autoFocus
                                />
                                {searchQuery && (
                                  <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* User List */}
                            <div className="max-h-48 overflow-y-auto">
                              {filteredUsers.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                  {searchQuery ? 'No users match your search' : 'No users found'}
                                </div>
                              ) : (
                                filteredUsers.map(user => (
                                  <button
                                    key={user.id}
                                    onClick={() => handleUserSelect(user)}
                                    disabled={impersonating === user.id}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 transition-colors disabled:opacity-50"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                      {impersonating === user.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <User className="w-4 h-4 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate">
                                          {user.first_name} {user.last_name}
                                        </p>
                                        {user.is_admin && (
                                          <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-purple-500/20 text-purple-400 rounded border border-purple-500/30">
                                            Admin
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 truncate">
                                        {user.email}
                                      </p>
                                    </div>
                                    {!user.is_approved && (
                                      <span className="text-xs bg-yellow-900 text-yellow-300 px-1.5 py-0.5 rounded">
                                        Pending
                                      </span>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}

                        {/* No Users Message */}
                        {isExpanded && count === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500 bg-gray-800/30 border-t border-b border-gray-800">
                            No {config.label.toLowerCase()}s registered yet
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-3 py-2 bg-gray-800/50 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Select a user to view their portal experience
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
