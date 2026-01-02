import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const now = new Date()
    let startDate: Date
    switch (period) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break
      case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const { data: venueEarnings } = await supabase
      .from('v_earnings_by_venue')
      .select('*')
      .order('total_usd_value', { ascending: false })
      .limit(10)

    const { data: partnerEarnings } = await supabase
      .from('v_earnings_by_partner')
      .select('*')
      .order('total_usd_value', { ascending: false })
      .limit(10)

    const { data: totals } = await supabase
      .from('network_device_earnings')
      .select('network_type, usd_value, data_gb')
      .gte('date', startDate.toISOString().split('T')[0])

    const totalRevenue = (totals || []).reduce((sum, r) => sum + parseFloat(r.usd_value || 0), 0)
    const totalDataGB = (totals || []).reduce((sum, r) => sum + parseFloat(r.data_gb || 0), 0)

    const byNetwork = (totals || []).reduce((acc: any, r) => {
      if (!acc[r.network_type]) acc[r.network_type] = { records: 0, usd: 0, dataGB: 0 }
      acc[r.network_type].records++
      acc[r.network_type].usd += parseFloat(r.usd_value || 0)
      acc[r.network_type].dataGB += parseFloat(r.data_gb || 0)
      return acc
    }, {})

    const { count: venueCount } = await supabase.from('venues').select('*', { count: 'exact', head: true })
    const { count: deviceCount } = await supabase.from('devices').select('*', { count: 'exact', head: true })
    const { data: unlinked } = await supabase.rpc('get_unlinked_earnings')

    return NextResponse.json({
      success: true,
      period,
      stats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalDataGB: Math.round(totalDataGB * 100) / 100,
        totalVenues: venueCount || 0,
        totalDevices: deviceCount || 0,
      },
      venueEarnings: (venueEarnings || []).map(v => ({
        id: v.venue_id,
        name: v.venue_name || 'Unknown Venue',
        earnings: Math.round((v.total_usd_value || 0) * 100) / 100,
        dataGB: Math.round((v.total_data_gb || 0) * 100) / 100,
        network: v.network_type,
      })),
      partnerEarnings: (partnerEarnings || []).map(p => ({
        id: p.partner_id,
        name: p.partner_name || 'Unknown Partner',
        earnings: Math.round((p.total_usd_value || 0) * 100) / 100,
        dataGB: Math.round((p.total_data_gb || 0) * 100) / 100,
        network: p.network_type,
      })),
      networkSummary: {
        totalRecords: (totals || []).length,
        linkedRecords: (totals || []).length - (unlinked || []).length,
        unlinkedRecords: (unlinked || []).length,
        unlinkedSample: (unlinked || []).slice(0, 10).map((u: any) => ({
          identifier: u.gateway_name || u.mac_address,
          network: u.network_type,
          usd: u.total_usd,
        })),
        byNetwork,
      },
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
