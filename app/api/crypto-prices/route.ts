import { NextResponse } from 'next/server'

const TOKENS = {
  HNT: 'helium',
  XNET: 'xnet-mobile-2'
}

const API_KEY = process.env.COINGECKO_API_KEY || ''

let cache: { data: unknown; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  // Return cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json(cache.data)
  }

  try {
    const [hntData, xnetData] = await Promise.all([
      fetchTokenData(TOKENS.HNT, 'HNT', 'Helium'),
      fetchTokenData(TOKENS.XNET, 'XNET', 'XNET Mobile')
    ])

    const response = {
      success: true,
      data: {
        HNT: hntData,
        XNET: xnetData
      },
      timestamp: new Date().toISOString()
    }

    // Update cache
    cache = { data: response, timestamp: Date.now() }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching crypto prices:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch price data' },
      { status: 500 }
    )
  }
}

// POST to force refresh cache
export async function POST() {
  cache = null
  return GET()
}

async function fetchTokenData(coinId: string, symbol: string, name: string) {
  try {
    // Use the demo API key
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily&x_cg_demo_api_key=${API_KEY}`
    
    const response = await fetch(url, {
      headers: { 
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      console.error(`CoinGecko API error for ${coinId}: ${response.status}`)
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
    const change24hPercent = price24hAgo !== 0 ? (change24h / price24hAgo) * 100 : 0

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
    console.error(`Error fetching ${coinId}:`, error)
    return createEmptyPriceData(symbol, name)
  }
}

function createEmptyPriceData(symbol: string, name: string) {
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