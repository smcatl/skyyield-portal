// components/admin/AddRoleModal.tsx
// Modal for adding additional roles to a user

'use client'

import { useState } from 'react'
import { X, Plus, UserPlus, Loader2, Check, AlertCircle } from 'lucide-react'

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  userType: string
  userRoles?: string[]
  referralPartnerId?: string | null
}

interface AddRoleModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AVAILABLE_ROLES = [
  { 
    id: 'referral_partner', 
    label: 'Referral Partner', 
    description: 'Can refer new location partners and earn commissions',
    color: 'bg-green-500'
  },
  { 
    id: 'location_partner', 
    label: 'Location Partner', 
    description: 'Owns/operates venues with SkyYield equipment',
    color: 'bg-green-500'
  },
  { 
    id: 'channel_partner', 
    label: 'Channel Partner', 
    description: 'Reseller or MSP partner',
    color: 'bg-green-500'
  },
  { 
    id: 'relationship_partner', 
    label: 'Relationship Partner', 
    description: 'Investor or strategic partner',
    color: 'bg-green-500'
  },
  { 
    id: 'contractor', 
    label: 'Contractor', 
    description: 'Installation or service contractor',
    color: 'bg-blue-500'
  },
  { 
    id: 'employee', 
    label: 'Employee', 
    description: 'SkyYield team member',
    color: 'bg-blue-500'
  },
]

export function AddRoleModal({ user, isOpen, onClose, onSuccess }: AddRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Get user's current roles
  const currentRoles = user.userRoles || [user.userType]
  
  // Filter out roles user already has
  const availableRoles = AVAILABLE_ROLES.filter(
    role => !currentRoles.includes(role.id)
  )

  const handleAddRole = async () => {
    if (!selectedRole) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/users/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          role: selectedRole,
          action: 'add'
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add role')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add role')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1F3A] rounded-xl max-w-lg w-full border border-[#2D3B5F] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2D3B5F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#0EA5E9]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Add Role</h2>
              <p className="text-sm text-[#94A3B8]">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2D3B5F] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#94A3B8]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Roles */}
          <div className="mb-6">
            <label className="block text-sm text-[#94A3B8] mb-2">Current Roles</label>
            <div className="flex flex-wrap gap-2">
              {currentRoles.map(role => (
                <span
                  key={role}
                  className="px-3 py-1 rounded-full text-sm bg-[#0EA5E9]/20 text-[#0EA5E9] border border-[#0EA5E9]/30"
                >
                  {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>

          {/* Available Roles */}
          {availableRoles.length === 0 ? (
            <div className="text-center py-8 text-[#94A3B8]">
              <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>This user has all available roles</p>
            </div>
          ) : (
            <>
              <label className="block text-sm text-[#94A3B8] mb-3">Add New Role</label>
              <div className="space-y-2">
                {availableRoles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      selectedRole === role.id
                        ? 'border-[#0EA5E9] bg-[#0EA5E9]/10'
                        : 'border-[#2D3B5F] hover:border-[#3D4B6F] bg-[#0A0F2C]'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${role.color}`} />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-white">{role.label}</p>
                      <p className="text-sm text-[#94A3B8]">{role.description}</p>
                    </div>
                    {selectedRole === role.id && (
                      <Check className="w-5 h-5 text-[#0EA5E9]" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400">
              <Check className="w-5 h-5" />
              <span>Role added successfully!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#2D3B5F]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#94A3B8] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddRole}
            disabled={!selectedRole || isLoading || success}
            className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] hover:bg-[#0EA5E9]/80 disabled:bg-[#2D3B5F] disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Role
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}