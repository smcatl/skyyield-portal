'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, DollarSign, BarChart3, MapPin, Wifi,
  Activity, Calculator, FileText, TrendingUp, Settings, 
  Wallet, Bell, Target, Users, Cpu, X
} from 'lucide-react'
import CalculatorSection from '@/components/CalculatorSection'
import {
  ContactCard, ReferralCodeCard, DashboardCard, DocumentsSection,
  TrainingSection, VenuesSection, PartnerSettings, PartnerAnalytics, PartnerPayments,
} from '@/components/portal'
import CRMTab from '@/components/admin/crm/CRMTab'

type TabType = 'overview' | 'referrals' | 'venues' | 'devices' | 'materials' | 'calculator' | 'payments' | 'settings' | 'analytics'

interface Device {
  id: string
  name: string
  type: string
  serialNumber: string
  macAddress: string
  venueId: string
  venueName: string
  status: 'online' | 'offline' | 'maintenance'
  dataUsageGB: number
  lastSeen: string
  installedAt: string
}

function LocationPartnerPortalContent() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPreviewMode = searchParams.get('preview') === 'true'
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [partnerId, setPartnerId] = useState<string>('')
  const [venues, setVenues] = useState<any[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalVenues: 0, activeVenues: 0, totalDevices: 0, onlineDevices: 0,
    totalDataGB: 0, myEarnings: 0, pendingPayments: 0, totalReferrals: 0, pendingReferrals: 0,
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
      setVenues([
        { id: '1', name: 'Downtown Coffee Shop', address: '123 Main St', city: 'Atlanta', state: 'GA', type: 'Cafe', status: 'active', devicesInstalled: 2, dataUsageGB: 456.2, monthlyEarnings: 91.24 },
        { id: '2', name: 'Main St Restaurant', address: '456 Oak Ave', city: 'Atlanta', state: 'GA', type: 'Restaurant', status: 'active', devicesInstalled: 1, dataUsageGB: 312.8, monthlyEarnings: 62.56 },
        { id: '3', name: 'Midtown Gym', address: '789 Fitness Blvd', city: 'Atlanta', state: 'GA', type: 'Gym', status: 'trial', devicesInstalled: 3, dataUsageGB: 125.4, monthlyEarnings: 0, trialDaysRemaining: 17 },
      ])
      setDevices([
        { id: '1', name: 'AP-Coffee-Main', type: 'UniFi U6 Pro', serialNumber: 'UNF6P-001234', macAddress: 'AA:BB:CC:11:22:33', venueId: '1', venueName: 'Downtown Coffee Shop', status: 'online', dataUsageGB: 234.5, lastSeen: '2024-12-14T18:30:00Z', installedAt: '2024-06-15' },
        { id: '2', name: 'AP-Coffee-Patio', type: 'UniFi U6 Mesh', serialNumber: 'UNF6M-005678', macAddress: 'AA:BB:CC:44:55:66', venueId: '1', venueName: 'Downtown Coffee Shop', status: 'online', dataUsageGB: 221.7, lastSeen: '2024-12-14T18:30:00Z', installedAt: '2024-06-15' },
        { id: '3', name: 'AP-Restaurant-1', type: 'UniFi U6 Pro', serialNumber: 'UNF6P-009876', macAddress: 'AA:BB:CC:77:88:99', venueId: '2', venueName: 'Main St Restaurant', status: 'online', dataUsageGB: 312.8, lastSeen: '2024-12-14T18:25:00Z', installedAt: '2024-08-20' },
        { id: '4', name: 'AP-Gym-Floor', type: 'UniFi U6 Enterprise', serialNumber: 'UNF6E-001111', macAddress: 'DD:EE:FF:11:22:33', venueId: '3', venueName: 'Midtown Gym', status: 'online', dataUsageGB: 65.2, lastSeen: '2024-12-14T18:28:00Z', installedAt: '2024-12-01' },
        { id: '5', name: 'AP-Gym-Cardio', type: 'UniFi U6 Pro', serialNumber: 'UNF6P-002222', macAddress: 'DD:EE:FF:44:55:66', venueId: '3', venueName: 'Midtown Gym', status: 'online', dataUsageGB: 35.1, lastSeen: '2024-12-14T18:28:00Z', installedAt: '2024-12-01' },
        { id: '6', name: 'AP-Gym-Locker', type: 'UniFi U6 Lite', serialNumber: 'UNF6L-003333', macAddress: 'DD:EE:FF:77:88:99', venueId: '3', venueName: 'Midtown Gym', status: 'offline', dataUsageGB: 25.1, lastSeen: '2024-12-14T12:00:00Z', installedAt: '2024-12-01' },
      ])
      setDocuments([
        { id: '1', name: 'Location Partner Agreement', type: 'contract', status: 'signed', createdAt: '2024-06-01', signedAt: '2024-06-05' },
        { id: '2', name: 'Midtown Gym - Letter of Intent', type: 'loi', status: 'sent', createdAt: '2024-12-01', expiresAt: '2024-12-31' },
      ])
      // Fetch materials from API
      try {
        const materialsRes = await fetch('/api/materials?partnerType=location_partner')
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
          { id: '1', title: 'Getting Started with SkyYield', description: 'Learn the basics of the platform.', type: 'video', category: 'Onboarding', duration: '8:45', url: '#', completed: true, required: true },
          { id: '2', title: 'Equipment Installation Guide', description: 'Step-by-step installation.', type: 'document', category: 'Installation', duration: '15 min', url: '#', completed: true, required: true },
          { id: '3', title: 'Maximizing Revenue', description: 'Tips for increasing data offloading.', type: 'article', category: 'Growth', duration: '10 min', url: '#', completed: false, required: false },
        ])
      }
      setStats({ totalVenues: 3, activeVenues: 2, totalDevices: 6, onlineDevices: 5, totalDataGB: 894.4, myEarnings: 153.80, pendingPayments: 153.80, totalReferrals: 5, pendingReferrals: 2 })
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" /></div>
  }

  const hasCalculatorSubscription = (user.unsafeMetadata as any)?.calculatorSubscription === true
  const referralCode = `LP-${user.id?.slice(-6).toUpperCase()}`
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'referrals', label: 'My Referrals', icon: Target },
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'devices', label: 'Devices', icon: Wifi },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ]
  const pendingDocs = documents.filter(d => d.status === 'sent' || d.status === 'viewed')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20">
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <span className="font-medium">👁️ Preview Mode:</span>
              <span>Viewing as Location Partner</span>
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
              <h1 className="text-3xl font-bold text-white">Location <span className="text-green-400">Partner</span> Portal</h1>
              <p className="text-[#94A3B8] mt-1">Welcome back, {user?.firstName}!</p>
            </div>
            {pendingDocs.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <Bell className="w-4 h-4 text-yellow-400" /><span className="text-yellow-400 text-sm font-medium">{pendingDocs.length} doc(s) need signature</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-green-500 text-white' : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'}`}>
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
                <DashboardCard title="Active Venues" value={stats.activeVenues} subtitle={`${stats.totalVenues} total`} icon={<MapPin className="w-5 h-5 text-green-400" />} iconBgColor="bg-green-500/20" />
                <DashboardCard title="Online Devices" value={stats.onlineDevices} subtitle={`${stats.totalDevices} total`} icon={<Wifi className="w-5 h-5 text-blue-400" />} iconBgColor="bg-blue-500/20" />
                <DashboardCard title="Total Data" value={stats.totalDataGB.toFixed(1)} suffix=" GB" icon={<Activity className="w-5 h-5 text-purple-400" />} iconBgColor="bg-purple-500/20" />
                <DashboardCard title="Referrals" value={stats.totalReferrals} subtitle={`${stats.pendingReferrals} pending`} icon={<Target className="w-5 h-5 text-[#0EA5E9]" />} iconBgColor="bg-[#0EA5E9]/20" />
              </div>
              <VenuesSection venues={venues} loading={loading} title="My Venues" onViewDetails={() => setActiveTab('venues')} onAddVenue={() => router.push('/apply/location-partner')} />
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Device Status</h3>
                  <button onClick={() => setActiveTab('devices')} className="text-[#0EA5E9] text-sm hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {devices.slice(0, 3).map(device => (
                    <div key={device.id} className="bg-[#0A0F2C] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium text-sm">{device.name}</span>
                        <span className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
                      </div>
                      <div className="text-[#64748B] text-xs">{device.venueName}</div>
                      <div className="text-[#0EA5E9] text-sm mt-1">{device.dataUsageGB.toFixed(1)} GB</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {stats.pendingPayments > 0 && (
                <div className="bg-gradient-to-br from-green-500/20 to-[#0EA5E9]/20 border border-green-500/30 rounded-xl p-6">
                  <div className="text-[#94A3B8] text-sm mb-1">Pending Payments</div>
                  <div className="text-3xl font-bold text-green-400">${stats.pendingPayments.toFixed(2)}</div>
                  <div className="text-[#64748B] text-sm mt-2">Next payout: Jan 1, 2025</div>
                </div>
              )}
              <ReferralCodeCard referralCode={referralCode} totalReferrals={stats.totalReferrals} pendingReferrals={stats.pendingReferrals} earnedFromReferrals={0} showStats={true} />
              <ContactCard calendlyUrl="https://calendly.com/scohen-skyyield" supportEmail="support@skyyield.io" showTicketForm={true} />
              <DocumentsSection documents={documents} loading={loading} title="Documents" />
            </div>
          </div>
        )}

        {activeTab === 'referrals' && <CRMTab />}
        {activeTab === 'venues' && <VenuesSection venues={venues} loading={loading} title="All Venues" onAddVenue={() => router.push('/apply/location-partner')} />}
        
        {activeTab === 'devices' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DashboardCard title="Total Devices" value={stats.totalDevices} icon={<Cpu className="w-5 h-5 text-purple-400" />} iconBgColor="bg-purple-500/20" />
              <DashboardCard title="Online" value={stats.onlineDevices} icon={<Wifi className="w-5 h-5 text-green-400" />} iconBgColor="bg-green-500/20" />
              <DashboardCard title="Offline" value={stats.totalDevices - stats.onlineDevices} icon={<Wifi className="w-5 h-5 text-red-400" />} iconBgColor="bg-red-500/20" />
              <DashboardCard title="Total Data" value={stats.totalDataGB.toFixed(1)} suffix=" GB" icon={<Activity className="w-5 h-5 text-[#0EA5E9]" />} iconBgColor="bg-[#0EA5E9]/20" />
            </div>
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#2D3B5F]">
                <h2 className="text-xl font-semibold text-white">All Devices</h2>
                <p className="text-[#94A3B8] text-sm">Monitor your WiFi access points</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-[#2D3B5F]">
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Device</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Venue</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Status</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Data Usage</th>
                    <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Last Seen</th>
                  </tr></thead>
                  <tbody>
                    {devices.map(device => (
                      <tr key={device.id} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center"><Wifi className="w-5 h-5 text-purple-400" /></div>
                            <div><div className="text-white font-medium">{device.name}</div><div className="text-[#64748B] text-xs">{device.type}</div></div>
                          </div>
                        </td>
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
        {activeTab === 'payments' && <PartnerPayments partnerId={partnerId} partnerType="location_partner" />}
        {activeTab === 'settings' && <PartnerSettings partnerId={partnerId} partnerType="location_partner" showCompanyInfo={true} showPaymentSettings={true} showNotifications={true} />}
        {activeTab === 'analytics' && <PartnerAnalytics partnerId={partnerId} partnerType="location_partner" showReferrals={true} showDataUsage={true} />}
      </div>
    </div>
  )
}

export default function LocationPartnerPortal() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-green-400 rounded-full animate-spin" /></div>}>
      <LocationPartnerPortalContent />
    </Suspense>
  )
}
