'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Activity, Calendar, RefreshCw, ChevronDown } from 'lucide-react'

interface AnalyticsData {
  success: boolean
  period: { start: string; end: string; days: string }
  prices: { xnet: { current: number; avg30d: number; high30d: number; low30d: number }; hnt: { current: number; avg30d: number; high30d: number; low30d: number } }
  summary: { totalUsd: number; xnet: { label: string; tokens: number; usd: number; gb: number; sessions: number; users: number; avgUptime: number; rejects: number; breakdown: { poc: number; data: number; bonus: number } }; helium: { label: string; tokens: number; usd: number; rewardableGb: number; dataGb: number; sessions: number; subscribers: number; breakdown: { rewards: number; poc: number } } }
  charts: { byDate: { xnet: any[]; helium: any[] }; byVenue: { xnet: any[]; helium: any[] }; byPartner: { xnet: any[]; helium: any[] } }
}

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showCustomRange, setShowCustomRange] = useState(false)

  useEffect(() => { if (period !== 'custom') fetchAnalytics() }, [period])

  const fetchAnalytics = async (startDate?: string, endDate?: string) => {
    setLoading(true)
    try {
      let url = `/api/admin/analytics?period=${period}`
      if (startDate && endDate) url = `/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`
      const res = await fetch(url)
      const result = await res.json()
      if (result.success) setData(result)
    } catch (err) { console.error('Failed to fetch analytics:', err) }
    finally { setLoading(false) }
  }

  const handleCustomRange = () => {
    if (customStart && customEnd) { setPeriod('custom'); fetchAnalytics(customStart, customEnd); setShowCustomRange(false); setShowPeriodDropdown(false) }
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)
  const formatNumber = (value: number, decimals = 2) => new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
  const periods = [{ value: '7', label: 'Last 7 Days' }, { value: '30', label: 'Last 30 Days' }, { value: '90', label: 'Last 90 Days' }, { value: '365', label: 'Last Year' }, { value: 'custom', label: 'Custom Range' }]
  const getPeriodLabel = () => { if (period === 'custom' && customStart && customEnd) return `${customStart} to ${customEnd}`; return periods.find(p => p.value === period)?.label || 'Last 30 Days' }

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 text-[#0EA5E9] animate-spin" /></div>
  if (!data) return <div className="text-center py-20"><Activity className="w-12 h-12 text-[#64748B] mx-auto mb-4" /><p className="text-[#94A3B8]">No analytics data available</p></div>

  const { summary, prices, charts } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold text-white">Analytics Dashboard</h2><p className="text-[#94A3B8] text-sm">Network earnings and performance metrics</p></div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setShowPeriodDropdown(!showPeriodDropdown)} className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white hover:border-[#0EA5E9]"><Calendar className="w-4 h-4 text-[#64748B]" />{getPeriodLabel()}<ChevronDown className="w-4 h-4 text-[#64748B]" /></button>
            {showPeriodDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg shadow-lg z-10">
                {periods.filter(p => p.value !== 'custom').map(p => <button key={p.value} onClick={() => { setPeriod(p.value); setShowPeriodDropdown(false); setShowCustomRange(false) }} className={`w-full px-4 py-2 text-left text-sm hover:bg-[#2D3B5F] ${period === p.value ? 'text-[#0EA5E9]' : 'text-white'}`}>{p.label}</button>)}
                <button onClick={() => setShowCustomRange(!showCustomRange)} className={`w-full px-4 py-2 text-left text-sm hover:bg-[#2D3B5F] ${period === 'custom' ? 'text-[#0EA5E9]' : 'text-white'}`}>Custom Range</button>
                {showCustomRange && (
                  <div className="p-4 border-t border-[#2D3B5F] space-y-3">
                    <div><label className="text-[#64748B] text-xs">Start Date</label><input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full mt-1 px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded text-white text-sm" /></div>
                    <div><label className="text-[#64748B] text-xs">End Date</label><input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full mt-1 px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded text-white text-sm" /></div>
                    <button onClick={handleCustomRange} disabled={!customStart || !customEnd} className="w-full py-2 bg-[#0EA5E9] text-white rounded text-sm font-medium disabled:opacity-50">Apply</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={() => fetchAnalytics()} className="p-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-[#64748B] hover:text-white"><RefreshCw className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#0EA5E9]/20 to-[#10F981]/20 border border-[#0EA5E9]/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div><p className="text-[#94A3B8] text-sm mb-1">Total Network Earnings</p><p className="text-4xl font-bold text-white">{formatCurrency(summary.totalUsd)}</p><p className="text-[#64748B] text-sm mt-2">{getPeriodLabel()} • Combined SYX + SYH</p></div>
          <div className="w-16 h-16 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center"><DollarSign className="w-8 h-8 text-[#0EA5E9]" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2D3B5F] bg-orange-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center"><span className="text-orange-400 font-bold">SYX</span></div><div><h3 className="text-white font-semibold">SYX Network</h3><p className="text-[#64748B] text-xs">30d Avg: ${formatNumber(prices.xnet.avg30d, 4)}</p></div></div>
              <div className="text-right"><p className="text-2xl font-bold text-orange-400">{formatCurrency(summary.xnet.usd)}</p><p className="text-[#64748B] text-xs">{formatNumber(summary.xnet.tokens, 2)} tokens</p></div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4"><div><p className="text-[#64748B] text-xs">Total GB</p><p className="text-white font-medium">{formatNumber(summary.xnet.gb)} GB</p></div><div><p className="text-[#64748B] text-xs">Sessions</p><p className="text-white font-medium">{summary.xnet.sessions.toLocaleString()}</p></div><div><p className="text-[#64748B] text-xs">Users</p><p className="text-white font-medium">{summary.xnet.users.toLocaleString()}</p></div></div>
            <div className="grid grid-cols-2 gap-4"><div><p className="text-[#64748B] text-xs">Avg Uptime</p><p className="text-white font-medium">{formatNumber(summary.xnet.avgUptime, 1)}%</p></div><div><p className="text-[#64748B] text-xs">Rejects</p><p className="text-white font-medium">{summary.xnet.rejects.toLocaleString()}</p></div></div>
            <div className="pt-3 border-t border-[#2D3B5F]"><p className="text-[#64748B] text-xs mb-2">Rewards Breakdown</p><div className="flex gap-4 text-xs"><span className="text-white">PoC: <span className="text-orange-400">{formatNumber(summary.xnet.breakdown.poc)}</span></span><span className="text-white">Data: <span className="text-orange-400">{formatNumber(summary.xnet.breakdown.data)}</span></span><span className="text-white">Bonus: <span className="text-orange-400">{formatNumber(summary.xnet.breakdown.bonus)}</span></span></div></div>
          </div>
        </div>

        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2D3B5F] bg-purple-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center"><span className="text-purple-400 font-bold">SYH</span></div><div><h3 className="text-white font-semibold">SYH Network</h3><p className="text-[#64748B] text-xs">30d Avg: ${formatNumber(prices.hnt.avg30d, 2)}</p></div></div>
              <div className="text-right"><p className="text-2xl font-bold text-purple-400">{formatCurrency(summary.helium.usd)}</p><p className="text-[#64748B] text-xs">{formatNumber(summary.helium.tokens, 4)} tokens</p></div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4"><div><p className="text-[#64748B] text-xs">Rewardable GB</p><p className="text-white font-medium">{formatNumber(summary.helium.rewardableGb)} GB</p></div><div><p className="text-[#64748B] text-xs">Data GB</p><p className="text-white font-medium">{formatNumber(summary.helium.dataGb)} GB</p></div><div><p className="text-[#64748B] text-xs">Sessions</p><p className="text-white font-medium">{summary.helium.sessions.toLocaleString()}</p></div></div>
            <div className="grid grid-cols-2 gap-4"><div><p className="text-[#64748B] text-xs">Subscribers</p><p className="text-white font-medium">{summary.helium.subscribers.toLocaleString()}</p></div><div><p className="text-[#64748B] text-xs">Total Records</p><p className="text-white font-medium">{charts.byDate.helium.length}</p></div></div>
            <div className="pt-3 border-t border-[#2D3B5F]"><p className="text-[#64748B] text-xs mb-2">Rewards Breakdown</p><div className="flex gap-4 text-xs"><span className="text-white">Rewards: <span className="text-purple-400">{formatNumber(summary.helium.breakdown.rewards, 4)}</span></span><span className="text-white">PoC: <span className="text-purple-400">{formatNumber(summary.helium.breakdown.poc, 4)}</span></span></div></div>
          </div>
        </div>
      </div>

      {(charts.byVenue.xnet.length > 0 || charts.byVenue.helium.length > 0) && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Earnings by Venue</h3>
          <div className="space-y-3">{[...charts.byVenue.xnet, ...charts.byVenue.helium].reduce((acc: any[], item) => { const existing = acc.find(a => a.id === item.id); if (existing) existing.usd += item.usd; else acc.push({ ...item }); return acc }, []).sort((a, b) => b.usd - a.usd).slice(0, 10).map((venue, idx) => (<div key={venue.id} className="flex items-center gap-4"><span className="text-[#64748B] w-6">{idx + 1}.</span><span className="text-white flex-1">{venue.name}</span><span className="text-[#0EA5E9] font-medium">{formatCurrency(venue.usd)}</span><div className="w-32 bg-[#2D3B5F] rounded-full h-2"><div className="bg-gradient-to-r from-[#0EA5E9] to-[#10F981] h-2 rounded-full" style={{ width: `${Math.min((venue.usd / (charts.byVenue.xnet[0]?.usd || 1)) * 100, 100)}%` }} /></div></div>))}</div>
        </div>
      )}

      {(charts.byPartner.xnet.length > 0 || charts.byPartner.helium.length > 0) && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Earnings by Partner</h3>
          <div className="space-y-3">{[...charts.byPartner.xnet, ...charts.byPartner.helium].reduce((acc: any[], item) => { const existing = acc.find(a => a.id === item.id); if (existing) existing.usd += item.usd; else acc.push({ ...item }); return acc }, []).sort((a, b) => b.usd - a.usd).slice(0, 10).map((partner, idx) => (<div key={partner.id} className="flex items-center gap-4"><span className="text-[#64748B] w-6">{idx + 1}.</span><span className="text-white flex-1">{partner.name}</span><span className="text-[#10F981] font-medium">{formatCurrency(partner.usd)}</span><div className="w-32 bg-[#2D3B5F] rounded-full h-2"><div className="bg-gradient-to-r from-[#10F981] to-[#0EA5E9] h-2 rounded-full" style={{ width: `${Math.min((partner.usd / (charts.byPartner.xnet[0]?.usd || 1)) * 100, 100)}%` }} /></div></div>))}</div>
        </div>
      )}

      {summary.totalUsd === 0 && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
          <Activity className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No Earnings Data Yet</h3>
          <p className="text-[#94A3B8] text-sm max-w-md mx-auto">Earnings data will appear here once SYX and SYH data syncs from SharePoint via Power Automate.</p>
        </div>
      )}
    </div>
  )
}
