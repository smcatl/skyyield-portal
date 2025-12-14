'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Activity, Calendar, Download, Filter, BarChart3,
  PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

interface AnalyticsData {
  earnings: {
    total: number
    thisMonth: number
    lastMonth: number
    trend: number
  }
  referrals: {
    total: number
    thisMonth: number
    converted: number
    pending: number
    conversionRate: number
  }
  dataUsage: {
    totalGB: number
    thisMonthGB: number
    trend: number
  }
  topPerformers: {
    name: string
    value: number
    type: 'venue' | 'referral'
  }[]
  monthlyData: {
    month: string
    earnings: number
    referrals: number
    dataGB: number
  }[]
}

interface PartnerAnalyticsProps {
  partnerId: string
  partnerType: 'location_partner' | 'referral_partner' | 'channel_partner' | 'contractor'
  showReferrals?: boolean
  showDataUsage?: boolean
}

export default function PartnerAnalytics({
  partnerId,
  partnerType,
  showReferrals = true,
  showDataUsage = true,
}: PartnerAnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [partnerId, period])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setData({
        earnings: {
          total: 4523.50,
          thisMonth: 523.50,
          lastMonth: 467.25,
          trend: 12.03,
        },
        referrals: {
          total: 24,
          thisMonth: 5,
          converted: 18,
          pending: 6,
          conversionRate: 75,
        },
        dataUsage: {
          totalGB: 2456.8,
          thisMonthGB: 312.5,
          trend: 8.5,
        },
        topPerformers: [
          { name: 'Downtown Coffee Shop', value: 156.20, type: 'venue' },
          { name: 'Main St Restaurant', value: 98.75, type: 'venue' },
          { name: 'Airport Lounge', value: 87.50, type: 'venue' },
          { name: 'John Smith', value: 150.00, type: 'referral' },
          { name: 'Jane Doe', value: 100.00, type: 'referral' },
        ],
        monthlyData: [
          { month: 'Jul', earnings: 312.50, referrals: 3, dataGB: 245.2 },
          { month: 'Aug', earnings: 387.25, referrals: 4, dataGB: 287.8 },
          { month: 'Sep', earnings: 425.00, referrals: 2, dataGB: 302.1 },
          { month: 'Oct', earnings: 467.25, referrals: 5, dataGB: 289.5 },
          { month: 'Nov', earnings: 489.50, referrals: 3, dataGB: 315.4 },
          { month: 'Dec', earnings: 523.50, referrals: 5, dataGB: 312.5 },
        ],
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    // TODO: Implement CSV export
    alert('Export functionality coming soon!')
  }

  if (loading || !data) {
    return (
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  const maxEarnings = Math.max(...data.monthlyData.map(d => d.earnings))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Analytics Dashboard</h2>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-[#94A3B8] hover:text-white hover:border-[#0EA5E9] transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              data.earnings.trend >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {data.earnings.trend >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {Math.abs(data.earnings.trend)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-white">${data.earnings.thisMonth.toLocaleString()}</div>
          <div className="text-[#64748B] text-sm">This month</div>
          <div className="text-[#94A3B8] text-xs mt-2">
            Total: ${data.earnings.total.toLocaleString()}
          </div>
        </div>

        {/* Referrals */}
        {showReferrals && (
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-sm text-[#0EA5E9]">
                {data.referrals.conversionRate}% conv.
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{data.referrals.thisMonth}</div>
            <div className="text-[#64748B] text-sm">New referrals</div>
            <div className="text-[#94A3B8] text-xs mt-2">
              {data.referrals.converted} converted · {data.referrals.pending} pending
            </div>
          </div>
        )}

        {/* Data Usage */}
        {showDataUsage && (
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                data.dataUsage.trend >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {data.dataUsage.trend >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(data.dataUsage.trend)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{data.dataUsage.thisMonthGB.toFixed(1)} GB</div>
            <div className="text-[#64748B] text-sm">Data offloaded</div>
            <div className="text-[#94A3B8] text-xs mt-2">
              Total: {data.dataUsage.totalGB.toLocaleString()} GB
            </div>
          </div>
        )}

        {/* Conversion Rate */}
        {showReferrals && (
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#0EA5E9]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{data.referrals.conversionRate}%</div>
            <div className="text-[#64748B] text-sm">Conversion rate</div>
            <div className="text-[#94A3B8] text-xs mt-2">
              {data.referrals.converted} of {data.referrals.total} referrals
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Earnings Chart */}
        <div className="lg:col-span-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">Monthly Earnings</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {data.monthlyData.map((month, i) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-gradient-to-t from-[#0EA5E9] to-[#0EA5E9]/50 rounded-t transition-all hover:from-[#0EA5E9]/80"
                  style={{ height: `${(month.earnings / maxEarnings) * 100}%` }}
                />
                <span className="text-[#64748B] text-xs">{month.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">Top Performers</h3>
          <div className="space-y-3">
            {data.topPerformers.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-gray-400/20 text-gray-400' :
                    i === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-[#2D3B5F] text-[#64748B]'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-white text-sm">{item.name}</div>
                    <div className="text-[#64748B] text-xs capitalize">{item.type}</div>
                  </div>
                </div>
                <div className="text-green-400 font-medium">${item.value.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2D3B5F]">
          <h3 className="text-white font-medium">Monthly Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3B5F]">
                <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Month</th>
                <th className="text-right px-4 py-3 text-[#64748B] text-sm font-medium">Earnings</th>
                {showReferrals && (
                  <th className="text-right px-4 py-3 text-[#64748B] text-sm font-medium">Referrals</th>
                )}
                {showDataUsage && (
                  <th className="text-right px-4 py-3 text-[#64748B] text-sm font-medium">Data (GB)</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.monthlyData.map((month, i) => (
                <tr key={month.month} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                  <td className="px-4 py-3 text-white">{month.month} 2024</td>
                  <td className="px-4 py-3 text-right text-green-400 font-medium">
                    ${month.earnings.toFixed(2)}
                  </td>
                  {showReferrals && (
                    <td className="px-4 py-3 text-right text-[#94A3B8]">{month.referrals}</td>
                  )}
                  {showDataUsage && (
                    <td className="px-4 py-3 text-right text-[#94A3B8]">{month.dataGB.toFixed(1)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
