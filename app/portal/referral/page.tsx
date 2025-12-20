// app/portal/referral/page.tsx
// Referral Partner Portal - Real data from Supabase

import { redirect } from 'next/navigation'
import { getEffectiveUser, getEffectivePartnerRecord } from '@/lib/getEffectiveUser'
import { ImpersonationAwareLayout } from '@/components/ImpersonationBanner'
import { createClient } from '@supabase/supabase-js'
import ReferralPortalClient from './ReferralPortalClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ReferralPartnerPortal() {
  const user = await getEffectiveUser()

  // Check authentication
  if (!user) {
    redirect('/sign-in')
  }

  // Check authorization - must be referral_partner (or admin impersonating one)
  if (user.userType !== 'referral_partner') {
    redirect('/dashboard')
  }

  // Get the partner record
  const partner = await getEffectivePartnerRecord(user)

  if (!partner) {
    return (
      <ImpersonationAwareLayout>
        <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Account Not Found</h1>
            <p className="text-[#94A3B8]">Your partner record could not be loaded. Please contact support.</p>
          </div>
        </div>
      </ImpersonationAwareLayout>
    )
  }

  // Fetch referrals (location partners referred by this partner)
  const { data: referrals } = await supabase
    .from('location_partners')
    .select('id, partner_id, company_legal_name, dba_name, contact_first_name, contact_last_name, contact_email, stage, pipeline_stage, tipalti_status, created_at')
    .eq('referred_by_partner_id', partner.id)
    .order('created_at', { ascending: false })

  // Fetch commission history
  const { data: commissions } = await supabase
    .from('monthly_commissions')
    .select('*')
    .eq('referral_partner_id', partner.id)
    .order('commission_month', { ascending: false })
    .limit(12)

  // Fetch Tipalti payment history if available
  let payments: any[] = []
  if (partner.tipalti_payee_id) {
    const { data: paymentData } = await supabase
      .from('tipalti_payments')
      .select('*')
      .eq('payee_id', partner.tipalti_payee_id)
      .order('payment_date', { ascending: false })
      .limit(10)
    payments = paymentData || []
  }

  // Calculate stats
  const formattedReferrals = (referrals || []).map(ref => ({
    id: ref.id,
    partner_id: ref.partner_id,
    company_name: ref.dba_name || ref.company_legal_name,
    contact_name: `${ref.contact_first_name || ''} ${ref.contact_last_name || ''}`.trim(),
    contact_email: ref.contact_email,
    status: ref.stage || ref.pipeline_stage,
    created_at: ref.created_at,
    is_active: (ref.stage || ref.pipeline_stage) === 'active',
  }))

  const totalReferrals = formattedReferrals.length
  const activeReferrals = formattedReferrals.filter(r => r.is_active).length
  const pendingReferrals = formattedReferrals.filter(r => !r.is_active).length

  // Calculate earnings
  const totalEarnings = (commissions || []).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
  const pendingCommissions = (commissions || []).filter(c => c.status === 'pending')
  const pendingEarnings = pendingCommissions.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)

  // Calculate conversion rate
  const conversionRate = totalReferrals > 0 ? Math.round((activeReferrals / totalReferrals) * 100) : 0

  // Build referral tracking URL
  const referralUrl = partner.referral_tracking_url || 
    `https://skyyield.io/apply/location-partner?ref=${partner.referral_code || partner.partner_id}`

  // Prepare data for client component
  const portalData = {
    partner: {
      id: partner.id,
      partner_id: partner.partner_id,
      company_name: partner.company_name,
      contact_name: partner.contact_name,
      contact_email: partner.contact_email,
      contact_phone: partner.contact_phone,
      pipeline_stage: partner.pipeline_stage,
      referral_code: partner.referral_code,
      referral_tracking_url: referralUrl,
      
      // Commission structure
      commission_type: partner.commission_type,
      commission_per_referral: partner.commission_per_referral,
      commission_percentage: partner.commission_percentage,
      commission_flat_fee: partner.commission_flat_fee,
      
      // Document statuses
      agreement_status: partner.agreement_status,
      agreement_signed_at: partner.agreement_signed_at,
      nda_status: partner.nda_status,
      nda_signed_at: partner.nda_signed_at,
      
      // Payment info
      tipalti_payee_id: partner.tipalti_payee_id,
      tipalti_status: partner.tipalti_status,
      total_referrals: partner.total_referrals || totalReferrals,
      active_referrals: partner.active_referrals || activeReferrals,
      total_earned: partner.total_earned || totalEarnings,
    },
    stats: {
      totalReferrals,
      activeReferrals,
      pendingReferrals,
      conversionRate,
      totalEarnings,
      pendingEarnings,
      commissionPerReferral: partner.commission_per_referral || 0,
    },
    referrals: formattedReferrals,
    commissions: commissions || [],
    payments: payments || [],
  }

  return (
    <ImpersonationAwareLayout>
      <ReferralPortalClient data={portalData} />
    </ImpersonationAwareLayout>
  )
}
