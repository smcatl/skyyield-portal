// API Route: Venues (Supabase)
// app/api/pipeline/venues/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// GET: Fetch venues
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const partnerId = searchParams.get('partnerId') || searchParams.get('location_partner_id')

    // Single venue fetch
    if (id) {
      const { data: venue, error } = await supabase
        .from('venues')
        .select('*, location_partners(*), devices(*)')
        .eq('id', id)
        .single()

      if (error || !venue) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      return NextResponse.json({ venue })
    }

    // List venues
    let query = supabase.from('venues').select('*, location_partners(company_legal_name, dba_name)')

    if (partnerId) {
      query = query.eq('location_partner_id', partnerId)
    }

    const search = searchParams.get('search')?.toLowerCase()
    if (search) {
      query = query.or(`venue_name.ilike.%${search}%,city.ilike.%${search}%`)
    }

    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }

    const { data: venues, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ venues: venues || [] })
  } catch (error) {
    console.error('GET /api/pipeline/venues error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create venue
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const venueData = {
      location_partner_id: body.locationPartnerId || body.location_partner_id,
      venue_name: body.venueName || body.venue_name,
      venue_type: body.venueType || body.venue_type,
      address_line_1: body.address1 || body.address_line_1,
      address_line_2: body.address2 || body.address_line_2,
      city: body.city,
      state: body.state,
      zip: body.zip,
      square_footage: body.squareFootage || body.square_footage,
      floors: body.floors || 1,
      monthly_visitors: body.monthlyVisitors || body.monthly_visitors,
      existing_network: body.existingNetwork || body.existing_network || false,
      existing_isp: body.existingIsp || body.existing_isp,
      site_contact_name: body.siteContactName || body.site_contact_name,
      site_contact_phone: body.siteContactPhone || body.site_contact_phone,
      site_contact_email: body.siteContactEmail || body.site_contact_email,
      status: 'pending',
      notes: body.notes,
    }

    const { data: venue, error } = await supabase
      .from('venues')
      .insert(venueData)
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'venue',
      entity_id: venue.id,
      action: 'created',
      description: `Venue "${venue.venue_name}" created`,
    })

    return NextResponse.json({ venue }, { status: 201 })
  } catch (error) {
    console.error('POST /api/pipeline/venues error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update venue
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
      venueName: 'venue_name',
      venueType: 'venue_type',
      addressLine1: 'address_line_1',
      addressLine2: 'address_line_2',
      squareFootage: 'square_footage',
      monthlyVisitors: 'monthly_visitors',
      existingNetwork: 'existing_network',
      existingIsp: 'existing_isp',
      siteContactName: 'site_contact_name',
      siteContactPhone: 'site_contact_phone',
      siteContactEmail: 'site_contact_email',
      installationDate: 'installation_date',
      goLiveDate: 'go_live_date',
    }

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key] || key
      updateData[dbField] = value
    }

    const { data: venue, error } = await supabase
      .from('venues')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ venue })
  } catch (error) {
    console.error('PUT /api/pipeline/venues error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove venue
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase.from('venues').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/pipeline/venues error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
