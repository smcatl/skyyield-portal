'use client'

import { useState, useEffect } from 'react'
import { 
  RefreshCw, Search, Eye, Edit, Trash2, Check, X, Send,
  FileText, Clock, CheckCircle, XCircle, AlertCircle,
  ExternalLink, ChevronDown, Save, Image as ImageIcon
} from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  category: string
  tags: string[]
  image_url: string | null
  source_url: string | null
  source_title: string | null
  status: 'pending' | 'draft' | 'approved' | 'published' | 'rejected'
  author: string
  rejection_reason: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

interface Counts {
  pending: number
  draft: number
  approved: number
  published: number
  rejected: number
  total: number
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [counts, setCounts] = useState<Counts>({ pending: 0, draft: 0, approved: 0, published: 0, rejected: 0, total: 0 })
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [filterStatus])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (searchTerm) params.set('search', searchTerm)

      const res = await fetch(`/api/admin/blog?${params}`)
      const data = await res.json()

      if (data.success) {
        setPosts(data.posts || [])
        setCounts(data.counts || { pending: 0, draft: 0, approved: 0, published: 0, rejected: 0, total: 0 })
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Failed to load posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (postId: string, action: string, extra?: Record<string, any>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, action, ...extra })
      })

      const data = await res.json()
      if (data.success) {
        loadPosts()
        if (selectedPost?.id === postId) {
          setSelectedPost(data.post)
        }
      } else {
        alert(data.error || 'Action failed')
      }
    } catch (err) {
      alert('Action failed')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedPost) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPost.id,
          title: selectedPost.title,
          summary: selectedPost.summary,
          content: selectedPost.content,
          category: selectedPost.category,
          tags: selectedPost.tags,
          image_url: selectedPost.image_url,
        })
      })

      const data = await res.json()
      if (data.success) {
        setEditMode(false)
        loadPosts()
      } else {
        alert(data.error || 'Save failed')
      }
    } catch (err) {
      alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      const res = await fetch(`/api/admin/blog?id=${postId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        loadPosts()
        if (selectedPost?.id === postId) setSelectedPost(null)
      }
    } catch (err) {
      alert('Delete failed')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      draft: 'bg-gray-500/20 text-gray-400',
      approved: 'bg-blue-500/20 text-blue-400',
      published: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'approved': return <CheckCircle className="w-4 h-4 text-blue-400" />
      case 'published': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />
      default: return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  // Filter posts by search
  const filteredPosts = posts.filter(post => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return post.title.toLowerCase().includes(term) ||
           post.summary?.toLowerCase().includes(term) ||
           post.category?.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Blog Management</h2>
          <p className="text-[#94A3B8] text-sm">Review, approve, and manage blog articles</p>
        </div>
        <button
          onClick={loadPosts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-white rounded-lg hover:bg-[#2D3B5F] transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-400">{counts.pending}</div>
          <div className="text-[#94A3B8] text-sm">Pending Review</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{counts.published}</div>
          <div className="text-[#94A3B8] text-sm">Published</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-400">{counts.draft}</div>
          <div className="text-[#94A3B8] text-sm">Drafts</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-2xl font-bold text-red-400">{counts.rejected}</div>
          <div className="text-[#94A3B8] text-sm">Rejected</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="draft">Drafts</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          onClick={loadPosts}
          className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
        >
          <RefreshCw className="w-4 h-4" />
          Show All ({counts.total})
        </button>
      </div>

      {/* Posts Table */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2D3B5F]">
              <th className="text-left px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Article</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Category</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Source</th>
              <th className="text-center px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Status</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Created</th>
              <th className="text-center px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#94A3B8]">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading...
                </td>
              </tr>
            ) : filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#94A3B8]">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  No articles found
                </td>
              </tr>
            ) : (
              filteredPosts.map(post => (
                <tr key={post.id} className="border-t border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      {post.image_url ? (
                        <img src={post.image_url} alt="" className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-[#2D3B5F] rounded flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-[#64748B]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{post.title}</div>
                        <div className="text-[#64748B] text-sm truncate">{post.summary}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded text-xs">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {post.source_url ? (
                      <a href={post.source_url} target="_blank" rel="noopener noreferrer" 
                         className="text-[#0EA5E9] hover:underline text-sm truncate block max-w-[150px]">
                        {post.source_title || 'Source'}
                      </a>
                    ) : (
                      <span className="text-[#64748B] text-sm">Manual</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(post.status)}</td>
                  <td className="px-4 py-3 text-[#94A3B8] text-sm">{formatDate(post.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setSelectedPost(post); setEditMode(false); }}
                        className="p-1.5 text-[#0EA5E9] hover:bg-[#0EA5E9]/10 rounded"
                        title="View/Edit"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {post.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(post.id, 'approve')}
                            className="p-1.5 text-green-400 hover:bg-green-400/10 rounded"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(post.id, 'reject')}
                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {post.status === 'approved' && (
                        <button
                          onClick={() => handleAction(post.id, 'publish')}
                          className="p-1.5 text-green-400 hover:bg-green-400/10 rounded"
                          title="Publish"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-red-400 hover:bg-red-400/10 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3B5F] shrink-0">
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedPost.status)}
                <h3 className="text-lg font-semibold text-white">
                  {editMode ? 'Edit Article' : 'Article Details'}
                </h3>
                {getStatusBadge(selectedPost.status)}
              </div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-[#0EA5E9] hover:bg-[#0EA5E9]/10 rounded"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => { setSelectedPost(null); setEditMode(false); }}
                  className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#2D3B5F] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-1">Title</label>
                {editMode ? (
                  <input
                    type="text"
                    value={selectedPost.title}
                    onChange={(e) => setSelectedPost({ ...selectedPost, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                  />
                ) : (
                  <div className="text-white text-lg font-medium">{selectedPost.title}</div>
                )}
              </div>

              {/* Summary */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-1">Summary</label>
                {editMode ? (
                  <textarea
                    value={selectedPost.summary || ''}
                    onChange={(e) => setSelectedPost({ ...selectedPost, summary: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white resize-none"
                  />
                ) : (
                  <div className="text-[#94A3B8]">{selectedPost.summary}</div>
                )}
              </div>

              {/* Category & Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Category</label>
                  {editMode ? (
                    <select
                      value={selectedPost.category}
                      onChange={(e) => setSelectedPost({ ...selectedPost, category: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                    >
                      <option>Technology</option>
                      <option>Business</option>
                      <option>Industry News</option>
                      <option>Equipment</option>
                      <option>Strategy</option>
                    </select>
                  ) : (
                    <span className="px-2 py-1 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded text-sm">
                      {selectedPost.category}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Tags</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedPost.tags?.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[#2D3B5F] text-[#94A3B8] rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-1">Content</label>
                {editMode ? (
                  <textarea
                    value={selectedPost.content || ''}
                    onChange={(e) => setSelectedPost({ ...selectedPost, content: e.target.value })}
                    rows={12}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white font-mono text-sm resize-none"
                  />
                ) : (
                  <div className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg p-4 max-h-64 overflow-auto">
                    <div className="text-[#94A3B8] whitespace-pre-wrap text-sm">{selectedPost.content}</div>
                  </div>
                )}
              </div>

              {/* Image */}
              {selectedPost.image_url && (
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Featured Image</label>
                  <img src={selectedPost.image_url} alt="" className="max-w-md rounded-lg" />
                </div>
              )}

              {/* Source */}
              {selectedPost.source_url && (
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Source</label>
                  <a href={selectedPost.source_url} target="_blank" rel="noopener noreferrer"
                     className="text-[#0EA5E9] hover:underline flex items-center gap-1">
                    {selectedPost.source_title || selectedPost.source_url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#2D3B5F] bg-[#0A0F2C] shrink-0">
              <div className="text-[#94A3B8] text-sm">
                Created: {formatDate(selectedPost.created_at)}
                {selectedPost.published_at && ` • Published: ${formatDate(selectedPost.published_at)}`}
              </div>
              <div className="flex items-center gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 text-[#94A3B8] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    {selectedPost.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(selectedPost.id, 'reject')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(selectedPost.id, 'approve')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                      </>
                    )}
                    {selectedPost.status === 'approved' && (
                      <button
                        onClick={() => handleAction(selectedPost.id, 'publish')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#10F981] text-black rounded-lg hover:bg-[#10F981]/80"
                      >
                        <Send className="w-4 h-4" />
                        Publish
                      </button>
                    )}
                    {selectedPost.status === 'published' && (
                      <button
                        onClick={() => handleAction(selectedPost.id, 'unpublish')}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30"
                      >
                        Unpublish
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
