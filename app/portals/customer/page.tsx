'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Package, CreditCard, Heart, Truck } from 'lucide-react'

export default function CustomerPortalPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    
    const status = (user.unsafeMetadata as any)?.status || 'pending'
    if (status !== 'approved') {
      router.push('/pending-approval')
    }
  }, [isLoaded, user, router])

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
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-24 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            My <span className="text-[#0EA5E9]">Account</span>
          </h1>
          <p className="text-[#94A3B8] mt-2">
            Welcome back, {user?.firstName}! Manage your orders and account.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link 
            href="/store"
            className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center group-hover:bg-[#0EA5E9]/30 transition-colors">
                <ShoppingBag className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <span className="text-white font-medium">Shop Now</span>
            </div>
            <p className="text-[#64748B] text-sm">Browse our hotspot products</p>
          </Link>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-white font-medium">My Orders</span>
            </div>
            <p className="text-[#64748B] text-sm">Track and manage orders</p>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-white font-medium">Payment Methods</span>
            </div>
            <p className="text-[#64748B] text-sm">Manage saved cards</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <span className="text-[#94A3B8] text-sm">Total Orders</span>
            </div>
            <div className="text-3xl font-bold text-white">0</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">In Transit</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">0</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Wishlist</span>
            </div>
            <div className="text-3xl font-bold text-pink-400">0</div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Orders</h2>
          <div className="text-center py-12 text-[#64748B]">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No orders yet</p>
            <p className="text-sm mt-1">Your orders will appear here.</p>
            <Link 
              href="/store"
              className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#0EA5E9]/25 transition-all"
            >
              Start Shopping
            </Link>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[#64748B] text-sm">Name</label>
              <p className="text-white">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <label className="text-[#64748B] text-sm">Email</label>
              <p className="text-white">{user?.emailAddresses[0]?.emailAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}