// =============================================================================
// PURCHASE REQUESTS API ROUTE
// File: src/app/api/admin/purchase-requests/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================================================
// GET - List Purchase Requests
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // Verify auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (!user || !['admin', 'employee'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const ownership = searchParams.get('ownership');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    // Build query
    let query = supabase
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
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (source) {
      query = query.eq('source', source);
    }
    if (ownership) {
      query = query.eq('ownership', ownership);
    }
    if (search) {
      query = query.or(
        `request_number.ilike.%${search}%,product_name.ilike.%${search}%`
      );
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching purchase requests:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get summary counts
    const { data: summaryData } = await supabase.rpc('get_purchase_request_summary');

    const summary = summaryData?.[0] || {
      pending_approval: 0,
      auto_created: 0,
      approved: 0,
      ordered: 0,
      shipped: 0,
      received: 0,
      assigned: 0,
      cancelled: 0,
      total: 0,
    };

    return NextResponse.json({
      data: data || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      summary,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/purchase-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Purchase Request
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse body
    const body = await request.json();
    const {
      location_partner_id,
      venue_id,
      product_id,
      product_name,
      product_sku,
      product_url,
      quantity,
      unit_cost,
      ownership,
      notes,
      urgency,
      justification,
    } = body;

    // Validate required fields
    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Quantity is required' }, { status: 400 });
    }
    if (!unit_cost || unit_cost <= 0) {
      return NextResponse.json({ error: 'Unit cost is required' }, { status: 400 });
    }
    if (!ownership) {
      return NextResponse.json({ error: 'Ownership is required' }, { status: 400 });
    }

    // Determine source and if auto-approved
    const source = user.role === 'admin' ? 'admin' : 'employee_request';
    const requiresApproval = user.role !== 'admin';
    const status = requiresApproval ? 'pending_approval' : 'approved';

    // Calculate total cost
    const total_cost = quantity * unit_cost;

    // Insert record
    const { data, error } = await supabase
      .from('device_purchase_requests')
      .insert({
        source,
        status,
        location_partner_id: location_partner_id || null,
        venue_id: venue_id || null,
        product_id: product_id || null,
        product_name: product_name || null,
        product_sku: product_sku || null,
        quantity,
        unit_cost,
        total_cost,
        ownership,
        requires_approval: requiresApproval,
        approved_by: requiresApproval ? null : user.id,
        approved_at: requiresApproval ? null : new Date().toISOString(),
        requested_by: user.id,
        notes: justification || notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating purchase request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'purchase_request_created',
      entity_type: 'device_purchase_request',
      entity_id: data.id,
      details: { request_number: data.request_number, source, status },
    });

    return NextResponse.json({
      success: true,
      data,
      message: 'Purchase request created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/purchase-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
