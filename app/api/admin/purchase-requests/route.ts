// API Route: Device Purchase Requests (Supabase)
// app/api/admin/purchase-requests/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// GET: Fetch purchase requests
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Single request fetch
    if (id) {
      const { data: purchaseRequest, error } = await supabase
        .from('device_purchase_requests')
        .select('*, location_partners(company_legal_name, dba_name), venues(venue_name), products(name, sku)')
        .eq('id', id)
        .single()

      if (error || !purchaseRequest) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      return NextResponse.json({ purchaseRequest })
    }

    // List purchase requests
    let query = supabase
      .from('device_purchase_requests')
      .select('*, location_partners(company_legal_name, dba_name), venues(venue_name), products(name, sku)')

    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }

    const source = searchParams.get('source')
    if (source) {
      query = query.eq('source', source)
    }

    const partnerId = searchParams.get('partnerId') || searchParams.get('location_partner_id')
    if (partnerId) {
      query = query.eq('location_partner_id', partnerId)
    }

    const { data: purchaseRequests, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate summary stats
    const summary = {
      auto_created: 0,
      pending_approval: 0,
      approved: 0,
      ordered: 0,
      shipped: 0,
      received: 0,
      assigned: 0,
      cancelled: 0,
      total: purchaseRequests?.length || 0,
    }

    purchaseRequests?.forEach((pr) => {
      if (pr.status in summary) {
        summary[pr.status as keyof typeof summary]++
      }
    })

    return NextResponse.json({ purchaseRequests: purchaseRequests || [], summary })
  } catch (error) {
    console.error('GET /api/admin/purchase-requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create purchase request
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    // Get product details if product_id provided
    let productName = body.productName || body.product_name
    let productSku = body.productSku || body.product_sku
    let unitCost = body.unitCost || body.unit_cost

    if (body.productId || body.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('name, sku, our_cost')
        .eq('id', body.productId || body.product_id)
        .single()

      if (product) {
        productName = productName || product.name
        productSku = productSku || product.sku
        unitCost = unitCost || product.our_cost
      }
    }

    const requestData = {
      source: body.source || 'admin',
      location_partner_id: body.locationPartnerId || body.location_partner_id,
      venue_id: body.venueId || body.venue_id,
      product_id: body.productId || body.product_id,
      product_name: productName,
      product_sku: productSku,
      quantity: body.quantity || 1,
      unit_cost: unitCost,
      ownership: body.ownership || 'skyyield_owned',
      status: body.source === 'loi_auto' ? 'auto_created' : 'pending_approval',
      requires_approval: body.source !== 'loi_auto',
      urgency: body.urgency || 'normal',
      requested_by: body.requestedBy || body.requested_by,
      notes: body.notes,
      internal_notes: body.internalNotes || body.internal_notes,
    }

    const { data: purchaseRequest, error } = await supabase
      .from('device_purchase_requests')
      .insert(requestData)
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'device_purchase_request',
      entity_id: purchaseRequest.id,
      action: 'created',
      description: `Purchase request ${purchaseRequest.request_number} created (${requestData.source})`,
    })

    return NextResponse.json({ purchaseRequest }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/purchase-requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update purchase request
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    // Get current request
    const { data: currentRequest } = await supabase
      .from('device_purchase_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (!currentRequest) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Map camelCase to snake_case
    const updateData: Record<string, any> = {}
    const fieldMap: Record<string, string> = {
      productId: 'product_id',
      productName: 'product_name',
      productSku: 'product_sku',
      unitCost: 'unit_cost',
      totalCost: 'total_cost',
      approvedBy: 'approved_by',
      approvedAt: 'approved_at',
      approvalNotes: 'approval_notes',
      orderedAt: 'ordered_at',
      orderReference: 'order_reference',
      expectedDeliveryDate: 'expected_delivery_date',
      shippedAt: 'shipped_at',
      trackingNumber: 'tracking_number',
      receivedAt: 'received_at',
      receivedBy: 'received_by',
      assignedAt: 'assigned_at',
      internalNotes: 'internal_notes',
    }

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key] || key
      updateData[dbField] = value
    }

    // Handle status transitions
    const newStatus = updateData.status
    if (newStatus && newStatus !== currentRequest.status) {
      // Set timestamps based on status
      if (newStatus === 'approved' && !updateData.approved_at) {
        updateData.approved_at = new Date().toISOString()
      }
      if (newStatus === 'ordered' && !updateData.ordered_at) {
        updateData.ordered_at = new Date().toISOString()
      }
      if (newStatus === 'shipped' && !updateData.shipped_at) {
        updateData.shipped_at = new Date().toISOString()
      }
      if (newStatus === 'received' && !updateData.received_at) {
        updateData.received_at = new Date().toISOString()
      }
      if (newStatus === 'assigned' && !updateData.assigned_at) {
        updateData.assigned_at = new Date().toISOString()

        // Auto-create device when assigned
        if (currentRequest.venue_id) {
          const { data: device } = await supabase
            .from('devices')
            .insert({
              venue_id: currentRequest.venue_id,
              product_id: currentRequest.product_id,
              purchase_request_id: id,
              device_type: 'access_point',
              ownership: currentRequest.ownership,
              status: 'pending_install',
              unit_cost: currentRequest.unit_cost,
            })
            .select()
            .single()

          if (device) {
            updateData.device_id = device.id
          }
        }
      }
    }

    const { data: purchaseRequest, error } = await supabase
      .from('device_purchase_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log status change
    if (newStatus && newStatus !== currentRequest.status) {
      await supabase.from('activity_log').insert({
        entity_type: 'device_purchase_request',
        entity_id: id,
        action: 'status_change',
        description: `Purchase request status: ${currentRequest.status} → ${newStatus}`,
      })
    }

    return NextResponse.json({ purchaseRequest })
  } catch (error) {
    console.error('PUT /api/admin/purchase-requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove purchase request
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase.from('device_purchase_requests').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/purchase-requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
