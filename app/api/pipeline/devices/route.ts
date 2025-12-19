// app/api/pipeline/devices/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const venueId = searchParams.get('venueId')
  const status = searchParams.get('status')

  try {
    if (id) {
      const { data: device, error } = await supabase
        .from('devices').select('*, venues(venue_name, location_partner_id)').eq('id', id).single()
      if (error) throw error
      return NextResponse.json({ device })
    }

    let query = supabase.from('devices').select('*, venues(venue_name)')
      .order('created_at', { ascending: false })
    if (venueId) query = query.eq('venue_id', venueId)
    if (status) query = query.eq('status', status)
    const { data, error } = await query.limit(100)
    if (error) throw error
    return NextResponse.json({ devices: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await request.json()

    const { count } = await supabase.from('devices').select('*', { count: 'exact', head: true })
    const deviceId = `DEV-${((count || 0) + 1).toString().padStart(5, '0')}`

    const { data, error } = await supabase.from('devices').insert([{
      venue_id: body.venue_id,
      product_id: body.product_id,
      device_id: deviceId,
      device_name: body.device_name,
      device_type: body.device_type || 'access_point',
      manufacturer: body.manufacturer || 'Ubiquiti',
      model: body.model,
      serial_number: body.serial_number,
      mac_address: body.mac_address,
      ownership: body.ownership || 'skyyield_owned',
      status: body.status || 'pending_purchase',
      unit_cost: body.unit_cost,
      installation_cost: body.installation_cost,
      partner_paid_amount: body.partner_paid_amount,
      ip_address: body.ip_address,
      ssid: body.ssid,
      network_name: body.network_name,
      location_in_venue: body.location_in_venue,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select().single()
    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'device',
      entity_id: data.id,
      entity_name: data.device_id,
      user_id: userId,
      action: 'device_created',
      action_category: 'inventory',
    }])
    return NextResponse.json({ success: true, device: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { data: old } = await supabase.from('devices')
      .select('status, device_id').eq('id', id).single()

    updates.updated_at = new Date().toISOString()

    // Auto-set timestamps based on status
    if (updates.status === 'ordered') updates.ordered_at = updates.ordered_at || new Date().toISOString()
    if (updates.status === 'shipped') updates.shipped_at = updates.shipped_at || new Date().toISOString()
    if (updates.status === 'delivered') updates.delivered_at = updates.delivered_at || new Date().toISOString()
    if (updates.status === 'installed' || updates.status === 'active') {
      updates.installed_at = updates.installed_at || new Date().toISOString()
    }
    if (updates.status === 'removed') updates.removed_at = updates.removed_at || new Date().toISOString()

    const { data, error } = await supabase.from('devices')
      .update(updates).eq('id', id).select().single()
    if (error) throw error

    if (updates.status && old?.status !== updates.status) {
      await supabase.from('activity_log').insert([{
        entity_type: 'device',
        entity_id: id,
        entity_name: old?.device_id,
        user_id: userId,
        action: 'status_changed',
        action_category: 'inventory',
        description: `Status: ${old?.status} → ${updates.status}`,
      }])
    }
    return NextResponse.json({ success: true, device: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { data: device } = await supabase.from('devices')
      .select('device_id').eq('id', id).single()

    const { error } = await supabase.from('devices').delete().eq('id', id)
    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'device',
      entity_id: id,
      entity_name: device?.device_id,
      user_id: userId,
      action: 'device_deleted',
      action_category: 'inventory',
    }])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await request.json()
    const { ids, updates } = body

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()
    const { data, error } = await supabase.from('devices')
      .update(updates).in('id', ids).select()
    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'device',
      entity_id: ids[0],
      user_id: userId,
      action: 'bulk_update',
      action_category: 'inventory',
      description: `${ids.length} devices updated`,
    }])
    return NextResponse.json({ success: true, devices: data, count: data?.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
