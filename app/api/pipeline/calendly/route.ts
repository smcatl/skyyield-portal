// API Route: Sync Calendly Event Types
// app/api/pipeline/calendly/route.ts

import { NextRequest, NextResponse } from 'next/server'

const CALENDLY_API_BASE = 'https://api.calendly.com'

// GET: Fetch all event types from Calendly
export async function GET(request: NextRequest) {
  const apiKey = process.env.CALENDLY_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'CALENDLY_API_KEY not configured',
      instructions: 'Get your API key from https://calendly.com/integrations/api_webhooks'
    }, { status: 500 })
  }
  
  try {
    // First, get the current user to get their URI
    const userRes = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!userRes.ok) {
      throw new Error(`Failed to fetch user: ${await userRes.text()}`)
    }
    
    const userData = await userRes.json()
    const userUri = userData.resource.uri
    const orgUri = userData.resource.current_organization
    
    // Now fetch all event types for the organization
    const eventsRes = await fetch(
      `${CALENDLY_API_BASE}/event_types?organization=${encodeURIComponent(orgUri)}&active=true`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )
    
    if (!eventsRes.ok) {
      throw new Error(`Failed to fetch events: ${await eventsRes.text()}`)
    }
    
    const eventsData = await eventsRes.json()
    
    // Transform to our format
    const calendlyLinks = eventsData.collection.map((event: any) => ({
      id: event.uri.split('/').pop(),
      name: event.name,
      slug: event.slug,
      url: event.scheduling_url,
      duration: event.duration,
      description: event.description_plain || '',
      active: event.active,
      kind: event.kind, // solo, group, round_robin
      color: event.color,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    }))
    
    return NextResponse.json({
      success: true,
      count: calendlyLinks.length,
      links: calendlyLinks,
      user: {
        name: userData.resource.name,
        email: userData.resource.email,
        timezone: userData.resource.timezone,
      }
    })
    
  } catch (error) {
    console.error('Calendly API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch Calendly events',
      details: String(error)
    }, { status: 500 })
  }
}

// POST: Create webhook subscription
export async function POST(request: NextRequest) {
  const apiKey = process.env.CALENDLY_API_KEY
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/calendly`
    : null
  
  if (!apiKey) {
    return NextResponse.json({ error: 'CALENDLY_API_KEY not configured' }, { status: 500 })
  }
  
  if (!webhookUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL not configured' }, { status: 500 })
  }
  
  try {
    const body = await request.json()
    const { action } = body
    
    // Get user/org info first
    const userRes = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const userData = await userRes.json()
    const orgUri = userData.resource.current_organization
    
    if (action === 'subscribe') {
      // Create webhook subscription
      const webhookRes = await fetch(`${CALENDLY_API_BASE}/webhook_subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: [
            'invitee.created',
            'invitee.canceled',
            'event_type.created',
            'event_type.updated', 
            'event_type.deleted',
          ],
          organization: orgUri,
          scope: 'organization',
        }),
      })
      
      if (!webhookRes.ok) {
        const error = await webhookRes.text()
        throw new Error(error)
      }
      
      const webhookData = await webhookRes.json()
      return NextResponse.json({
        success: true,
        message: 'Webhook subscription created',
        webhook: webhookData.resource,
      })
    }
    
    if (action === 'list') {
      // List existing webhooks
      const webhooksRes = await fetch(
        `${CALENDLY_API_BASE}/webhook_subscriptions?organization=${encodeURIComponent(orgUri)}`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
      )
      const webhooksData = await webhooksRes.json()
      return NextResponse.json({
        success: true,
        webhooks: webhooksData.collection,
      })
    }
    
    if (action === 'delete' && body.webhookUri) {
      // Delete a webhook
      const deleteRes = await fetch(body.webhookUri, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      return NextResponse.json({
        success: deleteRes.ok,
        message: deleteRes.ok ? 'Webhook deleted' : 'Failed to delete webhook',
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Calendly webhook setup error:', error)
    return NextResponse.json({ 
      error: 'Failed to manage webhook',
      details: String(error)
    }, { status: 500 })
  }
}