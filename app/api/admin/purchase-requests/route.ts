import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (!user || !['admin', 'employee'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const ownership = searchParams.get('ownership');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    let query = supabase
      .from('device_purchase_requests')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (source) query = query.eq('source', source);
    if (ownership) query = query.eq('ownership', ownership);
    if (search) {
      query = query.or(`request_number.ilike.%${search}%,product_name.ilike.%${search}%`);
    }

    query = query.order(sort, { ascending: order === 'asc' });
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      pagination: { total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const status = user.role === 'admin' ? 'approved' : 'pending_approval';

    const { data, error } = await supabase
      .from('device_purchase_requests')
      .insert({
        source: user.role === 'admin' ? 'admin' : 'employee_request',
        status,
        location_partner_id: body.location_partner_id || null,
        venue_id: body.venue_id || null,
        product_id: body.product_id || null,
        product_name: body.product_name || null,
        product_sku: body.product_sku || null,
        quantity: body.quantity || 1,
        unit_cost: body.unit_cost || 0,
        ownership: body.ownership || 'skyyield',
        requires_approval: user.role !== 'admin',
        approved_by: user.role === 'admin' ? user.id : null,
        approved_at: user.role === 'admin' ? new Date().toISOString() : null,
        requested_by: user.id,
        notes: body.justification || body.notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
