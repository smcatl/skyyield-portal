'use client'

import { useState, useEffect } from 'react'
import { 
  RefreshCw, ExternalLink, Building, Users, Handshake, Network,
  CheckCircle, Clock, AlertCircle, DollarSign, Eye, X,
  CreditCard, FileText, Settings, Calendar, Filter, Info
} from 'lucide-react'
import TipaltiIFrame from '@/components/TipaltiIFrame'

interface PayeeData {
  payeeId: string
  name: string
  email: string
  company: string | null
  paymentMethod: string | null
  payeeStatus: string | null
  isPayable: boolean
  totalPaid: number
  pendingAmount: number
  lastPaymentDate: string | null
  lastPaymentAmount: number | null
  payments: any[]
  invoices: any[]
  partnerType: string | null
}

interface Summary {
  totalPayees: number
  totalPaid: number
  totalPending: number
  payableCount: number
}

export default function AdminPayments() {
  const [loading, setLoading] = useState(true)
  const [payees, setPayees] = useState<PayeeData[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPayee, setSelectedPayee] = useState<PayeeData | null>(null)
  const [activeTab, setActiveTab] = useState<'paymentHistory' | 'invoiceHistory' | 'paymentDetails'>('paymentHistory')
  const [showIframe, setShowIframe] = useState(false)
  const [iframeViewType, setIframeViewType] = useState<'paymentHistory' | 'invoiceHistory' | 'paymentDetails'>('paymentDetails')
  
  // Date filters
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadPayees()
  }, [])

  const loadPayees = async () => {
    setLoading(true)
    setError(null)
    try {
      let url = '/api/admin/payments'
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (params.toString()) url += '?' + params.toString()

      const res = await fetch(url)
      const data = await res.json()
      
      if (data.success) {
        setPayees(Array.isArray(data.payees) ? data.payees : [])
        setSummary(data.summary || {
          totalPayees: 0,
          totalPaid: 0,
          totalPending: 0,
          payableCount: 0
        })
      } else {
        setError(data.error || 'Failed to load payees')
        setPayees([])
        setSummary({
          totalPayees: 0,
          totalPaid: 0,
          totalPending: 0,
          payableCount: 0
        })
      }
    } catch (err) {
      setError('Failed to load payment data')
      setPayees([])
      setSummary({
        totalPayees: 0,
        totalPaid: 0,
        totalPending: 0,
        payableCount: 0
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const applyDateFilter = () => {
    loadPayees()
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setFilterType('all')
    loadPayees()
  }

  const getStatusBadge = (status: string | null, isPayable: boolean) => {
    if (isPayable) {
      return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Payable</span>
    }
    
    const statusMap: Record<string, { color: string, label: string }> = {
      'Active': { color: 'bg-green-500/20 text-green-400', label: 'Active' },
      'Pending': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
      'Invited': { color: 'bg-purple-500/20 text-purple-400', label: 'Invited' },
      'Suspended': { color: 'bg-red-500/20 text-red-400', label: 'Suspended' },
      'payable': { color: 'bg-green-500/20 text-green-400', label: 'Payable' },
      'completed_pending': { color: 'bg-blue-500/20 text-blue-400', label: 'Setup Complete' },
      'signup_in_progress': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Signing Up' },
      'invite_sent': { color: 'bg-purple-500/20 text-purple-400', label: 'Invited' },
      'not_invited': { color: 'bg-gray-500/20 text-gray-400', label: 'Not Invited' },
    }
    
    const config = statusMap[status || ''] || { color: 'bg-gray-500/20 text-gray-400', label: status || 'Unknown' }
    
    return <span className={`px-2 py-1 rounded text-xs ${config.color}`}>{config.label}</span>
  }

  const getPartnerIcon = (partnerType: string | null) => {
    switch (partnerType) {
      case 'Location Partner':
        return <Building className="w-4 h-4" />
      case 'Referral Partner':
        return <Users className="w-4 h-4" />
      case 'Channel Partner':
        return <Network className="w-4 h-4" />
      case 'Relationship Partner':
        return <Handshake className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const openPayeeView = (payee: PayeeData, viewType: 'paymentHistory' | 'invoiceHistory' | 'paymentDetails' = 'paymentDetails') => {
    setSelectedPayee(payee)
    setIframeViewType(viewType)
    setShowIframe(true)
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0.00'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  // Filter payees based on selected filter type
  const filteredPayees = (payees || []).filter(payee => {
    if (filterType === 'all') return true
    if (filterType === 'payable') return payee.isPayable
    if (filterType === 'pending') return !payee.isPayable
    if (filterType === 'location') return payee.partnerType === 'Location Partner'
    if (filterType === 'referral') return payee.partnerType === 'Referral Partner'
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Payments & Invoices</h2>
          <p className="text-[#94A3B8] text-sm">Manage partner payments through Tipalti</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-[#0EA5E9] animate-spin" />
          <span className="ml-3 text-[#94A3B8]">Loading payment data...</span>
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
          onClick={loadPayees}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-white rounded-lg hover:bg-[#2D3B5F] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-[#0EA5E9]" />
              <span className="text-[#94A3B8] text-sm">Total Payees</span>
            </div>
            <div className="text-2xl font-bold text-white">{summary.totalPayees || 0}</div>
          </div>
          
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-[#94A3B8] text-sm">Payable</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{summary.payableCount || 0}</div>
          </div>
          
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-[#10F981]" />
              <span className="text-[#94A3B8] text-sm">Total Paid</span>
            </div>
            <div className="text-2xl font-bold text-[#10F981]">{formatCurrency(summary.totalPaid)}</div>
          </div>
          
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-[#94A3B8] text-sm">Pending</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{formatCurrency(summary.totalPending)}</div>
          </div>
        </div>
      )}

      {/* View Type Tabs */}
      <div className="flex gap-1 border-b border-[#2D3B5F]">
        {[
          { id: 'paymentHistory', label: 'Payment History' },
          { id: 'invoiceHistory', label: 'Invoice History' },
          { id: 'paymentDetails', label: 'Payment Details' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#0EA5E9] text-white'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payment History Tab - Shows partner list */}
      {activeTab === 'paymentHistory' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <span className="text-[#94A3B8] text-sm">Filter by type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg px-3 py-2 text-white text-sm min-w-[180px]"
            >
              <option value="all">All Partners ({payees?.length || 0})</option>
              <option value="payable">Payable Only</option>
              <option value="pending">Pending Setup</option>
              <option value="location">Location Partners</option>
              <option value="referral">Referral Partners</option>
            </select>
          </div>

          {/* Partners Table */}
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2D3B5F]">
                  <th className="text-left px-6 py-4 text-[#94A3B8] text-sm font-medium">Partner</th>
                  <th className="text-left px-6 py-4 text-[#94A3B8] text-sm font-medium">Type</th>
                  <th className="text-left px-6 py-4 text-[#94A3B8] text-sm font-medium">Tipalti ID</th>
                  <th className="text-left px-6 py-4 text-[#94A3B8] text-sm font-medium">Status</th>
                  <th className="text-right px-6 py-4 text-[#94A3B8] text-sm font-medium">Total Paid</th>
                  <th className="text-center px-6 py-4 text-[#94A3B8] text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#94A3B8]">
                      {loading ? 'Loading...' : 'No payees found'}
                    </td>
                  </tr>
                ) : (
                  filteredPayees.map((payee) => (
                    <tr 
                      key={payee.payeeId} 
                      className="border-t border-[#2D3B5F] hover:bg-[#0A0F2C]/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">{payee.name || payee.payeeId}</div>
                          <div className="text-[#94A3B8] text-sm">{payee.email || ''}</div>
                          {payee.company && (
                            <div className="text-[#64748B] text-xs">{payee.company}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[#94A3B8]">
                          {getPartnerIcon(payee.partnerType)}
                          <span className="text-sm">{payee.partnerType || 'Partner'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#0EA5E9] font-mono text-sm">{payee.payeeId}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(payee.payeeStatus, payee.isPayable)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[#10F981] font-medium">{formatCurrency(payee.totalPaid)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openPayeeView(payee)}
                            className="flex items-center gap-1 px-3 py-1 text-[#0EA5E9] hover:bg-[#0EA5E9]/10 rounded transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice History Tab - Select a partner to view */}
      {activeTab === 'invoiceHistory' && (
        <div className="space-y-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-[#0EA5E9]" />
              <h3 className="text-white font-medium">Invoice History</h3>
            </div>
            
            {payees.length === 0 ? (
              <div className="text-center py-8 text-[#94A3B8]">
                <Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No partners found. Add partners to view their invoices.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[#94A3B8] text-sm mb-4">Select a partner to view their invoice history:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {payees.map((payee) => (
                    <button
                      key={payee.payeeId}
                      onClick={() => openPayeeView(payee, 'invoiceHistory')}
                      className="flex items-center gap-3 p-4 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg hover:border-[#0EA5E9] transition-colors text-left"
                    >
                      {getPartnerIcon(payee.partnerType)}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{payee.name || payee.payeeId}</div>
                        <div className="text-[#64748B] text-xs">{payee.partnerType}</div>
                      </div>
                      <Eye className="w-4 h-4 text-[#0EA5E9]" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Details Tab - Select a partner to view */}
      {activeTab === 'paymentDetails' && (
        <div className="space-y-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-[#0EA5E9]" />
              <h3 className="text-white font-medium">Payment Details</h3>
            </div>
            
            {payees.length === 0 ? (
              <div className="text-center py-8 text-[#94A3B8]">
                <Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No partners found. Add partners to view their payment details.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[#94A3B8] text-sm mb-4">Select a partner to view/edit their payment details:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {payees.map((payee) => (
                    <button
                      key={payee.payeeId}
                      onClick={() => openPayeeView(payee, 'paymentDetails')}
                      className="flex items-center gap-3 p-4 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg hover:border-[#0EA5E9] transition-colors text-left"
                    >
                      {getPartnerIcon(payee.partnerType)}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{payee.name || payee.payeeId}</div>
                        <div className="text-[#64748B] text-xs flex items-center gap-2">
                          {payee.partnerType}
                          {payee.isPayable && (
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px]">Payable</span>
                          )}
                        </div>
                      </div>
                      <Settings className="w-4 h-4 text-[#94A3B8]" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
        <p className="text-[#94A3B8] text-sm">
          <strong className="text-white">Note:</strong> Payment processing is handled securely by Tipalti. 
          Partners can update payment details, view past payments, and download invoices.
        </p>
      </div>

      {/* Payee Detail Modal with Tipalti iFrame */}
      {showIframe && selectedPayee && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3B5F]">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedPayee.name}</h3>
                <p className="text-[#94A3B8] text-sm">{selectedPayee.payeeId} • {selectedPayee.partnerType}</p>
              </div>
              <button
                onClick={() => setShowIframe(false)}
                className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#2D3B5F] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex gap-1 px-6 py-2 border-b border-[#2D3B5F] bg-[#0A0F2C]">
              {[
                { id: 'paymentHistory', label: 'Payment History', icon: DollarSign },
                { id: 'invoiceHistory', label: 'Invoices', icon: FileText },
                { id: 'paymentDetails', label: 'Payment Details', icon: Settings },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setIframeViewType(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                    iframeViewType === tab.id
                      ? 'bg-[#0EA5E9] text-white'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#2D3B5F]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content - Tipalti iFrame */}
            <div className="p-6 h-[60vh] overflow-auto">
              <TipaltiIFrame
                payeeId={selectedPayee.payeeId}
                viewType={iframeViewType}
                environment="sandbox"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#2D3B5F]">
              <div className="flex items-center gap-4 text-sm">
                {getStatusBadge(selectedPayee.payeeStatus, selectedPayee.isPayable)}
                <span className="text-[#94A3B8]">
                  Total Paid: <span className="text-[#10F981] font-medium">{formatCurrency(selectedPayee.totalPaid)}</span>
                </span>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://hub.sandbox.tipalti.com/payees/${selectedPayee.payeeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#2D3B5F]/80 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Tipalti
                </a>
                <button
                  onClick={() => setShowIframe(false)}
                  className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
