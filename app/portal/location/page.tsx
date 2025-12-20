// app/portal/location/page.tsx
// Location Partner Portal - Real data from Supabase

import { redirect } from 'next/navigation'
import { getEffectiveUser, getEffectivePartnerRecord } from '@/lib/getEffectiveUser'
import { ImpersonationAwareLayout } from '@/components/ImpersonationBanner'
import { createClient } from '@supabase/supabase-js'
import LocationPortalClient from './LocationPortalClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function LocationPartnerPortal() {
  const user = await getEffectiveUser()

  // Check authentication
  if (!user) {
    redirect('/sign-in')
  }

  // Check authorization - must be location_partner (or admin impersonating one)
  if (user.userType !== 'location_partner') {
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

  // Fetch venues for this partner
  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .eq('location_partner_id', partner.id)
    .order('created_at', { ascending: false })

  // Fetch devices for all venues
  const venueIds = (venues || []).map(v => v.id)
  let devices: any[] = []
  if (venueIds.length > 0) {
    const { data: deviceData } = await supabase
      .from('devices')
      .select('*')
      .in('venue_id', venueIds)
    devices = deviceData || []
  }

  // Fetch commission/payment history
  const { data: commissions } = await supabase
    .from('monthly_commissions')
    .select('*')
    .eq('location_partner_id', partner.id)
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
  const activeVenues = (venues || []).filter(v => v.status === 'active')
  const trialVenues = (venues || []).filter(v => v.status === 'trial')
  const totalDevices = devices.length
  const activeDevices = devices.filter(d => d.status === 'active').length

  // Calculate total earnings from commissions
  const totalEarnings = (commissions || []).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
  const lastPayment = payments[0]

  // Calculate data offloaded (sum from devices or venues)
  const totalDataGB = devices.reduce((sum, d) => sum + (parseFloat(d.data_offloaded_gb) || 0), 0)

  // Get next payment estimate
  const pendingCommissions = (commissions || []).filter(c => c.status === 'pending')
  const nextPaymentAmount = pendingCommissions.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)

  // Build venue data with device counts
  const venuesWithDevices = (venues || []).map(venue => {
    const venueDevices = devices.filter(d => d.venue_id === venue.id)
    const venueDataUsage = venueDevices.reduce((sum, d) => sum + (parseFloat(d.data_offloaded_gb) || 0), 0)
    
    return {
      id: venue.id,
      venue_id: venue.venue_id,
      name: venue.venue_name,
      address: venue.address_line_1,
      city: venue.city,
      state: venue.state,
      type: venue.venue_type,
      status: venue.status,
      devicesInstalled: venueDevices.length,
      activeDevices: venueDevices.filter(d => d.status === 'active').length,
      dataUsageGB: venueDataUsage,
      monthlyEarnings: 0, // Would need venue-level revenue data
      trialStartDate: venue.trial_start_date,
      trialEndDate: venue.trial_end_date,
      trialDaysRemaining: venue.trial_end_date 
        ? Math.max(0, Math.ceil((new Date(venue.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null,
      installDate: venue.install_completed_at,
      created_at: venue.created_at,
    }
  })

  // Prepare data for client component
  const portalData = {
    partner: {
      id: partner.id,
      partner_id: partner.partner_id,
      company_legal_name: partner.company_legal_name,
      dba_name: partner.dba_name,
      contact_first_name: partner.contact_first_name,
      contact_last_name: partner.contact_last_name,
      contact_email: partner.contact_email,
      contact_phone: partner.contact_phone,
      stage: partner.stage || partner.pipeline_stage,
      
      // Document statuses
      loi_status: partner.loi_status,
      loi_signed_at: partner.loi_signed_at,
      deployment_status: partner.deployment_status,
      deployment_signed_at: partner.deployment_signed_at,
      contract_status: partner.contract_status,
      contract_signed_at: partner.contract_signed_at,
      nda_status: partner.nda_status,
      nda_signed_at: partner.nda_signed_at,
      
      // Trial info
      trial_status: partner.trial_status,
      trial_start_date: partner.trial_start_date,
      trial_end_date: partner.trial_end_date,
      trial_days_remaining: partner.trial_days_remaining,
      
      // Payment info
      tipalti_payee_id: partner.tipalti_payee_id,
      tipalti_status: partner.tipalti_status,
      commission_type: partner.commission_type,
      commission_percentage: partner.commission_percentage,
      commission_flat_fee: partner.commission_flat_fee,
      last_payment_amount: partner.last_payment_amount,
      last_payment_date: partner.last_payment_date,
    },
    stats: {
      totalVenues: (venues || []).length,
      activeVenues: activeVenues.length,
      trialVenues: trialVenues.length,
      totalDevices,
      activeDevices,
      totalEarnings,
      totalDataGB,
      nextPaymentAmount,
      lastPaymentAmount: lastPayment?.amount || partner.last_payment_amount,
      lastPaymentDate: lastPayment?.payment_date || partner.last_payment_date,
    },
    venues: venuesWithDevices,
    commissions: commissions || [],
    payments: payments || [],
  }

  return (
    <ImpersonationAwareLayout>
      <LocationPortalClient data={portalData} />
    </ImpersonationAwareLayout>
  )
}
