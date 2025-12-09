'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    if (!user) {
      router.push('/sign-in')
      return
    }

    const userType = (user.unsafeMetadata as any)?.userType || ''
    const status = (user.unsafeMetadata as any)?.status || 'pending'

    // ALWAYS check approval status first - if not approved, go to pending page
    if (status !== 'approved') {
      router.push('/pending-approval')
      return
    }

    // Only if approved, redirect to appropriate portal based on user type
    switch (userType) {
      case 'Administrator':
      case 'Employee':
        router.push('/portals/admin')
        break
      case 'Referral Partner':
        router.push('/portals/referral')
        break
      case 'Location Partner':
        router.push('/portals/location')
        break
      case 'Channel Partner':
        router.push('/portals/channel')
        break
      case 'Relationship Partner':
        router.push('/portals/relationship')
        break
      case 'Contractor':
        router.push('/portals/contractor')
        break
      case 'Calculator Access':
        router.push('/portals/calculator')
        break
      case 'Customer':
        router.push('/portals/customer')
        break
      default:
        // If no user type set, go to pending approval to set it up
        router.push('/pending-approval')
    }
  }, [isLoaded, user, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center pt-20">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Loading your dashboard...</p>
      </div>
    </div>
  )
}