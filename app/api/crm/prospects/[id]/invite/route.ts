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
    const partnerTypeLabel = prospect.prospect_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    
    // Send email via Resend if API key is configured
    let emailSent = false
    if (process.env.RESEND_API_KEY) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SkyYield <noreply@skyyield.io>',
            to: prospect.email,
            subject: `You're Invited to Partner with SkyYield`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0A0F2C 0%, #1A1F3A 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #0EA5E9; margin: 0;">SkyYield</h1>
                  <p style="color: #94A3B8; margin-top: 10px;">Data Offloading Solutions</p>
                </div>
                
                <div style="padding: 40px 20px; background: #ffffff;">
                  <h2 style="color: #1A1F3A; margin-top: 0;">Hi ${prospect.first_name},</h2>
                  
                  <p style="color: #4B5563; line-height: 1.6;">
                    You've been invited to join SkyYield as a <strong>${partnerTypeLabel}</strong>!
                  </p>
                  
                  <p style="color: #4B5563; line-height: 1.6;">
                    SkyYield deploys WiFi infrastructure at venues and shares the data revenue with our partners. 
                    It's a simple way to generate passive income from your ${prospect.prospect_type === 'location_partner' ? 'venue' : 'network'}.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${formUrl}" 
                       style="display: inline-block; background: #0EA5E9; color: white; padding: 14px 28px; 
                              text-decoration: none; border-radius: 8px; font-weight: bold;">
                      Complete Your Application
                    </a>
                  </div>
                  
                  <p style="color: #4B5563; line-height: 1.6;">
                    Have questions? Reply to this email or schedule a call with us.
                  </p>
                  
                  <p style="color: #4B5563; line-height: 1.6;">
                    Best,<br>
                    The SkyYield Team
                  </p>
                </div>
                
                <div style="background: #F3F4F6; padding: 20px; text-align: center;">
                  <p style="color: #6B7280; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} SkyYield. All rights reserved.
                  </p>
                </div>
              </div>
            `,
          }),
        })
        
        if (emailRes.ok) {
          emailSent = true
        } else {
          const errorData = await emailRes.json()
          console.error('Resend error:', errorData)
        }
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr)
      }
    }
    
    // Log activity
    await supabase.from('prospect_activities').insert({
      prospect_id: id,
      type: 'form_sent',
      description: `Invite form ${emailSent ? 'emailed' : 'generated'} for ${prospect.email}`,
      created_by: 'Admin',
      metadata: { form_url: formUrl, prospect_type: prospect.prospect_type, email_sent: emailSent },
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
      message: emailSent 
        ? `Invite form emailed to ${prospect.email}` 
        : `Invite form generated (email not configured)`,
      formUrl,
      emailSent,
    })
  } catch (error) {
    console.error('POST /api/crm/prospects/[id]/invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
