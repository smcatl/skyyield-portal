import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // calendly, dropdown, email, visibility, or all

    const response: Record<string, any> = {}

    // Fetch Calendly links
    if (!type || type === 'calendly' || type === 'all') {
      const { data: calendlyLinks, error: calendlyError } = await supabase
        .from('calendly_links')
        .select('*')
        .order('display_order', { ascending: true })

      if (calendlyError) console.error('Calendly fetch error:', calendlyError)
      response.calendlyLinks = calendlyLinks || []
    }

    // Fetch Dropdowns
    if (!type || type === 'dropdown' || type === 'all') {
      const { data: dropdowns, error: dropdownError } = await supabase
        .from('dropdowns')
        .select('*')
        .order('name', { ascending: true })

      if (dropdownError) console.error('Dropdown fetch error:', dropdownError)
      response.dropdowns = dropdowns || []
    }

    // Fetch Email Templates
    if (!type || type === 'email' || type === 'all') {
      const { data: emailTemplates, error: emailError } = await supabase
        .from('email_templates')
        .select('*')
        .order('name', { ascending: true })

      if (emailError) console.error('Email template fetch error:', emailError)
      response.emailTemplates = emailTemplates || []
    }

    // Fetch Portal Visibility
    if (!type || type === 'visibility' || type === 'all') {
      const { data: visibility, error: visibilityError } = await supabase
        .from('portal_visibility')
        .select('*')
        .order('display_order', { ascending: true })

      if (visibilityError) console.error('Portal visibility fetch error:', visibilityError)
      response.portalVisibility = visibility || []
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST - Create new setting item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = await auth()
    const { type, ...data } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required (calendly, dropdown, email, visibility)' },
        { status: 400 }
      )
    }

    let result
    let tableName: string

    switch (type) {
      case 'calendly':
        tableName = 'calendly_links'
        result = await supabase
          .from('calendly_links')
          .insert({
            name: data.name,
            slug: data.slug,
            url: data.url,
            duration: data.duration || 30,
            description: data.description,
            active: data.active ?? true,
            color: data.color || '#0EA5E9',
            pipeline_stage: data.pipeline_stage,
            trigger_action: data.trigger_action,
            display_order: data.display_order || 0
          })
          .select()
          .single()
        break

      case 'dropdown':
        tableName = 'dropdowns'
        result = await supabase
          .from('dropdowns')
          .insert({
            key: data.key,
            name: data.name,
            options: data.options || [],
            allow_custom: data.allow_custom ?? false,
            used_in_forms: data.used_in_forms || []
          })
          .select()
          .single()
        break

      case 'email':
        tableName = 'email_templates'
        result = await supabase
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
            reminder_days: data.reminder_days || []
          })
          .select()
          .single()
        break

      case 'visibility':
        tableName = 'portal_visibility'
        result = await supabase
          .from('portal_visibility')
          .insert({
            tab_name: data.tab_name,
            tab_id: data.tab_id,
            user_types: data.user_types || [],
            enabled: data.enabled ?? true,
            display_order: data.display_order || 0,
            icon: data.icon
          })
          .select()
          .single()
        break

      default:
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        )
    }

    if (result.error) throw result.error

    // Log activity
    await supabase.from('activity_log').insert({
      actor_id: userId,
      action: `${type}_setting_created`,
      entity_type: tableName,
      entity_id: result.data?.id,
      details: data
    })

    return NextResponse.json({ item: result.data })

  } catch (error) {
    console.error('Error creating setting:', error)
    return NextResponse.json(
      { error: 'Failed to create setting' },
      { status: 500 }
    )
  }
}

// PUT - Update setting item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = await auth()
    const { type, id, ...updates } = body

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      )
    }

    let tableName: string
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
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        )
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_log').insert({
      actor_id: userId,
      action: `${type}_setting_updated`,
      entity_type: tableName,
      entity_id: id,
      details: updates
    })

    return NextResponse.json({ item: data })

  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}

// DELETE - Delete setting item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    const { userId } = await auth()

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      )
    }

    let tableName: string
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
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        )
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error) throw error

    // Log activity
    await supabase.from('activity_log').insert({
      actor_id: userId,
      action: `${type}_setting_deleted`,
      entity_type: tableName,
      entity_id: id,
      details: {}
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting setting:', error)
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    )
  }
}
