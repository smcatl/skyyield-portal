'use client'

import { useState, useEffect } from 'react'
import { 
  RefreshCw, Building, Users, Handshake, Network,
  CheckCircle, AlertCircle, DollarSign, Eye, X,
  FileText, Settings, Calendar, Filter, ExternalLink
} from 'lucide-react'
import TipaltiIFrame from '@/components/TipaltiIFrame'

interface Partner {
  id: string
  name: string
  email: string
  company: string | null
  tipaltiPayeeId: string
  tipaltiStatus: string | null
  partnerType: 'location' | 'referral' | 'channel' | 'relationship'
  lastPaymentDate: string | null
  lastPaymentAmount: number | null
}

export default function AdminPayments() {
  const [loading, setLoading] = useState(true)
  const [partners, setPartners] = useState<Partner[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [activeTab, setActiveTab] = useState<'paymentHistory' | 'invoiceHistory' | 'paymentDetails'>('paymentHistory')
  const [showIframe, setShowIframe] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadPartners()
  }, [])

  const loadPartners = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch from Supabase - all partners with Tipalti IDs
      const [lpRes, rpRes] = await Promise.all([
        fetch('/api/partners/location'),
        fetch('/api/partners/referral'),
      ])

      const partners: Partner[] = []

      // Location Partners
      if (lpRes.ok) {
        const lpData = await lpRes.json()
        if (lpData.data) {
          lpData.data.forEach((lp: any) => {
            if (lp.tipalti_payee_id) {
              partners.push({
                id: lp.id,
                name: `${lp.contact_first_name || ''} ${lp.contact_last_name || ''}`.trim() || 'Unknown',
                email: lp.contact_email || '',
                company: lp.company_legal_name || lp.dba_name || null,
                tipaltiPayeeId: lp.tipalti_payee_id,
                tipaltiStatus: lp.tipalti_status,
                partnerType: 'location',
                lastPaymentDate: lp.last_payment_date,
                lastPaymentAmount: lp.last_payment_amount
              })
            }
          })
        }
      }

      // Referral Partners  
      if (rpRes.ok) {
        const rpData = await rpRes.json()
        if (rpData.data) {
          rpData.data.forEach((rp: any) => {
            if (rp.tipalti_payee_id) {
              partners.push({
                id: rp.id,
                name: rp.contact_name || 'Unknown',
                email: rp.email || '',
                company: rp.company_name || null,
                tipaltiPayeeId: rp.tipalti_payee_id,
                tipaltiStatus: rp.tipalti_status,
                partnerType: 'referral',
                lastPaymentDate: null,
                lastPaymentAmount: null
              })
            }
          })
        }
      }

      setPartners(partners)
    } catch (err) {
      console.error('Error loading partners:', err)
      setError('Failed to load partners')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { color: string, label: string }> = {
      'payable': { color: 'bg-green-500/20 text-green-400', label: 'Payable' },
      'completed_pending': { color: 'bg-blue-500/20 text-blue-400', label: 'Setup Complete' },
      'signup_in_progress': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Signing Up' },
      'invite_sent': { color: 'bg-purple-500/20 text-purple-400', label: 'Invited' },
      'not_invited': { color: 'bg-gray-500/20 text-gray-400', label: 'Not Invited' },
      'suspended': { color: 'bg-red-500/20 text-red-400', label: 'Suspended' },
      'inactive': { color: 'bg-gray-500/20 text-gray-400', label: 'Inactive' },
    }
    
    const config = statusMap[status || ''] || { color: 'bg-gray-500/20 text-gray-400', label: status || 'Unknown' }
    return <span className={`px-2 py-1 rounded text-xs ${config.color}`}>{config.label}</span>
  }

  const getPartnerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      location: 'Location Partner',
      referral: 'Referral Partner',
      channel: 'Channel Partner',
      relationship: 'Relationship Partner'
    }
    return labels[type] || type
  }

  const getPartnerTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      location: Building,
      referral: Users,
      channel: Network,
      relationship: Handshake
    }
    const Icon = icons[type] || Building
    return <Icon className="w-4 h-4 text-[#0EA5E9]" />
  }

  const openPayeeView = (partner: Partner, tab: typeof activeTab) => {
    setSelectedPartner(partner)
    setActiveTab(tab)
    setShowIframe(true)
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
  }

  // Filter partners
  const filteredPartners = filterType === 'all' 
    ? partners 
    : partners.filter(p => p.partnerType === filterType)

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Payments & Invoices</h2>
          <p className="text-[#94A3B8] text-sm">Manage partner payments through Tipalti</p>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#0EA5E9] mx-auto mb-3" />
            <p className="text-[#94A3B8]">Loading partners...</p>
          </div>
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
        <div className="flex items-center gap-3">
          <a 
            href="https://hub.tipalti.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Tipalti Hub
          </a>
          <button
            onClick={loadPartners}
            className="flex items-center gap-2 px-3 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-[#94A3B8] text-sm">Total Payees</div>
          <div className="text-2xl font-bold text-white">{partners.length}</div>
          <div className="text-[#64748B] text-xs mt-1">In Tipalti</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-[#94A3B8] text-sm">Location Partners</div>
          <div className="text-2xl font-bold text-[#0EA5E9]">{partners.filter(p => p.partnerType === 'location').length}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-[#94A3B8] text-sm">Referral Partners</div>
          <div className="text-2xl font-bold text-[#10F981]">{partners.filter(p => p.partnerType === 'referral').length}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-[#94A3B8] text-sm">Payable</div>
          <div className="text-2xl font-bold text-green-400">{partners.filter(p => p.tipaltiStatus === 'payable').length}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Filter className="w-4 h-4 text-[#64748B]" />
        <span className="text-[#94A3B8] text-sm">Filter:</span>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">All Types ({partners.length})</option>
          <option value="location">Location Partners ({partners.filter(p => p.partnerType === 'location').length})</option>
          <option value="referral">Referral Partners ({partners.filter(p => p.partnerType === 'referral').length})</option>
        </select>
      </div>

      {/* Partners Table */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
        {filteredPartners.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No Partners Found</h3>
            <p className="text-[#94A3B8] text-sm">No partners with Tipalti IDs match your filter.</p>
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
              {filteredPartners.map(partner => (
                <tr key={`${partner.partnerType}-${partner.id}`} className="border-b border-[#2D3B5F]/50 hover:bg-[#2D3B5F]/20">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{partner.name}</p>
                      <p className="text-[#94A3B8] text-sm">{partner.email}</p>
                      {partner.company && <p className="text-[#64748B] text-xs">{partner.company}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getPartnerTypeIcon(partner.partnerType)}
                      <span className="text-[#94A3B8] text-sm">{getPartnerTypeLabel(partner.partnerType)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-[#0EA5E9] text-sm bg-[#0EA5E9]/10 px-2 py-1 rounded">
                      {partner.tipaltiPayeeId}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(partner.tipaltiStatus)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openPayeeView(partner, 'paymentHistory')}
                        className="flex items-center gap-1 px-2 py-1 text-[#0EA5E9] hover:bg-[#0EA5E9]/10 rounded text-sm"
                        title="Payment History"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openPayeeView(partner, 'invoiceHistory')}
                        className="flex items-center gap-1 px-2 py-1 text-[#0EA5E9] hover:bg-[#0EA5E9]/10 rounded text-sm"
                        title="Invoices"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openPayeeView(partner, 'paymentDetails')}
                        className="flex items-center gap-1 px-2 py-1 text-[#0EA5E9] hover:bg-[#0EA5E9]/10 rounded text-sm"
                        title="Payment Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
        <p className="text-[#94A3B8] text-sm">
          <strong className="text-white">Tip:</strong> Click the icons to view payment history, invoices, or payment settings directly from Tipalti. 
          For full access to all features, click "Tipalti Hub" above.
        </p>
      </div>

      {/* Tipalti iFrame Modal */}
      {showIframe && selectedPartner && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {activeTab === 'paymentHistory' && 'Payment History'}
                  {activeTab === 'invoiceHistory' && 'Invoices'}
                  {activeTab === 'paymentDetails' && 'Payment Settings'}
                </h3>
                <p className="text-[#64748B] text-sm">
                  {selectedPartner.name} • {selectedPartner.tipaltiPayeeId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Tab switcher in modal */}
                <div className="flex bg-[#0A0F2C] rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('paymentHistory')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${activeTab === 'paymentHistory' ? 'bg-[#0EA5E9] text-white' : 'text-[#94A3B8] hover:text-white'}`}
                  >
                    History
                  </button>
                  <button
                    onClick={() => setActiveTab('invoiceHistory')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${activeTab === 'invoiceHistory' ? 'bg-[#0EA5E9] text-white' : 'text-[#94A3B8] hover:text-white'}`}
                  >
                    Invoices
                  </button>
                  <button
                    onClick={() => setActiveTab('paymentDetails')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${activeTab === 'paymentDetails' ? 'bg-[#0EA5E9] text-white' : 'text-[#94A3B8] hover:text-white'}`}
                  >
                    Settings
                  </button>
                </div>
                <button
                  onClick={() => setShowIframe(false)}
                  className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <TipaltiIFrame
                payeeId={selectedPartner.tipaltiPayeeId}
                viewType={activeTab}
                environment="production"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
