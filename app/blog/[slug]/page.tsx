"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

interface BlogPost {
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
}

// Fallback articles for when API has no content
const fallbackArticles: Record<string, BlogPost> = {
  "wifi-offloading-future-connectivity": {
    id: "1",
    slug: "wifi-offloading-future-connectivity",
    title: "WiFi Offloading: The Future of Mobile Connectivity",
    summary: "Discover how WiFi offloading is revolutionizing mobile data delivery and creating new revenue opportunities for businesses with excess bandwidth capacity.",
    content: `
## What is WiFi Offloading?

WiFi offloading is the practice of routing mobile device traffic through WiFi networks instead of cellular networks. As mobile data consumption continues to skyrocket, carriers are increasingly relying on WiFi offloading to reduce congestion on their cellular infrastructure.

## Why It Matters

The global mobile data traffic is expected to grow sevenfold by 2027. Carriers simply cannot build enough cell towers to keep up with this demand. WiFi offloading provides a cost-effective solution that benefits everyone:

- **Carriers** reduce network congestion and infrastructure costs
- **Businesses** generate passive income from their existing internet connection
- **Consumers** enjoy faster, more reliable connections

## How SkyYield Makes It Work

SkyYield partners with businesses that have excess WiFi capacity—restaurants, salons, retail stores, and more. We install enterprise-grade access points that create a seamless handoff between cellular and WiFi networks.

When a carrier subscriber enters a partner location, their device automatically connects to the SkyYield network. The carrier pays for the data offloaded, and we share that revenue with our partners.

## Revenue Potential

Partners typically earn $0.15-0.25 per gigabyte of data offloaded. A busy restaurant might see 50-100GB of data offloaded daily, translating to $200-500 in monthly passive income.

## Getting Started

Join the thousands of businesses already benefiting from the WiFi offloading revolution. Contact SkyYield today to learn how your excess bandwidth can become a new revenue stream.
    `,
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&q=80",
    author: "Sarah Chen",
    authorRole: "Network Solutions Director",
    authorBio: "Sarah has over 15 years of experience in telecommunications and network infrastructure. She leads SkyYield's technical strategy and carrier partnerships.",
    publishedAt: "2025-12-01",
    readTime: "5 min read",
    category: "Technology",
    tags: ["WiFi", "5G", "Offloading", "Mobile Data"]
  },
}

export default function BlogArticlePage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [shareMessage, setShareMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchArticle()
  }, [slug])

  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/blog/articles?slug=${slug}`)
      if (response.ok) {
        const data = await response.json()
        if (data.article) {
          setPost(data.article)
        } else if (fallbackArticles[slug]) {
          setPost(fallbackArticles[slug])
        } else {
          setNotFound(true)
        }
      } else if (fallbackArticles[slug]) {
        setPost(fallbackArticles[slug])
      } else {
        setNotFound(true)
      }
    } catch (error) {
      console.error("Error fetching article:", error)
      if (fallbackArticles[slug]) {
        setPost(fallbackArticles[slug])
      } else {
        setNotFound(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", color: "#FFFFFF", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "3px solid #2D3B5F", borderTopColor: "#0EA5E9", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#94A3B8" }}>Loading article...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", color: "#FFFFFF", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "80px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "24px" }}>📄</div>
          <h1 style={{ fontSize: "32px", marginBottom: "16px" }}>Article Not Found</h1>
          <p style={{ color: "#94A3B8", marginBottom: "24px" }}>The article you're looking for doesn't exist.</p>
          <Link href="/blog" style={{ color: "#0EA5E9", textDecoration: "none", fontWeight: "600" }}>
            ← Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  const handleSendEmail = async () => {
    if (!shareEmail) return

    setIsSending(true)
    setSendStatus(null)

    try {
      const response = await fetch("/api/blog/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: shareEmail,
          postTitle: post.title,
          postSummary: post.summary,
          postUrl: typeof window !== "undefined" ? window.location.href : "",
          postImage: post.image,
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

  // Process markdown-style content to HTML
  const processContent = (content: string) => {
    return content
      .replace(/## (.*)/g, '<h2 style="font-size: 28px; font-weight: bold; color: #FFFFFF; margin-top: 48px; margin-bottom: 16px;">$1</h2>')
      .replace(/### (.*)/g, '<h3 style="font-size: 22px; font-weight: bold; color: #FFFFFF; margin-top: 32px; margin-bottom: 12px;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FFFFFF; font-weight: 600;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/- (.*)/g, '<li style="margin-left: 24px; margin-bottom: 8px;">$1</li>')
      .replace(/\n\n/g, '</p><p style="margin-bottom: 20px;">')
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", color: "#FFFFFF", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Hero Image */}
      <div style={{ position: "relative", height: "400px", overflow: "hidden" }}>
        <img
          src={post.image}
          alt={post.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10, 15, 44, 0.3) 0%, rgba(10, 15, 44, 0.9) 100%)" }} />
        
        {/* Back Button */}
        <Link
          href="/blog"
          style={{
            position: "absolute",
            top: "100px",
            left: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            color: "#FFFFFF",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          ← Back to Blog
        </Link>
      </div>

      {/* Article Content */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px", marginTop: "-100px", position: "relative", zIndex: 10 }}>
        {/* Article Header */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <span style={{
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              backgroundColor: "#0EA5E9",
              color: "#FFFFFF",
            }}>
              {post.category}
            </span>
            <span style={{ fontSize: "14px", color: "#94A3B8" }}>{post.readTime}</span>
          </div>

          <h1 style={{ fontSize: "40px", fontWeight: "bold", lineHeight: "1.2", marginBottom: "16px" }}>
            {post.title}
          </h1>

          <p style={{ fontSize: "18px", color: "#94A3B8", lineHeight: "1.6", marginBottom: "24px" }}>
            {post.summary}
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "16px",
              }}>
                {post.author.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "600" }}>{post.author}</div>
                <div style={{ fontSize: "14px", color: "#64748B" }}>{formatDate(post.publishedAt)}</div>
              </div>
            </div>

            <button
              onClick={() => setShareModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "8px",
                border: "1px solid #2D3B5F",
                backgroundColor: "transparent",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              📤 Share Article
            </button>
          </div>
        </div>

        {/* Source Link (if from RSS/Feedly) */}
        {post.sourceUrl && (
          <div style={{
            padding: "16px 20px",
            borderRadius: "12px",
            backgroundColor: "rgba(14, 165, 233, 0.1)",
            border: "1px solid rgba(14, 165, 233, 0.2)",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <span style={{ fontSize: "20px" }}>📰</span>
            <div>
              <span style={{ fontSize: "14px", color: "#94A3B8" }}>Originally published at: </span>
              <a 
                href={post.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: "#0EA5E9", textDecoration: "none", fontSize: "14px" }}
              >
                {new URL(post.sourceUrl).hostname}
              </a>
            </div>
          </div>
        )}

        {/* Article Body */}
        <div
          style={{
            fontSize: "17px",
            lineHeight: "1.8",
            color: "#CBD5E1",
          }}
          dangerouslySetInnerHTML={{ __html: processContent(post.content) }}
        />

        {/* Tags */}
        <div style={{ marginTop: "48px", paddingTop: "32px", borderTop: "1px solid #2D3B5F" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {post.tags.map(tag => (
              <span
                key={tag}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  backgroundColor: "rgba(14, 165, 233, 0.1)",
                  color: "#0EA5E9",
                  border: "1px solid rgba(14, 165, 233, 0.2)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Author Bio */}
        <div style={{
          marginTop: "48px",
          padding: "32px",
          borderRadius: "16px",
          backgroundColor: "#1A1F3A",
          border: "1px solid #2D3B5F",
        }}>
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "24px",
              flexShrink: 0,
            }}>
              {post.author.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Written by</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "4px" }}>{post.author}</div>
              <div style={{ fontSize: "14px", color: "#0EA5E9", marginBottom: "12px" }}>{post.authorRole}</div>
              <p style={{ fontSize: "14px", color: "#94A3B8", lineHeight: "1.6" }}>{post.authorBio}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{
          marginTop: "48px",
          marginBottom: "64px",
          padding: "40px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)",
          border: "1px solid rgba(14, 165, 233, 0.2)",
          textAlign: "center",
        }}>
          <h3 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "12px" }}>Ready to Start Earning?</h3>
          <p style={{ color: "#94A3B8", marginBottom: "24px" }}>Join thousands of businesses generating passive income with SkyYield.</p>
          <Link
            href="/get-started"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
              color: "#FFFFFF",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "16px",
            }}
          >
            Get Started Today
          </Link>
        </div>
      </div>

      {/* Share Modal */}
      {shareModalOpen && (
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

            <div style={{ padding: "24px" }}>
              <div style={{
                display: "flex",
                gap: "16px",
                padding: "16px",
                backgroundColor: "#0A0F2C",
                borderRadius: "12px",
                marginBottom: "24px",
              }}>
                <img
                  src={post.image}
                  alt={post.title}
                  style={{ width: "80px", height: "80px", borderRadius: "8px", objectFit: "cover" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px", color: "#FFFFFF" }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: "12px", color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                    {post.summary}
                  </p>
                </div>
              </div>

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