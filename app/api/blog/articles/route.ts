import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

// Simple API key authentication
const API_KEY = process.env.BLOG_API_KEY || "your-secret-api-key"

// In production, you'd use a database. For now, we'll use a JSON file.
const ARTICLES_FILE = path.join(process.cwd(), "data", "blog-articles.json")

interface BlogArticle {
  id: string
  slug: string
  title: string
  summary: string
  content: string
  image: string
  author: string
  authorRole: string
  authorBio: string
  publishedAt: string
  readTime: string
  category: string
  tags: string[]
  sourceUrl?: string
  status: "draft" | "published"
  createdAt: string
  updatedAt: string
}

// Ensure data directory and file exist
async function ensureDataFile() {
  const dataDir = path.join(process.cwd(), "data")
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
  
  try {
    await fs.access(ARTICLES_FILE)
  } catch {
    await fs.writeFile(ARTICLES_FILE, JSON.stringify({ articles: [] }, null, 2))
  }
}

// Read articles from file
async function getArticles(): Promise<BlogArticle[]> {
  await ensureDataFile()
  const data = await fs.readFile(ARTICLES_FILE, "utf-8")
  const parsed = JSON.parse(data)
  return parsed.articles || []
}

// Write articles to file
async function saveArticles(articles: BlogArticle[]) {
  await ensureDataFile()
  await fs.writeFile(ARTICLES_FILE, JSON.stringify({ articles }, null, 2))
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 60)
}

// Estimate read time from content
function estimateReadTime(content: string): string {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min read`
}

// GET - Fetch all articles (for the blog pages to use)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // "published", "draft", or "all"
    const slug = searchParams.get("slug")
    const category = searchParams.get("category")
    const limit = parseInt(searchParams.get("limit") || "50")
    
    let articles = await getArticles()
    
    // Filter by slug (single article)
    if (slug) {
      const article = articles.find(a => a.slug === slug)
      if (!article) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 })
      }
      return NextResponse.json({ article })
    }
    
    // Filter by status
    if (status && status !== "all") {
      articles = articles.filter(a => a.status === status)
    } else if (!status) {
      // Default to published only
      articles = articles.filter(a => a.status === "published")
    }
    
    // Filter by category
    if (category && category !== "All") {
      articles = articles.filter(a => a.category === category)
    }
    
    // Sort by date (newest first)
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    
    // Limit results
    articles = articles.slice(0, limit)
    
    return NextResponse.json({ articles })
  } catch (error) {
    console.error("Error fetching articles:", error)
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 })
  }
}

// POST - Create new article (from Make.com)
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get("Authorization")
    const apiKey = authHeader?.replace("Bearer ", "")
    
    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    
    const {
      title,
      summary,
      content,
      image,
      author = "SkyYield Team",
      authorRole = "Content Team",
      authorBio = "The SkyYield content team curates the latest news and insights about WiFi offloading and wireless technology.",
      category = "Industry News",
      tags = [],
      sourceUrl,
      status = "pending",
      publishedAt,
    } = body
    
    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (!content && !summary) {
      return NextResponse.json({ error: "Content or summary is required" }, { status: 400 })
    }
    
    const articles = await getArticles()
    
    // Generate unique slug
    let slug = generateSlug(title)
    let slugCounter = 1
    while (articles.some(a => a.slug === slug)) {
      slug = `${generateSlug(title)}-${slugCounter}`
      slugCounter++
    }
    
    const newArticle: BlogArticle = {
      id: `article-${Date.now()}`,
      slug,
      title,
      summary: summary || content.substring(0, 200) + "...",
      content: content || summary,
      image: image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
      author,
      authorRole,
      authorBio,
      publishedAt: publishedAt || new Date().toISOString().split("T")[0],
      readTime: estimateReadTime(content || summary),
      category,
      tags: Array.isArray(tags) ? tags : tags.split(",").map((t: string) => t.trim()),
      sourceUrl,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    articles.push(newArticle)
    await saveArticles(articles)
    
    return NextResponse.json({ 
      success: true, 
      article: newArticle,
      message: `Article "${title}" created successfully`
    }, { status: 201 })
    
  } catch (error) {
    console.error("Error creating article:", error)
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 })
  }
}

// PUT - Update existing article
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    const apiKey = authHeader?.replace("Bearer ", "")
    
    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, slug, ...updates } = body
    
    if (!id && !slug) {
      return NextResponse.json({ error: "Article ID or slug is required" }, { status: 400 })
    }
    
    const articles = await getArticles()
    const index = articles.findIndex(a => a.id === id || a.slug === slug)
    
    if (index === -1) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }
    
    // Update article
    articles[index] = {
      ...articles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    
    // Recalculate read time if content changed
    if (updates.content) {
      articles[index].readTime = estimateReadTime(updates.content)
    }
    
    await saveArticles(articles)
    
    return NextResponse.json({ 
      success: true, 
      article: articles[index],
      message: "Article updated successfully"
    })
    
  } catch (error) {
    console.error("Error updating article:", error)
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 })
  }
}

// DELETE - Remove article
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    const apiKey = authHeader?.replace("Bearer ", "")
    
    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const slug = searchParams.get("slug")
    
    if (!id && !slug) {
      return NextResponse.json({ error: "Article ID or slug is required" }, { status: 400 })
    }
    
    let articles = await getArticles()
    const initialLength = articles.length
    
    articles = articles.filter(a => a.id !== id && a.slug !== slug)
    
    if (articles.length === initialLength) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }
    
    await saveArticles(articles)
    
    return NextResponse.json({ 
      success: true, 
      message: "Article deleted successfully"
    })
    
  } catch (error) {
    console.error("Error deleting article:", error)
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 })
  }
}