'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import {
  ArrowLeft, Settings, List, GitBranch, Calendar, Mail,
  Plus, Edit, Trash2, GripVertical, Check, X,
  ChevronDown, ChevronRight, Save, RefreshCw,
  ToggleLeft, ToggleRight, AlertCircle, Eye,
  ExternalLink, Copy, Sparkles, Send, CheckCircle
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

type ActiveTab = 'dropdowns' | 'stages' | 'calendly' | 'emails'

// ==========================================
// CONFIGURATION DATA
// ==========================================

// Calendly links will be fetched dynamically from API
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
    footerText: 'Installation typically takes 30-60 minutes per access point.'
  },
  {
    id: 'installScheduled',
    name: 'Installation Scheduled',
    subject: '🔧 Installation Confirmed - {{installDate}}',
    description: 'Confirmation of scheduled installation',
    trigger: 'Install Scheduled',
    triggerStage: 'install_scheduled',
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: [
      "Your SkyYield installation is confirmed! Here are the details:",
      "📅 Date: {{installDate}}\n📍 Location: {{venueAddress}}\n👤 Technician: A SkyYield certified installer",
      "Please ensure someone is available to provide access to the installation areas. The technician will need access to your internet router and the designated mounting locations."
    ],
    ctaType: 'none',
    footerText: 'Need to reschedule? Reply to this email at least 24 hours before your appointment.'
  },
  {
    id: 'trialStarted',
    name: 'Trial Started',
    subject: "🚀 You're Live! Your SkyYield Trial Has Begun",
    description: 'Sent when trial period begins',
    trigger: 'Trial Active',
    triggerStage: 'trial_active',
    hasCalendly: false,
    enabled: true,
    greeting: 'Your Trial Has Begun! 🚀',
    bodyParagraphs: [
      "Hi {{name}},",
      "Great news - {{company}} is now live on the SkyYield network!",
      "Your 60-day trial period has officially started. During this time, you'll be able to see real earnings from WiFi data offloading and experience the full benefits of our platform.",
      "📅 Trial Start: {{trialStartDate}}\n📅 Trial End: {{trialEndDate}}",
      "You'll receive invitations to set up your payment account (Tipalti) and access the Partner Portal shortly."
    ],
    ctaType: 'none',
    footerText: 'Questions about your trial? Reply to this email or visit your Partner Portal.'
  },
  {
    id: 'trialEnding',
    name: 'Trial Ending',
    subject: "⏰ {{daysRemaining}} Days Left - Let's Review Your Trial",
    description: 'Sent 10 days before trial ends',
    trigger: 'Trial Ending (10 days)',
    triggerStage: 'trial_ending',
    hasCalendly: true,
    calendlyLinkId: 'lp_negotiate',
    enabled: true,
    greeting: 'Your Trial Ends in {{daysRemaining}} Days',
    bodyParagraphs: [
      "Hi {{name}},",
      "Your SkyYield trial period is coming to an end soon. We hope you've seen great results from the WiFi data offloading!",
      "Here's a quick summary of your trial:\n💰 Total Earnings: {{trialEarnings}}\n📊 Data Offloaded: {{dataOffloaded}}\n📍 Active Devices: {{activeDevices}}",
      "Let's schedule a quick call to review your earnings, discuss the deployment contract, and answer any questions you have about continuing as a full SkyYield partner."
    ],
    ctaText: 'Schedule Review Call',
    ctaType: 'calendly',
    footerText: "Not ready to continue? Let us know and we'll arrange equipment retrieval."
  },
  {
    id: 'contractReady',
    name: 'Contract Ready',
    subject: '📝 Your SkyYield Deployment Contract is Ready',
    description: 'Sent when full deployment contract is ready',
    trigger: 'Contract Decision → Ready',
    triggerStage: 'contract_decision',
    hasCalendly: false,
    enabled: true,
    greeting: 'Congratulations, {{name}}!',
    bodyParagraphs: [
      "Congratulations on a successful trial! We're thrilled to continue the partnership with {{company}}.",
      "Your Deployment Contract is ready for signature. This contract formalizes our partnership and includes:",
      "✅ Revenue share terms\n✅ Equipment ownership details\n✅ Support and maintenance agreements\n✅ Contract duration and renewal terms",
      "Please review the terms and sign when ready to become an official SkyYield Location Partner."
    ],
    ctaText: 'Review & Sign Contract',
    ctaType: 'custom',
    footerText: 'Have questions about the contract? Reply to this email or call us at (555) 123-4567.'
  },
  {
    id: 'welcomeActive',
    name: 'Welcome to Active Partnership',
    subject: "🎉 Welcome to the SkyYield Family!",
    description: 'Sent when partner becomes fully active',
    trigger: 'Active',
    triggerStage: 'active',
    hasCalendly: false,
    enabled: true,
    greeting: 'Welcome to the SkyYield Family! 🎉',
    bodyParagraphs: [
      "Hi {{name}},",
      "It's official - {{company}} is now a full SkyYield Location Partner!",
      "Thank you for your trust in us. We're committed to helping you maximize your WiFi infrastructure revenue. Here's what you can expect:",
      "💰 Monthly payouts via Tipalti\n📊 Real-time earnings in your Partner Portal\n🔧 24/7 network monitoring and support\n👤 Dedicated partner success manager",
      "Your partner success manager will reach out within 48 hours to introduce themselves and ensure everything is running smoothly."
    ],
    ctaText: 'Access Partner Portal',
    ctaType: 'custom',
    footerText: 'Welcome aboard! We\'re excited to have you as part of the SkyYield network.'
  },
  {
    id: 'tipaltiInvite',
    name: 'Tipalti Payment Invite',
    subject: '💰 Set Up Your Payment Account - Get Paid for WiFi',
    description: 'Manual trigger to send payment setup',
    trigger: 'Manual',
    hasCalendly: false,
    enabled: true,
    greeting: 'Set Up Your Payment Account',
    bodyParagraphs: [
      "Hi {{name}},",
      "To receive your SkyYield earnings, please set up your payment account through Tipalti, our secure payment partner.",
      "This only takes a few minutes and ensures you get paid on time every month. Tipalti supports multiple payment methods:",
      "🏦 Direct Deposit (ACH)\n💳 PayPal\n🌐 Wire Transfer\n📬 Paper Check"
    ],
    ctaText: 'Set Up Payments',
    ctaType: 'custom',
    footerText: 'Payments are processed on the 15th of each month for the previous month\'s earnings.'
  },
  {
    id: 'portalInvite',
    name: 'Portal Access Invite',
    subject: '🔐 Your SkyYield Partner Portal is Ready',
    description: 'Manual trigger to send portal access',
    trigger: 'Manual',
    hasCalendly: false,
    enabled: true,
    greeting: 'Access Your Partner Portal',
    bodyParagraphs: [
      "Hi {{name}},",
      "Your SkyYield Partner Portal is ready! This is your command center for everything SkyYield:",
      "📊 View real-time earnings and data usage\n📱 Monitor device status across all venues\n📄 Download monthly statements and reports\n💬 Contact support directly",
      "Click below to activate your account and set up your password."
    ],
    ctaText: 'Activate Portal Access',
    ctaType: 'custom',
    footerText: 'Bookmark this link for easy access: portal.skyyield.io'
  },
  {
    id: 'monthlyStatement',
    name: 'Monthly Statement',
    subject: '📊 Your {{month}} SkyYield Earnings Statement',
    description: 'Monthly earnings summary',
    trigger: 'Monthly (1st of month)',
    hasCalendly: false,
    enabled: true,
    greeting: 'Your {{month}} Earnings Statement',
    bodyParagraphs: [
      "Hi {{name}},",
      "Here's your earnings summary for {{month}}:",
      "💰 Total Earnings: {{monthlyEarnings}}\n📊 Data Offloaded: {{monthlyData}}\n📍 Active Venues: {{activeVenues}}\n📈 vs Last Month: {{percentChange}}",
      "Your payment will be processed on the 15th and deposited to your Tipalti account.",
      "Want to see detailed analytics? Log into your Partner Portal for venue-by-venue breakdowns."
    ],
    ctaText: 'View Full Report',
    ctaType: 'custom',
    footerText: 'Questions about your statement? Reply to this email.'
  }
]

const TEMPLATE_VARIABLES = [
  { token: '{{name}}', description: "Partner's preferred name" },
  { token: '{{fullName}}', description: "Partner's full name" },
  { token: '{{company}}', description: 'Company DBA or legal name' },
  { token: '{{email}}', description: "Partner's email" },
  { token: '{{trialStartDate}}', description: 'Trial start date' },
  { token: '{{trialEndDate}}', description: 'Trial end date' },
  { token: '{{daysRemaining}}', description: 'Days left in trial' },
  { token: '{{trialEarnings}}', description: 'Trial period earnings' },
  { token: '{{monthlyEarnings}}', description: 'Monthly earnings' },
  { token: '{{installDate}}', description: 'Installation date' },
  { token: '{{venueAddress}}', description: 'Venue address' },
  { token: '{{reason}}', description: 'Denial reason' },
]

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function PipelineSettingsPage() {
  const { user, isLoaded } = useUser()
  const [activeTab, setActiveTab] = useState<ActiveTab>('emails')

  // Dropdowns state
  const [dropdowns, setDropdowns] = useState<Dropdown[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null)
  const [editingOption, setEditingOption] = useState<{ dropdownKey: string; value: string } | null>(null)
  const [newOptionLabel, setNewOptionLabel] = useState('')
  const [newOptionValue, setNewOptionValue] = useState('')
  const [addingTo, setAddingTo] = useState<string | null>(null)

  // Email templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [showVariables, setShowVariables] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [testEmailSent, setTestEmailSent] = useState(false)

  // Calendly state
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [calendlyLinks, setCalendlyLinks] = useState<CalendlyLink[]>([])
  const [calendlyLoading, setCalendlyLoading] = useState(false)
  const [calendlyError, setCalendlyError] = useState<string | null>(null)

  useEffect(() => {
    fetchDropdowns()
    fetchCalendlyLinks()
  }, [])

  const fetchCalendlyLinks = async () => {
    setCalendlyLoading(true)
    setCalendlyError(null)
    try {
      const res = await fetch('/api/pipeline/calendly')
      if (res.ok) {
        const data = await res.json()
        setCalendlyLinks(data.links || [])
      } else {
        const data = await res.json()
        setCalendlyError(data.error || 'Failed to fetch Calendly links')
      }
    } catch (err) {
      console.error('Calendly fetch error:', err)
      setCalendlyError('Failed to connect to Calendly API')
    } finally {
      setCalendlyLoading(false)
    }
  }

  const fetchDropdowns = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pipeline/dropdowns')
      if (res.ok) {
        const data = await res.json()
        setDropdowns(data.dropdowns || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleDropdownOption = async (dropdownKey: string, optionValue: string, currentActive: boolean) => {
    try {
      await fetch('/api/pipeline/dropdowns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: dropdownKey, optionValue, optionUpdates: { isActive: !currentActive } })
      })
      setDropdowns(prev => prev.map(d =>
        d.key === dropdownKey
          ? { ...d, options: d.options.map(o => o.value === optionValue ? { ...o, isActive: !currentActive } : o) }
          : d
      ))
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const updateOptionLabel = async (dropdownKey: string, optionValue: string, newLabel: string) => {
    try {
      await fetch('/api/pipeline/dropdowns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: dropdownKey, optionValue, optionUpdates: { label: newLabel } })
      })
      setDropdowns(prev => prev.map(d =>
        d.key === dropdownKey
          ? { ...d, options: d.options.map(o => o.value === optionValue ? { ...o, label: newLabel } : o) }
          : d
      ))
      setEditingOption(null)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const addDropdownOption = async (dropdownKey: string) => {
    if (!newOptionLabel.trim()) return
    const value = newOptionValue.trim() || newOptionLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    try {
      await fetch('/api/pipeline/dropdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dropdownKey, option: { value, label: newOptionLabel.trim() } })
      })
      setDropdowns(prev => prev.map(d =>
        d.key === dropdownKey
          ? { ...d, options: [...d.options, { value, label: newOptionLabel.trim(), isActive: true, order: d.options.length + 1 }] }
          : d
      ))
      setNewOptionLabel('')
      setNewOptionValue('')
      setAddingTo(null)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const copyCalendlyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedLink(id)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const toggleTemplateEnabled = (templateId: string) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId ? { ...t, enabled: !t.enabled } : t
    ))
  }

  const saveTemplate = (template: EmailTemplate) => {
    setSaveStatus('saving')
    setTemplates(prev => prev.map(t =>
      t.id === template.id ? template : t
    ))
    setTimeout(() => {
      setSaveStatus('saved')
      setEditingTemplate(null)
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 500)
  }

  const sendTestEmail = async (template: EmailTemplate) => {
    setTestEmailSending(true)
    try {
      // Send test email to current user
      const res = await fetch('/api/pipeline/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          partner: {
            id: 'test_partner',
            contactFullName: 'Test Partner',
            contactPreferredName: 'Test',
            contactEmail: user?.primaryEmailAddress?.emailAddress || 'test@example.com',
            companyLegalName: 'Test Company LLC',
            companyDBA: 'Test Company',
          },
          extraData: {
            trialEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            daysRemaining: 10,
          }
        })
      })
      if (res.ok) {
        setTestEmailSent(true)
        setTimeout(() => setTestEmailSent(false), 3000)
      }
    } catch (err) {
      console.error('Test email error:', err)
    } finally {
      setTestEmailSending(false)
    }
  }

  // Sample data for preview
  const sampleData: Record<string, string> = {
    name: 'Sarah',
    fullName: 'Sarah Johnson',
    company: 'Downtown Coffee',
    email: 'sarah@downtowncoffee.com',
    trialStartDate: 'December 1, 2024',
    trialEndDate: 'January 30, 2025',
    daysRemaining: '10',
    trialEarnings: '$342.50',
    monthlyEarnings: '$285.00',
    dataOffloaded: '1.7 TB',
    activeDevices: '3',
    activeVenues: '2',
    installDate: 'December 15, 2024',
    venueAddress: '123 Main St, Atlanta, GA',
    reason: '',
    month: 'November 2024',
    monthlyData: '850 GB',
    percentChange: '+12%',
  }

  const replaceVariables = (text: string) => {
    let result = text
    Object.entries(sampleData).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    })
    return result
  }

  const renderEmailPreview = (template: EmailTemplate) => (
    <div className="bg-[#0A0F2C] rounded-xl overflow-hidden max-w-xl mx-auto shadow-2xl">
      {/* Email Header */}
      <div className="p-6 border-b border-[#2D3B5F]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0EA5E9] to-[#22C55E] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold text-white">SkyYield</span>
        </div>
      </div>

      {/* Email Body */}
      <div className="p-6">
        <h1 className="text-xl font-semibold text-white mb-4">
          {replaceVariables(template.greeting)}
        </h1>

        {template.bodyParagraphs.map((p, i) => (
          <p key={i} className="text-[#94A3B8] mb-4 leading-relaxed whitespace-pre-line">
            {replaceVariables(p)}
          </p>
        ))}

        {template.ctaType !== 'none' && template.ctaText && (
          <button className="mt-4 px-6 py-3 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
            {template.ctaText}
          </button>
        )}

        {template.footerText && (
          <p className="mt-6 pt-4 border-t border-[#2D3B5F] text-sm text-[#64748B] whitespace-pre-line">
            {replaceVariables(template.footerText)}
          </p>
        )}
      </div>

      {/* Email Footer */}
      <div className="p-4 bg-[#070B1A] border-t border-[#2D3B5F] text-center">
        <p className="text-xs text-[#64748B]">
          © 2024 SkyYield. All rights reserved.
          <br />
          <span className="text-[#0EA5E9]">skyyield.io</span>
        </p>
      </div>
    </div>
  )

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
        <div className="max-w-7xl mx-auto">
          <Link href="/admin/pipeline" className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Pipeline
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Settings className="w-8 h-8 text-[#0EA5E9]" />
                Pipeline Settings
              </h1>
              <p className="text-[#94A3B8] mt-1">Configure dropdowns, stages, Calendly links, and email templates</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto pb-2">
            {[
              { id: 'emails', label: 'Email Templates', icon: Mail },
              { id: 'dropdowns', label: 'Dropdowns', icon: List },
              { id: 'stages', label: 'Pipeline Stages', icon: GitBranch },
              { id: 'calendly', label: 'Calendly Links', icon: Calendar },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
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
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ==================== EMAIL TEMPLATES TAB ==================== */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Email Templates</h2>
                <p className="text-[#94A3B8] text-sm">Customize automated pipeline notifications • Sending from noreply@mail.skyyield.io</p>
              </div>
              <button
                onClick={() => setShowVariables(!showVariables)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showVariables ? 'bg-[#0EA5E9] text-white' : 'bg-[#1A1F3A] border border-[#2D3B5F] text-[#94A3B8] hover:bg-[#2D3B5F]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Variables
              </button>
            </div>

            {/* Variables Reference */}
            {showVariables && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
                  Template Variables - Use these in your email content
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                  {/* Template Header */}
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
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTemplate({ ...template })}
                          className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleTemplateEnabled(template.id)}
                          className={`p-2 rounded ${template.enabled ? 'text-green-400' : 'text-[#64748B]'}`}
                          title={template.enabled ? 'Disable' : 'Enable'}
                        >
                          {template.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
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
                        {template.calendlyLinkId && (
                          <div className="col-span-2">
                            <span className="text-[#64748B]">Calendly Link:</span>
                            <p className="text-[#0EA5E9] mt-1 text-xs font-mono">
                              {calendlyLinks.find(c => c.id === template.calendlyLinkId)?.url || 'Not synced yet'}
                            </p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="text-[#64748B]">Preview:</span>
                          <p className="text-[#94A3B8] mt-1 line-clamp-2">
                            {template.bodyParagraphs[0]}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#2D3B5F] flex gap-2">
                        <button
                          onClick={() => sendTestEmail(template)}
                          disabled={testEmailSending}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#2D3B5F] text-white rounded text-sm hover:bg-[#3D4B6F] disabled:opacity-50"
                        >
                          {testEmailSending ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : testEmailSent ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {testEmailSent ? 'Sent!' : 'Send Test Email'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Email Provider Info */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#0EA5E9]" />
                Email Configuration
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <span className="text-[#64748B]">Provider</span>
                  <p className="text-white font-medium mt-1">Resend</p>
                </div>
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <span className="text-[#64748B]">From Address</span>
                  <p className="text-white font-medium mt-1">noreply@mail.skyyield.io</p>
                </div>
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <span className="text-[#64748B]">Reply-To</span>
                  <p className="text-white font-medium mt-1">info@skyyield.io</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" />
                Domain verified and ready to send
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
            ) : (
              <div className="space-y-4">
                {dropdowns.map(dropdown => (
                  <div key={dropdown.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedDropdown(expandedDropdown === dropdown.key ? null : dropdown.key)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[#2D3B5F]/30"
                    >
                      <div className="flex items-center gap-3">
                        {expandedDropdown === dropdown.key ? (
                          <ChevronDown className="w-5 h-5 text-[#64748B]" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-[#64748B]" />
                        )}
                        <div className="text-left">
                          <h3 className="text-white font-medium">{dropdown.name}</h3>
                          <p className="text-[#64748B] text-sm">
                            {dropdown.options.filter(o => o.isActive).length} active
                            {dropdown.allowCustom && ' • Custom allowed'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[#64748B] text-sm font-mono">{dropdown.key}</span>
                    </button>

                    {expandedDropdown === dropdown.key && (
                      <div className="border-t border-[#2D3B5F] p-4">
                        <div className="space-y-2">
                          {dropdown.options.sort((a, b) => a.order - b.order).map(option => (
                            <div
                              key={option.value}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                option.isActive ? 'bg-[#0A0F2C]' : 'bg-[#0A0F2C]/50 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <GripVertical className="w-4 h-4 text-[#64748B] cursor-grab" />
                                {editingOption?.dropdownKey === dropdown.key && editingOption?.value === option.value ? (
                                  <input
                                    type="text"
                                    defaultValue={option.label}
                                    autoFocus
                                    onBlur={(e) => updateOptionLabel(dropdown.key, option.value, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') updateOptionLabel(dropdown.key, option.value, e.currentTarget.value)
                                      if (e.key === 'Escape') setEditingOption(null)
                                    }}
                                    className="px-2 py-1 bg-[#1A1F3A] border border-[#0EA5E9] rounded text-white text-sm focus:outline-none"
                                  />
                                ) : (
                                  <span className="text-white">{option.label}</span>
                                )}
                                <span className="text-[#64748B] text-xs font-mono">({option.value})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingOption({ dropdownKey: dropdown.key, value: option.value })}
                                  className="p-1.5 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => toggleDropdownOption(dropdown.key, option.value, option.isActive)}
                                  className={`p-1.5 rounded ${option.isActive ? 'text-green-400 hover:bg-green-500/20' : 'text-[#64748B] hover:bg-[#2D3B5F]'}`}
                                >
                                  {option.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {addingTo === dropdown.key ? (
                          <div className="mt-4 p-3 bg-[#0A0F2C] rounded-lg border border-[#0EA5E9]">
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                placeholder="Label"
                                value={newOptionLabel}
                                onChange={(e) => setNewOptionLabel(e.target.value)}
                                className="flex-1 px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white text-sm placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                              />
                              <input
                                type="text"
                                placeholder="Value (auto)"
                                value={newOptionValue}
                                onChange={(e) => setNewOptionValue(e.target.value)}
                                className="w-40 px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white text-sm placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] font-mono"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => { setAddingTo(null); setNewOptionLabel(''); setNewOptionValue('') }}
                                className="px-3 py-1.5 text-[#94A3B8] hover:text-white text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => addDropdownOption(dropdown.key)}
                                disabled={!newOptionLabel.trim()}
                                className="px-3 py-1.5 bg-[#0EA5E9] text-white rounded text-sm hover:bg-[#0EA5E9]/80 disabled:opacity-50"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingTo(dropdown.key)}
                            className="mt-4 flex items-center gap-2 px-4 py-2 text-[#0EA5E9] hover:bg-[#0EA5E9]/10 rounded-lg text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Add Option
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== STAGES TAB ==================== */}
        {activeTab === 'stages' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Pipeline Stages</h2>
              <p className="text-[#94A3B8] text-sm">Location Partner onboarding workflow</p>
            </div>

            <div className="relative">
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-[#2D3B5F]" />
              <div className="space-y-4">
                {PIPELINE_STAGES.map((stage, i) => (
                  <div key={stage.id} className="relative flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full ${stage.color} flex items-center justify-center text-white font-bold z-10 shrink-0`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-medium">{stage.name}</h3>
                          <p className="text-[#64748B] text-sm mt-1">{stage.description}</p>
                        </div>
                        <span className="text-[#64748B] text-xs font-mono bg-[#0A0F2C] px-2 py-1 rounded">
                          {stage.id}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#2D3B5F] flex gap-3">
                        {stage.requiresApproval && (
                          <span className="text-xs text-yellow-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Requires approval
                          </span>
                        )}
                        {stage.hasCalendly && (
                          <span className="text-xs text-purple-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Calendly auto-sent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
                    <p className="text-[#94A3B8] text-sm mt-2">
                      Make sure you've added <code className="px-1 py-0.5 bg-[#0A0F2C] rounded">CALENDLY_API_KEY</code> to your environment variables.
                      <br />
                      Get your API key from{' '}
                      <a href="https://calendly.com/integrations/api_webhooks" target="_blank" rel="noopener noreferrer" className="text-[#0EA5E9] hover:underline">
                        Calendly Integrations
                      </a>
                    </p>
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

            {/* Calendly Links List */}
            {!calendlyLoading && !calendlyError && calendlyLinks.length > 0 && (
              <div className="space-y-3">
                {calendlyLinks.map(cal => (
                  <div key={cal.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
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
                    <div className="mt-3 p-2 bg-[#0A0F2C] rounded font-mono text-xs text-[#64748B] break-all">
                      {cal.url}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Webhook Setup Info */}
            {!calendlyError && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
                  Auto-Sync Setup
                </h4>
                <p className="text-[#94A3B8] text-sm">
                  To automatically sync when Calendly events are created, updated, or when someone books a call:
                </p>
                <ol className="mt-2 space-y-1 text-sm text-[#64748B]">
                  <li>1. Add your <code className="px-1 py-0.5 bg-[#0A0F2C] rounded">CALENDLY_API_KEY</code> to .env.local</li>
                  <li>2. Deploy your app</li>
                  <li>3. Call <code className="px-1 py-0.5 bg-[#0A0F2C] rounded">POST /api/pipeline/calendly</code> with <code className="px-1 py-0.5 bg-[#0A0F2C] rounded">{`{"action": "subscribe"}`}</code></li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== EDIT TEMPLATE MODAL ==================== */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2D3B5F]">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#0EA5E9]" />
                Edit: {editingTemplate.name}
              </h3>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Subject Line</label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              {/* Greeting */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Greeting</label>
                <input
                  type="text"
                  value={editingTemplate.greeting}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, greeting: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  placeholder="e.g., Welcome to SkyYield, {{name}}!"
                />
              </div>

              {/* Body Paragraphs */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Email Body (one paragraph per box)</label>
                {editingTemplate.bodyParagraphs.map((p, i) => (
                  <div key={i} className="mb-2 relative">
                    <textarea
                      value={p}
                      onChange={(e) => {
                        const newParagraphs = [...editingTemplate.bodyParagraphs]
                        newParagraphs[i] = e.target.value
                        setEditingTemplate({ ...editingTemplate, bodyParagraphs: newParagraphs })
                      }}
                      rows={3}
                      className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] resize-none pr-10"
                    />
                    {editingTemplate.bodyParagraphs.length > 1 && (
                      <button
                        onClick={() => {
                          const newParagraphs = editingTemplate.bodyParagraphs.filter((_, idx) => idx !== i)
                          setEditingTemplate({ ...editingTemplate, bodyParagraphs: newParagraphs })
                        }}
                        className="absolute top-2 right-2 p-1 text-[#64748B] hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setEditingTemplate({
                    ...editingTemplate,
                    bodyParagraphs: [...editingTemplate.bodyParagraphs, '']
                  })}
                  className="text-sm text-[#0EA5E9] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Paragraph
                </button>
              </div>

              {/* CTA Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">CTA Type</label>
                  <select
                    value={editingTemplate.ctaType}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, ctaType: e.target.value as any })}
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="none">No Button</option>
                    <option value="calendly">Calendly Link</option>
                    <option value="custom">Custom URL</option>
                  </select>
                </div>
                {editingTemplate.ctaType !== 'none' && (
                  <div>
                    <label className="block text-[#94A3B8] text-sm mb-2">Button Text</label>
                    <input
                      type="text"
                      value={editingTemplate.ctaText || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, ctaText: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                )}
              </div>

              {/* Calendly Link Selection */}
              {editingTemplate.ctaType === 'calendly' && (
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">Calendly Event</label>
                  <select
                    value={editingTemplate.calendlyLinkId || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, calendlyLinkId: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="">Select Calendly Event</option>
                    {calendlyLinks.map(cal => (
                      <option key={cal.id} value={cal.id}>{cal.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Footer */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Footer Note</label>
                <textarea
                  value={editingTemplate.footerText || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, footerText: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] resize-none"
                />
              </div>

              {/* Trigger Info */}
              <div className="p-4 bg-[#0A0F2C] rounded-lg border border-[#2D3B5F]">
                <div className="flex items-center gap-2 text-[#94A3B8] text-sm mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Trigger Configuration (read-only)
                </div>
                <p className="text-white">{editingTemplate.trigger}</p>
                {editingTemplate.triggerStage && (
                  <p className="text-[#64748B] text-sm mt-1">
                    Stage: {editingTemplate.triggerStage}
                    {editingTemplate.triggerAction && ` → ${editingTemplate.triggerAction}`}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#2D3B5F]">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 text-[#94A3B8] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => setPreviewTemplate(editingTemplate)}
                className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button
                onClick={() => saveTemplate(editingTemplate)}
                disabled={saveStatus === 'saving'}
                className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 flex items-center gap-2 disabled:opacity-50"
              >
                {saveStatus === 'saving' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PREVIEW MODAL ==================== */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Preview Header */}
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

            {/* Preview Subject */}
            <div className="px-4 py-3 bg-[#0A0F2C] border-b border-[#2D3B5F]">
              <span className="text-[#64748B] text-sm">Subject: </span>
              <span className="text-white">{replaceVariables(previewTemplate.subject)}</span>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {renderEmailPreview(previewTemplate)}
            </div>

            {/* Preview Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[#2D3B5F]">
              <span className="text-[#64748B] text-sm">
                Using sample data for preview
              </span>
              <div className="flex gap-2">
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
        </div>
      )}
    </div>
  )
}