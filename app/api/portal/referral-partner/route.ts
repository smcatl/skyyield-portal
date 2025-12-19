// app/api/portal/referral-partner/route.ts
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

    // Find referral partner by user_id or email
    let partner = null

    if (userData?.id) {
      // Try by user_id link
      const { data } = await supabase
        .from('referral_partners')
        .select('*')
        .eq('user_id', userData.id)
        .single()
      partner = data
    }

    if (!partner && userEmail) {
      // Fallback: try by email
      const { data } = await supabase
        .from('referral_partners')
        .select('*')
        .eq('contact_email', userEmail)
        .single()
      partner = data

      // Auto-link if found by email but not linked
      if (partner && userData?.id && !partner.user_id) {
        await supabase
          .from('referral_partners')
          .update({ user_id: userData.id })
          .eq('id', partner.id)
      }
    }

    if (!partner) {
      return NextResponse.json({ 
        success: false, 
        error: 'No referral partner account found for this user' 
      }, { status: 404 })
    }

    // Fetch referrals made by this partner
    const { data: referrals } = await supabase
      .from('location_partners')
      .select('id, partner_id, company_legal_name, dba_name, contact_first_name, contact_last_name, pipeline_stage, created_at')
      .eq('referred_by_partner_id', partner.id)
      .order('created_at', { ascending: false })

    // Fetch commission history for this partner
    const { data: commissions } = await supabase
      .from('monthly_commissions')
      .select('*')
      .eq('referral_partner_id', partner.id)
      .order('commission_month', { ascending: false })
      .limit(12)

    // Format referrals
    const formattedReferrals = (referrals || []).map(ref => ({
      id: ref.id,
      partner_id: ref.partner_id,
      company_name: ref.dba_name || ref.company_legal_name,
      contact_name: `${ref.contact_first_name || ''} ${ref.contact_last_name || ''}`.trim(),
      status: ref.pipeline_stage,
      created_at: ref.created_at,
      commission_earned: ref.pipeline_stage === 'active' ? (partner.commission_per_referral || 0) : 0
    }))

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        partner_id: partner.partner_id,
        company_name: partner.company_name,
        contact_name: partner.contact_name,
        contact_email: partner.contact_email,
        contact_phone: partner.contact_phone,
        pipeline_stage: partner.pipeline_stage,
        referral_code: partner.referral_code,
        referral_tracking_url: partner.referral_tracking_url || `https://skyyield.io/partners/location?ref=${partner.partner_id}`,
        commission_type: partner.commission_type,
        commission_percentage: partner.commission_percentage,
        commission_flat_fee: partner.commission_flat_fee,
        commission_per_referral: partner.commission_per_referral,
        total_referrals: partner.total_referrals || formattedReferrals.length,
        active_referrals: partner.active_referrals || formattedReferrals.filter(r => r.status === 'active').length,
        total_earned: partner.total_earned || 0,
        tipalti_payee_id: partner.tipalti_payee_id,
        tipalti_status: partner.tipalti_status,
      },
      referrals: formattedReferrals,
      commissions: commissions || []
    })

  } catch (error) {
    console.error('Referral partner portal error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
