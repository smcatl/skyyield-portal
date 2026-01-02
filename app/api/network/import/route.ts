import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NETWORK_IMPORT_API_KEY = process.env.NETWORK_IMPORT_API_KEY

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const apiKey = authHeader?.replace('Bearer ', '') || request.headers.get('X-API-Key')
    
    if (!NETWORK_IMPORT_API_KEY || apiKey !== NETWORK_IMPORT_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const records = Array.isArray(body) ? body : body.records || [body]
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const defaultNetwork = searchParams.get('network')?.toUpperCase() || 'SYH'

    const validRecords = records
      .filter((r: any) => r.date && (r.gateway_name || r.mac_address))
      .map((r: any) => {
        const networkType = (r.network_type || defaultNetwork).toUpperCase()
        const isSYH = ['SYH', 'HELIUM', 'HNT'].includes(networkType)
        
        return {
          date: r.date,
          network_type: isSYH ? 'SYH' : 'SYX',
          mac_address: r.mac_address || null,
          gateway_name: r.gateway_name?.trim() || null,
          nas_id: r.nas_id || null,
          site_name: r.site_name || r.site || null,
          data_gb: parseFloat(r.data_gb) || 0,
          rewardable_gb: parseFloat(r.rewardable_gb) || 0,
          sessions: parseInt(r.sessions) || 0,
          subscribers: parseInt(r.subscribers) || 0,
          rewards: parseFloat(r.rewards) || 0,
          poc_rewards: parseFloat(r.poc_rewards || r.poc) || 0,
          total_tokens: parseFloat(r.total_tokens) || (parseFloat(r.rewards) || 0) + (parseFloat(r.poc_rewards || r.poc) || 0),
          usd_value: parseFloat(r.usd_value) || 0,
          raw_data: r,
          imported_at: new Date().toISOString(),
        }
      })

    if (validRecords.length === 0) {
      return NextResponse.json({ error: 'No valid records' }, { status: 400 })
    }

    const { error } = await supabase
      .from('network_device_earnings')
      .upsert(validRecords, { onConflict: 'date,network_type,gateway_name' })

    if (error) {
      console.error('Import error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, imported: validRecords.length })
  } catch (error) {
    console.error('Network import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const apiKey = authHeader?.replace('Bearer ', '') || request.headers.get('X-API-Key')
    
    if (!NETWORK_IMPORT_API_KEY || apiKey !== NETWORK_IMPORT_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: records } = await supabase
      .from('network_device_earnings')
      .select('network_type, usd_value')
      .gte('date', startDate.toISOString().split('T')[0])

    const summary = (records || []).reduce((acc: any, r) => {
      if (!acc[r.network_type]) acc[r.network_type] = { count: 0, usd: 0 }
      acc[r.network_type].count++
      acc[r.network_type].usd += parseFloat(r.usd_value || 0)
      return acc
    }, {})

    const { data: unlinked } = await supabase.rpc('get_unlinked_earnings')

    return NextResponse.json({
      success: true,
      period: `${days} days`,
      byNetwork: summary,
      unlinked: { count: (unlinked || []).length, records: (unlinked || []).slice(0, 10) }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
