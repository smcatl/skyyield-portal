'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Building2, User, Phone, Mail, MapPin, Globe,
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, 
  Send, Edit, Trash2, Plus, ExternalLink, FileText,
  Wifi, Router, ChevronDown, ChevronRight, MoreVertical,
  DollarSign, TrendingUp, Activity, Settings, Copy, Check,
  SkipForward, Play, Loader2
} from 'lucide-react'

interface LocationPartner {
  id: string
  partner_id: string
  stage: string
  pipeline_stage: string
  stageEnteredAt: string
  createdAt: string
  updatedAt: string
  
  initialReviewStatus: string
  initial_review_status: string
  initialReviewedAt?: string
  initialReviewNotes?: string
  postCallReviewStatus: string
  post_call_review_status: string
  
  discoveryCallStatus: string
  discovery_call_status: string
  discoveryCallScheduledAt?: string
  technicalCallStatus: string
  installCallStatus: string
  trialReviewCallStatus: string
  
  loiStatus: string
  loi_status: string
  loiSignedAt?: string
  loi_docuseal_id?: string
  contractStatus: string
  contract_status: string
  contract_docuseal_id?: string
  
  trialStartDate?: string
  trial_start_date?: string
  trialEndDate?: string
  trial_end_date?: string
  trialDaysRemaining?: number
  
  tipaltiInviteSent: boolean
  tipalti_invite_sent: boolean
  tipaltiSignupComplete: boolean
  tipalti_status: string
  portalInviteSent: boolean
  portal_invite_sent: boolean
  portalActivated: boolean
  
  contactFullName: string
  contact_first_name: string
  contact_last_name: string
  contactPreferredName?: string
  contactTitle?: string
  contactPhone: string
  contact_phone: string
  contactEmail: string
  contact_email: string
  
  companyLegalName: string
  company_legal_name: string
  companyDBA?: string
  dba_name?: string
  companyIndustry?: string
  companyAddress1: string
  address_line_1?: string
  companyAddress2?: string
  companyCity: string
  city: string
  companyState: string
  state: string
  companyZip: string
  zip: string
  companyCountry: string
  
  linkedInProfile?: string
  howDidYouHear?: string
  referral_source?: string
  numberOfLocations?: number
  currentInternetProvider?: string
  
  source: string
  tags?: string[]
  notes?: string
}

interface Venue {
  id: string
  venue_name: string
  venue_type: string
  phone: string
  address_line_1: string
  city: string
  state: string
  zip: string
  isp: string
  connection_type: string
  internet_speed: string
  status: string
  device_count?: number
}

interface ActivityLog {
  id: string
  action: string
  description: string
  user_id?: string
  created_at: string
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
  { id: 'contract_sent', name: 'Contract Sent', step: 11 },
  { id: 'active', name: 'Active Client', step: 12 },
]

// Calendly event types - configure these in Settings
const CALENDLY_EVENTS = {
  discovery: { name: 'Discovery Call', slug: 'discovery-call' },
  install: { name: 'Install Appointment', slug: 'install-appointment' },
  review: { name: 'Trial Review', slug: 'trial-review' },
}

export default function PartnerDetailPage() {
  const { user, isLoaded } = useUser()
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string
  
  const [partner, setPartner] = useState<LocationPartner | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'venues' | 'documents' | 'activity'>('overview')
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Action states
  const [sendingDoc, setSendingDoc] = useState<string | null>(null)
  const [sendingCalendly, setSendingCalendly] = useState<string | null>(null)
  const [sendingInvite, setSendingInvite] = useState<string | null>(null)
  
  // Skip stages modal
  const [showSkipModal, setShowSkipModal] = useState(false)
  const [skipToStage, setSkipToStage] = useState('')
  const [skipReason, setSkipReason] = useState('')

  useEffect(() => {
    if (partnerId) {
      fetchPartnerData()
    }
  }, [partnerId])

  const fetchPartnerData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pipeline/partners?id=${partnerId}&includeVenues=true`)
      if (res.ok) {
        const data = await res.json()
        setPartner(data.partner)
        setVenues(data.venues || [])
        setActivityLog(data.activityLog || [])
      }
    } catch (err) {
      console.error('Error fetching partner:', err)
    } finally {
      setLoading(false)
    }
  }

  // Helper to get field value (handles both camelCase and snake_case)
  const getField = (camel: string, snake: string) => {
    if (!partner) return null
    return (partner as any)[camel] || (partner as any)[snake]
  }

  const updatePartner = async (updates: Record<string, any>) => {
    if (!partner) return
    try {
      const res = await fetch('/api/pipeline/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partner.id, ...updates }),
      })
      if (res.ok) {
        const data = await res.json()
        setPartner(data.partner)
        fetchPartnerData() // Refresh to get activity log
      }
    } catch (err) {
      console.error('Error updating partner:', err)
    }
  }

  const updateStage = async (newStage: string) => {
    await updatePartner({ pipeline_stage: newStage })
  }

  const approvePartner = async (type: 'initial' | 'postCall', skipTo?: string) => {
    const updates: Record<string, any> = {}
    
    if (type === 'initial') {
      updates.initial_review_status = 'approved'
      updates.pipeline_stage = skipTo || 'discovery_scheduled'
    } else {
      updates.post_call_review_status = 'approved'
      updates.pipeline_stage = skipTo || 'venues_setup'
    }
    
    if (skipTo && skipReason) {
      updates.skip_reason = skipReason
      updates.skipped_stages = JSON.stringify(getSkippedStages(skipTo))
    }
    
    await updatePartner(updates)
    setShowSkipModal(false)
    setSkipReason('')
  }

  const denyPartner = async (type: 'initial' | 'postCall') => {
    const field = type === 'initial' ? 'initial_review_status' : 'post_call_review_status'
    await updatePartner({ [field]: 'denied', pipeline_stage: 'inactive' })
  }

  const getSkippedStages = (targetStage: string) => {
    const currentStep = getCurrentStep()
    const targetStep = STAGES.find(s => s.id === targetStage)?.step || 0
    return STAGES.filter(s => s.step > currentStep && s.step < targetStep).map(s => s.id)
  }

  // DocuSeal Functions
  const sendDocuSealDocument = async (templateType: 'loi' | 'contract' | 'agreement') => {
    if (!partner) return
    setSendingDoc(templateType)
    
    try {
      const res = await fetch('/api/pipeline/docuseal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          templateType,
          recipientEmail: getField('contactEmail', 'contact_email'),
          recipientName: getField('contactFullName', 'contact_first_name') + ' ' + (partner.contact_last_name || ''),
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        // Update local state based on template type
        const stageUpdate = templateType === 'loi' ? 'loi_sent' : 
                           templateType === 'contract' ? 'contract_sent' : null
        if (stageUpdate) {
          await updatePartner({ pipeline_stage: stageUpdate })
        }
        alert(`${templateType.toUpperCase()} sent successfully!`)
      } else {
        const error = await res.json()
        alert(`Failed to send: ${error.error}`)
      }
    } catch (err) {
      console.error('Error sending document:', err)
      alert('Failed to send document')
    } finally {
      setSendingDoc(null)
    }
  }

  // Calendly Functions
  const sendCalendlyLink = async (eventType: 'discovery' | 'install' | 'review') => {
    if (!partner) return
    setSendingCalendly(eventType)
    
    try {
      const res = await fetch('/api/pipeline/calendly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          eventType,
          recipientEmail: getField('contactEmail', 'contact_email'),
          recipientName: getField('contactFullName', 'contact_first_name'),
        }),
      })
      
      if (res.ok) {
        alert(`Calendly link for ${CALENDLY_EVENTS[eventType].name} sent!`)
        fetchPartnerData()
      } else {
        const error = await res.json()
        alert(`Failed to send: ${error.error}`)
      }
    } catch (err) {
      console.error('Error sending Calendly link:', err)
      alert('Failed to send Calendly link')
    } finally {
      setSendingCalendly(null)
    }
  }

  // Tipalti & Portal Invites
  const sendTipaltiInvite = async () => {
    if (!partner) return
    setSendingInvite('tipalti')
    
    try {
      const res = await fetch('/api/tipalti/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          partnerType: 'location_partner',
          email: getField('contactEmail', 'contact_email'),
          name: getField('contactFullName', 'contact_first_name'),
          companyName: getField('companyLegalName', 'company_legal_name'),
        }),
      })
      
      if (res.ok) {
        await updatePartner({ tipalti_invite_sent: true, tipalti_invite_sent_at: new Date().toISOString() })
        alert('Tipalti invite sent!')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to send Tipalti invite')
    } finally {
      setSendingInvite(null)
    }
  }

  const sendPortalInvite = async () => {
    if (!partner) return
    setSendingInvite('portal')
    
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: getField('contactEmail', 'contact_email'),
          userType: 'location_partner',
          partnerId: partner.id,
        }),
      })
      
      if (res.ok) {
        await updatePartner({ portal_invite_sent: true, portal_invite_sent_at: new Date().toISOString() })
        alert('Portal invite sent!')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to send portal invite')
    } finally {
      setSendingInvite(null)
    }
  }

  const copyId = () => {
    if (partner) {
      navigator.clipboard.writeText(partner.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const getCurrentStep = () => {
    const stage = getField('stage', 'pipeline_stage')
    const stageObj = STAGES.find(s => s.id === stage)
    return stageObj?.step || 0
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

  const getDocStatus = (status: string | undefined) => {
    if (status === 'signed' || status === 'completed') return { label: 'Signed', color: 'bg-green-500/20 text-green-400' }
    if (status === 'sent' || status === 'pending') return { label: 'Awaiting Signature', color: 'bg-yellow-500/20 text-yellow-400' }
    if (status === 'viewed') return { label: 'Viewed', color: 'bg-blue-500/20 text-blue-400' }
    return { label: 'Not Sent', color: 'bg-gray-500/20 text-gray-400' }
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
          <Link href="/portals/admin" className="text-[#0EA5E9] hover:underline">
            ← Back to Admin Portal
          </Link>
        </div>
      </div>
    )
  }

  const currentStage = getField('stage', 'pipeline_stage')
  const loiStatus = getField('loiStatus', 'loi_status')
  const contractStatus = getField('contractStatus', 'contract_status')
  const tipaltiStatus = getField('tipaltiStatus', 'tipalti_status') || (getField('tipaltiInviteSent', 'tipalti_invite_sent') ? 'invited' : null)
  const portalStatus = getField('portalActivated', 'portal_activated') ? 'activated' : (getField('portalInviteSent', 'portal_invite_sent') ? 'invited' : null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20 pb-12">
      {/* Header */}
      <div className="px-4 pb-4 border-b border-[#2D3B5F]">
        <div className="max-w-7xl mx-auto">
          <Link 
            href="/portals/admin"
            className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Portal
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-white">
                  {getField('companyDBA', 'dba_name') || getField('companyLegalName', 'company_legal_name')}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentStage === 'active' ? 'bg-green-500/20 text-green-400' :
                  currentStage === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {STAGES.find(s => s.id === currentStage)?.name || currentStage}
                </span>
              </div>
              {getField('companyDBA', 'dba_name') && (
                <p className="text-[#94A3B8]">{getField('companyLegalName', 'company_legal_name')}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-[#64748B]">
                <button onClick={copyId} className="flex items-center gap-1 hover:text-white">
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {partner.id.slice(0, 12)}...
                </button>
                <span>Partner ID: {partner.partner_id}</span>
                <span>Created {formatDate(getField('createdAt', 'created_at'))}</span>
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
                    <p className="text-white">{getField('contactFullName', 'contact_first_name')} {partner.contact_last_name || ''}</p>
                  </div>
                  <div>
                    <label className="text-[#64748B] text-sm">Email</label>
                    <a href={`mailto:${getField('contactEmail', 'contact_email')}`} className="text-[#0EA5E9] hover:underline block">
                      {getField('contactEmail', 'contact_email')}
                    </a>
                  </div>
                  <div>
                    <label className="text-[#64748B] text-sm">Phone</label>
                    <p className="text-white">{getField('contactPhone', 'contact_phone') || '-'}</p>
                  </div>
                  <div>
                    <label className="text-[#64748B] text-sm">Source</label>
                    <p className="text-white capitalize">{getField('source', 'referral_source') || '-'}</p>
                  </div>
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
                    <p className="text-white">{getField('companyLegalName', 'company_legal_name')}</p>
                  </div>
                  <div>
                    <label className="text-[#64748B] text-sm">DBA</label>
                    <p className="text-white">{getField('companyDBA', 'dba_name') || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[#64748B] text-sm">Address</label>
                    <p className="text-white">
                      {getField('companyAddress1', 'address_line_1') || '-'}
                      {(getField('companyCity', 'city') || getField('companyState', 'state')) && ', '}
                      {getField('companyCity', 'city')} {getField('companyState', 'state')} {getField('companyZip', 'zip')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {partner.notes && (
                <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">Notes</h3>
                  <p className="text-[#94A3B8]">{partner.notes}</p>
                </div>
              )}
            </div>

            {/* Right Column - Actions & Status */}
            <div className="space-y-6">
              {/* Pending Review Actions */}
              {(currentStage === 'initial_review' || currentStage === 'application') && (
                <div className="bg-[#1A1F3A] border border-yellow-500/50 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    Pending Review
                  </h3>
                  <p className="text-[#94A3B8] text-sm mb-4">
                    Review this application and decide next steps.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => approvePartner('initial')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve & Send Discovery Link
                    </button>
                    <button
                      onClick={() => setShowSkipModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                    >
                      <SkipForward className="w-4 h-4" />
                      Approve & Skip Stages
                    </button>
                    <button
                      onClick={() => denyPartner('initial')}
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
                <select
                  value={currentStage}
                  onChange={(e) => updateStage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] mb-4"
                >
                  {STAGES.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Calendly Actions */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Calendly Invites
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => sendCalendlyLink('discovery')}
                    disabled={sendingCalendly === 'discovery'}
                    className="w-full flex items-center justify-between px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white hover:border-purple-500 disabled:opacity-50"
                  >
                    <span className="text-sm">Discovery Call</span>
                    {sendingCalendly === 'discovery' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-purple-400" />
                    )}
                  </button>
                  <button
                    onClick={() => sendCalendlyLink('install')}
                    disabled={sendingCalendly === 'install'}
                    className="w-full flex items-center justify-between px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white hover:border-purple-500 disabled:opacity-50"
                  >
                    <span className="text-sm">Install Appointment</span>
                    {sendingCalendly === 'install' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-purple-400" />
                    )}
                  </button>
                  <button
                    onClick={() => sendCalendlyLink('review')}
                    disabled={sendingCalendly === 'review'}
                    className="w-full flex items-center justify-between px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white hover:border-purple-500 disabled:opacity-50"
                  >
                    <span className="text-sm">Trial Review Call</span>
                    {sendingCalendly === 'review' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-purple-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* DocuSeal Documents */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-400" />
                  Documents
                </h3>
                <div className="space-y-3">
                  {/* LOI */}
                  <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">Letter of Intent</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${getDocStatus(loiStatus).color}`}>
                        {getDocStatus(loiStatus).label}
                      </span>
                    </div>
                    {loiStatus !== 'signed' && (
                      <button
                        onClick={() => sendDocuSealDocument('loi')}
                        disabled={sendingDoc === 'loi'}
                        className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                      >
                        {sendingDoc === 'loi' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send'}
                      </button>
                    )}
                  </div>

                  {/* Contract */}
                  <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">Deployment Contract</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${getDocStatus(contractStatus).color}`}>
                        {getDocStatus(contractStatus).label}
                      </span>
                    </div>
                    {contractStatus !== 'signed' && (
                      <button
                        onClick={() => sendDocuSealDocument('contract')}
                        disabled={sendingDoc === 'contract'}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        {sendingDoc === 'contract' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send'}
                      </button>
                    )}
                  </div>
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
                      <p className="text-white text-sm font-medium">Tipalti Payment</p>
                      <p className="text-[#64748B] text-xs">
                        {tipaltiStatus === 'payable' ? 'Setup complete' : 
                         tipaltiStatus === 'invited' ? 'Invite sent' : 'Not sent'}
                      </p>
                    </div>
                    {tipaltiStatus === 'payable' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <button
                        onClick={sendTipaltiInvite}
                        disabled={sendingInvite === 'tipalti' || tipaltiStatus === 'invited'}
                        className="px-3 py-1 text-xs bg-[#0EA5E9] text-white rounded hover:bg-[#0EA5E9]/80 disabled:opacity-50"
                      >
                        {sendingInvite === 'tipalti' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                         tipaltiStatus === 'invited' ? 'Sent' : 'Send'}
                      </button>
                    )}
                  </div>

                  {/* Portal */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Partner Portal</p>
                      <p className="text-[#64748B] text-xs">
                        {portalStatus === 'activated' ? 'Activated' : 
                         portalStatus === 'invited' ? 'Invite sent' : 'Not sent'}
                      </p>
                    </div>
                    {portalStatus === 'activated' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <button
                        onClick={sendPortalInvite}
                        disabled={sendingInvite === 'portal' || portalStatus === 'invited'}
                        className="px-3 py-1 text-xs bg-[#0EA5E9] text-white rounded hover:bg-[#0EA5E9]/80 disabled:opacity-50"
                      >
                        {sendingInvite === 'portal' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                         portalStatus === 'invited' ? 'Sent' : 'Send'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Venues Tab */}
        {activeTab === 'venues' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Venues</h2>
              <Link
                href={`/pipeline/venues/${partner.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
              >
                <Plus className="w-4 h-4" />
                Add Venue
              </Link>
            </div>

            {venues.length === 0 ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-[#64748B] opacity-50" />
                <h3 className="text-white font-medium mb-2">No Venues Yet</h3>
                <p className="text-[#64748B] text-sm">Add venues to track devices and locations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {venues.map(venue => (
                  <div key={venue.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{venue.venue_name}</h3>
                        <p className="text-[#64748B] text-sm">
                          {venue.city}, {venue.state} • {venue.venue_type}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        venue.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {venue.status || 'pending'}
                      </span>
                    </div>
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
                  <span className={`px-2 py-1 rounded text-xs ${getDocStatus(loiStatus).color}`}>
                    {getDocStatus(loiStatus).label}
                  </span>
                </div>
                <button
                  onClick={() => loiStatus === 'signed' ? null : sendDocuSealDocument('loi')}
                  disabled={sendingDoc === 'loi'}
                  className="w-full px-4 py-2 border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F] disabled:opacity-50"
                >
                  {sendingDoc === 'loi' ? 'Sending...' : loiStatus === 'signed' ? 'View Document' : 'Generate & Send LOI'}
                </button>
              </div>

              {/* Contract */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    Deployment Contract
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs ${getDocStatus(contractStatus).color}`}>
                    {getDocStatus(contractStatus).label}
                  </span>
                </div>
                <button
                  onClick={() => contractStatus === 'signed' ? null : sendDocuSealDocument('contract')}
                  disabled={sendingDoc === 'contract'}
                  className="w-full px-4 py-2 border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F] disabled:opacity-50"
                >
                  {sendingDoc === 'contract' ? 'Sending...' : contractStatus === 'signed' ? 'View Document' : 'Generate & Send Contract'}
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
                          {formatDateTime(log.created_at)}
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

      {/* Skip Stages Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-[#2D3B5F]">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <SkipForward className="w-5 h-5 text-[#0EA5E9]" />
                Skip Stages
              </h2>
              <p className="text-[#94A3B8] text-sm mt-2">
                For pre-vetted partners, you can skip directly to a later stage.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Skip to Stage</label>
                <select
                  value={skipToStage}
                  onChange={(e) => setSkipToStage(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="">Select a stage...</option>
                  {STAGES.filter(s => s.step > getCurrentStep()).map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Reason for Skipping</label>
                <textarea
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  placeholder="e.g., Existing relationship, referred by trusted partner, etc."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              {skipToStage && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    <strong>Skipping:</strong> {getSkippedStages(skipToStage).map(s => 
                      STAGES.find(st => st.id === s)?.name
                    ).join(' → ')}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowSkipModal(false)
                    setSkipToStage('')
                    setSkipReason('')
                  }}
                  className="flex-1 px-4 py-2 border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => approvePartner('initial', skipToStage)}
                  disabled={!skipToStage}
                  className="flex-1 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 disabled:opacity-50"
                >
                  Approve & Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
