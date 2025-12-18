'use client'

import { useState, useEffect } from 'react'
import { 
  RefreshCw, ExternalLink, Building, Users, Handshake, Network,
  CheckCircle, Clock, AlertCircle, DollarSign, Eye, X,
  CreditCard, FileText, Settings
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
        setPayees(data.payees)
        setSummary(data.summary)
      } else {
        setError(data.error || 'Failed to load payees')
      }
    } catch (err) {
      setError('Failed to load payment data')
      console.error(err)
    } finally {
      setLoading(false)
    }
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
    }
    
    const config = statusMap[status || ''] || { color: 'bg-gray-500/20 text-gray-400', label: status || 'Unknown' }
    
    return <span className={`px-2 py-1 rounded text-xs ${config.color}`}>{config.label}</span>
  }

  const openPayeeView = (payee: PayeeData) => {
    setSelectedPayee(payee)
    setShowIframe(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
  }

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
            <p className="text-[#94A3B8]">Loading Tipalti data...</p>
            <p className="text-[#64748B] text-sm mt-1">This may take a moment</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Payments & Invoices</h2>
          <p className="text-[#94A3B8] text-sm">Manage partner payments through Tipalti</p>
        </div>
        <div className="bg-[#1A1F3A] border border-red-500/30 rounded-xl p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Error Loading Data</h3>
            <p className="text-[#94A3B8] text-sm mb-4">{error}</p>
            <button
              onClick={loadPayees}
              className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
            >
              Try Again
            </button>
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
        <button
          onClick={loadPayees}
          className="flex items-center gap-2 px-3 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
            <div className="text-[#94A3B8] text-sm">Total Payees</div>
            <div className="text-2xl font-bold text-white">{summary.totalPayees}</div>
            <div className="text-[#64748B] text-xs mt-1">{summary.payableCount} payable</div>
          </div>
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
            <div className="text-[#94A3B8] text-sm">Total Paid</div>
            <div className="text-2xl font-bold text-green-400">{formatCurrency(summary.totalPaid)}</div>
            <div className="text-[#64748B] text-xs mt-1">All time</div>
          </div>
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
            <div className="text-[#94A3B8] text-sm">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">{formatCurrency(summary.totalPending)}</div>
            <div className="text-[#64748B] text-xs mt-1">Awaiting payment</div>
          </div>
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
            <div className="text-[#94A3B8] text-sm">Avg per Payee</div>
            <div className="text-2xl font-bold text-[#0EA5E9]">
              {summary.totalPayees > 0 ? formatCurrency(summary.totalPaid / summary.totalPayees) : '$0'}
            </div>
            <div className="text-[#64748B] text-xs mt-1">Average earnings</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2D3B5F]">
        {[
          { id: 'paymentHistory', label: 'Payment History', icon: DollarSign },
          { id: 'invoiceHistory', label: 'Invoice History', icon: FileText },
          { id: 'paymentDetails', label: 'Payment Details', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === tab.id
              ? 'border-[#0EA5E9] text-white'
              : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payment History Tab */}
      {activeTab === 'paymentHistory' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
          {payees.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No Payees Found</h3>
              <p className="text-[#94A3B8] text-sm">No Tipalti payees have been set up yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2D3B5F]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Payee</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Tipalti ID</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-[#94A3B8]">Total Paid</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Last Payment</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-[#94A3B8]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payees.map(payee => (
                  <tr key={payee.payeeId} className="border-b border-[#2D3B5F]/50 hover:bg-[#2D3B5F]/20">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{payee.name}</p>
                        <p className="text-[#94A3B8] text-sm">{payee.email}</p>
                        {payee.company && <p className="text-[#64748B] text-xs">{payee.company}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-[#0EA5E9] text-sm bg-[#0EA5E9]/10 px-2 py-1 rounded">
                        {payee.payeeId}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-400 font-medium">{formatCurrency(payee.totalPaid)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white">{formatDate(payee.lastPaymentDate)}</p>
                        {payee.lastPaymentAmount && (
                          <p className="text-[#64748B] text-sm">{formatCurrency(payee.lastPaymentAmount)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payee.payeeStatus, payee.isPayable)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openPayeeView(payee)}
                        className="flex items-center gap-1 text-[#0EA5E9] hover:underline text-sm ml-auto"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invoice History Tab */}
      {activeTab === 'invoiceHistory' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
          {payees.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No Invoices Found</h3>
              <p className="text-[#94A3B8] text-sm">No invoices have been created yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2D3B5F]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Payee</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Tipalti ID</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-[#94A3B8]">Pending</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-[#94A3B8]">Invoices</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-[#94A3B8]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payees.map(payee => (
                  <tr key={payee.payeeId} className="border-b border-[#2D3B5F]/50 hover:bg-[#2D3B5F]/20">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{payee.name}</p>
                        <p className="text-[#94A3B8] text-sm">{payee.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-[#0EA5E9] text-sm bg-[#0EA5E9]/10 px-2 py-1 rounded">
                        {payee.payeeId}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={payee.pendingAmount > 0 ? 'text-yellow-400 font-medium' : 'text-[#64748B]'}>
                        {formatCurrency(payee.pendingAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white">{payee.invoices.length}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payee.payeeStatus, payee.isPayable)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openPayeeView(payee)}
                        className="flex items-center gap-1 text-[#0EA5E9] hover:underline text-sm ml-auto"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Payment Details Tab */}
      {activeTab === 'paymentDetails' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
          {payees.length === 0 ? (
            <div className="p-8 text-center">
              <Settings className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No Payees Found</h3>
              <p className="text-[#94A3B8] text-sm">No Tipalti payees have been set up yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2D3B5F]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Payee</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Tipalti ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Payment Method</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Payable</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-[#94A3B8]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payees.map(payee => (
                  <tr key={payee.payeeId} className="border-b border-[#2D3B5F]/50 hover:bg-[#2D3B5F]/20">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{payee.name}</p>
                        <p className="text-[#94A3B8] text-sm">{payee.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-[#0EA5E9] text-sm bg-[#0EA5E9]/10 px-2 py-1 rounded">
                        {payee.payeeId}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{payee.paymentMethod || 'Not Set'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#94A3B8]">{payee.payeeStatus || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {payee.isPayable ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openPayeeView(payee)}
                        className="flex items-center gap-1 text-[#0EA5E9] hover:underline text-sm ml-auto"
                      >
                        <Settings className="w-4 h-4" />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Info Note */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
        <p className="text-[#94A3B8] text-sm">
          <strong className="text-white">Note:</strong> Payment processing is handled securely by Tipalti.
          Click "View" to see detailed payment history, invoices, or manage payment settings for each payee.
        </p>
      </div>

      {/* Tipalti iFrame Modal */}
      {showIframe && selectedPayee && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {activeTab === 'paymentHistory' && 'Payment History'}
                  {activeTab === 'invoiceHistory' && 'Invoices'}
                  {activeTab === 'paymentDetails' && 'Payment Details'}
                </h3>
                <p className="text-[#64748B] text-sm">
                  {selectedPayee.name} • {selectedPayee.payeeId}
                </p>
              </div>
              <button
                onClick={() => setShowIframe(false)}
                className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <TipaltiIFrame
                payeeId={selectedPayee.payeeId}
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
