'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { 
  Users, DollarSign, Link as LinkIcon, Copy, 
  TrendingUp, Clock, CheckCircle, AlertCircle,
  ExternalLink, RefreshCw, Share2
} from 'lucide-react'

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
  total_earned: number
  tipalti_payee_id: string
  tipalti_status: string
}

interface Referral {
  id: string
  partner_id: string
  company_name: string
  contact_name: string
  status: string
  created_at: string
  commission_earned: number
}

interface Commission {
  id: string
  commission_month: string
  commission_amount: number
  payment_status: string
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
          <button
            onClick={loadPartnerData}
            className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!partnerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center p-4">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 max-w-md text-center">
          <Users className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Partner Account Found</h2>
          <p className="text-[#94A3B8]">Your account is not linked to a Referral Partner record. Please contact support.</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      payable: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      paid: 'bg-green-500/20 text-green-400',
    }
    return colors[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-400'
  }

  const totalEarnings = commissions
    .filter(c => c.payment_status === 'paid')
    .reduce((sum, c) => sum + c.commission_amount, 0)

  const pendingEarnings = commissions
    .filter(c => c.payment_status === 'pending')
    .reduce((sum, c) => sum + c.commission_amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {partnerData.contact_name?.split(' ')[0]}!
          </h1>
          <p className="text-[#94A3B8]">
            {partnerData.company_name} • {partnerData.partner_id}
          </p>
        </div>

        {/* Referral Link Card - PROMINENT */}
        <div className="bg-gradient-to-r from-[#0EA5E9]/20 to-[#10F981]/20 border border-[#0EA5E9]/50 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-[#0EA5E9]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Your Referral Link</h2>
              <p className="text-[#94A3B8] text-sm">Share this link to earn ${partnerData.commission_per_referral || partnerData.commission_percentage + '%'} per referral</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg px-4 py-3 font-mono text-[#0EA5E9] text-sm overflow-x-auto">
              {partnerData.referral_tracking_url || `https://skyyield.io/partners/location?ref=${partnerData.partner_id}`}
            </div>
            <button
              onClick={copyReferralLink}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-[#0EA5E9] text-white hover:bg-[#0EA5E9]/80'
              }`}
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {partnerData.referral_code && (
            <p className="text-[#64748B] text-sm mt-3">
              Referral Code: <span className="text-[#0EA5E9] font-mono">{partnerData.referral_code}</span>
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <span className="text-[#94A3B8] text-sm">Total Referrals</span>
            </div>
            <div className="text-2xl font-bold text-[#0EA5E9]">{partnerData.total_referrals || referrals.length}</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Active</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{partnerData.active_referrals || referrals.filter(r => r.status === 'active').length}</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Total Earned</span>
            </div>
            <div className="text-2xl font-bold text-green-400">${(partnerData.total_earned || totalEarnings).toFixed(2)}</div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Pending</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">${pendingEarnings.toFixed(2)}</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Referrals List */}
          <div className="lg:col-span-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Your Referrals</h2>
            {referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
                <p className="text-[#94A3B8]">No referrals yet</p>
                <p className="text-[#64748B] text-sm mt-2">Share your link to start earning!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map(ref => (
                  <div key={ref.id} className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                    <div>
                      <div className="text-white font-medium">{ref.company_name || ref.contact_name}</div>
                      <div className="text-[#64748B] text-sm">
                        {new Date(ref.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(ref.status)}`}>
                        {ref.status}
                      </span>
                      {ref.commission_earned > 0 && (
                        <div className="text-green-400 text-sm mt-1">+${ref.commission_earned}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Commission History */}
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Payments</h2>
            {commissions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
                <p className="text-[#94A3B8]">No payments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {commissions.slice(0, 5).map(comm => (
                  <div key={comm.id} className="p-3 bg-[#0A0F2C] rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">${comm.commission_amount.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(comm.payment_status)}`}>
                        {comm.payment_status}
                      </span>
                    </div>
                    <div className="text-[#64748B] text-xs">{comm.calculation_details}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
