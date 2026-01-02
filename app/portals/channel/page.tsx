'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, BarChart3, FileText, Settings, MapPin, Wifi, Activity,
  Wallet, Building2, X, ChevronDown, ChevronRight, CheckCircle, Clock, Target
} from 'lucide-react'
import {
  ContactCard, ReferralCodeCard, DashboardCard, DocumentsSection,
  PartnerSettings, PartnerPayments,
} from '@/components/portal'
import { PortalSwitcher } from '@/components/portal/PortalSwitcher'
import CRMTab from '@/components/admin/crm/CRMTab'
import { useRolePermissions } from '@/hooks/useRolePermissions'

type TabType = 'overview' | 'clients' | 'earnings' | 'documents' | 'settings'

interface Client {
  id: string
  name: string
  company: string
  email: string
  status: 'active' | 'pending' | 'inactive'
  venueCount: number
  totalDataGB: number
}

function ChannelPartnerPortalContent() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPreviewMode = searchParams.get('preview') === 'true'
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [partnerId, setPartnerId] = useState<string>('')
  const [clients, setClients] = useState<Client[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalClients: 0, activeClients: 0, totalVenues: 0, activeVenues: 0,
    totalDevices: 0, onlineDevices: 0, totalDataGB: 0, myEarnings: 0, pendingPayments: 0,
  })

  // Role permissions
  const { canView, canEdit } = useRolePermissions()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    
    const status = (user.unsafeMetadata as any)?.status || 'pending'
    
    if (isPreviewMode) {
      setPartnerId('preview-admin')
      loadPortalData()
      return
    }
    
    if (status !== 'approved') { router.push('/pending-approval'); return }
    setPartnerId((user.unsafeMetadata as any)?.partnerId || user.id)
    loadPortalData()
  }, [isLoaded, user, router, isPreviewMode])

  const loadPortalData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/portal/partner-data?partnerType=channel_partner${partnerId ? `&partnerId=${partnerId}` : ''}`)
      const data = await res.json()
      
      if (data.referrals) {
        setClients(data.referrals.map((r: any) => ({
          id: r.id,
          name: r.contactName,
          company: r.companyName,
          email: r.email,
          status: r.status,
          venueCount: r.venueCount || 0,
          totalDataGB: 0,
        })))
      } else {
        setClients([
          { id: '1', name: 'John Smith', company: 'Smith Hospitality Group', email: 'john@smithhg.com', status: 'active', venueCount: 5, totalDataGB: 1245.6 },
          { id: '2', name: 'Sarah Johnson', company: 'Metro Restaurant Group', email: 'sarah@metrorests.com', status: 'active', venueCount: 3, totalDataGB: 680.5 },
          { id: '3', name: 'Mike Davis', company: 'FitLife Gyms', email: 'mike@fitlifegyms.com', status: 'pending', venueCount: 0, totalDataGB: 0 },
        ])
      }
      
      if (data.stats) {
        setStats({
          totalClients: data.stats.totalReferrals || 0,
          activeClients: data.stats.activeReferrals || 0,
          totalVenues: data.stats.totalVenues || 0,
          activeVenues: data.stats.activeVenues || 0,
          totalDevices: data.stats.totalDevices || 0,
          onlineDevices: data.stats.onlineDevices || 0,
          totalDataGB: data.stats.totalDataGB || 0,
          myEarnings: data.stats.monthlyEarnings || 0,
          pendingPayments: data.stats.pendingPayments || 0,
        })
      } else {
        setStats({ totalClients: 3, activeClients: 2, totalVenues: 4, activeVenues: 3, totalDevices: 8, onlineDevices: 7, totalDataGB: 1325.4, myEarnings: 412.75, pendingPayments: 186.50 })
      }
      
      setDocuments([
        { id: '1', name: 'Channel Partner Agreement', type: 'contract', status: 'signed', createdAt: '2024-06-01', signedAt: '2024-06-05' },
        { id: '2', name: 'White Label Guidelines', type: 'policy', status: 'signed', createdAt: '2024-06-01', signedAt: '2024-06-05' },
      ])
    } catch (error) {
      console.error('Error loading portal data:', error)
      setClients([])
      setStats({ totalClients: 0, activeClients: 0, totalVenues: 0, activeVenues: 0, totalDevices: 0, onlineDevices: 0, totalDataGB: 0, myEarnings: 0, pendingPayments: 0 })
    }
    finally { setLoading(false) }
  }

  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" /></div>
  }

  const referralCode = `CH-${user.id?.slice(-6).toUpperCase()}`

  // Define all tabs with permission keys
  const allTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, permKey: 'cp_dashboard' },
    { id: 'clients', label: 'Clients', icon: Building2, permKey: 'cp_clients' },
    { id: 'earnings', label: 'Earnings', icon: Wallet, permKey: 'cp_earnings' },
    { id: 'documents', label: 'Documents', icon: FileText, permKey: 'cp_documents' },
    { id: 'settings', label: 'Settings', icon: Settings, permKey: 'cp_settings' },
  ]

  // Filter tabs based on user's role permissions
  const tabs = allTabs.filter(tab => canView(tab.permKey))

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20">
      {isPreviewMode && (
        <div className="bg-gradient-to-r from-purple-500 to-violet-500 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <span className="font-medium">👁️ Preview Mode:</span>
              <span>Viewing as Channel Partner</span>
            </div>
            <Link href="/portals/admin" className="flex items-center gap-1 text-white hover:text-white/80 transition-colors">
              <X className="w-4 h-4" />
              Exit Preview
            </Link>
          </div>
        </div>
      )}
      <div className="px-4 pb-4 border-b border-[#2D3B5F]">
        <div className="max-w-7xl mx-auto">
          <Link href={isPreviewMode ? "/portals/admin" : "/"} className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-4"><ArrowLeft className="w-4 h-4" />{isPreviewMode ? "Back to Admin" : "Back to Home"}</Link>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Channel <span className="text-purple-400">Partner</span> Portal</h1>
              <p className="text-[#94A3B8] mt-1">Welcome back, {user?.firstName}!</p>
            </div>
            <PortalSwitcher currentPortal="channel_partner" />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-purple-500 text-white' : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'}`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Collapsible Onboarding Progress Card */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowOnboarding(!showOnboarding)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#0A0F2C]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">Onboarding Progress</h3>
                      <p className="text-[#64748B] text-sm">Complete your account setup</p>
                    </div>
                  </div>
                  {showOnboarding ? (
                    <ChevronDown className="w-5 h-5 text-[#94A3B8]" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[#94A3B8]" />
                  )}
                </button>
                {showOnboarding && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* Agreement Status */}
                    <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                          <div className="text-white font-medium">Agreement</div>
                          <div className="text-[#64748B] text-sm">Channel Partner Agreement signed</div>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">Complete</span>
                    </div>
                    {/* Payment Setup Status */}
                    <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <div>
                          <div className="text-white font-medium">Payment Setup</div>
                          <div className="text-[#64748B] text-sm">Configure your payout method</div>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">Pending</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DashboardCard title="Active Clients" value={stats.activeClients} subtitle={`${stats.totalClients} total`} icon={<Building2 className="w-5 h-5 text-purple-400" />} iconBgColor="bg-purple-500/20" />
                <DashboardCard title="Active Venues" value={stats.activeVenues} subtitle={`${stats.totalVenues} total`} icon={<MapPin className="w-5 h-5 text-green-400" />} iconBgColor="bg-green-500/20" />
                <DashboardCard title="Total Data" value={stats.totalDataGB.toFixed(1)} suffix=" GB" icon={<Activity className="w-5 h-5 text-blue-400" />} iconBgColor="bg-blue-500/20" />
                <DashboardCard title="Online Devices" value={stats.onlineDevices} subtitle={`${stats.totalDevices} total`} icon={<Wifi className="w-5 h-5 text-[#0EA5E9]" />} iconBgColor="bg-[#0EA5E9]/20" />
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">My Clients</h3>
                  <button onClick={() => setActiveTab('clients')} className="text-purple-400 text-sm hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {clients.map(client => (
                    <div key={client.id} className="flex items-center justify-between py-3 border-b border-[#2D3B5F] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center"><Building2 className="w-5 h-5 text-purple-400" /></div>
                        <div><div className="text-white font-medium">{client.company}</div><div className="text-[#64748B] text-sm">{client.venueCount} venues • {client.totalDataGB.toFixed(1)} GB</div></div>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${client.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{client.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Device Status</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#0A0F2C] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">{stats.totalDevices}</div>
                    <div className="text-[#64748B] text-sm">Total</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{stats.onlineDevices}</div>
                    <div className="text-[#64748B] text-sm">Online</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{stats.totalDevices - stats.onlineDevices}</div>
                    <div className="text-[#64748B] text-sm">Offline</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {stats.pendingPayments > 0 && (
                <div className="bg-gradient-to-br from-purple-500/20 to-[#0EA5E9]/20 border border-purple-500/30 rounded-xl p-6">
                  <div className="text-[#94A3B8] text-sm mb-1">Pending Payments</div>
                  <div className="text-3xl font-bold text-purple-400">${stats.pendingPayments.toFixed(2)}</div>
                  <div className="text-[#64748B] text-sm mt-2">Next payout: Jan 1, 2025</div>
                </div>
              )}
              <ReferralCodeCard referralCode={referralCode} totalReferrals={stats.totalClients} pendingReferrals={1} earnedFromReferrals={stats.myEarnings} showStats={true} />
              <ContactCard calendlyUrl="https://calendly.com/scohen-skyyield" supportEmail="support@skyyield.io" showTicketForm={true} />
              <DocumentsSection documents={documents} loading={loading} title="Documents" />
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#2D3B5F]"><h2 className="text-xl font-semibold text-white">My Clients</h2><p className="text-[#94A3B8] text-sm">Manage your client organizations</p></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-[#2D3B5F]">
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Company</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Contact</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Status</th>
                    <th className="text-center px-6 py-3 text-[#64748B] text-sm font-medium">Venues</th>
                    <th className="text-right px-6 py-3 text-[#64748B] text-sm font-medium">Data Usage</th>
                  </tr></thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center"><Building2 className="w-4 h-4 text-purple-400" /></div><span className="text-white font-medium">{client.company}</span></div></td>
                        <td className="px-6 py-4"><div className="text-white">{client.name}</div><div className="text-[#64748B] text-sm">{client.email}</div></td>
                        <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${client.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{client.status}</span></td>
                        <td className="px-6 py-4 text-center text-[#94A3B8]">{client.venueCount}</td>
                        <td className="px-6 py-4 text-right text-[#0EA5E9] font-medium">{client.totalDataGB.toFixed(1)} GB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <CRMTab />
          </div>
        )}

        {activeTab === 'earnings' && <PartnerPayments partnerId={partnerId} partnerType="channel_partner" />}
        {activeTab === 'documents' && <DocumentsSection documents={documents} loading={loading} title="Documents" />}
        {activeTab === 'settings' && <PartnerSettings partnerId={partnerId} partnerType="channel_partner" showCompanyInfo={true} showPaymentSettings={true} showNotifications={true} readOnly={!canEdit('cp_settings')} />}
      </div>
    </div>
  )
}

export default function ChannelPartnerPortal() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-purple-400 rounded-full animate-spin" /></div>}>
      <ChannelPartnerPortalContent />
    </Suspense>
  )
}