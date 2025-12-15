'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, DollarSign, BarChart3, MapPin, Wifi,
  Activity, Calculator, FileText, TrendingUp, Settings, 
  Wallet, Target, Users, Handshake, Heart, Building2, Cpu, X
} from 'lucide-react'
import CalculatorSection from '@/components/CalculatorSection'
import {
  ContactCard, ReferralCodeCard, DashboardCard, DocumentsSection,
  TrainingSection, VenuesSection, PartnerSettings, PartnerAnalytics, PartnerPayments,
} from '@/components/portal'
import CRMTab from '@/components/admin/crm/CRMTab'

type TabType = 'overview' | 'introductions' | 'venues' | 'devices' | 'materials' | 'calculator' | 'payments' | 'settings' | 'analytics'

interface Introduction {
  id: string
  name: string
  company: string
  email: string
  type: 'location_partner' | 'channel_partner' | 'investor'
  status: 'introduced' | 'meeting_scheduled' | 'in_discussion' | 'converted' | 'not_interested'
  introducedAt: string
  reward?: number
}

interface Device {
  id: string
  name: string
  type: string
  venueName: string
  status: 'online' | 'offline'
  dataUsageGB: number
  lastSeen: string
}

function RelationshipPartnerPortalContent() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPreviewMode = searchParams.get('preview') === 'true'
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [partnerId, setPartnerId] = useState<string>('')
  const [introductions, setIntroductions] = useState<Introduction[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalIntroductions: 0, convertedIntroductions: 0, pendingIntroductions: 0,
    totalVenues: 0, activeVenues: 0, totalDevices: 0, onlineDevices: 0, totalDataGB: 0,
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    
    const status = (user.unsafeMetadata as any)?.status || 'pending'
    
    // Allow preview mode for any authenticated user (only admins can access the preview links anyway)
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
      setIntroductions([
        { id: '1', name: 'Robert Chen', company: 'Chen Investment Group', email: 'robert@chencapital.com', type: 'investor', status: 'converted', introducedAt: '2024-08-15', reward: 5000.00 },
        { id: '2', name: 'Amanda Williams', company: 'Williams Hotel Group', email: 'amanda@williamshotels.com', type: 'channel_partner', status: 'converted', introducedAt: '2024-09-10', reward: 2500.00 },
        { id: '3', name: 'David Park', company: 'Park Ventures', email: 'david@parkvc.com', type: 'investor', status: 'in_discussion', introducedAt: '2024-11-01' },
        { id: '4', name: 'Jennifer Lee', company: 'Metro Retail Corp', email: 'jennifer@metroretail.com', type: 'location_partner', status: 'meeting_scheduled', introducedAt: '2024-11-20' },
        { id: '5', name: 'Michael Brown', company: 'Brown Capital', email: 'michael@browncap.com', type: 'investor', status: 'introduced', introducedAt: '2024-12-01' },
      ])
      setVenues([
        { id: '1', name: 'Williams Hotel Downtown', address: '100 Hotel Plaza', city: 'Atlanta', state: 'GA', type: 'Hotel', status: 'active', devicesInstalled: 5, dataUsageGB: 856.4 },
        { id: '2', name: 'Williams Hotel Midtown', address: '200 Hotel Blvd', city: 'Atlanta', state: 'GA', type: 'Hotel', status: 'active', devicesInstalled: 4, dataUsageGB: 712.3 },
        { id: '3', name: 'Williams Hotel Airport', address: '300 Terminal Dr', city: 'Atlanta', state: 'GA', type: 'Hotel', status: 'pending', devicesInstalled: 0, dataUsageGB: 0 },
      ])
      setDevices([
        { id: '1', name: 'AP-Hotel-DT-Lobby', type: 'UniFi U6 Enterprise', venueName: 'Williams Hotel Downtown', status: 'online', dataUsageGB: 245.8, lastSeen: '2024-12-14T18:30:00Z' },
        { id: '2', name: 'AP-Hotel-DT-Floor2', type: 'UniFi U6 Pro', venueName: 'Williams Hotel Downtown', status: 'online', dataUsageGB: 198.2, lastSeen: '2024-12-14T18:30:00Z' },
        { id: '3', name: 'AP-Hotel-DT-Floor3', type: 'UniFi U6 Pro', venueName: 'Williams Hotel Downtown', status: 'online', dataUsageGB: 178.4, lastSeen: '2024-12-14T18:25:00Z' },
        { id: '4', name: 'AP-Hotel-DT-Pool', type: 'UniFi U6 Mesh', venueName: 'Williams Hotel Downtown', status: 'online', dataUsageGB: 134.0, lastSeen: '2024-12-14T18:28:00Z' },
        { id: '5', name: 'AP-Hotel-DT-Conf', type: 'UniFi U6 Lite', venueName: 'Williams Hotel Downtown', status: 'offline', dataUsageGB: 100.0, lastSeen: '2024-12-14T10:00:00Z' },
        { id: '6', name: 'AP-Hotel-MT-Lobby', type: 'UniFi U6 Enterprise', venueName: 'Williams Hotel Midtown', status: 'online', dataUsageGB: 312.3, lastSeen: '2024-12-14T18:30:00Z' },
        { id: '7', name: 'AP-Hotel-MT-Floor2', type: 'UniFi U6 Pro', venueName: 'Williams Hotel Midtown', status: 'online', dataUsageGB: 200.0, lastSeen: '2024-12-14T18:30:00Z' },
        { id: '8', name: 'AP-Hotel-MT-Floor3', type: 'UniFi U6 Pro', venueName: 'Williams Hotel Midtown', status: 'online', dataUsageGB: 125.0, lastSeen: '2024-12-14T18:25:00Z' },
        { id: '9', name: 'AP-Hotel-MT-Gym', type: 'UniFi U6 Lite', venueName: 'Williams Hotel Midtown', status: 'online', dataUsageGB: 75.0, lastSeen: '2024-12-14T18:28:00Z' },
      ])
      setDocuments([
        { id: '1', name: 'Relationship Partner Agreement', type: 'contract', status: 'signed', createdAt: '2024-06-01', signedAt: '2024-06-05' },
        { id: '2', name: 'NDA - Confidentiality Agreement', type: 'agreement', status: 'signed', createdAt: '2024-06-01', signedAt: '2024-06-05' },
      ])
      // Fetch materials from API
      try {
        const materialsRes = await fetch('/api/materials?partnerType=relationship_partner')
        const materialsData = await materialsRes.json()
        if (materialsData.materials) {
          setMaterials(materialsData.materials.map((m: any) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            type: m.type,
            category: m.category,
            duration: m.duration,
            url: m.url,
            completed: false,
            required: m.required,
          })))
        }
      } catch (err) {
        // Fallback to default materials
        setMaterials([
          { id: '1', title: 'Relationship Partner Overview', description: 'Understanding your role.', type: 'video', category: 'Onboarding', duration: '10:00', url: '#', completed: true, required: true },
          { id: '2', title: 'Making Effective Introductions', description: 'Best practices for warm intros.', type: 'document', category: 'Skills', duration: '8 min', url: '#', completed: true, required: true },
        ])
      }
      setStats({ totalIntroductions: 5, convertedIntroductions: 2, pendingIntroductions: 3, totalVenues: 3, activeVenues: 2, totalDevices: 9, onlineDevices: 8, totalDataGB: 1568.7 })
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" /></div>
  }

  const hasCalculatorSubscription = (user.unsafeMetadata as any)?.calculatorSubscription === true
  const referralCode = `RP-${user.id?.slice(-6).toUpperCase()}`
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'introductions', label: 'Introductions', icon: Handshake },
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'devices', label: 'Devices', icon: Wifi },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted': return 'bg-green-500/20 text-green-400'
      case 'in_discussion': return 'bg-blue-500/20 text-blue-400'
      case 'meeting_scheduled': return 'bg-purple-500/20 text-purple-400'
      case 'introduced': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'investor': return <DollarSign className="w-4 h-4" />
      case 'channel_partner': return <Building2 className="w-4 h-4" />
      case 'location_partner': return <Target className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20">
      {isPreviewMode && (
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <span className="font-medium">👁️ Preview Mode:</span>
              <span>Viewing as Relationship Partner</span>
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
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-white">Relationship <span className="text-pink-400">Partner</span> Portal</h1>
            <p className="text-[#94A3B8] mt-1">Welcome back, {user?.firstName}!</p>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-pink-500 text-white' : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'}`}>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DashboardCard title="Introductions" value={stats.totalIntroductions} subtitle={`${stats.convertedIntroductions} converted`} icon={<Handshake className="w-5 h-5 text-pink-400" />} iconBgColor="bg-pink-500/20" />
                <DashboardCard title="Active Venues" value={stats.activeVenues} subtitle={`${stats.totalVenues} total`} icon={<MapPin className="w-5 h-5 text-green-400" />} iconBgColor="bg-green-500/20" />
                <DashboardCard title="Total Data" value={stats.totalDataGB.toFixed(1)} suffix=" GB" icon={<Activity className="w-5 h-5 text-purple-400" />} iconBgColor="bg-purple-500/20" />
                <DashboardCard title="Online Devices" value={stats.onlineDevices} subtitle={`${stats.totalDevices} total`} icon={<Wifi className="w-5 h-5 text-[#0EA5E9]" />} iconBgColor="bg-[#0EA5E9]/20" />
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Introductions</h3>
                  <button onClick={() => setActiveTab('introductions')} className="text-pink-400 text-sm hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {introductions.slice(0, 4).map(intro => (
                    <div key={intro.id} className="flex items-center justify-between py-3 border-b border-[#2D3B5F] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400">{getTypeIcon(intro.type)}</div>
                        <div><div className="text-white font-medium">{intro.name}</div><div className="text-[#64748B] text-sm">{intro.company}</div></div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(intro.status)}`}>{intro.status.replace('_', ' ')}</span>
                        {intro.reward && <div className="text-green-400 text-sm mt-1">${intro.reward.toLocaleString()}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Device Status</h3>
                  <button onClick={() => setActiveTab('devices')} className="text-[#0EA5E9] text-sm hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#0A0F2C] rounded-lg p-4 text-center"><div className="text-2xl font-bold text-white">{stats.totalDevices}</div><div className="text-[#64748B] text-sm">Total</div></div>
                  <div className="bg-[#0A0F2C] rounded-lg p-4 text-center"><div className="text-2xl font-bold text-green-400">{stats.onlineDevices}</div><div className="text-[#64748B] text-sm">Online</div></div>
                  <div className="bg-[#0A0F2C] rounded-lg p-4 text-center"><div className="text-2xl font-bold text-[#0EA5E9]">{stats.totalDataGB.toFixed(0)}</div><div className="text-[#64748B] text-sm">GB Total</div></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <ReferralCodeCard referralCode={referralCode} totalReferrals={stats.totalIntroductions} pendingReferrals={stats.pendingIntroductions} earnedFromReferrals={0} showStats={true} />
              <ContactCard calendlyUrl="https://calendly.com/scohen-skyyield" supportEmail="support@skyyield.io" showTicketForm={true} />
              <DocumentsSection documents={documents} loading={loading} title="Documents" />
            </div>
          </div>
        )}

        {activeTab === 'introductions' && (
          <div className="space-y-6">
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#2D3B5F]"><h2 className="text-xl font-semibold text-white">My Introductions</h2><p className="text-[#94A3B8] text-sm">Track all your introductions</p></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-[#2D3B5F]">
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Contact</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Type</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Status</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Introduced</th>
                    <th className="text-right px-6 py-3 text-[#64748B] text-sm font-medium">Reward</th>
                  </tr></thead>
                  <tbody>
                    {introductions.map(intro => (
                      <tr key={intro.id} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400">{getTypeIcon(intro.type)}</div><div><div className="text-white font-medium">{intro.name}</div><div className="text-[#64748B] text-sm">{intro.company}</div></div></div></td>
                        <td className="px-6 py-4 text-[#94A3B8] capitalize">{intro.type.replace('_', ' ')}</td>
                        <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(intro.status)}`}>{intro.status.replace('_', ' ')}</span></td>
                        <td className="px-6 py-4 text-[#94A3B8]">{new Date(intro.introducedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">{intro.reward ? <span className="text-green-400 font-medium">${intro.reward.toLocaleString()}</span> : <span className="text-[#64748B]">Pending</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <CRMTab />
          </div>
        )}

        {activeTab === 'venues' && <VenuesSection venues={venues} loading={loading} title="Venues from Introductions" />}
        
        {activeTab === 'devices' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DashboardCard title="Total Devices" value={stats.totalDevices} icon={<Cpu className="w-5 h-5 text-purple-400" />} iconBgColor="bg-purple-500/20" />
              <DashboardCard title="Online" value={stats.onlineDevices} icon={<Wifi className="w-5 h-5 text-green-400" />} iconBgColor="bg-green-500/20" />
              <DashboardCard title="Offline" value={stats.totalDevices - stats.onlineDevices} icon={<Wifi className="w-5 h-5 text-red-400" />} iconBgColor="bg-red-500/20" />
              <DashboardCard title="Total Data" value={stats.totalDataGB.toFixed(1)} suffix=" GB" icon={<Activity className="w-5 h-5 text-[#0EA5E9]" />} iconBgColor="bg-[#0EA5E9]/20" />
            </div>
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#2D3B5F]"><h2 className="text-xl font-semibold text-white">All Devices</h2><p className="text-[#94A3B8] text-sm">Devices from introduced venues</p></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-[#2D3B5F]">
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Device</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Venue</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Status</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Data</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Last Seen</th>
                  </tr></thead>
                  <tbody>
                    {devices.map(device => (
                      <tr key={device.id} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center"><Wifi className="w-5 h-5 text-purple-400" /></div><div><div className="text-white font-medium">{device.name}</div><div className="text-[#64748B] text-xs">{device.type}</div></div></div></td>
                        <td className="px-6 py-4 text-[#94A3B8]">{device.venueName}</td>
                        <td className="px-6 py-4"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${device.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}><span className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />{device.status}</span></td>
                        <td className="px-6 py-4 text-[#0EA5E9] font-medium">{device.dataUsageGB.toFixed(1)} GB</td>
                        <td className="px-6 py-4 text-[#64748B] text-sm">{new Date(device.lastSeen).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materials' && <TrainingSection items={materials} loading={loading} title="Materials & Resources" showProgress={true} />}
        {activeTab === 'calculator' && <CalculatorSection isSubscribed={hasCalculatorSubscription} showUpgradePrompt={true} />}
        {activeTab === 'payments' && <PartnerPayments partnerId={partnerId} partnerType="relationship_partner" />}
        {activeTab === 'settings' && <PartnerSettings partnerId={partnerId} partnerType="relationship_partner" showCompanyInfo={false} showPaymentSettings={true} showNotifications={true} />}
        {activeTab === 'analytics' && <PartnerAnalytics partnerId={partnerId} partnerType="relationship_partner" showReferrals={true} showDataUsage={true} />}
      </div>
    </div>
  )
}

export default function RelationshipPartnerPortal() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-pink-400 rounded-full animate-spin" /></div>}>
      <RelationshipPartnerPortalContent />
    </Suspense>
  )
}
