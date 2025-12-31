// =============================================================================
// app/api/admin/overview/route.ts
// Admin Overview Stats API - Returns all stats for admin dashboard
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get all counts in parallel for performance
    const [
      usersResult,
      venuesResult,
      devicesResult,
      pipelineResult,
      productsResult,
      approvedProductsResult,
    ] = await Promise.all([
      // Users count
      supabase.from('users').select('id, status, is_approved', { count: 'exact' }),
      
      // Venues count
      supabase.from('venues').select('id, status', { count: 'exact' }),
      
      // Devices count
      supabase.from('devices').select('id, status', { count: 'exact' }),
      
      // Pipeline partners count (location_partners)
      supabase.from('location_partners').select('id, pipeline_stage', { count: 'exact' }),
      
      // Store products count
      supabase.from('products').select('id, show_in_store', { count: 'exact' }),
      
      // Approved products count
      supabase.from('approved_products').select('id', { count: 'exact' }),
    ])

    // Calculate user stats
    const users = usersResult.data || []
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.status === 'account_active' || u.is_approved === true).length

    // Calculate venue stats
    const venues = venuesResult.data || []
    const totalVenues = venues.length
    const activeVenues = venues.filter(v => v.status === 'active').length

    // Calculate device stats
    const devices = devicesResult.data || []
    const totalDevices = devices.length
    const onlineDevices = devices.filter(d => d.status === 'online' || d.status === 'active').length

    // Calculate pipeline stats
    const partners = pipelineResult.data || []
    const inPipeline = partners.filter(p => 
      p.pipeline_stage && 
      !['active', 'inactive', 'denied'].includes(p.pipeline_stage)
    ).length
    const activePartners = partners.filter(p => p.pipeline_stage === 'active').length

    // Products
    const products = productsResult.data || []
    const storeProducts = products.filter(p => p.show_in_store !== false).length

    const approvedProducts = approvedProductsResult.count || 0

    return NextResponse.json({
      success: true,
      stats: {
        // Users
        totalUsers,
        activeUsers,
        
        // Venues
        totalVenues,
        activeVenues,
        
        // Devices
        totalDevices,
        onlineDevices,
        
        // Pipeline
        inPipeline,
        activePartners,
        
        // Products
        storeProducts,
        approvedProducts,
      }
    })

  } catch (error) {
    console.error('GET /api/admin/overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
