'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Clock, LogOut, Mail } from 'lucide-react'

export default function PendingApprovalPage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && user) {
      const status = (user.unsafeMetadata as any)?.status
      if (status === 'approved') {
        router.push('/dashboard')
      }
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    router.push('/sign-in')
    return null
  }

  const userType = (user.unsafeMetadata as any)?.userType || 'User'
  const status = (user.unsafeMetadata as any)?.status || 'pending'

  // If rejected, show different message
  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">❌</span>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Application Not Approved</h1>
            <p className="text-[#94A3B8] mb-6">
              Unfortunately, your application to join SkyYield as a {userType} was not approved at this time.
            </p>

            <div className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg p-4 mb-6">
              <p className="text-[#64748B] text-sm">
                If you believe this was a mistake or would like more information, please contact our support team.
              </p>
            </div>

            <a 
              href="mailto:support@skyyield.com"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors mb-3"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>

            <button
              onClick={() => signOut(() => router.push('/'))}
              className="flex items-center justify-center gap-2 w-full py-3 text-[#94A3B8] hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-[#0EA5E9]/20 to-[#06B6D4]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-[#0EA5E9]" />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">Pending Approval</h1>
          <p className="text-[#94A3B8] mb-6">
            Your account is being reviewed by our team.
          </p>

          {/* User Info Card */}
          <div className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={user.imageUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0EA5E9&color=fff`}
                alt=""
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="text-white font-medium">{user.firstName} {user.lastName}</div>
                <div className="text-[#64748B] text-sm">{user.emailAddresses[0]?.emailAddress}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748B]">Account Type</span>
              <span className="text-[#0EA5E9] font-medium">{userType}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-[#64748B]">Status</span>
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                Pending Review
              </span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-[#0EA5E9] font-medium mb-2">What happens next?</h3>
            <ul className="text-[#94A3B8] text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#0EA5E9]">•</span>
                Our team will review your application within 1-2 business days
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0EA5E9]">•</span>
                You'll receive an email once your account is approved
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0EA5E9]">•</span>
                After approval, you'll have full access to your {userType} dashboard
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#0EA5E9]/25 transition-all"
            >
              Check Status
            </button>
            
            <button
              onClick={() => signOut(() => router.push('/'))}
              className="flex items-center justify-center gap-2 w-full py-3 text-[#94A3B8] hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Contact */}
          <p className="text-[#64748B] text-sm mt-6">
            Questions? Contact us at{' '}
            <a href="mailto:support@skyyield.com" className="text-[#0EA5E9] hover:underline">
              support@skyyield.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}