'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { 
  Building2, MapPin, Cpu, DollarSign, FileText, 
  Settings, Activity, Wifi, HelpCircle, RefreshCw
} from 'lucide-react'
import {
  ContactCard, DashboardCard, DocumentsSection,
  VenuesSection, PartnerSettings, PartnerPayments,
} from '@/components/portal'
import { PortalSwitcher } from '@/components/portal/PortalSwitcher'

type TabType = 'overview' | 'venues' | 'devices' | 'earnings' | 'documents' | 'support' | 'settings'

interface PartnerData {
  id: string
  partner_id: string
  company_legal_name: string
  dba_name: string
  contact_first_name: string
  contact_last_name: string
  contact_email: string
  contact_phone: string
  pipeline_stage: string
  loi_status: string
  contract_status: string
  tipalti_status: string
  tipalti_payee_id: string
  trial_status: string
  trial_end_date: string
  commission_type: string
  commission_percentage: number
  commission_flat_fee: number
  hasChildPartners: boolean
  managedLocationCount: number
}

interface Stats {
  totalVenues: number
  totalDevices: number
  activeDevices: number
  totalEarnings: number
  thisMonthEarnings: number
  totalDataGB: number
}

function LocationPartnerPortalContent() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPreviewMode = searchParams.get('preview') === 'true'
  
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalVenues: 0, totalDevices: 0, activeDevices: 0,
    totalEarnings: 0, thisMonthEarnings: 0, totalDataGB: 0
  })
  const [venues, setVenues] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'devices', label: 'Devices', icon: Cpu },
    { id: 'earnings', label: 'Payments', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  useEffect(() => {
    if (!isLoaded) return
    if (!user && !isPreviewMode) {
      router.push('/sign-in')
      return
    }
    loadData()
  }, [isLoaded, user, router, isPreviewMode])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/portal/location-partner')
      const data = await res.json()

      if (data.success) {
        setPartnerData(data.partner)
        setStats({
          totalVenues: data.stats?.totalVenues || 0,
          totalDevices: data.stats?.totalDevices || 0,
          activeDevices: data.stats?.activeDevices || 0,
          totalEarnings: data.stats?.totalEarnings || 0,
          thisMonthEarnings: data.stats?.thisMonthEarnings || 0,
          totalDataGB: data.devices?.reduce((sum: number, d: any) => sum + (d.monthly_data_gb || 0), 0) || 0,
        })
        
        // Transform venues for VenuesSection component
        setVenues((data.venues || []).map((v: any) => ({
          id: v.id,
          name: v.venue_name,
          address: v.address,
          city: v.city,
          state: v.state,
          type: v.venue_type || 'Commercial',
          status: v.status || 'active',
          devicesInstalled: v.deviceCount || 0,
          dataUsageGB: 0,
          monthlyEarnings: 0,
        })))
        
        setDevices(data.devices || [])
        
        // Transform documents for DocumentsSection
        const docs = []
        if (data.partner?.loi_status) {
          docs.push({
            id: 'loi',
            name: 'Letter of Intent',
            type: 'loi',
            status: data.partner.loi_status === 'signed' ? 'signed' : 'pending',
            createdAt: new Date().toISOString(),
            signedAt: data.partner.loi_status === 'signed' ? new Date().toISOString() : undefined,
            downloadUrl: data.partner.loi_document_url,
          })
        }
        if (data.partner?.contract_status) {
          docs.push({
            id: 'contract',
            name: 'Deployment Contract',
            type: 'contract',
            status: data.partner.contract_status === 'signed' ? 'signed' : 'pending',
            createdAt: new Date().toISOString(),
            signedAt: data.partner.contract_status === 'signed' ? new Date().toISOString() : undefined,
            downloadUrl: data.partner.contract_document_url,
          })
        }
        setDocuments(docs)
      } else {
        setError(data.error || 'Failed to load data')
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load partner data')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="bg-[#1A1F3A] border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Error</h1>
          <p className="text-[#94A3B8] mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const firstName = partnerData?.contact_first_name || user?.firstName || 'Partner'
  const companyName = partnerData?.dba_name || partnerData?.company_legal_name || 'Your Company'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28]">
      {/* Header */}
      <header className="bg-[#0A0F2C]/80 backdrop-blur-sm border-b border-[#2D3B5F] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Wifi className="w-8 h-8 text-[#0EA5E9]" />
                <span className="text-xl font-bold text-white">SkyYield</span>
              </Link>
              <span className="text-[#64748B]">|</span>
              <span className="text-[#94A3B8]">Partner Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <PortalSwitcher currentPortal="location_partner" />
              <button onClick={loadData} className="p-2 text-[#64748B] hover:text-white">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome back, {firstName}!</h1>
          <p className="text-[#94A3B8] mt-1">
            {companyName}
            {stats.totalVenues > 0 && (
              <span className="text-[#0EA5E9] ml-2">• {stats.totalVenues} venue{stats.totalVenues !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#0EA5E9] text-white'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DashboardCard 
                  title="Active Venues" 
                  value={stats.totalVenues} 
                  icon={<MapPin className="w-5 h-5 text-green-400" />} 
                  iconBgColor="bg-green-500/20" 
                />
                <DashboardCard 
                  title="Total Devices" 
                  value={stats.totalDevices} 
                  icon={<Cpu className="w-5 h-5 text-purple-400" />} 
                  iconBgColor="bg-purple-500/20" 
                />
                <DashboardCard 
                  title="Active Devices" 
                  value={stats.activeDevices} 
                  icon={<Wifi className="w-5 h-5 text-[#0EA5E9]" />} 
                  iconBgColor="bg-[#0EA5E9]/20" 
                />
                <DashboardCard 
                  title="Total Earnings" 
                  value={`$${stats.totalEarnings.toFixed(2)}`} 
                  icon={<DollarSign className="w-5 h-5 text-green-400" />} 
                  iconBgColor="bg-green-500/20" 
                />
              </div>

              {/* Recent Venues */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Your Venues</h3>
                  <button onClick={() => setActiveTab('venues')} className="text-[#0EA5E9] text-sm hover:underline">
                    View All
                  </button>
                </div>
                {venues.length === 0 ? (
                  <div className="text-center py-8 text-[#64748B]">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No venues yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {venues.slice(0, 3).map(venue => (
                      <div key={venue.id} className="flex items-center justify-between py-3 border-b border-[#2D3B5F] last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <div className="text-white font-medium">{venue.name}</div>
                            <div className="text-[#64748B] text-sm">{venue.city}, {venue.state}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#94A3B8] text-sm">{venue.devicesInstalled} devices</div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            venue.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {venue.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <DocumentsSection documents={documents} loading={loading} title="Documents" />
              <ContactCard 
                calendlyUrl="https://calendly.com/scohen-skyyield" 
                supportEmail="support@skyyield.io" 
                showTicketForm={false} 
              />
            </div>
          </div>
        )}

        {activeTab === 'venues' && (
          <VenuesSection 
            venues={venues} 
            loading={loading} 
            title="Your Venues"
            onAddVenue={() => {
              // TODO: Open venue request modal
              alert('Venue request feature coming soon!')
            }}
          />
        )}

        {activeTab === 'devices' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DashboardCard title="Total Devices" value={stats.totalDevices} icon={<Cpu className="w-5 h-5 text-purple-400" />} iconBgColor="bg-purple-500/20" />
              <DashboardCard title="Active" value={stats.activeDevices} icon={<Wifi className="w-5 h-5 text-green-400" />} iconBgColor="bg-green-500/20" />
              <DashboardCard title="Offline" value={stats.totalDevices - stats.activeDevices} icon={<Wifi className="w-5 h-5 text-red-400" />} iconBgColor="bg-red-500/20" />
              <DashboardCard title="Data Offloaded" value={`${stats.totalDataGB.toFixed(1)} GB`} icon={<Activity className="w-5 h-5 text-[#0EA5E9]" />} iconBgColor="bg-[#0EA5E9]/20" />
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#2D3B5F]">
                <h2 className="text-xl font-semibold text-white">All Devices</h2>
              </div>
              {devices.length === 0 ? (
                <div className="p-12 text-center text-[#64748B]">
                  <Cpu className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No devices deployed yet</p>
                  <p className="text-sm mt-2">Devices will appear here once installed at your venues</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2D3B5F]">
                        <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Device</th>
                        <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Venue</th>
                        <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Status</th>
                        <th className="text-right px-6 py-3 text-[#64748B] text-sm font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map(device => (
                        <tr key={device.id} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <Wifi className="w-5 h-5 text-purple-400" />
                              </div>
                              <div>
                                <div className="text-white font-medium">{device.device_name || device.device_id}</div>
                                <div className="text-[#64748B] text-xs">{device.mac_address}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#94A3B8]">
                            {venues.find(v => v.id === device.venue_id)?.name || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              device.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                              {device.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-[#0EA5E9] font-medium">
                            {(device.monthly_data_gb || 0).toFixed(1)} GB
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <PartnerPayments partnerId={partnerData?.id || ''} partnerType="location_partner" />
        )}

        {activeTab === 'documents' && (
          <DocumentsSection documents={documents} loading={loading} title="Your Documents" />
        )}

        {activeTab === 'support' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ContactCard 
              calendlyUrl="https://calendly.com/scohen-skyyield" 
              supportEmail="support@skyyield.io" 
              showTicketForm={true} 
            />
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F] transition-colors">
                  <span className="text-white">Partner Guide</span>
                  <span className="text-[#0EA5E9]">→</span>
                </a>
                <a href="#" className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F] transition-colors">
                  <span className="text-white">FAQ</span>
                  <span className="text-[#0EA5E9]">→</span>
                </a>
                <a href="#" className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F] transition-colors">
                  <span className="text-white">Troubleshooting</span>
                  <span className="text-[#0EA5E9]">→</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <PartnerSettings 
            partnerId={partnerData?.id || ''} 
            partnerType="location_partner"
            showCompanyInfo={true}
            showPaymentSettings={true}
            showNotifications={true}
          />
        )}
      </div>
    </div>
  )
}

export default function LocationPartnerPortal() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    }>
      <LocationPartnerPortalContent />
    </Suspense>
  )
}
