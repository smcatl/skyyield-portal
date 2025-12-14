'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Wifi, DollarSign, BarChart3, MapPin, 
  Activity, Calculator, FileText, GraduationCap, 
  Users, TrendingUp, Bell, Settings, Wallet, Target,
  ClipboardList
} from 'lucide-react'
import CalculatorSection from '@/components/CalculatorSection'
import {
  ContactCard,
  ReferralCodeCard,
  DashboardCard,
  EarningsTable,
  DocumentsSection,
  TrainingSection,
  VenuesSection,
  PartnerSettings,
  PartnerAnalytics,
  PartnerPayments,
} from '@/components/portal'
import CRMTab from '@/components/admin/crm/CRMTab'

type TabType = 'overview' | 'crm' | 'venues' | 'forms' | 'calculator' | 'payments' | 'settings' | 'analytics'

interface Venue {
  id: string
  name: string
  address: string
  city: string
  state: string
  type: string
  status: 'active' | 'trial' | 'pending' | 'inactive'
  devicesInstalled?: number
  dataUsageGB?: number
  monthlyEarnings?: number
  uniqueConnections?: number
  trialStartDate?: string
  trialEndDate?: string
  trialDaysRemaining?: number
  installDate?: string
}

interface EarningRecord {
  id: string
  date: string
  description: string
  type: 'commission' | 'referral' | 'bonus' | 'payout'
  amount: number
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  referenceId?: string
}

interface Document {
  id: string
  name: string
  type: 'loi' | 'contract' | 'agreement' | 'policy' | 'other'
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'expired'
  createdAt: string
  signedAt?: string
  expiresAt?: string
  downloadUrl?: string
  viewUrl?: string
}

interface TrainingItem {
  id: string
  title: string
  description: string
  type: 'video' | 'document' | 'article' | 'quiz'
  category: string
  duration?: string
  url: string
  completed?: boolean
  required?: boolean
}

export default function LocationPartnerPortal() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [partnerId, setPartnerId] = useState<string>('')
  const [venues, setVenues] = useState<Venue[]>([])
  const [earnings, setEarnings] = useState<EarningRecord[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [trainingItems, setTrainingItems] = useState<TrainingItem[]>([])
  const [stats, setStats] = useState({
    totalVenues: 0,
    activeVenues: 0,
    totalDataGB: 0,
    monthlyEarnings: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    totalReferrals: 0,
    pendingReferrals: 0,
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    
    const status = (user.unsafeMetadata as any)?.status || 'pending'
    if (status !== 'approved') {
      router.push('/pending-approval')
      return
    }

    const pId = (user.unsafeMetadata as any)?.partnerId || user.id
    setPartnerId(pId)
    loadPortalData()
  }, [isLoaded, user, router])

  const loadPortalData = async () => {
    setLoading(true)
    try {
      setVenues([
        { id: '1', name: 'Downtown Coffee Shop', address: '123 Main Street', city: 'Atlanta', state: 'GA', type: 'Cafe / Coffee Shop', status: 'active', devicesInstalled: 2, dataUsageGB: 456.2, monthlyEarnings: 91.24, uniqueConnections: 1245, installDate: '2024-06-15' },
        { id: '2', name: 'Main St Restaurant', address: '456 Oak Avenue', city: 'Atlanta', state: 'GA', type: 'Restaurant', status: 'active', devicesInstalled: 1, dataUsageGB: 312.8, monthlyEarnings: 62.56, uniqueConnections: 892, installDate: '2024-08-20' },
        { id: '3', name: 'Midtown Gym', address: '789 Fitness Blvd', city: 'Atlanta', state: 'GA', type: 'Gym / Fitness', status: 'trial', devicesInstalled: 3, dataUsageGB: 125.4, monthlyEarnings: 0, uniqueConnections: 456, trialStartDate: '2024-12-01', trialEndDate: '2025-01-01', trialDaysRemaining: 17 },
      ])
      setEarnings([
        { id: '1', date: '2024-12-14', description: 'Monthly commission - Downtown Coffee Shop', type: 'commission', amount: 91.24, status: 'pending' },
        { id: '2', date: '2024-12-14', description: 'Monthly commission - Main St Restaurant', type: 'commission', amount: 62.56, status: 'pending' },
        { id: '3', date: '2024-12-10', description: 'Referral bonus - New partner signup', type: 'referral', amount: 50.00, status: 'approved' },
        { id: '4', date: '2024-12-01', description: 'November payout', type: 'payout', amount: 312.50, status: 'paid', referenceId: 'PAY-2024-1201' },
        { id: '5', date: '2024-11-01', description: 'October payout', type: 'payout', amount: 287.00, status: 'paid', referenceId: 'PAY-2024-1101' },
      ])
      setDocuments([
        { id: '1', name: 'Location Partner Agreement', type: 'contract', status: 'signed', createdAt: '2024-06-01', signedAt: '2024-06-05', downloadUrl: '#', viewUrl: '#' },
        { id: '2', name: 'Midtown Gym - Letter of Intent', type: 'loi', status: 'sent', createdAt: '2024-12-01', expiresAt: '2024-12-31', viewUrl: 'https://app.pandadoc.com/...' },
      ])
      setTrainingItems([
        { id: '1', title: 'Getting Started with SkyYield', description: 'Learn the basics of the SkyYield platform.', type: 'video', category: 'Getting Started', duration: '8:45', url: '#', completed: true, required: true },
        { id: '2', title: 'Equipment Installation Guide', description: 'Step-by-step installation guide.', type: 'document', category: 'Installation', duration: '15 min read', url: '#', completed: true, required: true },
        { id: '3', title: 'Maximizing Revenue', description: 'Tips for increasing data offloading.', type: 'article', category: 'Growth', duration: '10 min read', url: '#', completed: false, required: false },
      ])
      setStats({ totalVenues: 3, activeVenues: 2, totalDataGB: 894.4, monthlyEarnings: 153.80, totalEarnings: 1847.50, pendingPayments: 203.80, totalReferrals: 5, pendingReferrals: 2 })
    } catch (error) {
      console.error('Error loading portal data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  const hasCalculatorSubscription = (user.unsafeMetadata as any)?.calculatorSubscription === true
  const referralCode = (user.unsafeMetadata as any)?.referralCode || `LP-${user.id?.slice(-6).toUpperCase()}`
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'crm', label: 'My Referrals', icon: Target },
    { id: 'venues', label: 'My Venues', icon: MapPin },
    { id: 'forms', label: 'Forms', icon: ClipboardList },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ]
  const pendingDocs = documents.filter(d => d.status === 'sent' || d.status === 'viewed')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20">
      <div className="px-4 pb-4 border-b border-[#2D3B5F]">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Location <span className="text-green-400">Partner</span> Portal</h1>
              <p className="text-[#94A3B8] mt-1">Welcome back, {user?.firstName}! Manage your venues and referrals.</p>
            </div>
            {pendingDocs.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <Bell className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">{pendingDocs.length} document(s) need signature</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-green-500 text-white' : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
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
                <DashboardCard title="Data Offloaded" value={stats.totalDataGB.toFixed(1)} suffix=" GB" subtitle="This month" icon={<Activity className="w-5 h-5 text-blue-400" />} iconBgColor="bg-blue-500/20" trend={{ value: 12, label: 'vs last month' }} />
                <DashboardCard title="This Month" value={stats.monthlyEarnings} prefix="$" icon={<DollarSign className="w-5 h-5 text-[#0EA5E9]" />} iconBgColor="bg-[#0EA5E9]/20" />
                <DashboardCard title="Referrals" value={stats.totalReferrals} subtitle={`${stats.pendingReferrals} pending`} icon={<Users className="w-5 h-5 text-purple-400" />} iconBgColor="bg-purple-500/20" />
              </div>
              <VenuesSection venues={venues} loading={loading} title="My Venues" onViewDetails={() => setActiveTab('venues')} onAddVenue={() => router.push('/apply/location-partner')} />
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                  <button onClick={() => setActiveTab('payments')} className="text-[#0EA5E9] text-sm hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {earnings.slice(0, 4).map(earning => (
                    <div key={earning.id} className="flex items-center justify-between py-2 border-b border-[#2D3B5F] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${earning.type === 'payout' ? 'bg-orange-500/20' : 'bg-green-500/20'}`}>
                          <DollarSign className={`w-4 h-4 ${earning.type === 'payout' ? 'text-orange-400' : 'text-green-400'}`} />
                        </div>
                        <div>
                          <div className="text-white text-sm">{earning.description}</div>
                          <div className="text-[#64748B] text-xs">{new Date(earning.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className={`font-medium ${earning.type === 'payout' ? 'text-orange-400' : 'text-green-400'}`}>
                        {earning.type === 'payout' ? '-' : '+'}${earning.amount.toFixed(2)}
                      </div>
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
              {pendingDocs.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-yellow-400 font-medium mb-2">
                    <FileText className="w-4 h-4" />
                    Action Required
                  </div>
                  <div className="text-[#94A3B8] text-sm mb-3">You have {pendingDocs.length} document(s) waiting for signature.</div>
                  <button onClick={() => setActiveTab('settings')} className="w-full px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors">Review Documents</button>
                </div>
              )}
              <ReferralCodeCard referralCode={referralCode} totalReferrals={stats.totalReferrals} pendingReferrals={stats.pendingReferrals} earnedFromReferrals={150} showStats={true} />
              <ContactCard calendlyUrl="https://calendly.com/scohen-skyyield" supportEmail="support@skyyield.io" showTicketForm={true} />
              <DocumentsSection documents={documents} loading={loading} title="My Documents" />
              <TrainingSection items={trainingItems} loading={loading} title="Training & Resources" showProgress={true} />
            </div>
          </div>
        )}

        {activeTab === 'crm' && (
          <div className="space-y-6">
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-2">My Referrals</h2>
              <p className="text-[#94A3B8] mb-4">Track prospects you&apos;ve referred to SkyYield. When they sign up, you earn commission!</p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[#0A0F2C] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.totalReferrals}</div>
                  <div className="text-[#64748B] text-sm">Total Referrals</div>
                </div>
                <div className="bg-[#0A0F2C] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{stats.pendingReferrals}</div>
                  <div className="text-[#64748B] text-sm">In Progress</div>
                </div>
                <div className="bg-[#0A0F2C] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.totalReferrals - stats.pendingReferrals}</div>
                  <div className="text-[#64748B] text-sm">Converted</div>
                </div>
              </div>
            </div>
            <CRMTab />
          </div>
        )}

        {activeTab === 'venues' && (
          <VenuesSection venues={venues} loading={loading} title="My Venues" onAddVenue={() => router.push('/apply/location-partner')} />
        )}

        {activeTab === 'forms' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Forms</h2>
              <p className="text-[#94A3B8]">Access and submit forms</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Add New Venue</div>
                    <div className="text-[#64748B] text-sm">Submit a new location</div>
                  </div>
                </div>
                <Link href="/apply/location-partner" className="text-[#0EA5E9] text-sm hover:underline">Start Application →</Link>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-green-500 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Refer a Partner</div>
                    <div className="text-[#64748B] text-sm">Earn commission on referrals</div>
                  </div>
                </div>
                <button onClick={() => setActiveTab('crm')} className="text-green-400 text-sm hover:underline">Add Referral →</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Location Intelligence Calculator</h2>
              <p className="text-[#94A3B8] text-sm">Analyze venue potential and estimate earnings</p>
            </div>
            <CalculatorSection isSubscribed={hasCalculatorSubscription} showUpgradePrompt={true} />
          </div>
        )}

        {activeTab === 'payments' && (
          <PartnerPayments partnerId={partnerId} partnerType="location_partner" />
        )}

        {activeTab === 'settings' && (
          <PartnerSettings partnerId={partnerId} partnerType="location_partner" showCompanyInfo={true} showPaymentSettings={true} showNotifications={true} />
        )}

        {activeTab === 'analytics' && (
          <PartnerAnalytics partnerId={partnerId} partnerType="location_partner" showReferrals={true} showDataUsage={true} />
        )}
      </div>
    </div>
  )
}
