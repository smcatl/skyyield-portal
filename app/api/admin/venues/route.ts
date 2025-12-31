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
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const partnerId = searchParams.get('partnerId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (id) {
      const { data: venue, error } = await supabase.from('venues').select('*, location_partners(id, partner_id, company_legal_name, contact_first_name, contact_last_name, contact_email)').eq('id', id).single()
      if (error) throw error
      return NextResponse.json({ venue })
    }

    let query = supabase.from('venues').select('*, location_partners(id, partner_id, company_legal_name, contact_first_name, contact_last_name)').order('created_at', { ascending: false }).limit(limit)
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

    return NextResponse.json({ venues: venues?.map(v => ({ ...v, device_count: deviceCounts[v.id] || 0 })) })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch venues', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { count } = await supabase.from('venues').select('*', { count: 'exact', head: true }).eq('location_partner_id', body.location_partner_id)
    const { data, error } = await supabase.from('venues').insert([{ ...body, venue_id: `VEN-${((count || 0) + 1).toString().padStart(3, '0')}`, status: body.status || 'pending' }]).select().single()
    if (error) throw error
    return NextResponse.json({ success: true, venue: data })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create venue', details: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'Venue ID required' }, { status: 400 })
    const { data, error } = await supabase.from('venues').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json({ success: true, venue: data })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update venue', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Venue ID required' }, { status: 400 })
    const { error } = await supabase.from('venues').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete venue', details: error.message }, { status: 500 })
  }
}
