// app/api/webhooks/blog/route.ts
// Receives blog posts from Make.com - handles JSON and multipart form data
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const WEBHOOK_SECRET = process.env.BLOG_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional)
    const authHeader = request.headers.get('authorization')
    if (WEBHOOK_SECRET && authHeader && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      console.log('Invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Record<string, any> = {}
    
    // Check content type and parse accordingly
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data from Make.com
      const formData = await request.formData()
      formData.forEach((value, key) => {
        // Handle tags array
        if (key === 'tags') {
          try {
            body[key] = typeof value === 'string' ? JSON.parse(value) : value
          } catch {
            body[key] = typeof value === 'string' ? value.split(',').map(t => t.trim()) : []
          }
        } 
        // Handle booleans
        else if (key === 'is_relevant' || key === 'isRelevant') {
          body['is_relevant'] = value === 'true' || value === true
        }
        else {
          body[key] = value
        }
      })
    } else {
      // Handle JSON
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    }

    console.log('Received blog webhook:', JSON.stringify(body, null, 2))

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Normalize field names (handle both snake_case and camelCase)
    const title = body.title
    const summary = body.summary || body.excerpt || ''
    const content = body.content || ''
    const category = body.category || 'Industry News'
    const sourceUrl = body.source_url || body.sourceUrl || null
    const sourceTitle = body.source_title || body.sourceTitle || null
    const imageUrl = body.image_url || body.imageUrl || body.image || null
    const imagePrompt = body.image_prompt || body.imagePrompt || null
    const isRelevant = body.is_relevant !== false && body.isRelevant !== false
    
    // Handle tags
    let tags: string[] = []
    if (Array.isArray(body.tags)) {
      tags = body.tags
    } else if (typeof body.tags === 'string') {
      try {
        tags = JSON.parse(body.tags)
      } catch {
        tags = body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      }
    }

    // Determine status
    const status = isRelevant ? 'pending' : 'rejected'
    const rejectionReason = !isRelevant ? 'AI determined content not relevant to SkyYield audience' : null

    // Generate slug
    const slug = (title as string)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Date.now().toString(36)

    // Insert into Supabase
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        title,
        slug,
        excerpt: summary,
        summary,
        content,
        category,
        tags,
        featured_image: imageUrl,
        image_url: imageUrl,
        image_prompt: imagePrompt,
        source_url: sourceUrl,
        source_title: sourceTitle,
        is_relevant: isRelevant,
        is_published: false,
        status,
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

// GET - Health check
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
      accepts: ['application/json', 'multipart/form-data']
    })
  } catch (error) {
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 })
  }
}
