'use client'

import { useState } from 'react'
import { Download, Filter, ChevronDown, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react'

interface EarningRecord {
  id: string
  date: string
  description: string
  type: 'commission' | 'referral' | 'bonus' | 'payout'
  amount: number
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  referenceId?: string
}

interface EarningsTableProps {
  earnings: EarningRecord[]
  loading?: boolean
  showExport?: boolean
  showFilters?: boolean
  title?: string
}

export default function EarningsTable({
  earnings,
  loading = false,
  showExport = true,
  showFilters = true,
  title = 'Earnings History',
}: EarningsTableProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'approved': return <Clock className="w-4 h-4 text-blue-400" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-400" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'approved': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'commission': return 'text-[#0EA5E9]'
      case 'referral': return 'text-purple-400'
      case 'bonus': return 'text-green-400'
      case 'payout': return 'text-orange-400'
      default: return 'text-[#94A3B8]'
    }
  }

  const filteredEarnings = earnings.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    return true
  })

  const totals = {
    pending: filteredEarnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
    approved: filteredEarnings.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
    paid: filteredEarnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
  }

  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Type', 'Amount', 'Status', 'Reference']
    const rows = filteredEarnings.map(e => [
      new Date(e.date).toLocaleDateString(),
      e.description,
      e.type,
      e.amount.toFixed(2),
      e.status,
      e.referenceId || '',
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `earnings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#2D3B5F]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {showExport && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0A0F2C] text-[#94A3B8] rounded-lg hover:text-white hover:bg-[#2D3B5F] transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#0A0F2C] rounded-lg p-3">
            <div className="text-yellow-400 text-xs uppercase tracking-wide">Pending</div>
            <div className="text-xl font-bold text-white">${totals.pending.toLocaleString()}</div>
          </div>
          <div className="bg-[#0A0F2C] rounded-lg p-3">
            <div className="text-blue-400 text-xs uppercase tracking-wide">Approved</div>
            <div className="text-xl font-bold text-white">${totals.approved.toLocaleString()}</div>
          </div>
          <div className="bg-[#0A0F2C] rounded-lg p-3">
            <div className="text-green-400 text-xs uppercase tracking-wide">Paid</div>
            <div className="text-xl font-bold text-white">${totals.paid.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
            >
              <option value="all">All Types</option>
              <option value="commission">Commission</option>
              <option value="referral">Referral</option>
              <option value="bonus">Bonus</option>
              <option value="payout">Payout</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2D3B5F]">
              <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Date</th>
              <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Description</th>
              <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Type</th>
              <th className="text-right px-4 py-3 text-[#64748B] text-sm font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#64748B]">
                  Loading earnings...
                </td>
              </tr>
            ) : filteredEarnings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#64748B]">
                  No earnings found
                </td>
              </tr>
            ) : (
              filteredEarnings.map(earning => (
                <tr key={earning.id} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                  <td className="px-4 py-3 text-[#94A3B8] text-sm">
                    {new Date(earning.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white text-sm">{earning.description}</div>
                    {earning.referenceId && (
                      <div className="text-[#64748B] text-xs">Ref: {earning.referenceId}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm capitalize ${getTypeColor(earning.type)}`}>
                      {earning.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-medium ${earning.type === 'payout' ? 'text-orange-400' : 'text-green-400'}`}>
                      {earning.type === 'payout' ? '-' : '+'}${Math.abs(earning.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(earning.status)}`}>
                      {getStatusIcon(earning.status)}
                      {earning.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
