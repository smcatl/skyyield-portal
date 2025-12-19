'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  FileText, Users, Building2, Wrench, Briefcase, MapPin, Cpu, HelpCircle,
  GripVertical, ExternalLink, Copy, Check, Edit2, Trash2, Plus, ChevronDown,
  ChevronRight, Eye, EyeOff, Settings, RefreshCw, Save, X, FileSignature,
  Send, MoreHorizontal, Search, Filter
} from 'lucide-react'

interface Form {
  id: string
  name: string
  slug: string
  description: string
  category: string
  form_type: string
  status: string
  requires_signature: boolean
  docuseal_template_id: string | null
  submission_count: number
  fields: any[]
  settings: any
  display_order?: number
}

type CategoryKey = 'application' | 'agreement' | 'internal' | 'onboarding' | 'support'

const CATEGORIES: Record<CategoryKey, { label: string; icon: any; color: string; bgColor: string }> = {
  application: { label: 'Applications', icon: FileText, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  agreement: { label: 'Agreements & Contracts', icon: FileSignature, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  internal: { label: 'Internal / HR', icon: Briefcase, color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
  onboarding: { label: 'Onboarding', icon: Cpu, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  support: { label: 'Support & Surveys', icon: HelpCircle, color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
}

const FORM_TYPE_ICONS: Record<string, any> = {
  location_partner: Building2,
  referral_partner: Users,
  contractor: Wrench,
  employee: Briefcase,
  venue: MapPin,
  device: Cpu,
  support: HelpCircle,
  site_survey: MapPin,
  general: FileText,
}

export default function AdminFormsManagerPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['application', 'agreement', 'internal', 'onboarding', 'support']))
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [draggedForm, setDraggedForm] = useState<Form | null>(null)
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://skyyield.io'

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/forms')
      if (res.ok) {
        const data = await res.json()
        // Sort by display_order within each category
        const sortedForms = (data.forms || []).sort((a: Form, b: Form) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category)
          }
          return (a.display_order || 0) - (b.display_order || 0)
        })
        setForms(sortedForms)
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const copyToClipboard = async (slug: string) => {
    const url = `${BASE_URL}/forms/${slug}`
    await navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const getFormsByCategory = useCallback((category: string) => {
    return forms
      .filter(f => f.category === category)
      .filter(f => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return f.name.toLowerCase().includes(q) || f.slug.toLowerCase().includes(q)
      })
  }, [forms, searchQuery])

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, form: Form) => {
    setDraggedForm(form)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', form.id)
  }

  const handleDragOver = (e: React.DragEvent, category: string, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCategory(category)
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverCategory(null)
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, targetCategory: string, targetIndex: number) => {
    e.preventDefault()
    if (!draggedForm) return

    const updatedForms = [...forms]
    const sourceIndex = updatedForms.findIndex(f => f.id === draggedForm.id)
    
    if (sourceIndex === -1) return

    // Remove from current position
    const [movedForm] = updatedForms.splice(sourceIndex, 1)
    
    // Update category if changed
    movedForm.category = targetCategory

    // Find insert position within category
    const categoryForms = updatedForms.filter(f => f.category === targetCategory)
    const insertAfterIndex = targetIndex > 0 
      ? updatedForms.findIndex(f => f.id === categoryForms[targetIndex - 1]?.id)
      : updatedForms.findIndex(f => f.category === targetCategory)

    // Insert at new position
    if (insertAfterIndex === -1) {
      updatedForms.push(movedForm)
    } else {
      updatedForms.splice(insertAfterIndex + 1, 0, movedForm)
    }

    // Update display orders
    let orderCounter: Record<string, number> = {}
    updatedForms.forEach(f => {
      if (!orderCounter[f.category]) orderCounter[f.category] = 0
      f.display_order = orderCounter[f.category]++
    })

    setForms(updatedForms)
    setHasUnsavedChanges(true)
    setDraggedForm(null)
    setDragOverCategory(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedForm(null)
    setDragOverCategory(null)
    setDragOverIndex(null)
  }

  const saveOrder = async () => {
    try {
      // Save each form's new order and category
      for (const form of forms) {
        await fetch('/api/forms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: form.id,
            category: form.category,
            display_order: form.display_order,
          }),
        })
      }
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error saving order:', error)
    }
  }

  const toggleFormStatus = async (form: Form) => {
    const newStatus = form.status === 'active' ? 'draft' : 'active'
    try {
      const res = await fetch('/api/forms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: form.id, status: newStatus }),
      })
      if (res.ok) {
        setForms(prev => prev.map(f => f.id === form.id ? { ...f, status: newStatus } : f))
      }
    } catch (error) {
      console.error('Error updating form status:', error)
    }
  }

  const deleteForm = async (form: Form) => {
    if (!confirm(`Are you sure you want to delete "${form.name}"? This cannot be undone.`)) return
    
    try {
      const res = await fetch(`/api/forms?id=${form.id}`, { method: 'DELETE' })
      if (res.ok) {
        setForms(prev => prev.filter(f => f.id !== form.id))
      }
    } catch (error) {
      console.error('Error deleting form:', error)
    }
  }

  const FormCard = ({ form, index, category }: { form: Form; index: number; category: string }) => {
    const Icon = FORM_TYPE_ICONS[form.form_type] || FileText
    const isBeingDragged = draggedForm?.id === form.id
    const isDragTarget = dragOverCategory === category && dragOverIndex === index

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, form)}
        onDragOver={(e) => handleDragOver(e, category, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, category, index)}
        onDragEnd={handleDragEnd}
        className={`
          group relative bg-[#0F1629] border rounded-lg p-4 transition-all duration-200 cursor-grab active:cursor-grabbing
          ${isBeingDragged ? 'opacity-50 border-[#0EA5E9] scale-[0.98]' : 'border-[#2D3B5F] hover:border-[#3D4B6F]'}
          ${isDragTarget ? 'border-[#0EA5E9] border-dashed bg-[#0EA5E9]/5' : ''}
          ${form.status === 'draft' ? 'opacity-60' : ''}
        `}
      >
        {/* Drag Handle */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-[#64748B]" />
        </div>

        <div className="pl-4">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${CATEGORIES[category as CategoryKey]?.bgColor || 'bg-gray-400/10'}`}>
                <Icon className={`w-4 h-4 ${CATEGORIES[category as CategoryKey]?.color || 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">{form.name}</h3>
                <p className="text-[#64748B] text-xs font-mono">/forms/{form.slug}</p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-1">
              {form.requires_signature && (
                <span className="px-2 py-0.5 bg-blue-400/10 text-blue-400 text-xs rounded-full flex items-center gap-1">
                  <FileSignature className="w-3 h-3" />
                  DocuSeal
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                form.status === 'active' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-gray-400/10 text-gray-400'
              }`}>
                {form.status}
              </span>
            </div>
          </div>

          {/* Description */}
          {form.description && (
            <p className="text-[#94A3B8] text-xs mb-3 line-clamp-1">{form.description}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] text-xs">
              {form.submission_count || 0} submissions
            </span>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => copyToClipboard(form.slug)}
                className="p-1.5 text-[#64748B] hover:text-white hover:bg-[#1E293B] rounded transition-colors"
                title="Copy link"
              >
                {copiedSlug === form.slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={`/forms/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-[#64748B] hover:text-white hover:bg-[#1E293B] rounded transition-colors"
                title="Open form"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => toggleFormStatus(form)}
                className="p-1.5 text-[#64748B] hover:text-white hover:bg-[#1E293B] rounded transition-colors"
                title={form.status === 'active' ? 'Deactivate' : 'Activate'}
              >
                {form.status === 'active' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setEditingForm(form)}
                className="p-1.5 text-[#64748B] hover:text-white hover:bg-[#1E293B] rounded transition-colors"
                title="Edit form"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteForm(form)}
                className="p-1.5 text-[#64748B] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                title="Delete form"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CategorySection = ({ categoryKey }: { categoryKey: CategoryKey }) => {
    const category = CATEGORIES[categoryKey]
    const categoryForms = getFormsByCategory(categoryKey)
    const isExpanded = expandedCategories.has(categoryKey)
    const Icon = category.icon

    return (
      <div 
        className="mb-6"
        onDragOver={(e) => {
          if (categoryForms.length === 0) {
            e.preventDefault()
            setDragOverCategory(categoryKey)
            setDragOverIndex(0)
          }
        }}
        onDrop={(e) => {
          if (categoryForms.length === 0) {
            handleDrop(e, categoryKey, 0)
          }
        }}
      >
        {/* Category Header */}
        <button
          onClick={() => toggleCategory(categoryKey)}
          className="w-full flex items-center justify-between p-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg hover:bg-[#0F1629] transition-colors mb-3"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${category.bgColor}`}>
              <Icon className={`w-5 h-5 ${category.color}`} />
            </div>
            <div className="text-left">
              <h2 className="text-white font-semibold">{category.label}</h2>
              <p className="text-[#64748B] text-xs">{categoryForms.length} form{categoryForms.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-[#64748B]" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[#64748B]" />
          )}
        </button>

        {/* Forms Grid */}
        {isExpanded && (
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-3 pl-4 ${
            dragOverCategory === categoryKey && categoryForms.length === 0 ? 'min-h-[100px] border-2 border-dashed border-[#0EA5E9] rounded-lg bg-[#0EA5E9]/5' : ''
          }`}>
            {categoryForms.length === 0 ? (
              <div className="col-span-2 flex items-center justify-center py-8 text-[#64748B] text-sm">
                {dragOverCategory === categoryKey ? 'Drop here to add' : 'No forms in this category'}
              </div>
            ) : (
              categoryForms.map((form, index) => (
                <FormCard key={form.id} form={form} index={index} category={categoryKey} />
              ))
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Forms Manager</h1>
          <p className="text-[#94A3B8]">Drag to reorder • Click category to expand/collapse</p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <button
              onClick={saveOrder}
              className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Order
            </button>
          )}
          <button
            onClick={fetchForms}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <a
            href="/portals/admin/forms/new"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Form
          </a>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search forms..."
          className="w-full pl-10 pr-4 py-2 bg-[#0F1629] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
        />
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 p-4 bg-[#0F1629] border border-[#2D3B5F] rounded-xl">
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-white">{forms.length}</div>
          <div className="text-xs text-[#64748B]">Total Forms</div>
        </div>
        <div className="w-px bg-[#2D3B5F]" />
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-emerald-400">{forms.filter(f => f.status === 'active').length}</div>
          <div className="text-xs text-[#64748B]">Active</div>
        </div>
        <div className="w-px bg-[#2D3B5F]" />
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-blue-400">{forms.filter(f => f.requires_signature).length}</div>
          <div className="text-xs text-[#64748B]">DocuSeal</div>
        </div>
        <div className="w-px bg-[#2D3B5F]" />
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-amber-400">{forms.reduce((sum, f) => sum + (f.submission_count || 0), 0)}</div>
          <div className="text-xs text-[#64748B]">Submissions</div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-[#0EA5E9] animate-spin" />
        </div>
      ) : (
        /* Category Sections */
        <div>
          {(Object.keys(CATEGORIES) as CategoryKey[]).map(categoryKey => (
            <CategorySection key={categoryKey} categoryKey={categoryKey} />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F1629] border border-[#2D3B5F] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2D3B5F] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit Form</h2>
              <button
                onClick={() => setEditingForm(null)}
                className="p-2 text-[#64748B] hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Form Name</label>
                <input
                  type="text"
                  value={editingForm.name}
                  onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Slug</label>
                <input
                  type="text"
                  value={editingForm.slug}
                  onChange={(e) => setEditingForm({ ...editingForm, slug: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Description</label>
                <textarea
                  value={editingForm.description}
                  onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Category</label>
                  <select
                    value={editingForm.category}
                    onChange={(e) => setEditingForm({ ...editingForm, category: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    {Object.entries(CATEGORIES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Status</label>
                  <select
                    value={editingForm.status}
                    onChange={(e) => setEditingForm({ ...editingForm, status: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">DocuSeal Template ID</label>
                <input
                  type="text"
                  value={editingForm.docuseal_template_id || ''}
                  onChange={(e) => setEditingForm({ ...editingForm, docuseal_template_id: e.target.value || null })}
                  placeholder="e.g. F88qMS4Hfd3gUA"
                  className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requires_signature"
                  checked={editingForm.requires_signature}
                  onChange={(e) => setEditingForm({ ...editingForm, requires_signature: e.target.checked })}
                  className="w-4 h-4 accent-[#0EA5E9]"
                />
                <label htmlFor="requires_signature" className="text-sm text-white">Requires Signature (DocuSeal)</label>
              </div>
            </div>
            <div className="p-6 border-t border-[#2D3B5F] flex justify-end gap-3">
              <button
                onClick={() => setEditingForm(null)}
                className="px-4 py-2 text-[#94A3B8] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/forms', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(editingForm),
                    })
                    if (res.ok) {
                      setForms(prev => prev.map(f => f.id === editingForm.id ? editingForm : f))
                      setEditingForm(null)
                    }
                  } catch (error) {
                    console.error('Error saving form:', error)
                  }
                }}
                className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
