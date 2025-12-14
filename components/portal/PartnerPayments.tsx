'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, Download, CheckCircle, Clock, AlertCircle,
  CreditCard, Building2, ExternalLink, Calendar, Filter
} from 'lucide-react'
import TipaltiIFrame from '@/components/TipaltiIFrame'

interface Payment {
  id: string
  date: string
  amount: number
  status: 'pending' | 'processing' | 'paid' | 'failed'
  method: string
  referenceId: string
  periodStart: string
  periodEnd: string
}

interface PaymentSummary {
  pendingAmount: number
  nextPayoutDate: string
  lifetimeEarnings: number
  ytdEarnings: number
  lastPaymentAmount: number
  lastPaymentDate: string
}

interface PartnerPaymentsProps {
  partnerId: string
  partnerType: string
  tipaltiPayeeId?: string
}

export default function PartnerPayments({
  partnerId,
  partnerType,
  tipaltiPayeeId,
}: PartnerPaymentsProps) {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [showTipalti, setShowTipalti] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('2024')

  useEffect(() => {
    loadPayments()
  }, [partnerId, yearFilter])

  const loadPayments = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setSummary({
        pendingAmount: 523.50,
        nextPayoutDate: '2025-01-01',
        lifetimeEarnings: 4523.50,
        ytdEarnings: 3847.25,
        lastPaymentAmount: 489.50,
        lastPaymentDate: '2024-12-01',
      })

      setPayments([
        { id: '1', date: '2024-12-01', amount: 489.50, status: 'paid', method: 'ACH', referenceId: 'PAY-2024-1201', periodStart: '2024-11-01', periodEnd: '2024-11-30' },
        { id: '2', date: '2024-11-01', amount: 467.25, status: 'paid', method: 'ACH', referenceId: 'PAY-2024-1101', periodStart: '2024-10-01', periodEnd: '2024-10-31' },
        { id: '3', date: '2024-10-01', amount: 425.00, status: 'paid', method: 'ACH', referenceId: 'PAY-2024-1001', periodStart: '2024-09-01', periodEnd: '2024-09-30' },
        { id: '4', date: '2024-09-01', amount: 387.25, status: 'paid', method: 'ACH', referenceId: 'PAY-2024-0901', periodStart: '2024-08-01', periodEnd: '2024-08-31' },
        { id: '5', date: '2024-08-01', amount: 312.50, status: 'paid', method: 'ACH', referenceId: 'PAY-2024-0801', periodStart: '2024-07-01', periodEnd: '2024-07-31' },
      ])
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'processing': return <Clock className="w-4 h-4 text-blue-400" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const filteredPayments = payments.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const exportPayments = () => {
    const headers = ['Date', 'Amount', 'Status', 'Method', 'Reference', 'Period']
    const rows = filteredPayments.map(p => [
      new Date(p.date).toLocaleDateString(),
      p.amount.toFixed(2),
      p.status,
      p.method,
      p.referenceId,
      `${new Date(p.periodStart).toLocaleDateString()} - ${new Date(p.periodEnd).toLocaleDateString()}`,
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${yearFilter}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500/20 to-[#0EA5E9]/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-[#94A3B8] text-sm mb-1">Pending Payout</div>
          <div className="text-3xl font-bold text-green-400">${summary?.pendingAmount.toFixed(2)}</div>
          <div className="text-[#64748B] text-sm mt-2">
            Next payout: {summary?.nextPayoutDate ? new Date(summary.nextPayoutDate).toLocaleDateString() : 'TBD'}
          </div>
        </div>

        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <div className="text-[#94A3B8] text-sm mb-1">YTD Earnings</div>
          <div className="text-3xl font-bold text-white">${summary?.ytdEarnings.toLocaleString()}</div>
          <div className="text-[#64748B] text-sm mt-2">
            {new Date().getFullYear()} total
          </div>
        </div>

        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <div className="text-[#94A3B8] text-sm mb-1">Lifetime Earnings</div>
          <div className="text-3xl font-bold text-[#0EA5E9]">${summary?.lifetimeEarnings.toLocaleString()}</div>
          <div className="text-[#64748B] text-sm mt-2">
            All time
          </div>
        </div>

        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <div className="text-[#94A3B8] text-sm mb-1">Last Payment</div>
          <div className="text-3xl font-bold text-white">${summary?.lastPaymentAmount.toFixed(2)}</div>
          <div className="text-[#64748B] text-sm mt-2">
            {summary?.lastPaymentDate ? new Date(summary.lastPaymentDate).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>

      {/* Payment Method Card */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-[#0EA5E9]" />
            </div>
            <div>
              <div className="text-white font-medium">Payment Method</div>
              <div className="text-[#64748B] text-sm">Manage your payout settings via Tipalti</div>
            </div>
          </div>
          <button
            onClick={() => setShowTipalti(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Manage Payment Info
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2D3B5F]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Payment History</h3>
            <div className="flex items-center gap-3">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
              </select>
              <button
                onClick={exportPayments}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0A0F2C] text-[#94A3B8] rounded-lg hover:text-white hover:bg-[#2D3B5F] transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3B5F]">
                <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Date</th>
                <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Period</th>
                <th className="text-right px-4 py-3 text-[#64748B] text-sm font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Method</th>
                <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Reference</th>
                <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#64748B]">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map(payment => (
                  <tr key={payment.id} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                    <td className="px-4 py-3 text-white">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8] text-sm">
                      {new Date(payment.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(payment.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 font-medium">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8]">{payment.method}</td>
                    <td className="px-4 py-3 text-[#64748B] text-sm font-mono">{payment.referenceId}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Documents */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Tax Documents</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#64748B]" />
              <div>
                <div className="text-white">2024 1099-NEC</div>
                <div className="text-[#64748B] text-sm">Available January 2025</div>
              </div>
            </div>
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
              Coming Soon
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#64748B]" />
              <div>
                <div className="text-white">2023 1099-NEC</div>
                <div className="text-[#64748B] text-sm">Non-employee compensation</div>
              </div>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors text-sm">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Tipalti Modal */}
      {showTipalti && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Payment Settings</h3>
              <button
                onClick={() => setShowTipalti(false)}
                className="text-[#64748B] hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4" style={{ height: '600px' }}>
              <TipaltiIFrame payeeId={tipaltiPayeeId || partnerId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
