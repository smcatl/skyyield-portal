'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface UserData {
  clerk_id: string
  email: string
  user_type: string
  is_approved: boolean
  portal_status: string
  location_partner_ids: string[]
  referral_partner_id: string | null
  contractor_id: string | null
  employee_id: string | null
  is_admin: boolean
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    
    if (!user) {
      router.push('/sign-in')
      return
    }

    // Fetch user data from Supabase and route accordingly
    async function fetchUserAndRoute() {
      try {
        const res = await fetch(`/api/users/me`)
        
        if (!res.ok) {
          // User not found in database - might need to create
          setError('User profile not found. Please contact support.')
          setLoading(false)
          return
        }

        const data: UserData = await res.json()

        // Check approval - is_admin bypasses approval requirement
        if (!data.is_approved && !data.is_admin && data.portal_status !== 'account_active') {
          setError('Your account is pending approval. Please check back later.')
          setLoading(false)
          return
        }

        // Route based on is_admin first, then user_type
        // Admins are employees with is_admin=true - they go to admin portal
        if (data.is_admin) {
          router.push('/portals/admin')
          return
        }

        // Route based on user_type for non-admins
        switch (data.user_type) {
          case 'employee':
            router.push('/portals/employee')
            break
          case 'location_partner':
            router.push('/portals/location')
            break
          case 'referral_partner':
            router.push('/portals/referral')
            break
          case 'channel_partner':
            router.push('/portals/channel')
            break
          case 'relationship_partner':
            router.push('/portals/relationship')
            break
          case 'contractor':
            router.push('/portals/contractor')
            break
          default:
            // If no recognized user_type, show error
            setError(`Unknown user type: ${data.user_type}. Please contact support.`)
            setLoading(false)
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        setError('Failed to load user profile.')
        setLoading(false)
      }
    }

    fetchUserAndRoute()
  }, [user, isLoaded, router])

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0EA5E9] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading your portal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-[#1E293B] rounded-xl border border-[#2D3B5F]">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Issue</h1>
          <p className="text-[#94A3B8] mb-6">{error}</p>
          <a 
            href="mailto:support@skyyield.io" 
            className="inline-block px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    )
  }

  return null
}
