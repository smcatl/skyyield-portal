// API Route: Devices (Supabase)
// app/api/pipeline/devices/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// GET: Fetch devices
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const venueId = searchParams.get('venueId') || searchParams.get('venue_id')
    const partnerId = searchParams.get('partnerId') || searchParams.get('location_partner_id')

    // Single device fetch
    if (id) {
      const { data: device, error } = await supabase
        .from('devices')
        .select('*, venues(*, location_partners(*)), products(*)')
        .eq('id', id)
        .single()

      if (error || !device) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      return NextResponse.json({ device })
    }

    // List devices
    let query = supabase.from('devices').select('*, venues(venue_name, location_partner_id), products(name, sku)')

    if (venueId) {
      query = query.eq('venue_id', venueId)
    }

    // Filter by partner (through venues)
    if (partnerId) {
      const { data: venues } = await supabase
        .from('venues')
        .select('id')
        .eq('location_partner_id', partnerId)

      if (venues && venues.length > 0) {
        const venueIds = venues.map(v => v.id)
        query = query.in('venue_id', venueIds)
      }
    }

    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }

    const ownership = searchParams.get('ownership')
    if (ownership) {
      query = query.eq('ownership', ownership)
    }

    const { data: devices, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ devices: devices || [] })
  } catch (error) {
    console.error('GET /api/pipeline/devices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create device
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const deviceData = {
      venue_id: body.venueId || body.venue_id,
      product_id: body.productId || body.product_id,
      purchase_request_id: body.purchaseRequestId || body.purchase_request_id,
      device_name: body.deviceName || body.device_name,
      device_type: body.deviceType || body.device_type || 'access_point',
      manufacturer: body.manufacturer || 'Ubiquiti',
      model: body.model,
      serial_number: body.serialNumber || body.serial_number,
      mac_address: body.macAddress || body.mac_address,
      ownership: body.ownership || 'skyyield_owned',
      status: body.status || 'pending_install',
      unit_cost: body.unitCost || body.unit_cost,
      location_in_venue: body.locationInVenue || body.location_in_venue,
      notes: body.notes,
    }

    const { data: device, error } = await supabase
      .from('devices')
      .insert(deviceData)
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'device',
      entity_id: device.id,
      action: 'created',
      description: `Device "${device.device_name || device.device_id}" created`,
    })

    return NextResponse.json({ device }, { status: 201 })
  } catch (error) {
    console.error('POST /api/pipeline/devices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update device
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    // Map camelCase to snake_case
    const updateData: Record<string, any> = {}
    const fieldMap: Record<string, string> = {
      deviceName: 'device_name',
      deviceType: 'device_type',
      serialNumber: 'serial_number',
      macAddress: 'mac_address',
      ipAddress: 'ip_address',
      unitCost: 'unit_cost',
      installationCost: 'installation_cost',
      locationInVenue: 'location_in_venue',
      installedAt: 'installed_at',
      lastSeenOnline: 'last_seen_online',
    }

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key] || key
      updateData[dbField] = value
    }

    // Get current device for logging
    const { data: currentDevice } = await supabase
      .from('devices')
      .select('status')
      .eq('id', id)
      .single()

    const { data: device, error } = await supabase
      .from('devices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log status change
    if (currentDevice && updateData.status && updateData.status !== currentDevice.status) {
      await supabase.from('activity_log').insert({
        entity_type: 'device',
        entity_id: id,
        action: 'status_change',
        description: `Device status: ${currentDevice.status} → ${updateData.status}`,
      })
    }

    return NextResponse.json({ device })
  } catch (error) {
    console.error('PUT /api/pipeline/devices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove device
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase.from('devices').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/pipeline/devices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
