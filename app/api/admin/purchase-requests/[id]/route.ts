// =============================================================================
// SINGLE PURCHASE REQUEST API ROUTE
// File: src/app/api/admin/purchase-requests/[id]/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================================================
// GET - Get Single Purchase Request
// =============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (!user || !['admin', 'employee'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('device_purchase_requests')
      .select(
        `
        *,
        location_partner:location_partners(id, company_legal_name, user_id),
        venue:venues(id, venue_name, city, state, address_line_1),
        product:approved_products(id, name, sku, our_cost, image_url),
        requester:users!device_purchase_requests_requested_by_fkey(id, full_name, email),
        approver:users!device_purchase_requests_approved_by_fkey(id, full_name, email),
        receiver:users!device_purchase_requests_received_by_fkey(id, full_name, email)
      `
      )
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/admin/purchase-requests/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// STATUS UPDATE API ROUTE
// File: src/app/api/admin/purchase-requests/[id]/status/route.ts
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user || !['admin', 'employee'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only admins can approve/reject
    const body = await request.json();
    const { action, notes, ...additionalData } = body;

    // Get current request
    const { data: currentRequest, error: fetchError } = await supabase
      .from('device_purchase_requests')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !currentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Build update object based on action
    let updateData: Record<string, any> = {};
    let newStatus: string = currentRequest.status;

    switch (action) {
      case 'approve':
        if (user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only admins can approve requests' },
            { status: 403 }
          );
        }
        newStatus = 'approved';
        updateData = {
          status: newStatus,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          approval_notes: notes || null,
        };
        break;

      case 'cancel':
        newStatus = 'cancelled';
        updateData = {
          status: newStatus,
          approval_notes: notes || null,
        };
        break;

      case 'ordered':
        if (!additionalData.order_reference) {
          return NextResponse.json(
            { error: 'Order reference is required' },
            { status: 400 }
          );
        }
        newStatus = 'ordered';
        updateData = {
          status: newStatus,
          ordered_at: new Date().toISOString(),
          order_reference: additionalData.order_reference,
          supplier: additionalData.supplier || null,
          expected_delivery_date: additionalData.expected_delivery_date || null,
        };
        break;

      case 'shipped':
        newStatus = 'shipped';
        updateData = {
          status: newStatus,
          shipped_at: new Date().toISOString(),
          tracking_number: additionalData.tracking_number || null,
        };
        break;

      case 'received':
        newStatus = 'received';
        updateData = {
          status: newStatus,
          received_at: new Date().toISOString(),
          received_by: user.id,
        };
        break;

      case 'assign':
        newStatus = 'assigned';
        updateData = {
          status: newStatus,
          assigned_at: new Date().toISOString(),
        };

        // Create device record if needed
        if (currentRequest.venue_id) {
          const { data: newDevice, error: deviceError } = await supabase
            .from('devices')
            .insert({
              venue_id: currentRequest.venue_id,
              product_id: currentRequest.product_id,
              device_name:
                currentRequest.product_name ||
                `Device from ${currentRequest.request_number}`,
              mac_address: additionalData.mac_address || null,
              serial_number: additionalData.serial_number || null,
              ownership: currentRequest.ownership,
              status: 'received',
              purchase_request_id: currentRequest.id,
              our_cost: currentRequest.unit_cost,
              notes: additionalData.device_notes || null,
            })
            .select()
            .single();

          if (!deviceError && newDevice) {
            updateData.device_id = newDevice.id;
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update the request
    const { data, error } = await supabase
      .from('device_purchase_requests')
      .update(updateData)
      .eq('id', params.id)
      .select(
        `
        *,
        location_partner:location_partners(id, company_legal_name, user_id),
        venue:venues(id, venue_name, city, state, address_line_1),
        product:approved_products(id, name, sku, our_cost, image_url),
        requester:users!device_purchase_requests_requested_by_fkey(id, full_name, email),
        approver:users!device_purchase_requests_approved_by_fkey(id, full_name, email),
        receiver:users!device_purchase_requests_received_by_fkey(id, full_name, email)
      `
      )
      .single();

    if (error) {
      console.error('Error updating purchase request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: `purchase_request_${action}`,
      entity_type: 'device_purchase_request',
      entity_id: params.id,
      details: {
        request_number: currentRequest.request_number,
        old_status: currentRequest.status,
        new_status: newStatus,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      data,
      message: 'Status updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/purchase-requests/[id]/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
