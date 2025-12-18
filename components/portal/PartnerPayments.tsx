'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  DollarSign, Download, CheckCircle, Clock, AlertCircle,
  CreditCard, Building2, ExternalLink, Calendar, Filter, RefreshCw, X
} from 'lucide-react'
import TipaltiIFrame from '@/components/TipaltiIFrame'

interface Payment {
  refCode: string
  amount: number
  currency: string
  paymentDate: string
  status: string
  paymentMethod: string
}

interface Invoice {
  refCode: string
  amount: number
  currency: string
  invoiceDate: string
  dueDate: string
  status: string
  description: string
}

interface PartnerPaymentsProps {
  partnerId: string
  partnerType: string
}

export default function PartnerPayments({
  partnerId,
  partnerType,
}: PartnerPaymentsProps) {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [tipaltiPayeeId, setTipaltiPayeeId] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payeeDetails, setPayeeDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // View state
  const [activeView, setActiveView] = useState<'overview' | 'history' | 'invoices' | 'settings'>('overview')
  const [showIframe, setShowIframe] = useState(false)
  const [iframeType, setIframeType] = useState<'paymentHistory' | 'invoiceHistory' | 'paymentDetails'>('paymentHistory')

  // Load user's Tipalti payee ID and data
  useEffect(() => {
    loadTipaltiData()
  }, [partnerId, user])

  const loadTipaltiData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // First, get the user's tipalti_payee_id from their user record
      const userRes = await fetch('/api/portal/user-roles')
      const userData = await userRes.json()
      
      // Try to get tipalti_payee_id from different sources
      let payeeId = null
      
      // Check user record first
      if (userData.tipalti_payee_id) {
        payeeId = userData.tipalti_payee_id
      }
      
      // If not found, try to get from partner record
      if (!payeeId) {
        const partnerRes = await fetch(`/api/portal/partner-data?partnerType=${partnerType}&partnerId=${partnerId}`)
        const partnerData = await partnerRes.json()
        payeeId = partnerData.tipalti_payee_id
      }
      
      if (!payeeId) {
        setError('No Tipalti account linked. Please contact support to set up your payment account.')
        setLoading(false)
        return
      }
      
      setTipaltiPayeeId(payeeId)
      
      // Fetch payee details from Tipalti
      const detailsRes = await fetch(`/api/tipalti?action=payee&payeeId=${payeeId}`)
      const detailsData = await detailsRes.json()
      if (detailsData.success !== false) {
        setPayeeDetails(detailsData.data || detailsData)
      }
      
      // Fetch payment history
      const paymentsRes = await fetch(`/api/tipalti?action=payments&payeeId=${payeeId}`)
      const paymentsData = await paymentsRes.json()
      if (paymentsData.success !== false && paymentsData.payments) {
        setPayments(paymentsData.payments)
      }
      
      // Fetch invoices
      const invoicesRes = await fetch(`/api/tipalti?action=invoices&payeeId=${payeeId}`)
      const invoicesData = await invoicesRes.json()
      if (invoicesData.success !== false && invoicesData.invoices) {
        setInvoices(invoicesData.invoices)
      }
      
    } catch (err) {
      console.error('Error loading Tipalti data:', err)
      setError('Failed to load payment information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'paid' || s === 'completed') return <CheckCircle className="w-4 h-4 text-green-400" />
    if (s === 'processing' || s === 'pending') return <Clock className="w-4 h-4 text-yellow-400" />
    if (s === 'failed' || s === 'rejected') return <AlertCircle className="w-4 h-4 text-red-400" />
    return <Clock className="w-4 h-4 text-gray-400" />
  }

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'paid' || s === 'completed') return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (s === 'processing' || s === 'pending') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    if (s === 'failed' || s === 'rejected') return 'bg-red-500/20 text-red-400 border-red-500/30'
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const openTipaltiIframe = (type: 'paymentHistory' | 'invoiceHistory' | 'paymentDetails') => {
    setIframeType(type)
    setShowIframe(true)
  }

  // Calculate summary stats from real data
  const totalPaid = payments.filter(p => p.status?.toLowerCase() === 'paid' || p.status?.toLowerCase() === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const pendingInvoices = invoices.filter(i => i.status?.toLowerCase() === 'pending' || i.status?.toLowerCase() === 'approved')
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + (i.amount || 0), 0)

  if (loading) {
    return (
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0EA5E9] mx-auto mb-3" />
          <p className="text-[#94A3B8]">Loading payment information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">Payment Account Setup Required</h3>
          <p className="text-[#94A3B8] text-sm mb-6">{error}</p>
          <a
            href="mailto:support@skyyield.io?subject=Tipalti Payment Setup"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
          >
            Contact Support
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500/20 to-[#0EA5E9]/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-[#94A3B8] text-sm mb-1">Pending Payout</div>
          <div className="text-3xl font-bold text-green-400">${pendingAmount.toFixed(2)}</div>
          <div className="text-[#64748B] text-sm mt-2">
            {pendingInvoices.length} pending invoice{pendingInvoices.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <div className="text-[#94A3B8] text-sm mb-1">Total Received</div>
          <div className="text-3xl font-bold text-white">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="text-[#64748B] text-sm mt-2">
            {payments.filter(p => p.status?.toLowerCase() === 'paid').length} payments
          </div>
        </div>

        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <div className="text-[#94A3B8] text-sm mb-1">Payment Method</div>
          <div className="text-xl font-bold text-[#0EA5E9]">
            {payeeDetails?.paymentMethod || 'Not Set'}
          </div>
          <div className="text-[#64748B] text-sm mt-2">
            {payeeDetails?.isPayable ? '✓ Ready to receive' : 'Setup required'}
          </div>
        </div>

        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <div className="text-[#94A3B8] text-sm mb-1">Payee ID</div>
          <div className="text-lg font-mono text-white truncate">{tipaltiPayeeId}</div>
          <div className="text-[#64748B] text-sm mt-2">
            Status: {payeeDetails?.payeeStatus || 'Active'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Portal</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => openTipaltiIframe('paymentHistory')}
            className="flex items-center gap-3 p-4 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F] transition-colors text-left"
          >
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-white font-medium">Payment History</div>
              <div className="text-[#64748B] text-sm">View all past payments</div>
            </div>
          </button>

          <button
            onClick={() => openTipaltiIframe('invoiceHistory')}
            className="flex items-center gap-3 p-4 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F] transition-colors text-left"
          >
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-white font-medium">Invoices</div>
              <div className="text-[#64748B] text-sm">View pending & paid invoices</div>
            </div>
          </button>

          <button
            onClick={() => openTipaltiIframe('paymentDetails')}
            className="flex items-center gap-3 p-4 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F] transition-colors text-left"
          >
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-white font-medium">Payment Settings</div>
              <div className="text-[#64748B] text-sm">Update bank/payment info</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Payments Table */}
      {payments.length > 0 && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Payments</h3>
            <button
              onClick={() => openTipaltiIframe('paymentHistory')}
              className="text-[#0EA5E9] text-sm hover:underline flex items-center gap-1"
            >
              View All <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2D3B5F]">
                  <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Reference</th>
                  <th className="text-right px-4 py-3 text-[#64748B] text-sm font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Method</th>
                  <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map((payment, idx) => (
                  <tr key={idx} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                    <td className="px-4 py-3 text-white">
                      {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8] font-mono text-sm">{payment.refCode || '-'}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-medium">
                      ${(payment.amount || 0).toFixed(2)} {payment.currency || 'USD'}
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8]">{payment.paymentMethod || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Invoices */}
      {pendingInvoices.length > 0 && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2D3B5F]">
            <h3 className="text-lg font-semibold text-white">Pending Invoices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2D3B5F]">
                  <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Invoice</th>
                  <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Description</th>
                  <th className="text-right px-4 py-3 text-[#64748B] text-sm font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Due Date</th>
                  <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvoices.map((invoice, idx) => (
                  <tr key={idx} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                    <td className="px-4 py-3 text-white font-mono text-sm">{invoice.refCode}</td>
                    <td className="px-4 py-3 text-[#94A3B8]">{invoice.description || '-'}</td>
                    <td className="px-4 py-3 text-right text-[#0EA5E9] font-medium">
                      ${(invoice.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8]">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {invoice.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data State */}
      {payments.length === 0 && invoices.length === 0 && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
          <DollarSign className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No Payment History Yet</h3>
          <p className="text-[#94A3B8] text-sm mb-4">
            Once you start earning, your payments will appear here.
          </p>
          <button
            onClick={() => openTipaltiIframe('paymentDetails')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Set Up Payment Method
          </button>
        </div>
      )}

      {/* Tipalti iFrame Modal */}
      {showIframe && tipaltiPayeeId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {iframeType === 'paymentHistory' && 'Payment History'}
                {iframeType === 'invoiceHistory' && 'Invoices'}
                {iframeType === 'paymentDetails' && 'Payment Settings'}
              </h3>
              <button
                onClick={() => setShowIframe(false)}
                className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <TipaltiIFrame
                payeeId={tipaltiPayeeId}
                viewType={iframeType}
                environment="production"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
