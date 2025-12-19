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

// Map form slugs to partner types
const FORM_TO_PIPELINE_TYPE: Record<string, string> = {
  'location-partner-application': 'location_partner',
  'location-partner': 'location_partner',
  'referral-partner-sign-up': 'referral_partner',
  'referral-partner': 'referral_partner',
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
      .order('submitted_at', { ascending: false })

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
      .select('status')

    const stats = {
      total: allSubmissions?.length || 0,
      new: allSubmissions?.filter(s => s.status === 'new').length || 0,
      reviewed: allSubmissions?.filter(s => s.status === 'reviewed').length || 0,
      approved: allSubmissions?.filter(s => s.status === 'approved').length || 0,
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
    const { formId, formName, formSlug, data, submittedBy } = body

    if (!formId || !data) {
      return NextResponse.json({ error: 'Form ID and data required' }, { status: 400 })
    }

    // 1. Create submission in form_submissions table
    const submissionRecord = {
      id: `sub_${Date.now()}`,
      form_id: formId,
      form_name: formName || 'Unknown Form',
      form_slug: formSlug,
      data: data,
      submitted_at: new Date().toISOString(),
      submitted_by: submittedBy || null,
      status: 'new',
    }

    const { data: submission, error: subError } = await supabase
      .from('form_submissions')
      .insert(submissionRecord)
      .select()
      .single()

    if (subError) {
      console.error('Error creating submission:', subError)
      // Continue anyway - we'll try to create the pipeline record
    }

    // 2. Determine if this form should create a pipeline record
    const slug = formSlug || formName?.toLowerCase().replace(/\s+/g, '-') || ''
    const pipelineType = FORM_TO_PIPELINE_TYPE[slug]

    let pipelineRecord = null

    if (pipelineType === 'location_partner') {
      // Create Location Partner record
      pipelineRecord = await createLocationPartner(data, submission?.id)
    } else if (pipelineType === 'referral_partner') {
      // Create Referral Partner record
      pipelineRecord = await createReferralPartner(data, submission?.id)
    } else if (pipelineType === 'contractor') {
      // Create Contractor record
      pipelineRecord = await createContractor(data, submission?.id)
    }

    // 3. Update submission with pipeline reference
    if (pipelineRecord && submission) {
      await supabase
        .from('form_submissions')
        .update({ 
          pipeline_type: pipelineType,
          pipeline_id: pipelineRecord.id,
        })
        .eq('id', submission.id)
    }

    return NextResponse.json({ 
      submission: submission || submissionRecord,
      pipelineRecord,
      message: 'Submission received successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('POST submission error:', error)
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 })
  }
}

// Create Location Partner from form data
async function createLocationPartner(data: Record<string, any>, submissionId?: string) {
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
      // Contact info - try multiple field name patterns
      contact_name: data.contact_name || data.contactName || data.name || `${data.first_name || data.firstName || ''} ${data.last_name || data.lastName || ''}`.trim(),
      contact_first_name: data.first_name || data.firstName || data.contact_first_name,
      contact_last_name: data.last_name || data.lastName || data.contact_last_name,
      email: data.email || data.contact_email || data.contactEmail,
      phone: data.phone || data.contact_phone || data.contactPhone,
      contact_title: data.title || data.contact_title || data.contactTitle,
      // Business info
      company_name: data.business_name || data.company_name || data.companyName || data.businessName,
      company_type: data.business_type || data.company_type || data.companyType || data.entity_type,
      dba_name: data.dba_name || data.dbaName,
      ein: data.ein,
      // Address
      address: data.address || data.street_address || data.addressLine1,
      address_line_2: data.address_line_2 || data.addressLine2 || data.suite,
      city: data.city,
      state: data.state,
      zip: data.zip || data.zipCode || data.postal_code,
      // Venue info
      venue_type: data.business_type || data.venue_type || data.venueType,
      square_footage: parseInt(data.square_footage || data.squareFootage) || null,
      monthly_visitors: parseInt(data.daily_visitors || data.monthly_visitors || data.monthlyVisitors) || null,
      existing_wifi: data.existing_wifi === 'yes' || data.existingWifi === 'yes' || data.has_wifi === true,
      existing_isp: data.existing_isp || data.existingIsp || data.isp,
      // Pipeline status
      stage: 'application',
      status: 'pending',
      // Source tracking
      referral_source: data.referral_source || 'website',
      referred_by_code: data.referred_by_code || data.ref,
      form_submission_id: submissionId,
      notes: data.notes || data.additional_notes || data.additionalNotes,
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
async function createReferralPartner(data: Record<string, any>, submissionId?: string) {
  try {
    const partnerId = generateId('RP')

    const fullName = data.name || data.contact_name || `${data.first_name || data.firstName || ''} ${data.last_name || data.lastName || ''}`.trim()

    const record = {
      partner_id: partnerId,
      partner_type: data.partner_type || 'referral',
      entity_type: data.entity_type || data.entityType || 'individual',
      // Contact info
      contact_full_name: fullName,
      contact_first_name: data.first_name || data.firstName,
      contact_last_name: data.last_name || data.lastName,
      contact_email: data.email || data.contact_email,
      contact_phone: data.phone || data.contact_phone,
      contact_title: data.title || data.contact_title,
      // Company info (if business)
      company_name: data.company || data.company_name || data.companyName,
      company_type: data.company_type || data.companyType,
      linkedin_profile: data.linkedin || data.linkedin_profile || data.linkedInProfile,
      // Address
      address_line_1: data.address || data.address_line_1 || data.addressLine1,
      city: data.city,
      state: data.state,
      zip: data.zip || data.zipCode,
      // Partnership details
      network_description: data.network_description || data.networkDescription,
      estimated_referrals: data.estimated_referrals || data.estimatedReferrals,
      // Pipeline
      pipeline_stage: 'application',
      status: 'pending',
      // Source tracking
      referral_source: data.referral_source || data.how_did_you_hear || 'website',
      referred_by_code: data.referred_by_code || data.ref,
      form_submission_id: submissionId,
      notes: data.notes || data.additional_notes,
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

    // Log activity
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
async function createContractor(data: Record<string, any>, submissionId?: string) {
  try {
    const contractorId = generateId('CON')

    const fullName = data.name || data.contact_name || `${data.first_name || data.firstName || ''} ${data.last_name || data.lastName || ''}`.trim()

    const record = {
      contractor_id: contractorId,
      entity_type: data.entity_type || data.entityType || 'individual',
      legal_name: data.legal_name || data.legalName || data.company_name || fullName,
      dba_name: data.dba_name || data.dbaName,
      ein: data.ein,
      // Contact info
      contact_full_name: fullName,
      contact_first_name: data.first_name || data.firstName || data.contact_first_name,
      contact_last_name: data.last_name || data.lastName || data.contact_last_name,
      contact_email: data.email || data.contact_email,
      contact_phone: data.phone || data.contact_phone,
      contact_title: data.title || data.contact_title,
      // Address
      address_line_1: data.address || data.address_line_1 || data.addressLine1,
      city: data.city,
      state: data.state,
      zip: data.zip || data.zipCode,
      // Service area
      service_radius_miles: parseInt(data.service_radius || data.service_radius_miles || data.serviceRadiusMiles) || 50,
      vehicle_type: data.vehicle_type || data.vehicleType,
      // Qualifications
      years_experience: data.years_experience || data.yearsExperience,
      certifications: data.certifications || [],
      services_offered: data.services_offered || data.servicesOffered || [],
      tools_owned: data.tools_owned || data.toolsOwned,
      // Rates
      hourly_rate: parseFloat(data.hourly_rate || data.hourlyRate) || null,
      per_install_rate: parseFloat(data.per_install_rate || data.perInstallRate) || null,
      availability: data.availability,
      portfolio_url: data.portfolio_url || data.portfolioUrl,
      // Pipeline
      pipeline_stage: 'application',
      status: 'pending',
      // Source
      referral_source: data.referral_source || 'website',
      form_submission_id: submissionId,
      notes: data.notes || data.additional_notes,
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

    // Log activity
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

    const updates: Record<string, any> = {}
    if (status) updates.status = status
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

    // If approved/rejected, also update the linked pipeline record
    if (status && submission?.pipeline_type && submission?.pipeline_id) {
      const tableMap: Record<string, string> = {
        'location_partner': 'location_partners',
        'referral_partner': 'referral_partners',
        'contractor': 'contractors',
      }
      const tableName = tableMap[submission.pipeline_type]
      
      if (tableName) {
        const pipelineStatus = status === 'approved' ? 'approved' : 
                              status === 'rejected' ? 'rejected' : undefined

        if (pipelineStatus) {
          await supabase
            .from(tableName)
            .update({ 
              status: pipelineStatus,
              stage: pipelineStatus === 'approved' ? 'initial_review' : 'inactive'
            })
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
