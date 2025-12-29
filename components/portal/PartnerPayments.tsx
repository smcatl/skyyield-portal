'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, CreditCard, Clock, CheckCircle, AlertCircle, 
  RefreshCw, ArrowDownRight, Wallet, Calendar
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  paymentDate: string
  refCode?: string
}

interface Bill {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: string
  dueDate: string
}

interface PartnerPaymentsProps {
  partnerId: string
  partnerType: string
  tipaltiPayeeId?: string
}

export default function PartnerPayments({ partnerId, partnerType, tipaltiPayeeId }: PartnerPaymentsProps) {
  const [loading, setLoading] = useState(true)
  const [payeeStatus, setPayeeStatus] = useState<string>('unknown')
  const [isPayable, setIsPayable] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'invoices'>('overview')

  useEffect(() => {
    if (tipaltiPayeeId) {
      loadPaymentData()
    } else {
      setLoading(false)
    }
  }, [tipaltiPayeeId])

  const loadPaymentData = async () => {
    if (!tipaltiPayeeId) return
    setLoading(true)
    try {
      const [statusRes, paymentsRes, billsRes] = await Promise.all([
        fetch(`/api/tipalti?action=status&payeeId=${tipaltiPayeeId}`),
        fetch(`/api/tipalti?action=payments&payeeId=${tipaltiPayeeId}`),
        fetch(`/api/tipalti?action=bills&payeeId=${tipaltiPayeeId}`),
      ])
      const [statusData, paymentsData, billsData] = await Promise.all([
        statusRes.json(), paymentsRes.json(), billsRes.json()
      ])
      if (statusData.success !== false) {
        setPayeeStatus(statusData.status || 'unknown')
        setIsPayable(statusData.isPayable || false)
        setPaymentMethod(statusData.paymentMethod || null)
      }
      if (paymentsData.success !== false) setPayments(paymentsData.payments || [])
      if (billsData.success !== false) setBills(billsData.bills || [])
    } catch (err) {
      console.error('Error loading payment data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'paid' || s === 'completed') return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (s === 'processing' || s === 'pending') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    if (s === 'failed' || s === 'rejected') return 'bg-red-500/20 text-red-400 border-red-500/30'
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'paid' || s === 'completed') return <CheckCircle className="w-4 h-4 text-green-400" />
    if (s === 'processing' || s === 'pending') return <Clock className="w-4 h-4 text-yellow-400" />
    if (s === 'failed' || s === 'rejected') return <AlertCircle className="w-4 h-4 text-red-400" />
    return <Clock className="w-4 h-4 text-gray-400" />
  }

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  }

  const totalPaid = payments.filter(p => ['paid', 'completed'].includes(p.status?.toLowerCase())).reduce((sum, p) => sum + (p.amount || 0), 0)
  const pendingAmount = bills.filter(b => b.status?.toLowerCase() === 'pending').reduce((sum, b) => sum + (b.amount || 0), 0)

  if (loading) {
    return (
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-[#0EA5E9] animate-spin" />
          <span className="ml-3 text-[#94A3B8]">Loading payment information...</span>
        </div>
      </div>
    )
  }

  if (!tipaltiPayeeId) {
    return (
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
        <Wallet className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
        <h3 className="text-white font-medium mb-2">Payment Setup Required</h3>
        <p className="text-[#94A3B8] text-sm mb-4">Contact support to complete your payment setup.</p>
        <a href="mailto:support@skyyield.io?subject=Payment Setup Request" className="inline-flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
          <CreditCard className="w-4 h-4" /> Request Payment Setup
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Payment Status</h3>
          <button onClick={loadPaymentData} className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
            <div className="flex items-center gap-2 text-[#64748B] text-sm mb-2"><CheckCircle className="w-4 h-4" />Account Status</div>
            <div className={`text-lg font-semibold capitalize ${isPayable ? 'text-green-400' : 'text-yellow-400'}`}>{isPayable ? 'Active' : payeeStatus}</div>
          </div>
          <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
            <div className="flex items-center gap-2 text-[#64748B] text-sm mb-2"><CreditCard className="w-4 h-4" />Payment Method</div>
            <div className="text-lg font-semibold text-white">{paymentMethod || 'Not Set'}</div>
          </div>
          <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
            <div className="flex items-center gap-2 text-[#64748B] text-sm mb-2"><ArrowDownRight className="w-4 h-4 text-green-400" />Total Received</div>
            <div className="text-lg font-semibold text-green-400">{formatCurrency(totalPaid)}</div>
          </div>
          <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
            <div className="flex items-center gap-2 text-[#64748B] text-sm mb-2"><Clock className="w-4 h-4 text-yellow-400" />Pending</div>
            <div className="text-lg font-semibold text-yellow-400">{formatCurrency(pendingAmount)}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#2D3B5F]">
        {(['overview', 'payments', 'invoices'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-medium capitalize transition-colors ${activeTab === tab ? 'text-[#0EA5E9] border-b-2 border-[#0EA5E9]' : 'text-[#64748B] hover:text-white'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'payments' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2D3B5F]"><h3 className="text-white font-medium">Payment History</h3></div>
          {payments.length === 0 ? (
            <div className="p-8 text-center"><DollarSign className="w-12 h-12 text-[#64748B] mx-auto mb-4" /><p className="text-[#94A3B8]">No payments yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0A0F2C]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[#64748B] text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-[#64748B] text-sm font-medium">Reference</th>
                    <th className="px-4 py-3 text-left text-[#64748B] text-sm font-medium">Amount</th>
                    <th className="px-4 py-3 text-left text-[#64748B] text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3B5F]">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-[#0A0F2C]/50">
                      <td className="px-4 py-3 text-white">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-[#94A3B8]">{payment.refCode || payment.id}</td>
                      <td className="px-4 py-3 text-white font-medium">{formatCurrency(payment.amount, payment.currency)}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>{getStatusIcon(payment.status)}{payment.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2D3B5F]"><h3 className="text-white font-medium">Invoices</h3></div>
          {bills.length === 0 ? (
            <div className="p-8 text-center"><Calendar className="w-12 h-12 text-[#64748B] mx-auto mb-4" /><p className="text-[#94A3B8]">No invoices yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0A0F2C]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[#64748B] text-sm font-medium">Invoice #</th>
                    <th className="px-4 py-3 text-left text-[#64748B] text-sm font-medium">Amount</th>
                    <th className="px-4 py-3 text-left text-[#64748B] text-sm font-medium">Due Date</th>
                    <th className="px-4 py-3 text-left text-[#64748B] text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3B5F]">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-[#0A0F2C]/50">
                      <td className="px-4 py-3 text-white">{bill.invoiceNumber}</td>
                      <td className="px-4 py-3 text-white font-medium">{formatCurrency(bill.amount, bill.currency)}</td>
                      <td className="px-4 py-3 text-[#94A3B8]">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bill.status)}`}>{getStatusIcon(bill.status)}{bill.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">Recent Payments</h3>
            {payments.length === 0 ? <p className="text-[#64748B] text-sm">No recent payments</p> : (
              <div className="space-y-3">
                {payments.slice(0, 5).map(payment => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                    <div>
                      <div className="text-white font-medium">{formatCurrency(payment.amount)}</div>
                      <div className="text-[#64748B] text-xs">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}</div>
                    </div>
                    {getStatusIcon(payment.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">Pending Invoices</h3>
            {bills.filter(b => b.status?.toLowerCase() === 'pending').length === 0 ? <p className="text-[#64748B] text-sm">No pending invoices</p> : (
              <div className="space-y-3">
                {bills.filter(b => b.status?.toLowerCase() === 'pending').slice(0, 5).map(bill => (
                  <div key={bill.id} className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                    <div>
                      <div className="text-white font-medium">{formatCurrency(bill.amount)}</div>
                      <div className="text-[#64748B] text-xs">Due: {new Date(bill.dueDate).toLocaleDateString()}</div>
                    </div>
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
