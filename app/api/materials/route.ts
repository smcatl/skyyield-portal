import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch materials (optionally filtered by partner type)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerType = searchParams.get('partnerType')

    let query = supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    // Filter by partner type if specified
    let filteredData = data
    if (partnerType && partnerType !== 'all') {
      filteredData = data?.filter(m => 
        m.partner_types.includes('all') || m.partner_types.includes(partnerType)
      )
    }

    return NextResponse.json({ materials: filteredData })
  } catch (error: any) {
    console.error('Error fetching materials:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new material
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('materials')
      .insert({
        title: body.title,
        description: body.description,
        type: body.type,
        category: body.category,
        duration: body.duration,
        url: body.url,
        required: body.required || false,
        partner_types: body.partnerTypes || ['all'],
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ material: data })
  } catch (error: any) {
    console.error('Error creating material:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update material
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('materials')
      .update({
        title: body.title,
        description: body.description,
        type: body.type,
        category: body.category,
        duration: body.duration,
        url: body.url,
        required: body.required || false,
        partner_types: body.partnerTypes || ['all'],
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ material: data })
  } catch (error: any) {
    console.error('Error updating material:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete material
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Material ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting material:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
