import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const partnerId = searchParams.get('partnerId')
  const venueId = searchParams.get('venueId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const period = searchParams.get('period') || '30'

  try {
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - parseInt(period) * 24 * 60 * 60 * 1000)

    const { data: priceData } = await supabase.from('coin_prices').select('*').order('date', { ascending: false }).limit(1).single()

    const xnetPrice = priceData?.xnet_30d_avg || 0.011
    const hntPrice = priceData?.hnt_30d_avg || 2.00

    let xnetQuery = supabase.from('xnet_earnings').select('*, devices(device_name, device_type), venues(venue_name, city, state), location_partners(company_legal_name)').gte('date', start.toISOString().split('T')[0]).lte('date', end.toISOString().split('T')[0])
    if (partnerId) xnetQuery = xnetQuery.eq('location_partner_id', partnerId)
    if (venueId) xnetQuery = xnetQuery.eq('venue_id', venueId)
    const { data: xnetData, error: xnetError } = await xnetQuery.order('date', { ascending: false })
    if (xnetError) console.error('XNET query error:', xnetError)

    let heliumQuery = supabase.from('helium_earnings').select('*, devices(device_name, device_type), venues(venue_name, city, state), location_partners(company_legal_name)').gte('month', start.toISOString().split('T')[0]).lte('month', end.toISOString().split('T')[0])
    if (partnerId) heliumQuery = heliumQuery.eq('location_partner_id', partnerId)
    if (venueId) heliumQuery = heliumQuery.eq('venue_id', venueId)
    const { data: heliumData, error: heliumError } = await heliumQuery.order('month', { ascending: false })
    if (heliumError) console.error('Helium query error:', heliumError)

    const xnetTotals = (xnetData || []).reduce((acc, row) => ({ tokens: acc.tokens + (parseFloat(row.total_rewards) || 0), gb: acc.gb + (parseFloat(row.total_gb) || 0), sessions: acc.sessions + (row.sessions || 0), users: acc.users + (row.users || 0), uptime: acc.uptime + (parseFloat(row.uptime) || 0), rejects: acc.rejects + (row.rejects || 0), count: acc.count + 1, poc: acc.poc + (parseFloat(row.for_poc) || 0), data: acc.data + (parseFloat(row.for_data) || 0), bonus: acc.bonus + (parseFloat(row.bonus) || 0) }), { tokens: 0, gb: 0, sessions: 0, users: 0, uptime: 0, rejects: 0, count: 0, poc: 0, data: 0, bonus: 0 })

    const heliumTotals = (heliumData || []).reduce((acc, row) => ({ tokens: acc.tokens + (parseFloat(row.total_rewards) || 0), rewardableGb: acc.rewardableGb + (parseFloat(row.rewardable_gb) || 0), dataGb: acc.dataGb + (parseFloat(row.data_gb) || 0), sessions: acc.sessions + (row.sessions || 0), subscribers: acc.subscribers + (row.subscribers || 0), rewards: acc.rewards + (parseFloat(row.rewards) || 0), poc: acc.poc + (parseFloat(row.poc) || 0), count: acc.count + 1 }), { tokens: 0, rewardableGb: 0, dataGb: 0, sessions: 0, subscribers: 0, rewards: 0, poc: 0, count: 0 })

    const xnetUsd = xnetTotals.tokens * xnetPrice
    const heliumUsd = heliumTotals.tokens * hntPrice
    const totalUsd = xnetUsd + heliumUsd

    const groupByDate = (data: any[], dateField: string, valueField: string, price: number) => {
      const grouped: Record<string, { tokens: number; usd: number; count: number }> = {}
      data.forEach(row => { const date = row[dateField]?.split('T')[0] || 'unknown'; if (!grouped[date]) grouped[date] = { tokens: 0, usd: 0, count: 0 }; const tokens = parseFloat(row[valueField]) || 0; grouped[date].tokens += tokens; grouped[date].usd += tokens * price; grouped[date].count += 1 })
      return Object.entries(grouped).map(([date, values]) => ({ date, ...values })).sort((a, b) => a.date.localeCompare(b.date))
    }

    const groupByField = (data: any[], field: string, valueField: string, price: number) => {
      const grouped: Record<string, { id: string; name: string; tokens: number; usd: number; count: number }> = {}
      data.forEach(row => { const id = row[field] || 'unassigned'; const name = field === 'venue_id' ? row.venues?.venue_name || 'Unknown Venue' : row.location_partners?.company_legal_name || 'Unknown Partner'; if (!grouped[id]) grouped[id] = { id, name, tokens: 0, usd: 0, count: 0 }; const tokens = parseFloat(row[valueField]) || 0; grouped[id].tokens += tokens; grouped[id].usd += tokens * price; grouped[id].count += 1 })
      return Object.values(grouped).sort((a, b) => b.usd - a.usd)
    }

    return NextResponse.json({
      success: true,
      period: { start: start.toISOString(), end: end.toISOString(), days: period },
      prices: { xnet: { current: priceData?.xnet_current, avg30d: xnetPrice, high30d: priceData?.xnet_30d_high, low30d: priceData?.xnet_30d_low }, hnt: { current: priceData?.hnt_current, avg30d: hntPrice, high30d: priceData?.hnt_30d_high, low30d: priceData?.hnt_30d_low } },
      summary: {
        totalUsd,
        xnet: { label: 'SYX', tokens: xnetTotals.tokens, usd: xnetUsd, gb: xnetTotals.gb, sessions: xnetTotals.sessions, users: xnetTotals.users, avgUptime: xnetTotals.count > 0 ? xnetTotals.uptime / xnetTotals.count : 0, rejects: xnetTotals.rejects, breakdown: { poc: xnetTotals.poc, data: xnetTotals.data, bonus: xnetTotals.bonus } },
        helium: { label: 'SYH', tokens: heliumTotals.tokens, usd: heliumUsd, rewardableGb: heliumTotals.rewardableGb, dataGb: heliumTotals.dataGb, sessions: heliumTotals.sessions, subscribers: heliumTotals.subscribers, breakdown: { rewards: heliumTotals.rewards, poc: heliumTotals.poc } }
      },
      charts: { byDate: { xnet: groupByDate(xnetData || [], 'date', 'total_rewards', xnetPrice), helium: groupByDate(heliumData || [], 'month', 'total_rewards', hntPrice) }, byVenue: { xnet: groupByField(xnetData || [], 'venue_id', 'total_rewards', xnetPrice), helium: groupByField(heliumData || [], 'venue_id', 'total_rewards', hntPrice) }, byPartner: { xnet: groupByField(xnetData || [], 'location_partner_id', 'total_rewards', xnetPrice), helium: groupByField(heliumData || [], 'location_partner_id', 'total_rewards', hntPrice) } },
      raw: { xnet: xnetData || [], helium: heliumData || [] }
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
