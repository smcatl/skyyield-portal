'use client'

import { useState } from 'react'
import { BookOpen, Video, FileText, Download, ExternalLink, CheckCircle, Play, Clock, Plus, Trash2, Edit3, X, Save } from 'lucide-react'

interface TrainingItem {
  id: string
  title: string
  description: string
  type: 'video' | 'document' | 'article' | 'quiz'
  category: string
  duration?: string // e.g., "5 min read" or "12:30"
  url: string
  completed?: boolean
  required?: boolean
}

interface TrainingSectionProps {
  items: TrainingItem[]
  loading?: boolean
  title?: string
  showProgress?: boolean
  categories?: string[]
  onComplete?: (itemId: string) => void
  editable?: boolean
  onAdd?: (item: Omit<TrainingItem, 'id'>) => void
  onRemove?: (itemId: string) => void
  onUpdate?: (item: TrainingItem) => void
}

export default function TrainingSection({
  items,
  loading = false,
  title = 'Training & Resources',
  showProgress = true,
  categories,
  onComplete,
  editable = false,
  onAdd,
  onRemove,
  onUpdate,
}: TrainingSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<TrainingItem | null>(null)
  const [newItem, setNewItem] = useState<Omit<TrainingItem, 'id'>>({
    title: '',
    description: '',
    type: 'document',
    category: 'General',
    url: '',
    duration: '',
    required: false,
  })

  const allCategories = categories || [...new Set(items.map(i => i.category))]
  
  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(i => i.category === selectedCategory)

  const completedCount = items.filter(i => i.completed).length
  const requiredCount = items.filter(i => i.required).length
  const requiredCompleted = items.filter(i => i.required && i.completed).length

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-red-400" />
      case 'document': return <FileText className="w-5 h-5 text-blue-400" />
      case 'article': return <BookOpen className="w-5 h-5 text-green-400" />
      case 'quiz': return <CheckCircle className="w-5 h-5 text-purple-400" />
      default: return <FileText className="w-5 h-5 text-[#64748B]" />
    }
  }

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-500/20'
      case 'document': return 'bg-blue-500/20'
      case 'article': return 'bg-green-500/20'
      case 'quiz': return 'bg-purple-500/20'
      default: return 'bg-[#2D3B5F]'
    }
  }

  const handleAdd = () => {
    if (onAdd && newItem.title && newItem.url) {
      onAdd(newItem)
      setNewItem({
        title: '',
        description: '',
        type: 'document',
        category: 'General',
        url: '',
        duration: '',
        required: false,
      })
      setShowAddModal(false)
    }
  }

  const handleUpdate = () => {
    if (onUpdate && editingItem) {
      onUpdate(editingItem)
      setEditingItem(null)
    }
  }

  return (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl">
      {/* Header */}
      <div className="p-4 border-b border-[#2D3B5F]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="flex items-center gap-3">
            {showProgress && (
              <div className="text-sm text-[#94A3B8]">
                {completedCount}/{items.length} completed
              </div>
            )}
            {editable && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0EA5E9] text-white rounded-lg text-sm hover:bg-[#0EA5E9]/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && items.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
              <span>Progress</span>
              <span>{Math.round((completedCount / items.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-[#0A0F2C] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0EA5E9] transition-all duration-300"
                style={{ width: `${(completedCount / items.length) * 100}%` }}
              />
            </div>
            {requiredCount > 0 && (
              <div className="text-xs text-[#64748B] mt-1">
                {requiredCompleted}/{requiredCount} required items completed
              </div>
            )}
          </div>
        )}

        {/* Category Filter */}
        {allCategories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#0EA5E9] text-white'
                  : 'bg-[#0A0F2C] text-[#94A3B8] hover:text-white'
              }`}
            >
              All
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#0EA5E9] text-white'
                    : 'bg-[#0A0F2C] text-[#94A3B8] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="divide-y divide-[#2D3B5F]">
        {loading ? (
          <div className="p-8 text-center text-[#64748B]">Loading resources...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-[#64748B]">
            {editable ? 'No resources yet. Click "Add Resource" to get started.' : 'No resources available'}
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="p-4 hover:bg-[#0A0F2C]/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 ${getTypeBg(item.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{item.title}</span>
                        {item.required && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                            Required
                          </span>
                        )}
                        {item.completed && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <div className="text-[#64748B] text-sm mt-1">{item.description}</div>
                    </div>
                    
                    {/* Edit/Delete buttons for editable mode */}
                    {editable && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRemove?.(item.id)}
                          className="p-1.5 text-[#64748B] hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[#64748B] text-xs uppercase tracking-wide">
                      {item.category}
                    </span>
                    {item.duration && (
                      <span className="flex items-center gap-1 text-[#64748B] text-xs">
                        <Clock className="w-3 h-3" />
                        {item.duration}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0EA5E9] text-white rounded-lg text-sm hover:bg-[#0EA5E9]/80 transition-colors"
                    >
                      {item.type === 'video' ? (
                        <>
                          <Play className="w-4 h-4" />
                          Watch
                        </>
                      ) : item.type === 'quiz' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Start Quiz
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4" />
                          Read
                        </>
                      )}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    
                    {!item.completed && onComplete && (
                      <button
                        onClick={() => onComplete(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0F2C] text-[#94A3B8] rounded-lg text-sm hover:text-white hover:bg-[#2D3B5F] transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Add Resource</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#64748B] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Title *</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  placeholder="Resource title"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] h-20 resize-none"
                  placeholder="Brief description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Type</label>
                  <select
                    value={newItem.type}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="document">Document</option>
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Category</label>
                  <input
                    type="text"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    placeholder="e.g., Onboarding"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">URL *</label>
                <input
                  type="url"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Duration</label>
                  <input
                    type="text"
                    value={newItem.duration || ''}
                    onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    placeholder="e.g., 5 min read"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newItem.required}
                      onChange={(e) => setNewItem({ ...newItem, required: e.target.checked })}
                      className="w-4 h-4 rounded border-[#2D3B5F] bg-[#0A0F2C] text-[#0EA5E9] focus:ring-[#0EA5E9]"
                    />
                    <span className="text-sm text-[#94A3B8]">Required</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-[#94A3B8] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newItem.title || !newItem.url}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add Resource
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Edit Resource</h3>
              <button onClick={() => setEditingItem(null)} className="text-[#64748B] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Title *</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Description</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] h-20 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Type</label>
                  <select
                    value={editingItem.type}
                    onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="document">Document</option>
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Category</label>
                  <input
                    type="text"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">URL *</label>
                <input
                  type="url"
                  value={editingItem.url}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Duration</label>
                  <input
                    type="text"
                    value={editingItem.duration || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.required}
                      onChange={(e) => setEditingItem({ ...editingItem, required: e.target.checked })}
                      className="w-4 h-4 rounded border-[#2D3B5F] bg-[#0A0F2C] text-[#0EA5E9] focus:ring-[#0EA5E9]"
                    />
                    <span className="text-sm text-[#94A3B8]">Required</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-[#94A3B8] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
