import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to generate IDs
function generateId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}-${result}`
}

// Map form types to pipeline tables
const FORM_TYPE_TO_TABLE: Record<string, string> = {
  'location_partner': 'location_partners',
  'referral_partner': 'referral_partners',
  'contractor': 'contractors',
  'employee': 'employees',
  'venue': 'venues',
  'device': 'devices',
}

// GET - Fetch submissions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const formId = searchParams.get('formId')
  const status = searchParams.get('status')
  const id = searchParams.get('id')

  try {
    // Get single submission
    if (id) {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
      }
      return NextResponse.json({ submission: data })
    }

    // Build query
    let query = supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (formId) {
      query = query.eq('form_id', formId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    // Get stats
    const { data: allSubmissions } = await supabase
      .from('form_submissions')
      .select('status, processed')

    const stats = {
      total: allSubmissions?.length || 0,
      new: allSubmissions?.filter(s => s.status === 'new' || (!s.status && !s.processed)).length || 0,
      reviewed: allSubmissions?.filter(s => s.status === 'reviewed').length || 0,
      approved: allSubmissions?.filter(s => s.status === 'approved' || s.processed === true).length || 0,
      rejected: allSubmissions?.filter(s => s.status === 'rejected').length || 0,
    }

    return NextResponse.json({ submissions: submissions || [], stats })
  } catch (error) {
    console.error('GET submissions error:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

// POST - Create new submission (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId, formName, formSlug, formType, data, submittedBy } = body

    if (!formId || !data) {
      return NextResponse.json({ error: 'Form ID and data required' }, { status: 400 })
    }

    // Look up form to get pipeline_table and form_type
    let pipelineTable: string | null = null
    let actualFormType: string | null = formType || null

    const { data: formRecord } = await supabase
      .from('forms')
      .select('form_type, pipeline_table, name, slug')
      .or(`id.eq.${formId},slug.eq.${formSlug || formId}`)
      .single()

    if (formRecord) {
      actualFormType = formRecord.form_type
      pipelineTable = formRecord.pipeline_table
    }

    // 1. Create submission in form_submissions table
    const submissionRecord = {
      form_id: formId,
      form_name: formName || formRecord?.name || 'Unknown Form',
      form_slug: formSlug || formRecord?.slug,
      form_type: actualFormType,
      data: data,
      name: data.contact_name || data.name || data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,
      email: data.email || data.contact_email || null,
      submitted_at: new Date().toISOString(),
      submitted_by: submittedBy || null,
      status: 'new',
      processed: false,
      pipeline_type: actualFormType,
    }

    const { data: submission, error: subError } = await supabase
      .from('form_submissions')
      .insert(submissionRecord)
      .select()
      .single()

    if (subError) {
      console.error('Error creating submission:', subError)
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
    }

    // 2. Increment form submission count
    if (formRecord) {
      try {
        await supabase.rpc('increment_submission_count', { form_slug: formRecord.slug })
      } catch {
        // If RPC doesn't exist, try direct update
        await supabase
          .from('forms')
          .update({ submission_count: ((formRecord as any).submission_count || 0) + 1 })
          .eq('slug', formRecord.slug)
      }
    }

    // 3. Create pipeline record based on form type
    let pipelineRecord = null

    if (actualFormType === 'location_partner') {
      pipelineRecord = await createLocationPartner(data, submission.id)
    } else if (actualFormType === 'referral_partner') {
      pipelineRecord = await createReferralPartner(data, submission.id)
    } else if (actualFormType === 'contractor') {
      pipelineRecord = await createContractor(data, submission.id)
    } else if (actualFormType === 'employee') {
      pipelineRecord = await createEmployee(data, submission.id)
    }

    // 4. Update submission with pipeline reference
    if (pipelineRecord) {
      await supabase
        .from('form_submissions')
        .update({ 
          pipeline_id: pipelineRecord.id,
          created_entity_type: actualFormType,
          created_entity_id: pipelineRecord.id,
        })
        .eq('id', submission.id)
    }

    return NextResponse.json({ 
      submission,
      pipelineRecord,
      message: 'Submission received successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('POST submission error:', error)
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 })
  }
}

// Create Location Partner from form data
async function createLocationPartner(data: Record<string, any>, submissionId: string) {
  try {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('location_partners')
      .select('*', { count: 'exact', head: true })
    const seq = String((count || 0) + 1).padStart(4, '0')
    const partnerId = `LP-${year}-${seq}`

    const record = {
      partner_id: partnerId,
      contact_name: data.contact_name || data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,
      contact_first_name: data.first_name || data.contact_first_name || null,
      contact_last_name: data.last_name || data.contact_last_name || null,
      email: data.email || data.contact_email || null,
      phone: data.phone || data.contact_phone || null,
      contact_title: data.contact_title || data.title || null,
      company_name: data.company_name || data.business_name || null,
      company_type: data.company_type || data.entity_type || null,
      dba_name: data.dba_name || null,
      ein: data.ein || null,
      address: data.address || null,
      address_line_2: data.address_line_2 || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      venue_type: data.venue_type || null,
      square_footage: parseInt(data.square_footage) || null,
      monthly_visitors: parseInt(data.monthly_visitors || data.num_locations) || null,
      existing_wifi: data.existing_wifi === 'yes' || data.existing_wifi === true,
      existing_isp: data.current_isp || data.existing_isp || null,
      stage: 'application',
      status: 'pending',
      referral_source: data.referral_source || 'website',
      referred_by_code: data.referred_by_code || data.ref || null,
      form_submission_id: submissionId,
      linkedin_profile: data.linkedin_profile || null,
      notes: data.notes || null,
    }

    const { data: partner, error } = await supabase
      .from('location_partners')
      .insert(record)
      .select()
      .single()

    if (error) {
      console.error('Error creating location partner:', error)
      return null
    }

    await logActivity('location_partner', partner.id, 'application_submitted', 'Pipeline')
    return partner
  } catch (error) {
    console.error('createLocationPartner error:', error)
    return null
  }
}

// Create Referral Partner from form data
async function createReferralPartner(data: Record<string, any>, submissionId: string) {
  try {
    const partnerId = generateId('RP')
    const fullName = data.contact_name || data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || null

    const record = {
      partner_id: partnerId,
      partner_type: 'referral',
      entity_type: data.entity_type?.toLowerCase().includes('entity') ? 'business' : 'individual',
      contact_full_name: fullName,
      contact_first_name: data.first_name || null,
      contact_last_name: data.last_name || null,
      contact_email: data.email || data.contact_email || null,
      contact_phone: data.phone || data.contact_phone || null,
      contact_title: data.contact_title || data.title || null,
      company_name: data.company_name || null,
      company_type: data.company_type || null,
      linkedin_profile: data.linkedin_profile || null,
      address_line_1: data.address || null,
      address_line_2: data.address_line_2 || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      network_description: data.network_description || null,
      estimated_referrals: data.estimated_referrals || null,
      pipeline_stage: 'application',
      status: 'pending',
      referral_source: data.referral_source || 'website',
      form_submission_id: submissionId,
      notes: data.notes || null,
    }

    const { data: partner, error } = await supabase
      .from('referral_partners')
      .insert(record)
      .select()
      .single()

    if (error) {
      console.error('Error creating referral partner:', error)
      return null
    }

    await logActivity('referral_partner', partner.id, 'application_submitted', 'Pipeline')
    return partner
  } catch (error) {
    console.error('createReferralPartner error:', error)
    return null
  }
}

// Create Contractor from form data
async function createContractor(data: Record<string, any>, submissionId: string) {
  try {
    const contractorId = generateId('CON')
    const fullName = data.contact_name || data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || null

    const record = {
      contractor_id: contractorId,
      entity_type: data.entity_type?.toLowerCase().includes('entity') ? 'business' : 'individual',
      legal_name: data.company_name || fullName,
      dba_name: data.dba_name || null,
      ein: data.ein || null,
      contact_full_name: fullName,
      contact_first_name: data.first_name || null,
      contact_last_name: data.last_name || null,
      contact_email: data.email || data.contact_email || null,
      contact_phone: data.phone || data.contact_phone || null,
      contact_title: data.contact_title || data.title || null,
      address_line_1: data.address || null,
      address_line_2: data.address_line_2 || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      services_description: data.services_description || null,
      linkedin_profile: data.linkedin_profile || null,
      pipeline_stage: 'application',
      status: 'pending',
      referral_source: data.referral_source || 'website',
      form_submission_id: submissionId,
      notes: data.notes || null,
    }

    const { data: contractor, error } = await supabase
      .from('contractors')
      .insert(record)
      .select()
      .single()

    if (error) {
      console.error('Error creating contractor:', error)
      return null
    }

    await logActivity('contractor', contractor.id, 'application_submitted', 'Pipeline')
    return contractor
  } catch (error) {
    console.error('createContractor error:', error)
    return null
  }
}

// Create Employee from form data
async function createEmployee(data: Record<string, any>, submissionId: string) {
  try {
    const employeeId = generateId('EMP')
    const fullName = data.full_name || data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || null

    const record = {
      employee_id: employeeId,
      full_name: fullName,
      preferred_name: data.preferred_name || null,
      personal_email: data.email || null,
      phone: data.phone || null,
      address_line_1: data.address || null,
      address_line_2: data.address_line_2 || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      linkedin_profile: data.linkedin_profile || null,
      pipeline_stage: 'application',
      status: 'pending',
      referral_source: data.referral_source || 'website',
      form_submission_id: submissionId,
      notes: data.notes || null,
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .insert(record)
      .select()
      .single()

    if (error) {
      console.error('Error creating employee:', error)
      return null
    }

    await logActivity('employee', employee.id, 'application_submitted', 'Pipeline')
    return employee
  } catch (error) {
    console.error('createEmployee error:', error)
    return null
  }
}

// Helper to log activity
async function logActivity(
  entityType: string,
  entityId: string,
  action: string,
  category: string
) {
  try {
    await supabase.from('activity_log').insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      category,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

// PATCH - Update submission status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status) {
      updates.status = status
      updates.processed = status === 'approved'
      if (status === 'approved' || status === 'rejected') {
        updates.processed_at = new Date().toISOString()
        updates.processing_result = status
      }
    }
    if (notes !== undefined) updates.notes = notes

    const { data: submission, error } = await supabase
      .from('form_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating submission:', error)
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Also update the linked pipeline record
    if (status && submission?.pipeline_type && submission?.pipeline_id) {
      const tableName = FORM_TYPE_TO_TABLE[submission.pipeline_type]
      
      if (tableName) {
        const pipelineUpdates: Record<string, any> = {}
        
        if (status === 'approved') {
          pipelineUpdates.status = 'approved'
          pipelineUpdates.stage = 'initial_review'
        } else if (status === 'rejected') {
          pipelineUpdates.status = 'rejected'
          pipelineUpdates.stage = 'inactive'
        }

        if (Object.keys(pipelineUpdates).length > 0) {
          await supabase
            .from(tableName)
            .update(pipelineUpdates)
            .eq('id', submission.pipeline_id)
        }
      }
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('PATCH submission error:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}

// DELETE - Delete submission
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Submission ID required' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('form_submissions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting submission:', error)
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE submission error:', error)
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}
