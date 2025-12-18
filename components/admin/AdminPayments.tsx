'use client'

import { useState, useEffect } from 'react'
import { 
  RefreshCw, ExternalLink, Building, Users, Handshake, Network,
  CheckCircle, Clock, AlertCircle, DollarSign, Eye, X,
  FileText, CreditCard, Calendar, Mail, Phone
} from 'lucide-react'

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
  payments: {
    refCode: string
    amount: number
    status: string
    paidAt: string | null
  }[]
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
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadPayees()
  }, [])

  const loadPayees = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/payments')
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
        setSummary({ totalPayees: 0, totalPaid: 0, totalPending: 0, payableCount: 0 })
      }
    } catch (err) {
      setError('Failed to load payment data')
      setPayees([])
      setSummary({ totalPayees: 0, totalPaid: 0, totalPending: 0, payableCount: 0 })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { color: string, label: string }> = {
      'Active': { color: 'bg-green-500/20 text-green-400', label: 'Active' },
      'Pending': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
      'Invited': { color: 'bg-purple-500/20 text-purple-400', label: 'Invited' },
      'Suspended': { color: 'bg-red-500/20 text-red-400', label: 'Suspended' },
    }
    
    const config = statusMap[status || ''] || { color: 'bg-green-500/20 text-green-400', label: status || 'Active' }
    return <span className={`px-2 py-1 rounded text-xs ${config.color}`}>{config.label}</span>
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, label: string }> = {
      'Paid': { color: 'bg-green-500/20 text-green-400', label: 'Paid' },
      'paid': { color: 'bg-green-500/20 text-green-400', label: 'Paid' },
      'Completed': { color: 'bg-green-500/20 text-green-400', label: 'Paid' },
      'Pending': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
      'pending': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
      'Deferred': { color: 'bg-blue-500/20 text-blue-400', label: 'Deferred' },
      'Failed': { color: 'bg-red-500/20 text-red-400', label: 'Failed' },
    }
    
    const config = statusMap[status] || { color: 'bg-gray-500/20 text-gray-400', label: status }
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
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return '—'
    }
  }

  // Filter payees
  const filteredPayees = (payees || []).filter(payee => {
    if (filterType === 'all') return true
    if (filterType === 'payable') return payee.isPayable
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
            <div className="text-2xl font-bold text-white">{summary.totalPayees}</div>
          </div>
          
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-[#94A3B8] text-sm">Payable</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{summary.payableCount}</div>
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
                  No payees found
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
                      <div className="text-white font-medium">{payee.name}</div>
                      <div className="text-[#94A3B8] text-sm">{payee.email}</div>
                      {payee.company && (
                        <div className="text-[#64748B] text-xs">{payee.company}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[#94A3B8]">
                      {getPartnerIcon(payee.partnerType)}
                      <span className="text-sm">{payee.partnerType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#0EA5E9] font-mono text-sm">{payee.payeeId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(payee.payeeStatus)}
                      {payee.isPayable && (
                        <span className="px-2 py-1 bg-[#10F981]/20 text-[#10F981] rounded text-xs">Payable</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[#10F981] font-medium">{formatCurrency(payee.totalPaid)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => setSelectedPayee(payee)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[#0EA5E9] hover:bg-[#0EA5E9]/10 rounded transition-colors text-sm"
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

      {/* Note */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
        <p className="text-[#94A3B8] text-sm">
          <strong className="text-white">Note:</strong> Payment processing is handled securely by Tipalti. 
          Partners can update payment details, view past payments, and download invoices.
        </p>
      </div>

      {/* Payee Detail Modal - No iFrame, just data */}
      {selectedPayee && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3B5F] shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center">
                  {getPartnerIcon(selectedPayee.partnerType)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedPayee.name}</h3>
                  <p className="text-[#94A3B8] text-sm">{selectedPayee.partnerType}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayee(null)}
                className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#2D3B5F] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#94A3B8] text-sm mb-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <div className="text-white">{selectedPayee.email}</div>
                </div>
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#94A3B8] text-sm mb-1">
                    <CreditCard className="w-4 h-4" />
                    Tipalti ID
                  </div>
                  <div className="text-[#0EA5E9] font-mono">{selectedPayee.payeeId}</div>
                </div>
              </div>

              {selectedPayee.company && (
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#94A3B8] text-sm mb-1">
                    <Building className="w-4 h-4" />
                    Company / Venue
                  </div>
                  <div className="text-white">{selectedPayee.company}</div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0A0F2C] rounded-lg p-4 text-center">
                  <div className="text-[#94A3B8] text-sm mb-1">Total Paid</div>
                  <div className="text-xl font-bold text-[#10F981]">{formatCurrency(selectedPayee.totalPaid)}</div>
                </div>
                <div className="bg-[#0A0F2C] rounded-lg p-4 text-center">
                  <div className="text-[#94A3B8] text-sm mb-1">Pending</div>
                  <div className="text-xl font-bold text-yellow-400">{formatCurrency(selectedPayee.pendingAmount)}</div>
                </div>
                <div className="bg-[#0A0F2C] rounded-lg p-4 text-center">
                  <div className="text-[#94A3B8] text-sm mb-1">Status</div>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    {getStatusBadge(selectedPayee.payeeStatus)}
                    {selectedPayee.isPayable && (
                      <span className="px-2 py-1 bg-[#10F981]/20 text-[#10F981] rounded text-xs">Payable</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0EA5E9]" />
                  Payment History
                </h4>
                {selectedPayee.payments && selectedPayee.payments.length > 0 ? (
                  <div className="bg-[#0A0F2C] rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#2D3B5F]">
                          <th className="text-left px-4 py-3 text-[#94A3B8] text-xs font-medium">Date</th>
                          <th className="text-right px-4 py-3 text-[#94A3B8] text-xs font-medium">Amount</th>
                          <th className="text-center px-4 py-3 text-[#94A3B8] text-xs font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPayee.payments.map((payment, idx) => (
                          <tr key={idx} className="border-t border-[#2D3B5F]/50">
                            <td className="px-4 py-3 text-white text-sm">
                              {formatDate(payment.paidAt)}
                            </td>
                            <td className="px-4 py-3 text-right text-[#10F981] font-medium text-sm">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {getPaymentStatusBadge(payment.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-[#0A0F2C] rounded-lg p-6 text-center text-[#94A3B8]">
                    No payment history available
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#2D3B5F] bg-[#0A0F2C] shrink-0">
              <div className="text-[#94A3B8] text-sm">
                Payment Method: <span className="text-white">{selectedPayee.paymentMethod || 'ACH'}</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://hub.sandbox.tipalti.com/payees/${selectedPayee.payeeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Manage in Tipalti
                </a>
                <button
                  onClick={() => setSelectedPayee(null)}
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
