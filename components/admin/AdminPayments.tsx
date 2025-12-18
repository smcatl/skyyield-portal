'use client'

import { useState, useEffect } from 'react'
import { 
  RefreshCw, ExternalLink, Building, Users, Handshake, Network,
  CheckCircle, Clock, AlertCircle, DollarSign, Eye
} from 'lucide-react'
import TipaltiIFrame from '@/components/TipaltiIFrame'

interface PartnerPayment {
  id: string
  name: string
  email: string
  type: 'location_partner' | 'referral_partner' | 'channel_partner' | 'relationship_partner'
  tipalti_payee_id: string | null
  tipalti_status: string | null
  company_name: string | null
  total_earned: number
  last_payment_date: string | null
  last_payment_amount: number | null
}

const typeLabels: Record<string, string> = {
  location_partner: 'Location Partner',
  referral_partner: 'Referral Partner',
  channel_partner: 'Channel Partner',
  relationship_partner: 'Relationship Partner'
}

const typeIcons: Record<string, any> = {
  location_partner: Building,
  referral_partner: Users,
  channel_partner: Network,
  relationship_partner: Handshake
}

export default function AdminPayments() {
  const [loading, setLoading] = useState(true)
  const [partners, setPartners] = useState<PartnerPayment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedPartner, setSelectedPartner] = useState<PartnerPayment | null>(null)
  const [viewType, setViewType] = useState<'paymentHistory' | 'invoiceHistory' | 'paymentDetails'>('paymentHistory')
  const [showIframe, setShowIframe] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadPartners()
  }, [])

  const loadPartners = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/payments')
      const data = await res.json()
      
      if (data.success) {
        setPartners(data.partners)
      } else {
        setError(data.error || 'Failed to load partners')
      }
    } catch (err) {
      setError('Failed to load payment data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null
    
    const statusMap: Record<string, { color: string, label: string }> = {
      'payable': { color: 'bg-green-500/20 text-green-400', label: 'Active' },
      'completed_pending': { color: 'bg-blue-500/20 text-blue-400', label: 'Pending Approval' },
      'signup_in_progress': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Signing Up' },
      'invite_sent': { color: 'bg-purple-500/20 text-purple-400', label: 'Invited' },
      'not_invited': { color: 'bg-gray-500/20 text-gray-400', label: 'Not Invited' },
      'suspended': { color: 'bg-red-500/20 text-red-400', label: 'Suspended' },
      'inactive': { color: 'bg-gray-500/20 text-gray-400', label: 'Inactive' },
    }
    
    const config = statusMap[status] || { color: 'bg-gray-500/20 text-gray-400', label: status }
    
    return (
      <span className={`px-2 py-1 rounded text-xs ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const openPartnerView = (partner: PartnerPayment, view: typeof viewType) => {
    setSelectedPartner(partner)
    setViewType(view)
    setShowIframe(true)
  }

  const filteredPartners = filterType === 'all' 
    ? partners 
    : partners.filter(p => p.type === filterType)

  if (loading) {
    return (
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0EA5E9] mx-auto mb-3" />
          <p className="text-[#94A3B8]">Loading payment data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#1A1F3A] border border-red-500/30 rounded-xl p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">Error Loading Data</h3>
          <p className="text-[#94A3B8] text-sm mb-4">{error}</p>
          <button
            onClick={loadPartners}
            className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Payments & Invoices</h2>
          <p className="text-[#94A3B8] text-sm">Manage partner payments through Tipalti</p>
        </div>
        <button
          onClick={loadPartners}
          className="flex items-center gap-2 px-3 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* View Type Tabs */}
      <div className="flex gap-2 border-b border-[#2D3B5F]">
        {[
          { id: 'paymentHistory', label: 'Payment History' },
          { id: 'invoiceHistory', label: 'Invoice History' },
          { id: 'paymentDetails', label: 'Payment Details' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewType(tab.id as any)}
            className={`px-4 py-2 border-b-2 transition-colors ${viewType === tab.id
              ? 'border-[#0EA5E9] text-white'
              : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <span className="text-[#94A3B8] text-sm">Filter by type:</span>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">All Partners ({partners.length})</option>
          <option value="location_partner">Location Partners ({partners.filter(p => p.type === 'location_partner').length})</option>
          <option value="referral_partner">Referral Partners ({partners.filter(p => p.type === 'referral_partner').length})</option>
          <option value="channel_partner">Channel Partners ({partners.filter(p => p.type === 'channel_partner').length})</option>
          <option value="relationship_partner">Relationship Partners ({partners.filter(p => p.type === 'relationship_partner').length})</option>
        </select>
      </div>

      {/* Partners Table */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
        {filteredPartners.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No Partners with Tipalti</h3>
            <p className="text-[#94A3B8] text-sm">
              Partners will appear here once they have a Tipalti payee ID assigned.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3B5F]">
                <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Partner</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Type</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Tipalti ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[#94A3B8]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map(partner => {
                const TypeIcon = typeIcons[partner.type] || Building
                return (
                  <tr key={`${partner.type}-${partner.id}`} className="border-b border-[#2D3B5F]/50 hover:bg-[#2D3B5F]/20">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{partner.name}</p>
                        <p className="text-[#94A3B8] text-sm">{partner.email}</p>
                        {partner.company_name && (
                          <p className="text-[#64748B] text-xs">{partner.company_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-[#0EA5E9]" />
                        <span className="text-[#94A3B8]">{typeLabels[partner.type]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-[#0EA5E9] text-sm bg-[#0EA5E9]/10 px-2 py-1 rounded">
                        {partner.tipalti_payee_id}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(partner.tipalti_status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openPartnerView(partner, viewType)}
                        className="flex items-center gap-1 text-[#0EA5E9] hover:underline text-sm ml-auto"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
        <p className="text-[#94A3B8] text-sm">
          <strong className="text-white">Note:</strong> Payment processing is handled securely by Tipalti.
          Partners can update payment details, view past payments, and download invoices.
        </p>
      </div>

      {/* Tipalti iFrame Modal */}
      {showIframe && selectedPartner?.tipalti_payee_id && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {viewType === 'paymentHistory' && 'Payment History'}
                  {viewType === 'invoiceHistory' && 'Invoices'}
                  {viewType === 'paymentDetails' && 'Payment Details'}
                </h3>
                <p className="text-[#64748B] text-sm">
                  {selectedPartner.name} • {selectedPartner.tipalti_payee_id}
                </p>
              </div>
              <button
                onClick={() => setShowIframe(false)}
                className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <TipaltiIFrame
                payeeId={selectedPartner.tipalti_payee_id}
                viewType={viewType}
                environment="production"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
