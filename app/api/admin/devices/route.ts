// =============================================================================
// app/api/admin/devices/route.ts
// Admin API for Devices - WITH venues and location_partners joins
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const venueId = searchParams.get('venueId')
    const status = searchParams.get('status')

    // Single device fetch
    if (id) {
      const { data: device, error } = await supabase
        .from('devices')
        .select(`
          *,
          venues (
            id,
            venue_id,
            venue_name,
            city,
            state,
            location_partner_id,
            location_partners (
              id,
              partner_id,
              company_legal_name,
              contact_first_name,
              contact_last_name
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ device })
    }

    // List all devices with venue and partner info
    let query = supabase
      .from('devices')
      .select(`
        *,
        venues (
          id,
          venue_id,
          venue_name,
          city,
          state,
          location_partner_id,
          location_partners (
            id,
            partner_id,
            company_legal_name,
            contact_first_name,
            contact_last_name
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

    const { data: devices, error } = await query.limit(500)

    if (error) {
      console.error('Devices fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ devices: devices || [] })

  } catch (error) {
    console.error('GET /api/admin/devices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate device_id
    const { count } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })

    const deviceId = `DEV-${String((count || 0) + 1).padStart(5, '0')}`

    const { data, error } = await supabase
      .from('devices')
      .insert({
        device_id: deviceId,
        device_name: body.device_name,
        device_type: body.device_type || 'access_point',
        serial_number: body.serial_number,
        mac_address: body.mac_address,
        venue_id: body.venue_id || null,
        status: body.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        venues (
          id,
          venue_id,
          venue_name,
          city,
          state,
          location_partner_id,
          location_partners (
            company_legal_name
          )
        )
      `)
      .single()

    if (error) {
      console.error('Device create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, device: data })

  } catch (error) {
    console.error('POST /api/admin/devices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('devices')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        venues (
          id,
          venue_id,
          venue_name,
          city,
          state,
          location_partner_id,
          location_partners (
            company_legal_name
          )
        )
      `)
      .single()

    if (error) {
      console.error('Device update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, device: data })

  } catch (error) {
    console.error('PUT /api/admin/devices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE /api/admin/devices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
