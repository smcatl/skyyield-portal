// app/api/webhooks/blog/route.ts
// Receives blog posts from Make.com automation and saves to Supabase
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Webhook secret for security (set in Make.com and Vercel env vars)
const WEBHOOK_SECRET = process.env.BLOG_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      console.log('Invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Received blog webhook:', JSON.stringify(body, null, 2))

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // If article is not relevant, still save but mark as rejected
    const status = body.is_relevant === false ? 'rejected' : 'pending'
    const rejectionReason = body.is_relevant === false ? 'AI determined content not relevant to SkyYield audience' : null

    // Generate slug from title
    const slug = body.slug || (body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Date.now().toString(36))

    // Insert into Supabase - using existing column names
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        title: body.title,
        slug: slug,
        excerpt: body.summary || body.excerpt || '',  // Map summary to excerpt
        summary: body.summary || '',
        content: body.content || '',
        category: body.category || 'Industry News',
        tags: Array.isArray(body.tags) ? body.tags : [],
        featured_image: body.image_url || body.featured_image || null,  // Map image_url to featured_image
        image_url: body.image_url || null,
        image_prompt: body.image_prompt || null,
        source_url: body.source_url || null,
        source_title: body.source_title || null,
        source_feed: body.source_feed || null,
        original_content: body.original_content || null,
        is_relevant: body.is_relevant !== false,
        is_published: false,
        status: status,
        rejection_reason: rejectionReason,
        author: 'SkyYield AI',
      }])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Blog post saved:', data.id, data.title)

    return NextResponse.json({
      success: true,
      id: data.id,
      slug: data.slug,
      status: data.status,
      message: `Blog post "${data.title}" saved with status: ${data.status}`
    })

  } catch (error) {
    console.error('Blog webhook error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Webhook processing failed' 
    }, { status: 500 })
  }
}

// GET - Health check and recent posts count
export async function GET() {
  try {
    const { count: pending } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: published } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    return NextResponse.json({
      status: 'Blog webhook endpoint active',
      pending_posts: pending || 0,
      published_posts: published || 0,
      webhook_url: '/api/webhooks/blog',
      method: 'POST',
      expected_payload: {
        title: 'string (required)',
        summary: 'string',
        content: 'string (markdown)',
        category: 'string',
        tags: 'string[]',
        image_url: 'string',
        source_url: 'string',
        is_relevant: 'boolean'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 })
  }
}
