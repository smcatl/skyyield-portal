import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYNC_API_KEY = process.env.EARNINGS_SYNC_API_KEY || 'skyyield-sync-2024'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // Check API key
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, records } = body

    if (!type || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid payload. Need type and records array' }, { status: 400 })
    }

    let results = { inserted: 0, errors: [] as string[] }

    if (type === 'helium') {
      for (const record of records) {
        // Skip empty records
        if (!record.MaC && !record.mac_address) continue
        
        const data = {
          gateway: record.Gateway || record.gateway || null,
          site: record.Site || record.site || null,
          mac_address: record.MaC || record.mac_address,
          mac_no_colon: record['MaC (No Colon)'] || record.mac_no_colon || (record.MaC || '').replace(/:/g, ''),
          nas_id: record['NAS ID'] || record.nas_id || null,
          month: parseExcelDate(record.Month || record.month),
          data_pull_date: parseExcelDate(record.Data_Pull_Date || record.data_pull_date),
          rewards: parseFloat(record.Rewards || record.rewards || 0),
          poc: parseFloat(record.PoC || record.poc || 0),
          total_rewards: parseFloat(record.Rewards || record.rewards || 0) + parseFloat(record.PoC || record.poc || 0),
          data_gb: parseFloat(record.Data_GB || record.data_gb || 0),
          rewardable_gb: parseFloat(record.Rewardable_GB || record.rewardable_gb || 0),
          sessions: parseInt(record.Sessions || record.sessions || 0),
          subscribers: parseInt(record.Subscribers || record.subscribers || 0),
          multiplier: parseFloat(record.Multiplier || record.multiplier || 0),
          upload_mbps: parseFloat(record.Upload_Mbps || record.upload_mbps || 0),
          download_mbps: parseFloat(record.Download_Mbps || record.download_mbps || 0),
        }

        const { error } = await supabase.from('helium_earnings').upsert(data, { onConflict: 'mac_address,month' })
        if (error) results.errors.push(`Helium ${data.mac_address}: ${error.message}`)
        else results.inserted++
      }
    }

    if (type === 'xnet') {
      for (const record of records) {
        if (!record.MaC && !record.mac_address) continue
        
        const data = {
          mac_address: record.MaC || record.mac_address,
          mac_no_colon: record.MAC_No_Colon || record.mac_no_colon || (record.MaC || '').replace(/:/g, ''),
          epoch: parseInt(record.Epoch || record.epoch || 0),
          date: parseExcelDate(record.Date || record.date),
          month: record.Month || record.month || null,
          data_pull_date: parseExcelDate(record.Data_Pull_Date || record.data_pull_date),
          for_poc: parseFloat(record['For PoC'] || record.for_poc || 0),
          for_data: parseFloat(record['For Data'] || record.for_data || 0),
          bonus: parseFloat(record.Bonus || record.bonus || 0),
          total_rewards: parseFloat(record.Total_Rewards || record.total_rewards || 0) || 
            (parseFloat(record['For PoC'] || 0) + parseFloat(record['For Data'] || 0) + parseFloat(record.Bonus || 0)),
          uptime: parseFloat(record.Uptime || record.uptime || 0),
          sessions: parseInt(record.Sessions || record.sessions || 0),
          users: parseInt(record.Users || record.users || 0),
          rejects: parseInt(record.Rejects || record.rejects || 0),
          total_gb: parseFloat(record.TotalGB || record.total_gb || 0),
          network_status: record['Network Status'] || record.network_status || null,
          location_status: record['Location Status'] || record.location_status || null,
        }

        const { error } = await supabase.from('xnet_earnings').upsert(data, { onConflict: 'mac_address,date' })
        if (error) results.errors.push(`XNET ${data.mac_address}: ${error.message}`)
        else results.inserted++
      }
    }

    if (type === 'coin_prices') {
      for (const record of records) {
        const dateVal = parseExcelDate(record.Date || record.date)
        if (!dateVal) continue
        
        const data = {
          date: dateVal,
          hnt_current: parseFloat(record.HNT_Current || record.hnt_current || 0),
          hnt_30d_avg: parseFloat(record.HNT_30d_Avg || record.hnt_30d_avg || 0),
          hnt_30d_high: parseFloat(record.HNT_30d_High || record.hnt_30d_high || 0),
          hnt_30d_low: parseFloat(record.HNT_30d_Low || record.hnt_30d_low || 0),
          xnet_current: parseFloat(record.XNET_Current || record.xnet_current || 0),
          xnet_30d_avg: parseFloat(record.XNET_30d_Avg || record.xnet_30d_avg || 0),
          xnet_30d_high: parseFloat(record.XNET_30d_High || record.xnet_30d_high || 0),
          xnet_30d_low: parseFloat(record.XNET_30d_Low || record.xnet_30d_low || 0),
        }

        const { error } = await supabase.from('coin_prices').upsert(data, { onConflict: 'date' })
        if (error) results.errors.push(`Price ${data.date}: ${error.message}`)
        else results.inserted++
      }
    }

    return NextResponse.json({ success: true, type, ...results })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Sync failed', details: String(error) }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ success: true, message: 'Earnings sync API ready' })
}

// Helper to parse Excel serial dates or ISO dates
function parseExcelDate(value: any): string | null {
  if (!value) return null
  
  // If it's already a date string
  if (typeof value === 'string' && value.includes('-')) {
    return value.split('T')[0]
  }
  
  // If it's an Excel serial number (number of days since 1900-01-01)
  if (typeof value === 'number' || !isNaN(Number(value))) {
    const num = Number(value)
    if (num > 40000 && num < 50000) { // Valid Excel date range
      const date = new Date((num - 25569) * 86400 * 1000)
      return date.toISOString().split('T')[0]
    }
  }
  
  return null
}
