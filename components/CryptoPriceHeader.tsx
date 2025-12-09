'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, Download } from 'lucide-react'

interface PriceData {
  symbol: string
  name: string
  currentPrice: number
  change24hPercent: number
  avg30d: number
  high30d: number
  low30d: number
}

interface CryptoResponse {
  success: boolean
  data: {
    HNT: PriceData
    XNET: PriceData
  }
  timestamp: string
  error?: string
}

export default function CryptoPriceHeader() {
  const [data, setData] = useState<CryptoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const fetchPrices = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true)
      
      const response = await fetch('/api/crypto-prices', {
        method: forceRefresh ? 'POST' : 'GET'
      })
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching prices:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(() => fetchPrices(), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleExport = () => {
    window.open('/api/crypto-prices/export', '_blank')
  }

  const formatPrice = (price: number) => {
    if (price === 0) return '$0.00'
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-6 w-24 bg-[#2D3B5F] rounded"></div>
            <div className="h-6 w-24 bg-[#2D3B5F] rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!data?.success || !data.data) {
    return (
      <div className="bg-[#1A1F3A] border border-red-500/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-red-400 text-sm">Failed to load prices</span>
          <button
            onClick={() => fetchPrices(true)}
            className="text-cyan-400 hover:text-cyan-300 p-1"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  const { HNT, XNET } = data.data

  return (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Token Prices */}
          <div className="flex items-center gap-6 flex-wrap">
            <TokenPrice token={HNT} formatPrice={formatPrice} formatPercent={formatPercent} />
            <div className="h-8 w-px bg-[#2D3B5F] hidden sm:block"></div>
            <TokenPrice token={XNET} formatPrice={formatPrice} formatPercent={formatPercent} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-[#0A0F2C] border border-[#2D3B5F] hover:border-cyan-500/50 transition-colors"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
            
            <button
              onClick={handleExport}
              className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-[#0A0F2C] border border-[#2D3B5F] hover:border-green-500/50 transition-colors flex items-center gap-1.5"
              title="Export to Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            
            <button
              onClick={() => fetchPrices(true)}
              disabled={refreshing}
              className="text-gray-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-[#0A0F2C] transition-colors disabled:opacity-50"
              title="Refresh prices"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="mt-2 text-[10px] text-gray-500">
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-[#2D3B5F] p-4 bg-[#0A0F2C]/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TokenDetails token={HNT} formatPrice={formatPrice} />
            <TokenDetails token={XNET} formatPrice={formatPrice} />
          </div>
        </div>
      )}
    </div>
  )
}

function TokenPrice({ 
  token, 
  formatPrice, 
  formatPercent 
}: { 
  token: PriceData
  formatPrice: (n: number) => string
  formatPercent: (n: number) => string 
}) {
  const isPositive = token.change24hPercent >= 0

  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
        token.symbol === 'HNT' 
          ? 'bg-gradient-to-br from-purple-500 to-blue-500' 
          : 'bg-gradient-to-br from-cyan-500 to-green-500'
      }`}>
        {token.symbol.charAt(0)}
      </div>
      
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{token.symbol}</span>
          <span className="text-lg font-bold text-white">{formatPrice(token.currentPrice)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-green-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-400" />
          )}
          <span className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(token.change24hPercent)}
          </span>
          <span className="text-xs text-gray-500">24h</span>
        </div>
      </div>
    </div>
  )
}

function TokenDetails({ 
  token, 
  formatPrice 
}: { 
  token: PriceData
  formatPrice: (n: number) => string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
          token.symbol === 'HNT' 
            ? 'bg-gradient-to-br from-purple-500 to-blue-500' 
            : 'bg-gradient-to-br from-cyan-500 to-green-500'
        }`}>
          {token.symbol.charAt(0)}
        </div>
        <span className="font-semibold text-white">{token.name} ({token.symbol})</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-500 text-xs">Current Price</div>
          <div className="text-white font-medium">{formatPrice(token.currentPrice)}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">30-Day Average</div>
          <div className="text-cyan-400 font-medium">{formatPrice(token.avg30d)}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">30-Day High</div>
          <div className="text-green-400 font-medium">{formatPrice(token.high30d)}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">30-Day Low</div>
          <div className="text-red-400 font-medium">{formatPrice(token.low30d)}</div>
        </div>
      </div>
    </div>
  )
}