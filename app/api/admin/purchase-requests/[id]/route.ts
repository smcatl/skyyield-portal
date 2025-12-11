// =============================================================================
// SINGLE PURCHASE REQUEST API ROUTE
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .select(`
        *,
        location_partner:location_partners(id, company_legal_name, user_id),
        venue:venues(id, venue_name, city, state, address_line_1),
        product:approved_products(id, name, sku, our_cost, image_url),
        requester:users!device_purchase_requests_requested_by_fkey(id, full_name, email),
        approver:users!device_purchase_requests_approved_by_fkey(id, full_name, email),
        receiver:users!device_purchase_requests_received_by_fkey(id, full_name, email)
      `)
      .eq('id', id)
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
