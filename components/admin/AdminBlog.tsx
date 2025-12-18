'use client'

import { useState, useEffect } from 'react'
import { 
  RefreshCw, Search, Eye, Edit, Trash2, Check, X, Send,
  FileText, Clock, CheckCircle, XCircle, AlertCircle,
  ExternalLink, ChevronDown, Save, Image as ImageIcon, Tag, Plus
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
  const [activeSection, setActiveSection] = useState<'pending' | 'approved' | 'published' | 'rejected'>('pending')
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<BlogPost>>({})
  const [saving, setSaving] = useState(false)
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/blog')
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
    if (!confirm('Delete this post permanently?')) return
    
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
        body: JSON.stringify({ 
          id: selectedPost.id, 
          title: editForm.title,
          summary: editForm.summary,
          content: editForm.content,
          category: editForm.category,
          tags: editForm.tags,
          image_url: editForm.image_url
        })
      })
      
      const data = await res.json()
      if (data.success) {
        loadPosts()
        setSelectedPost(null)
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

  const addTag = () => {
    if (!newTag.trim() || !editForm.tags) return
    if (!editForm.tags.includes(newTag.trim())) {
      setEditForm({ ...editForm, tags: [...editForm.tags, newTag.trim()] })
    }
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    if (!editForm.tags) return
    setEditForm({ ...editForm, tags: editForm.tags.filter(t => t !== tag) })
  }

  const getFilteredPosts = (status: string) => {
    return posts.filter(post => {
      const matchesStatus = post.status === status
      const matchesSearch = !searchTerm || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.summary || '').toLowerCase().includes(searchTerm.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }

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

  const sections = [
    { id: 'pending', label: 'Pending Review', count: counts.pending, color: 'text-yellow-400' },
    { id: 'approved', label: 'Ready to Publish', count: counts.approved, color: 'text-blue-400' },
    { id: 'published', label: 'Published', count: counts.published, color: 'text-green-400' },
    { id: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-red-400' },
  ]

  const PostCard = ({ post }: { post: BlogPost }) => (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4 hover:border-[#0EA5E9]/50 transition-colors">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-24 h-24 flex-shrink-0">
          {getImageUrl(post) ? (
            <img src={getImageUrl(post)!} alt="" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="w-full h-full bg-[#2D3B5F] rounded-lg flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-[#64748B]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium mb-1 line-clamp-1">{post.title}</h3>
          <p className="text-[#94A3B8] text-sm line-clamp-2 mb-2">
            {post.summary || post.excerpt || 'No summary'}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded">
              {post.category || 'Uncategorized'}
            </span>
            {post.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-[#2D3B5F] text-[#94A3B8] rounded">
                {tag}
              </span>
            ))}
            {(post.tags?.length || 0) > 2 && (
              <span className="text-[#64748B]">+{post.tags!.length - 2}</span>
            )}
            <span className="text-[#64748B]">•</span>
            <span className="text-[#64748B]">{formatDate(post.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => { setSelectedPost(post); setEditMode(false); setEditForm(post); }}
            className="p-2 text-[#0EA5E9] bg-[#0EA5E9]/10 rounded hover:bg-[#0EA5E9]/20"
            title="View/Edit"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {post.status === 'pending' && (
            <>
              <button
                onClick={() => handleAction(post.id, 'approve')}
                disabled={saving}
                className="p-2 text-green-400 bg-green-400/10 rounded hover:bg-green-400/20"
                title="Approve"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleAction(post.id, 'reject')}
                disabled={saving}
                className="p-2 text-red-400 bg-red-400/10 rounded hover:bg-red-400/20"
                title="Reject"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          
          {post.status === 'approved' && (
            <button
              onClick={() => handleAction(post.id, 'publish')}
              disabled={saving}
              className="p-2 text-green-400 bg-green-400/10 rounded hover:bg-green-400/20"
              title="Publish"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
          
          {post.status === 'published' && (
            <button
              onClick={() => handleAction(post.id, 'unpublish')}
              disabled={saving}
              className="p-2 text-yellow-400 bg-yellow-400/10 rounded hover:bg-yellow-400/20"
              title="Unpublish"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => handleDelete(post.id)}
            disabled={saving}
            className="p-2 text-red-400 bg-red-400/10 rounded hover:bg-red-400/20"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

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
          className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-[#0EA5E9] text-white'
                : 'bg-[#1A1F3A] text-[#94A3B8] hover:text-white border border-[#2D3B5F]'
            }`}
          >
            {section.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeSection === section.id ? 'bg-white/20' : `${section.color} bg-current/10`
            }`}>
              {section.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
        />
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0EA5E9]" />
            <p className="text-[#94A3B8]">Loading articles...</p>
          </div>
        ) : getFilteredPosts(activeSection).length === 0 ? (
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-[#64748B]" />
            <p className="text-[#94A3B8]">
              {activeSection === 'pending' ? 'No articles pending review' :
               activeSection === 'approved' ? 'No articles ready to publish' :
               activeSection === 'published' ? 'No published articles' :
               'No rejected articles'}
            </p>
          </div>
        ) : (
          getFilteredPosts(activeSection).map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {/* Detail/Edit Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2D3B5F]">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">
                  {editMode ? 'Edit Article' : 'Article Details'}
                </h3>
                {getStatusBadge(selectedPost.status)}
              </div>
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
                  {/* Title */}
                  <div>
                    <label className="block text-[#94A3B8] text-sm mb-1">Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>

                  {/* Summary */}
                  <div>
                    <label className="block text-[#94A3B8] text-sm mb-1">Summary</label>
                    <textarea
                      value={editForm.summary || ''}
                      onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-[#94A3B8] text-sm mb-1">Content (Markdown)</label>
                    <textarea
                      value={editForm.content || ''}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={12}
                      className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white font-mono text-sm focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>

                  {/* Category & Image */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#94A3B8] text-sm mb-1">Category</label>
                      <select
                        value={editForm.category || ''}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white focus:outline-none focus:border-[#0EA5E9]"
                      >
                        <option value="Technology">Technology</option>
                        <option value="Business">Business</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Industry News">Industry News</option>
                        <option value="Strategy">Strategy</option>
                        <option value="Guides">Guides</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#94A3B8] text-sm mb-1">Image URL</label>
                      <input
                        type="text"
                        value={editForm.image_url || ''}
                        onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white focus:outline-none focus:border-[#0EA5E9]"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-[#94A3B8] text-sm mb-2">
                      <Tag className="w-4 h-4 inline mr-1" />
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editForm.tags?.map(tag => (
                        <span 
                          key={tag} 
                          className="flex items-center gap-1 px-2 py-1 bg-[#0EA5E9]/20 text-[#0EA5E9] rounded text-sm"
                        >
                          {tag}
                          <button 
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Add a tag..."
                        className="flex-1 px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                      />
                      <button
                        onClick={addTag}
                        className="px-3 py-2 bg-[#2D3B5F] text-white rounded hover:bg-[#3D4B6F]"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Source URL */}
                  {selectedPost.source_url && (
                    <div>
                      <label className="block text-[#94A3B8] text-sm mb-1">Source</label>
                      <a 
                        href={selectedPost.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#0EA5E9] text-sm hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {selectedPost.source_url}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* View Mode */}
                  {getImageUrl(selectedPost) && (
                    <img 
                      src={getImageUrl(selectedPost)!} 
                      alt="" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2">
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
                    <span className="text-[#64748B] text-xs">{formatDate(selectedPost.created_at)}</span>
                  </div>

                  <h2 className="text-xl font-bold text-white">{selectedPost.title}</h2>
                  
                  <p className="text-[#94A3B8]">{selectedPost.summary || selectedPost.excerpt}</p>

                  {/* Tags */}
                  {selectedPost.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedPost.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-[#2D3B5F] text-[#94A3B8] rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="prose prose-invert max-w-none border-t border-[#2D3B5F] pt-4">
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
