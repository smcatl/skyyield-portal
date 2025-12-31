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
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId')
    const partnerId = searchParams.get('partnerId')
    const status = searchParams.get('status')

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
            contact_full_name,
            company_legal_name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (venueId) {
      query = query.eq('venue_id', venueId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: devices, error } = await query

    if (error) throw error

    // Filter by partnerId if specified (need to check through venue)
    let filteredDevices = devices
    if (partnerId) {
      filteredDevices = devices?.filter(d => 
        d.venue?.location_partner_id === partnerId ||
        d.venue?.location_partner?.id === partnerId
      )
    }

    // Normalize venue name for frontend
    const normalizedDevices = filteredDevices?.map(d => ({
      ...d,
      venue: d.venue ? {
        ...d.venue,
        name: d.venue.venue_name // Map venue_name to name
      } : null
    }))

    // Calculate stats
    const stats = {
      total: normalizedDevices?.length || 0,
      active: normalizedDevices?.filter(d => d.status === 'active' || d.status === 'online' || d.status === 'installed').length || 0,
      offline: normalizedDevices?.filter(d => d.status === 'offline').length || 0,
      pending: normalizedDevices?.filter(d => d.status === 'pending' || d.status === 'ordered' || d.status === 'shipped').length || 0,
      unassigned: normalizedDevices?.filter(d => !d.venue_id).length || 0
    }

    return NextResponse.json({ devices: normalizedDevices, stats })

  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}

// POST - Create new device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = await auth()

    const {
      venue_id,
      product_id,
      serial_number,
      mac_address,
      device_type,
      device_name,
      manufacturer,
      model,
      status = 'pending',
      ownership = 'skyyield',
      notes
    } = body

    // Validate required fields
    if (!serial_number) {
      return NextResponse.json(
        { error: 'Missing required field: serial_number' },
        { status: 400 }
      )
    }

    // Generate device_id
    const deviceId = `DEV-${Date.now()}`

    const { data: device, error } = await supabase
      .from('devices')
      .insert({
        device_id: deviceId,
        venue_id,
        product_id,
        serial_number,
        mac_address,
        device_type,
        device_name,
        manufacturer,
        model,
        status,
        ownership,
        notes
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_log').insert({
      actor_id: userId,
      action: 'device_created',
      entity_type: 'device',
      entity_id: device.id,
      details: { device_id: deviceId, serial_number, venue_id }
    }).catch(() => {})

    return NextResponse.json({ device })

  } catch (error) {
    console.error('Error creating device:', error)
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    )
  }
}

// PUT - Update device
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = await auth()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }

    const { data: device, error } = await supabase
      .from('devices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_log').insert({
      actor_id: userId,
      action: 'device_updated',
      entity_type: 'device',
      entity_id: id,
      details: { updates }
    }).catch(() => {})

    return NextResponse.json({ device })

  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json(
      { error: 'Failed to update device' },
      { status: 500 }
    )
  }
}

// DELETE - Delete device
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const { userId } = await auth()

    if (!id) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Log activity
    await supabase.from('activity_log').insert({
      actor_id: userId,
      action: 'device_deleted',
      entity_type: 'device',
      entity_id: id,
      details: {}
    }).catch(() => {})

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json(
      { error: 'Failed to delete device' },
      { status: 500 }
    )
  }
}

// PATCH - Bulk update devices
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = await auth()
    const { deviceIds, updates } = body

    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return NextResponse.json(
        { error: 'deviceIds array is required' },
        { status: 400 }
      )
    }

    const { data: devices, error } = await supabase
      .from('devices')
      .update(updates)
      .in('id', deviceIds)
      .select()

    if (error) throw error

    // Log activity
    await supabase.from('activity_log').insert({
      actor_id: userId,
      action: 'devices_bulk_updated',
      entity_type: 'device',
      entity_id: deviceIds[0],
      details: { deviceIds, updates }
    }).catch(() => {})

    return NextResponse.json({ devices, updated: devices?.length || 0 })

  } catch (error) {
    console.error('Error bulk updating devices:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update devices' },
      { status: 500 }
    )
  }
}
