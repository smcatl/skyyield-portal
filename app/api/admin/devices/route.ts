// app/api/admin/devices/route.ts
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
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const venueId = searchParams.get('venueId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (id) {
      const { data: device, error } = await supabase.from('devices').select('*, venues(id, venue_id, venue_name, location_partner_id, city, state), products(id, name, sku, manufacturer)').eq('id', id).single()
      if (error) throw error
      return NextResponse.json({ device })
    }

    let query = supabase.from('devices').select('*, venues(id, venue_id, venue_name, location_partner_id, city, state), products(id, name, sku, manufacturer)').order('created_at', { ascending: false }).limit(limit)
    if (venueId) query = query.eq('venue_id', venueId)
    if (status) query = query.eq('status', status)

    const { data: devices, error } = await query
    if (error) throw error
    return NextResponse.json({ devices })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch devices', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { count } = await supabase.from('devices').select('*', { count: 'exact', head: true })
    const { data, error } = await supabase.from('devices').insert([{ ...body, device_id: `DEV-${((count || 0) + 1).toString().padStart(5, '0')}`, status: body.status || 'pending' }]).select().single()
    if (error) throw error
    return NextResponse.json({ success: true, device: data })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create device', details: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'Device ID required' }, { status: 400 })
    const { data, error } = await supabase.from('devices').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json({ success: true, device: data })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update device', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Device ID required' }, { status: 400 })
    const { error } = await supabase.from('devices').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete device', details: error.message }, { status: 500 })
  }
}
