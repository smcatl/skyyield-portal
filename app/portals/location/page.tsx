'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Wifi, DollarSign, BarChart3, MapPin, 
  Activity, Calculator, Settings, ChevronRight
} from 'lucide-react'
import CalculatorSection from '@/components/CalculatorSection'

type TabType = 'overview' | 'locations' | 'earnings' | 'calculator'

export default function LocationPartnerPortal() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

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
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  // Check if user has calculator subscription
  const hasCalculatorSubscription = (user.unsafeMetadata as any)?.calculatorSubscription === true

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'locations', label: 'My Locations', icon: MapPin },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20">
      {/* Header */}
      <div className="px-4 pb-4 border-b border-[#2D3B5F]">
        <div className="max-w-7xl mx-auto">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Location <span className="text-green-400">Partner</span> Portal
              </h1>
              <p className="text-[#94A3B8] mt-1">
                Welcome back, {user?.firstName}! Manage your hotspot locations.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-500 text-white'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Active Hotspots</span>
                </div>
                <div className="text-3xl font-bold text-white">3</div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Data Offloaded</span>
                </div>
                <div className="text-3xl font-bold text-blue-400">1,245 GB</div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">This Month</span>
                </div>
                <div className="text-3xl font-bold text-[#0EA5E9]">$249.00</div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Total Earned</span>
                </div>
                <div className="text-3xl font-bold text-purple-400">$1,847.50</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab('locations')}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-green-500 transition-colors text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <span className="text-white font-medium">View Locations</span>
                      <p className="text-[#64748B] text-sm">Manage your hotspot locations</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-white transition-colors" />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('calculator')}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-[#0EA5E9]" />
                    </div>
                    <div>
                      <span className="text-white font-medium">Earnings Calculator</span>
                      <p className="text-[#64748B] text-sm">Estimate potential earnings</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-white transition-colors" />
                </div>
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {[
                  { location: 'Downtown Coffee Shop', data: '45.2 GB', earnings: '$9.04', time: '2 hours ago' },
                  { location: 'Main St Restaurant', data: '32.1 GB', earnings: '$6.42', time: '5 hours ago' },
                  { location: 'Airport Lounge', data: '78.5 GB', earnings: '$15.70', time: 'Yesterday' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#2D3B5F] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Wifi className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <div className="text-white text-sm">{item.location}</div>
                        <div className="text-[#64748B] text-xs">{item.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-medium">{item.earnings}</div>
                      <div className="text-[#64748B] text-xs">{item.data}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">My Locations</h2>
              <Link
                href="/partners/location/add"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                + Add Location
              </Link>
            </div>

            <div className="grid gap-4">
              {[
                { name: 'Downtown Coffee Shop', address: '123 Main St', status: 'active', hotspots: 2, data: '456 GB', earnings: '$91.20' },
                { name: 'Main St Restaurant', address: '456 Oak Ave', status: 'active', hotspots: 1, data: '312 GB', earnings: '$62.40' },
                { name: 'Airport Lounge', address: 'Terminal B', status: 'active', hotspots: 3, data: '892 GB', earnings: '$178.40' },
              ].map((location, i) => (
                <div key={i} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-medium">{location.name}</h3>
                      <p className="text-[#64748B] text-sm">{location.address}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                          {location.status}
                        </span>
                        <span className="text-[#94A3B8] text-sm">{location.hotspots} hotspots</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold text-lg">{location.earnings}</div>
                      <div className="text-[#64748B] text-sm">{location.data} this month</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Earnings Overview</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="text-[#94A3B8] text-sm mb-1">This Month</div>
                <div className="text-3xl font-bold text-green-400">$249.00</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="text-[#94A3B8] text-sm mb-1">Last Month</div>
                <div className="text-3xl font-bold text-white">$312.50</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="text-[#94A3B8] text-sm mb-1">All Time</div>
                <div className="text-3xl font-bold text-[#0EA5E9]">$1,847.50</div>
              </div>
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Payment History</h3>
              <div className="space-y-3">
                {[
                  { date: 'Dec 1, 2025', amount: '$312.50', status: 'Paid' },
                  { date: 'Nov 1, 2025', amount: '$287.00', status: 'Paid' },
                  { date: 'Oct 1, 2025', amount: '$298.75', status: 'Paid' },
                ].map((payment, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#2D3B5F] last:border-0">
                    <span className="text-[#94A3B8]">{payment.date}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-white font-medium">{payment.amount}</span>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Placer.ai Calculators</h2>
              <p className="text-[#94A3B8] text-sm">Estimate earnings and analyze venue potential</p>
            </div>

            <CalculatorSection 
              isSubscribed={hasCalculatorSubscription}
              showUpgradePrompt={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}