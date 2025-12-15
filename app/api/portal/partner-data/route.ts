// API Route: Partner Portal Data
// app/api/portal/partner-data/route.ts
// Fetches all portal data for a specific partner (venues, devices, stats)

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { auth, currentUser } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    
    // Get partner type and ID from query params or auth
    let partnerType = searchParams.get('partnerType') || 'location_partner'
    let partnerId = searchParams.get('partnerId')
    
    // If no partnerId provided, get from authenticated user
    if (!partnerId) {
      const user = await currentUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      // Get partner ID from user metadata
      partnerId = (user.unsafeMetadata as any)?.partnerId
      partnerType = (user.unsafeMetadata as any)?.userType || partnerType
      
      // Also try to find by clerk_user_id in profiles
      if (!partnerId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, user_type')
          .eq('clerk_user_id', user.id)
          .single()
        
        if (profile) {
          partnerId = profile.id
          partnerType = profile.user_type
        }
      }
    }

    if (!partnerId) {
      // Return empty data for preview mode
      return NextResponse.json({
        partner: null,
        venues: [],
        devices: [],
        stats: {
          totalVenues: 0,
          activeVenues: 0,
          totalDevices: 0,
          onlineDevices: 0,
          totalDataGB: 0,
          monthlyEarnings: 0,
          pendingPayments: 0,
        },
        referrals: [],
        commissions: [],
      })
    }

    // Fetch based on partner type
    let partnerData: any = null
    let venues: any[] = []
    let devices: any[] = []
    let referrals: any[] = []
    let commissions: any[] = []

    if (partnerType === 'location_partner') {
      // Get location partner profile
      const { data: partner } = await supabase
        .from('location_partners')
        .select('*')
        .eq('id', partnerId)
        .single()
      
      partnerData = partner

      // Get venues for this partner
      const { data: venueData } = await supabase
        .from('venues')
        .select('*')
        .eq('location_partner_id', partnerId)
        .order('created_at', { ascending: false })

      venues = venueData || []

      // Get devices for these venues
      if (venues.length > 0) {
        const venueIds = venues.map(v => v.id)
        const { data: deviceData } = await supabase
          .from('devices')
          .select('*, venues(venue_name), products(name, sku)')
          .in('venue_id', venueIds)
          .order('created_at', { ascending: false })
        
        devices = deviceData || []
      }

      // Get commissions
      const { data: commissionData } = await supabase
        .from('monthly_commissions')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('partner_type', 'location_partner')
        .order('commission_month', { ascending: false })
        .limit(12)
      
      commissions = commissionData || []

    } else if (partnerType === 'referral_partner') {
      // Get referral partner profile
      const { data: partner } = await supabase
        .from('referral_partners')
        .select('*')
        .eq('id', partnerId)
        .single()
      
      partnerData = partner

      // Get their referrals (location partners they referred)
      const { data: referralData } = await supabase
        .from('location_partners')
        .select('*, venues(*)')
        .eq('referred_by_partner_id', partnerId)
        .order('created_at', { ascending: false })
      
      referrals = referralData || []

      // Get all venues from their referrals
      const allVenues = referrals.flatMap(r => r.venues || [])
      venues = allVenues

      // Get all devices from those venues
      if (allVenues.length > 0) {
        const venueIds = allVenues.map(v => v.id)
        const { data: deviceData } = await supabase
          .from('devices')
          .select('*, venues(venue_name, location_partner_id)')
          .in('venue_id', venueIds)
        
        devices = deviceData || []
      }

      // Get commissions
      const { data: commissionData } = await supabase
        .from('monthly_commissions')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('partner_type', 'referral_partner')
        .order('commission_month', { ascending: false })
        .limit(12)
      
      commissions = commissionData || []

    } else if (partnerType === 'channel_partner') {
      // Get channel partner profile
      const { data: partner } = await supabase
        .from('channel_partners')
        .select('*')
        .eq('id', partnerId)
        .single()
      
      partnerData = partner

      // Get clients they brought in
      const { data: clientData } = await supabase
        .from('location_partners')
        .select('*, venues(*)')
        .eq('channel_partner_id', partnerId)
        .order('created_at', { ascending: false })
      
      referrals = clientData || []

      // Get all venues from their clients
      const allVenues = referrals.flatMap(r => r.venues || [])
      venues = allVenues

      // Get commissions
      const { data: commissionData } = await supabase
        .from('monthly_commissions')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('partner_type', 'channel_partner')
        .order('commission_month', { ascending: false })
        .limit(12)
      
      commissions = commissionData || []

    } else if (partnerType === 'relationship_partner') {
      // Get relationship partner profile
      const { data: partner } = await supabase
        .from('relationship_partners')
        .select('*')
        .eq('id', partnerId)
        .single()
      
      partnerData = partner

      // Get introductions they made
      const { data: introData } = await supabase
        .from('location_partners')
        .select('*, venues(*)')
        .eq('relationship_partner_id', partnerId)
        .order('created_at', { ascending: false })
      
      referrals = introData || []
      
      const allVenues = referrals.flatMap(r => r.venues || [])
      venues = allVenues

      // Get commissions
      const { data: commissionData } = await supabase
        .from('monthly_commissions')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('partner_type', 'relationship_partner')
        .order('commission_month', { ascending: false })
        .limit(12)
      
      commissions = commissionData || []
    }

    // Calculate stats
    const activeVenues = venues.filter(v => v.status === 'active' || v.status === 'live')
    const onlineDevices = devices.filter(d => d.status === 'online' || d.status === 'active')
    const totalDataGB = devices.reduce((sum, d) => sum + (d.data_usage_gb || d.dataUsageGB || 0), 0)
    const monthlyEarnings = commissions.length > 0 ? (commissions[0]?.amount || 0) : 0
    const pendingPayments = commissions.filter(c => c.status === 'pending' || c.status === 'approved').reduce((sum, c) => sum + (c.amount || 0), 0)

    const stats = {
      totalVenues: venues.length,
      activeVenues: activeVenues.length,
      totalDevices: devices.length,
      onlineDevices: onlineDevices.length,
      totalDataGB: Math.round(totalDataGB * 100) / 100,
      monthlyEarnings: Math.round(monthlyEarnings * 100) / 100,
      pendingPayments: Math.round(pendingPayments * 100) / 100,
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(r => r.status === 'active' || r.status === 'approved').length,
    }

    // Transform data for frontend
    const transformedVenues = venues.map(v => ({
      id: v.id,
      name: v.venue_name || v.name,
      address: v.address_line_1 || v.address,
      city: v.city,
      state: v.state,
      type: v.venue_type || v.type,
      status: v.status,
      devicesInstalled: devices.filter(d => d.venue_id === v.id).length,
      dataUsageGB: devices.filter(d => d.venue_id === v.id).reduce((sum, d) => sum + (d.data_usage_gb || 0), 0),
      monthlyEarnings: 0, // Would need to calculate from commissions
      squareFootage: v.square_footage,
      monthlyVisitors: v.monthly_visitors,
    }))

    const transformedDevices = devices.map(d => ({
      id: d.id,
      name: d.device_name || d.name,
      type: d.products?.name || d.device_type || d.model,
      serialNumber: d.serial_number,
      macAddress: d.mac_address,
      venueId: d.venue_id,
      venueName: d.venues?.venue_name || '',
      status: d.status === 'active' || d.status === 'online' ? 'online' : d.status === 'offline' ? 'offline' : 'maintenance',
      dataUsageGB: d.data_usage_gb || 0,
      lastSeen: d.last_seen_online || d.updated_at,
      installedAt: d.installed_at || d.created_at,
    }))

    const transformedReferrals = referrals.map(r => ({
      id: r.id,
      companyName: r.company_legal_name || r.company_name || r.dba_name,
      contactName: r.contact_name,
      email: r.contact_email || r.email,
      status: r.status,
      createdAt: r.created_at,
      venueCount: r.venues?.length || 0,
    }))

    return NextResponse.json({
      partner: partnerData,
      venues: transformedVenues,
      devices: transformedDevices,
      stats,
      referrals: transformedReferrals,
      commissions,
    })

  } catch (error) {
    console.error('GET /api/portal/partner-data error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
