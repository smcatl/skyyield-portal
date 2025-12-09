import { NextRequest, NextResponse } from 'next/server'
import { Device } from '@/lib/pipeline/pipeline-types'

// ============================================
// IN-MEMORY STORAGE
// ============================================

let devices: Device[] = []

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ============================================
// DEVICES API
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const id = searchParams.get('id')
  const venueId = searchParams.get('venueId')
  const locationPartnerId = searchParams.get('locationPartnerId')
  
  // Get single device
  if (id) {
    const device = devices.find(d => d.id === id)
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }
    return NextResponse.json({ device })
  }
  
  // Filter
  let filtered = devices
  
  if (venueId) {
    filtered = filtered.filter(d => d.venueId === venueId)
  }
  
  if (locationPartnerId) {
    filtered = filtered.filter(d => d.locationPartnerId === locationPartnerId)
  }
  
  return NextResponse.json({ 
    devices: filtered,
    total: filtered.length,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newDevice: Device = {
      id: generateId('device'),
      venueId: body.venueId,
      locationPartnerId: body.locationPartnerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      name: body.name,
      model: body.model,
      macAddress: body.macAddress,
      serialNumber: body.serialNumber,
      placement: body.placement,
      
      tags: body.tags || [],
      isActive: body.isActive ?? true,
      installedAt: body.installedAt,
      notes: body.notes,
    }
    
    devices.push(newDevice)
    
    return NextResponse.json({ device: newDevice }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    const index = devices.findIndex(d => d.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }
    
    devices[index] = {
      ...devices[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    
    return NextResponse.json({ device: devices[index] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }
  
  const index = devices.findIndex(d => d.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }
  
  devices.splice(index, 1)
  
  return NextResponse.json({ success: true })
}