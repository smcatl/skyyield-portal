import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

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

    const { data, error } = await supabase.rpc('get_purchase_request_summary');

    if (error) {
      // Fallback if function doesn't exist
      const { data: requests } = await supabase
        .from('device_purchase_requests')
        .select('status');

      const summary = {
        pending_approval: 0,
        auto_created: 0,
        approved: 0,
        ordered: 0,
        shipped: 0,
        received: 0,
        assigned: 0,
        cancelled: 0,
        total: requests?.length || 0,
      };

      requests?.forEach((r: any) => {
        if (summary.hasOwnProperty(r.status)) {
          (summary as any)[r.status]++;
        }
      });

      return NextResponse.json({ data: summary });
    }

    return NextResponse.json({ data: data?.[0] || {} });
  } catch (error) {
    console.error('Error in GET /api/admin/purchase-requests/summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
