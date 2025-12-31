// =============================================================================
// app/api/admin/venues/route.ts
// Admin API for Venues - WITH location_partners join
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
    const partnerId = searchParams.get('partnerId')
    const status = searchParams.get('status')

    // Single venue fetch
    if (id) {
      const { data: venue, error } = await supabase
        .from('venues')
        .select(`
          *,
          location_partners (
            id,
            partner_id,
            company_legal_name,
            contact_first_name,
            contact_last_name,
            contact_email
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Get device count
      const { count } = await supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', id)

      return NextResponse.json({ 
        venue: { ...venue, device_count: count || 0 } 
      })
    }

    // List all venues with partner info
    let query = supabase
      .from('venues')
      .select(`
        *,
        location_partners (
          id,
          partner_id,
          company_legal_name,
          contact_first_name,
          contact_last_name,
          contact_email
        )
      `)
      .order('created_at', { ascending: false })

    if (partnerId) {
      query = query.eq('location_partner_id', partnerId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: venues, error } = await query.limit(200)

    if (error) {
      console.error('Venues fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get device counts for each venue
    const venueIds = venues?.map(v => v.id) || []
    let deviceCounts: Record<string, number> = {}
    
    if (venueIds.length > 0) {
      const { data: devices } = await supabase
        .from('devices')
        .select('venue_id')
        .in('venue_id', venueIds)

      if (devices) {
        devices.forEach(d => {
          deviceCounts[d.venue_id] = (deviceCounts[d.venue_id] || 0) + 1
        })
      }
    }

    // Add device counts to venues
    const venuesWithCounts = venues?.map(v => ({
      ...v,
      device_count: deviceCounts[v.id] || 0
    })) || []

    return NextResponse.json({ venues: venuesWithCounts })

  } catch (error) {
    console.error('GET /api/admin/venues error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate venue_id
    const { count } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true })

    const venueId = `VEN-${String((count || 0) + 1).padStart(3, '0')}`

    const { data, error } = await supabase
      .from('venues')
      .insert({
        venue_id: venueId,
        venue_name: body.venue_name,
        venue_type: body.venue_type,
        address_line_1: body.address_line_1,
        city: body.city,
        state: body.state,
        zip: body.zip,
        location_partner_id: body.location_partner_id || null,
        status: body.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        location_partners (
          id,
          partner_id,
          company_legal_name
        )
      `)
      .single()

    if (error) {
      console.error('Venue create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, venue: data })

  } catch (error) {
    console.error('POST /api/admin/venues error:', error)
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
      .from('venues')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        location_partners (
          id,
          partner_id,
          company_legal_name
        )
      `)
      .single()

    if (error) {
      console.error('Venue update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, venue: data })

  } catch (error) {
    console.error('PUT /api/admin/venues error:', error)
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
      .from('venues')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE /api/admin/venues error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
