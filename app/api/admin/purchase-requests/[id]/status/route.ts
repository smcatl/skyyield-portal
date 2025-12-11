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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const body = await request.json();
    const { action, notes, ...additionalData } = body;

    const { data: currentRequest } = await supabase
      .from('device_purchase_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentRequest) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let updateData: Record<string, any> = {};

    switch (action) {
      case 'approve':
        updateData = { status: 'approved', approved_at: new Date().toISOString(), approval_notes: notes };
        break;
      case 'cancel':
        updateData = { status: 'cancelled', approval_notes: notes };
        break;
      case 'ordered':
        updateData = { status: 'ordered', ordered_at: new Date().toISOString(), order_reference: additionalData.order_reference, supplier: additionalData.supplier };
        break;
      case 'shipped':
        updateData = { status: 'shipped', shipped_at: new Date().toISOString(), tracking_number: additionalData.tracking_number };
        break;
      case 'received':
        updateData = { status: 'received', received_at: new Date().toISOString() };
        break;
      case 'assign':
        updateData = { status: 'assigned', assigned_at: new Date().toISOString() };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('device_purchase_requests')
      .update(updateData)
      .eq('id', id)
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
