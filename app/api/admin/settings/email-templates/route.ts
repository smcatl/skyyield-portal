// app/api/admin/settings/email-templates/route.ts
// CRUD for email_templates table

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List all email templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const templateType = searchParams.get('type')
    const category = searchParams.get('category')

    if (id) {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return NextResponse.json({ template: data })
    }

    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (templateType) {
      query = query.eq('template_type', templateType)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ templates: data || [] })
  } catch (error: any) {
    console.error('GET /api/admin/settings/email-templates error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new email template
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const insertData = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '_'),
      template_type: body.template_type || 'notification',
      category: body.category || 'general',
      subject: body.subject,
      body_html: body.body_html || null,
      body_text: body.body_text || body.body,
      variables: body.variables || [],
      partner_types: body.partner_types || null,
      trigger_event: body.trigger_event || null,
      is_automated: body.is_automated || false,
      is_active: body.is_active !== false,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('email_templates')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, template: data })
  } catch (error: any) {
    console.error('POST /api/admin/settings/email-templates error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update email template
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()
    updates.updated_by = userId

    const { data, error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, template: data })
  } catch (error: any) {
    console.error('PUT /api/admin/settings/email-templates error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete email template
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    // Soft delete
    const { error } = await supabase
      .from('email_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/admin/settings/email-templates error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
