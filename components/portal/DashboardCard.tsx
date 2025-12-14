'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface DashboardCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  iconBgColor?: string
  trend?: {
    value: number
    label?: string
    isPositiveGood?: boolean
  }
  prefix?: string
  suffix?: string
  loading?: boolean
  onClick?: () => void
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-[#0EA5E9]/20',
  trend,
  prefix = '',
  suffix = '',
  loading = false,
  onClick,
}: DashboardCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return <TrendingUp className="w-4 h-4" />
    if (trend.value < 0) return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getTrendColor = () => {
    if (!trend) return ''
    const isPositive = trend.value > 0
    const isGood = trend.isPositiveGood !== false ? isPositive : !isPositive
    if (trend.value === 0) return 'text-[#64748B]'
    return isGood ? 'text-green-400' : 'text-red-400'
  }

  return (
    <div
      className={`bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 ${
        onClick ? 'cursor-pointer hover:border-[#0EA5E9] transition-colors' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`w-10 h-10 ${iconBgColor} rounded-lg flex items-center justify-center`}>
              {icon}
            </div>
          )}
          <span className="text-[#94A3B8] text-sm">{title}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-9 bg-[#2D3B5F] rounded animate-pulse" />
      ) : (
        <div className="text-3xl font-bold text-white">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
      )}

      {subtitle && (
        <div className="text-[#64748B] text-sm mt-1">{subtitle}</div>
      )}

      {trend?.label && (
        <div className="text-[#64748B] text-xs mt-2">{trend.label}</div>
      )}
    </div>
  )
}

// Pre-configured variants
export function EarningsCard({ 
  earnings, 
  trend,
  period = 'This Month',
  loading 
}: { 
  earnings: number
  trend?: number
  period?: string
  loading?: boolean 
}) {
  return (
    <DashboardCard
      title="Earnings"
      value={earnings}
      prefix="$"
      subtitle={period}
      icon={<span className="text-green-400 text-lg">💰</span>}
      iconBgColor="bg-green-500/20"
      trend={trend ? { value: trend, label: 'vs last period' } : undefined}
      loading={loading}
    />
  )
}

export function DataUsageCard({ 
  gigabytes, 
  trend,
  loading 
}: { 
  gigabytes: number
  trend?: number
  loading?: boolean 
}) {
  return (
    <DashboardCard
      title="Data Usage"
      value={gigabytes.toFixed(1)}
      suffix=" GB"
      subtitle="Total offloaded"
      icon={<span className="text-[#0EA5E9] text-lg">📊</span>}
      iconBgColor="bg-[#0EA5E9]/20"
      trend={trend ? { value: trend } : undefined}
      loading={loading}
    />
  )
}

export function ReferralsCard({ 
  total, 
  pending,
  loading 
}: { 
  total: number
  pending?: number
  loading?: boolean 
}) {
  return (
    <DashboardCard
      title="Referrals"
      value={total}
      subtitle={pending ? `${pending} pending` : undefined}
      icon={<span className="text-purple-400 text-lg">👥</span>}
      iconBgColor="bg-purple-500/20"
      loading={loading}
    />
  )
}

export function VenuesCard({ 
  total, 
  active,
  loading 
}: { 
  total: number
  active?: number
  loading?: boolean 
}) {
  return (
    <DashboardCard
      title="Venues"
      value={total}
      subtitle={active !== undefined ? `${active} active` : undefined}
      icon={<span className="text-cyan-400 text-lg">🏢</span>}
      iconBgColor="bg-cyan-500/20"
      loading={loading}
    />
  )
}

export function JobsCard({ 
  upcoming, 
  completed,
  loading 
}: { 
  upcoming: number
  completed?: number
  loading?: boolean 
}) {
  return (
    <DashboardCard
      title="Upcoming Jobs"
      value={upcoming}
      subtitle={completed !== undefined ? `${completed} completed this month` : undefined}
      icon={<span className="text-orange-400 text-lg">🔧</span>}
      iconBgColor="bg-orange-500/20"
      loading={loading}
    />
  )
}
