// app/api/admin/devices/route.ts
// Admin Devices API - Full CRUD with venue and partner linking
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List all devices with venue and partner info
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const venueId = searchParams.get('venueId')
    const partnerId = searchParams.get('partnerId')
    const search = searchParams.get('search')

    let query = supabase
      .from('devices')
      .select(`
        *,
        venue:venues(
          id,
          venue_id,
          venue_name,
          city,
          state,
          location_partner_id,
          location_partner:location_partners(
            id,
            partner_id,
            company_legal_name,
            dba_name
          )
        ),
        product:products(
          id,
          name,
          sku,
          manufacturer
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (venueId) {
      query = query.eq('venue_id', venueId)
    }

    if (search) {
      query = query.or(`device_name.ilike.%${search}%,serial_number.ilike.%${search}%,mac_address.ilike.%${search}%`)
    }

    const { data: devices, error } = await query

    if (error) {
      console.error('Error fetching devices:', error)
      return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
    }

    // Filter by partner if needed (requires joining through venue)
    let filteredDevices = devices || []
    if (partnerId) {
      filteredDevices = filteredDevices.filter(d => 
        d.venue?.location_partner_id === partnerId
      )
    }

    // Get stats
    const allDevices = devices || []
    const stats = {
      total: allDevices.length,
      active: allDevices.filter(d => d.status === 'active' || d.status === 'online').length,
      offline: allDevices.filter(d => d.status === 'offline').length,
      pending: allDevices.filter(d => d.status === 'pending').length,
      unassigned: allDevices.filter(d => !d.venue_id).length,
    }

    return NextResponse.json({
      success: true,
      devices: filteredDevices,
      stats,
    })
  } catch (error: any) {
    console.error('Devices GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new device
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data: device, error } = await supabase
      .from('devices')
      .insert({
        venue_id: body.venue_id || null,
        product_id: body.product_id || null,
        device_name: body.device_name,
        device_type: body.device_type || 'access_point',
        serial_number: body.serial_number,
        mac_address: body.mac_address,
        status: body.status || 'pending',
        ownership: body.ownership || 'skyyield',
        installed_at: body.installed_at,
        firmware_version: body.firmware_version,
        notes: body.notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating device:', error)
      return NextResponse.json({ error: 'Failed to create device' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'device',
      entity_id: device.id,
      entity_name: device.device_name || device.serial_number,
      action: 'device_created',
      action_category: 'admin',
    })

    return NextResponse.json({ success: true, device }, { status: 201 })
  } catch (error: any) {
    console.error('Device POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update device
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data: device, error } = await supabase
      .from('devices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating device:', error)
      return NextResponse.json({ error: 'Failed to update device' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'device',
      entity_id: device.id,
      entity_name: device.device_name || device.serial_number,
      action: 'device_updated',
      action_category: 'admin',
      new_values: updates,
    })

    return NextResponse.json({ success: true, device })
  } catch (error: any) {
    console.error('Device PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete device
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 })
    }

    // Get device info for logging
    const { data: device } = await supabase
      .from('devices')
      .select('device_name, serial_number')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting device:', error)
      return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'device',
      entity_id: id,
      entity_name: device?.device_name || device?.serial_number,
      action: 'device_deleted',
      action_category: 'admin',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Device DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Bulk update devices (assign to venue, change status)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { deviceIds, updates } = body

    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return NextResponse.json({ error: 'Device IDs required' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data: devices, error } = await supabase
      .from('devices')
      .update(updates)
      .in('id', deviceIds)
      .select()

    if (error) {
      console.error('Error bulk updating devices:', error)
      return NextResponse.json({ error: 'Failed to update devices' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'device',
      entity_id: deviceIds.join(','),
      entity_name: `${deviceIds.length} devices`,
      action: 'devices_bulk_updated',
      action_category: 'admin',
      new_values: updates,
    })

    return NextResponse.json({ success: true, devices, count: devices?.length || 0 })
  } catch (error: any) {
    console.error('Device PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
