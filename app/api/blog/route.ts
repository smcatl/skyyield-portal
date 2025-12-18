// app/api/blog/route.ts
// Public blog API - fetches PUBLISHED posts from Supabase
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Single post by slug
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

      return NextResponse.json({
        success: true,
        post: formatPost(data)
      })
    }

    // Build query for published posts
    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    // Filter by category
    if (category && category !== 'All') {
      query = query.eq('category', category)
    }

    // Filter by tag
    if (tag) {
      query = query.contains('tags', [tag])
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    // Get category counts
    const { data: allPosts } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('status', 'published')
      .eq('is_published', true)

    const categoryCounts: Record<string, number> = {}
    allPosts?.forEach(post => {
      const cat = post.category || 'Uncategorized'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      posts: (data || []).map(formatPost),
      total: count || 0,
      categories: Object.keys(categoryCounts),
      categoryCounts
    })

  } catch (error) {
    console.error('Blog API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatPost(post: any) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary || post.excerpt,
    excerpt: post.excerpt || post.summary,
    content: post.content,
    image: post.image_url || post.featured_image,
    image_url: post.image_url || post.featured_image,
    category: post.category || 'Industry News',
    tags: post.tags || [],
    author: post.author || 'SkyYield Team',
    authorRole: 'Content Team',
    publishedAt: post.published_at || post.created_at,
    published_at: post.published_at || post.created_at,
    readTime: estimateReadTime(post.content || ''),
    sourceUrl: post.source_url,
    source_url: post.source_url
  }
}

function estimateReadTime(content: string): string {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min read`
}
