import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    
    const priceResponse = await fetch(`${baseUrl}/api/crypto-prices`)
    const priceData = await priceResponse.json()

    if (!priceData.success) {
      return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 })
    }

    const { HNT, XNET } = priceData.data as { HNT: PriceData, XNET: PriceData }
    const timestamp = new Date().toISOString()

    const workbook = XLSX.utils.book_new()

    // Summary Sheet
    const summaryData = [
      ['SkyYield Crypto Price Report'],
      ['Generated:', timestamp],
      [''],
      ['Token', 'Current Price', '24h Change', '24h Change %', '30-Day Avg', '30-Day High', '30-Day Low'],
      [
        HNT.symbol,
        formatCurrency(HNT.currentPrice),
        formatCurrency(HNT.change24h),
        formatPercent(HNT.change24hPercent),
        formatCurrency(HNT.avg30d),
        formatCurrency(HNT.high30d),
        formatCurrency(HNT.low30d)
      ],
      [
        XNET.symbol,
        formatCurrency(XNET.currentPrice),
        formatCurrency(XNET.change24h),
        formatPercent(XNET.change24hPercent),
        formatCurrency(XNET.avg30d),
        formatCurrency(XNET.high30d),
        formatCurrency(XNET.low30d)
      ],
      [''],
      ['Data Source: CoinGecko API'],
    ]

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    summarySheet['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    ]
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    // Raw Data Sheet (for SharePoint/Power Automate)
    const rawData = [
      ['date', 'hnt_current', 'hnt_30d_avg', 'hnt_30d_high', 'hnt_30d_low', 'xnet_current', 'xnet_30d_avg', 'xnet_30d_high', 'xnet_30d_low'],
      [
        new Date().toISOString().split('T')[0],
        HNT.currentPrice,
        HNT.avg30d,
        HNT.high30d,
        HNT.low30d,
        XNET.currentPrice,
        XNET.avg30d,
        XNET.high30d,
        XNET.low30d
      ],
    ]

    const rawSheet = XLSX.utils.aoa_to_sheet(rawData)
    XLSX.utils.book_append_sheet(workbook, rawSheet, 'RawData')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const filename = `skyyield_crypto_prices_${new Date().toISOString().split('T')[0]}.xlsx`
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating Excel export:', error)
    return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 })
  }
}

function formatCurrency(value: number): string {
  if (value === 0) return '$0.00'
  if (value < 0.01) return `$${value.toFixed(6)}`
  if (value < 1) return `$${value.toFixed(4)}`
  return `$${value.toFixed(2)}`
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}