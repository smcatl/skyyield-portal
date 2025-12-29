'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, DollarSign, Link as LinkIcon, Copy, 
  TrendingUp, Clock, CheckCircle, AlertCircle,
  ExternalLink, RefreshCw, Share2, Wifi, Plus,
  FileText, Settings, HelpCircle, UserPlus,
  Megaphone, Calendar, ChevronRight, Download
} from 'lucide-react'
import { PortalSwitcher } from '@/components/portal/PortalSwitcher'

interface PartnerData {
  id: string
  partner_id: string
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  pipeline_stage: string
  referral_code: string
  referral_tracking_url: string
  commission_type: string
  commission_percentage: number
  commission_flat_fee: number
  commission_per_referral: number
  total_referrals: number
  active_referrals: number
  pending_referrals: number
  total_earned: number
  tipalti_payee_id: string
  tipalti_status: string
}

interface Referral {
  id: string
  partner_id: string
  company_name: string
  contact_name: string
  contact_email: string
  status: string
  pipeline_stage: string
  created_at: string
  commission_earned: number
}

interface Commission {
  id: string
  commission_month: string
  commission_amount: number
  payment_status: string
  payment_date: string
  calculation_details: string
}

export default function ReferralPartnerPortal() {
  const { user, isLoaded } = useUser()
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users, enabled: true },
    { id: 'referrals', label: 'My Referrals', icon: UserPlus, enabled: true },
    { id: 'earnings', label: 'Earnings', icon: DollarSign, enabled: true },
    { id: 'marketing', label: 'Marketing', icon: Megaphone, enabled: true },
    { id: 'documents', label: 'Documents', icon: FileText, enabled: true },
    { id: 'settings', label: 'Settings', icon: Settings, enabled: true },
  ]

  useEffect(() => {
    if (isLoaded && user) {
      loadPartnerData()
    }
  }, [isLoaded, user])

  const loadPartnerData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/portal/referral-partner')
      const data = await res.json()

      if (data.success) {
        setPartnerData(data.partner)
        setReferrals(data.referrals || [])
        setCommissions(data.commissions || [])
      } else {
        setError(data.error || 'Failed to load data')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = () => {
    if (partnerData?.referral_tracking_url) {
      navigator.clipboard.writeText(partnerData.referral_tracking_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyReferralCode = () => {
    if (partnerData?.referral_code) {
      navigator.clipboard.writeText(partnerData.referral_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-emerald-400/20 text-emerald-400',
      'trial_active': 'bg-cyan-400/20 text-cyan-400',
      'pending': 'bg-yellow-400/20 text-yellow-400',
      'approved': 'bg-emerald-400/20 text-emerald-400',
      'inactive': 'bg-gray-400/20 text-gray-400',
    }
    return colors[status] || 'bg-gray-400/20 text-gray-400'
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0EA5E9] mx-auto mb-4" />
          <p className="text-[#94A3B8]">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center p-4">
        <div className="bg-[#1A1F3A] border border-red-500/50 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Error</h2>
          <p className="text-[#94A3B8] mb-4">{error}</p>
          <button onClick={loadPartnerData} className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28]">
      {/* Header */}
      <header className="bg-[#0A0F2C]/80 backdrop-blur-xl border-b border-[#2D3B5F] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Wifi className="w-8 h-8 text-[#0EA5E9]" />
                <span className="text-xl font-bold text-white">SkyYield</span>
              </Link>
              <div className="h-6 w-px bg-[#2D3B5F]" />
              <span className="text-[#94A3B8]">Referral Partner Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <PortalSwitcher currentPortal="referral_partner" />
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {partnerData?.contact_name?.split(' ')[0] || 'Partner'}!
          </h1>
          <p className="text-[#94A3B8]">{partnerData?.company_name || 'Referral Partner'}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.filter(t => t.enabled).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#0EA5E9] text-white'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Referral Link Card - Most Important */}
            <div className="bg-gradient-to-r from-[#0EA5E9]/20 to-purple-500/20 border border-[#0EA5E9]/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Your Referral Link</h3>
                  <p className="text-[#94A3B8] text-sm">Share this link to earn commissions</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-[#0EA5E9]/20 text-[#0EA5E9] rounded-full text-sm font-mono">
                    {partnerData?.referral_code || 'CODE'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#0A0F2C] rounded-lg p-3 font-mono text-sm text-[#94A3B8] overflow-x-auto">
                  {partnerData?.referral_tracking_url || 'https://skyyield.io/r/YOUR-CODE'}
                </div>
                <button
                  onClick={copyReferralLink}
                  className="flex items-center gap-2 px-4 py-3 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 whitespace-nowrap"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#0EA5E9]/20 rounded-lg">
                    <UserPlus className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Total Referrals</span>
                </div>
                <p className="text-3xl font-bold text-white">{partnerData?.total_referrals || 0}</p>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-400/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Active</span>
                </div>
                <p className="text-3xl font-bold text-white">{partnerData?.active_referrals || 0}</p>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-400/20 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Pending</span>
                </div>
                <p className="text-3xl font-bold text-white">{partnerData?.pending_referrals || 0}</p>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-400/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Total Earned</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400">{formatCurrency(partnerData?.total_earned || 0)}</p>
              </div>
            </div>

            {/* Commission Structure */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Commission Structure</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <span className="text-[#64748B] text-sm">Commission Type</span>
                  <p className="text-white font-medium mt-1 capitalize">{partnerData?.commission_type || 'Per Referral'}</p>
                </div>
                {partnerData?.commission_per_referral > 0 && (
                  <div className="bg-[#0A0F2C] rounded-lg p-4">
                    <span className="text-[#64748B] text-sm">Per Referral</span>
                    <p className="text-emerald-400 font-bold text-xl mt-1">{formatCurrency(partnerData.commission_per_referral)}</p>
                  </div>
                )}
                {partnerData?.commission_percentage > 0 && (
                  <div className="bg-[#0A0F2C] rounded-lg p-4">
                    <span className="text-[#64748B] text-sm">Revenue Share</span>
                    <p className="text-emerald-400 font-bold text-xl mt-1">{partnerData.commission_percentage}%</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Referrals */}
            {referrals.length > 0 && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Referrals</h3>
                  <button 
                    onClick={() => setActiveTab('referrals')}
                    className="text-[#0EA5E9] text-sm hover:underline flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {referrals.slice(0, 5).map(ref => (
                    <div key={ref.id} className="flex items-center justify-between py-3 border-b border-[#2D3B5F] last:border-0">
                      <div>
                        <p className="text-white font-medium">{ref.company_name || ref.contact_name}</p>
                        <p className="text-[#64748B] text-sm">{formatDate(ref.created_at)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ref.status || ref.pipeline_stage)}`}>
                        {ref.status || ref.pipeline_stage?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== REFERRALS TAB ==================== */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">My Referrals</h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-emerald-400">{partnerData?.active_referrals || 0} Active</span>
                <span className="text-[#64748B]">•</span>
                <span className="text-yellow-400">{partnerData?.pending_referrals || 0} Pending</span>
              </div>
            </div>

            {referrals.length === 0 ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                <UserPlus className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No Referrals Yet</h3>
                <p className="text-[#94A3B8] text-sm mb-4">Share your referral link to start earning!</p>
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                >
                  Copy Referral Link
                </button>
              </div>
            ) : (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#0A0F2C]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Business</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#64748B] uppercase">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3B5F]">
                    {referrals.map(ref => (
                      <tr key={ref.id} className="hover:bg-[#2D3B5F]/30">
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{ref.company_name || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white">{ref.contact_name}</p>
                          <p className="text-[#64748B] text-xs">{ref.contact_email}</p>
                        </td>
                        <td className="px-6 py-4 text-[#94A3B8]">{formatDate(ref.created_at)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ref.status || ref.pipeline_stage)}`}>
                            {ref.status || ref.pipeline_stage?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-400 font-medium">
                          {ref.commission_earned > 0 ? formatCurrency(ref.commission_earned) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== EARNINGS TAB ==================== */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Earnings History</h2>
              {partnerData?.tipalti_status !== 'payable' && (
                <a
                  href="#"
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-400/20 text-yellow-400 rounded-lg hover:bg-yellow-400/30"
                >
                  <AlertCircle className="w-4 h-4" />
                  Complete Payment Setup
                </a>
              )}
            </div>

            {/* Earnings Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <span className="text-[#64748B] text-sm">Total Earnings</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(partnerData?.total_earned || 0)}</p>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <span className="text-[#64748B] text-sm">Active Referrals</span>
                <p className="text-2xl font-bold text-white mt-1">{partnerData?.active_referrals || 0}</p>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <span className="text-[#64748B] text-sm">Payment Status</span>
                <p className="text-2xl font-bold text-white mt-1 capitalize">{partnerData?.tipalti_status || 'Pending'}</p>
              </div>
            </div>

            {/* Commission History */}
            {commissions.length === 0 ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                <DollarSign className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No Earnings Yet</h3>
                <p className="text-[#94A3B8] text-sm">Your commission history will appear here.</p>
              </div>
            ) : (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#0A0F2C]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Payment Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#64748B] uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3B5F]">
                    {commissions.map(comm => (
                      <tr key={comm.id} className="hover:bg-[#2D3B5F]/30">
                        <td className="px-6 py-4 text-white font-medium">{formatDate(comm.commission_month)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            comm.payment_status === 'paid' ? 'bg-emerald-400/20 text-emerald-400' :
                            comm.payment_status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                            'bg-gray-400/20 text-gray-400'
                          }`}>
                            {comm.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#94A3B8]">{formatDate(comm.payment_date)}</td>
                        <td className="px-6 py-4 text-right text-emerald-400 font-semibold">
                          {formatCurrency(comm.commission_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== MARKETING TAB ==================== */}
        {activeTab === 'marketing' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Marketing Materials</h2>

            {/* Share Tools */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Quick Share</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#64748B] text-sm mb-2">Your Referral Code</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#0A0F2C] rounded-lg p-3 font-mono text-lg text-[#0EA5E9]">
                      {partnerData?.referral_code || 'CODE'}
                    </div>
                    <button
                      onClick={copyReferralCode}
                      className="p-3 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[#64748B] text-sm mb-2">Your Tracking URL</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#0A0F2C] rounded-lg p-3 font-mono text-sm text-[#94A3B8] truncate">
                      {partnerData?.referral_tracking_url || 'https://skyyield.io/r/CODE'}
                    </div>
                    <button
                      onClick={copyReferralLink}
                      className="p-3 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Downloadable Materials */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Downloadable Resources</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="#" className="flex items-center gap-3 p-4 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F]/50">
                  <FileText className="w-8 h-8 text-[#0EA5E9]" />
                  <div>
                    <p className="text-white font-medium">Partner Brochure</p>
                    <p className="text-[#64748B] text-xs">PDF • 2.4 MB</p>
                  </div>
                  <Download className="w-4 h-4 text-[#64748B] ml-auto" />
                </a>
                <a href="#" className="flex items-center gap-3 p-4 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F]/50">
                  <FileText className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-white font-medium">Sales Deck</p>
                    <p className="text-[#64748B] text-xs">PPTX • 5.1 MB</p>
                  </div>
                  <Download className="w-4 h-4 text-[#64748B] ml-auto" />
                </a>
                <a href="#" className="flex items-center gap-3 p-4 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F]/50">
                  <FileText className="w-8 h-8 text-emerald-400" />
                  <div>
                    <p className="text-white font-medium">Email Templates</p>
                    <p className="text-[#64748B] text-xs">DOCX • 156 KB</p>
                  </div>
                  <Download className="w-4 h-4 text-[#64748B] ml-auto" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ==================== DOCUMENTS TAB ==================== */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Documents</h2>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-8 h-8 text-[#0EA5E9]" />
                <div>
                  <h3 className="text-white font-medium">Referral Partner Agreement</h3>
                  <p className="text-[#64748B] text-sm">Signed and active</p>
                </div>
                <button className="ml-auto p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SETTINGS TAB ==================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Settings</h2>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Account Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#64748B] text-sm mb-1">Company Name</label>
                  <p className="text-white">{partnerData?.company_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[#64748B] text-sm mb-1">Partner ID</label>
                  <p className="text-white font-mono">{partnerData?.partner_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[#64748B] text-sm mb-1">Contact Name</label>
                  <p className="text-white">{partnerData?.contact_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[#64748B] text-sm mb-1">Contact Email</label>
                  <p className="text-white">{partnerData?.contact_email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Payment Settings</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Tipalti Payment Status</p>
                  <p className="text-[#64748B] text-sm capitalize">{partnerData?.tipalti_status || 'Not Set Up'}</p>
                </div>
                {partnerData?.tipalti_status !== 'payable' && (
                  <button className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">
                    Complete Setup
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
