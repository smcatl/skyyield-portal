'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Wrench, DollarSign, CheckCircle, Clock, Calendar } from 'lucide-react'

export default function ContractorPortalPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // Check approval status and redirect if not approved
  useEffect(() => {
    if (!isLoaded) return

    if (!user) {
      router.push('/sign-in')
      return
    }

    const status = (user.unsafeMetadata as any)?.status || 'pending'
    
    if (status !== 'approved') {
      router.push('/pending-approval')
      return
    }
  }, [isLoaded, user, router])

  // Show loading while checking
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  const status = (user.unsafeMetadata as any)?.status || 'pending'
  
  if (status !== 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Checking access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-24 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Contractor <span className="text-[#0EA5E9]">Portal</span>
          </h1>
          <p className="text-[#94A3B8] mt-2">
            Welcome back, {user?.firstName}! Manage your jobs and earnings.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <span className="text-[#94A3B8] text-sm">Scheduled Jobs</span>
            </div>
            <div className="text-3xl font-bold text-white">0</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Completed</span>
            </div>
            <div className="text-3xl font-bold text-green-400">0</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Pending Payment</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">$0.00</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <span className="text-[#94A3B8] text-sm">Total Earned</span>
            </div>
            <div className="text-3xl font-bold text-[#0EA5E9]">$0.00</div>
          </div>
        </div>

        {/* Upcoming Jobs */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Upcoming Jobs</h2>
          
          <div className="text-center py-12 text-[#64748B]">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming jobs</p>
            <p className="text-sm mt-1">New installation jobs will appear here.</p>
          </div>
        </div>

        {/* Job History */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Job History</h2>
          
          <div className="text-center py-12 text-[#64748B]">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No completed jobs yet</p>
            <p className="text-sm mt-1">Your completed installations will be listed here.</p>
          </div>
        </div>
      </div>
    </div>
  )
}