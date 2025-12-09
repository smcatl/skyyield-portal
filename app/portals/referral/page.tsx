'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, DollarSign, Link2, Copy, Check, TrendingUp } from 'lucide-react'

export default function ReferralPortalPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  // Check approval status and redirect if not approved
  useEffect(() => {
    if (!isLoaded) return

    if (!user) {
      router.push('/sign-in')
      return
    }

    const status = (user.unsafeMetadata as any)?.status || 'pending'
    
    // If not approved, redirect to pending approval
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
  
  // Don't render if not approved (will redirect)
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
  
  // Generate a referral code from user ID
  const referralCode = user?.id ? `SKY-${user.id.slice(-6).toUpperCase()}` : 'SKY-XXXXXX'
  const referralLink = `https://skyyield.com/ref/${referralCode}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            Referral <span className="text-[#0EA5E9]">Partner Portal</span>
          </h1>
          <p className="text-[#94A3B8] mt-2">
            Welcome back, {user?.firstName}! Track your referrals and earnings.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <span className="text-[#94A3B8] text-sm">Total Referrals</span>
            </div>
            <div className="text-3xl font-bold text-white">0</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Converted</span>
            </div>
            <div className="text-3xl font-bold text-green-400">0</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Pending Earnings</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">$0.00</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <span className="text-[#94A3B8] text-sm">Total Earned</span>
            </div>
            <div className="text-3xl font-bold text-[#0EA5E9]">$0.00</div>
          </div>
        </div>

        {/* Referral Link Section */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#0EA5E9]" />
            Your Referral Link
          </h2>
          <p className="text-[#94A3B8] text-sm mb-4">
            Share this link with potential location partners. You'll earn a commission for every successful signup!
          </p>
          
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white font-mono text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#0EA5E9]/25 transition-all flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 rounded-lg">
            <p className="text-[#0EA5E9] text-sm">
              <strong>Your Referral Code:</strong> {referralCode}
            </p>
          </div>
        </div>

        {/* Recent Referrals */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Referrals</h2>
          
          <div className="text-center py-12 text-[#64748B]">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No referrals yet</p>
            <p className="text-sm mt-1">Share your link to start earning!</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-[#0EA5E9] font-bold">1</span>
              </div>
              <h3 className="text-white font-medium mb-2">Share Your Link</h3>
              <p className="text-[#94A3B8] text-sm">Send your referral link to businesses that could benefit from SkyYield</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-[#0EA5E9] font-bold">2</span>
              </div>
              <h3 className="text-white font-medium mb-2">They Sign Up</h3>
              <p className="text-[#94A3B8] text-sm">When they become a location partner using your link, we track the referral</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-[#0EA5E9] font-bold">3</span>
              </div>
              <h3 className="text-white font-medium mb-2">Earn Commissions</h3>
              <p className="text-[#94A3B8] text-sm">Receive ongoing commissions based on their network earnings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}