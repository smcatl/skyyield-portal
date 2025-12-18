// app/api/blog/route.ts
// Public API - Only returns published blog posts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// GET - Fetch published blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const slug = searchParams.get('slug')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // If requesting a specific post by slug
    if (slug) {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      return NextResponse.json({ post: data })
    }

    // Fetch list of published posts
    let query = supabase
      .from('blog_posts')
      .select('id, title, slug, summary, category, tags, image_url, author, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message, posts: [] }, { status: 500 })
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    // Get categories with counts
    const { data: allPosts } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('status', 'published')

    const categoryCounts: Record<string, number> = {}
    allPosts?.forEach(p => {
      const cat = p.category || 'Uncategorized'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })

    return NextResponse.json({
      posts: data || [],
      total: count || 0,
      offset,
      limit,
      categories: Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    })

  } catch (error) {
    console.error('Blog GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts', posts: [] }, { status: 500 })
  }
}
