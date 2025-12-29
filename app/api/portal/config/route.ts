// app/api/portal/config/route.ts
// Portal Configuration API - Fetch and update portal tab settings

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Default configurations for each portal type
function getDefaultConfig(portalType: string) {
  const defaults: Record<string, any> = {
    location_partner: {
      portal_type: 'location_partner',
      portal_name: 'Location Partner Portal',
      tabs: [
        { id: 'overview', label: 'Overview', icon: 'Building2', enabled: true, order: 1 },
        { id: 'venues', label: 'Venues', icon: 'MapPin', enabled: true, order: 2 },
        { id: 'devices', label: 'Devices', icon: 'Cpu', enabled: true, order: 3 },
        { id: 'earnings', label: 'Earnings', icon: 'DollarSign', enabled: true, order: 4 },
        { id: 'documents', label: 'Documents', icon: 'FileText', enabled: true, order: 5 },
        { id: 'support', label: 'Support', icon: 'HelpCircle', enabled: true, order: 6 },
        { id: 'settings', label: 'Settings', icon: 'Settings', enabled: true, order: 7 },
      ],
      show_earnings: true,
      show_documents: true,
      show_support_chat: false,
      show_notifications: true,
      primary_color: '#0EA5E9',
    },
    referral_partner: {
      portal_type: 'referral_partner',
      portal_name: 'Referral Partner Portal',
      tabs: [
        { id: 'overview', label: 'Overview', icon: 'Users', enabled: true, order: 1 },
        { id: 'referrals', label: 'My Referrals', icon: 'UserPlus', enabled: true, order: 2 },
        { id: 'earnings', label: 'Earnings', icon: 'DollarSign', enabled: true, order: 3 },
        { id: 'marketing', label: 'Marketing', icon: 'Megaphone', enabled: true, order: 4 },
        { id: 'documents', label: 'Documents', icon: 'FileText', enabled: true, order: 5 },
        { id: 'settings', label: 'Settings', icon: 'Settings', enabled: true, order: 6 },
      ],
      show_earnings: true,
      show_documents: true,
      show_support_chat: false,
      show_notifications: true,
      primary_color: '#0EA5E9',
    },
    channel_partner: {
      portal_type: 'channel_partner',
      portal_name: 'Channel Partner Portal',
      tabs: [
        { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', enabled: true, order: 1 },
        { id: 'clients', label: 'Clients', icon: 'Building2', enabled: true, order: 2 },
        { id: 'deals', label: 'Deals', icon: 'Handshake', enabled: true, order: 3 },
        { id: 'earnings', label: 'Earnings', icon: 'DollarSign', enabled: true, order: 4 },
        { id: 'resources', label: 'Resources', icon: 'BookOpen', enabled: true, order: 5 },
        { id: 'settings', label: 'Settings', icon: 'Settings', enabled: true, order: 6 },
      ],
      show_earnings: true,
      show_documents: true,
      show_support_chat: false,
      show_notifications: true,
      primary_color: '#0EA5E9',
    },
    contractor: {
      portal_type: 'contractor',
      portal_name: 'Contractor Portal',
      tabs: [
        { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', enabled: true, order: 1 },
        { id: 'jobs', label: 'My Jobs', icon: 'Briefcase', enabled: true, order: 2 },
        { id: 'schedule', label: 'Schedule', icon: 'Calendar', enabled: true, order: 3 },
        { id: 'earnings', label: 'Earnings', icon: 'DollarSign', enabled: true, order: 4 },
        { id: 'training', label: 'Training', icon: 'GraduationCap', enabled: true, order: 5 },
        { id: 'settings', label: 'Settings', icon: 'Settings', enabled: true, order: 6 },
      ],
      show_earnings: true,
      show_documents: true,
      show_support_chat: false,
      show_notifications: true,
      primary_color: '#0EA5E9',
    },
    employee: {
      portal_type: 'employee',
      portal_name: 'Employee Portal',
      tabs: [
        { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', enabled: true, order: 1 },
        { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', enabled: true, order: 2 },
        { id: 'schedule', label: 'Schedule', icon: 'Calendar', enabled: true, order: 3 },
        { id: 'payroll', label: 'Payroll', icon: 'DollarSign', enabled: true, order: 4 },
        { id: 'documents', label: 'Documents', icon: 'FileText', enabled: true, order: 5 },
        { id: 'directory', label: 'Directory', icon: 'Users', enabled: true, order: 6 },
        { id: 'settings', label: 'Settings', icon: 'Settings', enabled: true, order: 7 },
      ],
      show_earnings: true,
      show_documents: true,
      show_support_chat: false,
      show_notifications: true,
      primary_color: '#0EA5E9',
    },
  }

  return defaults[portalType] || defaults.location_partner
}

// GET - Fetch portal configuration
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const portalType = searchParams.get('type')

  try {
    if (portalType) {
      // Get specific portal config
      const { data, error } = await supabase
        .from('portal_config')
        .select('*')
        .eq('portal_type', portalType)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      // Return default config if not found
      if (!data) {
        return NextResponse.json({
          success: true,
          config: getDefaultConfig(portalType)
        })
      }

      return NextResponse.json({ success: true, config: data })
    }

    // Get all portal configs
    const { data, error } = await supabase
      .from('portal_config')
      .select('*')
      .order('portal_type')

    if (error) throw error

    // Merge with defaults for any missing portals
    const portalTypes = ['location_partner', 'referral_partner', 'channel_partner', 'contractor', 'employee']
    const configs = portalTypes.map(type => {
      const existing = data?.find(c => c.portal_type === type)
      return existing || getDefaultConfig(type)
    })

    return NextResponse.json({ success: true, configs })

  } catch (error: any) {
    console.error('Portal config GET error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// POST - Update portal configuration (Admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      portal_type, 
      tabs, 
      portal_name, 
      show_earnings, 
      show_documents, 
      show_support_chat, 
      show_notifications, 
      primary_color 
    } = body

    if (!portal_type) {
      return NextResponse.json({ error: 'portal_type required' }, { status: 400 })
    }

    // Upsert configuration
    const { data, error } = await supabase
      .from('portal_config')
      .upsert({
        portal_type,
        portal_name: portal_name || `${portal_type.replace(/_/g, ' ')} Portal`,
        tabs: tabs || [],
        show_earnings: show_earnings ?? true,
        show_documents: show_documents ?? true,
        show_support_chat: show_support_chat ?? false,
        show_notifications: show_notifications ?? true,
        primary_color: primary_color || '#0EA5E9',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'portal_type' })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'portal_config',
      entity_id: portal_type,
      action: 'config_updated',
      action_category: 'system',
      description: `Portal configuration updated for ${portal_type}`,
      metadata: { tabs_count: tabs?.length || 0 },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Portal configuration updated',
      config: data 
    })

  } catch (error: any) {
    console.error('Portal config POST error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
