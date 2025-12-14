// API Route: Convert Prospect to Pipeline
// app/api/crm/prospects/[id]/convert/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// POST: Convert prospect to partner in pipeline
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
    
    let newPartnerId: string | null = null
    let partnerType = prospect.prospect_type
    
    // Create appropriate partner record based on type
    switch (prospect.prospect_type) {
      case 'location_partner': {
        const { data: partner, error } = await supabase
          .from('location_partners')
          .insert({
            contact_first_name: prospect.first_name,
            contact_last_name: prospect.last_name,
            contact_email: prospect.email,
            contact_phone: prospect.phone,
            company_legal_name: prospect.company_name,
            dba_name: prospect.company_name,
            city: prospect.city,
            state: prospect.state,
            pipeline_stage: 'initial_review',
            referral_source: prospect.source || 'CRM',
            notes: prospect.notes,
            tags: prospect.tags || [],
          })
          .select()
          .single()
        
        if (error) throw error
        newPartnerId = partner.id
        break
      }
      
      case 'referral_partner': {
        const { data: partner, error } = await supabase
          .from('referral_partners')
          .insert({
            contact_name: `${prospect.first_name} ${prospect.last_name}`,
            contact_email: prospect.email,
            contact_phone: prospect.phone,
            company_name: prospect.company_name,
            city: prospect.city,
            state: prospect.state,
            pipeline_stage: 'application',
            notes: prospect.notes,
          })
          .select()
          .single()
        
        if (error) throw error
        newPartnerId = partner.id
        break
      }
      
      case 'channel_partner': {
        // Check if channel_partners table exists, if not use a generic approach
        const { data: partner, error } = await supabase
          .from('channel_partners')
          .insert({
            contact_name: `${prospect.first_name} ${prospect.last_name}`,
            contact_email: prospect.email,
            contact_phone: prospect.phone,
            company_name: prospect.company_name,
            city: prospect.city,
            state: prospect.state,
            pipeline_stage: 'application',
            notes: prospect.notes,
          })
          .select()
          .single()
        
        if (error) {
          // Table might not exist yet - log and continue
          console.log('Channel partners table may not exist:', error)
        } else {
          newPartnerId = partner.id
        }
        break
      }
      
      case 'relationship_partner': {
        const { data: partner, error } = await supabase
          .from('relationship_partners')
          .insert({
            contact_name: `${prospect.first_name} ${prospect.last_name}`,
            contact_email: prospect.email,
            contact_phone: prospect.phone,
            company_name: prospect.company_name,
            city: prospect.city,
            state: prospect.state,
            pipeline_stage: 'application',
            notes: prospect.notes,
          })
          .select()
          .single()
        
        if (error) {
          console.log('Relationship partners table may not exist:', error)
        } else {
          newPartnerId = partner.id
        }
        break
      }
      
      case 'contractor': {
        const { data: partner, error } = await supabase
          .from('contractors')
          .insert({
            first_name: prospect.first_name,
            last_name: prospect.last_name,
            email: prospect.email,
            phone: prospect.phone,
            city: prospect.city,
            state: prospect.state,
            status: 'pending',
            notes: prospect.notes,
          })
          .select()
          .single()
        
        if (error) {
          console.log('Contractors table may not exist:', error)
        } else {
          newPartnerId = partner.id
        }
        break
      }
    }
    
    // Update prospect status to 'won'
    await supabase
      .from('prospects')
      .update({ 
        status: 'won',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    
    // Log activity
    await supabase.from('prospect_activities').insert({
      prospect_id: id,
      type: 'status_change',
      description: `Converted to ${partnerType.replace('_', ' ')}${newPartnerId ? ` (ID: ${newPartnerId})` : ''}`,
      created_by: 'Admin',
      metadata: { new_partner_id: newPartnerId, partner_type: partnerType },
    })
    
    return NextResponse.json({ 
      success: true, 
      message: `Prospect converted to ${partnerType.replace('_', ' ')}`,
      partnerId: newPartnerId,
      partnerType,
    })
  } catch (error) {
    console.error('POST /api/crm/prospects/[id]/convert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
