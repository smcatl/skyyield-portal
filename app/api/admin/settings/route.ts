// app/api/admin/settings/route.ts
// Admin Settings API - Manage Calendly links, dropdowns, email templates, portal visibility
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get all settings
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'calendly', 'dropdowns', 'emails', 'visibility', 'all'

    const results: Record<string, any> = {}

    // Calendly links
    if (!type || type === 'all' || type === 'calendly') {
      const { data: calendlyLinks } = await supabase
        .from('calendly_links')
        .select('*')
        .order('display_order', { ascending: true })
      results.calendlyLinks = calendlyLinks || []
    }

    // Dropdowns
    if (!type || type === 'all' || type === 'dropdowns') {
      const { data: dropdowns } = await supabase
        .from('dropdowns')
        .select('*')
        .order('name', { ascending: true })
      results.dropdowns = dropdowns || []
    }

    // Email templates
    if (!type || type === 'all' || type === 'emails') {
      const { data: emailTemplates } = await supabase
        .from('email_templates')
        .select('*')
        .order('trigger', { ascending: true })
      results.emailTemplates = emailTemplates || []
    }

    // Portal visibility settings
    if (!type || type === 'all' || type === 'visibility') {
      const { data: portalVisibility } = await supabase
        .from('portal_visibility')
        .select('*')
        .order('tab_name', { ascending: true })
      results.portalVisibility = portalVisibility || []
    }

    return NextResponse.json({ success: true, ...results })
  } catch (error: any) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new setting item
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, ...data } = body

    let result
    let tableName

    switch (type) {
      case 'calendly':
        tableName = 'calendly_links'
        const { data: calendly, error: calError } = await supabase
          .from('calendly_links')
          .insert({
            name: data.name,
            slug: data.slug,
            url: data.url,
            duration: data.duration,
            description: data.description,
            active: data.active ?? true,
            color: data.color || '#0EA5E9',
            pipeline_stage: data.pipeline_stage,
            trigger_action: data.trigger_action,
            display_order: data.display_order || 0,
          })
          .select()
          .single()
        if (calError) throw calError
        result = calendly
        break

      case 'dropdown':
        tableName = 'dropdowns'
        const { data: dropdown, error: dropError } = await supabase
          .from('dropdowns')
          .insert({
            key: data.key,
            name: data.name,
            options: data.options || [],
            allow_custom: data.allow_custom ?? false,
            used_in_forms: data.used_in_forms || [],
          })
          .select()
          .single()
        if (dropError) throw dropError
        result = dropdown
        break

      case 'email':
        tableName = 'email_templates'
        const { data: email, error: emailError } = await supabase
          .from('email_templates')
          .insert({
            name: data.name,
            subject: data.subject,
            description: data.description,
            trigger: data.trigger,
            pipeline_stage: data.pipeline_stage,
            has_calendly: data.has_calendly ?? false,
            calendly_link_id: data.calendly_link_id,
            enabled: data.enabled ?? true,
            greeting: data.greeting,
            body_paragraphs: data.body_paragraphs || [],
            cta_text: data.cta_text,
            cta_type: data.cta_type || 'none',
            cta_url: data.cta_url,
            footer_text: data.footer_text,
            reminder_days: data.reminder_days,
          })
          .select()
          .single()
        if (emailError) throw emailError
        result = email
        break

      case 'visibility':
        tableName = 'portal_visibility'
        const { data: visibility, error: visError } = await supabase
          .from('portal_visibility')
          .insert({
            tab_name: data.tab_name,
            tab_id: data.tab_id,
            user_types: data.user_types || [],
            enabled: data.enabled ?? true,
          })
          .select()
          .single()
        if (visError) throw visError
        result = visibility
        break

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'settings',
      entity_id: result.id,
      entity_name: result.name || result.tab_name || result.key,
      action: `${type}_created`,
      action_category: 'admin',
    })

    return NextResponse.json({ success: true, [type]: result }, { status: 201 })
  } catch (error: any) {
    console.error('Settings POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update setting item
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    let tableName
    switch (type) {
      case 'calendly':
        tableName = 'calendly_links'
        break
      case 'dropdown':
        tableName = 'dropdowns'
        break
      case 'email':
        tableName = 'email_templates'
        break
      case 'visibility':
        tableName = 'portal_visibility'
        break
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const { data: result, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating ${type}:`, error)
      return NextResponse.json({ error: `Failed to update ${type}` }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'settings',
      entity_id: id,
      entity_name: result.name || result.tab_name || result.key,
      action: `${type}_updated`,
      action_category: 'admin',
      new_values: updates,
    })

    return NextResponse.json({ success: true, [type]: result })
  } catch (error: any) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete setting item
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID required' }, { status: 400 })
    }

    let tableName
    switch (type) {
      case 'calendly':
        tableName = 'calendly_links'
        break
      case 'dropdown':
        tableName = 'dropdowns'
        break
      case 'email':
        tableName = 'email_templates'
        break
      case 'visibility':
        tableName = 'portal_visibility'
        break
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Get item for logging
    const { data: item } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`Error deleting ${type}:`, error)
      return NextResponse.json({ error: `Failed to delete ${type}` }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'settings',
      entity_id: id,
      entity_name: item?.name || item?.tab_name || item?.key,
      action: `${type}_deleted`,
      action_category: 'admin',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Settings DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
