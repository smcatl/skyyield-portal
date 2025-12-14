'use client'

import { useState, useEffect } from 'react'
import {
  Search, Plus, Filter, MoreVertical, Mail, Phone, Calendar,
  Send, ChevronDown, ChevronRight, User, Building2, MapPin,
  Clock, CheckCircle, XCircle, ArrowRight, MessageSquare,
  FileText, Trash2, Edit, Eye, RefreshCw, Users, Target,
  TrendingUp, AlertCircle, Star, Archive
} from 'lucide-react'

// Types
export type ProspectType = 'location_partner' | 'referral_partner' | 'channel_partner' | 'relationship_partner' | 'contractor'
export type ProspectStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiating' | 'won' | 'lost' | 'archived'

export interface ProspectActivity {
  id: string
  type: 'email' | 'call' | 'meeting' | 'note' | 'status_change' | 'form_sent'
  description: string
  created_at: string
  created_by: string
  metadata?: Record<string, any>
}

export interface Prospect {
  id: string
  prospect_type: ProspectType
  status: ProspectStatus
  
  // Contact info
  first_name: string
  last_name: string
  email: string
  phone?: string
  title?: string
  
  // Company info
  company_name?: string
  company_type?: string
  city?: string
  state?: string
  
  // Lead info
  source?: string
  source_detail?: string
  estimated_value?: number
  probability?: number
  
  // Assignment
  assigned_to?: string
  
  // Tracking
  last_contact_date?: string
  next_follow_up_date?: string
  follow_up_count: number
  
  // Notes
  notes?: string
  tags?: string[]
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Activity (populated separately)
  activities?: ProspectActivity[]
}

// Constants
const PROSPECT_TYPES: { value: ProspectType; label: string; color: string }[] = [
  { value: 'location_partner', label: 'Location Partner', color: 'bg-green-500/20 text-green-400' },
  { value: 'referral_partner', label: 'Referral Partner', color: 'bg-cyan-500/20 text-cyan-400' },
  { value: 'channel_partner', label: 'Channel Partner', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'relationship_partner', label: 'Relationship Partner', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'contractor', label: 'Contractor', color: 'bg-yellow-500/20 text-yellow-400' },
]

const PROSPECT_STATUSES: { value: ProspectStatus; label: string; color: string; icon: any }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Star },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Phone },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Target },
  { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: FileText },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: MessageSquare },
  { value: 'won', label: 'Won', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  { value: 'lost', label: 'Lost', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  { value: 'archived', label: 'Archived', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Archive },
]

const LEAD_SOURCES = [
  'Website', 'Referral', 'LinkedIn', 'Cold Call', 'Trade Show', 
  'Partner', 'Google Ads', 'Social Media', 'Email Campaign', 'Other'
]

export default function CRMTab() {
  // State
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<ProspectType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  
  // Form state for new prospect
  const [newProspect, setNewProspect] = useState<Partial<Prospect>>({
    prospect_type: 'location_partner',
    status: 'new',
    first_name: '',
    last_name: '',
    email: '',
    follow_up_count: 0,
  })

  // Fetch prospects
  const fetchProspects = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)
      
      const res = await fetch(`/api/crm/prospects?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProspects(data.prospects || [])
      }
    } catch (err) {
      console.error('Error fetching prospects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProspects()
  }, [typeFilter, statusFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProspects()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Create prospect
  const createProspect = async () => {
    try {
      const res = await fetch('/api/crm/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProspect),
      })
      if (res.ok) {
        setShowAddModal(false)
        setNewProspect({
          prospect_type: 'location_partner',
          status: 'new',
          first_name: '',
          last_name: '',
          email: '',
          follow_up_count: 0,
        })
        fetchProspects()
      }
    } catch (err) {
      console.error('Error creating prospect:', err)
    }
  }

  // Update prospect status
  const updateProspectStatus = async (prospectId: string, newStatus: ProspectStatus) => {
    try {
      const res = await fetch(`/api/crm/prospects/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchProspects()
        if (selectedProspect?.id === prospectId) {
          setSelectedProspect({ ...selectedProspect, status: newStatus })
        }
      }
    } catch (err) {
      console.error('Error updating prospect:', err)
    }
  }

  // Send invite form
  const sendInviteForm = async (prospect: Prospect) => {
    try {
      const res = await fetch(`/api/crm/prospects/${prospect.id}/invite`, {
        method: 'POST',
      })
      if (res.ok) {
        alert(`Invite form sent to ${prospect.email}`)
        fetchProspects()
      }
    } catch (err) {
      console.error('Error sending invite:', err)
    }
  }

  // Convert to pipeline
  const convertToPipeline = async (prospect: Prospect) => {
    try {
      const res = await fetch(`/api/crm/prospects/${prospect.id}/convert`, {
        method: 'POST',
      })
      if (res.ok) {
        alert(`${prospect.first_name} ${prospect.last_name} converted to ${prospect.prospect_type.replace('_', ' ')}!`)
        updateProspectStatus(prospect.id, 'won')
      }
    } catch (err) {
      console.error('Error converting prospect:', err)
    }
  }

  // Log activity
  const logActivity = async (prospectId: string, type: string, description: string) => {
    try {
      await fetch(`/api/crm/prospects/${prospectId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description }),
      })
      fetchProspects()
    } catch (err) {
      console.error('Error logging activity:', err)
    }
  }

  // Stats
  const stats = {
    total: prospects.length,
    new: prospects.filter(p => p.status === 'new').length,
    contacted: prospects.filter(p => p.status === 'contacted').length,
    qualified: prospects.filter(p => p.status === 'qualified').length,
    won: prospects.filter(p => p.status === 'won').length,
    lost: prospects.filter(p => p.status === 'lost').length,
  }

  // Filter prospects for display
  const filteredProspects = prospects.filter(p => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      return (
        p.first_name?.toLowerCase().includes(search) ||
        p.last_name?.toLowerCase().includes(search) ||
        p.email?.toLowerCase().includes(search) ||
        p.company_name?.toLowerCase().includes(search)
      )
    }
    return true
  })

  // Group by status for kanban view
  const prospectsByStatus = PROSPECT_STATUSES.reduce((acc, status) => {
    acc[status.value] = filteredProspects.filter(p => p.status === status.value)
    return acc
  }, {} as Record<ProspectStatus, Prospect[]>)

  const getTypeColor = (type: ProspectType) => {
    return PROSPECT_TYPES.find(t => t.value === type)?.color || 'bg-gray-500/20 text-gray-400'
  }

  const getStatusInfo = (status: ProspectStatus) => {
    return PROSPECT_STATUSES.find(s => s.value === status) || PROSPECT_STATUSES[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">CRM - Prospects</h2>
          <p className="text-[#64748B]">Manage leads before they enter the pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
            className="px-4 py-2 bg-[#1A1F3A] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F] transition-colors"
          >
            {viewMode === 'list' ? 'Kanban View' : 'List View'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Prospect
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-[#64748B] text-sm">Total</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-blue-400 text-sm">New</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.new}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-yellow-400 text-sm">Contacted</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.contacted}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-purple-400 text-sm">Qualified</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.qualified}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-green-400 text-sm">Won</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.won}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-red-400 text-sm">Lost</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.lost}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search prospects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ProspectType | 'all')}
          className="px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">All Types</option>
          {PROSPECT_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProspectStatus | 'all')}
          className="px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">All Statuses</option>
          {PROSPECT_STATUSES.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        <button
          onClick={fetchProspects}
          className="p-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-[#64748B] hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3B5F]">
                <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Contact</th>
                <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Company</th>
                <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Type</th>
                <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Source</th>
                <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Last Contact</th>
                <th className="text-right px-4 py-3 text-[#64748B] text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#64748B]">
                    Loading prospects...
                  </td>
                </tr>
              ) : filteredProspects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#64748B]">
                    No prospects found. Add your first prospect to get started.
                  </td>
                </tr>
              ) : (
                filteredProspects.map(prospect => {
                  const statusInfo = getStatusInfo(prospect.status)
                  return (
                    <tr 
                      key={prospect.id} 
                      className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50 cursor-pointer"
                      onClick={() => { setSelectedProspect(prospect); setShowDetailModal(true) }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">
                          {prospect.first_name} {prospect.last_name}
                        </div>
                        <div className="text-sm text-[#64748B]">{prospect.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white">{prospect.company_name || '-'}</div>
                        {prospect.city && (
                          <div className="text-sm text-[#64748B]">{prospect.city}, {prospect.state}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(prospect.prospect_type)}`}>
                          {PROSPECT_TYPES.find(t => t.value === prospect.prospect_type)?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8]">
                        {prospect.source || '-'}
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8]">
                        {prospect.last_contact_date 
                          ? new Date(prospect.last_contact_date).toLocaleDateString() 
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => sendInviteForm(prospect)}
                            className="p-1.5 text-[#0EA5E9] hover:bg-[#0EA5E9]/20 rounded transition-colors"
                            title="Send Invite Form"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          {prospect.status === 'qualified' && (
                            <button
                              onClick={() => convertToPipeline(prospect)}
                              className="p-1.5 text-green-400 hover:bg-green-500/20 rounded transition-colors"
                              title="Convert to Pipeline"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedProspect(prospect); setShowDetailModal(true) }}
                            className="p-1.5 text-[#64748B] hover:bg-[#2D3B5F] rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PROSPECT_STATUSES.filter(s => s.value !== 'archived').map(status => (
            <div key={status.value} className="flex-shrink-0 w-72">
              <div className={`rounded-t-xl px-4 py-2 ${status.color} border-b-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <status.icon className="w-4 h-4" />
                    <span className="font-medium">{status.label}</span>
                  </div>
                  <span className="text-sm opacity-70">{prospectsByStatus[status.value]?.length || 0}</span>
                </div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] border-t-0 rounded-b-xl p-2 min-h-[400px] space-y-2">
                {prospectsByStatus[status.value]?.map(prospect => (
                  <div
                    key={prospect.id}
                    onClick={() => { setSelectedProspect(prospect); setShowDetailModal(true) }}
                    className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg p-3 cursor-pointer hover:border-[#0EA5E9] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-white text-sm">
                        {prospect.first_name} {prospect.last_name}
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${getTypeColor(prospect.prospect_type)}`}>
                        {prospect.prospect_type.split('_')[0]}
                      </span>
                    </div>
                    {prospect.company_name && (
                      <div className="text-xs text-[#64748B] mb-1 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {prospect.company_name}
                      </div>
                    )}
                    <div className="text-xs text-[#64748B] flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {prospect.email}
                    </div>
                    {prospect.source && (
                      <div className="mt-2 text-xs text-[#64748B]">
                        Source: {prospect.source}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Prospect Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2D3B5F]">
              <h2 className="text-xl font-semibold text-white">Add New Prospect</h2>
              <p className="text-[#64748B] text-sm">Enter prospect information</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Prospect Type */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-1">Prospect Type *</label>
                <select
                  value={newProspect.prospect_type}
                  onChange={(e) => setNewProspect({ ...newProspect, prospect_type: e.target.value as ProspectType })}
                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                >
                  {PROSPECT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">First Name *</label>
                  <input
                    type="text"
                    value={newProspect.first_name || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={newProspect.last_name || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Email *</label>
                  <input
                    type="email"
                    value={newProspect.email || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newProspect.phone || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-1">Company Name</label>
                <input
                  type="text"
                  value={newProspect.company_name || ''}
                  onChange={(e) => setNewProspect({ ...newProspect, company_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">City</label>
                  <input
                    type="text"
                    value={newProspect.city || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, city: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">State</label>
                  <input
                    type="text"
                    value={newProspect.state || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, state: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-1">Lead Source</label>
                <select
                  value={newProspect.source || ''}
                  onChange={(e) => setNewProspect({ ...newProspect, source: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="">Select source...</option>
                  {LEAD_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-1">Notes</label>
                <textarea
                  value={newProspect.notes || ''}
                  onChange={(e) => setNewProspect({ ...newProspect, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[#2D3B5F] flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProspect}
                disabled={!newProspect.first_name || !newProspect.last_name || !newProspect.email}
                className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Prospect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prospect Detail Modal */}
      {showDetailModal && selectedProspect && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2D3B5F] flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {selectedProspect.first_name} {selectedProspect.last_name}
                </h2>
                <p className="text-[#64748B]">{selectedProspect.company_name || 'No company'}</p>
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedProspect(null) }}
                className="p-2 text-[#64748B] hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Type */}
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedProspect.prospect_type)}`}>
                  {PROSPECT_TYPES.find(t => t.value === selectedProspect.prospect_type)?.label}
                </span>
                <select
                  value={selectedProspect.status}
                  onChange={(e) => updateProspectStatus(selectedProspect.id, e.target.value as ProspectStatus)}
                  className="px-3 py-1 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                >
                  {PROSPECT_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="text-[#64748B] text-sm mb-1">Email</div>
                  <div className="text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#0EA5E9]" />
                    {selectedProspect.email}
                  </div>
                </div>
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="text-[#64748B] text-sm mb-1">Phone</div>
                  <div className="text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#0EA5E9]" />
                    {selectedProspect.phone || 'Not provided'}
                  </div>
                </div>
                {selectedProspect.city && (
                  <div className="bg-[#0A0F2C] rounded-lg p-4">
                    <div className="text-[#64748B] text-sm mb-1">Location</div>
                    <div className="text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0EA5E9]" />
                      {selectedProspect.city}, {selectedProspect.state}
                    </div>
                  </div>
                )}
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="text-[#64748B] text-sm mb-1">Source</div>
                  <div className="text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#0EA5E9]" />
                    {selectedProspect.source || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedProspect.notes && (
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="text-[#64748B] text-sm mb-2">Notes</div>
                  <div className="text-white text-sm">{selectedProspect.notes}</div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => sendInviteForm(selectedProspect)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Send Invite Form
                </button>
                <button
                  onClick={() => logActivity(selectedProspect.id, 'email', 'Sent follow-up email')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Log Email
                </button>
                <button
                  onClick={() => logActivity(selectedProspect.id, 'call', 'Made phone call')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Log Call
                </button>
                <button
                  onClick={() => window.open('https://calendly.com/scohen-skyyield', '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Call
                </button>
                {selectedProspect.status === 'qualified' && (
                  <button
                    onClick={() => convertToPipeline(selectedProspect)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Convert to Pipeline
                  </button>
                )}
              </div>

              {/* Activity Timeline */}
              <div>
                <h3 className="text-white font-medium mb-3">Activity</h3>
                <div className="space-y-3">
                  {selectedProspect.activities && selectedProspect.activities.length > 0 ? (
                    selectedProspect.activities.map(activity => (
                      <div key={activity.id} className="flex items-start gap-3 bg-[#0A0F2C] rounded-lg p-3">
                        <div className="w-8 h-8 rounded-full bg-[#2D3B5F] flex items-center justify-center">
                          {activity.type === 'email' && <Mail className="w-4 h-4 text-[#0EA5E9]" />}
                          {activity.type === 'call' && <Phone className="w-4 h-4 text-green-400" />}
                          {activity.type === 'meeting' && <Calendar className="w-4 h-4 text-purple-400" />}
                          {activity.type === 'note' && <FileText className="w-4 h-4 text-yellow-400" />}
                          {activity.type === 'status_change' && <RefreshCw className="w-4 h-4 text-orange-400" />}
                          {activity.type === 'form_sent' && <Send className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm">{activity.description}</div>
                          <div className="text-[#64748B] text-xs mt-1">
                            {new Date(activity.created_at).toLocaleString()} • {activity.created_by}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#64748B] text-sm bg-[#0A0F2C] rounded-lg p-4 text-center">
                      No activity recorded yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
