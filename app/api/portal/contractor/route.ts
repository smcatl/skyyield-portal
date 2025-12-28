// app/api/portal/contractor/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress

    // Find user in users table
    const { data: userData } = await supabase
      .from('users')
      .select('id, contractor_id')
      .eq('clerk_id', userId)
      .single()

    // Find contractor by user link or email
    let contractor = null

    if (userData?.contractor_id) {
      const { data } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', userData.contractor_id)
        .single()
      contractor = data
    }

    if (!contractor && userEmail) {
      const { data } = await supabase
        .from('contractors')
        .select('*')
        .eq('contact_email', userEmail)
        .single()
      contractor = data

      // Auto-link if found by email
      if (contractor && userData?.id && !contractor.user_id) {
        await supabase
          .from('contractors')
          .update({ user_id: userData.id })
          .eq('id', contractor.id)
        
        await supabase
          .from('users')
          .update({ contractor_id: contractor.id })
          .eq('id', userData.id)
      }
    }

    if (!contractor) {
      return NextResponse.json({ 
        success: false, 
        error: 'No contractor account found for this user' 
      }, { status: 404 })
    }

    // Fetch jobs assigned to this contractor
    const { data: jobs } = await supabase
      .from('jobs')
      .select(`
        *,
        venues (venue_name, address_line_1, city, state),
        location_partners (company_legal_name, contact_phone)
      `)
      .eq('contractor_id', contractor.id)
      .order('scheduled_date', { ascending: true })

    // Fetch payments for this contractor
    const { data: payments } = await supabase
      .from('tipalti_payments')
      .select('*')
      .eq('partner_id', contractor.id)
      .eq('partner_type', 'contractor')
      .order('created_at', { ascending: false })
      .limit(20)

    // Calculate stats
    const scheduledJobs = jobs?.filter(j => j.status === 'pending' || j.status === 'scheduled') || []
    const completedJobs = jobs?.filter(j => j.status === 'completed') || []
    const pendingPayment = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const totalEarned = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) || contractor.total_earnings || 0

    return NextResponse.json({
      success: true,
      contractor: {
        id: contractor.id,
        contractor_id: contractor.contractor_id,
        legal_name: contractor.legal_name,
        dba_name: contractor.dba_name,
        contact_email: contractor.contact_email,
        contact_phone: contractor.contact_phone,
        pipeline_stage: contractor.pipeline_stage,
        skills: contractor.skills,
        service_area: contractor.service_area,
        hourly_rate: contractor.hourly_rate,
        day_rate: contractor.day_rate,
        per_install_rate: contractor.per_install_rate,
        total_jobs_completed: contractor.total_jobs_completed || completedJobs.length,
        average_rating: contractor.average_rating,
        agreement_status: contractor.agreement_status,
        tipalti_status: contractor.tipalti_status,
        w9_status: contractor.w9_status,
        insurance_status: contractor.insurance_status,
        background_check_status: contractor.background_check_status,
      },
      stats: {
        scheduledJobs: scheduledJobs.length,
        completedJobs: completedJobs.length,
        pendingPayment,
        totalEarned,
      },
      jobs: jobs || [],
      payments: payments || [],
    })

  } catch (error) {
    console.error('Contractor portal error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
