// app/api/admin/diagnostics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  const diagnostics: Record<string, any> = { timestamp: new Date().toISOString(), environment: {}, auth: {}, tables: {}, errors: [] }
  try {
    diagnostics.environment = { SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY }
    try { const { userId } = await auth(); diagnostics.auth = { userId: userId ? 'present' : 'missing' } } catch (e: any) { diagnostics.auth = { error: e.message } }
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      for (const table of ['venues', 'devices', 'products', 'location_partners', 'referral_partners', 'contractors', 'employees']) {
        try { const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }); diagnostics.tables[table] = error ? { exists: false, error: error.message } : { exists: true, rowCount: count } } catch (e: any) { diagnostics.tables[table] = { exists: false, error: e.message } }
      }
    }
    return NextResponse.json(diagnostics)
  } catch (error: any) { diagnostics.errors.push(error.message); return NextResponse.json(diagnostics, { status: 500 }) }
}
