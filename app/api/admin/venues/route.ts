// app/api/admin/venues/route.ts
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
    const partnerId = searchParams.get('partnerId')
    const status = searchParams.get('status')
    const includeDevices = searchParams.get('includeDevices') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')

    if (id) {
      const { data: venue, error } = await supabase
        .from('venues')
        .select(`*, location_partners(id, partner_id, company_legal_name, contact_first_name, contact_last_name, contact_email)`)
        .eq('id', id)
        .single()

      if (error) throw error

      const response: any = { venue }
      if (includeDevices) {
        const { data: devices } = await supabase.from('devices').select('*').eq('venue_id', id).order('created_at', { ascending: false })
        response.devices = devices || []
      }
      return NextResponse.json(response)
    }

    let query = supabase
      .from('venues')
      .select(`*, location_partners(id, partner_id, company_legal_name, contact_first_name, contact_last_name)`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (partnerId) query = query.eq('location_partner_id', partnerId)
    if (status) query = query.eq('status', status)

    const { data: venues, error } = await query
    if (error) throw error

    const venueIds = venues?.map(v => v.id) || []
    let deviceCounts: Record<string, number> = {}

    if (venueIds.length > 0) {
      const { data: devices } = await supabase.from('devices').select('venue_id').in('venue_id', venueIds)
      if (devices) devices.forEach(d => { deviceCounts[d.venue_id] = (deviceCounts[d.venue_id] || 0) + 1 })
    }

    const venuesWithCounts = venues?.map(venue => ({ ...venue, device_count: deviceCounts[venue.id] || 0 }))
    return NextResponse.json({ venues: venuesWithCounts })

  } catch (error: any) {
    console.error('Admin venues GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch venues', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { count } = await supabase.from('venues').select('*', { count: 'exact', head: true }).eq('location_partner_id', body.location_partner_id)
    const venueId = `VEN-${((count || 0) + 1).toString().padStart(3, '0')}`

    const { data, error } = await supabase.from('venues').insert([{
      location_partner_id: body.location_partner_id,
      venue_id: venueId,
      venue_name: body.venue_name,
      venue_type: body.venue_type,
      address_line_1: body.address_line_1 || body.address,
      address_line_2: body.address_line_2,
      city: body.city,
      state: body.state,
      zip: body.zip,
      country: body.country || 'USA',
      latitude: body.latitude,
      longitude: body.longitude,
      site_contact_name: body.site_contact_name,
      site_contact_phone: body.site_contact_phone,
      site_contact_email: body.site_contact_email,
      square_footage: body.square_footage,
      floors: body.floors || 1,
      operating_hours: body.operating_hours,
      existing_network: body.existing_network || false,
      existing_isp: body.existing_isp,
      bandwidth_mbps: body.bandwidth_mbps,
      monthly_visitors: body.monthly_visitors,
      status: body.status || 'pending',
    }]).select().single()

    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'venue', entity_id: data.id, entity_name: data.venue_name, user_id: userId, action: 'venue_created', action_category: 'admin',
    }]).catch(() => {})

    return NextResponse.json({ success: true, venue: data })
  } catch (error: any) {
    console.error('Admin venues POST error:', error)
    return NextResponse.json({ error: 'Failed to create venue', details: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Venue ID required' }, { status: 400 })

    updates.updated_at = new Date().toISOString()
    const { data, error } = await supabase.from('venues').update(updates).eq('id', id).select().single()
    if (error) throw error

    return NextResponse.json({ success: true, venue: data })
  } catch (error: any) {
    console.error('Admin venues PUT error:', error)
    return NextResponse.json({ error: 'Failed to update venue', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Venue ID required' }, { status: 400 })

    const { data: venue } = await supabase.from('venues').select('venue_name').eq('id', id).single()
    const { error } = await supabase.from('venues').delete().eq('id', id)
    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'venue', entity_id: id, entity_name: venue?.venue_name, user_id: userId, action: 'venue_deleted', action_category: 'admin',
    }]).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin venues DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete venue', details: error.message }, { status: 500 })
  }
}
