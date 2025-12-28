'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { 
  Building2, MapPin, Cpu, DollarSign, FileText, Settings, 
  TrendingUp, CreditCard, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react'
import { PortalSwitcher } from '@/components/portal/PortalSwitcher'

interface LocationPartner {
  id: string
  partner_id: string
  company_legal_name: string
  dba_name: string
  contact_first_name: string
  contact_last_name: string
  contact_email: string
  pipeline_stage: string
  loi_status: string
  contract_status: string
  tipalti_status: string
  trial_status: string
  trial_end_date: string
  commission_percentage: number
  last_payment_amount: number
  last_payment_date: string
}

interface Commission {
  id: string
  commission_month: string
  amount: number
  status: string
}

export default function LocationPortalPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partnerData, setPartnerData] = useState<LocationPartner | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [venues, setVenues] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      router.push('/sign-in')
      return
    }
    loadData()
  }, [user, isLoaded, router])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/portal/location-partner')
      const data = await res.json()

      if (data.success) {
        setPartnerData(data.partner)
        setCommissions(data.commissions || [])
        // Fetch venues and devices if partner exists
        if (data.partner?.id) {
          const [venuesRes, devicesRes] = await Promise.all([
            fetch(`/api/pipeline/venues?partnerId=${data.partner.id}`),
            fetch(`/api/pipeline/devices?partnerId=${data.partner.id}`)
          ])
          if (venuesRes.ok) {
            const venuesData = await venuesRes.json()
            setVenues(venuesData.venues || venuesData || [])
          }
          if (devicesRes.ok) {
            const devicesData = await devicesRes.json()
            setDevices(devicesData.devices || devicesData || [])
          }
        }
      } else {
        setError(data.error || 'Failed to load data')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center">
        <RefreshCw className="w-12 h-12 text-[#0EA5E9] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center p-4">
        <div className="bg-[#1A1F3A] border border-red-500/50 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Error</h2>
          <p className="text-[#94A3B8] mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">
            Try Again
          </button>
        </div>
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
      'initial_review': 'bg-yellow-400/20 text-yellow-400',
      'discovery_scheduled': 'bg-blue-400/20 text-blue-400',
      'discovery_complete': 'bg-blue-400/20 text-blue-400',
      'loi_sent': 'bg-purple-400/20 text-purple-400',
      'loi_signed': 'bg-purple-400/20 text-purple-400',
      'trial_active': 'bg-cyan-400/20 text-cyan-400',
      'contract_sent': 'bg-orange-400/20 text-orange-400',
      'active': 'bg-emerald-400/20 text-emerald-400',
    }
    return colors[stage] || 'bg-gray-400/20 text-gray-400'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      signed: 'bg-emerald-400/20 text-emerald-400',
      sent: 'bg-yellow-400/20 text-yellow-400',
      viewed: 'bg-blue-400/20 text-blue-400',
      active: 'bg-emerald-400/20 text-emerald-400',
      payable: 'bg-emerald-400/20 text-emerald-400',
      pending: 'bg-yellow-400/20 text-yellow-400',
      paid: 'bg-emerald-400/20 text-emerald-400',
    }
    return colors[status?.toLowerCase()] || 'bg-gray-400/20 text-gray-400'
  }

  return (
    <div className="min-h-screen bg-[#0A0F2C]">
      <header className="bg-[#0F1629] border-b border-[#2D3B5F] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#0EA5E9] rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Location Partner Portal</h1>
              <p className="text-[#64748B] text-sm">{partnerData?.dba_name || partnerData?.company_legal_name || 'Loading...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <PortalSwitcher currentPortal="location" />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
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

        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#0EA5E9]/20 to-[#10F981]/20 rounded-xl p-6 border border-[#0EA5E9]/30">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome, {partnerData?.contact_first_name || user?.firstName}!
                </h2>
                <p className="text-[#94A3B8]">
                  Partner ID: <span className="text-[#0EA5E9] font-mono">{partnerData?.partner_id}</span>
                </p>
              </div>

              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                <h3 className="text-white font-semibold mb-4">Onboarding Status</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(partnerData?.pipeline_stage || '')}`}>
                    {partnerData?.pipeline_stage?.toUpperCase().replace(/_/g, ' ') || 'UNKNOWN'}
                  </span>
                </div>
                
                <div className="grid grid-cols-6 gap-2 mt-6">
                  {['Application', 'Discovery', 'LOI', 'Install', 'Trial', 'Active'].map((step, i) => {
                    const stages = ['application', 'discovery_complete', 'loi_signed', 'install_scheduled', 'trial_active', 'active']
                    const currentIndex = stages.findIndex(s => partnerData?.pipeline_stage?.includes(s.split('_')[0]))
                    const isComplete = i < currentIndex
                    const isCurrent = i === currentIndex
                    
                    return (
                      <div key={step} className="text-center">
                        <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm ${
                          isComplete ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-[#0EA5E9] text-white' : 'bg-[#2D3B5F] text-[#64748B]'
                        }`}>
                          {isComplete ? <CheckCircle className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-xs ${isCurrent ? 'text-[#0EA5E9]' : 'text-[#64748B]'}`}>
                          {step}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm">Venues</p>
                      <p className="text-3xl font-bold text-white">{venues.length}</p>
                    </div>
                    <MapPin className="w-10 h-10 text-[#0EA5E9]/30" />
                  </div>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm">Devices</p>
                      <p className="text-3xl font-bold text-white">{devices.length}</p>
                    </div>
                    <Cpu className="w-10 h-10 text-[#10F981]/30" />
                  </div>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm">Payment Status</p>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(partnerData?.tipalti_status || '')}`}>
                        {partnerData?.tipalti_status?.toUpperCase() || 'NOT SET UP'}
                      </span>
                    </div>
                    <CreditCard className="w-10 h-10 text-amber-400/30" />
                  </div>
                </div>
              </div>

              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                <h3 className="text-white font-semibold mb-4">Documents</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#64748B]" />
                      <span className="text-white">Letter of Intent (LOI)</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(partnerData?.loi_status || '')}`}>
                      {partnerData?.loi_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#64748B]" />
                      <span className="text-white">Location Agreement</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(partnerData?.contract_status || '')}`}>
                      {partnerData?.contract_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'venues' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Your Venues</h2>
              {venues.length === 0 ? (
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-12 text-center">
                  <MapPin className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                  <p className="text-[#94A3B8]">No venues added yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {venues.map((venue: any) => (
                    <div key={venue.id} className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                      <h3 className="text-white font-semibold mb-2">{venue.venue_name}</h3>
                      <p className="text-[#94A3B8] text-sm">{venue.address_line_1}, {venue.city}, {venue.state}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(venue.status)}`}>
                          {venue.status?.toUpperCase() || 'PENDING'}
                        </span>
                        <span className="text-[#64748B] text-sm">{venue.venue_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Your Devices</h2>
              {devices.length === 0 ? (
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-12 text-center">
                  <Cpu className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                  <p className="text-[#94A3B8]">No devices deployed yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {devices.map((device: any) => (
                    <div key={device.id} className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold">{device.device_name || device.model}</h3>
                          <p className="text-[#64748B] text-sm font-mono">{device.mac_address}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(device.status)}`}>
                          {device.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Payments</h2>
              
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                <h3 className="text-white font-semibold mb-4">Payment Setup Status</h3>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    partnerData?.tipalti_status === 'payable' ? 'bg-emerald-500/20' : 'bg-yellow-500/20'
                  }`}>
                    <CreditCard className={`w-6 h-6 ${
                      partnerData?.tipalti_status === 'payable' ? 'text-emerald-400' : 'text-yellow-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {partnerData?.tipalti_status === 'payable' ? 'Payment Account Active' : 'Setup Required'}
                    </p>
                    <p className="text-[#64748B] text-sm">
                      {partnerData?.tipalti_status === 'payable' 
                        ? 'Your payment information is verified.'
                        : 'Complete your payment setup to receive payments.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                <h3 className="text-white font-semibold mb-4">Payment History</h3>
                {commissions.length === 0 ? (
                  <p className="text-[#64748B] text-center py-8">
                    No payments yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {commissions.map((comm: any) => (
                      <div key={comm.id} className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                        <div>
                          <p className="text-white">{new Date(comm.commission_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#0EA5E9] font-medium">${Number(comm.amount).toFixed(2)}</p>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(comm.status)}`}>
                            {comm.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeTab === 'documents' || activeTab === 'settings') && (
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
