// app/api/portal/relationship-partner/route.ts
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
      .select('id, relationship_partner_id')
      .eq('clerk_id', userId)
      .single()

    // Find relationship partner by user link or email
    let partner = null

    if (userData?.relationship_partner_id) {
      const { data } = await supabase
        .from('relationship_partners')
        .select('*')
        .eq('id', userData.relationship_partner_id)
        .single()
      partner = data
    }

    if (!partner && userEmail) {
      const { data } = await supabase
        .from('relationship_partners')
        .select('*')
        .eq('contact_email', userEmail)
        .single()
      partner = data

      // Auto-link if found by email
      if (partner && userData?.id && !partner.user_id) {
        await supabase
          .from('relationship_partners')
          .update({ user_id: userData.id })
          .eq('id', partner.id)
        
        await supabase
          .from('users')
          .update({ relationship_partner_id: partner.id })
          .eq('id', userData.id)
      }
    }

    if (!partner) {
      return NextResponse.json({ 
        success: false, 
        error: 'No relationship partner account found for this user' 
      }, { status: 404 })
    }

    // Fetch referrals (location partners referred by this relationship partner)
    const { data: referrals } = await supabase
      .from('location_partners')
      .select('id, partner_id, company_legal_name, dba_name, contact_first_name, contact_last_name, pipeline_stage, created_at')
      .eq('referred_by_partner_id', partner.id)
      .order('created_at', { ascending: false })

    // Fetch commission history
    const { data: commissions } = await supabase
      .from('monthly_commissions')
      .select('*')
      .eq('relationship_partner_id', partner.id)
      .order('commission_month', { ascending: false })
      .limit(12)

    // Fetch CRM prospects assigned to this partner
    const { data: prospects } = await supabase
      .from('prospects')
      .select('*')
      .eq('assigned_to', userData?.id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Calculate stats
    const activeReferrals = referrals?.filter(r => r.pipeline_stage === 'active').length || 0
    const totalEarned = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0) || 0
    const pendingEarnings = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0) || 0

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
        commission_type: partner.commission_type,
        commission_percentage: partner.commission_percentage,
        agreement_status: partner.agreement_status,
        nda_status: partner.nda_status,
        tipalti_status: partner.tipalti_status,
        last_payment_date: partner.last_payment_date,
        last_payment_amount: partner.last_payment_amount,
      },
      stats: {
        totalReferrals: referrals?.length || 0,
        activeReferrals,
        totalEarned,
        pendingEarnings,
        totalProspects: prospects?.length || 0,
      },
      referrals: (referrals || []).map(ref => ({
        id: ref.id,
        partner_id: ref.partner_id,
        company_name: ref.dba_name || ref.company_legal_name,
        contact_name: `${ref.contact_first_name || ''} ${ref.contact_last_name || ''}`.trim(),
        status: ref.pipeline_stage,
        created_at: ref.created_at,
      })),
      commissions: commissions || [],
      prospects: prospects || [],
    })

  } catch (error) {
    console.error('Relationship partner portal error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
