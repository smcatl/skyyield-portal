// app/api/admin/commissions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET - Fetch commission records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const status = searchParams.get('status')
    const partnerType = searchParams.get('partner_type')

    let query = supabase
      .from('monthly_commissions')
      .select('*')
      .order('commission_month', { ascending: false })
      .order('created_at', { ascending: false })

    if (month) {
      query = query.eq('commission_month', month)
    }
    if (status) {
      query = query.eq('payment_status', status)
    }
    if (partnerType) {
      query = query.eq('recipient_type', partnerType)
    }

    const { data: commissions, error } = await query

    if (error) {
      throw error
    }

    // Enrich with partner names
    const enrichedCommissions = await Promise.all((commissions || []).map(async (comm) => {
      let partnerName = ''
      let companyName = ''
      let tipaltiPayeeId = ''

      if (comm.location_partner_id) {
        const { data } = await supabase
          .from('location_partners')
          .select('contact_name, company_name, tipalti_payee_id')
          .eq('id', comm.location_partner_id)
          .single()
        if (data) {
          partnerName = data.contact_name
          companyName = data.company_name
          tipaltiPayeeId = data.tipalti_payee_id
        }
      } else if (comm.referral_partner_id) {
        const { data } = await supabase
          .from('referral_partners')
          .select('contact_name, company_name, tipalti_payee_id')
          .eq('id', comm.referral_partner_id)
          .single()
        if (data) {
          partnerName = data.contact_name
          companyName = data.company_name
          tipaltiPayeeId = data.tipalti_payee_id
        }
      } else if (comm.channel_partner_id) {
        const { data } = await supabase
          .from('channel_partners')
          .select('contact_name, company_name, tipalti_payee_id')
          .eq('id', comm.channel_partner_id)
          .single()
        if (data) {
          partnerName = data.contact_name
          companyName = data.company_name
          tipaltiPayeeId = data.tipalti_payee_id
        }
      } else if (comm.relationship_partner_id) {
        const { data } = await supabase
          .from('relationship_partners')
          .select('contact_name, company_name, tipalti_payee_id')
          .eq('id', comm.relationship_partner_id)
          .single()
        if (data) {
          partnerName = data.contact_name
          companyName = data.company_name
          tipaltiPayeeId = data.tipalti_payee_id
        }
      }

      return {
        ...comm,
        partner_name: partnerName,
        company_name: companyName,
        tipalti_payee_id: tipaltiPayeeId
      }
    }))

    // Get summary stats
    const pending = enrichedCommissions.filter(c => c.payment_status === 'pending')
    const paid = enrichedCommissions.filter(c => c.payment_status === 'paid')
    const totalPending = pending.reduce((sum, c) => sum + (c.commission_amount || 0), 0)
    const totalPaid = paid.reduce((sum, c) => sum + (c.commission_amount || 0), 0)

    return NextResponse.json({
      success: true,
      commissions: enrichedCommissions,
      stats: {
        totalRecords: enrichedCommissions.length,
        pendingCount: pending.length,
        paidCount: paid.length,
        totalPending,
        totalPaid
      }
    })

  } catch (error) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch commissions' }, { status: 500 })
  }
}

// POST - Create commission record or calculate commission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'calculate') {
      return calculateCommission(body)
    }

    // Default: create commission record
    const { 
      recipient_type,
      partner_id,
      commission_month,
      commission_amount,
      calculation_method,
      calculation_details,
      revenue_basis,
      notes
    } = body

    // Generate commission ID
    const year = new Date().getFullYear()
    const { data: lastComm } = await supabase
      .from('monthly_commissions')
      .select('commission_id')
      .ilike('commission_id', `COMM-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let nextNum = 1
    if (lastComm?.commission_id) {
      const match = lastComm.commission_id.match(/COMM-\d+-(\d+)/)
      if (match) nextNum = parseInt(match[1]) + 1
    }

    const commissionId = `COMM-${year}-${String(nextNum).padStart(3, '0')}`

    // Build insert data
    const insertData: any = {
      commission_id: commissionId,
      recipient_type,
      commission_month,
      commission_amount,
      calculation_method,
      calculation_details,
      revenue_basis,
      payment_status: 'pending',
      notes
    }

    // Set partner ID field based on type
    const partnerIdField = `${recipient_type}_id`
    insertData[partnerIdField] = partner_id

    const { data, error } = await supabase
      .from('monthly_commissions')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      commission: data,
      message: 'Commission record created'
    })

  } catch (error) {
    console.error('Error creating commission:', error)
    return NextResponse.json({ success: false, error: 'Failed to create commission' }, { status: 500 })
  }
}

// Calculate commission based on partner settings
async function calculateCommission(body: any) {
  const { partnerId, partnerType, month, revenueBasis } = body

  // Determine table name
  const tableMap: Record<string, string> = {
    location_partner: 'location_partners',
    referral_partner: 'referral_partners',
    channel_partner: 'channel_partners',
    relationship_partner: 'relationship_partners'
  }

  const tableName = tableMap[partnerType]
  if (!tableName) {
    return NextResponse.json({ success: false, error: 'Invalid partner type' }, { status: 400 })
  }

  // Get partner commission settings
  const { data: partner, error: partnerError } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', partnerId)
    .single()

  if (partnerError || !partner) {
    return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 })
  }

  let commissionAmount = 0
  let calculationMethod = partner.commission_structure_type
  let calculationDetails = ''

  switch (partner.commission_structure_type) {
    case 'flat_fee':
      commissionAmount = partner.commission_flat_fee_monthly || 0
      calculationDetails = `Flat fee: $${commissionAmount}/month`
      break

    case 'percentage':
      if (!revenueBasis) {
        return NextResponse.json({ 
          success: false, 
          error: 'Revenue basis required for percentage calculation' 
        }, { status: 400 })
      }
      commissionAmount = (revenueBasis * (partner.commission_percentage || 0)) / 100
      calculationDetails = `${partner.commission_percentage}% of $${revenueBasis} = $${commissionAmount.toFixed(2)}`
      break

    case 'per_referral':
      // Count active referrals for this month
      const { count: referralCount } = await supabase
        .from('location_partners')
        .select('id', { count: 'exact' })
        .eq('referred_by_partner_id', partnerId)
        .eq('status', 'active')
        .gte('activation_date', month)
        .lt('activation_date', new Date(new Date(month).setMonth(new Date(month).getMonth() + 1)).toISOString().split('T')[0])

      commissionAmount = (referralCount || 0) * (partner.commission_per_referral || 0)
      calculationDetails = `${referralCount || 0} referrals × $${partner.commission_per_referral} = $${commissionAmount.toFixed(2)}`
      break

    case 'hybrid':
      const flatPart = partner.commission_flat_fee_monthly || 0
      const percentPart = revenueBasis ? (revenueBasis * (partner.commission_percentage || 0)) / 100 : 0
      commissionAmount = flatPart + percentPart
      calculationDetails = `$${flatPart} flat + ${partner.commission_percentage}% of $${revenueBasis || 0} = $${commissionAmount.toFixed(2)}`
      break

    default:
      return NextResponse.json({ success: false, error: 'No commission structure set' }, { status: 400 })
  }

  // Create commission record
  const year = new Date().getFullYear()
  const { data: lastComm } = await supabase
    .from('monthly_commissions')
    .select('commission_id')
    .ilike('commission_id', `COMM-${year}-%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let nextNum = 1
  if (lastComm?.commission_id) {
    const match = lastComm.commission_id.match(/COMM-\d+-(\d+)/)
    if (match) nextNum = parseInt(match[1]) + 1
  }

  const commissionId = `COMM-${year}-${String(nextNum).padStart(3, '0')}`

  const insertData: any = {
    commission_id: commissionId,
    recipient_type: partnerType,
    commission_month: month,
    commission_amount: commissionAmount,
    calculation_method: calculationMethod,
    calculation_details: calculationDetails,
    revenue_basis: revenueBasis || null,
    payment_status: 'pending'
  }

  // Set partner ID field
  insertData[`${partnerType}_id`] = partnerId

  const { data: commission, error: insertError } = await supabase
    .from('monthly_commissions')
    .insert(insertData)
    .select()
    .single()

  if (insertError) {
    console.error('Insert error:', insertError)
    return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    commission,
    message: `Commission calculated: $${commissionAmount.toFixed(2)}`
  })
}

// PUT - Update commission status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, payment_status, payment_date, payment_method, payment_reference } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Commission ID required' }, { status: 400 })
    }

    const updateData: any = {
      payment_status,
      updated_at: new Date().toISOString()
    }

    if (payment_date) updateData.payment_date = payment_date
    if (payment_method) updateData.payment_method = payment_method
    if (payment_reference) updateData.payment_reference = payment_reference

    const { data, error } = await supabase
      .from('monthly_commissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      commission: data,
      message: 'Commission updated'
    })

  } catch (error) {
    console.error('Error updating commission:', error)
    return NextResponse.json({ success: false, error: 'Failed to update commission' }, { status: 500 })
  }
}
