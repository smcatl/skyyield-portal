'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { 
  ArrowLeft, Settings, Plus, Search, Filter, RefreshCw,
  User, Building2, Phone, Mail, MapPin, Calendar, Clock,
  CheckCircle, XCircle, AlertCircle, ChevronRight, 
  MoreVertical, Eye, Edit, Trash2, Send, ExternalLink
} from 'lucide-react'

interface LocationPartner {
  id: string
  stage: string
  contactFullName: string
  contactEmail: string
  contactPhone: string
  companyLegalName: string
  companyDBA?: string
  companyCity: string
  companyState: string
  initialReviewStatus: string
  postCallReviewStatus: string
  discoveryCallStatus: string
  trialDaysRemaining?: number
  createdAt: string
  updatedAt: string
  tags?: string[]
}

interface PipelineStats {
  total: number
  byStage: Record<string, number>
  pendingReview: number
  inTrial: number
  trialEndingSoon: number
  active: number
}

const STAGES = [
  { id: 'application', name: 'Application', color: 'border-blue-500', bgColor: 'bg-blue-500' },
  { id: 'initial_review', name: 'Initial Review', color: 'border-yellow-500', bgColor: 'bg-yellow-500' },
  { id: 'discovery_scheduled', name: 'Discovery', color: 'border-purple-500', bgColor: 'bg-purple-500' },
  { id: 'discovery_complete', name: 'Post-Call', color: 'border-yellow-500', bgColor: 'bg-yellow-500' },
  { id: 'venues_setup', name: 'Venues Setup', color: 'border-cyan-500', bgColor: 'bg-cyan-500' },
  { id: 'loi_sent', name: 'LOI Sent', color: 'border-orange-500', bgColor: 'bg-orange-500' },
  { id: 'loi_signed', name: 'LOI Signed', color: 'border-green-500', bgColor: 'bg-green-500' },
  { id: 'install_scheduled', name: 'Install', color: 'border-pink-500', bgColor: 'bg-pink-500' },
  { id: 'trial_active', name: 'Trial', color: 'border-indigo-500', bgColor: 'bg-indigo-500' },
  { id: 'trial_ending', name: 'Trial Ending', color: 'border-amber-500', bgColor: 'bg-amber-500' },
  { id: 'active', name: 'Active', color: 'border-green-500', bgColor: 'bg-green-500' },
]

export default function PipelinePage() {
  const { user, isLoaded } = useUser()
  const [partners, setPartners] = useState<LocationPartner[]>([])
  const [stats, setStats] = useState<PipelineStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPartner, setSelectedPartner] = useState<LocationPartner | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pipeline/partners')
      if (res.ok) {
        const data = await res.json()
        setPartners(data.partners || [])
        setStats(data.stats || null)
      }
    } catch (err) {
      console.error('Error fetching partners:', err)
    } finally {
      setLoading(false)
    }
  }

  const updatePartnerStage = async (partnerId: string, newStage: string) => {
    try {
      await fetch('/api/pipeline/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partnerId, stage: newStage }),
      })
      
      setPartners(prev => prev.map(p => 
        p.id === partnerId ? { ...p, stage: newStage } : p
      ))
    } catch (err) {
      console.error('Error updating stage:', err)
    }
  }

  const approvePartner = async (partnerId: string, type: 'initial' | 'postCall') => {
    const field = type === 'initial' ? 'initialReviewStatus' : 'postCallReviewStatus'
    const nextStage = type === 'initial' ? 'discovery_scheduled' : 'venues_setup'
    
    try {
      await fetch('/api/pipeline/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: partnerId, 
          [field]: 'approved',
          stage: nextStage,
        }),
      })
      
      setPartners(prev => prev.map(p => 
        p.id === partnerId ? { ...p, [field]: 'approved', stage: nextStage } : p
      ))
    } catch (err) {
      console.error('Error approving:', err)
    }
  }

  const denyPartner = async (partnerId: string, type: 'initial' | 'postCall') => {
    const field = type === 'initial' ? 'initialReviewStatus' : 'postCallReviewStatus'
    
    try {
      await fetch('/api/pipeline/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: partnerId, 
          [field]: 'denied',
          stage: 'inactive',
        }),
      })
      
      setPartners(prev => prev.map(p => 
        p.id === partnerId ? { ...p, [field]: 'denied', stage: 'inactive' } : p
      ))
    } catch (err) {
      console.error('Error denying:', err)
    }
  }

  const getPartnersForStage = (stageId: string) => {
    return partners.filter(p => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          p.contactFullName.toLowerCase().includes(query) ||
          p.companyLegalName.toLowerCase().includes(query) ||
          p.contactEmail.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      return p.stage === stageId
    })
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20">
      {/* Header */}
      <div className="px-4 pb-4 border-b border-[#2D3B5F]">
        <div className="max-w-full mx-auto">
          <Link 
            href="/portals/admin"
            className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Portal
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Location Partner <span className="text-green-400">Pipeline</span>
              </h1>
              <p className="text-[#94A3B8] mt-1">
                {stats?.total || 0} partners • {stats?.pendingReview || 0} pending review • {stats?.inTrial || 0} in trial
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="/admin/pipeline/settings"
                className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F] transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Partner
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
            <button
              onClick={fetchPartners}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 p-4 min-w-max">
          {STAGES.map(stage => {
            const stagePartners = getPartnersForStage(stage.id)
            
            return (
              <div 
                key={stage.id} 
                className={`w-80 shrink-0 bg-[#1A1F3A]/50 rounded-xl border-t-4 ${stage.color}`}
              >
                {/* Stage Header */}
                <div className="p-4 border-b border-[#2D3B5F]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">{stage.name}</h3>
                    <span className={`w-6 h-6 rounded-full ${stage.bgColor} text-white text-xs flex items-center justify-center font-medium`}>
                      {stagePartners.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {stagePartners.length === 0 ? (
                    <div className="text-center py-8 text-[#64748B] text-sm">
                      No partners
                    </div>
                  ) : (
                    stagePartners.map(partner => (
                      <div
                        key={partner.id}
                        className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg p-3 cursor-pointer hover:border-[#0EA5E9]/50 transition-colors"
                        onClick={() => setSelectedPartner(partner)}
                      >
                        {/* Partner Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-white font-medium text-sm">
                              {partner.companyDBA || partner.companyLegalName}
                            </h4>
                            <p className="text-[#64748B] text-xs">{partner.contactFullName}</p>
                          </div>
                          <button className="p-1 text-[#64748B] hover:text-white rounded">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2 text-[#64748B]">
                            <MapPin className="w-3 h-3" />
                            <span>{partner.companyCity}, {partner.companyState}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {partner.tags && partner.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {partner.tags.map(tag => (
                              <span 
                                key={tag} 
                                className="px-2 py-0.5 bg-[#2D3B5F] text-[#94A3B8] rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Trial countdown */}
                        {stage.id === 'trial_active' && partner.trialDaysRemaining !== undefined && (
                          <div className={`mt-2 text-xs ${
                            partner.trialDaysRemaining <= 10 ? 'text-red-400' : 'text-[#94A3B8]'
                          }`}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {partner.trialDaysRemaining} days remaining
                          </div>
                        )}

                        {/* Review Actions */}
                        {(stage.id === 'initial_review' || stage.id === 'discovery_complete') && (
                          <div className="flex gap-2 mt-3 pt-2 border-t border-[#2D3B5F]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                approvePartner(partner.id, stage.id === 'initial_review' ? 'initial' : 'postCall')
                              }}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                denyPartner(partner.id, stage.id === 'initial_review' ? 'initial' : 'postCall')
                              }}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-red-500 text-red-400 rounded text-xs hover:bg-red-500/20"
                            >
                              <XCircle className="w-3 h-3" />
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}

          {/* Inactive Column */}
          <div className="w-80 shrink-0 bg-[#1A1F3A]/30 rounded-xl border-t-4 border-gray-500">
            <div className="p-4 border-b border-[#2D3B5F]">
              <div className="flex items-center justify-between">
                <h3 className="text-[#94A3B8] font-medium">Inactive</h3>
                <span className="w-6 h-6 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center font-medium">
                  {partners.filter(p => p.stage === 'inactive').length}
                </span>
              </div>
            </div>
            <div className="p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
              {partners.filter(p => p.stage === 'inactive').map(partner => (
                <div
                  key={partner.id}
                  className="bg-[#0A0F2C]/50 border border-[#2D3B5F] rounded-lg p-3 opacity-60"
                >
                  <h4 className="text-[#94A3B8] font-medium text-sm">
                    {partner.companyDBA || partner.companyLegalName}
                  </h4>
                  <p className="text-[#64748B] text-xs">{partner.contactFullName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Partner Detail Sidebar */}
      {selectedPartner && (
        <div className="fixed inset-y-0 right-0 w-96 bg-[#0A0F2C] border-l border-[#2D3B5F] shadow-2xl z-50 overflow-y-auto">
          <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between">
            <h2 className="text-white font-semibold">Partner Details</h2>
            <button
              onClick={() => setSelectedPartner(null)}
              className="p-2 text-[#64748B] hover:text-white rounded"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {selectedPartner.companyDBA || selectedPartner.companyLegalName}
              </h3>
              {selectedPartner.companyDBA && (
                <p className="text-[#64748B] text-sm">{selectedPartner.companyLegalName}</p>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-[#94A3B8] text-sm font-medium uppercase tracking-wide">Contact</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-[#64748B]" />
                  <span className="text-white">{selectedPartner.contactFullName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-[#64748B]" />
                  <a href={`mailto:${selectedPartner.contactEmail}`} className="text-[#0EA5E9] hover:underline">
                    {selectedPartner.contactEmail}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-[#64748B]" />
                  <span className="text-white">{selectedPartner.contactPhone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-[#64748B]" />
                  <span className="text-white">{selectedPartner.companyCity}, {selectedPartner.companyState}</span>
                </div>
              </div>
            </div>

            {/* Stage Info */}
            <div className="space-y-3">
              <h4 className="text-[#94A3B8] text-sm font-medium uppercase tracking-wide">Pipeline Stage</h4>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  STAGES.find(s => s.id === selectedPartner.stage)?.bgColor || 'bg-gray-500'
                }`} />
                <span className="text-white">
                  {STAGES.find(s => s.id === selectedPartner.stage)?.name || selectedPartner.stage}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Link
                href={`/admin/pipeline/partners/${selectedPartner.id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
              >
                <Eye className="w-4 h-4" />
                View Full Profile
              </Link>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F]">
                <Send className="w-4 h-4" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}