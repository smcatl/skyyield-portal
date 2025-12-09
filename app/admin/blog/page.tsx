"use client"

import { useState, useEffect } from "react"

interface BlogArticle {
  id: string
  slug: string
  title: string
  summary: string
  content: string
  image: string
  author: string
  authorRole: string
  publishedAt: string
  readTime: string
  category: string
  tags: string[]
  sourceUrl?: string
  status: "pending" | "published" | "draft" | "rejected"
  createdAt: string
  updatedAt: string
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(251, 191, 36, 0.1)", text: "#FBBF24" },
  published: { bg: "rgba(16, 249, 129, 0.1)", text: "#10F981" },
  draft: { bg: "rgba(148, 163, 184, 0.1)", text: "#94A3B8" },
  rejected: { bg: "rgba(239, 68, 68, 0.1)", text: "#EF4444" },
}

const categories = ["All", "Technology", "Business", "Equipment", "Industry News", "Strategy", "Guides"]

export default function BlogAdminPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<BlogArticle>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const response = await fetch("/api/blog/articles?status=all")
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles || [])
      }
    } catch (error) {
      console.error("Error fetching articles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateArticleStatus = async (article: BlogArticle, newStatus: string) => {
    try {
      const response = await fetch("/api/blog/articles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, status: newStatus }),
      })

      if (response.ok) {
        setArticles(articles.map(a => 
          a.id === article.id ? { ...a, status: newStatus as BlogArticle["status"] } : a
        ))
      }
    } catch (error) {
      console.error("Error updating article:", error)
      alert("Failed to update article status")
    }
  }

  const deleteArticle = async (article: BlogArticle) => {
    if (!confirm(`Are you sure you want to delete "${article.title}"?`)) return

    try {
      const response = await fetch(`/api/blog/articles?id=${article.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setArticles(articles.filter(a => a.id !== article.id))
      }
    } catch (error) {
      console.error("Error deleting article:", error)
      alert("Failed to delete article")
    }
  }

  const saveArticle = async () => {
    if (!selectedArticle) return
    setIsSaving(true)

    try {
      const response = await fetch("/api/blog/articles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedArticle.id, ...editForm }),
      })

      if (response.ok) {
        const data = await response.json()
        setArticles(articles.map(a => 
          a.id === selectedArticle.id ? { ...a, ...editForm } : a
        ))
        setIsEditOpen(false)
        setSelectedArticle(null)
      }
    } catch (error) {
      console.error("Error saving article:", error)
      alert("Failed to save article")
    } finally {
      setIsSaving(false)
    }
  }

  const openEdit = (article: BlogArticle) => {
    setSelectedArticle(article)
    setEditForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      image: article.image,
      category: article.category,
      tags: article.tags,
      author: article.author,
      authorRole: article.authorRole,
    })
    setIsEditOpen(true)
  }

  const openPreview = (article: BlogArticle) => {
    setSelectedArticle(article)
    setIsPreviewOpen(true)
  }

  // Filter articles
  const filteredArticles = articles.filter(article => {
    const matchesStatus = filterStatus === "all" || article.status === filterStatus
    const matchesCategory = filterCategory === "All" || article.category === filterCategory
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesCategory && matchesSearch
  })

  // Count by status
  const statusCounts = {
    all: articles.length,
    pending: articles.filter(a => a.status === "pending").length,
    published: articles.filter(a => a.status === "published").length,
    draft: articles.filter(a => a.status === "draft").length,
    rejected: articles.filter(a => a.status === "rejected").length,
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    <div style={{ padding: "32px", paddingTop: "100px", fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh", background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", color: "#FFFFFF" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "8px" }}>Blog Management</h1>
        <p style={{ color: "#94A3B8" }}>Review, approve, and manage blog articles</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "Pending Review", count: statusCounts.pending, color: "#FBBF24", status: "pending" },
          { label: "Published", count: statusCounts.published, color: "#10F981", status: "published" },
          { label: "Drafts", count: statusCounts.draft, color: "#94A3B8", status: "draft" },
          { label: "Rejected", count: statusCounts.rejected, color: "#EF4444", status: "rejected" },
        ].map(stat => (
          <button
            key={stat.status}
            onClick={() => setFilterStatus(stat.status)}
            style={{
              padding: "20px",
              borderRadius: "12px",
              backgroundColor: filterStatus === stat.status ? "rgba(14, 165, 233, 0.1)" : "#1A1F3A",
              border: filterStatus === stat.status ? "1px solid #0EA5E9" : "1px solid #2D3B5F",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: "32px", fontWeight: "bold", color: stat.color }}>{stat.count}</div>
            <div style={{ fontSize: "14px", color: "#94A3B8" }}>{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
            color: "#FFFFFF",
            fontSize: "14px",
          }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
            color: "#FFFFFF",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={() => setFilterStatus("all")}
          style={{
            padding: "12px 20px",
            borderRadius: "8px",
            backgroundColor: filterStatus === "all" ? "#0EA5E9" : "transparent",
            border: "1px solid #2D3B5F",
            color: "#FFFFFF",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Show All ({statusCounts.all})
        </button>
      </div>

      {/* Articles Table */}
      <div style={{ backgroundColor: "#1A1F3A", borderRadius: "16px", border: "1px solid #2D3B5F", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2D3B5F" }}>
              <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase" }}>Article</th>
              <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase" }}>Category</th>
              <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase" }}>Source</th>
              <th style={{ padding: "16px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase" }}>Created</th>
              <th style={{ padding: "16px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredArticles.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "#64748B" }}>
                  {articles.length === 0 ? "No articles yet. Articles from Make.com will appear here." : "No articles match your filters."}
                </td>
              </tr>
            ) : (
              filteredArticles.map(article => (
                <tr key={article.id} style={{ borderBottom: "1px solid #2D3B5F" }}>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <img
                        src={article.image || "https://via.placeholder.com/60x60?text=No+Image"}
                        alt=""
                        style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover" }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: "600", color: "#FFFFFF", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>
                          {article.title}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>
                          {article.summary}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      backgroundColor: "rgba(14, 165, 233, 0.1)",
                      color: "#0EA5E9",
                    }}>
                      {article.category}
                    </span>
                  </td>
                  <td style={{ padding: "16px" }}>
                    {article.sourceUrl ? (
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#0EA5E9", textDecoration: "none", fontSize: "13px" }}
                      >
                        {new URL(article.sourceUrl).hostname.replace("www.", "")}
                      </a>
                    ) : (
                      <span style={{ color: "#64748B", fontSize: "13px" }}>Original</span>
                    )}
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: "500",
                      backgroundColor: statusColors[article.status]?.bg,
                      color: statusColors[article.status]?.text,
                    }}>
                      {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: "16px", fontSize: "13px", color: "#94A3B8" }}>
                    {formatDate(article.createdAt)}
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                      <button
                        onClick={() => openPreview(article)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                          border: "1px solid #2D3B5F",
                          backgroundColor: "transparent",
                          color: "#94A3B8",
                        }}
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => openEdit(article)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                          border: "1px solid #2D3B5F",
                          backgroundColor: "transparent",
                          color: "#94A3B8",
                        }}
                      >
                        Edit
                      </button>
                      {article.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateArticleStatus(article, "published")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              cursor: "pointer",
                              border: "none",
                              backgroundColor: "#10F981",
                              color: "#000000",
                              fontWeight: "600",
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateArticleStatus(article, "rejected")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              cursor: "pointer",
                              border: "1px solid #EF4444",
                              backgroundColor: "transparent",
                              color: "#EF4444",
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {article.status === "published" && (
                        <button
                          onClick={() => updateArticleStatus(article, "draft")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                            border: "1px solid #FBBF24",
                            backgroundColor: "transparent",
                            color: "#FBBF24",
                          }}
                        >
                          Unpublish
                        </button>
                      )}
                      {(article.status === "draft" || article.status === "rejected") && (
                        <button
                          onClick={() => updateArticleStatus(article, "published")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                            border: "1px solid #10F981",
                            backgroundColor: "transparent",
                            color: "#10F981",
                          }}
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => deleteArticle(article)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                          border: "1px solid #EF4444",
                          backgroundColor: "transparent",
                          color: "#EF4444",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && selectedArticle && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "rgba(0,0,0,0.8)" }}
            onClick={() => setIsPreviewOpen(false)}
          />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "95%",
            maxWidth: "800px",
            maxHeight: "90vh",
            zIndex: 70,
            borderRadius: "16px",
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #2D3B5F",
              flexShrink: 0,
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Article Preview</h2>
              <button
                onClick={() => setIsPreviewOpen(false)}
                style={{ fontSize: "24px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              <img
                src={selectedArticle.image}
                alt=""
                style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "12px", marginBottom: "24px" }}
              />
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <span style={{ padding: "4px 12px", borderRadius: "4px", fontSize: "12px", backgroundColor: "rgba(14, 165, 233, 0.1)", color: "#0EA5E9" }}>
                  {selectedArticle.category}
                </span>
                <span style={{ padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", backgroundColor: statusColors[selectedArticle.status]?.bg, color: statusColors[selectedArticle.status]?.text }}>
                  {selectedArticle.status}
                </span>
              </div>
              <h3 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "16px" }}>{selectedArticle.title}</h3>
              <p style={{ fontSize: "16px", color: "#94A3B8", marginBottom: "24px" }}>{selectedArticle.summary}</p>
              <div style={{ fontSize: "15px", lineHeight: "1.8", color: "#CBD5E1", whiteSpace: "pre-wrap" }}>
                {selectedArticle.content}
              </div>
              {selectedArticle.sourceUrl && (
                <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#0A0F2C", borderRadius: "8px" }}>
                  <span style={{ color: "#64748B", fontSize: "13px" }}>Source: </span>
                  <a href={selectedArticle.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0EA5E9", fontSize: "13px" }}>
                    {selectedArticle.sourceUrl}
                  </a>
                </div>
              )}
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid #2D3B5F", display: "flex", gap: "12px", justifyContent: "flex-end", flexShrink: 0 }}>
              {selectedArticle.status === "pending" && (
                <>
                  <button
                    onClick={() => { updateArticleStatus(selectedArticle, "rejected"); setIsPreviewOpen(false); }}
                    style={{ padding: "10px 20px", borderRadius: "8px", fontSize: "14px", cursor: "pointer", border: "1px solid #EF4444", backgroundColor: "transparent", color: "#EF4444" }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => { updateArticleStatus(selectedArticle, "published"); setIsPreviewOpen(false); }}
                    style={{ padding: "10px 20px", borderRadius: "8px", fontSize: "14px", cursor: "pointer", border: "none", backgroundColor: "#10F981", color: "#000000", fontWeight: "600" }}
                  >
                    Approve & Publish
                  </button>
                </>
              )}
              <button
                onClick={() => { setIsPreviewOpen(false); openEdit(selectedArticle); }}
                style={{ padding: "10px 20px", borderRadius: "8px", fontSize: "14px", cursor: "pointer", border: "1px solid #2D3B5F", backgroundColor: "transparent", color: "#FFFFFF" }}
              >
                Edit Article
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedArticle && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "rgba(0,0,0,0.8)" }}
            onClick={() => setIsEditOpen(false)}
          />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "95%",
            maxWidth: "700px",
            maxHeight: "90vh",
            zIndex: 70,
            borderRadius: "16px",
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #2D3B5F",
              flexShrink: 0,
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Edit Article</h2>
              <button
                onClick={() => setIsEditOpen(false)}
                style={{ fontSize: "24px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Title</label>
                <input
                  type="text"
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Summary</label>
                <textarea
                  value={editForm.summary || ""}
                  onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                  rows={3}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Content (Markdown)</label>
                <textarea
                  value={editForm.content || ""}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={10}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", resize: "vertical", fontFamily: "monospace", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Image URL</label>
                <input
                  type="text"
                  value={editForm.image || ""}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                />
                {editForm.image && (
                  <img src={editForm.image} alt="Preview" style={{ marginTop: "8px", maxHeight: "100px", borderRadius: "8px" }} />
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Category</label>
                  <select
                    value={editForm.category || ""}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px" }}
                  >
                    {categories.filter(c => c !== "All").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={(editForm.tags || []).join(", ")}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(",").map(t => t.trim()) })}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid #2D3B5F", display: "flex", gap: "12px", justifyContent: "flex-end", flexShrink: 0 }}>
              <button
                onClick={() => setIsEditOpen(false)}
                style={{ padding: "10px 20px", borderRadius: "8px", fontSize: "14px", cursor: "pointer", border: "1px solid #2D3B5F", backgroundColor: "transparent", color: "#94A3B8" }}
              >
                Cancel
              </button>
              <button
                onClick={saveArticle}
                disabled={isSaving}
                style={{ padding: "10px 20px", borderRadius: "8px", fontSize: "14px", cursor: "pointer", border: "none", background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)", color: "#FFFFFF", fontWeight: "600" }}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}