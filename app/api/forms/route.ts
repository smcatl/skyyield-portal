import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all forms or single form by slug/id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const id = searchParams.get('id')
  const category = searchParams.get('category')
  const status = searchParams.get('status')

  try {
    // Get single form by slug
    if (slug) {
      const { data: form, error } = await supabase
        .from('forms')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !form) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 })
      }
      return NextResponse.json({ form })
    }

    // Get single form by id
    if (id) {
      const { data: form, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !form) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 })
      }
      return NextResponse.json({ form })
    }

    // Get all forms with optional filtering
    let query = supabase
      .from('forms')
      .select('*')
      .order('category')
      .order('name')

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: forms, error } = await query

    if (error) {
      console.error('Error fetching forms:', error)
      return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 })
    }

    return NextResponse.json({ forms: forms || [] })
  } catch (error) {
    console.error('GET forms error:', error)
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 })
  }
}

// POST - Create new form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newForm = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: body.description || '',
      category: body.category || 'other',
      form_type: body.form_type || body.formType || null,
      fields: body.fields || [],
      settings: {
        submitButtonText: body.settings?.submitButtonText || 'Submit',
        successMessage: body.settings?.successMessage || 'Thank you for your submission!',
        redirectUrl: body.settings?.redirectUrl || null,
        notifyEmail: body.settings?.notifyEmail || null,
        requireAuth: body.settings?.requireAuth || false,
        status: body.settings?.status || 'active',
      },
      status: body.status || 'active',
      pipeline_table: body.pipeline_table || body.pipelineTable || null,
      requires_signature: body.requires_signature || body.requiresSignature || false,
      docuseal_template_id: body.docuseal_template_id || body.docusealTemplateId || null,
      submission_count: 0,
    }

    const { data: form, error } = await supabase
      .from('forms')
      .insert(newForm)
      .select()
      .single()

    if (error) {
      console.error('Error creating form:', error)
      return NextResponse.json({ error: 'Failed to create form' }, { status: 500 })
    }

    return NextResponse.json({ form }, { status: 201 })
  } catch (error) {
    console.error('POST form error:', error)
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 })
  }
}

// PUT - Update form
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Form ID required' }, { status: 400 })
    }

    // Build update object - only include fields that are provided
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updates.name = body.name
    if (body.slug !== undefined) updates.slug = body.slug
    if (body.description !== undefined) updates.description = body.description
    if (body.category !== undefined) updates.category = body.category
    if (body.form_type !== undefined) updates.form_type = body.form_type
    if (body.fields !== undefined) updates.fields = body.fields
    if (body.settings !== undefined) updates.settings = body.settings
    if (body.status !== undefined) updates.status = body.status
    if (body.pipeline_table !== undefined) updates.pipeline_table = body.pipeline_table
    if (body.requires_signature !== undefined) updates.requires_signature = body.requires_signature
    if (body.docuseal_template_id !== undefined) updates.docuseal_template_id = body.docuseal_template_id

    const { data: form, error } = await supabase
      .from('forms')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating form:', error)
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({ form })
  } catch (error) {
    console.error('PUT form error:', error)
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 })
  }
}

// DELETE - Delete form
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Form ID required' }, { status: 400 })
  }

  try {
    // First check if form exists
    const { data: existingForm } = await supabase
      .from('forms')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Delete the form
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting form:', error)
      return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Form "${existingForm.name}" deleted` })
  } catch (error) {
    console.error('DELETE form error:', error)
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 })
  }
}
