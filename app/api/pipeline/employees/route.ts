// app/api/pipeline/employees/route.ts
// Employees CRUD API
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch employees
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const stage = searchParams.get('stage')
  const status = searchParams.get('status')
  const department = searchParams.get('department')
  const limit = parseInt(searchParams.get('limit') || '100')

  try {
    if (id) {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Get activity log
      const { data: activityLog } = await supabase
        .from('activity_log')
        .select('*')
        .eq('entity_type', 'employee')
        .eq('entity_id', id)
        .order('created_at', { ascending: false })
        .limit(50)

      return NextResponse.json({ 
        employee, 
        activityLog: activityLog || [] 
      })
    }

    // List employees with filters
    let query = supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (stage) query = query.eq('pipeline_stage', stage)
    if (status) query = query.eq('status', status)
    if (department) query = query.eq('department', department)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ employees: data })
  } catch (error: any) {
    console.error('GET /api/pipeline/employees error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new employee (from application or admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate employee_id: EMP-XXXXXXXX
    const randomId = Math.random().toString(36).substring(2, 10).toUpperCase()
    const employeeId = `EMP-${randomId}`

    const insertData = {
      employee_id: employeeId,

      // Personal info
      first_name: body.first_name,
      last_name: body.last_name,
      full_name: body.full_name || `${body.first_name} ${body.last_name}`.trim(),
      email: body.email,
      phone: body.phone,
      
      // Address
      address_street: body.address_street,
      address_city: body.address_city,
      address_state: body.address_state,
      address_zip: body.address_zip,
      address_country: body.address_country || 'USA',

      // Job info
      job_title: body.job_title,
      department: body.department,
      reports_to: body.reports_to,
      employment_type: body.employment_type || 'full_time', // full_time, part_time, contract

      // Compensation (set by admin)
      salary: body.salary,
      pay_frequency: body.pay_frequency || 'bimonthly',

      // Dates
      application_date: new Date().toISOString(),
      start_date: body.start_date,

      // Pipeline
      pipeline_stage: body.pipeline_stage || 'application',
      status: body.status || 'pending',

      // DocuSeal tracking
      offer_letter_status: 'not_sent',
      noncompete_status: 'not_sent',
      nda_status: 'not_sent',

      // Additional
      resume_url: body.resume_url,
      linkedin_profile: body.linkedin_profile,
      cover_letter: body.cover_letter,
      referral_source: body.referral_source || 'website',
      notes: body.notes,

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('employees')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_log').insert([{
      entity_type: 'employee',
      entity_id: data.id,
      entity_name: data.full_name,
      action: 'application_submitted',
      action_category: 'pipeline',
      description: `Employee application for ${data.job_title || 'position'}`,
      new_values: { 
        pipeline_stage: data.pipeline_stage, 
        status: data.status,
        job_title: data.job_title,
      },
    }])

    return NextResponse.json({ success: true, employee: data })
  } catch (error: any) {
    console.error('POST /api/pipeline/employees error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update employee
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
    }

    // Get current state
    const { data: oldEmployee } = await supabase
      .from('employees')
      .select('pipeline_stage, status, full_name, job_title')
      .eq('id', id)
      .single()

    updates.updated_at = new Date().toISOString()

    // Update full_name if first/last name changed
    if (updates.first_name || updates.last_name) {
      const firstName = updates.first_name || oldEmployee?.full_name?.split(' ')[0] || ''
      const lastName = updates.last_name || oldEmployee?.full_name?.split(' ').slice(1).join(' ') || ''
      updates.full_name = `${firstName} ${lastName}`.trim()
    }

    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log significant changes
    const changes: string[] = []
    if (updates.pipeline_stage && oldEmployee?.pipeline_stage !== updates.pipeline_stage) {
      changes.push(`stage: ${oldEmployee?.pipeline_stage} → ${updates.pipeline_stage}`)
    }
    if (updates.status && oldEmployee?.status !== updates.status) {
      changes.push(`status: ${oldEmployee?.status} → ${updates.status}`)
    }

    if (changes.length > 0) {
      await supabase.from('activity_log').insert([{
        entity_type: 'employee',
        entity_id: id,
        entity_name: oldEmployee?.full_name,
        user_id: userId || null,
        action: updates.pipeline_stage ? 'stage_changed' : 'updated',
        action_category: 'pipeline',
        description: changes.join(', '),
        old_values: oldEmployee,
        new_values: updates,
      }])
    }

    return NextResponse.json({ success: true, employee: data })
  } catch (error: any) {
    console.error('PUT /api/pipeline/employees error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Terminate/deactivate employee
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('employees')
      .update({ 
        status: 'terminated', 
        pipeline_stage: 'terminated',
        termination_date: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await supabase.from('activity_log').insert([{
      entity_type: 'employee',
      entity_id: id,
      entity_name: data.full_name,
      user_id: userId || null,
      action: 'terminated',
      action_category: 'pipeline',
      description: 'Employee terminated',
    }])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/pipeline/employees error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
