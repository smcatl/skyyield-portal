// app/api/portal/location-partner/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Get current user from Clerk
    const { userId } = await auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress

    // First, try to find user in users table
    const { data: userData } = await supabase
      .from('users')
      .select('id, user_type')
      .eq('clerk_user_id', userId)
      .single()

    // Find location partner by user_id or email
    let partner = null

    if (userData?.id) {
      // Try by user_id link
      const { data } = await supabase
        .from('location_partners')
        .select('*')
        .eq('user_id', userData.id)
        .single()
      partner = data
    }

    if (!partner && userEmail) {
      // Fallback: try by email
      const { data } = await supabase
        .from('location_partners')
        .select('*')
        .eq('contact_email', userEmail)
        .single()
      partner = data

      // Auto-link if found by email but not linked
      if (partner && userData?.id && !partner.user_id) {
        await supabase
          .from('location_partners')
          .update({ user_id: userData.id })
          .eq('id', partner.id)
      }
    }

    if (!partner) {
      return NextResponse.json({ 
        success: false, 
        error: 'No location partner account found for this user' 
      }, { status: 404 })
    }

    // Fetch commission history for this partner
    const { data: commissions } = await supabase
      .from('monthly_commissions')
      .select('*')
      .eq('location_partner_id', partner.id)
      .order('commission_month', { ascending: false })
      .limit(12)

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        partner_id: partner.partner_id,
        company_legal_name: partner.company_legal_name,
        dba_name: partner.dba_name,
        contact_first_name: partner.contact_first_name,
        contact_last_name: partner.contact_last_name,
        contact_email: partner.contact_email,
        contact_phone: partner.contact_phone,
        pipeline_stage: partner.pipeline_stage,
        commission_type: partner.commission_type,
        commission_percentage: partner.commission_percentage,
        commission_flat_fee: partner.commission_flat_fee,
        tipalti_payee_id: partner.tipalti_payee_id,
        tipalti_status: partner.tipalti_status,
        last_payment_amount: partner.last_payment_amount,
        last_payment_date: partner.last_payment_date,
        trial_status: partner.trial_status,
        trial_end_date: partner.trial_end_date,
        contract_status: partner.contract_status,
        loi_status: partner.loi_status,
      },
      commissions: commissions || []
    })

  } catch (error) {
    console.error('Location partner portal error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
