// app/api/admin/stats/route.ts
// Comprehensive admin stats API - returns all linked data for dashboard
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

    // Verify admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all stats in parallel
    const [
      usersResult,
      locationPartnersResult,
      referralPartnersResult,
      channelPartnersResult,
      relationshipPartnersResult,
      contractorsResult,
      employeesResult,
      venuesResult,
      devicesResult,
      commissionsResult,
      formsResult,
      submissionsResult,
    ] = await Promise.all([
      // Users - only count those with portal access (active)
      supabase.from('users').select('id, user_type, portal_status, is_admin, partner_record_id', { count: 'exact' }),
      
      // Location Partners by stage
      supabase.from('location_partners').select('id, pipeline_stage, status', { count: 'exact' }),
      
      // Referral Partners
      supabase.from('referral_partners').select('id, pipeline_stage, status', { count: 'exact' }),
      
      // Channel Partners
      supabase.from('channel_partners').select('id, pipeline_stage, status', { count: 'exact' }),
      
      // Relationship Partners
      supabase.from('relationship_partners').select('id, pipeline_stage, status', { count: 'exact' }),
      
      // Contractors
      supabase.from('contractors').select('id, pipeline_stage, status', { count: 'exact' }),
      
      // Employees
      supabase.from('employees').select('id, status', { count: 'exact' }),
      
      // Venues with location partner info
      supabase.from('venues').select('id, status, location_partner_id', { count: 'exact' }),
      
      // Devices with venue info
      supabase.from('devices').select('id, status, venue_id', { count: 'exact' }),
      
      // Monthly commissions
      supabase.from('monthly_commissions').select('id, status, amount', { count: 'exact' }),
      
      // Forms
      supabase.from('forms').select('id, status', { count: 'exact' }),
      
      // Form submissions
      supabase.from('form_submissions').select('id, status', { count: 'exact' }),
    ])

    // Process users
    const users = usersResult.data || []
    const activeUsers = users.filter(u => u.portal_status === 'account_active' || u.portal_status === 'active')
    const pendingUsers = users.filter(u => u.portal_status === 'pending_approval' || u.portal_status === 'pending_form')
    const adminUsers = users.filter(u => u.is_admin)
    
    // Count by user type
    const usersByType: Record<string, number> = {}
    users.forEach(u => {
      const type = u.user_type || 'unknown'
      usersByType[type] = (usersByType[type] || 0) + 1
    })

    // Process location partners
    const locationPartners = locationPartnersResult.data || []
    const lpByStage: Record<string, number> = {}
    locationPartners.forEach(lp => {
      const stage = lp.pipeline_stage || 'unknown'
      lpByStage[stage] = (lpByStage[stage] || 0) + 1
    })
    const activeLocationPartners = locationPartners.filter(lp => lp.status === 'active' || lp.pipeline_stage === 'active')
    const inPipelineLP = locationPartners.filter(lp => lp.pipeline_stage !== 'active' && lp.pipeline_stage !== 'inactive')

    // Process other partners
    const referralPartners = referralPartnersResult.data || []
    const activeReferralPartners = referralPartners.filter(rp => rp.status === 'active' || rp.pipeline_stage === 'active')
    
    const channelPartners = channelPartnersResult.data || []
    const activeChannelPartners = channelPartners.filter(cp => cp.status === 'active' || cp.pipeline_stage === 'active')
    
    const relationshipPartners = relationshipPartnersResult.data || []
    const activeRelationshipPartners = relationshipPartners.filter(rp => rp.status === 'active' || rp.pipeline_stage === 'active')
    
    const contractors = contractorsResult.data || []
    const activeContractors = contractors.filter(c => c.status === 'active' || c.pipeline_stage === 'active')
    
    const employees = employeesResult.data || []
    const activeEmployees = employees.filter(e => e.status === 'active')

    // Process venues
    const venues = venuesResult.data || []
    const activeVenues = venues.filter(v => v.status === 'active')
    const venuesInTrial = venues.filter(v => v.status === 'trial')
    const venuesByStatus: Record<string, number> = {}
    venues.forEach(v => {
      const status = v.status || 'unknown'
      venuesByStatus[status] = (venuesByStatus[status] || 0) + 1
    })

    // Process devices
    const devices = devicesResult.data || []
    const activeDevices = devices.filter(d => d.status === 'active' || d.status === 'online')
    const offlineDevices = devices.filter(d => d.status === 'offline')
    const devicesByStatus: Record<string, number> = {}
    devices.forEach(d => {
      const status = d.status || 'unknown'
      devicesByStatus[status] = (devicesByStatus[status] || 0) + 1
    })

    // Process commissions
    const commissions = commissionsResult.data || []
    const pendingCommissions = commissions.filter(c => c.status === 'pending')
    const paidCommissions = commissions.filter(c => c.status === 'paid')
    const totalPending = pendingCommissions.reduce((sum, c) => sum + (c.amount || 0), 0)
    const totalPaid = paidCommissions.reduce((sum, c) => sum + (c.amount || 0), 0)

    // Process forms
    const forms = formsResult.data || []
    const activeForms = forms.filter(f => f.status === 'active')
    
    const submissions = submissionsResult.data || []
    const newSubmissions = submissions.filter(s => s.status === 'new')
    const pendingSubmissions = submissions.filter(s => s.status === 'pending' || s.status === 'new')

    return NextResponse.json({
      success: true,
      stats: {
        // Users summary - THE KEY INSIGHT: Active users should match actual active partners
        users: {
          total: users.length,
          active: activeUsers.length,
          pending: pendingUsers.length,
          admins: adminUsers.length,
          byType: usersByType,
        },
        
        // Partners summary
        partners: {
          locationPartners: {
            total: locationPartners.length,
            active: activeLocationPartners.length,
            inPipeline: inPipelineLP.length,
            byStage: lpByStage,
          },
          referralPartners: {
            total: referralPartners.length,
            active: activeReferralPartners.length,
          },
          channelPartners: {
            total: channelPartners.length,
            active: activeChannelPartners.length,
          },
          relationshipPartners: {
            total: relationshipPartners.length,
            active: activeRelationshipPartners.length,
          },
          contractors: {
            total: contractors.length,
            active: activeContractors.length,
          },
          employees: {
            total: employees.length,
            active: activeEmployees.length,
          },
        },
        
        // Venues summary
        venues: {
          total: venues.length,
          active: activeVenues.length,
          inTrial: venuesInTrial.length,
          byStatus: venuesByStatus,
        },
        
        // Devices summary
        devices: {
          total: devices.length,
          active: activeDevices.length,
          offline: offlineDevices.length,
          byStatus: devicesByStatus,
        },
        
        // Commissions summary
        commissions: {
          pending: pendingCommissions.length,
          paid: paidCommissions.length,
          totalPending,
          totalPaid,
        },
        
        // Forms summary
        forms: {
          total: forms.length,
          active: activeForms.length,
          submissions: {
            total: submissions.length,
            new: newSubmissions.length,
            pending: pendingSubmissions.length,
          },
        },

        // Combined active count - this should match Total Users
        totalActivePartners: 
          activeLocationPartners.length + 
          activeReferralPartners.length + 
          activeChannelPartners.length + 
          activeRelationshipPartners.length +
          activeContractors.length +
          activeEmployees.length,
      },
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
