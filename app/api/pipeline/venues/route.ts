// app/api/pipeline/venues/route.ts
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
  const partnerId = searchParams.get('partnerId')
  const status = searchParams.get('status')
  const includeDevices = searchParams.get('includeDevices') === 'true'

  try {
    if (id) {
      const { data: venue, error } = await supabase
        .from('venues').select('*').eq('id', id).single()
      if (error) throw error
      const response: any = { venue }
      if (includeDevices) {
        const { data: devices } = await supabase.from('devices').select('*').eq('venue_id', id)
        response.devices = devices || []
      }
      return NextResponse.json(response)
    }

    let query = supabase.from('venues').select('*').order('created_at', { ascending: false })
    if (partnerId) query = query.eq('location_partner_id', partnerId)
    if (status) query = query.eq('status', status)
    const { data, error } = await query.limit(100)
    if (error) throw error
    return NextResponse.json({ venues: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await request.json()

    const { count } = await supabase.from('venues')
      .select('*', { count: 'exact', head: true })
      .eq('location_partner_id', body.location_partner_id)
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
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select().single()
    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'venue',
      entity_id: data.id,
      entity_name: data.venue_name,
      user_id: userId,
      action: 'venue_created',
      action_category: 'pipeline',
    }])
    return NextResponse.json({ success: true, venue: data })
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

    updates.updated_at = new Date().toISOString()
    const { data, error } = await supabase.from('venues')
      .update(updates).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json({ success: true, venue: data })
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

    const { data: venue } = await supabase.from('venues')
      .select('venue_name').eq('id', id).single()

    const { error } = await supabase.from('venues').delete().eq('id', id)
    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'venue',
      entity_id: id,
      entity_name: venue?.venue_name,
      user_id: userId,
      action: 'venue_deleted',
      action_category: 'pipeline',
    }])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
