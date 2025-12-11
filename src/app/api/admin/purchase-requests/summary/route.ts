// =============================================================================
// PURCHASE REQUESTS SUMMARY API ROUTE
// File: src/app/api/admin/purchase-requests/summary/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
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

    // Get counts by status
    const { data, error } = await supabase
      .from('device_purchase_requests')
      .select('status');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate summary
    const summary = {
      pending_approval: 0,
      auto_created: 0,
      approved: 0,
      ordered: 0,
      shipped: 0,
      received: 0,
      assigned: 0,
      cancelled: 0,
      total: data?.length || 0,
    };

    data?.forEach((row) => {
      const status = row.status as keyof typeof summary;
      if (status in summary && status !== 'total') {
        summary[status]++;
      }
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error in GET /api/admin/purchase-requests/summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// SUPABASE FUNCTION (run in Supabase SQL Editor)
// =============================================================================
/*
-- Create function to get purchase request summary
CREATE OR REPLACE FUNCTION get_purchase_request_summary()
RETURNS TABLE (
  pending_approval BIGINT,
  auto_created BIGINT,
  approved BIGINT,
  ordered BIGINT,
  shipped BIGINT,
  received BIGINT,
  assigned BIGINT,
  cancelled BIGINT,
  total BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_approval,
    COUNT(*) FILTER (WHERE status = 'auto_created') AS auto_created,
    COUNT(*) FILTER (WHERE status = 'approved') AS approved,
    COUNT(*) FILTER (WHERE status = 'ordered') AS ordered,
    COUNT(*) FILTER (WHERE status = 'shipped') AS shipped,
    COUNT(*) FILTER (WHERE status = 'received') AS received,
    COUNT(*) FILTER (WHERE status = 'assigned') AS assigned,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
    COUNT(*) AS total
  FROM device_purchase_requests;
$$;
*/
