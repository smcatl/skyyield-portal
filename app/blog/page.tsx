"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface BlogPost {
  id: string
  slug: string
  title: string
  summary: string
  image: string
  image_url?: string
  author: string
  authorRole?: string
  publishedAt: string
  published_at?: string
  readTime: string
  category: string
  tags: string[]
  sourceUrl?: string
  source_url?: string
}

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
      // Fetch from new Supabase-powered API
      const response = await fetch("/api/blog")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.posts) {
          setPosts(data.posts)
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
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
          postImage: sharePost.image || sharePost.image_url,
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

  const getImage = (post: BlogPost) => post.image || post.image_url || ''
  const getPublishedAt = (post: BlogPost) => post.publishedAt || post.published_at || ''

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
      {/* Header Section */}
      <div style={{ paddingTop: "120px", paddingBottom: "48px", textAlign: "center" }}>
        <h1 style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "16px" }}>
          SkyYield <span style={{ color: "#0EA5E9" }}>Blog</span>
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "18px", maxWidth: "600px", margin: "0 auto" }}>
          Stay informed about WiFi offloading technology, industry trends, and tips 
          for maximizing your network's potential.
        </p>
      </div>

      {/* Category Filter */}
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "48px", flexWrap: "wrap", padding: "0 24px" }}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
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
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 80px" }}>
        {filteredPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "64px", marginBottom: "24px" }}>📝</div>
            <h2 style={{ fontSize: "24px", marginBottom: "12px" }}>No Articles Yet</h2>
            <p style={{ color: "#94A3B8" }}>
              {selectedCategory === "All" 
                ? "Check back soon for new content!"
                : `No articles in ${selectedCategory} category yet.`}
            </p>
          </div>
        ) : (
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
                    {getImage(post) ? (
                      <img
                        src={getImage(post)}
                        alt={post.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ 
                        width: "100%", 
                        height: "100%", 
                        backgroundColor: "#2D3B5F",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "48px"
                      }}>
                        📄
                      </div>
                    )}
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
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(16, 249, 129, 0.9)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                      }}
                    >
                      📤
                    </button>
                  </div>

                  {/* Content */}
                  <div style={{ padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", fontSize: "13px", color: "#64748B" }}>
                      <span>{formatDate(getPublishedAt(post))}</span>
                      <span>•</span>
                      <span>{post.readTime || '3 min read'}</span>
                    </div>

                    <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "12px", lineHeight: "1.3" }}>
                      {post.title}
                    </h2>

                    <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
                      {post.summary}
                    </p>

                    {/* Author */}
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
                        {(post.author || 'SY').split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "600" }}>{post.author || 'SkyYield Team'}</div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>{post.authorRole || 'Content Team'}</div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareModalOpen && sharePost && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "24px",
          }}
          onClick={() => setShareModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#1A1F3A",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "480px",
              width: "100%",
              border: "1px solid #2D3B5F",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
              Share Article
            </h3>
            <p style={{ color: "#94A3B8", marginBottom: "24px", fontSize: "14px" }}>
              {sharePost.title}
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "#94A3B8", fontSize: "14px", marginBottom: "8px" }}>
                Recipient Email
              </label>
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="colleague@company.com"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #2D3B5F",
                  backgroundColor: "#0A0F2C",
                  color: "#FFFFFF",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", color: "#94A3B8", fontSize: "14px", marginBottom: "8px" }}>
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
                  border: "1px solid #2D3B5F",
                  backgroundColor: "#0A0F2C",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  resize: "none",
                }}
              />
            </div>

            {sendStatus === "success" && (
              <div style={{ padding: "12px", backgroundColor: "rgba(16, 249, 129, 0.1)", borderRadius: "8px", marginBottom: "16px", color: "#10F981", textAlign: "center" }}>
                ✓ Email sent successfully!
              </div>
            )}

            {sendStatus === "error" && (
              <div style={{ padding: "12px", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", marginBottom: "16px", color: "#EF4444", textAlign: "center" }}>
                Failed to send email. Please try again.
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShareModalOpen(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #2D3B5F",
                  backgroundColor: "transparent",
                  color: "#94A3B8",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
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
                  border: "none",
                  backgroundColor: "#0EA5E9",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: shareEmail && !isSending ? "pointer" : "not-allowed",
                  opacity: shareEmail && !isSending ? 1 : 0.5,
                }}
              >
                {isSending ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
