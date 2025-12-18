// app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PartnerPayment {
  id: string
  name: string
  email: string
  type: 'location_partner' | 'referral_partner' | 'channel_partner' | 'relationship_partner'
  tipalti_payee_id: string | null
  tipalti_status: string | null
  company_name: string | null
  total_earned: number
  last_payment_date: string | null
  last_payment_amount: number | null
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const partners: PartnerPayment[] = []

    // Get Location Partners with Tipalti IDs
    const { data: locationPartners } = await supabase
      .from('location_partners')
      .select(`
        id,
        company_legal_name,
        dba_name,
        contact_first_name,
        contact_last_name,
        contact_email,
        tipalti_payee_id,
        tipalti_status,
        last_payment_date,
        last_payment_amount
      `)
      .not('tipalti_payee_id', 'is', null)
      .order('company_legal_name')

    if (locationPartners) {
      for (const lp of locationPartners) {
        partners.push({
          id: lp.id,
          name: `${lp.contact_first_name || ''} ${lp.contact_last_name || ''}`.trim() || 'Unknown',
          email: lp.contact_email || '',
          type: 'location_partner',
          tipalti_payee_id: lp.tipalti_payee_id,
          tipalti_status: lp.tipalti_status,
          company_name: lp.company_legal_name || lp.dba_name,
          total_earned: 0, // Will be calculated from Tipalti or commission_payments table
          last_payment_date: lp.last_payment_date,
          last_payment_amount: lp.last_payment_amount
        })
      }
    }

    // Get Referral Partners with Tipalti IDs
    const { data: referralPartners } = await supabase
      .from('referral_partners')
      .select(`
        id,
        company_name,
        contact_name,
        email,
        tipalti_payee_id,
        tipalti_status
      `)
      .not('tipalti_payee_id', 'is', null)
      .order('contact_name')

    if (referralPartners) {
      for (const rp of referralPartners) {
        partners.push({
          id: rp.id,
          name: rp.contact_name || 'Unknown',
          email: rp.email || '',
          type: 'referral_partner',
          tipalti_payee_id: rp.tipalti_payee_id,
          tipalti_status: rp.tipalti_status,
          company_name: rp.company_name,
          total_earned: 0,
          last_payment_date: null,
          last_payment_amount: null
        })
      }
    }

    // Get Channel Partners with Tipalti IDs
    const { data: channelPartners } = await supabase
      .from('channel_partners')
      .select(`
        id,
        company_name,
        contact_name,
        email,
        tipalti_payee_id,
        tipalti_status
      `)
      .not('tipalti_payee_id', 'is', null)
      .order('contact_name')

    if (channelPartners) {
      for (const cp of channelPartners) {
        partners.push({
          id: cp.id,
          name: cp.contact_name || 'Unknown',
          email: cp.email || '',
          type: 'channel_partner',
          tipalti_payee_id: cp.tipalti_payee_id,
          tipalti_status: cp.tipalti_status,
          company_name: cp.company_name,
          total_earned: 0,
          last_payment_date: null,
          last_payment_amount: null
        })
      }
    }

    // Get Relationship Partners with Tipalti IDs
    const { data: relationshipPartners } = await supabase
      .from('relationship_partners')
      .select(`
        id,
        company_name,
        contact_name,
        email,
        tipalti_payee_id,
        tipalti_status
      `)
      .not('tipalti_payee_id', 'is', null)
      .order('contact_name')

    if (relationshipPartners) {
      for (const relp of relationshipPartners) {
        partners.push({
          id: relp.id,
          name: relp.contact_name || 'Unknown',
          email: relp.email || '',
          type: 'relationship_partner',
          tipalti_payee_id: relp.tipalti_payee_id,
          tipalti_status: relp.tipalti_status,
          company_name: relp.company_name,
          total_earned: 0,
          last_payment_date: null,
          last_payment_amount: null
        })
      }
    }

    return NextResponse.json({
      success: true,
      partners,
      count: partners.length
    })

  } catch (error) {
    console.error('Admin payments error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
