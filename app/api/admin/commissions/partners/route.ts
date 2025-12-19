// app/api/admin/commissions/partners/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET - Fetch all partners with commission info
export async function GET(request: NextRequest) {
  try {
    const partners: any[] = []

    // Fetch Location Partners
    const { data: locationPartners } = await supabase
      .from('location_partners')
      .select('id, partner_id, contact_name, email, company_name, tipalti_payee_id, tipalti_status, commission_structure_type, commission_flat_fee_monthly, commission_percentage, commission_notes, status')
      .in('status', ['active', 'pending'])
      .order('contact_name')

    locationPartners?.forEach(p => {
      partners.push({
        ...p,
        partner_type: 'location_partner',
        commission_per_referral: 0
      })
    })

    // Fetch Referral Partners
    const { data: referralPartners } = await supabase
      .from('referral_partners')
      .select('id, partner_id, contact_name, email, company_name, tipalti_payee_id, tipalti_status, commission_structure_type, commission_flat_fee_monthly, commission_percentage, commission_per_referral, commission_notes, status')
      .in('status', ['active', 'pending'])
      .order('contact_name')

    referralPartners?.forEach(p => {
      partners.push({
        ...p,
        partner_type: 'referral_partner'
      })
    })

    // Fetch Channel Partners
    const { data: channelPartners } = await supabase
      .from('channel_partners')
      .select('id, partner_id, contact_name, email, company_name, tipalti_payee_id, tipalti_status, commission_structure_type, commission_flat_fee_monthly, commission_percentage, commission_notes, status')
      .in('status', ['active', 'pending'])
      .order('contact_name')

    channelPartners?.forEach(p => {
      partners.push({
        ...p,
        partner_type: 'channel_partner',
        commission_per_referral: 0
      })
    })

    // Fetch Relationship Partners
    const { data: relationshipPartners } = await supabase
      .from('relationship_partners')
      .select('id, partner_id, contact_name, email, company_name, tipalti_payee_id, tipalti_status, commission_structure_type, commission_flat_fee_monthly, commission_percentage, commission_notes, status')
      .in('status', ['active', 'pending'])
      .order('contact_name')

    relationshipPartners?.forEach(p => {
      partners.push({
        ...p,
        partner_type: 'relationship_partner',
        commission_per_referral: 0
      })
    })

    return NextResponse.json({
      success: true,
      partners,
      count: partners.length
    })

  } catch (error) {
    console.error('Error fetching partners:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch partners' }, { status: 500 })
  }
}

// PUT - Update partner commission settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id, 
      partner_type,
      commission_structure_type,
      commission_flat_fee_monthly,
      commission_percentage,
      commission_per_referral,
      commission_notes
    } = body

    if (!id || !partner_type) {
      return NextResponse.json({ success: false, error: 'Partner ID and type required' }, { status: 400 })
    }

    // Determine table name
    const tableMap: Record<string, string> = {
      location_partner: 'location_partners',
      referral_partner: 'referral_partners',
      channel_partner: 'channel_partners',
      relationship_partner: 'relationship_partners'
    }

    const tableName = tableMap[partner_type]
    if (!tableName) {
      return NextResponse.json({ success: false, error: 'Invalid partner type' }, { status: 400 })
    }

    // Build update object
    const updateData: any = {
      commission_structure_type,
      commission_flat_fee_monthly: commission_flat_fee_monthly || 0,
      commission_percentage: commission_percentage || 0,
      commission_notes,
      updated_at: new Date().toISOString()
    }

    // Only referral partners have per_referral field
    if (partner_type === 'referral_partner') {
      updateData.commission_per_referral = commission_per_referral || 0
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      partner: data,
      message: 'Commission settings updated'
    })

  } catch (error) {
    console.error('Error updating partner:', error)
    return NextResponse.json({ success: false, error: 'Failed to update partner' }, { status: 500 })
  }
}
