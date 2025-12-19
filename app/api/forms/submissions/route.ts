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

// Map form slugs/types to pipeline types
const FORM_TO_PIPELINE_TYPE: Record<string, string> = {
  'location-partner-application': 'location_partner',
  'location-partner': 'location_partner',
  'location_partner': 'location_partner',
  'referral-partner-sign-up': 'referral_partner',
  'referral-partner': 'referral_partner',
  'referral_partner': 'referral_partner',
  'contractor-application': 'contractor',
  'contractor': 'contractor',
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

    // Determine pipeline type from slug, type, or name
    const slug = formSlug || formType || formName?.toLowerCase().replace(/\s+/g, '-') || ''
    const pipelineType = FORM_TO_PIPELINE_TYPE[slug] || FORM_TO_PIPELINE_TYPE[formType] || null

    // 1. Create submission in form_submissions table
    const submissionRecord = {
      form_id: formId,
      form_name: formName || 'Unknown Form',
      form_slug: formSlug || slug,
      form_type: formType || pipelineType,
      data: data,
      name: data.name || data.contact_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,
      email: data.email || data.contact_email || null,
      submitted_at: new Date().toISOString(),
      submitted_by: submittedBy || null,
      status: 'new',
      processed: false,
      pipeline_type: pipelineType,
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

    // 2. Create pipeline record based on type
    let pipelineRecord = null

    if (pipelineType === 'location_partner') {
      pipelineRecord = await createLocationPartner(data, submission.id)
    } else if (pipelineType === 'referral_partner') {
      pipelineRecord = await createReferralPartner(data, submission.id)
    } else if (pipelineType === 'contractor') {
      pipelineRecord = await createContractor(data, submission.id)
    }

    // 3. Update submission with pipeline reference
    if (pipelineRecord) {
      await supabase
        .from('form_submissions')
        .update({ 
          pipeline_id: pipelineRecord.id,
          created_entity_type: pipelineType,
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
    // Generate partner ID: LP-YYYY-####
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('location_partners')
      .select('*', { count: 'exact', head: true })
    const seq = String((count || 0) + 1).padStart(4, '0')
    const partnerId = `LP-${year}-${seq}`

    const record = {
      partner_id: partnerId,
      contact_name: data.contact_name || data.contactName || data.name || `${data.first_name || data.firstName || ''} ${data.last_name || data.lastName || ''}`.trim() || null,
      contact_first_name: data.first_name || data.firstName || data.contact_first_name || null,
      contact_last_name: data.last_name || data.lastName || data.contact_last_name || null,
      email: data.email || data.contact_email || data.contactEmail || null,
      phone: data.phone || data.contact_phone || data.contactPhone || null,
      contact_title: data.title || data.contact_title || data.contactTitle || null,
      company_name: data.business_name || data.company_name || data.companyName || data.businessName || null,
      company_type: data.business_type || data.company_type || data.companyType || data.entity_type || null,
      dba_name: data.dba_name || data.dbaName || null,
      ein: data.ein || null,
      address: data.address || data.street_address || data.addressLine1 || null,
      address_line_2: data.address_line_2 || data.addressLine2 || data.suite || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || data.zipCode || data.postal_code || null,
      venue_type: data.business_type || data.venue_type || data.venueType || null,
      square_footage: parseInt(data.square_footage || data.squareFootage) || null,
      monthly_visitors: parseInt(data.daily_visitors || data.monthly_visitors || data.monthlyVisitors) || null,
      existing_wifi: data.existing_wifi === 'yes' || data.existingWifi === 'yes' || data.has_wifi === true,
      existing_isp: data.existing_isp || data.existingIsp || data.isp || null,
      stage: 'application',
      status: 'pending',
      referral_source: data.referral_source || 'website',
      referred_by_code: data.referred_by_code || data.ref || null,
      form_submission_id: submissionId,
      notes: data.notes || data.additional_notes || data.additionalNotes || null,
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

    // Log activity
    await logActivity('location_partner', partner.id, 'application_submitted', 'Pipeline', {
      source: 'form_submission',
      submission_id: submissionId,
    })

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
    const fullName = data.name || data.contact_name || `${data.first_name || data.firstName || ''} ${data.last_name || data.lastName || ''}`.trim() || null

    const record = {
      partner_id: partnerId,
      partner_type: data.partner_type || 'referral',
      entity_type: data.entity_type || data.entityType || 'individual',
      contact_full_name: fullName,
      contact_first_name: data.first_name || data.firstName || null,
      contact_last_name: data.last_name || data.lastName || null,
      contact_email: data.email || data.contact_email || null,
      contact_phone: data.phone || data.contact_phone || null,
      contact_title: data.title || data.contact_title || null,
      company_name: data.company || data.company_name || data.companyName || null,
      company_type: data.company_type || data.companyType || null,
      linkedin_profile: data.linkedin || data.linkedin_profile || data.linkedInProfile || null,
      address_line_1: data.address || data.address_line_1 || data.addressLine1 || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || data.zipCode || null,
      network_description: data.network_description || data.networkDescription || null,
      estimated_referrals: data.estimated_referrals || data.estimatedReferrals || null,
      pipeline_stage: 'application',
      status: 'pending',
      referral_source: data.referral_source || data.how_did_you_hear || 'website',
      referred_by_code: data.referred_by_code || data.ref || null,
      form_submission_id: submissionId,
      notes: data.notes || data.additional_notes || null,
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

    await logActivity('referral_partner', partner.id, 'application_submitted', 'Pipeline', {
      source: 'form_submission',
      submission_id: submissionId,
    })

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
    const fullName = data.name || data.contact_name || `${data.first_name || data.firstName || ''} ${data.last_name || data.lastName || ''}`.trim() || null

    const record = {
      contractor_id: contractorId,
      entity_type: data.entity_type || data.entityType || 'individual',
      legal_name: data.legal_name || data.legalName || data.company_name || fullName,
      dba_name: data.dba_name || data.dbaName || null,
      ein: data.ein || null,
      contact_full_name: fullName,
      contact_first_name: data.first_name || data.firstName || data.contact_first_name || null,
      contact_last_name: data.last_name || data.lastName || data.contact_last_name || null,
      contact_email: data.email || data.contact_email || null,
      contact_phone: data.phone || data.contact_phone || null,
      contact_title: data.title || data.contact_title || null,
      address_line_1: data.address || data.address_line_1 || data.addressLine1 || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || data.zipCode || null,
      service_radius_miles: parseInt(data.service_radius || data.service_radius_miles || data.serviceRadiusMiles) || 50,
      vehicle_type: data.vehicle_type || data.vehicleType || null,
      years_experience: data.years_experience || data.yearsExperience || null,
      certifications: data.certifications || [],
      services_offered: data.services_offered || data.servicesOffered || [],
      tools_owned: data.tools_owned || data.toolsOwned || null,
      hourly_rate: parseFloat(data.hourly_rate || data.hourlyRate) || null,
      per_install_rate: parseFloat(data.per_install_rate || data.perInstallRate) || null,
      availability: data.availability || null,
      portfolio_url: data.portfolio_url || data.portfolioUrl || null,
      pipeline_stage: 'application',
      status: 'pending',
      referral_source: data.referral_source || 'website',
      form_submission_id: submissionId,
      notes: data.notes || data.additional_notes || null,
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

    await logActivity('contractor', contractor.id, 'application_submitted', 'Pipeline', {
      source: 'form_submission',
      submission_id: submissionId,
    })

    return contractor
  } catch (error) {
    console.error('createContractor error:', error)
    return null
  }
}

// Helper to log activity
async function logActivity(
  entityType: string,
  entityId: string,
  action: string,
  category: string,
  details?: Record<string, any>
) {
  try {
    await supabase.from('activity_log').insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      category,
      details,
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
      const tableMap: Record<string, string> = {
        'location_partner': 'location_partners',
        'referral_partner': 'referral_partners',
        'contractor': 'contractors',
      }
      const tableName = tableMap[submission.pipeline_type]
      
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
