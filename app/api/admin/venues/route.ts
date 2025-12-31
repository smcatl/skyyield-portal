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
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')
    const status = searchParams.get('status')

    let query = supabase
      .from('venues')
      .select(`
        *,
        location_partner:location_partners(
          id,
          partner_id,
          contact_full_name,
          contact_email,
          company_legal_name,
          company_dba
        )
      `)
      .order('created_at', { ascending: false })

    if (partnerId) {
      query = query.eq('location_partner_id', partnerId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: venues, error } = await query

    if (error) throw error

    // Get device counts for each venue
    const venueIds = venues?.map(v => v.id) || []
    const { data: deviceCounts } = await supabase
      .from('devices')
      .select('venue_id')
      .in('venue_id', venueIds)

    const deviceCountMap: Record<string, number> = {}
    deviceCounts?.forEach(d => {
      if (d.venue_id) {
        deviceCountMap[d.venue_id] = (deviceCountMap[d.venue_id] || 0) + 1
      }
    })

    // Add device count and normalize field names for frontend
    const venuesWithCounts = venues?.map(v => ({
      ...v,
      // Map venue_name to name for frontend compatibility
      name: v.venue_name,
      deviceCount: deviceCountMap[v.id] || 0
    }))

    // Calculate stats
    const stats = {
      total: venues?.length || 0,
      active: venues?.filter(v => v.status === 'active').length || 0,
      trial: venues?.filter(v => v.status === 'trial' || v.trial_status === 'active').length || 0,
      pending: venues?.filter(v => v.status === 'pending').length || 0,
      inactive: venues?.filter(v => v.status === 'inactive').length || 0
    }

    return NextResponse.json({ venues: venuesWithCounts, stats })

  } catch (error) {
    console.error('Error fetching venues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    )
  }
}

// POST - Create new venue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = await auth()

    const {
      location_partner_id,
      venue_name,
      address_line_1,
      address_line_2,
      city,
      state,
      zip,
      venue_type,
      square_footage,
      monthly_visitors,
      status = 'pending'
    } = body

    // Validate required fields
    if (!venue_name || !city || !state) {
      return NextResponse.json(
        { error: 'Missing required fields: venue_name, city, state' },
        { status: 400 }
      )
    }

    // Generate venue_id
    const venueId = `VEN-${Date.now()}`

    const { data: venue, error } = await supabase
      .from('venues')
      .insert({
        venue_id: venueId,
        location_partner_id,
        venue_name,
        address_line_1,
        address_line_2,
        city,
        state,
        zip,
        venue_type,
        square_footage,
        monthly_visitors,
        status
      })
      .select()
      .single()

    if (error) throw error

    // Log activity (fire and forget)
    supabase.from('activity_log').insert({
      actor_id: userId,
      action: 'venue_created',
      entity_type: 'venue',
      entity_id: venue.id,
      details: { venue_id: venueId, venue_name, location_partner_id }
    })

    return NextResponse.json({ venue })

  } catch (error) {
    console.error('Error creating venue:', error)
    return NextResponse.json(
      { error: 'Failed to create venue' },
      { status: 500 }
    )
  }
}

// PUT - Update venue
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = await auth()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      )
    }

    const { data: venue, error } = await supabase
      .from('venues')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log activity (fire and forget)
    supabase.from('activity_log').insert({
      actor_id: userId,
      action: 'venue_updated',
      entity_type: 'venue',
      entity_id: id,
      details: { updates }
    })

    return NextResponse.json({ venue })

  } catch (error) {
    console.error('Error updating venue:', error)
    return NextResponse.json(
      { error: 'Failed to update venue' },
      { status: 500 }
    )
  }
}

// DELETE - Delete venue
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const { userId } = await auth()

    if (!id) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      )
    }

    // Check for devices linked to this venue
    const { data: devices } = await supabase
      .from('devices')
      .select('id')
      .eq('venue_id', id)

    if (devices && devices.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete venue with ${devices.length} linked devices. Remove devices first.` },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Log activity (fire and forget)
    supabase.from('activity_log').insert({
      actor_id: userId,
      action: 'venue_deleted',
      entity_type: 'venue',
      entity_id: id,
      details: {}
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting venue:', error)
    return NextResponse.json(
      { error: 'Failed to delete venue' },
      { status: 500 }
    )
  }
}
