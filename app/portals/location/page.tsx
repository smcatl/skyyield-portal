'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { 
  Building, DollarSign, Calendar, FileText, 
  TrendingUp, Clock, CheckCircle, AlertCircle,
  ExternalLink, Download, RefreshCw
} from 'lucide-react'

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
  commission_type: string
  commission_percentage: number
  commission_flat_fee: number
  tipalti_payee_id: string
  tipalti_status: string
  last_payment_amount: number
  last_payment_date: string
  trial_status: string
  trial_end_date: string
  contract_status: string
  loi_status: string
}

interface Commission {
  id: string
  commission_month: string
  commission_amount: number
  payment_status: string
  calculation_details: string
}

export default function LocationPartnerPortal() {
  const { user, isLoaded } = useUser()
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && user) {
      loadPartnerData()
    }
  }, [isLoaded, user])

  const loadPartnerData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch partner data for current user
      const res = await fetch('/api/portal/location-partner')
      const data = await res.json()

      if (data.success) {
        setPartnerData(data.partner)
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
          <Building className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Partner Account Found</h2>
          <p className="text-[#94A3B8]">Your account is not linked to a Location Partner record. Please contact support.</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      payable: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-green-500/20 text-green-400',
      signed: 'bg-green-500/20 text-green-400',
      sent: 'bg-blue-500/20 text-blue-400',
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
            Welcome back, {partnerData.contact_first_name}!
          </h1>
          <p className="text-[#94A3B8]">
            {partnerData.dba_name || partnerData.company_legal_name} • {partnerData.partner_id}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Total Earnings</span>
            </div>
            <div className="text-2xl font-bold text-green-400">${totalEarnings.toFixed(2)}</div>
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

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <span className="text-[#94A3B8] text-sm">Commission Rate</span>
            </div>
            <div className="text-2xl font-bold text-[#0EA5E9]">
              {partnerData.commission_type === 'percentage' 
                ? `${partnerData.commission_percentage}%`
                : `$${partnerData.commission_flat_fee}`}
            </div>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-[#94A3B8] text-sm">Status</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(partnerData.pipeline_stage)}`}>
              {partnerData.pipeline_stage}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Commission History */}
          <div className="lg:col-span-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Commission History</h2>
            {commissions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
                <p className="text-[#94A3B8]">No commission records yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {commissions.map(comm => (
                  <div key={comm.id} className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                    <div>
                      <div className="text-white font-medium">
                        {new Date(comm.commission_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-[#64748B] text-sm">{comm.calculation_details}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold">${comm.commission_amount.toFixed(2)}</div>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(comm.payment_status)}`}>
                        {comm.payment_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Account Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Contract</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(partnerData.contract_status)}`}>
                    {partnerData.contract_status || 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">LOI</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(partnerData.loi_status)}`}>
                    {partnerData.loi_status || 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Payment Setup</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(partnerData.tipalti_status)}`}>
                    {partnerData.tipalti_status || 'Not Started'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Links</h2>
              <div className="space-y-2">
                <a 
                  href="/payments"
                  className="flex items-center gap-2 p-3 bg-[#0A0F2C] rounded-lg text-[#94A3B8] hover:text-white transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  Update Payment Info
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
                <a 
                  href="/support"
                  className="flex items-center gap-2 p-3 bg-[#0A0F2C] rounded-lg text-[#94A3B8] hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Contact Support
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
