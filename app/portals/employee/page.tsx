'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, FileText, Settings, BarChart3, Bell, Calendar } from 'lucide-react'

export default function EmployeePortalPage() {
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
            Employee <span className="text-[#0EA5E9]">Portal</span>
          </h1>
          <p className="text-[#94A3B8] mt-2">
            Welcome back, {user?.firstName}! Access your tools and resources.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link 
            href="/admin/users"
            className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center group-hover:bg-[#0EA5E9]/30 transition-colors">
                <Users className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <span className="text-white font-medium">User Management</span>
            </div>
            <p className="text-[#64748B] text-sm">Approve and manage user accounts</p>
          </Link>

          <Link 
            href="/admin/blog"
            className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-white font-medium">Blog Management</span>
            </div>
            <p className="text-[#64748B] text-sm">Create and manage blog posts</p>
          </Link>

          <Link 
            href="/portals/admin"
            className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <Settings className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-white font-medium">Admin Dashboard</span>
            </div>
            <p className="text-[#64748B] text-sm">Full admin access and controls</p>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <span className="text-[#94A3B8] text-sm">Pending Users</span>
            </div>
            <div className="text-3xl font-bold text-white">0</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Draft Posts</span>
            </div>
            <div className="text-3xl font-bold text-green-400">0</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Notifications</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">0</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Tasks Due</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">0</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="text-center py-12 text-[#64748B]">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm mt-1">Your recent actions will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  )
}