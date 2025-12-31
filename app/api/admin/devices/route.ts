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
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const venueId = searchParams.get('venueId')
    const partnerId = searchParams.get('partnerId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (id) {
      const { data: device, error } = await supabase
        .from('devices')
        .select(`*, venues(id, venue_id, venue_name, location_partner_id, address_line_1, city, state), products(id, name, sku, manufacturer)`)
        .eq('id', id)
        .single()

      if (error) throw error
      return NextResponse.json({ device })
    }

    let query = supabase
      .from('devices')
      .select(`*, venues(id, venue_id, venue_name, location_partner_id, city, state, location_partners(id, partner_id, company_legal_name)), products(id, name, sku, manufacturer)`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (venueId) query = query.eq('venue_id', venueId)
    if (status) query = query.eq('status', status)

    const { data: devices, error } = await query
    if (error) throw error

    let filteredDevices = devices
    if (partnerId && devices) {
      filteredDevices = devices.filter(d => d.venues?.location_partner_id === partnerId)
    }

    return NextResponse.json({ devices: filteredDevices })

  } catch (error: any) {
    console.error('Admin devices GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch devices', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { count } = await supabase.from('devices').select('*', { count: 'exact', head: true })
    const deviceId = `DEV-${((count || 0) + 1).toString().padStart(5, '0')}`

    const { data, error } = await supabase.from('devices').insert([{
      venue_id: body.venue_id,
      product_id: body.product_id,
      device_id: deviceId,
      device_name: body.device_name,
      device_type: body.device_type || 'access_point',
      manufacturer: body.manufacturer,
      model: body.model,
      serial_number: body.serial_number,
      mac_address: body.mac_address,
      ip_address: body.ip_address,
      status: body.status || 'pending',
      ownership: body.ownership || 'skyyield',
      install_date: body.install_date,
      assigned_contractor_id: body.assigned_contractor_id,
      location_in_venue: body.location_in_venue,
      notes: body.notes,
    }]).select().single()

    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'device', entity_id: data.id, entity_name: data.device_name || data.device_id, user_id: userId, action: 'device_created', action_category: 'admin',
    }]).catch(() => {})

    return NextResponse.json({ success: true, device: data })
  } catch (error: any) {
    console.error('Admin devices POST error:', error)
    return NextResponse.json({ error: 'Failed to create device', details: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Device ID required' }, { status: 400 })

    updates.updated_at = new Date().toISOString()
    const { data, error } = await supabase.from('devices').update(updates).eq('id', id).select().single()
    if (error) throw error

    return NextResponse.json({ success: true, device: data })
  } catch (error: any) {
    console.error('Admin devices PUT error:', error)
    return NextResponse.json({ error: 'Failed to update device', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Device ID required' }, { status: 400 })

    const { data: device } = await supabase.from('devices').select('device_name, device_id').eq('id', id).single()
    const { error } = await supabase.from('devices').delete().eq('id', id)
    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'device', entity_id: id, entity_name: device?.device_name || device?.device_id, user_id: userId, action: 'device_deleted', action_category: 'admin',
    }]).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin devices DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete device', details: error.message }, { status: 500 })
  }
}
