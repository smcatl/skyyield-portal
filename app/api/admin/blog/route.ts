// app/api/admin/blog/route.ts
// Admin API for blog management
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch blog posts with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message, posts: [] }, { status: 500 })
    }

    // Map data to consistent format for frontend
    const posts = (data || []).map(p => ({
      ...p,
      summary: p.excerpt || p.summary || '',  // Use excerpt as summary
      image_url: p.featured_image || p.image_url || null,  // Use featured_image as image_url
    }))

    // Get counts by status
    const { data: allPosts } = await supabase
      .from('blog_posts')
      .select('status, category')

    const counts = {
      pending: 0,
      draft: 0,
      approved: 0,
      published: 0,
      rejected: 0,
      total: allPosts?.length || 0
    }

    const categories = new Set<string>()
    allPosts?.forEach(p => {
      if (p.status && counts.hasOwnProperty(p.status)) {
        counts[p.status as keyof typeof counts]++
      }
      if (p.category) categories.add(p.category)
    })

    return NextResponse.json({
      success: true,
      posts,
      counts,
      categories: Array.from(categories).sort()
    })

  } catch (error) {
    console.error('Blog GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts', posts: [] }, { status: 500 })
  }
}

// POST - Create new blog post manually
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate slug
    const slug = body.slug || (body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Date.now().toString(36))

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        title: body.title,
        slug: slug,
        excerpt: body.summary || body.excerpt || '',
        summary: body.summary || '',
        content: body.content || '',
        category: body.category || 'Industry News',
        tags: body.tags || [],
        featured_image: body.image_url || body.featured_image || null,
        image_url: body.image_url || null,
        source_url: body.source_url || null,
        status: body.status || 'draft',
        is_published: false,
        author: body.author || 'SkyYield Team',
      }])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, post: data })
  } catch (error) {
    console.error('Blog POST error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

// PUT - Update blog post (edit, approve, reject, publish)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    // Handle specific actions
    if (action === 'approve') {
      updates.status = 'approved'
      updates.reviewed_at = new Date().toISOString()
      updates.reviewed_by = updates.reviewed_by || 'Admin'
    } else if (action === 'reject') {
      updates.status = 'rejected'
      updates.reviewed_at = new Date().toISOString()
      updates.reviewed_by = updates.reviewed_by || 'Admin'
    } else if (action === 'publish') {
      updates.status = 'published'
      updates.is_published = true
      updates.published_at = new Date().toISOString()
    } else if (action === 'unpublish') {
      updates.status = 'approved'
      updates.is_published = false
    } else if (action === 'draft') {
      updates.status = 'draft'
      updates.is_published = false
    }

    // Map frontend fields to database fields
    if (updates.summary !== undefined) {
      updates.excerpt = updates.summary
    }
    if (updates.image_url !== undefined) {
      updates.featured_image = updates.image_url
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map back for frontend
    const post = {
      ...data,
      summary: data.excerpt || data.summary || '',
      image_url: data.featured_image || data.image_url || null,
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Blog PUT error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// DELETE - Delete blog post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Blog DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
