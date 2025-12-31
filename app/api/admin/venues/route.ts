// app/api/admin/venues/route.ts
// Admin Venues API - Full CRUD with partner linking
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List all venues with partner info
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const partnerId = searchParams.get('partnerId')
    const search = searchParams.get('search')

    let query = supabase
      .from('venues')
      .select(`
        *,
        location_partner:location_partners(
          id,
          partner_id,
          company_legal_name,
          dba_name,
          contact_first_name,
          contact_last_name,
          contact_email
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (partnerId) {
      query = query.eq('location_partner_id', partnerId)
    }

    if (search) {
      query = query.or(`venue_name.ilike.%${search}%,city.ilike.%${search}%,address_line_1.ilike.%${search}%`)
    }

    const { data: venues, error } = await query

    if (error) {
      console.error('Error fetching venues:', error)
      return NextResponse.json({ error: 'Failed to fetch venues' }, { status: 500 })
    }

    // Get device counts for each venue
    const venueIds = venues?.map(v => v.id) || []
    const { data: deviceCounts } = await supabase
      .from('devices')
      .select('venue_id, status')
      .in('venue_id', venueIds)

    // Build device count map
    const deviceCountMap: Record<string, { total: number; active: number }> = {}
    deviceCounts?.forEach(d => {
      if (!deviceCountMap[d.venue_id]) {
        deviceCountMap[d.venue_id] = { total: 0, active: 0 }
      }
      deviceCountMap[d.venue_id].total++
      if (d.status === 'active' || d.status === 'online') {
        deviceCountMap[d.venue_id].active++
      }
    })

    // Add device counts to venues
    const venuesWithCounts = venues?.map(v => ({
      ...v,
      deviceCount: deviceCountMap[v.id]?.total || 0,
      activeDeviceCount: deviceCountMap[v.id]?.active || 0,
    }))

    // Get stats
    const stats = {
      total: venues?.length || 0,
      active: venues?.filter(v => v.status === 'active').length || 0,
      trial: venues?.filter(v => v.status === 'trial').length || 0,
      pending: venues?.filter(v => v.status === 'pending').length || 0,
      inactive: venues?.filter(v => v.status === 'inactive').length || 0,
    }

    return NextResponse.json({
      success: true,
      venues: venuesWithCounts || [],
      stats,
    })
  } catch (error: any) {
    console.error('Venues GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new venue
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data: venue, error } = await supabase
      .from('venues')
      .insert({
        location_partner_id: body.location_partner_id,
        venue_name: body.venue_name,
        venue_type: body.venue_type,
        address_line_1: body.address_line_1,
        address_line_2: body.address_line_2,
        city: body.city,
        state: body.state,
        zip: body.zip,
        latitude: body.latitude,
        longitude: body.longitude,
        square_footage: body.square_footage,
        floors: body.floors,
        operating_hours: body.operating_hours,
        monthly_visitors: body.monthly_visitors,
        existing_network: body.existing_network,
        existing_isp: body.existing_isp,
        bandwidth_mbps: body.bandwidth_mbps,
        status: body.status || 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating venue:', error)
      return NextResponse.json({ error: 'Failed to create venue' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'venue',
      entity_id: venue.id,
      entity_name: venue.venue_name,
      action: 'venue_created',
      action_category: 'admin',
    })

    return NextResponse.json({ success: true, venue }, { status: 201 })
  } catch (error: any) {
    console.error('Venue POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update venue
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data: venue, error } = await supabase
      .from('venues')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating venue:', error)
      return NextResponse.json({ error: 'Failed to update venue' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'venue',
      entity_id: venue.id,
      entity_name: venue.venue_name,
      action: 'venue_updated',
      action_category: 'admin',
      new_values: updates,
    })

    return NextResponse.json({ success: true, venue })
  } catch (error: any) {
    console.error('Venue PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete venue
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 })
    }

    // Get venue info for logging
    const { data: venue } = await supabase
      .from('venues')
      .select('venue_name')
      .eq('id', id)
      .single()

    // Check if venue has devices
    const { data: devices } = await supabase
      .from('devices')
      .select('id')
      .eq('venue_id', id)

    if (devices && devices.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete venue with devices. Remove devices first.',
        deviceCount: devices.length 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting venue:', error)
      return NextResponse.json({ error: 'Failed to delete venue' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'venue',
      entity_id: id,
      entity_name: venue?.venue_name,
      action: 'venue_deleted',
      action_category: 'admin',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Venue DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
