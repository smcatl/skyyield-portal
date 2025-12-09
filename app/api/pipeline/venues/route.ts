import { NextRequest, NextResponse } from 'next/server'
import { Venue, Device } from '@/lib/pipeline/pipeline-types'

// ============================================
// IN-MEMORY STORAGE (shared with partners route in production)
// ============================================

let venues: Venue[] = []
let devices: Device[] = []

// Helper
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ============================================
// VENUES API
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const id = searchParams.get('id')
  const locationPartnerId = searchParams.get('locationPartnerId')
  const includeDevices = searchParams.get('includeDevices') === 'true'
  
  // Get single venue
  if (id) {
    const venue = venues.find(v => v.id === id)
    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }
    
    const response: any = { venue }
    if (includeDevices) {
      response.devices = devices.filter(d => d.venueId === id)
    }
    
    return NextResponse.json(response)
  }
  
  // Filter by location partner
  let filtered = venues
  if (locationPartnerId) {
    filtered = filtered.filter(v => v.locationPartnerId === locationPartnerId)
  }
  
  // Include device counts
  const venuesWithCounts = filtered.map(v => ({
    ...v,
    deviceCount: devices.filter(d => d.venueId === v.id).length,
  }))
  
  return NextResponse.json({ 
    venues: venuesWithCounts,
    total: filtered.length,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newVenue: Venue = {
      id: generateId('venue'),
      locationPartnerId: body.locationPartnerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      name: body.name,
      type: body.type,
      phone: body.phone,
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      
      solanaWallet: body.solanaWallet || 'skyyield_wallet',
      isp: body.isp,
      connectionType: body.connectionType,
      serviceCategory: body.serviceCategory,
      internetSpeed: body.internetSpeed,
      
      onsiteSecurity: body.onsiteSecurity || [],
      
      isActive: body.isActive ?? true,
      installDate: body.installDate,
      notes: body.notes,
    }
    
    venues.push(newVenue)
    
    return NextResponse.json({ venue: newVenue }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create venue' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    const index = venues.findIndex(v => v.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }
    
    venues[index] = {
      ...venues[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    
    return NextResponse.json({ venue: venues[index] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update venue' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }
  
  const index = venues.findIndex(v => v.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
  }
  
  // Also delete devices at this venue
  devices = devices.filter(d => d.venueId !== id)
  venues.splice(index, 1)
  
  return NextResponse.json({ success: true })
}