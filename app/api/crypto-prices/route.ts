import { NextResponse } from 'next/server'

// CoinGecko IDs for our tokens
const TOKENS = {
  HNT: 'helium',
  XNET: 'xnet-mobile-2'
}

interface PriceData {
  symbol: string
  name: string
  currentPrice: number
  price24hAgo: number
  change24h: number
  change24hPercent: number
  avg30d: number
  high30d: number
  low30d: number
  lastUpdated: string
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

// Cache prices for 5 minutes to avoid rate limits
let cachedData: CryptoResponse | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000

async function fetchTokenPrices(): Promise<CryptoResponse> {
  const now = Date.now()
  
  if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedData
  }

  try {
    const [hntData, xnetData] = await Promise.all([
      fetch30DayData(TOKENS.HNT, 'HNT', 'Helium'),
      fetch30DayData(TOKENS.XNET, 'XNET', 'XNET Mobile')
    ])

    const response: CryptoResponse = {
      success: true,
      data: {
        HNT: hntData,
        XNET: xnetData
      },
      timestamp: new Date().toISOString()
    }

    cachedData = response
    cacheTimestamp = now

    return response
  } catch (error) {
    console.error('Error fetching crypto prices:', error)
    
    if (cachedData) {
      return {
        ...cachedData,
        error: 'Using cached data - API temporarily unavailable'
      }
    }

    return {
      success: false,
      data: {
        HNT: createEmptyPriceData('HNT', 'Helium'),
        XNET: createEmptyPriceData('XNET', 'XNET Mobile')
      },
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch price data'
    }
  }
}

async function fetch30DayData(coinId: string, symbol: string, name: string): Promise<PriceData> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    const prices = data.prices as [number, number][]

    if (!prices || prices.length === 0) {
      return createEmptyPriceData(symbol, name)
    }

    const currentPrice = prices[prices.length - 1][1]
    const price24hAgo = prices.length > 1 ? prices[prices.length - 2][1] : currentPrice
    const change24h = currentPrice - price24hAgo
    const change24hPercent = price24hAgo > 0 ? (change24h / price24hAgo) * 100 : 0

    const priceValues = prices.map(p => p[1])
    const avg30d = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length
    const high30d = Math.max(...priceValues)
    const low30d = Math.min(...priceValues)

    return {
      symbol,
      name,
      currentPrice,
      price24hAgo,
      change24h,
      change24hPercent,
      avg30d,
      high30d,
      low30d,
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error(`Error fetching ${symbol} data:`, error)
    return createEmptyPriceData(symbol, name)
  }
}

function createEmptyPriceData(symbol: string, name: string): PriceData {
  return {
    symbol,
    name,
    currentPrice: 0,
    price24hAgo: 0,
    change24h: 0,
    change24hPercent: 0,
    avg30d: 0,
    high30d: 0,
    low30d: 0,
    lastUpdated: new Date().toISOString()
  }
}

export async function GET() {
  const data = await fetchTokenPrices()
  return NextResponse.json(data)
}

export async function POST() {
  cachedData = null
  cacheTimestamp = 0
  
  const data = await fetchTokenPrices()
  return NextResponse.json(data)
}