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
  excerpt?: string
  content: string
  category: string
  tags: string[]
  image_url: string | null
  featured_image?: string | null
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
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<BlogPost>>({})
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
      }
    } catch (err) {
      console.error('Failed to load posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (postId: string, action: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, action })
      })

      const data = await res.json()
      if (data.success) {
        loadPosts()
        if (selectedPost?.id === postId) {
          setSelectedPost(null)
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

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return
    
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId })
      })
      
      if (res.ok) {
        loadPosts()
        if (selectedPost?.id === postId) setSelectedPost(null)
      }
    } catch (err) {
      alert('Delete failed')
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedPost) return
    setSaving(true)
    
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPost.id, ...editForm })
      })
      
      const data = await res.json()
      if (data.success) {
        loadPosts()
        setSelectedPost(data.post)
        setEditMode(false)
      } else {
        alert(data.error || 'Save failed')
      }
    } catch (err) {
      alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.summary || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      draft: 'bg-gray-500/20 text-gray-400',
      approved: 'bg-blue-500/20 text-blue-400',
      published: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const getImageUrl = (post: BlogPost) => post.image_url || post.featured_image

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
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-white rounded-lg hover:bg-[#2D3B5F]"
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadPosts()}
            className="w-full pl-10 pr-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="draft">Drafts</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          onClick={loadPosts}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
        >
          <RefreshCw className="w-4 h-4" />
          Show All ({counts.total})
        </button>
      </div>

      {/* Posts List - Card Layout */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0EA5E9]" />
            <p className="text-[#94A3B8]">Loading articles...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-[#64748B]" />
            <p className="text-[#94A3B8]">No articles found</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <div key={post.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4 hover:border-[#0EA5E9]/50 transition-colors">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Image */}
                <div className="w-full md:w-32 h-32 md:h-24 flex-shrink-0">
                  {getImageUrl(post) ? (
                    <img 
                      src={getImageUrl(post)!} 
                      alt="" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2D3B5F] rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-[#64748B]" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <h3 className="text-white font-medium flex-1">{post.title}</h3>
                    {getStatusBadge(post.status)}
                  </div>
                  <p className="text-[#94A3B8] text-sm line-clamp-2 mb-3">
                    {post.summary || post.excerpt || 'No summary'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                    <span className="px-2 py-1 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded">
                      {post.category || 'Uncategorized'}
                    </span>
                    {post.source_url && (
                      <a 
                        href={post.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#0EA5E9] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Source
                      </a>
                    )}
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-[#2D3B5F] md:pl-4">
                  <button
                    onClick={() => { setSelectedPost(post); setEditMode(false); setEditForm(post); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-[#0EA5E9] bg-[#0EA5E9]/10 rounded hover:bg-[#0EA5E9]/20 text-sm"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="md:hidden">View</span>
                  </button>
                  
                  {post.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(post.id, 'approve')}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 text-green-400 bg-green-400/10 rounded hover:bg-green-400/20 text-sm"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                        <span className="md:hidden">Approve</span>
                      </button>
                      <button
                        onClick={() => handleAction(post.id, 'reject')}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-400 bg-red-400/10 rounded hover:bg-red-400/20 text-sm"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                        <span className="md:hidden">Reject</span>
                      </button>
                    </>
                  )}
                  
                  {post.status === 'approved' && (
                    <button
                      onClick={() => handleAction(post.id, 'publish')}
                      disabled={saving}
                      className="flex items-center gap-1 px-3 py-1.5 text-green-400 bg-green-400/10 rounded hover:bg-green-400/20 text-sm"
                      title="Publish"
                    >
                      <Send className="w-4 h-4" />
                      <span className="md:hidden">Publish</span>
                    </button>
                  )}
                  
                  {post.status === 'published' && (
                    <button
                      onClick={() => handleAction(post.id, 'unpublish')}
                      disabled={saving}
                      className="flex items-center gap-1 px-3 py-1.5 text-yellow-400 bg-yellow-400/10 rounded hover:bg-yellow-400/20 text-sm"
                      title="Unpublish"
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="md:hidden">Unpublish</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 text-red-400 bg-red-400/10 rounded hover:bg-red-400/20 text-sm"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="md:hidden">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2D3B5F]">
              <h3 className="text-lg font-semibold text-white">
                {editMode ? 'Edit Article' : 'Article Details'}
              </h3>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button
                    onClick={() => { setEditMode(true); setEditForm(selectedPost); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0EA5E9] text-white rounded hover:bg-[#0EA5E9]/80 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => { setSelectedPost(null); setEditMode(false); }}
                  className="p-2 text-[#94A3B8] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {editMode ? (
                <>
                  <div>
                    <label className="block text-[#94A3B8] text-sm mb-1">Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] text-sm mb-1">Summary</label>
                    <textarea
                      value={editForm.summary || ''}
                      onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] text-sm mb-1">Content</label>
                    <textarea
                      value={editForm.content || ''}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={10}
                      className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white font-mono text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#94A3B8] text-sm mb-1">Category</label>
                      <input
                        type="text"
                        value={editForm.category || ''}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[#94A3B8] text-sm mb-1">Image URL</label>
                      <input
                        type="text"
                        value={editForm.image_url || ''}
                        onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {getImageUrl(selectedPost) && (
                    <img 
                      src={getImageUrl(selectedPost)!} 
                      alt="" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(selectedPost.status)}
                    <span className="px-2 py-1 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded text-xs">
                      {selectedPost.category}
                    </span>
                    {selectedPost.source_url && (
                      <a 
                        href={selectedPost.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#0EA5E9] text-xs hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Source
                      </a>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white">{selectedPost.title}</h2>
                  <p className="text-[#94A3B8]">{selectedPost.summary || selectedPost.excerpt}</p>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-[#94A3B8] text-sm">
                      {selectedPost.content}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[#2D3B5F]">
              <div className="flex items-center gap-2">
                {selectedPost.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(selectedPost.id, 'approve')}
                      disabled={saving}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(selectedPost.id, 'reject')}
                      disabled={saving}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedPost.status === 'approved' && (
                  <button
                    onClick={() => handleAction(selectedPost.id, 'publish')}
                    disabled={saving}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    Publish Now
                  </button>
                )}
                {selectedPost.status === 'published' && (
                  <button
                    onClick={() => handleAction(selectedPost.id, 'unpublish')}
                    disabled={saving}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                  >
                    Unpublish
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 text-[#94A3B8] hover:text-white text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="flex items-center gap-1 px-4 py-2 bg-[#0EA5E9] text-white rounded hover:bg-[#0EA5E9]/80 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="px-4 py-2 bg-[#2D3B5F] text-white rounded hover:bg-[#3D4B6F] text-sm"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
