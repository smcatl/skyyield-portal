'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { 
  Users, DollarSign, Link as LinkIcon, Copy, FileText,
  Settings, TrendingUp, Clock, CheckCircle, AlertCircle,
  RefreshCw, Share2, Wifi, Megaphone, HelpCircle, UserPlus
} from 'lucide-react'
import {
  ContactCard, ReferralCodeCard, DashboardCard, DocumentsSection,
  TrainingSection, PartnerSettings, PartnerPayments,
} from '@/components/portal'
import { PortalSwitcher } from '@/components/portal/PortalSwitcher'

type TabType = 'overview' | 'referrals' | 'earnings' | 'marketing' | 'documents' | 'settings'

interface PartnerData {
  id: string
  partner_id: string
  company_name: string
  contact_first_name: string
  contact_last_name: string
  contact_email: string
  contact_phone: string
  pipeline_stage: string
  referral_code: string
  commission_type: string
  commission_percentage: number
  commission_per_referral: number
  total_referrals: number
  active_referrals: number
  pending_referrals: number
  total_earned: number
  tipalti_status: string
  agreement_status: string
}

interface Referral {
  id: string
  business_name: string
  contact_name: string
  contact_email: string
  status: string
  pipeline_stage: string
  created_at: string
  commission_earned: number
}

interface Stats {
  totalReferrals: number
  activeReferrals: number
  pendingReferrals: number
  totalEarned: number
  pendingPayment: number
  conversionRate: number
}

function ReferralPartnerPortalContent() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPreviewMode = searchParams.get('preview') === 'true'
  
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<Stats>({
    totalReferrals: 0, activeReferrals: 0, pendingReferrals: 0,
    totalEarned: 0, pendingPayment: 0, conversionRate: 0
  })
  const [documents, setDocuments] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'referrals', label: 'My Referrals', icon: UserPlus },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
    { id: 'documents', label: 'Documents', icon: FileText },
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
      const res = await fetch('/api/portal/referral-partner')
      const data = await res.json()

      if (data.success) {
        setPartnerData(data.partner)
        setReferrals(data.referrals || [])
        
        const totalReferrals = data.referrals?.length || 0
        const activeReferrals = data.referrals?.filter((r: any) => r.status === 'active').length || 0
        const pendingReferrals = data.referrals?.filter((r: any) => r.status === 'pending').length || 0
        
        setStats({
          totalReferrals,
          activeReferrals,
          pendingReferrals,
          totalEarned: data.partner?.total_earned || 0,
          pendingPayment: data.stats?.pendingPayment || 0,
          conversionRate: totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0,
        })
        
        // Transform documents for DocumentsSection
        const docs = []
        if (data.partner?.agreement_status) {
          docs.push({
            id: 'agreement',
            name: 'Referral Partner Agreement',
            type: 'agreement',
            status: data.partner.agreement_status === 'signed' ? 'signed' : 'pending',
            createdAt: new Date().toISOString(),
            signedAt: data.partner.agreement_status === 'signed' ? new Date().toISOString() : undefined,
            downloadUrl: data.partner.agreement_document_url,
          })
        }
        setDocuments(docs)
        
        // Marketing materials
        setMaterials([
          { id: '1', name: 'Partner Brochure', type: 'pdf', size: '2.4 MB', url: '#' },
          { id: '2', name: 'Sales Deck', type: 'pptx', size: '5.1 MB', url: '#' },
          { id: '3', name: 'Email Templates', type: 'docx', size: '156 KB', url: '#' },
        ])
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

  const copyReferralLink = () => {
    const link = `https://skyyield.io/partners/location?ref=${partnerData?.partner_id || ''}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(partnerData?.referral_code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            <AlertCircle className="w-8 h-8 text-red-400" />
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
  const companyName = partnerData?.company_name || 'Your Company'
  const referralLink = `https://skyyield.io/partners/location?ref=${partnerData?.partner_id || ''}`
  const commissionDisplay = partnerData?.commission_per_referral 
    ? `$${partnerData.commission_per_referral.toFixed(2)} per referral`
    : partnerData?.commission_percentage 
      ? `${partnerData.commission_percentage}% commission`
      : 'Contact for rates'

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
              <span className="text-[#94A3B8]">Referral Partner Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <PortalSwitcher currentPortal="referral_partner" />
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
          <p className="text-[#94A3B8] mt-1">{companyName}</p>
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
              {/* Referral Link Card */}
              <div className="bg-gradient-to-br from-[#0EA5E9]/20 to-[#06B6D4]/10 border border-[#0EA5E9]/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Your Referral Link</h3>
                    <p className="text-[#94A3B8] text-sm">Share this link to earn commissions</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    {commissionDisplay}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#0A0F2C] rounded-lg px-4 py-3 border border-[#2D3B5F]">
                    <code className="text-[#0EA5E9] text-sm break-all">{referralLink}</code>
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className="px-4 py-3 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {partnerData?.referral_code && (
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-[#64748B] text-sm">Code:</span>
                    <span className="text-[#0EA5E9] font-mono font-bold">{partnerData.referral_code}</span>
                    <button onClick={copyReferralCode} className="text-[#64748B] hover:text-white">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DashboardCard 
                  title="Total Referrals" 
                  value={stats.totalReferrals} 
                  icon={<Users className="w-5 h-5 text-[#0EA5E9]" />} 
                  iconBgColor="bg-[#0EA5E9]/20" 
                />
                <DashboardCard 
                  title="Active" 
                  value={stats.activeReferrals} 
                  icon={<CheckCircle className="w-5 h-5 text-green-400" />} 
                  iconBgColor="bg-green-500/20" 
                />
                <DashboardCard 
                  title="Pending" 
                  value={stats.pendingReferrals} 
                  icon={<Clock className="w-5 h-5 text-yellow-400" />} 
                  iconBgColor="bg-yellow-500/20" 
                />
                <DashboardCard 
                  title="Total Earned" 
                  value={`$${stats.totalEarned.toFixed(2)}`} 
                  icon={<DollarSign className="w-5 h-5 text-green-400" />} 
                  iconBgColor="bg-green-500/20" 
                />
              </div>

              {/* Recent Referrals */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Referrals</h3>
                  <button onClick={() => setActiveTab('referrals')} className="text-[#0EA5E9] text-sm hover:underline">
                    View All
                  </button>
                </div>
                {referrals.length === 0 ? (
                  <div className="text-center py-8 text-[#64748B]">
                    <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No referrals yet</p>
                    <p className="text-sm mt-1">Share your link to start earning!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referrals.slice(0, 5).map(referral => (
                      <div key={referral.id} className="flex items-center justify-between py-3 border-b border-[#2D3B5F] last:border-0">
                        <div>
                          <div className="text-white font-medium">{referral.business_name}</div>
                          <div className="text-[#64748B] text-sm">{referral.contact_name}</div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            referral.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            referral.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {referral.status}
                          </span>
                          {referral.commission_earned > 0 && (
                            <div className="text-green-400 text-sm mt-1">${referral.commission_earned.toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Commission Structure */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Your Commission</h3>
                <div className="space-y-4">
                  {partnerData?.commission_per_referral && partnerData.commission_per_referral > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#94A3B8]">Per Referral</span>
                      <span className="text-2xl font-bold text-green-400">${partnerData.commission_per_referral}</span>
                    </div>
                  )}
                  {partnerData?.commission_percentage && partnerData.commission_percentage > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#94A3B8]">Revenue Share</span>
                      <span className="text-2xl font-bold text-[#0EA5E9]">{partnerData.commission_percentage}%</span>
                    </div>
                  )}
                </div>
              </div>
              
              <DocumentsSection documents={documents} loading={loading} title="Documents" />
              <ContactCard 
                calendlyUrl="https://calendly.com/scohen-skyyield" 
                supportEmail="support@skyyield.io" 
                showTicketForm={false} 
              />
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">My Referrals</h2>
                <p className="text-[#94A3B8] text-sm">{stats.activeReferrals} active • {stats.pendingReferrals} pending</p>
              </div>
              <button 
                onClick={copyReferralLink}
                className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Link
              </button>
            </div>

            {referrals.length === 0 ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                <UserPlus className="w-16 h-16 text-[#64748B] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Referrals Yet</h3>
                <p className="text-[#94A3B8] mb-6">Share your referral link to start earning commissions</p>
                <button 
                  onClick={copyReferralLink}
                  className="px-6 py-3 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                >
                  Copy Referral Link
                </button>
              </div>
            ) : (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2D3B5F]">
                      <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Business</th>
                      <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Contact</th>
                      <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Status</th>
                      <th className="text-left px-6 py-3 text-[#64748B] text-sm font-medium">Stage</th>
                      <th className="text-right px-6 py-3 text-[#64748B] text-sm font-medium">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map(referral => (
                      <tr key={referral.id} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{referral.business_name}</div>
                          <div className="text-[#64748B] text-xs">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[#94A3B8]">{referral.contact_name}</div>
                          <div className="text-[#64748B] text-xs">{referral.contact_email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            referral.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            referral.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {referral.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#94A3B8] text-sm">
                          {referral.pipeline_stage || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {referral.commission_earned > 0 ? (
                            <span className="text-green-400 font-medium">${referral.commission_earned.toFixed(2)}</span>
                          ) : (
                            <span className="text-[#64748B]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <PartnerPayments partnerId={partnerData?.id || ''} partnerType="referral_partner" />
        )}

        {activeTab === 'marketing' && (
          <div className="space-y-6">
            {/* Quick Share */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Share</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">Your Referral Code</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#0A0F2C] rounded-lg px-4 py-3 border border-[#2D3B5F]">
                      <code className="text-[#0EA5E9] font-mono font-bold">{partnerData?.referral_code}</code>
                    </div>
                    <button onClick={copyReferralCode} className="p-3 bg-[#2D3B5F] rounded-lg hover:bg-[#3D4B6F] transition-colors">
                      <Copy className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">Your Tracking URL</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#0A0F2C] rounded-lg px-4 py-3 border border-[#2D3B5F] overflow-hidden">
                      <code className="text-[#0EA5E9] text-sm truncate block">{referralLink}</code>
                    </div>
                    <button onClick={copyReferralLink} className="p-3 bg-[#0EA5E9] rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                      <Copy className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Downloadable Resources */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Downloadable Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {materials.map(material => (
                  <a 
                    key={material.id}
                    href={material.url}
                    className="flex items-center gap-4 p-4 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F] transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#0EA5E9]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{material.name}</div>
                      <div className="text-[#64748B] text-sm">{material.type.toUpperCase()} • {material.size}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <DocumentsSection documents={documents} loading={loading} title="Your Documents" />
        )}

        {activeTab === 'settings' && (
          <PartnerSettings 
            partnerId={partnerData?.id || ''} 
            partnerType="referral_partner"
            showCompanyInfo={true}
            showPaymentSettings={true}
            showNotifications={true}
          />
        )}
      </div>
    </div>
  )
}

export default function ReferralPartnerPortal() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    }>
      <ReferralPartnerPortalContent />
    </Suspense>
  )
}
