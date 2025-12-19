'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { 
  Building2, MapPin, Cpu, DollarSign, FileText, Settings, 
  TrendingUp, Calendar, Bell, CreditCard, Loader2, ChevronRight
} from 'lucide-react'

interface LocationPartner {
  id: string
  partner_id: string
  company_legal_name: string
  contact_first_name: string
  contact_last_name: string
  contact_email: string
  stage: string
  loi_status: string
  contract_status: string
  tipalti_status: string
  trial_status: string
  venue_count: number
  device_count: number
}

interface UserData {
  clerk_id: string
  email: string
  user_type: string
  is_approved: boolean
  location_partner_ids: string[]
}

export default function LocationPortalPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [partnerData, setPartnerData] = useState<LocationPartner | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      router.push('/sign-in')
      return
    }

    async function fetchData() {
      try {
        // Get user data
        const userRes = await fetch('/api/users/me')
        if (!userRes.ok) throw new Error('Failed to fetch user')
        const userData: UserData = await userRes.json()
        setUserData(userData)

        // Verify user is a location partner
        if (userData.user_type !== 'location_partner') {
          router.push('/dashboard')
          return
        }

        // Get partner data
        if (userData.location_partner_ids?.length > 0) {
          const partnerRes = await fetch(`/api/partners/location/${userData.location_partner_ids[0]}`)
          if (partnerRes.ok) {
            const partner = await partnerRes.json()
            setPartnerData(partner)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [user, isLoaded, router])

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#0EA5E9] animate-spin" />
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'devices', label: 'Devices', icon: Cpu },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'application': 'bg-yellow-400/20 text-yellow-400',
      'discovery': 'bg-blue-400/20 text-blue-400',
      'loi': 'bg-purple-400/20 text-purple-400',
      'trial': 'bg-cyan-400/20 text-cyan-400',
      'contract': 'bg-orange-400/20 text-orange-400',
      'active': 'bg-emerald-400/20 text-emerald-400',
    }
    return colors[stage] || 'bg-gray-400/20 text-gray-400'
  }

  return (
    <div className="min-h-screen bg-[#0A0F2C]">
      {/* Header */}
      <header className="bg-[#0F1629] border-b border-[#2D3B5F] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#0EA5E9] rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Location Partner Portal</h1>
              <p className="text-[#64748B] text-sm">{partnerData?.company_legal_name || 'Loading...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-[#64748B] hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-73px)] bg-[#0F1629] border-r border-[#2D3B5F] p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/30'
                      : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-[#0EA5E9]/20 to-[#10F981]/20 rounded-xl p-6 border border-[#0EA5E9]/30">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome, {partnerData?.contact_first_name || user?.firstName}!
                </h2>
                <p className="text-[#94A3B8]">
                  Partner ID: <span className="text-[#0EA5E9] font-mono">{partnerData?.partner_id}</span>
                </p>
              </div>

              {/* Status Card */}
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                <h3 className="text-white font-semibold mb-4">Onboarding Status</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(partnerData?.stage || '')}`}>
                    {partnerData?.stage?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                
                {/* Progress Steps */}
                <div className="grid grid-cols-5 gap-2 mt-6">
                  {['Application', 'Discovery', 'LOI', 'Trial', 'Contract'].map((step, i) => {
                    const stages = ['application', 'discovery', 'loi', 'trial', 'contract']
                    const currentIndex = stages.indexOf(partnerData?.stage || '')
                    const isComplete = i < currentIndex
                    const isCurrent = i === currentIndex
                    
                    return (
                      <div key={step} className="text-center">
                        <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                          isComplete ? 'bg-emerald-500' : isCurrent ? 'bg-[#0EA5E9]' : 'bg-[#2D3B5F]'
                        }`}>
                          {isComplete ? '✓' : i + 1}
                        </div>
                        <span className={`text-xs ${isCurrent ? 'text-[#0EA5E9]' : 'text-[#64748B]'}`}>
                          {step}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm">Venues</p>
                      <p className="text-3xl font-bold text-white">{partnerData?.venue_count || 0}</p>
                    </div>
                    <MapPin className="w-10 h-10 text-[#0EA5E9]/30" />
                  </div>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm">Devices</p>
                      <p className="text-3xl font-bold text-white">{partnerData?.device_count || 0}</p>
                    </div>
                    <Cpu className="w-10 h-10 text-[#10F981]/30" />
                  </div>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm">Payment Status</p>
                      <p className="text-lg font-semibold text-white capitalize">
                        {partnerData?.tipalti_status || 'Not Set Up'}
                      </p>
                    </div>
                    <CreditCard className="w-10 h-10 text-amber-400/30" />
                  </div>
                </div>
              </div>

              {/* Document Status */}
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                <h3 className="text-white font-semibold mb-4">Documents</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#64748B]" />
                      <span className="text-white">Letter of Intent (LOI)</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      partnerData?.loi_status === 'signed' ? 'bg-emerald-400/20 text-emerald-400' :
                      partnerData?.loi_status === 'sent' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-gray-400/20 text-gray-400'
                    }`}>
                      {partnerData?.loi_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#64748B]" />
                      <span className="text-white">Location Agreement</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      partnerData?.contract_status === 'signed' ? 'bg-emerald-400/20 text-emerald-400' :
                      partnerData?.contract_status === 'sent' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-gray-400/20 text-gray-400'
                    }`}>
                      {partnerData?.contract_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Payments</h2>
              
              {/* Tipalti Status */}
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                <h3 className="text-white font-semibold mb-4">Payment Setup Status</h3>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    partnerData?.tipalti_status === 'active' ? 'bg-emerald-500/20' : 'bg-yellow-500/20'
                  }`}>
                    <CreditCard className={`w-6 h-6 ${
                      partnerData?.tipalti_status === 'active' ? 'text-emerald-400' : 'text-yellow-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {partnerData?.tipalti_status === 'active' ? 'Payment Account Active' : 'Setup Required'}
                    </p>
                    <p className="text-[#64748B] text-sm">
                      {partnerData?.tipalti_status === 'active' 
                        ? 'Your payment information is verified and ready to receive payments.'
                        : 'Complete your payment setup to receive revenue share payments.'}
                    </p>
                  </div>
                </div>
                
                {partnerData?.tipalti_status !== 'active' && (
                  <button className="mt-4 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                    Complete Payment Setup
                  </button>
                )}
              </div>

              {/* Payment History Placeholder */}
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                <h3 className="text-white font-semibold mb-4">Payment History</h3>
                <p className="text-[#64748B] text-center py-8">
                  No payments yet. Payments will appear here once your venue is active.
                </p>
              </div>
            </div>
          )}

          {/* Other tabs would go here */}
          {activeTab !== 'overview' && activeTab !== 'payments' && (
            <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
              <h2 className="text-xl font-bold text-white mb-4 capitalize">{activeTab}</h2>
              <p className="text-[#64748B]">This section is coming soon.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
