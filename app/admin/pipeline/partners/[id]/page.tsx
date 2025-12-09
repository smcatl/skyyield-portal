'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Building2, User, Phone, Mail, MapPin, Globe,
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, 
  Send, Edit, Trash2, Plus, ExternalLink, FileText,
  Wifi, Router, ChevronDown, ChevronRight, MoreVertical,
  DollarSign, TrendingUp, Activity, Settings, Copy, Check
} from 'lucide-react'

interface LocationPartner {
  id: string
  stage: string
  stageEnteredAt: string
  createdAt: string
  updatedAt: string
  
  initialReviewStatus: string
  initialReviewedAt?: string
  initialReviewNotes?: string
  postCallReviewStatus: string
  
  discoveryCallStatus: string
  discoveryCallScheduledAt?: string
  technicalCallStatus: string
  installCallStatus: string
  trialReviewCallStatus: string
  
  loiStatus: string
  loiSignedAt?: string
  contractStatus: string
  
  trialStartDate?: string
  trialEndDate?: string
  trialDaysRemaining?: number
  
  tipaltiInviteSent: boolean
  tipaltiSignupComplete: boolean
  portalInviteSent: boolean
  portalActivated: boolean
  
  contactFullName: string
  contactPreferredName?: string
  contactTitle?: string
  contactPhone: string
  contactEmail: string
  
  companyLegalName: string
  companyDBA?: string
  companyIndustry?: string
  companyAddress1: string
  companyAddress2?: string
  companyCity: string
  companyState: string
  companyZip: string
  companyCountry: string
  
  linkedInProfile?: string
  howDidYouHear?: string
  numberOfLocations?: number
  currentInternetProvider?: string
  
  source: string
  tags?: string[]
  notes?: string
}

interface Venue {
  id: string
  name: string
  type: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  isp: string
  connectionType: string
  internetSpeed: string
  isActive: boolean
  deviceCount?: number
}

interface Device {
  id: string
  venueId: string
  name: string
  model: string
  macAddress: string
  serialNumber: string
  placement: string
  isActive: boolean
}

interface ActivityLog {
  id: string
  action: string
  description: string
  performedBy: string
  performedAt: string
}

const STAGES = [
  { id: 'application', name: 'Application', step: 1 },
  { id: 'initial_review', name: 'Initial Review', step: 2 },
  { id: 'discovery_scheduled', name: 'Discovery Call', step: 3 },
  { id: 'discovery_complete', name: 'Post-Call Review', step: 4 },
  { id: 'venues_setup', name: 'Venues Setup', step: 5 },
  { id: 'loi_sent', name: 'LOI Sent', step: 6 },
  { id: 'loi_signed', name: 'LOI Signed', step: 7 },
  { id: 'install_scheduled', name: 'Install Scheduled', step: 8 },
  { id: 'trial_active', name: 'Trial Active', step: 9 },
  { id: 'trial_ending', name: 'Trial Ending', step: 10 },
  { id: 'contract_decision', name: 'Contract Decision', step: 11 },
  { id: 'active', name: 'Active Client', step: 12 },
]

export default function PartnerDetailPage() {
  const { user, isLoaded } = useUser()
  const params = useParams()
  const partnerId = params.id as string
  
  const [partner, setPartner] = useState<LocationPartner | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'venues' | 'documents' | 'activity'>('overview')
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (partnerId) {
      fetchPartnerData()
    }
  }, [partnerId])

  const fetchPartnerData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pipeline/partners?id=${partnerId}&includeVenues=true&includeDevices=true`)
      if (res.ok) {
        const data = await res.json()
        setPartner(data.partner)
        setVenues(data.venues || [])
        setDevices(data.devices || [])
        setActivityLog(data.activityLog || [])
      }
    } catch (err) {
      console.error('Error fetching partner:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStage = async (newStage: string) => {
    if (!partner) return
    try {
      await fetch('/api/pipeline/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partner.id, stage: newStage }),
      })
      setPartner(prev => prev ? { ...prev, stage: newStage } : null)
    } catch (err) {
      console.error('Error updating stage:', err)
    }
  }

  const approvePartner = async (type: 'initial' | 'postCall') => {
    if (!partner) return
    const field = type === 'initial' ? 'initialReviewStatus' : 'postCallReviewStatus'
    const nextStage = type === 'initial' ? 'discovery_scheduled' : 'venues_setup'
    
    try {
      await fetch('/api/pipeline/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partner.id, [field]: 'approved', stage: nextStage }),
      })
      setPartner(prev => prev ? { ...prev, [field]: 'approved', stage: nextStage } : null)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const denyPartner = async (type: 'initial' | 'postCall') => {
    if (!partner) return
    const field = type === 'initial' ? 'initialReviewStatus' : 'postCallReviewStatus'
    
    try {
      await fetch('/api/pipeline/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partner.id, [field]: 'denied', stage: 'inactive' }),
      })
      setPartner(prev => prev ? { ...prev, [field]: 'denied', stage: 'inactive' } : null)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const sendTipaltiInvite = async () => {
    if (!partner) return
    // TODO: Integrate with Tipalti API
    try {
      await fetch('/api/pipeline/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partner.id, tipaltiInviteSent: true, tipaltiInviteSentAt: new Date().toISOString() }),
      })
      setPartner(prev => prev ? { ...prev, tipaltiInviteSent: true } : null)
      alert('Tipalti invite sent!')
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const sendPortalInvite = async () => {
    if (!partner) return
    // TODO: Create Clerk user and send invite
    try {
      await fetch('/api/pipeline/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partner.id, portalInviteSent: true, portalInviteSentAt: new Date().toISOString() }),
      })
      setPartner(prev => prev ? { ...prev, portalInviteSent: true } : null)
      alert('Portal invite sent!')
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const copyId = () => {
    if (partner) {
      navigator.clipboard.writeText(partner.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getDevicesForVenue = (venueId: string) => devices.filter(d => d.venueId === venueId)
  
  const getCurrentStep = () => {
    const stage = STAGES.find(s => s.id === partner?.stage)
    return stage?.step || 0
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    })
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    })
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20 px-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Partner Not Found</h1>
          <p className="text-[#94A3B8] mb-6">The partner you're looking for doesn't exist.</p>
          <Link href="/admin/pipeline" className="text-[#0EA5E9] hover:underline">
            ← Back to Pipeline
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20 pb-12">
      {/* Header */}
      <div className="px-4 pb-4 border-b border-[#2D3B5F]">
        <div className="max-w-7xl mx-auto">
          <Link 
            href="/admin/pipeline"
            className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pipeline
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-white">
                  {partner.companyDBA || partner.companyLegalName}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  partner.stage === 'active' ? 'bg-green-500/20 text-green-400' :
                  partner.stage === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {STAGES.find(s => s.id === partner.stage)?.name || partner.stage}
                </span>
              </div>
              {partner.companyDBA && (
                <p className="text-[#94A3B8]">{partner.companyLegalName}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-[#64748B]">
                <button onClick={copyId} className="flex items-center gap-1 hover:text-white">
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {partner.id.slice(0, 12)}...
                </button>
                <span>Created {formatDate(partner.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F]">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">
                <Send className="w-4 h-4" />
                Send Email
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#94A3B8]">Onboarding Progress</span>
              <span className="text-sm text-white font-medium">Step {getCurrentStep()} of 12</span>
            </div>
            <div className="h-2 bg-[#1A1F3A] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#0EA5E9] to-green-500 transition-all duration-500"
                style={{ width: `${(getCurrentStep() / 12) * 100}%` }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'venues', label: `Venues (${venues.length})` },
              { id: 'documents', label: 'Documents' },
              { id: 'activity', label: 'Activity Log' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#0EA5E9] text-white'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#0EA5E9]" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#64748B] text-sm">Full Name</label>
                    <p className="text-white">{partner.contactFullName}</p>
                  </div>
                  {partner.contactPreferredName && (
                    <div>
                      <label className="text-[#64748B] text-sm">Preferred Name</label>
                      <p className="text-white">{partner.contactPreferredName}</p>
                    </div>
                  )}
                  {partner.contactTitle && (
                    <div>
                      <label className="text-[#64748B] text-sm">Title</label>
                      <p className="text-white">{partner.contactTitle}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-[#64748B] text-sm">Email</label>
                    <p className="text-[#0EA5E9]">
                      <a href={`mailto:${partner.contactEmail}`} className="hover:underline">
                        {partner.contactEmail}
                      </a>
                    </p>
                  </div>
                  <div>
                    <label className="text-[#64748B] text-sm">Phone</label>
                    <p className="text-white">{partner.contactPhone}</p>
                  </div>
                  {partner.linkedInProfile && (
                    <div>
                      <label className="text-[#64748B] text-sm">LinkedIn</label>
                      <p className="text-[#0EA5E9]">
                        <a href={`https://${partner.linkedInProfile}`} target="_blank" className="hover:underline flex items-center gap-1">
                          {partner.linkedInProfile} <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0EA5E9]" />
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#64748B] text-sm">Legal Name</label>
                    <p className="text-white">{partner.companyLegalName}</p>
                  </div>
                  {partner.companyDBA && (
                    <div>
                      <label className="text-[#64748B] text-sm">DBA</label>
                      <p className="text-white">{partner.companyDBA}</p>
                    </div>
                  )}
                  {partner.companyIndustry && (
                    <div>
                      <label className="text-[#64748B] text-sm">Industry</label>
                      <p className="text-white capitalize">{partner.companyIndustry.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="text-[#64748B] text-sm">Address</label>
                    <p className="text-white">
                      {partner.companyAddress1}
                      {partner.companyAddress2 && <>, {partner.companyAddress2}</>}
                      <br />
                      {partner.companyCity}, {partner.companyState} {partner.companyZip}
                    </p>
                  </div>
                  {partner.numberOfLocations && (
                    <div>
                      <label className="text-[#64748B] text-sm">Number of Locations</label>
                      <p className="text-white">{partner.numberOfLocations}</p>
                    </div>
                  )}
                  {partner.currentInternetProvider && (
                    <div>
                      <label className="text-[#64748B] text-sm">Current ISP</label>
                      <p className="text-white capitalize">{partner.currentInternetProvider.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {partner.howDidYouHear && (
                    <div>
                      <label className="text-[#64748B] text-sm">How They Heard About Us</label>
                      <p className="text-white capitalize">{partner.howDidYouHear.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-[#64748B] text-sm">Source</label>
                    <p className="text-white capitalize">{partner.source}</p>
                  </div>
                </div>
              </div>

              {/* Trial Information (if applicable) */}
              {(partner.stage === 'trial_active' || partner.stage === 'trial_ending') && (
                <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#0EA5E9]" />
                    Trial Period
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[#64748B] text-sm">Start Date</label>
                      <p className="text-white">{formatDate(partner.trialStartDate)}</p>
                    </div>
                    <div>
                      <label className="text-[#64748B] text-sm">End Date</label>
                      <p className="text-white">{formatDate(partner.trialEndDate)}</p>
                    </div>
                    <div>
                      <label className="text-[#64748B] text-sm">Days Remaining</label>
                      <p className={`text-2xl font-bold ${
                        (partner.trialDaysRemaining || 0) <= 10 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {partner.trialDaysRemaining}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Actions & Status */}
            <div className="space-y-6">
              {/* Quick Actions */}
              {(partner.stage === 'initial_review' || partner.stage === 'discovery_complete') && (
                <div className="bg-[#1A1F3A] border border-yellow-500/50 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    Pending Review
                  </h3>
                  <p className="text-[#94A3B8] text-sm mb-4">
                    {partner.stage === 'initial_review' 
                      ? 'Review application and approve or deny this partner.'
                      : 'Review post-call notes and approve or deny to continue.'}
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => approvePartner(partner.stage === 'initial_review' ? 'initial' : 'postCall')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve & Send Calendly
                    </button>
                    <button
                      onClick={() => denyPartner(partner.stage === 'initial_review' ? 'initial' : 'postCall')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/20"
                    >
                      <XCircle className="w-4 h-4" />
                      Deny Application
                    </button>
                  </div>
                </div>
              )}

              {/* Stage Actions */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#0EA5E9]" />
                  Stage Actions
                </h3>
                <div className="space-y-2">
                  <select
                    value={partner.stage}
                    onChange={(e) => updateStage(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    {STAGES.map(stage => (
                      <option key={stage.id} value={stage.id}>{stage.name}</option>
                    ))}
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Invites Status */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#0EA5E9]" />
                  Invites
                </h3>
                <div className="space-y-4">
                  {/* Tipalti */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Tipalti</p>
                      <p className="text-[#64748B] text-xs">
                        {partner.tipaltiSignupComplete ? 'Signed up' : 
                         partner.tipaltiInviteSent ? 'Invite sent' : 'Not sent'}
                      </p>
                    </div>
                    {partner.tipaltiSignupComplete ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <button
                        onClick={sendTipaltiInvite}
                        disabled={partner.tipaltiInviteSent}
                        className="px-3 py-1 text-xs bg-[#0EA5E9] text-white rounded hover:bg-[#0EA5E9]/80 disabled:opacity-50"
                      >
                        {partner.tipaltiInviteSent ? 'Sent' : 'Send'}
                      </button>
                    )}
                  </div>

                  {/* Portal */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Partner Portal</p>
                      <p className="text-[#64748B] text-xs">
                        {partner.portalActivated ? 'Activated' : 
                         partner.portalInviteSent ? 'Invite sent' : 'Not sent'}
                      </p>
                    </div>
                    {partner.portalActivated ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <button
                        onClick={sendPortalInvite}
                        disabled={partner.portalInviteSent}
                        className="px-3 py-1 text-xs bg-[#0EA5E9] text-white rounded hover:bg-[#0EA5E9]/80 disabled:opacity-50"
                      >
                        {partner.portalInviteSent ? 'Sent' : 'Send'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {partner.tags && partner.tags.length > 0 && (
                <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {partner.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-[#2D3B5F] text-[#94A3B8] rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Venues Tab */}
        {activeTab === 'venues' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Venues & Devices</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">
                <Plus className="w-4 h-4" />
                Add Venue
              </button>
            </div>

            {venues.length === 0 ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-[#64748B] opacity-50" />
                <h3 className="text-white font-medium mb-2">No Venues Yet</h3>
                <p className="text-[#64748B] text-sm mb-4">Add venues to track devices and locations.</p>
                <button className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">
                  Add First Venue
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {venues.map(venue => (
                  <div key={venue.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedVenue(expandedVenue === venue.id ? null : venue.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[#2D3B5F]/30"
                    >
                      <div className="flex items-center gap-4">
                        {expandedVenue === venue.id ? 
                          <ChevronDown className="w-5 h-5 text-[#64748B]" /> : 
                          <ChevronRight className="w-5 h-5 text-[#64748B]" />
                        }
                        <div className="text-left">
                          <h3 className="text-white font-medium">{venue.name}</h3>
                          <p className="text-[#64748B] text-sm">
                            {venue.city}, {venue.state} • {venue.type} • {getDevicesForVenue(venue.id).length} devices
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        venue.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {venue.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>

                    {expandedVenue === venue.id && (
                      <div className="border-t border-[#2D3B5F] p-4">
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <label className="text-[#64748B] text-xs">Address</label>
                            <p className="text-white text-sm">{venue.address}</p>
                          </div>
                          <div>
                            <label className="text-[#64748B] text-xs">ISP</label>
                            <p className="text-white text-sm capitalize">{venue.isp?.replace(/_/g, ' ')}</p>
                          </div>
                          <div>
                            <label className="text-[#64748B] text-xs">Connection</label>
                            <p className="text-white text-sm capitalize">{venue.connectionType}</p>
                          </div>
                          <div>
                            <label className="text-[#64748B] text-xs">Speed</label>
                            <p className="text-white text-sm">{venue.internetSpeed?.replace(/_/g, ' ')}</p>
                          </div>
                        </div>

                        {/* Devices */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[#94A3B8] text-sm font-medium">Devices</h4>
                            <button className="text-xs text-[#0EA5E9] hover:underline">+ Add Device</button>
                          </div>
                          <div className="space-y-2">
                            {getDevicesForVenue(venue.id).map(device => (
                              <div key={device.id} className="flex items-center justify-between bg-[#0A0F2C] p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Wifi className="w-4 h-4 text-[#0EA5E9]" />
                                  <div>
                                    <p className="text-white text-sm">{device.name}</p>
                                    <p className="text-[#64748B] text-xs">{device.model} • {device.placement}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[#64748B] text-xs font-mono">{device.macAddress}</p>
                                  <p className="text-[#64748B] text-xs">SN: {device.serialNumber}</p>
                                </div>
                              </div>
                            ))}
                            {getDevicesForVenue(venue.id).length === 0 && (
                              <p className="text-[#64748B] text-sm text-center py-4">No devices</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Documents</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* LOI */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-400" />
                    Letter of Intent
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    partner.loiStatus === 'signed' ? 'bg-green-500/20 text-green-400' :
                    partner.loiStatus === 'sent' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {partner.loiStatus === 'signed' ? 'Signed' :
                     partner.loiStatus === 'sent' ? 'Awaiting Signature' :
                     'Not Sent'}
                  </span>
                </div>
                {partner.loiSignedAt && (
                  <p className="text-[#64748B] text-sm mb-4">Signed on {formatDate(partner.loiSignedAt)}</p>
                )}
                <button className="w-full px-4 py-2 border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F]">
                  {partner.loiStatus === 'not_sent' ? 'Generate & Send LOI' : 'View Document'}
                </button>
              </div>

              {/* Contract */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    Deployment Contract
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    partner.contractStatus === 'signed' ? 'bg-green-500/20 text-green-400' :
                    partner.contractStatus === 'sent' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {partner.contractStatus === 'signed' ? 'Signed' :
                     partner.contractStatus === 'sent' ? 'Awaiting Signature' :
                     'Not Sent'}
                  </span>
                </div>
                <button className="w-full px-4 py-2 border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F]">
                  {partner.contractStatus === 'not_sent' ? 'Generate & Send Contract' : 'View Document'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Activity Log</h2>
            
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
              {activityLog.length === 0 ? (
                <div className="p-12 text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-[#64748B] opacity-50" />
                  <p className="text-[#64748B]">No activity recorded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2D3B5F]">
                  {activityLog.map(log => (
                    <div key={log.id} className="p-4 flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#0EA5E9]/20 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-[#0EA5E9]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{log.description}</p>
                        <p className="text-[#64748B] text-xs mt-1">
                          {log.performedBy} • {formatDateTime(log.performedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}