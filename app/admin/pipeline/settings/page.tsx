'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import {
  ArrowLeft, Settings, List, GitBranch, Calendar, Mail,
  Plus, Edit, Trash2, GripVertical, Check, X,
  ChevronDown, ChevronRight, Save, RefreshCw,
  ToggleLeft, ToggleRight, AlertCircle, Eye,
  ExternalLink, Copy, Sparkles, Send, CheckCircle,
  Bell, Clock, Zap, User
} from 'lucide-react'

// ==========================================
// TYPES
// ==========================================

interface DropdownOption {
  value: string
  label: string
  isActive: boolean
  order: number
}

interface Dropdown {
  id: string
  key: string
  name: string
  options: DropdownOption[]
  allowCustom: boolean
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  description: string
  trigger: string
  triggerStage?: string
  triggerAction?: string
  hasCalendly: boolean
  calendlyLinkId?: string
  enabled: boolean
  greeting: string
  bodyParagraphs: string[]
  ctaText?: string
  ctaType: 'calendly' | 'custom' | 'none'
  footerText?: string
}

interface CalendlyLink {
  id: string
  name: string
  slug: string
  url: string
  duration: number
  description: string
  active: boolean
  kind: string
  color: string
}

interface StageTrigger {
  stageId: string
  stageName: string
  onEnter: {
    sendEmail?: string // email template ID
    sendCalendly?: string // calendly link ID
    sendDocuSeal?: 'loi' | 'contract' | null
    sendTipalti?: boolean
    sendPortalInvite?: boolean
    autoAdvance?: boolean
    autoAdvanceCondition?: string
  }
  reminders: {
    enabled: boolean
    frequency: number // days
    maxAttempts: number
    emailTemplateId?: string
  }
}

interface ReminderSettings {
  globalEnabled: boolean
  defaultFrequencyDays: number
  maxAttemptsBeforeEscalation: number
  escalationEmail: string
  workingHoursOnly: boolean
  workingHoursStart: string
  workingHoursEnd: string
  excludeWeekends: boolean
}

type ActiveTab = 'profile' | 'emails' | 'dropdowns' | 'calendly' | 'stages'

// ==========================================
// CONFIGURATION DATA
// ==========================================

const PIPELINE_STAGES = [
  { id: 'application', name: 'Application', description: 'Form submitted', color: 'bg-blue-500' },
  { id: 'initial_review', name: 'Initial Review', description: 'Admin approve/deny', color: 'bg-yellow-500', requiresApproval: true },
  { id: 'discovery_scheduled', name: 'Discovery Scheduled', description: 'Calendly link sent', color: 'bg-purple-500', hasCalendly: true },
  { id: 'discovery_complete', name: 'Discovery Complete', description: 'Post-call approve/deny', color: 'bg-yellow-500', requiresApproval: true },
  { id: 'venues_setup', name: 'Venues Setup', description: 'Venues/Devices form', color: 'bg-cyan-500' },
  { id: 'loi_sent', name: 'LOI Sent', description: 'DocuSeal sent', color: 'bg-orange-500' },
  { id: 'loi_signed', name: 'LOI Signed', description: 'Install scheduling', color: 'bg-green-500', hasCalendly: true },
  { id: 'install_scheduled', name: 'Install Scheduled', description: 'Equipment PO', color: 'bg-pink-500' },
  { id: 'trial_active', name: 'Trial Active', description: '60-day trial', color: 'bg-indigo-500' },
  { id: 'trial_ending', name: 'Trial Ending', description: '10-day reminder', color: 'bg-amber-500', hasCalendly: true },
  { id: 'contract_decision', name: 'Contract Decision', description: 'Final contract', color: 'bg-yellow-500', requiresApproval: true },
  { id: 'active', name: 'Active Client', description: 'Fully onboarded', color: 'bg-green-500' },
  { id: 'inactive', name: 'Inactive', description: 'Declined/churned', color: 'bg-gray-500' },
]

const DEFAULT_STAGE_TRIGGERS: Record<string, StageTrigger['onEnter']> = {
  initial_review: { sendEmail: 'applicationReceived' },
  discovery_scheduled: { sendEmail: 'applicationApproved', sendCalendly: 'new-location-partner-intro-call' },
  venues_setup: { sendEmail: 'postCallApproved' },
  loi_sent: { sendDocuSeal: 'loi', sendEmail: 'loiSent' },
  loi_signed: { sendEmail: 'loiSigned', sendCalendly: 'new-location-partner-install-scheduling' },
  trial_active: { sendEmail: 'trialStarted', sendPortalInvite: true, sendTipalti: true },
  trial_ending: { sendEmail: 'trialEnding', sendCalendly: 'new-location-partner-negotiate-loi-to-full-deployment' },
  contract_sent: { sendDocuSeal: 'contract', sendEmail: 'contractSent' },
  active: { sendEmail: 'welcomeActive' },
}

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'applicationApproved',
    name: 'Application Approved',
    subject: '🎉 Welcome to SkyYield - Schedule Your Discovery Call',
    description: 'Sent when admin approves initial application',
    trigger: 'Initial Review → Approved',
    triggerStage: 'initial_review',
    triggerAction: 'approved',
    hasCalendly: true,
    calendlyLinkId: 'lp_intro',
    enabled: true,
    greeting: 'Welcome to SkyYield, {{name}}!',
    bodyParagraphs: [
      "Great news! Your application to become a SkyYield Location Partner has been approved.",
      "We're excited to learn more about {{company}} and explore how we can help you monetize your WiFi infrastructure.",
      "The next step is to schedule a quick discovery call where we'll discuss your venue details, answer any questions, and walk you through the onboarding process."
    ],
    ctaText: 'Schedule Discovery Call',
    ctaType: 'calendly',
    footerText: "Can't make the available times? Reply to this email and we'll find a time that works for you."
  },
  {
    id: 'applicationDenied',
    name: 'Application Denied',
    subject: 'SkyYield Application Update',
    description: 'Sent when admin denies initial application',
    trigger: 'Initial Review → Denied',
    triggerStage: 'initial_review',
    triggerAction: 'denied',
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: [
      "Thank you for your interest in becoming a SkyYield Location Partner.",
      "After reviewing your application, we've determined that we're not able to move forward at this time. {{reason}}",
      "This decision is based on our current deployment priorities and coverage requirements. We encourage you to apply again in the future as our network expands.",
      "If you have any questions, please don't hesitate to reach out."
    ],
    ctaType: 'none',
    footerText: 'Best regards,\nThe SkyYield Team'
  },
  {
    id: 'postCallApproved',
    name: 'Post-Call Approved',
    subject: '✅ Next Steps - Submit Your Venue Details',
    description: 'Sent after successful discovery call',
    trigger: 'Discovery Complete → Approved',
    triggerStage: 'discovery_complete',
    triggerAction: 'approved',
    hasCalendly: false,
    enabled: true,
    greeting: 'Great talking with you, {{name}}!',
    bodyParagraphs: [
      "We're excited to move forward with {{company}} as a SkyYield Location Partner!",
      "The next step is to submit your venue and device details. This helps us prepare your Letter of Intent (LOI) and plan the installation.",
      "Please fill out the form below with information about each location where you'd like SkyYield equipment installed."
    ],
    ctaText: 'Submit Venue Details',
    ctaType: 'custom',
    footerText: 'Need help with the form? Reply to this email and we\'ll walk you through it.'
  },
  {
    id: 'loiSent',
    name: 'LOI Sent',
    subject: '📄 Your Letter of Intent is Ready for Review',
    description: 'Sent when LOI is generated and sent via DocuSeal',
    trigger: 'LOI Sent',
    triggerStage: 'loi_sent',
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: [
      "Your Letter of Intent (LOI) for {{company}} is ready for review!",
      "This document outlines the terms of our partnership, including the trial period, revenue share, and equipment details.",
      "Please review the document carefully and sign when you're ready. If you have any questions about the terms, don't hesitate to reach out."
    ],
    ctaText: 'Review & Sign LOI',
    ctaType: 'custom',
    footerText: 'The LOI is non-binding and simply confirms your intent to participate in the trial program.'
  },
  {
    id: 'loiSigned',
    name: 'LOI Signed',
    subject: '📦 LOI Signed - Schedule Your Installation',
    description: 'Sent when partner signs Letter of Intent',
    trigger: 'LOI Signed',
    triggerStage: 'loi_signed',
    hasCalendly: true,
    calendlyLinkId: 'lp_install',
    enabled: true,
    greeting: 'Fantastic news, {{name}}!',
    bodyParagraphs: [
      "We've received your signed Letter of Intent. Thank you for officially joining the SkyYield network!",
      "Now let's get your equipment installed. Click below to schedule your installation appointment. Our team will arrive with all the necessary equipment and have you up and running in no time.",
      "Before the installation, we'll ship the equipment directly to your venue. You'll receive tracking information separately."
    ],
    ctaText: 'Schedule Installation',
    ctaType: 'calendly',
    footerText: 'Need a different time? Just reply to this email.'
  },
  {
    id: 'followUpReminder',
    name: 'Follow-Up Reminder',
    subject: '⏰ Friendly Reminder - {{waitingFor}}',
    description: 'Automatic follow-up for pending items',
    trigger: 'Scheduled Reminder',
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: [
      "We noticed that {{waitingFor}} is still pending. We wanted to check in and see if you have any questions or need any help.",
      "{{customMessage}}",
      "Please don't hesitate to reach out if there's anything we can do to help move things forward."
    ],
    ctaText: '{{ctaText}}',
    ctaType: 'custom',
    footerText: 'Reply to this email if you need assistance.'
  }
]

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  globalEnabled: true,
  defaultFrequencyDays: 3,
  maxAttemptsBeforeEscalation: 3,
  escalationEmail: 'stosh@skyyield.io',
  workingHoursOnly: true,
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  excludeWeekends: true,
}

const TEMPLATE_VARIABLES = [
  { token: '{{name}}', description: 'Contact name' },
  { token: '{{company}}', description: 'Company name' },
  { token: '{{email}}', description: 'Contact email' },
  { token: '{{phone}}', description: 'Contact phone' },
  { token: '{{stage}}', description: 'Current pipeline stage' },
  { token: '{{trialDays}}', description: 'Trial days remaining' },
  { token: '{{reason}}', description: 'Denial reason (if applicable)' },
  { token: '{{waitingFor}}', description: 'What we\'re waiting for' },
  { token: '{{customMessage}}', description: 'Custom follow-up message' },
  { token: '{{ctaText}}', description: 'Dynamic button text' },
]

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function PipelineSettingsPage() {
  const { user, isLoaded } = useUser()

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendly')

  // Data states
  const [calendlyLinks, setCalendlyLinks] = useState<CalendlyLink[]>([])
  const [calendlyLoading, setCalendlyLoading] = useState(false)
  const [calendlyError, setCalendlyError] = useState<string | null>(null)

  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES)
  const [stageTriggers, setStageTriggers] = useState<Record<string, StageTrigger['onEnter']>>(DEFAULT_STAGE_TRIGGERS)
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS)

  const [dropdowns, setDropdowns] = useState<Dropdown[]>([])
  const [loading, setLoading] = useState(false)

  // UI states
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [showVariables, setShowVariables] = useState(false)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newOptionLabel, setNewOptionLabel] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [testEmailSent, setTestEmailSent] = useState(false)

  // Load data on mount
  useEffect(() => {
    fetchCalendlyLinks()
    fetchDropdowns()
    loadSettings()
  }, [])

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const fetchCalendlyLinks = async () => {
    setCalendlyLoading(true)
    setCalendlyError(null)
    try {
      const res = await fetch('/api/pipeline/calendly')
      const data = await res.json()
      if (data.error) {
        setCalendlyError(data.error)
      } else {
        setCalendlyLinks(data.links || [])
      }
    } catch (err) {
      setCalendlyError('Failed to connect to Calendly API')
    } finally {
      setCalendlyLoading(false)
    }
  }

  const fetchDropdowns = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pipeline/dropdowns')
      const data = await res.json()
      if (data.dropdowns) {
        setDropdowns(data.dropdowns)
      }
    } catch (err) {
      console.error('Failed to fetch dropdowns:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    // In a real implementation, this would fetch from database
    // For now, using defaults
  }

  // ==========================================
  // ACTIONS
  // ==========================================

  const copyCalendlyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedLink(id)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const saveTemplate = async (template: EmailTemplate) => {
    setSaveStatus('saving')
    try {
      // Update local state
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t))
      // In production, save to database here
      setSaveStatus('saved')
      setTimeout(() => {
        setSaveStatus('idle')
        setEditingTemplate(null)
      }, 1500)
    } catch (err) {
      setSaveStatus('idle')
    }
  }

  const saveStageTrigger = async (stageId: string, trigger: StageTrigger['onEnter']) => {
    setStageTriggers(prev => ({ ...prev, [stageId]: trigger }))
    // In production, save to database
  }

  const saveReminderSettings = async (settings: ReminderSettings) => {
    setReminderSettings(settings)
    // In production, save to database
  }

  const toggleTemplateEnabled = (templateId: string) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId ? { ...t, enabled: !t.enabled } : t
    ))
  }

  const sendTestEmail = async (template: EmailTemplate) => {
    setTestEmailSending(true)
    try {
      // Simulate sending
      await new Promise(r => setTimeout(r, 1500))
      setTestEmailSent(true)
      setTimeout(() => setTestEmailSent(false), 3000)
    } catch (err) {
      console.error('Failed to send test email:', err)
    } finally {
      setTestEmailSending(false)
    }
  }

  const replaceVariables = (text: string) => {
    return text
      .replace(/\{\{name\}\}/g, 'John Smith')
      .replace(/\{\{company\}\}/g, "John's Coffee Shop")
      .replace(/\{\{email\}\}/g, 'john@example.com')
      .replace(/\{\{phone\}\}/g, '(555) 123-4567')
      .replace(/\{\{stage\}\}/g, 'Discovery Scheduled')
      .replace(/\{\{trialDays\}\}/g, '45')
      .replace(/\{\{reason\}\}/g, 'venue does not meet minimum requirements')
      .replace(/\{\{waitingFor\}\}/g, 'LOI signature')
      .replace(/\{\{customMessage\}\}/g, '')
      .replace(/\{\{ctaText\}\}/g, 'Take Action')
  }

  const renderEmailPreview = (template: EmailTemplate) => {
    return (
      <div className="bg-white rounded-lg p-6 text-gray-900">
        <div className="border-b pb-4 mb-4">
          <img src="/images/skyyield-logo-dark.png" alt="SkyYield" className="h-8" />
        </div>
        <p className="text-lg font-medium mb-4">{replaceVariables(template.greeting)}</p>
        {template.bodyParagraphs.map((p, i) => (
          <p key={i} className="mb-4 text-gray-700">{replaceVariables(p)}</p>
        ))}
        {template.ctaType !== 'none' && template.ctaText && (
          <div className="my-6">
            <button className="px-6 py-3 bg-[#0EA5E9] text-white rounded-lg font-medium">
              {replaceVariables(template.ctaText)}
            </button>
          </div>
        )}
        {template.footerText && (
          <p className="text-sm text-gray-500 mt-6 whitespace-pre-line">
            {replaceVariables(template.footerText)}
          </p>
        )}
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20 pb-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <Link
          href="/portals/admin"
          className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Portal
        </Link>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-[#2D3B5F] pb-4 overflow-x-auto">
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'emails', label: 'Email Templates', icon: Mail },
            { id: 'dropdowns', label: 'Dropdowns', icon: List },
            { id: 'calendly', label: 'Calendly', icon: Calendar },
            { id: 'stages', label: 'Pipeline Stages', icon: GitBranch },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#0EA5E9] text-white'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4">

        {/* ==================== CALENDLY TAB ==================== */}
        {activeTab === 'calendly' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Calendly Links</h2>
                <p className="text-[#94A3B8] text-sm">Event scheduling URLs synced from your Calendly account</p>
              </div>
              <button
                onClick={fetchCalendlyLinks}
                disabled={calendlyLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F] disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${calendlyLoading ? 'animate-spin' : ''}`} />
                Sync from Calendly
              </button>
            </div>

            {/* Error State */}
            {calendlyError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-medium">Failed to load Calendly links</h4>
                    <p className="text-red-400/70 text-sm mt-1">{calendlyError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {calendlyLoading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-[#0EA5E9] animate-spin" />
              </div>
            )}

            {/* Calendly Links List with Stage Mapping */}
            {!calendlyLoading && !calendlyError && calendlyLinks.length > 0 && (
              <div className="space-y-4">
                {calendlyLinks.map(cal => {
                  // Find which stage this link is mapped to
                  const mappedStage = Object.entries(stageTriggers).find(
                    ([_, trigger]) => trigger.sendCalendly === cal.slug || trigger.sendCalendly === cal.id
                  )

                  return (
                    <div key={cal.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cal.color || '#0EA5E9' }}
                              />
                              <h4 className="text-white font-medium">{cal.name}</h4>
                              <span className="px-2 py-0.5 bg-[#0A0F2C] text-[#64748B] text-xs rounded">
                                {cal.duration} min
                              </span>
                              {cal.kind !== 'solo' && (
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                  {cal.kind}
                                </span>
                              )}
                            </div>
                            {cal.description && (
                              <p className="text-[#64748B] text-sm mt-1">{cal.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={cal.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded"
                              title="Open in Calendly"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => copyCalendlyLink(cal.url, cal.id)}
                              className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded"
                              title="Copy link"
                            >
                              {copiedLink === cal.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Stage Trigger Mapping */}
                        <div className="mt-4 pt-4 border-t border-[#2D3B5F]">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Zap className="w-4 h-4 text-yellow-400" />
                              <span className="text-[#94A3B8]">Auto-send on stage:</span>
                            </div>
                            <select
                              value={mappedStage?.[0] || ''}
                              onChange={(e) => {
                                const newStageId = e.target.value
                                // Remove from old stage
                                if (mappedStage) {
                                  const oldTrigger = { ...stageTriggers[mappedStage[0]] }
                                  delete oldTrigger.sendCalendly
                                  saveStageTrigger(mappedStage[0], oldTrigger)
                                }
                                // Add to new stage
                                if (newStageId) {
                                  saveStageTrigger(newStageId, {
                                    ...stageTriggers[newStageId],
                                    sendCalendly: cal.slug,
                                  })
                                }
                              }}
                              className="px-3 py-1.5 bg-[#0A0F2C] border border-[#2D3B5F] rounded text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                            >
                              <option value="">Not mapped</option>
                              {PIPELINE_STAGES.map(stage => (
                                <option key={stage.id} value={stage.id}>
                                  {stage.name}
                                </option>
                              ))}
                            </select>
                            {mappedStage && (
                              <span className="text-xs text-green-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </span>
                            )}
                          </div>
                        </div>

                        {/* URL Display */}
                        <div className="mt-3 p-2 bg-[#0A0F2C] rounded font-mono text-xs text-[#64748B] break-all">
                          {cal.url}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empty State */}
            {!calendlyLoading && !calendlyError && calendlyLinks.length === 0 && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                <Calendar className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No Calendly Events Found</h3>
                <p className="text-[#94A3B8] text-sm mb-4">
                  Create event types in Calendly and they'll appear here automatically.
                </p>
                <a
                  href="https://calendly.com/event_types/user/me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Calendly
                </a>
              </div>
            )}
          </div>
        )}

        {/* ==================== PIPELINE STAGES TAB ==================== */}
        {activeTab === 'stages' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Pipeline Stages & Triggers</h2>
                <p className="text-[#94A3B8] text-sm">Configure what happens automatically at each stage</p>
              </div>
            </div>

            {/* Reminder Settings Card */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  Global Reminder Settings
                </h3>
                <button
                  onClick={() => setReminderSettings(prev => ({ ...prev, globalEnabled: !prev.globalEnabled }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    reminderSettings.globalEnabled
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {reminderSettings.globalEnabled ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Disabled
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[#64748B] text-xs mb-1">Frequency (days)</label>
                  <input
                    type="number"
                    value={reminderSettings.defaultFrequencyDays}
                    onChange={(e) => setReminderSettings(prev => ({
                      ...prev,
                      defaultFrequencyDays: parseInt(e.target.value) || 3
                    }))}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] text-xs mb-1">Max Attempts</label>
                  <input
                    type="number"
                    value={reminderSettings.maxAttemptsBeforeEscalation}
                    onChange={(e) => setReminderSettings(prev => ({
                      ...prev,
                      maxAttemptsBeforeEscalation: parseInt(e.target.value) || 3
                    }))}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] text-xs mb-1">Working Hours Start</label>
                  <input
                    type="time"
                    value={reminderSettings.workingHoursStart}
                    onChange={(e) => setReminderSettings(prev => ({
                      ...prev,
                      workingHoursStart: e.target.value
                    }))}
                    disabled={!reminderSettings.workingHoursOnly}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] text-xs mb-1">Working Hours End</label>
                  <input
                    type="time"
                    value={reminderSettings.workingHoursEnd}
                    onChange={(e) => setReminderSettings(prev => ({
                      ...prev,
                      workingHoursEnd: e.target.value
                    }))}
                    disabled={!reminderSettings.workingHoursOnly}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9] disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                  <input
                    type="checkbox"
                    checked={reminderSettings.workingHoursOnly}
                    onChange={(e) => setReminderSettings(prev => ({
                      ...prev,
                      workingHoursOnly: e.target.checked
                    }))}
                    className="rounded bg-[#0A0F2C] border-[#2D3B5F]"
                  />
                  Only send during working hours
                </label>
                <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                  <input
                    type="checkbox"
                    checked={reminderSettings.excludeWeekends}
                    onChange={(e) => setReminderSettings(prev => ({
                      ...prev,
                      excludeWeekends: e.target.checked
                    }))}
                    className="rounded bg-[#0A0F2C] border-[#2D3B5F]"
                  />
                  Exclude weekends
                </label>
              </div>
            </div>

            {/* Stage Timeline with Triggers */}
            <div className="relative">
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-[#2D3B5F]" />
              <div className="space-y-4">
                {PIPELINE_STAGES.map((stage, i) => {
                  const trigger = stageTriggers[stage.id] || {}
                  const isExpanded = expandedStage === stage.id

                  return (
                    <div key={stage.id} className="relative flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full ${stage.color} flex items-center justify-center text-white font-bold z-10 shrink-0`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                          className="w-full p-4 flex items-start justify-between hover:bg-[#2D3B5F]/30 transition-colors"
                        >
                          <div className="text-left">
                            <h3 className="text-white font-medium">{stage.name}</h3>
                            <p className="text-[#64748B] text-sm mt-1">{stage.description}</p>
                            {/* Quick trigger summary */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {trigger.sendEmail && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> Email
                                </span>
                              )}
                              {trigger.sendCalendly && (
                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> Calendly
                                </span>
                              )}
                              {trigger.sendDocuSeal && (
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> DocuSeal
                                </span>
                              )}
                              {trigger.sendTipalti && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded flex items-center gap-1">
                                  💰 Tipalti
                                </span>
                              )}
                              {trigger.sendPortalInvite && (
                                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded flex items-center gap-1">
                                  🚀 Portal
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#64748B] text-xs font-mono bg-[#0A0F2C] px-2 py-1 rounded">
                              {stage.id}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-[#64748B]" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-[#64748B]" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Trigger Config */}
                        {isExpanded && (
                          <div className="border-t border-[#2D3B5F] p-4 bg-[#0A0F2C]/50">
                            <h4 className="text-[#94A3B8] text-sm font-medium mb-3 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-yellow-400" />
                              When partner enters this stage:
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                              {/* Email Template */}
                              <div>
                                <label className="block text-[#64748B] text-xs mb-1">Send Email</label>
                                <select
                                  value={trigger.sendEmail || ''}
                                  onChange={(e) => saveStageTrigger(stage.id, {
                                    ...trigger,
                                    sendEmail: e.target.value || undefined
                                  })}
                                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                                >
                                  <option value="">None</option>
                                  {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Calendly Link */}
                              <div>
                                <label className="block text-[#64748B] text-xs mb-1">Send Calendly</label>
                                <select
                                  value={trigger.sendCalendly || ''}
                                  onChange={(e) => saveStageTrigger(stage.id, {
                                    ...trigger,
                                    sendCalendly: e.target.value || undefined
                                  })}
                                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                                >
                                  <option value="">None</option>
                                  {calendlyLinks.map(c => (
                                    <option key={c.id} value={c.slug}>{c.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* DocuSeal */}
                              <div>
                                <label className="block text-[#64748B] text-xs mb-1">Send Document</label>
                                <select
                                  value={trigger.sendDocuSeal || ''}
                                  onChange={(e) => saveStageTrigger(stage.id, {
                                    ...trigger,
                                    sendDocuSeal: (e.target.value as any) || null
                                  })}
                                  className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                                >
                                  <option value="">None</option>
                                  <option value="loi">Letter of Intent</option>
                                  <option value="contract">Deployment Contract</option>
                                </select>
                              </div>

                              {/* Other actions */}
                              <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                                  <input
                                    type="checkbox"
                                    checked={trigger.sendTipalti || false}
                                    onChange={(e) => saveStageTrigger(stage.id, {
                                      ...trigger,
                                      sendTipalti: e.target.checked
                                    })}
                                    className="rounded bg-[#0A0F2C] border-[#2D3B5F]"
                                  />
                                  Send Tipalti invite
                                </label>
                                <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                                  <input
                                    type="checkbox"
                                    checked={trigger.sendPortalInvite || false}
                                    onChange={(e) => saveStageTrigger(stage.id, {
                                      ...trigger,
                                      sendPortalInvite: e.target.checked
                                    })}
                                    className="rounded bg-[#0A0F2C] border-[#2D3B5F]"
                                  />
                                  Send portal invite
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== EMAIL TEMPLATES TAB ==================== */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Email Templates</h2>
                <p className="text-[#94A3B8] text-sm">Configure automated email content</p>
              </div>
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F]"
              >
                <Sparkles className="w-4 h-4" />
                {showVariables ? 'Hide' : 'Show'} Variables
              </button>
            </div>

            {/* Variables Reference */}
            {showVariables && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
                  Template Variables
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TEMPLATE_VARIABLES.map(v => (
                    <div key={v.token} className="flex flex-col gap-1">
                      <code className="px-2 py-1 bg-[#0A0F2C] text-[#0EA5E9] text-sm rounded font-mono w-fit">
                        {v.token}
                      </code>
                      <span className="text-[#64748B] text-xs">{v.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Templates List */}
            <div className="space-y-3">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#2D3B5F]/30"
                    onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedTemplate === template.id ? (
                        <ChevronDown className="w-5 h-5 text-[#64748B]" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[#64748B]" />
                      )}
                      <div className={`w-3 h-3 rounded-full ${template.enabled ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <div>
                        <h3 className="text-white font-medium">{template.name}</h3>
                        <p className="text-[#64748B] text-sm">{template.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[#94A3B8] bg-[#0A0F2C] px-2 py-1 rounded">
                        {template.trigger}
                      </span>
                      {template.hasCalendly && (
                        <span className="text-xs text-purple-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Calendly
                        </span>
                      )}
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTemplate({ ...template })}
                          className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleTemplateEnabled(template.id)}
                          className={`p-2 rounded ${template.enabled ? 'text-green-400' : 'text-[#64748B]'}`}
                        >
                          {template.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedTemplate === template.id && (
                    <div className="border-t border-[#2D3B5F] p-4 bg-[#0A0F2C]/50">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-[#64748B]">Subject:</span>
                          <p className="text-white mt-1">{template.subject}</p>
                        </div>
                        <div>
                          <span className="text-[#64748B]">CTA Button:</span>
                          <p className="text-white mt-1">{template.ctaText || 'None'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== PROFILE TAB ==================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">My Profile</h2>
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#0EA5E9] flex items-center justify-center text-white text-2xl font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-white text-lg font-medium">{user?.fullName}</h3>
                  <p className="text-[#94A3B8]">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== DROPDOWNS TAB ==================== */}
        {activeTab === 'dropdowns' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Dropdown Options</h2>
                <p className="text-[#94A3B8] text-sm">Manage dropdown field options for forms</p>
              </div>
              <button
                onClick={fetchDropdowns}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F]"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-[#0EA5E9] animate-spin" />
              </div>
            ) : dropdowns.length === 0 ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                <List className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No Dropdowns Configured</h3>
                <p className="text-[#94A3B8] text-sm">Dropdown options will appear here once configured.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dropdowns.map(dropdown => (
                  <div key={dropdown.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                    <h3 className="text-white font-medium">{dropdown.name}</h3>
                    <p className="text-[#64748B] text-sm">{dropdown.options.length} options</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== PREVIEW MODAL ==================== */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#2D3B5F]">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#0EA5E9]" />
                Preview: {previewTemplate.name}
              </h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-3 bg-[#0A0F2C] border-b border-[#2D3B5F]">
              <span className="text-[#64748B] text-sm">Subject: </span>
              <span className="text-white">{replaceVariables(previewTemplate.subject)}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {renderEmailPreview(previewTemplate)}
            </div>
            <div className="flex items-center justify-end p-4 border-t border-[#2D3B5F] gap-2">
              <button
                onClick={() => sendTestEmail(previewTemplate)}
                disabled={testEmailSending}
                className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] flex items-center gap-2"
              >
                {testEmailSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Test
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
