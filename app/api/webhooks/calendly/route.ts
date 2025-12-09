// API Route: Calendly Webhook
// app/api/webhooks/calendly/route.ts

import { NextRequest, NextResponse } from 'next/server'

// In production, store these in your database
// For now, we'll log them and you can add to your config

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📅 Calendly Webhook Received:', JSON.stringify(body, null, 2))
    
    const { event, payload } = body
    
    switch (event) {
      case 'event_type.created':
        console.log('✅ New Calendly Event Type Created:', {
          name: payload.name,
          slug: payload.slug,
          scheduling_url: payload.scheduling_url,
          duration: payload.duration,
          kind: payload.kind,
        })
        // TODO: Save to database
        // await db.calendlyLinks.create({ data: { ... } })
        break
        
      case 'event_type.updated':
        console.log('📝 Calendly Event Type Updated:', {
          name: payload.name,
          slug: payload.slug,
          scheduling_url: payload.scheduling_url,
        })
        // TODO: Update in database
        break
        
      case 'event_type.deleted':
        console.log('❌ Calendly Event Type Deleted:', {
          uri: payload.uri,
        })
        // TODO: Remove from database
        break
        
      case 'invitee.created':
        console.log('🎉 New Calendly Booking:', {
          event_name: payload.event_type?.name,
          invitee_name: payload.name,
          invitee_email: payload.email,
          scheduled_time: payload.scheduled_event?.start_time,
        })
        // TODO: Update partner stage, log activity, etc.
        break
        
      case 'invitee.canceled':
        console.log('😢 Calendly Booking Canceled:', {
          invitee_name: payload.name,
          invitee_email: payload.email,
        })
        break
        
      default:
        console.log('Unknown Calendly event:', event)
    }
    
    return NextResponse.json({ received: true, event })
    
  } catch (error) {
    console.error('Calendly webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Calendly sends a GET request to verify the webhook
export async function GET() {
  return NextResponse.json({ status: 'Calendly webhook endpoint active' })
}