// API Route: Clerk Webhook (User Sync to Supabase)
// app/api/webhooks/clerk/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { Webhook } from 'svix'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    // Get webhook secret from environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('Missing CLERK_WEBHOOK_SECRET')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Get headers for verification
    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
    }

    // Get body
    const body = await request.text()

    // Verify webhook signature
    const wh = new Webhook(webhookSecret)
    let evt: any

    try {
      evt = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      })
    } catch (err) {
      console.error('Webhook verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const { type, data } = evt

    console.log(`📧 Clerk Webhook: ${type}`, data.id)

    switch (type) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name, image_url, public_metadata } = data

        const primaryEmail = email_addresses?.find((e: any) => e.id === data.primary_email_address_id)
        const email = primaryEmail?.email_address

        if (!email) {
          console.error('No email found for user', id)
          return NextResponse.json({ error: 'No email' }, { status: 400 })
        }

        // Determine user type from metadata or default
        const userType = public_metadata?.user_type || 'customer'
        const isAdmin = public_metadata?.is_admin === true

        // Check if user already exists (by email or clerk_id)
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .or(`clerk_id.eq.${id},email.eq.${email}`)
          .single()

        if (existingUser) {
          // Update existing user
          await supabase
            .from('users')
            .update({
              clerk_id: id,
              first_name,
              last_name,
              avatar_url: image_url,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingUser.id)

          console.log(`✅ Updated existing user ${existingUser.id}`)
        } else {
          // Create new user
          const { data: newUser, error } = await supabase
            .from('users')
            .insert({
              clerk_id: id,
              email,
              first_name,
              last_name,
              avatar_url: image_url,
              user_type: userType,
              is_admin: isAdmin,
              portal_status: userType === 'calculator_user' || userType === 'customer' 
                ? 'account_active' 
                : 'pending_form',
              is_approved: userType === 'calculator_user' || userType === 'customer',
            })
            .select()
            .single()

          if (error) {
            console.error('Error creating user:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
          }

          console.log(`✅ Created new user ${newUser.id}`)

          // Try to match with existing partner record
          await matchUserToPartner(supabase, newUser.id, email, userType)
        }

        break
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url, public_metadata } = data

        const primaryEmail = email_addresses?.find((e: any) => e.id === data.primary_email_address_id)
        const email = primaryEmail?.email_address

        await supabase
          .from('users')
          .update({
            email,
            first_name,
            last_name,
            avatar_url: image_url,
            user_type: public_metadata?.user_type,
            is_admin: public_metadata?.is_admin === true,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_id', id)

        console.log(`✅ Updated user ${id}`)
        break
      }

      case 'user.deleted': {
        const { id } = data

        // Soft delete - just deactivate
        await supabase
          .from('users')
          .update({
            portal_status: 'deactivated',
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_id', id)

        console.log(`✅ Deactivated user ${id}`)
        break
      }

      default:
        console.log(`Unhandled Clerk event: ${type}`)
    }

    return NextResponse.json({ received: true, type })
  } catch (error) {
    console.error('Clerk webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Helper: Match user to existing partner record
async function matchUserToPartner(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  email: string,
  userType: string
) {
  // Check location_partners
  const { data: lp } = await supabase
    .from('location_partners')
    .select('id, pipeline_stage')
    .eq('contact_email', email)
    .single()

  if (lp) {
    // Link user to location partner
    await supabase.from('location_partners').update({ user_id: userId }).eq('id', lp.id)

    await supabase
      .from('users')
      .update({
        partner_record_id: lp.id,
        user_type: 'location_partner',
        portal_status: lp.pipeline_stage === 'trial_active' || lp.pipeline_stage === 'active' 
          ? 'account_active' 
          : 'pending_approval',
      })
      .eq('id', userId)

    console.log(`✅ Linked user to location partner ${lp.id}`)
    return
  }

  // Check referral_partners
  const { data: rp } = await supabase
    .from('referral_partners')
    .select('id, pipeline_stage')
    .eq('contact_email', email)
    .single()

  if (rp) {
    await supabase.from('referral_partners').update({ user_id: userId }).eq('id', rp.id)

    await supabase
      .from('users')
      .update({
        partner_record_id: rp.id,
        user_type: 'referral_partner',
        portal_status: rp.pipeline_stage === 'active' ? 'account_active' : 'pending_approval',
      })
      .eq('id', userId)

    console.log(`✅ Linked user to referral partner ${rp.id}`)
    return
  }

  // No partner match - user needs to fill out form
  console.log(`ℹ️ No partner match for ${email} - portal_status remains pending_form`)
}

// GET endpoint for verification
export async function GET() {
  return NextResponse.json({ status: 'Clerk webhook endpoint active' })
}
