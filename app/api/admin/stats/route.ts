import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch all stats in parallel
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
      formSubmissionsResult
    ] = await Promise.all([
      // Users
      supabase.from('users').select('id, portal_status, is_admin, roles'),
      // Location Partners
      supabase.from('location_partners').select('id, stage, portal_status'),
      // Referral Partners
      supabase.from('referral_partners').select('id, stage, portal_status'),
      // Channel Partners
      supabase.from('channel_partners').select('id, stage, portal_status'),
      // Relationship Partners
      supabase.from('relationship_partners').select('id, stage, portal_status'),
      // Contractors
      supabase.from('contractors').select('id, stage, portal_status'),
      // Employees
      supabase.from('employees').select('id, stage, portal_status'),
      // Venues
      supabase.from('venues').select('id, status'),
      // Devices
      supabase.from('devices').select('id, status'),
      // Commissions
      supabase.from('commissions').select('id, status, amount'),
      // Forms
      supabase.from('forms').select('id, is_active'),
      // Form Submissions
      supabase.from('form_submissions').select('id, status, created_at')
    ])

    // Calculate user stats
    const users = usersResult.data || []
    const activeStatuses = ['active', 'account_active', 'approved']
    const activeUsers = users.filter(u => activeStatuses.includes(u.portal_status || ''))
    const pendingUsers = users.filter(u => u.portal_status === 'pending' || u.portal_status === 'pending_approval')
    const admins = users.filter(u => u.is_admin)

    // Count by role type
    const usersByType: Record<string, number> = {}
    users.forEach(u => {
      const roles = u.roles || []
      roles.forEach((role: string) => {
        usersByType[role] = (usersByType[role] || 0) + 1
      })
    })

    // Helper to count partner stats
    const countPartnerStats = (partners: any[]) => {
      const active = partners.filter(p => 
        activeStatuses.includes(p.portal_status || '') || p.stage === 'active'
      )
      const inPipeline = partners.filter(p => 
        !['active', 'inactive', 'rejected', 'account_active'].includes(p.stage || '') &&
        !activeStatuses.includes(p.portal_status || '')
      )
      
      // Group by stage
      const byStage: Record<string, number> = {}
      partners.forEach(p => {
        const stage = p.stage || 'unknown'
        byStage[stage] = (byStage[stage] || 0) + 1
      })

      return {
        total: partners.length,
        active: active.length,
        inPipeline: inPipeline.length,
        byStage
      }
    }

    // Partner stats
    const locationPartners = countPartnerStats(locationPartnersResult.data || [])
    const referralPartners = countPartnerStats(referralPartnersResult.data || [])
    const channelPartners = countPartnerStats(channelPartnersResult.data || [])
    const relationshipPartners = countPartnerStats(relationshipPartnersResult.data || [])
    const contractors = countPartnerStats(contractorsResult.data || [])
    const employees = countPartnerStats(employeesResult.data || [])

    // Total active partners (these become "users" with portal access)
    const totalActivePartners = 
      locationPartners.active + 
      referralPartners.active + 
      channelPartners.active + 
      relationshipPartners.active + 
      contractors.active + 
      employees.active

    // Venue stats
    const venues = venuesResult.data || []
    const venueStats = {
      total: venues.length,
      active: venues.filter(v => v.status === 'active').length,
      inTrial: venues.filter(v => v.status === 'trial').length,
      pending: venues.filter(v => v.status === 'pending').length,
      inactive: venues.filter(v => v.status === 'inactive').length,
      byStatus: venues.reduce((acc: Record<string, number>, v) => {
        const status = v.status || 'unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
    }

    // Device stats
    const devices = devicesResult.data || []
    const deviceStats = {
      total: devices.length,
      active: devices.filter(d => d.status === 'active' || d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      pending: devices.filter(d => d.status === 'pending').length,
      byStatus: devices.reduce((acc: Record<string, number>, d) => {
        const status = d.status || 'unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
    }

    // Commission stats
    const commissions = commissionsResult.data || []
    const pendingCommissions = commissions.filter(c => c.status === 'pending')
    const paidCommissions = commissions.filter(c => c.status === 'paid')
    const commissionStats = {
      pending: pendingCommissions.length,
      paid: paidCommissions.length,
      totalPending: pendingCommissions.reduce((sum, c) => sum + (c.amount || 0), 0),
      totalPaid: paidCommissions.reduce((sum, c) => sum + (c.amount || 0), 0)
    }

    // Form stats
    const forms = formsResult.data || []
    const submissions = formSubmissionsResult.data || []
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const newSubmissions = submissions.filter(s => new Date(s.created_at) > weekAgo)
    const pendingSubmissions = submissions.filter(s => s.status === 'pending' || s.status === 'new')

    const formStats = {
      total: forms.length,
      active: forms.filter(f => f.is_active).length,
      submissions: {
        total: submissions.length,
        new: newSubmissions.length,
        pending: pendingSubmissions.length
      }
    }

    return NextResponse.json({
      users: {
        total: users.length,
        active: activeUsers.length,
        pending: pendingUsers.length,
        admins: admins.length,
        byType: usersByType,
        // This should match total active partners
        note: 'Total Users should equal Active Partners with portal access'
      },
      partners: {
        locationPartners,
        referralPartners,
        channelPartners,
        relationshipPartners,
        contractors,
        employees,
        totalActive: totalActivePartners,
        totalInPipeline: 
          locationPartners.inPipeline + 
          referralPartners.inPipeline + 
          channelPartners.inPipeline + 
          relationshipPartners.inPipeline + 
          contractors.inPipeline + 
          employees.inPipeline
      },
      venues: venueStats,
      devices: deviceStats,
      commissions: commissionStats,
      forms: formStats
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
