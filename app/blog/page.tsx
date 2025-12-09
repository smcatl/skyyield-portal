"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface BlogPost {
  id: string
  slug: string
  title: string
  summary: string
  image: string
  author: string
  authorRole: string
  publishedAt: string
  readTime: string
  category: string
  tags: string[]
  sourceUrl?: string
}

// Fallback sample posts for when API has no articles yet
const samplePosts: BlogPost[] = [
  {
    id: "1",
    slug: "wifi-offloading-future-connectivity",
    title: "WiFi Offloading: The Future of Mobile Connectivity",
    summary: "Discover how WiFi offloading is revolutionizing mobile data delivery and creating new revenue opportunities for businesses with excess bandwidth capacity.",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80",
    author: "Sarah Chen",
    authorRole: "Network Solutions Director",
    publishedAt: "2025-12-01",
    readTime: "5 min read",
    category: "Technology",
    tags: ["WiFi", "5G", "Offloading", "Mobile Data"]
  },
  {
    id: "2",
    slug: "maximizing-venue-revenue-passive-income",
    title: "Maximizing Venue Revenue with Passive WiFi Income",
    summary: "Learn how restaurants, salons, and retail stores are generating $200-500/month in passive income by partnering with SkyYield's WiFi offloading network.",
    image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&q=80",
    author: "Marcus Johnson",
    authorRole: "Partner Success Manager",
    publishedAt: "2025-11-28",
    readTime: "4 min read",
    category: "Business",
    tags: ["Revenue", "Partners", "Passive Income", "Small Business"]
  },
  {
    id: "3",
    slug: "ubiquiti-equipment-guide-2025",
    title: "The Complete Ubiquiti Equipment Guide for 2025",
    summary: "A comprehensive breakdown of the best Ubiquiti access points, switches, and gateways for building high-performance WiFi networks.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    author: "David Park",
    authorRole: "Technical Operations Lead",
    publishedAt: "2025-11-25",
    readTime: "8 min read",
    category: "Equipment",
    tags: ["Ubiquiti", "Access Points", "Networking", "Hardware"]
  },
]

const categories = ["All", "Technology", "Business", "Equipment", "Industry News", "Strategy", "Guides"]

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [sharePost, setSharePost] = useState<BlogPost | null>(null)
  const [shareEmail, setShareEmail] = useState("")
  const [shareMessage, setShareMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/blog/articles?status=published")
      if (response.ok) {
        const data = await response.json()
        if (data.articles && data.articles.length > 0) {
          setPosts(data.articles)
        } else {
          // Use sample posts if no articles in database
          setPosts(samplePosts)
        }
      } else {
        setPosts(samplePosts)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setPosts(samplePosts)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPosts = selectedCategory === "All" 
    ? posts 
    : posts.filter(post => post.category === selectedCategory)

  const handleShare = (post: BlogPost, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSharePost(post)
    setShareEmail("")
    setShareMessage("")
    setSendStatus(null)
    setShareModalOpen(true)
  }

  const handleSendEmail = async () => {
    if (!shareEmail || !sharePost) return

    setIsSending(true)
    setSendStatus(null)

    try {
      const response = await fetch("/api/blog/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: shareEmail,
          postTitle: sharePost.title,
          postSummary: sharePost.summary,
          postUrl: `${window.location.origin}/blog/${sharePost.slug}`,
          postImage: sharePost.image,
          message: shareMessage,
        }),
      })

      if (!response.ok) throw new Error("Failed to send email")

      setSendStatus("success")
      setTimeout(() => {
        setShareModalOpen(false)
        setSendStatus(null)
      }, 2000)
    } catch (error) {
      setSendStatus("error")
    } finally {
      setIsSending(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", color: "#FFFFFF", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "3px solid #2D3B5F", borderTopColor: "#0EA5E9", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#94A3B8" }}>Loading articles...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", color: "#FFFFFF", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Hero Section */}
      <div style={{ paddingTop: "120px", paddingBottom: "60px", textAlign: "center", borderBottom: "1px solid #2D3B5F" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}>
          <span style={{ display: "inline-block", padding: "8px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "600", marginBottom: "24px", background: "linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)", color: "#0EA5E9", border: "1px solid rgba(14, 165, 233, 0.3)" }}>
            SkyYield Blog
          </span>
          <h1 style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "16px", lineHeight: "1.2" }}>
            Insights & <span style={{ color: "#0EA5E9" }}>Updates</span>
          </h1>
          <p style={{ fontSize: "18px", color: "#94A3B8", maxWidth: "600px", margin: "0 auto" }}>
            Stay informed about WiFi offloading technology, industry trends, and tips for maximizing your network's potential.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginBottom: "48px" }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: "10px 24px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                border: selectedCategory === category ? "none" : "1px solid #2D3B5F",
                backgroundColor: selectedCategory === category ? "#0EA5E9" : "transparent",
                color: selectedCategory === category ? "#FFFFFF" : "#94A3B8",
                transition: "all 0.2s",
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "32px" }}>
          {filteredPosts.map(post => (
            <Link href={`/blog/${post.slug}`} key={post.id} style={{ textDecoration: "none", color: "inherit" }}>
              <article
                style={{
                  backgroundColor: "#1A1F3A",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #2D3B5F",
                  transition: "all 0.3s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.borderColor = "#0EA5E9"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.borderColor = "#2D3B5F"
                }}
              >
                {/* Image */}
                <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
                  <img
                    src={post.image}
                    alt={post.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", top: "16px", left: "16px" }}>
                    <span style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      backgroundColor: "rgba(14, 165, 233, 0.9)",
                      color: "#FFFFFF",
                    }}>
                      {post.category}
                    </span>
                  </div>
                  {/* Share Button */}
                  <button
                    onClick={(e) => handleShare(post, e)}
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "none",
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      transition: "transform 0.2s",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                    title="Share article"
                  >
                    📤
                  </button>
                </div>

                {/* Content */}
                <div style={{ padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", fontSize: "13px", color: "#64748B" }}>
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "12px", lineHeight: "1.4", color: "#FFFFFF" }}>
                    {post.title}
                  </h2>

                  <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#94A3B8", marginBottom: "20px" }}>
                    {post.summary}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}>
                      {post.author.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#FFFFFF" }}>{post.author}</div>
                      <div style={{ fontSize: "12px", color: "#64748B" }}>{post.authorRole}</div>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px", backgroundColor: "#1A1F3A", borderRadius: "16px", border: "1px solid #2D3B5F" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
            <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>No Articles Found</h3>
            <p style={{ color: "#94A3B8" }}>Check back soon for new content in this category.</p>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareModalOpen && sharePost && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "rgba(0,0,0,0.8)" }}
            onClick={() => setShareModalOpen(false)}
          />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "95%",
            maxWidth: "500px",
            zIndex: 70,
            borderRadius: "16px",
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
            overflow: "hidden",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #2D3B5F",
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Share Article</h2>
              <button
                onClick={() => setShareModalOpen(false)}
                style={{ fontSize: "24px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px" }}>
              {/* Article Preview */}
              <div style={{
                display: "flex",
                gap: "16px",
                padding: "16px",
                backgroundColor: "#0A0F2C",
                borderRadius: "12px",
                marginBottom: "24px",
              }}>
                <img
                  src={sharePost.image}
                  alt={sharePost.title}
                  style={{ width: "80px", height: "80px", borderRadius: "8px", objectFit: "cover" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px", color: "#FFFFFF" }}>
                    {sharePost.title}
                  </h3>
                  <p style={{ fontSize: "12px", color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                    {sharePost.summary}
                  </p>
                </div>
              </div>

              {/* Email Form */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>
                  Recipient Email *
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="friend@example.com"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: "#0A0F2C",
                    border: "1px solid #2D3B5F",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>
                  Personal Message (optional)
                </label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="I thought you might find this interesting..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: "#0A0F2C",
                    border: "1px solid #2D3B5F",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Status Message */}
              {sendStatus && (
                <div style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  backgroundColor: sendStatus === "success" ? "rgba(16, 249, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: `1px solid ${sendStatus === "success" ? "#10F981" : "#EF4444"}`,
                  color: sendStatus === "success" ? "#10F981" : "#EF4444",
                  fontSize: "14px",
                }}>
                  {sendStatus === "success" ? "✓ Email sent successfully!" : "✗ Failed to send email. Please try again."}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setShareModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    border: "1px solid #2D3B5F",
                    backgroundColor: "transparent",
                    color: "#94A3B8",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!shareEmail || isSending}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: !shareEmail || isSending ? "not-allowed" : "pointer",
                    border: "none",
                    background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
                    color: "#FFFFFF",
                    opacity: !shareEmail || isSending ? 0.6 : 1,
                  }}
                >
                  {isSending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}