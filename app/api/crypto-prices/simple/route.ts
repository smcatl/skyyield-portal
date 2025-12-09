import { NextResponse } from 'next/server'

const TOKENS = {
  HNT: 'helium',
  XNET: 'xnet-mobile-2'
}

const API_KEY = process.env.COINGECKO_API_KEY || ''

export async function GET() {
  try {
    const [hntData, xnetData] = await Promise.all([
      fetchTokenData(TOKENS.HNT),
      fetchTokenData(TOKENS.XNET)
    ])

    const response = {
      date: new Date().toISOString().split('T')[0],
      hnt_current: hntData.currentPrice,
      hnt_30d_avg: hntData.avg30d,
      hnt_30d_high: hntData.high30d,
      hnt_30d_low: hntData.low30d,
      xnet_current: xnetData.currentPrice,
      xnet_30d_avg: xnetData.avg30d,
      xnet_30d_high: xnetData.high30d,
      xnet_30d_low: xnetData.low30d,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching crypto prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    )
  }
}

async function fetchTokenData(coinId: string) {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily&x_cg_demo_api_key=${API_KEY}`
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    const prices = data.prices as [number, number][]

    if (!prices || prices.length === 0) {
      return { currentPrice: 0, avg30d: 0, high30d: 0, low30d: 0 }
    }

    const currentPrice = prices[prices.length - 1][1]
    const priceValues = prices.map(p => p[1])
    const avg30d = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length
    const high30d = Math.max(...priceValues)
    const low30d = Math.min(...priceValues)

    return { currentPrice, avg30d, high30d, low30d }
  } catch (error) {
    console.error(`Error fetching ${coinId}:`, error)
    return { currentPrice: 0, avg30d: 0, high30d: 0, low30d: 0 }
  }
}