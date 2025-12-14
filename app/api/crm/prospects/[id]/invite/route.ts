// API Route: Send Invite Form to Prospect
// app/api/crm/prospects/[id]/invite/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// POST: Send invite form
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    
    // Get prospect
    const { data: prospect, error: fetchError } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
    }
    
    // Determine form URL based on prospect type
    const formUrls: Record<string, string> = {
      location_partner: `https://skyyield.io/apply/location-partner?ref=${prospect.id}`,
      referral_partner: `https://skyyield.io/apply/referral-partner?ref=${prospect.id}`,
      channel_partner: `https://skyyield.io/apply/channel-partner?ref=${prospect.id}`,
      relationship_partner: `https://skyyield.io/apply/relationship-partner?ref=${prospect.id}`,
      contractor: `https://skyyield.io/apply/contractor?ref=${prospect.id}`,
    }
    
    const formUrl = formUrls[prospect.prospect_type] || formUrls.location_partner
    
    // TODO: Send email via Resend
    // For now, just log the activity
    console.log(`Would send invite email to ${prospect.email} with form URL: ${formUrl}`)
    
    // Log activity
    await supabase.from('prospect_activities').insert({
      prospect_id: id,
      type: 'form_sent',
      description: `Invite form sent to ${prospect.email}`,
      created_by: 'Admin',
      metadata: { form_url: formUrl, prospect_type: prospect.prospect_type },
    })
    
    // Update prospect status if still 'new'
    if (prospect.status === 'new') {
      await supabase
        .from('prospects')
        .update({ 
          status: 'contacted',
          last_contact_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Invite form sent to ${prospect.email}`,
      formUrl,
    })
  } catch (error) {
    console.error('POST /api/crm/prospects/[id]/invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
