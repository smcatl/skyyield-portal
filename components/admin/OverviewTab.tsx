'use client'

import { useState, useEffect } from 'react'
import { 
  Users, Building2, Wifi, GitBranch, ShoppingBag, Star, 
  Loader2, TrendingUp, RefreshCw, FileText, Download
} from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalVenues: number
  activeVenues: number
  totalDevices: number
  onlineDevices: number
  inPipeline: number
  activePartners: number
  storeProducts: number
  approvedProducts: number
}

interface CryptoPrice {
  symbol: string
  price: number
  change24h: number
}

export default function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([])
  const [cryptoLoading, setCryptoLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchStats()
    fetchCryptoPrices()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/overview')
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCryptoPrices = async () => {
    setCryptoLoading(true)
    try {
      // Try to fetch from your existing crypto API or use defaults
      const res = await fetch('/api/crypto/prices')
      const data = await res.json()
      if (data.prices) {
        setCryptoPrices(data.prices)
      }
    } catch (err) {
      // Default prices if API fails
      setCryptoPrices([
        { symbol: 'HNT', price: 1.48, change24h: 0.64 },
        { symbol: 'XNET', price: 0.008899, change24h: 1.14 },
      ])
    } finally {
      setCryptoLoading(false)
    }
  }

  const refresh = () => {
    fetchStats()
    fetchCryptoPrices()
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Crypto Prices Header */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {cryptoPrices.map((crypto) => (
              <div key={crypto.symbol} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  crypto.symbol === 'HNT' ? 'bg-purple-500' : 'bg-cyan-500'
                }`}>
                  {crypto.symbol[0]}
                </div>
                <div>
                  <span className="text-white font-medium">{crypto.symbol}</span>
                  <span className="text-white ml-2">
                    ${crypto.price < 0.01 ? crypto.price.toFixed(6) : crypto.price.toFixed(2)}
                  </span>
                </div>
                <span className={`text-sm ${crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {crypto.change24h >= 0 ? '↗' : '↘'} {Math.abs(crypto.change24h).toFixed(2)}% 24h
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[#64748B] text-xs">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button onClick={refresh} className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="px-3 py-1.5 bg-[#2D3B5F] text-white text-sm rounded-lg hover:bg-[#3D4B6F]">
              Details
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#2D3B5F] text-white text-sm rounded-lg hover:bg-[#3D4B6F]">
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Users */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-[#94A3B8] text-sm">Total Users</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</div>
        </div>

        {/* Active Users */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-[#94A3B8] text-sm">Active Users</span>
          </div>
          <div className="text-3xl font-bold text-green-400">{stats?.activeUsers || 0}</div>
        </div>

        {/* In Pipeline */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-[#94A3B8] text-sm">In Pipeline</span>
          </div>
          <div className="text-3xl font-bold text-yellow-400">{stats?.inPipeline || 0}</div>
        </div>

        {/* Total Venues */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-[#94A3B8] text-sm">Total Venues</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.totalVenues || 0}</div>
          <div className="text-[#64748B] text-xs mt-1">{stats?.activeVenues || 0} active</div>
        </div>

        {/* Total Devices */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-[#94A3B8] text-sm">Total Devices</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.totalDevices || 0}</div>
          <div className="text-[#64748B] text-xs mt-1">{stats?.onlineDevices || 0} online</div>
        </div>

        {/* Store Products */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[#94A3B8] text-sm">Store Products</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400">{stats?.storeProducts || 0}</div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Manage Users Card */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold">Manage Users</h3>
          </div>
          <p className="text-[#64748B] text-sm mb-4">Approve, reject, and manage user accounts</p>
        </div>

        {/* Store Products Card */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold">Store Products</h3>
          </div>
          <p className="text-[#64748B] text-sm mb-2">Manage products synced with Stripe</p>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
            ✓ {stats?.storeProducts || 0} products
          </span>
        </div>

        {/* Approved Products Card */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-white font-semibold">Approved Products</h3>
          </div>
          <p className="text-[#64748B] text-sm mb-2">SkyYield approved equipment for operations</p>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
            ★ {stats?.approvedProducts || 0} approved
          </span>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="flex items-center justify-center py-8 text-[#64748B]">
          <TrendingUp className="w-12 h-12 opacity-30" />
        </div>
      </div>
    </div>
  )
}
