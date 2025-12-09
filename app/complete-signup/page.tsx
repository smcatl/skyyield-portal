'use client'

import { useState, useEffect, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Wifi, Loader2 } from 'lucide-react'

const userTypes = [
  { value: 'referral', label: 'Referral Partner' },
  { value: 'location', label: 'Location Partner' },
  { value: 'relationship', label: 'Relationship Partner' },
  { value: 'channel', label: 'Channel Partner' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'calculator', label: 'Calculator Access' },
  { value: 'customer', label: 'Customer' },
]

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin mx-auto mb-4" />
        <p className="text-[#94A3B8]">Loading...</p>
      </div>
    </div>
  )
}

function CompleteSignupForm() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [userType, setUserType] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const typeParam = searchParams.get('userType')
    if (typeParam) {
      setUserType(typeParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (isLoaded && user?.unsafeMetadata?.userType) {
      router.push('/pending-approval')
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userType || !user) return

    setLoading(true)
    try {
      const selectedType = userTypes.find(t => t.value === userType)?.label || userType
      
      await user.update({
        unsafeMetadata: {
          userType: selectedType,
          status: 'pending',
        },
      })

      router.push('/pending-approval')
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] rounded-xl flex items-center justify-center">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">SkyYield</span>
            </Link>
            <h1 className="text-xl font-semibold text-white">Complete Your Profile</h1>
            <p className="text-[#94A3B8] mt-1">One more step to finish signing up</p>
          </div>

          {user && (
            <div className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-xl p-4 mb-6 flex items-center gap-3">
              <img
                src={user.imageUrl}
                alt={user.firstName || 'User'}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-[#64748B]">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">What best describes you? *</label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] cursor-pointer"
                required
              >
                <option value="">Select account type...</option>
                {userTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !userType}
              className="w-full py-3 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#0EA5E9]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Completing...' : 'Complete Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function CompleteSignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompleteSignupForm />
    </Suspense>
  )
}