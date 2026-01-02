// app/api/admin/settings/role-permissions/route.ts
// CRUD for role_tab_permissions table

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Default tabs configuration grouped by section
const DEFAULT_TABS = [
  // ===== ADMIN PORTAL =====
  { tab_key: 'admin_dashboard', tab_name: 'Dashboard', portal: 'admin', section: 'Admin Portal' },
  { tab_key: 'admin_pipeline', tab_name: 'Pipeline', portal: 'admin', section: 'Admin Portal' },
  { tab_key: 'admin_partners', tab_name: 'Partners', portal: 'admin', section: 'Admin Portal' },
  { tab_key: 'admin_venues', tab_name: 'Venues', portal: 'admin', section: 'Admin Portal' },
  { tab_key: 'admin_devices', tab_name: 'Devices', portal: 'admin', section: 'Admin Portal' },
  { tab_key: 'admin_earnings', tab_name: 'Earnings', portal: 'admin', section: 'Admin Portal' },
  { tab_key: 'admin_analytics', tab_name: 'Analytics', portal: 'admin', section: 'Admin Portal' },
  { tab_key: 'admin_settings', tab_name: 'Settings', portal: 'admin', section: 'Admin Portal' },

  // ===== LOCATION PARTNER PORTAL =====
  { tab_key: 'lp_dashboard', tab_name: 'Overview', portal: 'location_partner', section: 'Location Partner Portal' },
  { tab_key: 'lp_venues', tab_name: 'My Venues', portal: 'location_partner', section: 'Location Partner Portal' },
  { tab_key: 'lp_devices', tab_name: 'My Devices', portal: 'location_partner', section: 'Location Partner Portal' },
  { tab_key: 'lp_earnings', tab_name: 'Earnings', portal: 'location_partner', section: 'Location Partner Portal' },
  { tab_key: 'lp_documents', tab_name: 'Documents', portal: 'location_partner', section: 'Location Partner Portal' },
  { tab_key: 'lp_support', tab_name: 'Support', portal: 'location_partner', section: 'Location Partner Portal' },
  { tab_key: 'lp_settings', tab_name: 'Settings', portal: 'location_partner', section: 'Location Partner Portal' },

  // ===== REFERRAL PARTNER PORTAL =====
  { tab_key: 'rp_dashboard', tab_name: 'Overview', portal: 'referral_partner', section: 'Referral Partner Portal' },
  { tab_key: 'rp_referrals', tab_name: 'My Referrals', portal: 'referral_partner', section: 'Referral Partner Portal' },
  { tab_key: 'rp_earnings', tab_name: 'Earnings', portal: 'referral_partner', section: 'Referral Partner Portal' },
  { tab_key: 'rp_marketing', tab_name: 'Marketing', portal: 'referral_partner', section: 'Referral Partner Portal' },
  { tab_key: 'rp_documents', tab_name: 'Documents', portal: 'referral_partner', section: 'Referral Partner Portal' },
  { tab_key: 'rp_settings', tab_name: 'Settings', portal: 'referral_partner', section: 'Referral Partner Portal' },

  // ===== CHANNEL PARTNER PORTAL =====
  { tab_key: 'cp_dashboard', tab_name: 'Overview', portal: 'channel_partner', section: 'Channel Partner Portal' },
  { tab_key: 'cp_clients', tab_name: 'My Clients', portal: 'channel_partner', section: 'Channel Partner Portal' },
  { tab_key: 'cp_earnings', tab_name: 'Earnings', portal: 'channel_partner', section: 'Channel Partner Portal' },
  { tab_key: 'cp_documents', tab_name: 'Documents', portal: 'channel_partner', section: 'Channel Partner Portal' },
  { tab_key: 'cp_settings', tab_name: 'Settings', portal: 'channel_partner', section: 'Channel Partner Portal' },

  // ===== CONTRACTOR PORTAL =====
  { tab_key: 'contractor_dashboard', tab_name: 'Overview', portal: 'contractor', section: 'Contractor Portal' },
  { tab_key: 'contractor_jobs', tab_name: 'My Jobs', portal: 'contractor', section: 'Contractor Portal' },
  { tab_key: 'contractor_schedule', tab_name: 'Schedule', portal: 'contractor', section: 'Contractor Portal' },
  { tab_key: 'contractor_earnings', tab_name: 'Earnings', portal: 'contractor', section: 'Contractor Portal' },
  { tab_key: 'contractor_settings', tab_name: 'Settings', portal: 'contractor', section: 'Contractor Portal' },
]

// GET - List permissions for a role or all roles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    // Get all permissions
    let query = supabase
      .from('role_tab_permissions')
      .select('*')

    if (role) {
      query = query.eq('role', role)
    }

    const { data, error } = await query

    if (error) {
      console.error('[role-permissions] GET error:', error)
      throw error
    }

    // Return tabs config along with permissions
    return NextResponse.json({
      permissions: data || [],
      tabs: DEFAULT_TABS,
    })
  } catch (error: any) {
    console.error('[role-permissions] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create or update permissions for a role
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role, tab_key, can_view, can_edit } = body

    if (!role || !tab_key) {
      return NextResponse.json({ error: 'Role and tab_key are required' }, { status: 400 })
    }

    // Upsert - insert or update on conflict
    const { data, error } = await supabase
      .from('role_tab_permissions')
      .upsert({
        role,
        tab_key,
        can_view: can_view ?? true,
        can_edit: can_edit ?? false,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      }, {
        onConflict: 'role,tab_key'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, permission: data })
  } catch (error: any) {
    console.error('[role-permissions] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Bulk update permissions for a role
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role, permissions } = body

    if (!role || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Role and permissions array are required' }, { status: 400 })
    }

    // Process each permission
    const upsertData = permissions.map((p: any) => ({
      role,
      tab_key: p.tab_key,
      can_view: p.can_view ?? true,
      can_edit: p.can_edit ?? false,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    }))

    const { data, error } = await supabase
      .from('role_tab_permissions')
      .upsert(upsertData, {
        onConflict: 'role,tab_key'
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, permissions: data })
  } catch (error: any) {
    console.error('[role-permissions] PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove a specific permission
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const tabKey = searchParams.get('tab_key')

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    let query = supabase
      .from('role_tab_permissions')
      .delete()
      .eq('role', role)

    if (tabKey) {
      query = query.eq('tab_key', tabKey)
    }

    const { error } = await query

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[role-permissions] DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
