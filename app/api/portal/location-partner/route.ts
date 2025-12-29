// app/api/portal/location-partner/route.ts
// Updated to support multi-location partners (parent-child relationship)

import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Get current user from Clerk
    const { userId } = await auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress

    // First, find user in users table
    const { data: userData } = await supabase
      .from('users')
      .select('id, user_type')
      .eq('clerk_id', userId)
      .single()

    // Find the primary location partner record
    let partner = null
    let partnerIds: string[] = [] // All partner IDs this user can access

    if (userData?.id) {
      // Try by user_id link first
      const { data } = await supabase
        .from('location_partners')
        .select('*')
        .eq('user_id', userData.id)
        .single()
      partner = data
    }

    if (!partner && userEmail) {
      // Fallback: try by email
      const { data } = await supabase
        .from('location_partners')
        .select('*')
        .eq('contact_email', userEmail)
        .single()
      partner = data

      // Auto-link if found by email but not linked
      if (partner && userData?.id && !partner.user_id) {
        await supabase
          .from('location_partners')
          .update({ user_id: userData.id })
          .eq('id', partner.id)
      }
    }

    if (!partner) {
      return NextResponse.json({ 
        success: false, 
        error: 'No location partner account found for this user' 
      }, { status: 404 })
    }

    // Get all partner IDs this user can access (own + children)
    partnerIds = [partner.id]

    // Find child partners (locations that roll up to this partner)
    const { data: childPartners } = await supabase
      .from('location_partners')
      .select('id, partner_id, company_legal_name, contact_email, pipeline_stage')
      .eq('parent_partner_id', partner.id)

    if (childPartners && childPartners.length > 0) {
      partnerIds = [...partnerIds, ...childPartners.map(c => c.id)]
    }

    // Fetch ALL venues for this partner and any child partners
    const { data: venues } = await supabase
      .from('venues')
      .select(`
        id,
        venue_name,
        address,
        city,
        state,
        zip,
        square_footage,
        venue_type,
        location_partner_id
      `)
      .in('location_partner_id', partnerIds)
      .order('venue_name')

    // Fetch ALL devices across all venues
    const venueIds = venues?.map(v => v.id) || []
    const { data: devices } = await supabase
      .from('devices')
      .select(`
        id,
        device_id,
        device_name,
        device_type,
        mac_address,
        status,
        venue_id,
        last_seen,
        monthly_data_gb,
        monthly_earnings
      `)
      .in('venue_id', venueIds)
      .order('device_name')

    // Fetch commission history for ALL partners
    const { data: commissions } = await supabase
      .from('commissions')
      .select('*')
      .in('location_partner_id', partnerIds)
      .order('commission_month', { ascending: false })
      .limit(24)

    // Calculate totals
    const totalVenues = venues?.length || 0
    const totalDevices = devices?.length || 0
    const activeDevices = devices?.filter(d => d.status === 'active').length || 0
    const totalEarnings = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
    const thisMonthEarnings = commissions?.[0]?.amount || 0

    // Enhance venues with device counts
    const venuesWithDevices = venues?.map(venue => ({
      ...venue,
      deviceCount: devices?.filter(d => d.venue_id === venue.id).length || 0,
      activeDeviceCount: devices?.filter(d => d.venue_id === venue.id && d.status === 'active').length || 0,
    }))

    // Include child partner info for reference
    const managedLocations = childPartners?.map(cp => ({
      id: cp.id,
      partnerId: cp.partner_id,
      companyName: cp.company_legal_name,
      email: cp.contact_email,
      stage: cp.pipeline_stage,
    })) || []

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        partner_id: partner.partner_id,
        company_legal_name: partner.company_legal_name,
        dba_name: partner.dba_name,
        contact_first_name: partner.contact_first_name,
        contact_last_name: partner.contact_last_name,
        contact_email: partner.contact_email,
        contact_phone: partner.contact_phone,
        pipeline_stage: partner.pipeline_stage,
        commission_type: partner.commission_type,
        commission_percentage: partner.commission_percentage,
        commission_flat_fee: partner.commission_flat_fee,
        tipalti_payee_id: partner.tipalti_payee_id,
        tipalti_status: partner.tipalti_status,
        last_payment_amount: partner.last_payment_amount,
        last_payment_date: partner.last_payment_date,
        trial_status: partner.trial_status,
        trial_end_date: partner.trial_end_date,
        contract_status: partner.contract_status,
        loi_status: partner.loi_status,
        // Multi-location fields
        hasChildPartners: managedLocations.length > 0,
        managedLocationCount: managedLocations.length,
      },
      // Stats
      stats: {
        totalVenues,
        totalDevices,
        activeDevices,
        totalEarnings,
        thisMonthEarnings,
        managedLocations: managedLocations.length,
      },
      // Data
      venues: venuesWithDevices || [],
      devices: devices || [],
      commissions: commissions || [],
      managedLocations, // Child partners this user manages
    })

  } catch (error) {
    console.error('Location partner portal error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - Update partner profile or add venue
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    // Get user's partner record
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: partner } = await supabase
      .from('location_partners')
      .select('id')
      .eq('user_id', userData.id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    switch (action) {
      case 'update_profile':
        const { contact_phone, company_address, company_city, company_state, company_zip } = body
        await supabase
          .from('location_partners')
          .update({
            contact_phone,
            company_address1: company_address,
            company_city,
            company_state,
            company_zip,
            updated_at: new Date().toISOString(),
          })
          .eq('id', partner.id)
        return NextResponse.json({ success: true, message: 'Profile updated' })

      case 'add_venue':
        const { venue_name, address, city, state, zip, venue_type, square_footage } = body
        const { data: newVenue, error: venueError } = await supabase
          .from('venues')
          .insert({
            location_partner_id: partner.id,
            venue_name,
            address,
            city,
            state,
            zip,
            venue_type,
            square_footage,
            status: 'pending',
          })
          .select()
          .single()

        if (venueError) {
          return NextResponse.json({ error: venueError.message }, { status: 500 })
        }
        return NextResponse.json({ success: true, venue: newVenue })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Location partner POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
