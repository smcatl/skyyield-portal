'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import CryptoPriceHeader from '@/components/CryptoPriceHeader'
import CRMTab from '@/components/admin/crm/CRMTab'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PreviewPortalDropdown } from '@/components/admin/PreviewPortalDropdown'
import AdminPayments from '@/components/admin/AdminPayments'
import { AddRoleModal } from '@/components/admin/AddRoleModal'
import AdminBlog from '@/components/admin/AdminBlog'
import { VenuesTab, DevicesTab, AnalyticsTab } from '@/components/admin'
import CommissionManagement from '@/components/admin/CommissionManagement'
import {
  ArrowLeft, Users, FileText, ShoppingBag, BarChart3,
  CheckCircle, Clock, Package, TrendingUp,
  RefreshCw, Check, X, Search, Plus, Edit, Edit3, Trash2, Eye, Star,
  Upload, ToggleLeft, ToggleRight, Calculator, MapPin, Target,
  Activity, DollarSign, Building2, Lock, ClipboardList, ExternalLink,
  Copy, Inbox, Settings, Mail, Calendar, Send, GitBranch, List,
  ChevronDown, ChevronRight, Save, AlertCircle, Sparkles,
  GripVertical, Phone, MoreVertical, Filter, UserPlus,
  CreditCard, Wallet, PieChart, MessageSquare, Bell,
  SkipForward, AlertTriangle, Pause, Play, Archive, History,
  Key, Shield, User, BookOpen, Video, Wifi
} from 'lucide-react'
// removed TipaltiIFrame import

type TabType = 'overview' | 'users' | 'crm' | 'pipeline' | 'followups' | 'venues' | 'devices' | 'device-purchases' | 'products' | 'approved-products' | 'blog' | 'forms' | 'materials' | 'calculators' | 'payments' | 'commissions' | 'settings' | 'analytics'

// Pipeline and Settings types
interface FollowUpAttempt {
  id: string
  type: 'email' | 'sms' | 'call'
  sentAt: string
  sentBy: string
  note?: string
  response?: string
}

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
  // Follow-up tracking fields
  waitingFor?: 'calendly_discovery' | 'calendly_install' | 'calendly_review' | 'docuseal_loi' | 'docuseal_contract' | 'tipalti_setup' | 'portal_setup' | 'equipment_delivery' | 'other'
  waitingForLabel?: string
  waitingSince?: string
  followUpAttempts?: FollowUpAttempt[]
  lastContactDate?: string
  nextFollowUpDate?: string
  followUpNotes?: string
  status?: 'active' | 'inactive' | 'paused'
  partnerType?: string
}

// Waiting item for the follow-up queue
interface WaitingItem {
  partnerId: string
  partnerName: string
  partnerEmail: string
  partnerPhone: string
  companyName: string
  companyCity?: string
  companyState?: string
  stage: string
  stageName: string
  waitingFor: string
  waitingForLabel: string
  waitingForCategory: string
  waitingSince: string
  daysPending: number
  attemptCount: number
  lastAttemptDate?: string
  lastAttemptType?: string
  nextFollowUpDate?: string
  notes?: string
  priority: 'high' | 'medium' | 'low'
  partnerType: string
  partnerStatus: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  description: string
  trigger: string
  hasCalendly: boolean
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
  color: string
}

interface Dropdown {
  id: string
  key: string
  name: string
  options: { value: string; label: string; isActive: boolean; order: number }[]
  allowCustom: boolean
}

// Constants
const USER_TYPES = [
  'Administrator', 'Employee', 'Location Partner', 'Referral Partner',
  'Channel Partner', 'Relationship Partner', 'Contractor', 'Customer', 'Calculator Access'
]

// Location Partner stages (full flow with site survey, trial, contract)
const LP_PIPELINE_STAGES = [
  { id: 'application', name: 'Application', color: 'border-blue-500', bgColor: 'bg-blue-500', waitingFor: null },
  { id: 'initial_review', name: 'Initial Review', color: 'border-yellow-500', bgColor: 'bg-yellow-500', waitingFor: null },
  { id: 'discovery_scheduled', name: 'Discovery', color: 'border-purple-500', bgColor: 'bg-purple-500', waitingFor: 'calendly_discovery' },
  { id: 'discovery_complete', name: 'Post-Call', color: 'border-yellow-500', bgColor: 'bg-yellow-500', waitingFor: null },
  { id: 'venues_setup', name: 'Venues Setup', color: 'border-cyan-500', bgColor: 'bg-cyan-500', waitingFor: null },
  { id: 'loi_sent', name: 'LOI Sent', color: 'border-orange-500', bgColor: 'bg-orange-500', waitingFor: 'docuseal_loi' },
  { id: 'loi_signed', name: 'LOI Signed', color: 'border-green-500', bgColor: 'bg-green-500', waitingFor: null },
  { id: 'install_scheduled', name: 'Install', color: 'border-pink-500', bgColor: 'bg-pink-500', waitingFor: 'calendly_install' },
  { id: 'trial_active', name: 'Trial', color: 'border-indigo-500', bgColor: 'bg-indigo-500', waitingFor: null },
  { id: 'trial_ending', name: 'Trial Ending', color: 'border-amber-500', bgColor: 'bg-amber-500', waitingFor: 'calendly_review' },
  { id: 'contract_sent', name: 'Contract Sent', color: 'border-orange-500', bgColor: 'bg-orange-500', waitingFor: 'docuseal_contract' },
  { id: 'active', name: 'Active', color: 'border-green-500', bgColor: 'bg-green-500', waitingFor: null },
  { id: 'inactive', name: 'Inactive', color: 'border-gray-500', bgColor: 'bg-gray-500', waitingFor: null },
]

// Simple partner stages (Referral, Relationship, Channel, Contractor) - agreement then invite
const SIMPLE_PIPELINE_STAGES = [
  { id: 'application', name: 'Application', color: 'border-blue-500', bgColor: 'bg-blue-500', waitingFor: null },
  { id: 'initial_review', name: 'Initial Review', color: 'border-yellow-500', bgColor: 'bg-yellow-500', waitingFor: null },
  { id: 'discovery_scheduled', name: 'Discovery', color: 'border-purple-500', bgColor: 'bg-purple-500', waitingFor: 'calendly_discovery' },
  { id: 'discovery_complete', name: 'Post-Call', color: 'border-yellow-500', bgColor: 'bg-yellow-500', waitingFor: null },
  { id: 'agreement_sent', name: 'Agreement Sent', color: 'border-orange-500', bgColor: 'bg-orange-500', waitingFor: 'docuseal_agreement' },
  { id: 'agreement_signed', name: 'Agreement Signed', color: 'border-green-500', bgColor: 'bg-green-500', waitingFor: null },
  { id: 'tipalti_setup', name: 'Payment Setup', color: 'border-pink-500', bgColor: 'bg-pink-500', waitingFor: 'tipalti_setup' },
  { id: 'active', name: 'Active', color: 'border-green-500', bgColor: 'bg-green-500', waitingFor: null },
  { id: 'inactive', name: 'Inactive', color: 'border-gray-500', bgColor: 'bg-gray-500', waitingFor: null },
]

// Default stages (for backward compat, same as LP)
const PIPELINE_STAGES = LP_PIPELINE_STAGES

// Helper to get stages based on partner type
const getStagesForPartnerType = (partnerType: string) => {
  if (partnerType === 'Location Partner' || !partnerType) {
    return LP_PIPELINE_STAGES
  }
  return SIMPLE_PIPELINE_STAGES
}

const WAITING_TYPES = [
  { id: 'calendly_discovery', label: 'Waiting: Book Discovery Call', shortLabel: 'Discovery Call', icon: '📅', category: 'calendly', description: 'Partner needs to book their discovery call' },
  { id: 'calendly_install', label: 'Waiting: Book Install Appointment', shortLabel: 'Install Booking', icon: '🔧', category: 'calendly', description: 'Partner needs to schedule installation' },
  { id: 'calendly_review', label: 'Waiting: Book Review Call', shortLabel: 'Review Call', icon: '📊', category: 'calendly', description: 'Partner needs to book trial review call' },
  { id: 'docuseal_loi', label: 'Waiting: Sign LOI', shortLabel: 'LOI Signature', icon: '📝', category: 'docuseal', description: 'Partner needs to sign Letter of Intent' },
  { id: 'docuseal_agreement', label: 'Waiting: Sign Agreement', shortLabel: 'Agreement', icon: '📝', category: 'docuseal', description: 'Partner needs to sign partner agreement' },
  { id: 'docuseal_contract', label: 'Waiting: Sign Contract', shortLabel: 'Contract', icon: '📄', category: 'docuseal', description: 'Partner needs to sign deployment contract' },
  { id: 'tipalti_setup', label: 'Waiting: Setup Payment', shortLabel: 'Tipalti Setup', icon: '💰', category: 'tipalti', description: 'Partner needs to complete Tipalti setup' },
  { id: 'portal_setup', label: 'Waiting: Activate Portal', shortLabel: 'Portal Setup', icon: '🔐', category: 'portal', description: 'Partner needs to activate their portal' },
  { id: 'equipment_delivery', label: 'Waiting: Equipment Arrival', shortLabel: 'Equipment', icon: '📦', category: 'logistics', description: 'Equipment in transit to partner' },
  { id: 'venue_info', label: 'Waiting: Venue Details', shortLabel: 'Venue Info', icon: '🏢', category: 'info', description: 'Partner needs to provide venue information' },
  { id: 'response', label: 'Waiting: Response', shortLabel: 'Response', icon: '💬', category: 'communication', description: 'Waiting for partner to respond' },
  { id: 'other', label: 'Waiting: Other', shortLabel: 'Other', icon: '⏳', category: 'other', description: 'Other pending item' },
]

// Partner status options for filtering
const PARTNER_STATUSES = ['active', 'inactive', 'paused', 'pending']

// Partner types for filtering
const PARTNER_TYPES = ['Location Partner', 'Referral Partner', 'Channel Partner', 'Relationship Partner', 'Contractor']

const REMINDER_THRESHOLDS = {
  first: 3,      // Days before first reminder
  second: 7,     // Days before second reminder  
  third: 14,     // Days before third reminder
  inactive: 30,  // Days before marking inactive
}

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'applicationApproved', name: 'Application Approved',
    subject: '🎉 Welcome to SkyYield - Schedule Your Discovery Call',
    description: 'Sent when admin approves initial application',
    trigger: 'Initial Review → Approved', hasCalendly: true, enabled: true,
    greeting: 'Welcome to SkyYield, {{name}}!',
    bodyParagraphs: [
      "Great news! Your application to become a SkyYield Location Partner has been approved.",
      "We're excited to learn more about {{company}} and explore how we can help you monetize your WiFi infrastructure."
    ],
    ctaText: 'Schedule Discovery Call', ctaType: 'calendly',
    footerText: "Can't make the available times? Reply to this email."
  },
  {
    id: 'applicationDenied', name: 'Application Denied',
    subject: 'SkyYield Application Update',
    description: 'Sent when admin denies initial application',
    trigger: 'Initial Review → Denied', hasCalendly: false, enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: [
      "Thank you for your interest in partnering with SkyYield.",
      "After reviewing your application, we've determined that {{company}} isn't the right fit for our program at this time.",
      "This decision may be based on location, venue type, or current network capacity. We encourage you to reapply in the future."
    ],
    ctaText: '', ctaType: 'none',
    footerText: 'Questions? Reply to this email.'
  },
  {
    id: 'postCallApproved', name: 'Post-Discovery Approved',
    subject: '✅ Next Steps: Add Your Venues',
    description: 'Sent after successful discovery call',
    trigger: 'Discovery → Post-Call Approved', hasCalendly: false, enabled: true,
    greeting: 'Great talking with you, {{name}}!',
    bodyParagraphs: [
      "Thanks for taking the time to discuss {{company}} with us. We're excited to move forward!",
      "Your next step is to add your venue details. This helps us prepare the right equipment and estimate your earnings potential."
    ],
    ctaText: 'Add Venue Details', ctaType: 'custom',
    footerText: 'Need help? Reply to this email or call us at (678) 203-5517.'
  },
  {
    id: 'postCallDenied', name: 'Post-Discovery Declined',
    subject: 'SkyYield Partnership Update',
    description: 'Sent after discovery call if not proceeding',
    trigger: 'Discovery → Post-Call Denied', hasCalendly: false, enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: [
      "Thank you for speaking with us about {{company}}.",
      "After our discovery call, we've determined that we're not able to move forward with a partnership at this time.",
      "This could be due to technical requirements, location constraints, or other factors. Feel free to reach out in the future if circumstances change."
    ],
    ctaText: '', ctaType: 'none',
    footerText: 'We appreciate your interest in SkyYield.'
  },
  {
    id: 'loiSent', name: 'LOI Sent',
    subject: '📝 Your SkyYield Letter of Intent is Ready',
    description: 'Sent when LOI document is sent via DocuSeal',
    trigger: 'Venues Setup → LOI Sent', hasCalendly: false, enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: [
      "Great news! We've prepared your Letter of Intent for {{company}}.",
      "This document outlines the terms of our trial partnership, including equipment installation, revenue sharing, and trial period details.",
      "Please review and sign the document at your earliest convenience."
    ],
    ctaText: 'Review & Sign LOI', ctaType: 'custom',
    footerText: 'Questions about the terms? Reply to this email or call us.'
  },
  {
    id: 'loiSigned', name: 'LOI Signed - Schedule Install',
    subject: '🎉 LOI Signed! Let\'s Schedule Your Installation',
    description: 'Sent when partner signs LOI',
    trigger: 'LOI Sent → LOI Signed', hasCalendly: true, enabled: true,
    greeting: 'Congratulations, {{name}}!',
    bodyParagraphs: [
      "We've received your signed Letter of Intent. Welcome to the SkyYield family!",
      "Next up: Let's schedule your equipment installation. Our technician will come to {{company}} and set everything up - typically takes 30-60 minutes."
    ],
    ctaText: 'Schedule Installation', ctaType: 'calendly',
    footerText: 'Installation typically takes 30-60 minutes. Our tech brings all equipment.'
  },
  {
    id: 'trialStarted', name: 'Trial Started',
    subject: '🚀 Your SkyYield Trial Has Begun!',
    description: 'Sent when trial period starts after installation',
    trigger: 'Install → Trial Active', hasCalendly: false, enabled: true,
    greeting: 'You\'re live, {{name}}!',
    bodyParagraphs: [
      "Your SkyYield equipment is installed and your 60-day trial has officially begun!",
      "During the trial, you can monitor your network performance and earnings through your Partner Portal.",
      "Trial End Date: {{trialEndDate}}"
    ],
    ctaText: 'View Your Dashboard', ctaType: 'custom',
    footerText: 'Questions? Your dedicated account manager is here to help.'
  },
  {
    id: 'trialEnding', name: 'Trial Ending - 10 Day Notice',
    subject: '⏰ Your SkyYield Trial Ends in {{daysRemaining}} Days',
    description: 'Sent 10 days before trial ends',
    trigger: 'Auto: 10 days before trial end', hasCalendly: true, enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: [
      "Your SkyYield trial at {{company}} is coming to an end in {{daysRemaining}} days.",
      "So far, you've earned ${{trialEarnings}} during your trial period!",
      "Let's schedule a quick call to review your results and discuss making this a permanent partnership."
    ],
    ctaText: 'Schedule Review Call', ctaType: 'calendly',
    footerText: 'Don\'t want to continue? Let us know and we\'ll schedule equipment pickup.'
  },
  {
    id: 'contractSent', name: 'Deployment Contract Sent',
    subject: '📄 Your SkyYield Deployment Contract',
    description: 'Sent when full contract is sent after successful trial',
    trigger: 'Trial Review → Contract Sent', hasCalendly: false, enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: [
      "Congratulations on a successful trial! We're ready to make this official.",
      "We've sent your deployment contract for {{company}}. This document outlines our ongoing partnership terms.",
      "Your trial earnings of ${{trialEarnings}} demonstrate the potential for continued passive income."
    ],
    ctaText: 'Review & Sign Contract', ctaType: 'custom',
    footerText: 'Questions about the contract? Let\'s schedule a call.'
  },
  {
    id: 'portalInvite', name: 'Portal Access Invite',
    subject: '🔐 Your SkyYield Partner Portal is Ready',
    description: 'Manual trigger to send portal access',
    trigger: 'Manual', hasCalendly: false, enabled: true,
    greeting: 'Access Your Partner Portal',
    bodyParagraphs: [
      "Hi {{name}},",
      "Your SkyYield Partner Portal is ready! This is your dashboard for tracking earnings, viewing network status, and managing your account."
    ],
    ctaText: 'Activate Portal Access', ctaType: 'custom',
    footerText: 'Bookmark this link for easy access: portal.skyyield.io'
  },
  {
    id: 'tipaltiInvite', name: 'Tipalti Payment Setup',
    subject: '💰 Set Up Your Payment Account',
    description: 'Manual trigger to send payment setup',
    trigger: 'Manual', hasCalendly: false, enabled: true,
    greeting: 'Set Up Your Payment Account',
    bodyParagraphs: [
      "Hi {{name}},",
      "To receive your SkyYield earnings, please set up your payment account through Tipalti.",
      "Tipalti is our secure payment processor. You can choose direct deposit, PayPal, or check."
    ],
    ctaText: 'Set Up Payments', ctaType: 'custom',
    footerText: 'Payments are processed on the 15th of each month.'
  },
  {
    id: 'reminderCalendly', name: 'Reminder: Schedule Call',
    subject: '📅 Reminder: Schedule Your SkyYield Call',
    description: 'Follow-up reminder for unscheduled Calendly',
    trigger: 'Manual / Auto Follow-up', hasCalendly: true, enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: [
      "We noticed you haven't scheduled your call yet. We're excited to connect with you!",
      "Click below to pick a time that works for your schedule."
    ],
    ctaText: 'Schedule Now', ctaType: 'calendly',
    footerText: 'Can\'t find a good time? Reply to this email and we\'ll work something out.'
  },
  {
    id: 'reminderDocument', name: 'Reminder: Sign Document',
    subject: '📝 Reminder: Your SkyYield Document Awaits',
    description: 'Follow-up reminder for unsigned DocuSeal',
    trigger: 'Manual / Auto Follow-up', hasCalendly: false, enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: [
      "Just a friendly reminder that your document is waiting for your signature.",
      "If you have any questions about the terms, please don't hesitate to reach out."
    ],
    ctaText: 'View Document', ctaType: 'custom',
    footerText: 'Questions? Reply to this email or call (678) 203-5517.'
  }
]

// Default Calendly links (will be replaced by API data when connected)
const DEFAULT_CALENDLY_LINKS: CalendlyLink[] = [
  {
    id: 'discovery-call',
    name: 'Discovery Call',
    slug: 'skyyield-discovery',
    url: 'https://calendly.com/skyyield/discovery-call',
    duration: 30,
    description: 'Initial conversation to learn about your venue and discuss partnership potential',
    active: true,
    color: '#0EA5E9'
  },
  {
    id: 'technical-review',
    name: 'Technical Review',
    slug: 'skyyield-technical',
    url: 'https://calendly.com/skyyield/technical-review',
    duration: 45,
    description: 'Deep dive into technical requirements, network setup, and equipment needs',
    active: true,
    color: '#8B5CF6'
  },
  {
    id: 'install-scheduling',
    name: 'Install Scheduling',
    slug: 'skyyield-install',
    url: 'https://calendly.com/skyyield/install',
    duration: 30,
    description: 'Schedule your equipment installation appointment',
    active: true,
    color: '#10B981'
  },
  {
    id: 'trial-review',
    name: 'Trial Review Call',
    slug: 'skyyield-trial-review',
    url: 'https://calendly.com/skyyield/trial-review',
    duration: 30,
    description: 'Review your trial results and discuss next steps',
    active: true,
    color: '#F59E0B'
  },
  {
    id: 'partner-onboarding',
    name: 'Partner Onboarding',
    slug: 'skyyield-onboarding',
    url: 'https://calendly.com/skyyield/onboarding',
    duration: 60,
    description: 'Full onboarding session for new active partners',
    active: true,
    color: '#EC4899'
  },
  {
    id: 'support-call',
    name: 'Support Call',
    slug: 'skyyield-support',
    url: 'https://calendly.com/skyyield/support',
    duration: 15,
    description: 'Quick support call for existing partners',
    active: true,
    color: '#6366F1'
  }
]

// Calculator venue profiles - expanded with all venue types
const VENUE_CATEGORIES: Record<string, string[]> = {
  "Food & Beverage": ["restaurant_fastfood", "restaurant_sitdown", "cafe_coffee", "bar", "nightclub"],
  "Retail": ["convenience_gas", "convenience_nogas", "grocery", "retail_small", "retail_bigbox", "mall"],
  "Residential": ["apartment_single", "apartment_midrise", "apartment_highrise", "student_housing"],
  "Hospitality": ["hotel_single", "hotel_midrise", "hotel_highrise"],
  "Services": ["hair_salon", "pet_groomer", "medical_office", "animal_hospital", "daycare"],
  "Education": ["college", "school_k5", "school_middle", "school_high"],
  "Recreation": ["dog_park", "stadium", "museum", "library", "gym"],
  "Transportation": ["airport", "transit_station"],
  "Workspace": ["coworking", "office_building"],
}

const VENUE_PROFILES: Record<string, { name: string; wifiMultiplier: number; avgDwell: string; description?: string }> = {
  // Food & Beverage
  restaurant_fastfood: { name: "Fast Food Restaurant", wifiMultiplier: 1.3, avgDwell: "15-25 min", description: "Quick service restaurants" },
  restaurant_sitdown: { name: "Sit-Down Restaurant", wifiMultiplier: 1.5, avgDwell: "45-90 min", description: "Casual & fine dining" },
  cafe_coffee: { name: "Café / Coffee Shop", wifiMultiplier: 1.6, avgDwell: "30-60 min", description: "Coffee shops, bakeries" },
  bar: { name: "Bar / Pub", wifiMultiplier: 1.5, avgDwell: "60-120 min", description: "Sports bars, pubs, lounges" },
  nightclub: { name: "Nightclub", wifiMultiplier: 1.4, avgDwell: "2-4 hrs", description: "Dance clubs, venues" },
  // Retail
  convenience_gas: { name: "Convenience Store (w/ Gas)", wifiMultiplier: 1.2, avgDwell: "5-10 min", description: "Gas stations with stores" },
  convenience_nogas: { name: "Convenience Store", wifiMultiplier: 1.2, avgDwell: "5-15 min", description: "Standalone convenience stores" },
  grocery: { name: "Grocery Store", wifiMultiplier: 1.3, avgDwell: "20-45 min", description: "Supermarkets, grocery chains" },
  retail_small: { name: "Retail Store", wifiMultiplier: 1.3, avgDwell: "15-30 min", description: "Boutiques, specialty stores" },
  retail_bigbox: { name: "Big Box Retail", wifiMultiplier: 1.3, avgDwell: "30-60 min", description: "Target, Walmart, Costco" },
  mall: { name: "Shopping Mall", wifiMultiplier: 1.5, avgDwell: "1-3 hrs", description: "Indoor malls, outlets" },
  // Residential
  apartment_single: { name: "Apartment (Single Level)", wifiMultiplier: 2.0, avgDwell: "Resident", description: "Garden-style apartments" },
  apartment_midrise: { name: "Apartment (Midrise)", wifiMultiplier: 2.0, avgDwell: "Resident", description: "4-12 story apartments" },
  apartment_highrise: { name: "Apartment (Highrise)", wifiMultiplier: 2.0, avgDwell: "Resident", description: "12+ story apartments" },
  student_housing: { name: "Student Housing", wifiMultiplier: 2.2, avgDwell: "Resident", description: "Dorms, off-campus housing" },
  // Hospitality
  hotel_single: { name: "Hotel (Single Level)", wifiMultiplier: 2.0, avgDwell: "1-3 nights", description: "Motels, budget hotels" },
  hotel_midrise: { name: "Hotel (Midrise)", wifiMultiplier: 2.2, avgDwell: "1-3 nights", description: "Business hotels, mid-tier" },
  hotel_highrise: { name: "Hotel (Highrise)", wifiMultiplier: 2.3, avgDwell: "1-5 nights", description: "Full-service, luxury hotels" },
  // Services
  hair_salon: { name: "Hair Salon / Spa", wifiMultiplier: 1.5, avgDwell: "45-90 min", description: "Salons, barbershops, spas" },
  pet_groomer: { name: "Pet Groomer", wifiMultiplier: 1.5, avgDwell: "30-60 min", description: "Pet grooming services" },
  medical_office: { name: "Medical Office", wifiMultiplier: 1.4, avgDwell: "30-60 min", description: "Clinics, doctor offices" },
  animal_hospital: { name: "Animal Hospital", wifiMultiplier: 1.4, avgDwell: "30-90 min", description: "Vet clinics, emergency vet" },
  daycare: { name: "Daycare", wifiMultiplier: 1.2, avgDwell: "Drop-off", description: "Childcare centers" },
  // Education
  college: { name: "College/University", wifiMultiplier: 2.0, avgDwell: "2-8 hrs", description: "Higher education campuses" },
  school_k5: { name: "School (K-5)", wifiMultiplier: 1.3, avgDwell: "Staff hours", description: "Elementary schools" },
  school_middle: { name: "School (6-8)", wifiMultiplier: 1.4, avgDwell: "Staff hours", description: "Middle schools" },
  school_high: { name: "School (9-12)", wifiMultiplier: 1.5, avgDwell: "Staff hours", description: "High schools" },
  // Recreation
  dog_park: { name: "Dog Park", wifiMultiplier: 1.3, avgDwell: "30-60 min", description: "Off-leash parks" },
  stadium: { name: "Stadium / Arena", wifiMultiplier: 1.5, avgDwell: "2-4 hrs", description: "Sports venues, concert halls" },
  museum: { name: "Museum", wifiMultiplier: 1.4, avgDwell: "1-3 hrs", description: "Art, history, science museums" },
  library: { name: "Library", wifiMultiplier: 1.8, avgDwell: "1-4 hrs", description: "Public & university libraries" },
  gym: { name: "Gym / Fitness", wifiMultiplier: 1.6, avgDwell: "1-2 hrs", description: "Fitness centers, gyms" },
  // Transportation
  airport: { name: "Airport", wifiMultiplier: 2.3, avgDwell: "1-4 hrs", description: "Terminals, lounges" },
  transit_station: { name: "Transit Station", wifiMultiplier: 1.4, avgDwell: "15-45 min", description: "Bus/train stations" },
  // Workspace
  coworking: { name: "Co-Working Space", wifiMultiplier: 2.0, avgDwell: "4-8 hrs", description: "Shared offices, WeWork" },
  office_building: { name: "Office Building", wifiMultiplier: 1.8, avgDwell: "8+ hrs", description: "Commercial offices" },
}

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string
  userType: string
  userRoles?: string[]
  referralPartnerId?: string | null
  is_admin?: boolean
  status: string
  createdAt: number
}

interface Product {
  id: string
  priceId?: string
  name: string
  description?: string
  sku?: string
  category: string
  manufacturer?: string
  msrp?: number
  storePrice: number
  markup?: number
  features?: string
  typeLayer?: string
  availability?: string
  productUrl?: string
  images?: string[]
  active?: boolean
  showInStore?: boolean
  visible?: boolean
  isApproved?: boolean
  createdAt?: number
}

interface BlogArticle {
  id: string
  title: string
  excerpt?: string
  category?: string
  source?: string
  status: 'pending' | 'published' | 'draft' | 'rejected'
  image?: string
  createdAt: string
}

interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'number' | 'checkbox'
  label: string
  name: string
  required: boolean
  options?: string[]
  placeholder?: string
}

interface Form {
  id: string
  name: string
  slug: string
  description?: string
  category: string
  settings: {
    status: 'draft' | 'active' | 'closed'
  }
  submissionCount: number
  createdAt: string
  fields?: FormField[]
}

interface FormSubmission {
  id: string
  formId: string
  formName: string
  data: Record<string, string | boolean | number>
  submittedAt: string
  status: 'new' | 'reviewed' | 'approved' | 'rejected' | 'archived'
}

export default function AdminPortalPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Draggable tabs state
  const defaultTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'crm', label: 'CRM', icon: Target },
    { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
    { id: 'followups', label: 'Follow-Ups', icon: Bell },
    { id: 'venues', label: 'Venues', icon: Building2 },
    { id: 'devices', label: 'Devices', icon: Activity },
    { id: 'device-purchases', label: 'Device Purchases', icon: Package },
    { id: 'products', label: 'Store Products', icon: ShoppingBag },
    { id: 'approved-products', label: 'Approved Products', icon: Star },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'forms', label: 'Forms', icon: ClipboardList },
    { id: 'materials', label: 'Materials', icon: BookOpen },
    { id: 'calculators', label: 'Calculators', icon: Calculator },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'commissions', label: 'Commissions', icon: Calculator },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ]

  const [tabs, setTabs] = useState(defaultTabs)
  const [draggedTab, setDraggedTab] = useState<string | null>(null)
  const [dragOverTab, setDragOverTab] = useState<string | null>(null)

  // Load saved tab order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('adminTabOrder')
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder) as string[]
        const reorderedTabs = orderIds
          .map(id => defaultTabs.find(t => t.id === id))
          .filter(Boolean) as typeof defaultTabs
        // Add any new tabs that weren't in saved order
        defaultTabs.forEach(tab => {
          if (!reorderedTabs.find(t => t.id === tab.id)) {
            reorderedTabs.push(tab)
          }
        })
        setTabs(reorderedTabs)
      } catch (e) {
        console.error('Failed to load tab order:', e)
      }
    }
  }, [])

  // Save tab order to localStorage
  const saveTabOrder = (newTabs: typeof defaultTabs) => {
    localStorage.setItem('adminTabOrder', JSON.stringify(newTabs.map(t => t.id)))
  }

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault()
    if (tabId !== draggedTab) {
      setDragOverTab(tabId)
    }
  }

  const handleDragLeave = () => {
    setDragOverTab(null)
  }

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault()
    if (!draggedTab || draggedTab === targetTabId) return

    const newTabs = [...tabs]
    const draggedIndex = newTabs.findIndex(t => t.id === draggedTab)
    const targetIndex = newTabs.findIndex(t => t.id === targetTabId)

    const [removed] = newTabs.splice(draggedIndex, 1)
    newTabs.splice(targetIndex, 0, removed)

    setTabs(newTabs)
    saveTabOrder(newTabs)
    setDraggedTab(null)
    setDragOverTab(null)
  }

  const handleDragEnd = () => {
    setDraggedTab(null)
    setDragOverTab(null)
  }

  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Venues state
  const [venues, setVenues] = useState<any[]>([])
  const [venuesLoading, setVenuesLoading] = useState(false)
  const [venueStats, setVenueStats] = useState({ total: 0, active: 0, trial: 0, pending: 0, inactive: 0 })
  const [venueSearch, setVenueSearch] = useState('')

  // Devices state
  const [devices, setDevices] = useState<any[]>([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [deviceStats, setDeviceStats] = useState({ total: 0, active: 0, offline: 0, pending: 0, unassigned: 0 })
  const [deviceSearch, setDeviceSearch] = useState('')

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())

  // Calculator state
  const [calcSquareFootage, setCalcSquareFootage] = useState(2500)
  const [calcFootTraffic, setCalcFootTraffic] = useState(500)
  const [calcHoursOpen, setCalcHoursOpen] = useState(12)
  const [calcDaysOpen, setCalcDaysOpen] = useState(26)
  const [activeCalculator, setActiveCalculator] = useState<string>('earnings')
  const [calcVenueType, setCalcVenueType] = useState<string>('cafe_coffee')
  const [calcWifiAdoption, setCalcWifiAdoption] = useState(35)
  const [calcRatePerGB, setCalcRatePerGB] = useState(0.50)
  const [calcAddress, setCalcAddress] = useState('')

  // Forms state
  const [forms, setForms] = useState<Form[]>([])
  const [formsLoading, setFormsLoading] = useState(false)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [submissionStats, setSubmissionStats] = useState({ total: 0, new: 0, reviewed: 0, approved: 0, rejected: 0 })
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [showFormEditorModal, setShowFormEditorModal] = useState(false)
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [showSubmissionDetailModal, setShowSubmissionDetailModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)

  // Materials state
  const [materials, setMaterials] = useState<{
    id: string
    title: string
    description: string
    type: 'video' | 'document' | 'article' | 'quiz'
    category: string
    duration?: string
    url: string
    required?: boolean
    partnerTypes: string[]
    createdAt: string
  }[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<typeof materials[0] | null>(null)
  const [materialFilter, setMaterialFilter] = useState<string>('all')

  // Load materials from API
  const loadMaterials = async () => {
    setMaterialsLoading(true)
    try {
      const res = await fetch('/api/materials')
      const data = await res.json()
      if (data.materials) {
        setMaterials(data.materials.map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          type: m.type,
          category: m.category,
          duration: m.duration,
          url: m.url,
          required: m.required,
          partnerTypes: m.partner_types || ['all'],
          createdAt: m.created_at,
        })))
      }
    } catch (error) {
      console.error('Error loading materials:', error)
      // Fallback to default materials if API fails
      setMaterials([
        { id: '1', title: 'Partner Onboarding Guide', description: 'Complete guide to getting started with SkyYield', type: 'document', category: 'Onboarding', duration: '10 min read', url: 'https://docs.skyyield.io/onboarding', required: true, partnerTypes: ['all'], createdAt: '2024-01-15' },
        { id: '2', title: 'WiFi Installation Video', description: 'Step-by-step video guide for installing UniFi access points', type: 'video', category: 'Installation', duration: '12:30', url: 'https://youtube.com/watch?v=example', required: true, partnerTypes: ['location_partner', 'contractor'], createdAt: '2024-02-20' },
        { id: '3', title: 'Commission Structure Explained', description: 'Understanding how earnings and commissions work', type: 'article', category: 'Payments', duration: '5 min read', url: 'https://docs.skyyield.io/commissions', required: false, partnerTypes: ['all'], createdAt: '2024-03-10' },
      ])
    } finally {
      setMaterialsLoading(false)
    }
  }

  // Save material to API
  const saveMaterial = async (material: typeof materials[0], isNew: boolean) => {
    try {
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch('/api/materials', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      })
      if (res.ok) {
        loadMaterials() // Reload to get updated data
      }
    } catch (error) {
      console.error('Error saving material:', error)
    }
  }

  // Delete material from API
  const deleteMaterial = async (id: string) => {
    try {
      const res = await fetch(`/api/materials?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMaterials(materials.filter(m => m.id !== id))
      }
    } catch (error) {
      console.error('Error deleting material:', error)
    }
  }

  // Pipeline state
  const [partners, setPartners] = useState<LocationPartner[]>([])
  const [pipelineLoading, setPipelineLoading] = useState(false)
  const [pipelineStageFilter, setPipelineStageFilter] = useState<string | null>(null)
  const [pipelinePartnerTypeFilter, setPipelinePartnerTypeFilter] = useState<string>('all')

  // Follow-ups state
  const [waitingItems, setWaitingItems] = useState<WaitingItem[]>([])
  const [followUpsLoading, setFollowUpsLoading] = useState(false)
  const [selectedPartnerForFollowUp, setSelectedPartnerForFollowUp] = useState<LocationPartner | null>(null)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [reminderType, setReminderType] = useState<'email' | 'sms'>('email')
  const [reminderNote, setReminderNote] = useState('')
  const [sendingReminder, setSendingReminder] = useState(false)

  // Follow-ups filtering & sorting
  const [followUpStatusFilter, setFollowUpStatusFilter] = useState<string>('all')
  const [followUpItemTypeFilter, setFollowUpItemTypeFilter] = useState<string>('all')
  const [followUpPartnerTypeFilter, setFollowUpPartnerTypeFilter] = useState<string>('all')
  const [followUpMinDays, setFollowUpMinDays] = useState<number>(0)
  const [followUpMaxDays, setFollowUpMaxDays] = useState<number>(999)
  const [followUpSortBy, setFollowUpSortBy] = useState<'days_desc' | 'days_asc' | 'name' | 'company' | 'attempts'>('days_desc')
  const [followUpSearch, setFollowUpSearch] = useState('')

  // Settings state
  const [settingsTab, setSettingsTab] = useState<'profile' | 'dropdowns' | 'stages' | 'calendly' | 'emails'>('profile')
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [dropdowns, setDropdowns] = useState<Dropdown[]>([])
  const [calendlyLinks, setCalendlyLinks] = useState<CalendlyLink[]>([])
  const [calendlyUser, setCalendlyUser] = useState<{ name: string; email: string; timezone: string } | null>(null)
  const [calendlyLoading, setCalendlyLoading] = useState(false)
  const [calendlyError, setCalendlyError] = useState<string | null>(null)

  // Database Email Templates state
  const [dbEmailTemplates, setDbEmailTemplates] = useState<any[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [editingDbTemplate, setEditingDbTemplate] = useState<any | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  // Pipeline Stages settings state
  const [dbPipelineStages, setDbPipelineStages] = useState<any[]>([])
  const [stagesLoading, setStagesLoading] = useState(false)
  const [editingStage, setEditingStage] = useState<any | null>(null)
  const [showStageModal, setShowStageModal] = useState(false)
  const [stagesPartnerTypeFilter, setStagesPartnerTypeFilter] = useState<string>('all')

  // Database Calendly Links state
  const [dbCalendlyLinks, setDbCalendlyLinks] = useState<any[]>([])
  const [calendlyDbLoading, setCalendlyDbLoading] = useState(false)
  const [editingCalendly, setEditingCalendly] = useState<any | null>(null)
  const [showCalendlyModal, setShowCalendlyModal] = useState(false)

  // Database Dropdowns state
  const [dbDropdowns, setDbDropdowns] = useState<any[]>([])
  const [dropdownsLoading, setDropdownsLoading] = useState(false)
  const [editingDropdown, setEditingDropdown] = useState<any | null>(null)
  const [showDropdownModal, setShowDropdownModal] = useState(false)
  const [newOptionLabel, setNewOptionLabel] = useState('')
  const [expandedDropdowns, setExpandedDropdowns] = useState<Set<string>>(new Set())
  const [editingDropdownItem, setEditingDropdownItem] = useState<any | null>(null)
  const [showDropdownItemModal, setShowDropdownItemModal] = useState(false)

  // Payments state
  const [paymentsViewType, setPaymentsViewType] = useState<'paymentHistory' | 'invoiceHistory' | 'paymentDetails'>('paymentHistory')

  // User modal states
  // User modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showAddRoleModal, setShowAddRoleModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteUserType, setInviteUserType] = useState('Location Partner')
  const [inviteSending, setInviteSending] = useState(false)

  // Load approved IDs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('skyyield-approved-products')
    if (saved) {
      setApprovedIds(new Set(JSON.parse(saved)))
    }
  }, [])

  // Save approved IDs to localStorage when changed
  const saveApprovedIds = (ids: Set<string>) => {
    localStorage.setItem('skyyield-approved-products', JSON.stringify([...ids]))
    setApprovedIds(ids)
  }

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }

    const status = (user.unsafeMetadata as any)?.status || 'pending'
    if (status !== 'approved') {
      router.push('/pending-approval')
    }
  }, [isLoaded, user, router])

  // Fetch users
  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      // Transform snake_case to camelCase
      const transformedUsers = (data.users || []).map((u: any) => ({
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        imageUrl: u.image_url,
        userType: u.user_type,
        userRoles: u.user_roles || [],
        referralPartnerId: u.referral_partner_id,
        is_admin: u.is_admin,
        status: u.portal_status,
        createdAt: u.created_at ? new Date(u.created_at).getTime() : null,
      }))
      setUsers(transformedUsers)
    } catch (err) {
      console.error('Error fetching users:', err)
    }
    setUsersLoading(false)
  }

  // Fetch products from /api/admin/products
  const fetchProducts = async () => {
    setProductsLoading(true)
    try {
      const res = await fetch('/api/admin/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      } else {
        console.error('Products API returned:', res.status)
        setProducts([])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  // Fetch venues
  const fetchVenues = async () => {
    setVenuesLoading(true)
    try {
      const res = await fetch('/api/admin/venues')
      if (res.ok) {
        const data = await res.json()
        const venueList = data.venues || []
        setVenues(venueList)
        // Calculate stats from venues
        setVenueStats({
          total: venueList.length,
          active: venueList.filter((v: any) => v.status === 'active').length,
          trial: venueList.filter((v: any) => v.status === 'trial').length,
          pending: venueList.filter((v: any) => v.status === 'pending').length,
          inactive: venueList.filter((v: any) => v.status === 'inactive').length,
        })
      } else {
        console.error('Venues API returned:', res.status)
        setVenues([])
      }
    } catch (err) {
      console.error('Error fetching venues:', err)
      setVenues([])
    } finally {
      setVenuesLoading(false)
    }
  }

  // Fetch devices
  const fetchDevices = async () => {
    setDevicesLoading(true)
    try {
      const res = await fetch('/api/admin/devices')
      if (res.ok) {
        const data = await res.json()
        const deviceList = data.devices || []
        setDevices(deviceList)
        // Calculate stats from devices
        setDeviceStats({
          total: deviceList.length,
          active: deviceList.filter((d: any) => d.status === 'online' || d.status === 'active').length,
          offline: deviceList.filter((d: any) => d.status === 'offline').length,
          pending: deviceList.filter((d: any) => d.status === 'pending').length,
          unassigned: deviceList.filter((d: any) => !d.venue_id).length,
        })
      } else {
        console.error('Devices API returned:', res.status)
        setDevices([])
      }
    } catch (err) {
      console.error('Error fetching devices:', err)
      setDevices([])
    } finally {
      setDevicesLoading(false)
    }
  }

  // Fetch forms
  const fetchForms = async () => {
    setFormsLoading(true)
    try {
      const res = await fetch('/api/forms')
      if (res.ok) {
        const data = await res.json()
        setForms(data.forms || [])
      }
    } catch (err) {
      console.error('Error fetching forms:', err)
    } finally {
      setFormsLoading(false)
    }
  }

  // Fetch submissions
  const fetchSubmissions = async (formId?: string) => {
    setSubmissionsLoading(true)
    try {
      const url = formId ? `/api/forms/submissions?formId=${formId}` : '/api/forms/submissions'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions || [])
        setSubmissionStats(data.stats || { total: 0, new: 0, reviewed: 0, approved: 0, rejected: 0 })
      }
    } catch (err) {
      console.error('Error fetching submissions:', err)
    } finally {
      setSubmissionsLoading(false)
    }
  }

  // Fetch pipeline partners
  const fetchPipeline = async () => {
    setPipelineLoading(true)
    try {
      const res = await fetch('/api/pipeline/partners')
      if (res.ok) {
        const data = await res.json()
        setPartners(data.partners || [])
        // Also generate waiting items from partners
        generateWaitingItems(data.partners || [])
      }
    } catch (err) {
      console.error('Error fetching pipeline:', err)
    } finally {
      setPipelineLoading(false)
    }
  }

  // Generate waiting items from partners
  const generateWaitingItems = (partnerList: LocationPartner[]) => {
    const items: WaitingItem[] = []
    const now = new Date()

    partnerList.forEach(partner => {
      // Find what stage requires waiting
      const stage = PIPELINE_STAGES.find(s => s.id === partner.stage)
      if (stage?.waitingFor || partner.waitingFor) {
        const waitingFor = partner.waitingFor || stage?.waitingFor || 'other'
        const waitingType = WAITING_TYPES.find(w => w.id === waitingFor)
        const waitingSince = partner.waitingSince || partner.updatedAt || partner.createdAt
        const waitingDate = new Date(waitingSince)
        const daysPending = Math.floor((now.getTime() - waitingDate.getTime()) / (1000 * 60 * 60 * 24))
        const attemptCount = partner.followUpAttempts?.length || 0

        // Determine priority based on days pending and attempts
        let priority: 'high' | 'medium' | 'low' = 'low'
        if (daysPending >= REMINDER_THRESHOLDS.inactive || attemptCount >= 3) {
          priority = 'high'
        } else if (daysPending >= REMINDER_THRESHOLDS.second) {
          priority = 'medium'
        }

        items.push({
          partnerId: partner.id,
          partnerName: partner.contactFullName,
          partnerEmail: partner.contactEmail,
          partnerPhone: partner.contactPhone,
          companyName: partner.companyLegalName,
          companyCity: partner.companyCity,
          companyState: partner.companyState,
          stage: partner.stage,
          stageName: stage?.name || partner.stage,
          waitingFor: waitingFor,
          waitingForLabel: waitingType?.label || partner.waitingForLabel || 'Unknown',
          waitingForCategory: waitingType?.category || 'other',
          waitingSince: waitingSince,
          daysPending,
          attemptCount,
          lastAttemptDate: partner.followUpAttempts?.[partner.followUpAttempts.length - 1]?.sentAt,
          lastAttemptType: partner.followUpAttempts?.[partner.followUpAttempts.length - 1]?.type,
          nextFollowUpDate: partner.nextFollowUpDate,
          notes: partner.followUpNotes,
          priority,
          partnerType: partner.partnerType || 'Location Partner',
          partnerStatus: partner.status || 'active',
        })
      }
    })

    // Don't sort here - let the UI handle sorting based on user preference
    setWaitingItems(items)
  }

  // Get filtered and sorted waiting items
  const getFilteredWaitingItems = () => {
    let filtered = [...waitingItems]

    // Apply search filter
    if (followUpSearch) {
      const search = followUpSearch.toLowerCase()
      filtered = filtered.filter(item =>
        item.partnerName.toLowerCase().includes(search) ||
        item.companyName.toLowerCase().includes(search) ||
        item.partnerEmail.toLowerCase().includes(search)
      )
    }

    // Apply status filter
    if (followUpStatusFilter !== 'all') {
      filtered = filtered.filter(item => item.partnerStatus === followUpStatusFilter)
    }

    // Apply item type filter
    if (followUpItemTypeFilter !== 'all') {
      if (followUpItemTypeFilter === 'calendly') {
        filtered = filtered.filter(item => item.waitingForCategory === 'calendly')
      } else if (followUpItemTypeFilter === 'docuseal') {
        filtered = filtered.filter(item => item.waitingForCategory === 'docuseal')
      } else if (followUpItemTypeFilter === 'tipalti') {
        filtered = filtered.filter(item => item.waitingForCategory === 'tipalti')
      } else {
        filtered = filtered.filter(item => item.waitingFor === followUpItemTypeFilter)
      }
    }

    // Apply partner type filter
    if (followUpPartnerTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.partnerType === followUpPartnerTypeFilter)
    }

    // Apply days range filter
    filtered = filtered.filter(item =>
      item.daysPending >= followUpMinDays && item.daysPending <= followUpMaxDays
    )

    // Apply sorting
    filtered.sort((a, b) => {
      switch (followUpSortBy) {
        case 'days_desc':
          return b.daysPending - a.daysPending
        case 'days_asc':
          return a.daysPending - b.daysPending
        case 'name':
          return a.partnerName.localeCompare(b.partnerName)
        case 'company':
          return a.companyName.localeCompare(b.companyName)
        case 'attempts':
          return b.attemptCount - a.attemptCount
        default:
          return b.daysPending - a.daysPending
      }
    })

    return filtered
  }

  // Send reminder (email or SMS)
  const sendReminder = async (partnerId: string, type: 'email' | 'sms', note?: string) => {
    setSendingReminder(true)
    try {
      const partner = partners.find(p => p.id === partnerId)
      if (!partner) throw new Error('Partner not found')

      const waitingType = WAITING_TYPES.find(w => w.id === partner.waitingFor)

      await fetch('/api/pipeline/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          type,
          to: type === 'email' ? partner.contactEmail : partner.contactPhone,
          waitingFor: partner.waitingFor,
          waitingForLabel: waitingType?.label,
          note,
        }),
      })

      // Refresh pipeline to get updated attempt counts
      await fetchPipeline()
      setShowReminderModal(false)
      setReminderNote('')
      alert(`${type === 'email' ? 'Email' : 'SMS'} reminder sent successfully!`)
    } catch (err) {
      console.error('Error sending reminder:', err)
      alert('Failed to send reminder')
    } finally {
      setSendingReminder(false)
    }
  }

  // Skip step (move to next stage)
  const skipStep = async (partnerId: string, currentStage: string) => {
    try {
      const stageIndex = PIPELINE_STAGES.findIndex(s => s.id === currentStage)
      if (stageIndex === -1 || stageIndex >= PIPELINE_STAGES.length - 1) return

      const nextStage = PIPELINE_STAGES[stageIndex + 1].id

      await fetch('/api/pipeline/partners/' + partnerId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: nextStage,
          waitingFor: null,
          waitingSince: null,
          skipReason: 'Manually skipped by admin'
        }),
      })

      await fetchPipeline()
      alert('Step skipped successfully!')
    } catch (err) {
      console.error('Error skipping step:', err)
      alert('Failed to skip step')
    }
  }

  // Mark partner as inactive
  const markInactive = async (partnerId: string, reason?: string) => {
    if (!confirm('Are you sure you want to mark this partner as inactive? This will remove them from active follow-ups.')) return

    try {
      await fetch('/api/pipeline/partners/' + partnerId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'inactive',
          status: 'inactive',
          inactiveReason: reason || 'No response after multiple follow-ups',
          inactiveDate: new Date().toISOString()
        }),
      })

      await fetchPipeline()
      alert('Partner marked as inactive')
    } catch (err) {
      console.error('Error marking inactive:', err)
      alert('Failed to mark inactive')
    }
  }

  // Pause follow-ups for a partner
  const pauseFollowUps = async (partnerId: string) => {
    try {
      await fetch('/api/pipeline/partners/' + partnerId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paused' }),
      })
      await fetchPipeline()
    } catch (err) {
      console.error('Error pausing:', err)
    }
  }

  // Resume follow-ups for a partner
  const resumeFollowUps = async (partnerId: string) => {
    try {
      await fetch('/api/pipeline/partners/' + partnerId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      await fetchPipeline()
    } catch (err) {
      console.error('Error resuming:', err)
    }
  }

  // Fetch dropdowns for settings
  const fetchDropdowns = async () => {
    try {
      const res = await fetch('/api/pipeline/dropdowns')
      if (res.ok) {
        const data = await res.json()
        setDropdowns(data.dropdowns || [])
      }
    } catch (err) {
      console.error('Error fetching dropdowns:', err)
    }
  }

  // Fetch calendly links from real API
  const fetchCalendlyLinks = async () => {
    setCalendlyLoading(true)
    setCalendlyError(null)
    try {
      const res = await fetch('/api/pipeline/calendly')
      const data = await res.json()

      if (data.success) {
        setCalendlyLinks(data.links || [])
        setCalendlyUser(data.user || null)
      } else {
        setCalendlyError(data.error || 'Failed to fetch Calendly data')
      }
    } catch (err) {
      console.error('Calendly fetch error:', err)
      setCalendlyError('Failed to connect to Calendly API')
    } finally {
      setCalendlyLoading(false)
    }
  }

  // Fetch pipeline stages from database
  const fetchPipelineStages = async () => {
    setStagesLoading(true)
    try {
      const res = await fetch('/api/admin/settings/pipeline-stages')
      const data = await res.json()
      setDbPipelineStages(data.stages || [])
    } catch (err) {
      console.error('Error fetching pipeline stages:', err)
    } finally {
      setStagesLoading(false)
    }
  }

  // Save pipeline stage
  const savePipelineStage = async (stage: any) => {
    try {
      const method = stage.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/settings/pipeline-stages', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stage),
      })
      if (res.ok) {
        fetchPipelineStages()
        setShowStageModal(false)
        setEditingStage(null)
      }
    } catch (err) {
      console.error('Error saving pipeline stage:', err)
    }
  }

  // Delete pipeline stage
  const deletePipelineStage = async (id: string) => {
    if (!confirm('Delete this pipeline stage?')) return
    try {
      await fetch(`/api/admin/settings/pipeline-stages?id=${id}`, { method: 'DELETE' })
      fetchPipelineStages()
    } catch (err) {
      console.error('Error deleting pipeline stage:', err)
    }
  }

  // Fetch email templates from database
  const fetchEmailTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const res = await fetch('/api/admin/settings/email-templates')
      const data = await res.json()
      setDbEmailTemplates(data.templates || [])
    } catch (err) {
      console.error('Error fetching email templates:', err)
    } finally {
      setTemplatesLoading(false)
    }
  }

  // Save email template
  const saveEmailTemplate = async (template: any) => {
    try {
      const method = template.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/settings/email-templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      })
      if (res.ok) {
        fetchEmailTemplates()
        setShowTemplateModal(false)
        setEditingDbTemplate(null)
      }
    } catch (err) {
      console.error('Error saving email template:', err)
    }
  }

  // Delete email template
  const deleteEmailTemplate = async (id: string) => {
    if (!confirm('Delete this email template?')) return
    try {
      await fetch(`/api/admin/settings/email-templates?id=${id}`, { method: 'DELETE' })
      fetchEmailTemplates()
    } catch (err) {
      console.error('Error deleting email template:', err)
    }
  }

  // Fetch calendly links from database
  const fetchDbCalendlyLinks = async () => {
    setCalendlyDbLoading(true)
    try {
      const res = await fetch('/api/admin/settings/calendly-links')
      const data = await res.json()
      setDbCalendlyLinks(data.links || [])
    } catch (err) {
      console.error('Error fetching calendly links:', err)
    } finally {
      setCalendlyDbLoading(false)
    }
  }

  // Save calendly link
  const saveCalendlyLink = async (link: any) => {
    try {
      const method = link.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/settings/calendly-links', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(link),
      })
      if (res.ok) {
        fetchDbCalendlyLinks()
        setShowCalendlyModal(false)
        setEditingCalendly(null)
      }
    } catch (err) {
      console.error('Error saving calendly link:', err)
    }
  }

  // Delete calendly link
  const deleteCalendlyLink = async (id: string) => {
    if (!confirm('Delete this Calendly link?')) return
    try {
      await fetch(`/api/admin/settings/calendly-links?id=${id}`, { method: 'DELETE' })
      fetchDbCalendlyLinks()
    } catch (err) {
      console.error('Error deleting calendly link:', err)
    }
  }

  // Fetch dropdowns from database
  const fetchDbDropdowns = async () => {
    setDropdownsLoading(true)
    try {
      const res = await fetch('/api/admin/settings/dropdowns?includeItems=true')
      const data = await res.json()
      setDbDropdowns(data.dropdowns || [])
    } catch (err) {
      console.error('Error fetching dropdowns:', err)
    } finally {
      setDropdownsLoading(false)
    }
  }

  // Save dropdown
  const saveDropdown = async (dropdown: any) => {
    try {
      const method = dropdown.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/settings/dropdowns', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dropdown),
      })
      if (res.ok) {
        fetchDbDropdowns()
        setShowDropdownModal(false)
        setEditingDropdown(null)
      }
    } catch (err) {
      console.error('Error saving dropdown:', err)
    }
  }

  // Add dropdown item
  const addDropdownItem = async (dropdownId: string, label: string) => {
    if (!label.trim()) return
    try {
      const res = await fetch('/api/admin/settings/dropdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dropdown_id: dropdownId,
          label: label.trim(),
          value: label.trim().toLowerCase().replace(/\s+/g, '_'),
        }),
      })
      if (res.ok) {
        fetchDbDropdowns()
        setNewOptionLabel('')
      }
    } catch (err) {
      console.error('Error adding dropdown item:', err)
    }
  }

  // Delete dropdown item
  const deleteDropdownItem = async (itemId: string) => {
    if (!confirm('Delete this option?')) return
    try {
      await fetch(`/api/admin/settings/dropdowns?itemId=${itemId}`, { method: 'DELETE' })
      fetchDbDropdowns()
    } catch (err) {
      console.error('Error deleting dropdown item:', err)
    }
  }

  // Delete dropdown
  const deleteDropdown = async (id: string) => {
    if (!confirm('Delete this dropdown and all its options?')) return
    try {
      await fetch(`/api/admin/settings/dropdowns?id=${id}`, { method: 'DELETE' })
      fetchDbDropdowns()
    } catch (err) {
      console.error('Error deleting dropdown:', err)
    }
  }

  // Update dropdown item
  const updateDropdownItem = async (item: any) => {
    try {
      const res = await fetch('/api/admin/settings/dropdowns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, label: item.label, value: item.value, description: item.description }),
      })
      if (res.ok) {
        fetchDbDropdowns()
        setShowDropdownItemModal(false)
        setEditingDropdownItem(null)
      }
    } catch (err) {
      console.error('Error updating dropdown item:', err)
    }
  }

  // Toggle dropdown expansion
  const toggleDropdownExpanded = (id: string) => {
    setExpandedDropdowns(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Send user invite
  const sendInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviteSending(true)
    try {
      await fetch('/api/pipeline/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'portalInvite',
          to: inviteEmail,
          variables: { name: inviteEmail.split('@')[0], userType: inviteUserType }
        }),
      })
      alert(`Invitation sent to ${inviteEmail}!`)
      setShowInviteModal(false)
      setInviteEmail('')
    } catch (err) {
      console.error('Error sending invite:', err)
      alert('Failed to send invitation')
    } finally {
      setInviteSending(false)
    }
  }

  // Update submission status
  const updateSubmissionStatus = async (submissionId: string, status: string) => {
    try {
      await fetch('/api/forms/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submissionId, status }),
      })
      setSubmissions(prev => prev.map(s =>
        s.id === submissionId ? { ...s, status: status as FormSubmission['status'] } : s
      ))
      // Update stats
      fetchSubmissions(selectedFormId || undefined)
    } catch (err) {
      console.error('Error updating submission:', err)
    }
  }

  // Copy form link
  const copyFormLink = (slug: string) => {
    const link = `${window.location.origin}/forms/${slug}`
    navigator.clipboard.writeText(link)
    setCopiedLink(slug)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'products' || activeTab === 'approved-products') fetchProducts()
    if (activeTab === 'forms') {
      fetchForms()
      fetchSubmissions()
    }
    if (activeTab === 'materials') loadMaterials()
    if (activeTab === 'pipeline') fetchPipeline()
    if (activeTab === 'followups') fetchPipeline() // Uses same data as pipeline
    if (activeTab === 'settings') {
      fetchDropdowns()
      fetchCalendlyLinks()
      fetchPipelineStages()
      fetchEmailTemplates()
      fetchDbCalendlyLinks()
      fetchDbDropdowns()
    }
    if (activeTab === 'overview') {
      fetchUsers()
      fetchProducts()
      fetchPipeline()
      fetchVenues()
      fetchDevices()
    }
    if (activeTab === 'venues') {
      fetchVenues()
    }
    if (activeTab === 'devices') {
      fetchDevices()
    }
  }, [activeTab])

  // Update user status
  const updateUserStatus = async (userId: string, status: string) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      })
      fetchUsers()
    } catch (err) {
      console.error('Error updating user:', err)
    }
  }

  // Toggle product visibility (showInStore)
  const toggleProductVisibility = async (product: Product) => {
    const currentVisibility = product.showInStore !== false
    const newVisibility = !currentVisibility

    // Update local state immediately
    setProducts(prev => prev.map(p =>
      p.id === product.id ? { ...p, showInStore: newVisibility } : p
    ))

    try {
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          priceId: product.priceId,
          name: product.name,
          description: product.description,
          sku: product.sku,
          category: product.category,
          manufacturer: product.manufacturer,
          msrp: product.msrp,
          storePrice: product.storePrice,
          markup: product.markup,
          features: product.features,
          typeLayer: product.typeLayer,
          availability: product.availability,
          productUrl: product.productUrl,
          images: product.images,
          showInStore: newVisibility,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update')
      }
    } catch (err) {
      console.error('Error updating product:', err)
      // Revert on error
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, showInStore: currentVisibility } : p
      ))
    }
  }

  // Toggle product approval for operations (stored in localStorage for now)
  const toggleProductApproval = (product: Product) => {
    const newApprovedIds = new Set(approvedIds)
    if (newApprovedIds.has(product.id)) {
      newApprovedIds.delete(product.id)
    } else {
      newApprovedIds.add(product.id)
    }
    saveApprovedIds(newApprovedIds)
  }

  // Check if product is approved
  const isProductApproved = (productId: string) => approvedIds.has(productId)

  // Delete product
  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const res = await fetch(`/api/admin/products?id=${productId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId))
      }
    } catch (err) {
      console.error('Error deleting product:', err)
    }
  }

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  const status = (user.unsafeMetadata as any)?.status || 'pending'
  if (status !== 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.firstName?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
      (u.lastName?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku?.toLowerCase() || '').includes(productSearch.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const approvedProducts = products.filter(p => approvedIds.has(p.id))
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean)

  // Stats
  const pendingUsers = users.filter(u => u.status === 'pending').length
  const approvedUsers = users.filter(u => u.status === 'approved').length
  const totalProducts = products.length
  const approvedProductsCount = approvedProducts.length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'account_active':
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending_form':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'pending_approval':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'deactivated':
      case 'inactive':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'location_partner':
      case 'referral_partner':
      case 'channel_partner':
      case 'relationship_partner':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'contractor':
      case 'employee':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'calculator_user':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'customer':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      case 'admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getProductStatusColor = (status?: string) => {
    switch (status) {
      case 'In Stock': return 'text-green-400'
      case 'Sold Out': return 'text-red-400'
      case 'Low Stock': return 'text-yellow-400'
      default: return 'text-[#94A3B8]'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Indoor Access Points': 'bg-cyan-500/20 text-cyan-400',
      'Outdoor Access Points': 'bg-green-500/20 text-green-400',
      'Switches': 'bg-purple-500/20 text-purple-400',
      'Gateways': 'bg-orange-500/20 text-orange-400',
      'Accessories': 'bg-pink-500/20 text-pink-400',
    }
    return colors[category] || 'bg-[#2D3B5F] text-[#94A3B8]'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20">
      {/* Header */}
      <div className="px-4 pb-4 border-b border-[#2D3B5F]">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Admin <span className="text-[#0EA5E9]">Portal</span>
              </h1>
              <p className="text-[#94A3B8] mt-1">
                Welcome back, {user?.firstName}! Manage your platform.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PreviewPortalDropdown />
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite User
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                draggable
                onDragStart={(e) => handleDragStart(e, tab.id)}
                onDragOver={(e) => handleDragOver(e, tab.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, tab.id)}
                onDragEnd={handleDragEnd}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-grab active:cursor-grabbing ${activeTab === tab.id
                  ? 'bg-[#0EA5E9] text-white'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'
                  } ${draggedTab === tab.id ? 'opacity-50 scale-95' : ''
                  } ${dragOverTab === tab.id ? 'ring-2 ring-[#0EA5E9] ring-offset-2 ring-offset-[#0A0F2C]' : ''
                  }`}
              >
                <GripVertical className="w-3 h-3 opacity-40" />
                <tab.icon className="w-4 h-4" />
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
          <div className="space-y-6">
            {/* Crypto Prices */}
            <CryptoPriceHeader />

            {/* Stats Grid - 6 cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Total Users</span>
                </div>
                <div className="text-3xl font-bold text-white">{users.length}</div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Active Users</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{approvedUsers}</div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">In Pipeline</span>
                </div>
                <div className="text-3xl font-bold text-yellow-400">{pendingUsers}</div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Total Venues</span>
                </div>
                <div className="text-3xl font-bold text-cyan-400">{venueStats.total}</div>
                <div className="text-xs text-[#64748B] mt-1">{venueStats.active} active</div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Total Devices</span>
                </div>
                <div className="text-3xl font-bold text-indigo-400">{deviceStats.total}</div>
                <div className="text-xs text-[#64748B] mt-1">{deviceStats.active} online</div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Store Products</span>
                </div>
                <div className="text-3xl font-bold text-purple-400">{totalProducts}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('users')}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center group-hover:bg-[#0EA5E9]/30 transition-colors">
                    <Users className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-white font-medium">Manage Users</span>
                </div>
                <p className="text-[#64748B] text-sm">Approve, reject, and manage user accounts</p>
                {pendingUsers > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                    <Clock className="w-3 h-3" />
                    {pendingUsers} pending
                  </div>
                )}
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <ShoppingBag className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-white font-medium">Store Products</span>
                </div>
                <p className="text-[#64748B] text-sm">Manage products synced with Stripe</p>
                <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                  <Package className="w-3 h-3" />
                  {totalProducts} products
                </div>
              </button>

              <button
                onClick={() => setActiveTab('approved-products')}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-white font-medium">Approved Products</span>
                </div>
                <p className="text-[#64748B] text-sm">SkyYield approved equipment for operations</p>
                <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                  <Star className="w-3 h-3" />
                  {approvedProductsCount} approved
                </div>
              </button>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              <div className="text-center py-8 text-[#64748B]">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Activity feed coming soon</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2D3B5F]">
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">User</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Type</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Joined</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr
                        key={u.id}
                        className="border-b border-[#2D3B5F] hover:bg-[#2D3B5F]/30 cursor-pointer"
                        onClick={() => { setSelectedUser(u); setShowUserModal(true) }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.imageUrl || `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=0EA5E9&color=fff`}
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{u.firstName} {u.lastName}</span>
                                {u.is_admin && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-purple-500/20 text-purple-400 rounded border border-purple-500/30">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className="text-[#64748B] text-sm">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(u.userType)}`}>
                            {u.userType || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(u.status)}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#94A3B8]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {u.status !== 'approved' && (
                              <button
                                onClick={() => updateUserStatus(u.id, 'approved')}
                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {u.status !== 'rejected' && (
                              <button
                                onClick={() => updateUserStatus(u.id, 'rejected')}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => { setSelectedUser(u); setShowUserModal(true) }}
                              className="p-2 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CRM Tab */}
        {activeTab === 'crm' && (
          <CRMTab />
        )}

        {/* Store Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Store Products</h2>
                <p className="text-[#94A3B8] text-sm">Manage products synced with Stripe • {products.length} products</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/admin/store-products"
                  className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-white rounded-lg hover:bg-[#2D3B5F] transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Import Excel
                </Link>
                <Link
                  href="/admin/store-products"
                  className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </Link>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  onClick={fetchProducts}
                  disabled={productsLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2D3B5F]">
                    <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Product</th>
                    <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">SKU</th>
                    <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Category</th>
                    <th className="text-right px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">MSRP</th>
                    <th className="text-right px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Store Price</th>
                    <th className="text-right px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Partner Price</th>
                    <th className="text-center px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Status</th>
                    <th className="text-center px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Visible</th>
                    <th className="text-center px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Approved</th>
                    <th className="text-right px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsLoading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-[#64748B]">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading products...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-[#64748B]">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No products found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr key={p.id} className="border-b border-[#2D3B5F] hover:bg-[#2D3B5F]/30">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#2D3B5F] rounded-lg flex items-center justify-center overflow-hidden">
                              {p.images && p.images[0] ? (
                                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-[#64748B]" />
                              )}
                            </div>
                            <div>
                              <div className="text-white font-medium">{p.name}</div>
                              {p.manufacturer && <div className="text-[#64748B] text-xs">{p.manufacturer}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#94A3B8] font-mono text-sm">{p.sku || '-'}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(p.category)}`}>
                            {p.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-[#94A3B8]">
                          ${p.msrp?.toFixed(2) || '-'}
                        </td>
                        <td className="px-4 py-4 text-right text-white font-medium">
                          ${p.storePrice?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 py-4 text-right text-[#0EA5E9] font-medium">
                          ${(p.storePrice * 0.95).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-sm ${getProductStatusColor(p.availability)}`}>
                            {p.availability || 'In Stock'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => toggleProductVisibility(p)}
                            className="text-[#64748B] hover:text-white transition-colors"
                          >
                            {p.showInStore !== false ? (
                              <ToggleRight className="w-8 h-8 text-green-400" />
                            ) : (
                              <ToggleLeft className="w-8 h-8" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => toggleProductApproval(p)}
                            className={`p-2 rounded-lg transition-colors ${isProductApproved(p.id)
                              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                              : 'bg-[#2D3B5F] text-[#64748B] hover:bg-[#3D4B6F]'
                              }`}
                            title={isProductApproved(p.id) ? 'Remove from approved' : 'Mark as approved'}
                          >
                            <Star className={`w-4 h-4 ${isProductApproved(p.id) ? 'fill-current' : ''}`} />
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/store-products?edit=${p.id}`}
                              className="p-2 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approved Products Tab */}
        {activeTab === 'approved-products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">SkyYield Approved Products</h2>
                <p className="text-[#94A3B8] text-sm">Equipment approved for use in SkyYield operations • {approvedProductsCount} products</p>
              </div>
              <button
                onClick={fetchProducts}
                disabled={productsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-white rounded-lg hover:bg-[#2D3B5F] transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {productsLoading ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#64748B]" />
                <p className="text-[#64748B]">Loading products...</p>
              </div>
            ) : approvedProducts.length === 0 ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                <Star className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
                <p className="text-[#64748B]">No approved products yet</p>
                <p className="text-[#64748B] text-sm mt-1">
                  Go to Store Products and click the star icon to approve products for operations
                </p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="mt-4 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
                >
                  Go to Store Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedProducts.map(p => (
                  <div key={p.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-[#2D3B5F] rounded-lg flex items-center justify-center overflow-hidden">
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-8 h-8 text-[#64748B]" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                        <Star className="w-3 h-3 fill-current" />
                        Approved
                      </div>
                    </div>
                    <h3 className="text-white font-medium mb-1">{p.name}</h3>
                    {p.manufacturer && <p className="text-[#64748B] text-xs mb-2">{p.manufacturer}</p>}
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-3 ${getCategoryColor(p.category)}`}>
                      {p.category}
                    </span>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[#0EA5E9] font-semibold">${p.storePrice?.toFixed(2) || '0.00'}</span>
                        <span className="text-[#64748B] text-sm ml-2">Partner: ${(p.storePrice * 0.95).toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleProductApproval(p)}
                      className="w-full mt-4 py-2 border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F] transition-colors text-sm"
                    >
                      Remove from Approved
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Blog Tab */}
        {activeTab === 'blog' && <AdminBlog />}

        {/* Forms Tab */}
        {activeTab === 'forms' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Forms & Submissions</h2>
                <p className="text-[#94A3B8] text-sm">Manage forms and view submissions</p>
              </div>
              <Link
                href="/admin/forms/new"
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Form
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{submissionStats.total}</div>
                <div className="text-[#94A3B8] text-sm">Total Submissions</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-yellow-400">{submissionStats.new}</div>
                <div className="text-[#94A3B8] text-sm">New</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400">{submissionStats.reviewed}</div>
                <div className="text-[#94A3B8] text-sm">Reviewed</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-green-400">{submissionStats.approved}</div>
                <div className="text-[#94A3B8] text-sm">Approved</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-red-400">{submissionStats.rejected}</div>
                <div className="text-[#94A3B8] text-sm">Rejected</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Forms List */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-white font-medium">Your Forms</h3>
                {formsLoading ? (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#64748B]" />
                  </div>
                ) : forms.length === 0 ? (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 text-[#64748B] opacity-50" />
                    <p className="text-[#94A3B8] text-sm">No forms yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {forms.map(form => (
                      <div
                        key={form.id}
                        className={`bg-[#1A1F3A] border rounded-xl p-4 cursor-pointer transition-colors ${selectedFormId === form.id ? 'border-[#0EA5E9]' : 'border-[#2D3B5F] hover:border-[#0EA5E9]/50'
                          }`}
                        onClick={() => {
                          setSelectedFormId(form.id)
                          fetchSubmissions(form.id)
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-medium text-sm">{form.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs ${form.settings.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            form.settings.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                            {form.settings.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#64748B]">{form.submissionCount} submissions</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingForm(form)
                                setShowFormEditorModal(true)
                              }}
                              className="p-1 hover:bg-[#2D3B5F] rounded transition-colors"
                              title="Edit form fields"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#64748B] hover:text-[#0EA5E9]" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyFormLink(form.slug)
                              }}
                              className="p-1 hover:bg-[#2D3B5F] rounded transition-colors"
                              title="Copy form link"
                            >
                              {copiedLink === form.slug ? (
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                              )}
                            </button>
                            <Link
                              href={`/forms/${form.slug}`}
                              target="_blank"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 hover:bg-[#2D3B5F] rounded transition-colors"
                              title="Open form"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submissions List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">
                    {selectedFormId ? 'Form Submissions' : 'All Submissions'}
                  </h3>
                  {selectedFormId && (
                    <button
                      onClick={() => {
                        setSelectedFormId(null)
                        fetchSubmissions()
                      }}
                      className="text-sm text-[#0EA5E9] hover:underline"
                    >
                      Show All
                    </button>
                  )}
                </div>

                {submissionsLoading ? (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#64748B]" />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <Inbox className="w-10 h-10 mx-auto mb-3 text-[#64748B] opacity-50" />
                    <p className="text-[#94A3B8] text-sm">No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map(submission => (
                      <div
                        key={submission.id}
                        className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium">
                                {submission.data.name || submission.data.contact_name || submission.data.business_name || 'Anonymous'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${submission.status === 'new' ? 'bg-yellow-500/20 text-yellow-400' :
                                submission.status === 'reviewed' ? 'bg-blue-500/20 text-blue-400' :
                                  submission.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                    'bg-red-500/20 text-red-400'
                                }`}>
                                {submission.status}
                              </span>
                            </div>
                            <p className="text-[#64748B] text-sm">{submission.formName}</p>
                          </div>
                          <span className="text-[#64748B] text-xs">
                            {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Submission Data Preview */}
                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                          {submission.data.email && (
                            <div>
                              <span className="text-[#64748B]">Email: </span>
                              <span className="text-white">{submission.data.email}</span>
                            </div>
                          )}
                          {submission.data.phone && (
                            <div>
                              <span className="text-[#64748B]">Phone: </span>
                              <span className="text-white">{submission.data.phone}</span>
                            </div>
                          )}
                          {submission.data.business_type && (
                            <div>
                              <span className="text-[#64748B]">Type: </span>
                              <span className="text-white">{submission.data.business_type}</span>
                            </div>
                          )}
                          {submission.data.address && (
                            <div className="col-span-2">
                              <span className="text-[#64748B]">Address: </span>
                              <span className="text-white">{submission.data.address}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-[#2D3B5F]">
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission)
                              setShowSubmissionDetailModal(true)
                            }}
                            className="px-3 py-1.5 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors text-xs"
                          >
                            View Details
                          </button>
                          {submission.status === 'new' && (
                            <button
                              onClick={() => updateSubmissionStatus(submission.id, 'reviewed')}
                              className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-xs"
                            >
                              Mark Reviewed
                            </button>
                          )}
                          {submission.status !== 'approved' && (
                            <button
                              onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                              className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs"
                            >
                              Approve
                            </button>
                          )}
                          {submission.status !== 'rejected' && (
                            <button
                              onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                              className="px-3 py-1.5 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-xs"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Partner Materials</h2>
                <p className="text-[#94A3B8] text-sm">Manage training resources, guides, and documents for partners</p>
              </div>
              <button
                onClick={() => { setEditingMaterial(null); setShowMaterialModal(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Material
              </button>
            </div>

            {/* Filter by Partner Type */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'location_partner', 'referral_partner', 'channel_partner', 'relationship_partner', 'contractor'].map(type => (
                <button
                  key={type}
                  onClick={() => setMaterialFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${materialFilter === type
                    ? 'bg-[#0EA5E9] text-white'
                    : 'bg-[#1A1F3A] text-[#94A3B8] hover:text-white'
                    }`}
                >
                  {type === 'all' ? 'All Partners' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Materials List */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2D3B5F]">
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Resource</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Type</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Category</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">For</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8]">Required</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-[#94A3B8]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials
                    .filter(m => materialFilter === 'all' || m.partnerTypes.includes('all') || m.partnerTypes.includes(materialFilter))
                    .map(material => (
                      <tr key={material.id} className="border-b border-[#2D3B5F]/50 hover:bg-[#2D3B5F]/20">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${material.type === 'video' ? 'bg-red-500/20' :
                              material.type === 'document' ? 'bg-blue-500/20' :
                                material.type === 'article' ? 'bg-green-500/20' :
                                  'bg-purple-500/20'
                              }`}>
                              {material.type === 'video' ? <Video className="w-5 h-5 text-red-400" /> :
                                material.type === 'document' ? <FileText className="w-5 h-5 text-blue-400" /> :
                                  material.type === 'article' ? <BookOpen className="w-5 h-5 text-green-400" /> :
                                    <CheckCircle className="w-5 h-5 text-purple-400" />}
                            </div>
                            <div>
                              <div className="text-white font-medium">{material.title}</div>
                              <div className="text-[#64748B] text-sm">{material.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${material.type === 'video' ? 'bg-red-500/20 text-red-400' :
                            material.type === 'document' ? 'bg-blue-500/20 text-blue-400' :
                              material.type === 'article' ? 'bg-green-500/20 text-green-400' :
                                'bg-purple-500/20 text-purple-400'
                            }`}>
                            {material.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#94A3B8]">{material.category}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {material.partnerTypes.includes('all') ? (
                              <span className="px-2 py-0.5 bg-[#0EA5E9]/20 text-[#0EA5E9] rounded text-xs">All</span>
                            ) : material.partnerTypes.map(pt => (
                              <span key={pt} className="px-2 py-0.5 bg-[#2D3B5F] text-[#94A3B8] rounded text-xs">
                                {pt.replace('_partner', '').replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {material.required ? (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Required</span>
                          ) : (
                            <span className="text-[#64748B]">Optional</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={material.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => { setEditingMaterial(material); setShowMaterialModal(true) }}
                              className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteMaterial(material.id)}
                              className="p-2 text-[#64748B] hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {materials.filter(m => materialFilter === 'all' || m.partnerTypes.includes('all') || m.partnerTypes.includes(materialFilter)).length === 0 && (
                <div className="p-8 text-center text-[#64748B]">
                  No materials found for this filter
                </div>
              )}
            </div>

            {/* Material Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{materials.length}</div>
                <div className="text-[#64748B] text-sm">Total Resources</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-red-400">{materials.filter(m => m.type === 'video').length}</div>
                <div className="text-[#64748B] text-sm">Videos</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400">{materials.filter(m => m.type === 'document').length}</div>
                <div className="text-[#64748B] text-sm">Documents</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-yellow-400">{materials.filter(m => m.required).length}</div>
                <div className="text-[#64748B] text-sm">Required</div>
              </div>
            </div>
          </div>
        )}

        {/* Material Add/Edit Modal */}
        {showMaterialModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {editingMaterial ? 'Edit Material' : 'Add Material'}
                </h3>
                <button onClick={() => setShowMaterialModal(false)} className="text-[#64748B] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const form = e.target as HTMLFormElement
                  const formData = new FormData(form)
                  const newMaterial = {
                    id: editingMaterial?.id || Date.now().toString(),
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    type: formData.get('type') as 'video' | 'document' | 'article' | 'quiz',
                    category: formData.get('category') as string,
                    duration: formData.get('duration') as string || undefined,
                    url: formData.get('url') as string,
                    required: formData.get('required') === 'on',
                    partnerTypes: Array.from(form.querySelectorAll('input[name="partnerTypes"]:checked')).map((el: any) => el.value),
                    createdAt: editingMaterial?.createdAt || new Date().toISOString().split('T')[0],
                  }
                  await saveMaterial(newMaterial, !editingMaterial)
                  setShowMaterialModal(false)
                  setEditingMaterial(null)
                }}
                className="p-4 space-y-4"
              >
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Title *</label>
                  <input
                    name="title"
                    type="text"
                    required
                    defaultValue={editingMaterial?.title}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingMaterial?.description}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] h-20 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Type</label>
                    <select
                      name="type"
                      defaultValue={editingMaterial?.type || 'document'}
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
                      name="category"
                      type="text"
                      defaultValue={editingMaterial?.category || 'General'}
                      className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">URL *</label>
                  <input
                    name="url"
                    type="url"
                    required
                    defaultValue={editingMaterial?.url}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Duration (e.g., "5 min read" or "12:30")</label>
                  <input
                    name="duration"
                    type="text"
                    defaultValue={editingMaterial?.duration}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-2">Available to Partner Types</label>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'All Partners' },
                      { value: 'location_partner', label: 'Location Partners' },
                      { value: 'referral_partner', label: 'Referral Partners' },
                      { value: 'channel_partner', label: 'Channel Partners' },
                      { value: 'relationship_partner', label: 'Relationship Partners' },
                      { value: 'contractor', label: 'Contractors' },
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="partnerTypes"
                          value={opt.value}
                          defaultChecked={editingMaterial?.partnerTypes.includes(opt.value) ?? opt.value === 'all'}
                          className="w-4 h-4 rounded border-[#2D3B5F] bg-[#0A0F2C] text-[#0EA5E9] focus:ring-[#0EA5E9]"
                        />
                        <span className="text-sm text-[#94A3B8]">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="required"
                    id="required"
                    defaultChecked={editingMaterial?.required}
                    className="w-4 h-4 rounded border-[#2D3B5F] bg-[#0A0F2C] text-[#0EA5E9] focus:ring-[#0EA5E9]"
                  />
                  <label htmlFor="required" className="text-sm text-[#94A3B8] cursor-pointer">Required for onboarding</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowMaterialModal(false); setEditingMaterial(null) }}
                    className="px-4 py-2 text-[#94A3B8] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingMaterial ? 'Save Changes' : 'Add Material'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Calculators Tab */}
        {activeTab === 'calculators' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-xl font-semibold text-white">Location Intelligence Calculators</h2>
              <p className="text-[#94A3B8] text-sm">Analyze venues and estimate potential earnings using foot traffic data</p>
            </div>

            {/* Calculator Selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { id: 'earnings', label: 'WiFi Earnings', icon: DollarSign, color: 'text-green-400', available: true },
                { id: 'trade-area', label: 'Trade Area', icon: MapPin, color: 'text-blue-400', available: true },
                { id: 'competitor', label: 'Competitor', icon: Target, color: 'text-orange-400', available: true },
                { id: 'peak-hours', label: 'Peak Hours', icon: Clock, color: 'text-purple-400', available: true },
                { id: 'demographics', label: 'Demographics', icon: Users, color: 'text-cyan-400', available: true },
                { id: 'venue-score', label: 'Venue Score', icon: Building2, color: 'text-yellow-400', available: true },
              ].map(calc => (
                <button
                  key={calc.id}
                  onClick={() => setActiveCalculator(calc.id)}
                  className={`p-4 rounded-xl border transition-all ${activeCalculator === calc.id
                    ? 'bg-[#0EA5E9]/20 border-[#0EA5E9] text-white'
                    : 'bg-[#1A1F3A] border-[#2D3B5F] text-[#94A3B8] hover:border-[#0EA5E9]/50'
                    }`}
                >
                  <calc.icon className={`w-6 h-6 mx-auto mb-2 ${calc.color}`} />
                  <div className="text-xs font-medium">{calc.label}</div>
                </button>
              ))}
            </div>

            {/* WiFi Earnings Calculator - Full Featured */}
            {activeCalculator === 'earnings' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  WiFi Earnings Calculator
                </h3>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Left Column - Location & Venue */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-[#94A3B8] mb-2">Property Address</label>
                      <input
                        type="text"
                        value={calcAddress}
                        onChange={(e) => setCalcAddress(e.target.value)}
                        placeholder="Enter address..."
                        className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-[#94A3B8] mb-2">Venue Type</label>
                      <select
                        value={calcVenueType}
                        onChange={(e) => setCalcVenueType(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                      >
                        {Object.entries(VENUE_CATEGORIES).map(([category, venueIds]) => (
                          <optgroup key={category} label={category}>
                            {venueIds.map(id => (
                              <option key={id} value={id}>
                                {VENUE_PROFILES[id]?.name || id}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Venue Details Box */}
                    {calcVenueType && VENUE_PROFILES[calcVenueType] && (
                      <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                        <div className="text-white font-medium mb-2">{VENUE_PROFILES[calcVenueType].name}</div>
                        <div className="text-[#64748B] text-sm mb-3">{VENUE_PROFILES[calcVenueType].description}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-[#64748B]">Avg Dwell:</span>
                            <span className="text-white ml-2">{VENUE_PROFILES[calcVenueType].avgDwell}</span>
                          </div>
                          <div>
                            <span className="text-[#64748B]">WiFi Multiplier:</span>
                            <span className="text-[#0EA5E9] ml-2">{VENUE_PROFILES[calcVenueType].wifiMultiplier}x</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                        <span>Square Footage</span>
                        <span className="text-white font-medium">{calcSquareFootage.toLocaleString()} sq ft</span>
                      </label>
                      <input
                        type="range"
                        min="500"
                        max="50000"
                        step="100"
                        value={calcSquareFootage}
                        onChange={(e) => setCalcSquareFootage(Number(e.target.value))}
                        className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                      />
                      <div className="flex justify-between text-xs text-[#64748B] mt-1">
                        <span>500</span>
                        <span>50,000</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column - Traffic & Hours */}
                  <div className="space-y-6">
                    <div>
                      <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                        <span>Daily Foot Traffic</span>
                        <span className="text-white font-medium">{calcFootTraffic.toLocaleString()} visitors</span>
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="10000"
                        step="50"
                        value={calcFootTraffic}
                        onChange={(e) => setCalcFootTraffic(Number(e.target.value))}
                        className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                      />
                      <div className="flex justify-between text-xs text-[#64748B] mt-1">
                        <span>50</span>
                        <span>10,000</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                        <span>WiFi Adoption Rate</span>
                        <span className="text-white font-medium">{calcWifiAdoption}%</span>
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={calcWifiAdoption}
                        onChange={(e) => setCalcWifiAdoption(Number(e.target.value))}
                        className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                      />
                      <div className="flex justify-between text-xs text-[#64748B] mt-1">
                        <span>10%</span>
                        <span>80%</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                        <span>Hours Open Per Day</span>
                        <span className="text-white font-medium">{calcHoursOpen} hours</span>
                      </label>
                      <input
                        type="range"
                        min="4"
                        max="24"
                        value={calcHoursOpen}
                        onChange={(e) => setCalcHoursOpen(Number(e.target.value))}
                        className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                      />
                      <div className="flex justify-between text-xs text-[#64748B] mt-1">
                        <span>4</span>
                        <span>24</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                        <span>Days Open Per Month</span>
                        <span className="text-white font-medium">{calcDaysOpen} days</span>
                      </label>
                      <input
                        type="range"
                        min="15"
                        max="31"
                        value={calcDaysOpen}
                        onChange={(e) => setCalcDaysOpen(Number(e.target.value))}
                        className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                      />
                      <div className="flex justify-between text-xs text-[#64748B] mt-1">
                        <span>15</span>
                        <span>31</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                        <span>Rate Per GB</span>
                        <span className="text-white font-medium">${calcRatePerGB.toFixed(2)}</span>
                      </label>
                      <input
                        type="range"
                        min="0.10"
                        max="1.00"
                        step="0.05"
                        value={calcRatePerGB}
                        onChange={(e) => setCalcRatePerGB(Number(e.target.value))}
                        className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                      />
                      <div className="flex justify-between text-xs text-[#64748B] mt-1">
                        <span>$0.10</span>
                        <span>$1.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Results */}
                  <div className="space-y-4">
                    {(() => {
                      const venueMultiplier = VENUE_PROFILES[calcVenueType]?.wifiMultiplier || 1.5
                      const connectedUsers = Math.round(calcFootTraffic * (calcWifiAdoption / 100))
                      const dataPerUserGB = 0.15 * venueMultiplier
                      const dailyDataGB = connectedUsers * dataPerUserGB
                      const monthlyDataGB = dailyDataGB * calcDaysOpen
                      const monthlyEarnings = monthlyDataGB * calcRatePerGB
                      const yearlyEarnings = monthlyEarnings * 12

                      return (
                        <>
                          <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl p-6 border border-green-500/30">
                            <div className="text-green-300 text-sm mb-1">Estimated Monthly Earnings</div>
                            <div className="text-4xl font-bold text-green-400">
                              ${monthlyEarnings.toFixed(0)}
                            </div>
                            <div className="text-green-300/60 text-xs mt-1">Partner revenue share</div>
                          </div>

                          <div className="bg-[#0A0F2C] rounded-xl p-6 border border-[#2D3B5F]">
                            <div className="text-[#94A3B8] text-sm mb-1">Estimated Yearly Earnings</div>
                            <div className="text-3xl font-bold text-[#0EA5E9]">
                              ${yearlyEarnings.toFixed(0)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                              <div className="text-[#64748B] text-xs mb-1">Connected Users/Day</div>
                              <div className="text-xl font-semibold text-white">
                                {connectedUsers.toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                              <div className="text-[#64748B] text-xs mb-1">Data Offloaded/Month</div>
                              <div className="text-xl font-semibold text-white">
                                {monthlyDataGB.toFixed(0)} GB
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                            <div className="text-[#64748B] text-xs mb-2">Calculation Breakdown</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-[#64748B]">Daily visitors:</span>
                                <span className="text-white">{calcFootTraffic.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#64748B]">WiFi adoption ({calcWifiAdoption}%):</span>
                                <span className="text-white">{connectedUsers} users</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#64748B]">Data per user ({venueMultiplier}x):</span>
                                <span className="text-white">{dataPerUserGB.toFixed(2)} GB</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#64748B]">Daily data:</span>
                                <span className="text-white">{dailyDataGB.toFixed(1)} GB</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#64748B]">Monthly data ({calcDaysOpen} days):</span>
                                <span className="text-white">{monthlyDataGB.toFixed(0)} GB</span>
                              </div>
                              <div className="flex justify-between border-t border-[#2D3B5F] pt-1 mt-1">
                                <span className="text-[#94A3B8]">× ${calcRatePerGB.toFixed(2)}/GB:</span>
                                <span className="text-green-400 font-medium">${monthlyEarnings.toFixed(0)}/mo</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Trade Area Analyzer */}
            {activeCalculator === 'trade-area' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  Trade Area Analyzer
                </h3>
                <p className="text-[#94A3B8] mb-6">Understand where your venue&apos;s visitors come from and identify optimal coverage areas.</p>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Primary Trade Area</div>
                    <div className="text-2xl font-bold text-blue-400">5 mi</div>
                    <div className="text-xs text-[#64748B]">70% of visitors</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Secondary Trade Area</div>
                    <div className="text-2xl font-bold text-cyan-400">15 mi</div>
                    <div className="text-xs text-[#64748B]">25% of visitors</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Extended Reach</div>
                    <div className="text-2xl font-bold text-purple-400">30+ mi</div>
                    <div className="text-xs text-[#64748B]">5% of visitors</div>
                  </div>
                </div>

                <div className="bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F] text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
                  <p className="text-[#94A3B8]">Enter a venue address to analyze its trade area</p>
                  <div className="mt-4 flex gap-2 max-w-md mx-auto">
                    <input
                      type="text"
                      placeholder="Enter venue address..."
                      className="flex-1 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <button className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                      Analyze
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Competitor Comparison */}
            {activeCalculator === 'competitor' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  Competitor Comparison
                </h3>
                <p className="text-[#94A3B8] mb-6">Compare foot traffic metrics against nearby competitors.</p>

                <div className="bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F] text-center">
                  <Target className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
                  <p className="text-[#94A3B8]">Select venues to compare foot traffic and performance</p>
                  <button className="mt-4 px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                    Select Venues
                  </button>
                </div>
              </div>
            )}

            {/* Peak Hours Optimizer */}
            {activeCalculator === 'peak-hours' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Peak Hours Optimizer
                </h3>
                <p className="text-[#94A3B8] mb-6">Identify peak visitation times to optimize WiFi capacity and earnings.</p>

                <div className="grid md:grid-cols-7 gap-2 mb-6">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <div key={day} className="bg-[#0A0F2C] rounded-lg p-3 border border-[#2D3B5F] text-center">
                      <div className="text-[#64748B] text-xs mb-2">{day}</div>
                      <div className={`text-lg font-bold ${i >= 5 ? 'text-green-400' : 'text-[#94A3B8]'}`}>
                        {i >= 5 ? '↑' : '—'}
                      </div>
                      <div className="text-xs text-[#64748B]">{i >= 5 ? 'Peak' : 'Normal'}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F] text-center">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
                  <p className="text-[#94A3B8]">Enter a venue to analyze hourly and daily traffic patterns</p>
                  <button className="mt-4 px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                    Analyze Patterns
                  </button>
                </div>
              </div>
            )}

            {/* Demographics Insights */}
            {activeCalculator === 'demographics' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Demographics Insights
                </h3>
                <p className="text-[#94A3B8] mb-6">Understand visitor demographics to target optimal venues.</p>

                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Median Income</div>
                    <div className="text-xl font-bold text-green-400">$75,000</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Avg Age</div>
                    <div className="text-xl font-bold text-blue-400">34 yrs</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Mobile Usage</div>
                    <div className="text-xl font-bold text-purple-400">92%</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Dwell Time</div>
                    <div className="text-xl font-bold text-orange-400">45 min</div>
                  </div>
                </div>

                <div className="bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F] text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
                  <p className="text-[#94A3B8]">Enter a venue to view detailed visitor demographics</p>
                  <button className="mt-4 px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                    View Demographics
                  </button>
                </div>
              </div>
            )}

            {/* Venue Score */}
            {activeCalculator === 'venue-score' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-yellow-400" />
                  Venue Scoring Tool
                </h3>
                <p className="text-[#94A3B8] mb-6">Get a comprehensive score (1-100) for any venue based on multiple factors.</p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg border border-[#2D3B5F]">
                      <span className="text-[#94A3B8]">Foot Traffic</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#2D3B5F] rounded-full overflow-hidden">
                          <div className="w-[85%] h-full bg-green-400 rounded-full" />
                        </div>
                        <span className="text-white font-medium">85</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg border border-[#2D3B5F]">
                      <span className="text-[#94A3B8]">Demographics</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#2D3B5F] rounded-full overflow-hidden">
                          <div className="w-[72%] h-full bg-blue-400 rounded-full" />
                        </div>
                        <span className="text-white font-medium">72</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg border border-[#2D3B5F]">
                      <span className="text-[#94A3B8]">Dwell Time</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#2D3B5F] rounded-full overflow-hidden">
                          <div className="w-[90%] h-full bg-purple-400 rounded-full" />
                        </div>
                        <span className="text-white font-medium">90</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg border border-[#2D3B5F]">
                      <span className="text-[#94A3B8]">Competition</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#2D3B5F] rounded-full overflow-hidden">
                          <div className="w-[65%] h-full bg-orange-400 rounded-full" />
                        </div>
                        <span className="text-white font-medium">65</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-2">Overall Venue Score</div>
                    <div className="text-6xl font-bold text-yellow-400 mb-2">78</div>
                    <div className="text-green-400 text-sm font-medium">Good Opportunity</div>
                    <div className="mt-4 text-xs text-[#64748B] text-center">
                      Score based on foot traffic, demographics, dwell time, and competitive landscape
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter venue address to score..."
                      className="flex-1 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <button className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                      Score Venue
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Partner Pipeline</h2>
                <p className="text-[#94A3B8] text-sm">Track partner onboarding progress - click a stage to filter</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Partner Type Filter */}
                <select
                  value={pipelinePartnerTypeFilter}
                  onChange={(e) => {
                    setPipelinePartnerTypeFilter(e.target.value)
                    setPipelineStageFilter(null) // Reset stage filter when changing type
                  }}
                  className="px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="all">All Partner Types</option>
                  {PARTNER_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {pipelineStageFilter && (
                  <button
                    onClick={() => setPipelineStageFilter(null)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#0EA5E9]/20 text-[#0EA5E9] rounded-lg hover:bg-[#0EA5E9]/30 transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    Clear Stage
                  </button>
                )}
                <button
                  onClick={fetchPipeline}
                  disabled={pipelineLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${pipelineLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Partner Type Info Banner */}
            {pipelinePartnerTypeFilter !== 'all' && pipelinePartnerTypeFilter !== 'Location Partner' && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 text-purple-400">
                  <span className="text-sm font-medium">Simplified Flow:</span>
                  <span className="text-sm text-[#94A3B8]">Application → Review → Discovery → Agreement → Payment Setup → Active</span>
                </div>
              </div>
            )}

            {/* Pipeline Stages Summary - Clickable */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(pipelinePartnerTypeFilter === 'all' || pipelinePartnerTypeFilter === 'Location Partner' ? LP_PIPELINE_STAGES : SIMPLE_PIPELINE_STAGES).map(stage => {
                const filteredPartners = pipelinePartnerTypeFilter === 'all'
                  ? partners
                  : partners.filter(p => (p.partnerType || 'Location Partner') === pipelinePartnerTypeFilter)
                const count = filteredPartners.filter(p => p.stage === stage.id).length
                const isSelected = pipelineStageFilter === stage.id
                const isFiltered = pipelineStageFilter !== null && !isSelected
                return (
                  <button
                    key={stage.id}
                    onClick={() => setPipelineStageFilter(isSelected ? null : stage.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg border-l-4 ${stage.color} transition-all cursor-pointer ${isSelected
                      ? 'bg-[#2D3B5F] ring-2 ring-[#0EA5E9]'
                      : isFiltered
                        ? 'bg-[#1A1F3A]/50 opacity-40'
                        : 'bg-[#1A1F3A] hover:bg-[#2D3B5F]'
                      }`}
                  >
                    <div className="text-white font-medium text-sm">{stage.name}</div>
                    <div className="text-2xl font-bold text-white">{count}</div>
                  </button>
                )
              })}
            </div>

            {/* Filter indicator */}
            {(pipelineStageFilter || pipelinePartnerTypeFilter !== 'all') && (
              <div className="bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 rounded-lg px-4 py-2 flex items-center justify-between">
                <span className="text-[#0EA5E9] text-sm">
                  Showing:
                  {pipelinePartnerTypeFilter !== 'all' && <strong> {pipelinePartnerTypeFilter}</strong>}
                  {pipelineStageFilter && <> in <strong>{(pipelinePartnerTypeFilter === 'all' || pipelinePartnerTypeFilter === 'Location Partner' ? LP_PIPELINE_STAGES : SIMPLE_PIPELINE_STAGES).find(s => s.id === pipelineStageFilter)?.name}</strong></>}
                  {' '}({partners.filter(p => {
                    const typeMatch = pipelinePartnerTypeFilter === 'all' || (p.partnerType || 'Location Partner') === pipelinePartnerTypeFilter
                    const stageMatch = !pipelineStageFilter || p.stage === pipelineStageFilter
                    return typeMatch && stageMatch
                  }).length} partners)
                </span>
                <button
                  onClick={() => { setPipelineStageFilter(null); setPipelinePartnerTypeFilter('all') }}
                  className="text-[#0EA5E9] hover:text-white transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Partners Table */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
              {pipelineLoading ? (
                <div className="p-12 text-center text-[#64748B]">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading pipeline...
                </div>
              ) : partners.filter(p => {
                const typeMatch = pipelinePartnerTypeFilter === 'all' || (p.partnerType || 'Location Partner') === pipelinePartnerTypeFilter
                const stageMatch = !pipelineStageFilter || p.stage === pipelineStageFilter
                return typeMatch && stageMatch
              }).length === 0 ? (
                <div className="p-12 text-center text-[#64748B]">
                  <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No partners {pipelineStageFilter || pipelinePartnerTypeFilter !== 'all' ? 'matching filters' : 'in pipeline'}</p>
                  <p className="text-sm mt-1">{pipelineStageFilter || pipelinePartnerTypeFilter !== 'all' ? 'Try adjusting your filters' : 'Partners will appear here when they apply'}</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2D3B5F]">
                      <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Partner</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Type</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Company</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Stage</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Location</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners
                      .filter(p => {
                        const typeMatch = pipelinePartnerTypeFilter === 'all' || (p.partnerType || 'Location Partner') === pipelinePartnerTypeFilter
                        const stageMatch = !pipelineStageFilter || p.stage === pipelineStageFilter
                        return typeMatch && stageMatch
                      })
                      .map(partner => {
                        const currentStages = (partner.partnerType === 'Location Partner' || !partner.partnerType) ? LP_PIPELINE_STAGES : SIMPLE_PIPELINE_STAGES
                        return (
                          <tr key={partner.id} className="border-b border-[#2D3B5F] hover:bg-[#2D3B5F]/30">
                            <td className="px-6 py-4">
                              <div className="text-white font-medium">{partner.contactFullName}</div>
                              <div className="text-[#64748B] text-sm">{partner.contactEmail}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${partner.partnerType === 'Referral Partner' ? 'bg-cyan-500/20 text-cyan-400' :
                                partner.partnerType === 'Channel Partner' ? 'bg-purple-500/20 text-purple-400' :
                                  partner.partnerType === 'Relationship Partner' ? 'bg-pink-500/20 text-pink-400' :
                                    partner.partnerType === 'Contractor' ? 'bg-orange-500/20 text-orange-400' :
                                      'bg-green-500/20 text-green-400'
                                }`}>
                                {(partner.partnerType || 'Location Partner').replace(' Partner', '')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-white">{partner.companyLegalName}</div>
                              {partner.companyDBA && <div className="text-[#64748B] text-sm">DBA: {partner.companyDBA}</div>}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentStages.find(s => s.id === partner.stage)?.bgColor || 'bg-gray-500'
                                } bg-opacity-20 text-white`}>
                                {currentStages.find(s => s.id === partner.stage)?.name || partner.stage}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[#94A3B8]">
                              {partner.companyCity}, {partner.companyState}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/admin/pipeline/partners/${partner.id}`}
                                  className="p-2 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Follow-Ups Tab */}
        {activeTab === 'followups' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Follow-Up Queue</h2>
                <p className="text-[#94A3B8] text-sm">Partners you&apos;re waiting on to take action</p>
              </div>
              <button
                onClick={fetchPipeline}
                disabled={pipelineLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${pipelineLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Summary Stats - Clickable to filter */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                onClick={() => { setFollowUpItemTypeFilter('all'); setFollowUpMinDays(0); setFollowUpMaxDays(999) }}
                className={`bg-[#1A1F3A] border rounded-lg p-4 text-center transition-colors hover:bg-[#2D3B5F]/50 ${followUpItemTypeFilter === 'all' ? 'border-[#0EA5E9]' : 'border-[#2D3B5F]'
                  }`}
              >
                <div className="text-2xl font-bold text-white">{waitingItems.length}</div>
                <div className="text-[#64748B] text-sm">Total Waiting</div>
              </button>
              <button
                onClick={() => { setFollowUpItemTypeFilter('calendly'); setFollowUpMinDays(0); setFollowUpMaxDays(999) }}
                className={`bg-[#1A1F3A] border rounded-lg p-4 text-center transition-colors hover:bg-[#2D3B5F]/50 ${followUpItemTypeFilter === 'calendly' ? 'border-purple-500' : 'border-[#2D3B5F]'
                  }`}
              >
                <div className="text-2xl font-bold text-purple-400">{waitingItems.filter(w => w.waitingForCategory === 'calendly').length}</div>
                <div className="text-[#64748B] text-sm">📅 Calendly</div>
                <div className="text-[#64748B] text-xs">Need to book</div>
              </button>
              <button
                onClick={() => { setFollowUpItemTypeFilter('docuseal'); setFollowUpMinDays(0); setFollowUpMaxDays(999) }}
                className={`bg-[#1A1F3A] border rounded-lg p-4 text-center transition-colors hover:bg-[#2D3B5F]/50 ${followUpItemTypeFilter === 'docuseal' ? 'border-orange-500' : 'border-[#2D3B5F]'
                  }`}
              >
                <div className="text-2xl font-bold text-orange-400">{waitingItems.filter(w => w.waitingForCategory === 'docuseal').length}</div>
                <div className="text-[#64748B] text-sm">📝 DocuSeal</div>
                <div className="text-[#64748B] text-xs">Need to sign</div>
              </button>
              <button
                onClick={() => { setFollowUpItemTypeFilter('tipalti'); setFollowUpMinDays(0); setFollowUpMaxDays(999) }}
                className={`bg-[#1A1F3A] border rounded-lg p-4 text-center transition-colors hover:bg-[#2D3B5F]/50 ${followUpItemTypeFilter === 'tipalti' ? 'border-green-500' : 'border-[#2D3B5F]'
                  }`}
              >
                <div className="text-2xl font-bold text-green-400">{waitingItems.filter(w => w.waitingForCategory === 'tipalti').length}</div>
                <div className="text-[#64748B] text-sm">💰 Tipalti</div>
                <div className="text-[#64748B] text-xs">Payment setup</div>
              </button>
              <button
                onClick={() => { setFollowUpMinDays(30); setFollowUpMaxDays(999); setFollowUpItemTypeFilter('all') }}
                className={`bg-[#1A1F3A] border rounded-lg p-4 text-center transition-colors hover:bg-[#2D3B5F]/50 ${followUpMinDays >= 30 ? 'border-red-500' : 'border-[#2D3B5F]'
                  }`}
              >
                <div className="text-2xl font-bold text-red-400">{waitingItems.filter(w => w.daysPending >= 30).length}</div>
                <div className="text-[#64748B] text-sm">🚨 30+ Days</div>
                <div className="text-[#64748B] text-xs">Consider inactive</div>
              </button>
            </div>

            {/* Advanced Filters */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-[#64748B]" />
                <span className="text-white font-medium">Filters</span>
                <button
                  onClick={() => {
                    setFollowUpStatusFilter('all')
                    setFollowUpItemTypeFilter('all')
                    setFollowUpPartnerTypeFilter('all')
                    setFollowUpMinDays(0)
                    setFollowUpMaxDays(999)
                    setFollowUpSearch('')
                    setFollowUpSortBy('days_desc')
                  }}
                  className="ml-auto text-[#64748B] text-sm hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {/* Search */}
                <div className="md:col-span-2">
                  <label className="block text-[#64748B] text-xs mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      type="text"
                      value={followUpSearch}
                      onChange={(e) => setFollowUpSearch(e.target.value)}
                      placeholder="Name, company, email..."
                      className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                </div>

                {/* Waiting For Type */}
                <div>
                  <label className="block text-[#64748B] text-xs mb-1">Waiting For</label>
                  <select
                    value={followUpItemTypeFilter}
                    onChange={(e) => setFollowUpItemTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="all">All Types</option>
                    <option value="calendly">📅 Calendly (All)</option>
                    <option value="calendly_discovery">📅 Discovery Call</option>
                    <option value="calendly_install">🔧 Install Booking</option>
                    <option value="calendly_review">📊 Review Call</option>
                    <option value="docuseal">📝 DocuSeal (All)</option>
                    <option value="docuseal_loi">📝 LOI Signature</option>
                    <option value="docuseal_contract">📄 Contract Signature</option>
                    <option value="tipalti">💰 Tipalti Setup</option>
                    <option value="portal_setup">🔐 Portal Activation</option>
                    <option value="venue_info">🏢 Venue Info</option>
                  </select>
                </div>

                {/* Partner Status */}
                <div>
                  <label className="block text-[#64748B] text-xs mb-1">Status</label>
                  <select
                    value={followUpStatusFilter}
                    onChange={(e) => setFollowUpStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="all">All Statuses</option>
                    {PARTNER_STATUSES.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Partner Type */}
                <div>
                  <label className="block text-[#64748B] text-xs mb-1">Partner Type</label>
                  <select
                    value={followUpPartnerTypeFilter}
                    onChange={(e) => setFollowUpPartnerTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="all">All Types</option>
                    {PARTNER_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Days Range */}
                <div>
                  <label className="block text-[#64748B] text-xs mb-1">Days Pending</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0"
                      value={followUpMinDays}
                      onChange={(e) => setFollowUpMinDays(parseInt(e.target.value) || 0)}
                      placeholder="Min"
                      className="w-1/2 px-2 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <input
                      type="number"
                      min="0"
                      value={followUpMaxDays === 999 ? '' : followUpMaxDays}
                      onChange={(e) => setFollowUpMaxDays(parseInt(e.target.value) || 999)}
                      placeholder="Max"
                      className="w-1/2 px-2 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#2D3B5F]">
                <span className="text-[#64748B] text-sm">Sort by:</span>
                {[
                  { id: 'days_desc', label: 'Days ↓' },
                  { id: 'days_asc', label: 'Days ↑' },
                  { id: 'name', label: 'Name' },
                  { id: 'company', label: 'Company' },
                  { id: 'attempts', label: 'Attempts' },
                ].map(sort => (
                  <button
                    key={sort.id}
                    onClick={() => setFollowUpSortBy(sort.id as any)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${followUpSortBy === sort.id
                      ? 'bg-[#0EA5E9] text-white'
                      : 'bg-[#0A0F2C] text-[#94A3B8] hover:bg-[#2D3B5F]'
                      }`}
                  >
                    {sort.label}
                  </button>
                ))}
                <span className="ml-auto text-[#64748B] text-sm">
                  Showing {getFilteredWaitingItems().length} of {waitingItems.length}
                </span>
              </div>
            </div>

            {/* Waiting Items List */}
            <div className="space-y-3">
              {pipelineLoading ? (
                <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#64748B]" />
                  <p className="text-[#64748B]">Loading follow-ups...</p>
                </div>
              ) : getFilteredWaitingItems().length === 0 ? (
                <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-50" />
                  <p className="text-[#94A3B8]">No matching follow-ups!</p>
                  <p className="text-[#64748B] text-sm mt-1">Try adjusting your filters or all partners are progressing</p>
                </div>
              ) : (
                getFilteredWaitingItems().map(item => (
                  <div
                    key={item.partnerId}
                    className={`bg-[#1A1F3A] border rounded-xl p-5 ${item.priority === 'high' ? 'border-red-500/50' :
                      item.priority === 'medium' ? 'border-yellow-500/50' :
                        'border-[#2D3B5F]'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Partner Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="text-white font-medium">{item.partnerName}</h3>
                          <span className="px-2 py-0.5 bg-[#2D3B5F] text-[#94A3B8] rounded text-xs">
                            {item.partnerType}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${item.partnerStatus === 'active' ? 'bg-green-500/20 text-green-400' :
                            item.partnerStatus === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                            {item.partnerStatus}
                          </span>
                          {item.priority === 'high' && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              High Priority
                            </span>
                          )}
                        </div>
                        <div className="text-[#94A3B8] text-sm">{item.companyName}</div>
                        <div className="text-[#64748B] text-xs mt-1">
                          {item.companyCity && item.companyState ? `${item.companyCity}, ${item.companyState} • ` : ''}
                          {item.partnerEmail} • {item.partnerPhone}
                        </div>
                        <div className="text-[#64748B] text-xs mt-1">
                          Stage: <span className="text-[#94A3B8]">{item.stageName}</span>
                        </div>
                      </div>

                      {/* What You're Waiting On */}
                      <div className="text-center px-4 min-w-[140px]">
                        <div className="text-2xl mb-1">
                          {WAITING_TYPES.find(w => w.id === item.waitingFor)?.icon || '⏳'}
                        </div>
                        <div className="text-[#94A3B8] text-sm font-medium">{item.waitingForLabel}</div>
                        <div className="text-[#64748B] text-xs mt-1">
                          {WAITING_TYPES.find(w => w.id === item.waitingFor)?.description}
                        </div>
                      </div>

                      {/* Days Counter */}
                      <div className="text-center px-4 border-l border-[#2D3B5F] min-w-[80px]">
                        <div className={`text-3xl font-bold ${item.daysPending >= 30 ? 'text-red-400' :
                          item.daysPending >= 14 ? 'text-orange-400' :
                            item.daysPending >= 7 ? 'text-yellow-400' :
                              'text-white'
                          }`}>
                          {item.daysPending}
                        </div>
                        <div className="text-[#64748B] text-xs">days</div>
                        <div className="text-[#64748B] text-xs mt-1">
                          since {new Date(item.waitingSince).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Attempt History */}
                      <div className="text-center px-4 border-l border-[#2D3B5F] min-w-[80px]">
                        <div className="text-xl font-bold text-white">{item.attemptCount}</div>
                        <div className="text-[#64748B] text-xs">attempts</div>
                        {item.lastAttemptDate && (
                          <div className="text-[#64748B] text-xs mt-1">
                            Last: {new Date(item.lastAttemptDate).toLocaleDateString()}
                            {item.lastAttemptType && ` (${item.lastAttemptType})`}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 border-l border-[#2D3B5F] pl-4">
                        <button
                          onClick={() => {
                            setSelectedPartnerForFollowUp(partners.find(p => p.id === item.partnerId) || null)
                            setReminderType('email')
                            setShowReminderModal(true)
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-[#0EA5E9]/20 text-[#0EA5E9] rounded-lg hover:bg-[#0EA5E9]/30 transition-colors text-sm"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPartnerForFollowUp(partners.find(p => p.id === item.partnerId) || null)
                            setReminderType('sms')
                            setShowReminderModal(true)
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                        >
                          <MessageSquare className="w-4 h-4" />
                          SMS
                        </button>
                        <button
                          onClick={() => skipStep(item.partnerId, item.stage)}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                          title="Skip this step (for people you already know)"
                        >
                          <SkipForward className="w-4 h-4" />
                          Skip Step
                        </button>
                        {(item.attemptCount >= 3 || item.daysPending >= 30) && (
                          <button
                            onClick={() => markInactive(item.partnerId)}
                            className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                            title="Mark as inactive - no response after multiple attempts"
                          >
                            <Archive className="w-4 h-4" />
                            Inactive
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notes/History Section */}
                    {item.notes && (
                      <div className="mt-4 pt-4 border-t border-[#2D3B5F]">
                        <div className="text-[#64748B] text-xs mb-1">Notes:</div>
                        <div className="text-[#94A3B8] text-sm">{item.notes}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Quick Stats Footer */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[#64748B] mb-1">Avg. Wait Time</div>
                  <div className="text-white font-medium">
                    {waitingItems.length > 0
                      ? Math.round(waitingItems.reduce((sum, w) => sum + w.daysPending, 0) / waitingItems.length)
                      : 0} days
                  </div>
                </div>
                <div>
                  <div className="text-[#64748B] mb-1">Longest Wait</div>
                  <div className="text-red-400 font-medium">
                    {waitingItems.length > 0
                      ? Math.max(...waitingItems.map(w => w.daysPending))
                      : 0} days
                  </div>
                </div>
                <div>
                  <div className="text-[#64748B] mb-1">Total Attempts Made</div>
                  <div className="text-white font-medium">
                    {waitingItems.reduce((sum, w) => sum + w.attemptCount, 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[#64748B] mb-1">Need Attention (3+ attempts)</div>
                  <div className="text-yellow-400 font-medium">
                    {waitingItems.filter(w => w.attemptCount >= 3).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <AdminPayments />
        )}

        {/* Commissions Tab */}
        {activeTab === 'commissions' && <CommissionManagement />}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Settings</h2>
              <p className="text-[#94A3B8] text-sm">Manage your profile and system settings</p>
            </div>

            {/* Settings Sub-tabs */}
            <div className="flex gap-2 border-b border-[#2D3B5F]">
              {[
                { id: 'profile', label: 'My Profile', icon: User },
                { id: 'emails', label: 'Email Templates', icon: Mail },
                { id: 'dropdowns', label: 'Dropdowns', icon: List },
                { id: 'calendly', label: 'Calendly', icon: Calendar },
                { id: 'stages', label: 'Pipeline Stages', icon: GitBranch },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${settingsTab === tab.id
                    ? 'border-[#0EA5E9] text-white'
                    : 'border-transparent text-[#94A3B8] hover:text-white'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* My Profile */}
            {settingsTab === 'profile' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                <div className="p-6 border-b border-[#2D3B5F]">
                  <h3 className="text-lg font-semibold text-white mb-1">Personal Information</h3>
                  <p className="text-[#64748B] text-sm">Update your profile details</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-[#0A0F2C] rounded-full flex items-center justify-center overflow-hidden">
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-[#64748B]" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">{user?.fullName}</div>
                      <div className="text-[#64748B] text-sm">{user?.primaryEmailAddress?.emailAddress}</div>
                      <button className="mt-2 text-[#0EA5E9] text-sm hover:underline">
                        Change Photo
                      </button>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#94A3B8] text-sm mb-2">First Name</label>
                      <input
                        type="text"
                        defaultValue={user?.firstName || ''}
                        className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#94A3B8] text-sm mb-2">Last Name</label>
                      <input
                        type="text"
                        defaultValue={user?.lastName || ''}
                        className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#94A3B8] text-sm mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                      <input
                        type="email"
                        defaultValue={user?.primaryEmailAddress?.emailAddress || ''}
                        className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                        disabled
                      />
                    </div>
                    <p className="text-[#64748B] text-xs mt-1">Email is managed through Clerk authentication</p>
                  </div>

                  <div>
                    <label className="block text-[#94A3B8] text-sm mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                      <input
                        type="tel"
                        placeholder="(555) 555-5555"
                        className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                      />
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="pt-6 border-t border-[#2D3B5F]">
                    <h4 className="text-white font-medium mb-4">Security</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                        <div className="flex items-center gap-3">
                          <Key className="w-5 h-5 text-[#64748B]" />
                          <div>
                            <div className="text-white">Password</div>
                            <div className="text-[#64748B] text-sm">Change your account password</div>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open('https://accounts.clerk.dev/user/security', '_blank')}
                          className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors text-sm"
                        >
                          Change
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-[#64748B]" />
                          <div>
                            <div className="text-white">Two-Factor Authentication</div>
                            <div className="text-[#64748B] text-sm">Add extra security to your account</div>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open('https://accounts.clerk.dev/user/security', '_blank')}
                          className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors text-sm"
                        >
                          Configure
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <button className="flex items-center gap-2 px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Email Templates */}
            {settingsTab === 'emails' && (
              <div className="space-y-4">
                {/* Header with Add button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setEditingDbTemplate({ name: '', subject: '', body_text: '', trigger_event: '', category: 'general', is_active: true })
                      setShowTemplateModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                  >
                    <Plus className="w-4 h-4" /> Add Template
                  </button>
                </div>

                {/* Loading state */}
                {templatesLoading && (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 text-[#0EA5E9] animate-spin" />
                    <p className="text-[#94A3B8]">Loading templates...</p>
                  </div>
                )}

                {/* Database templates */}
                {!templatesLoading && dbEmailTemplates.length > 0 && (
                  <div className="space-y-4">
                    {dbEmailTemplates.map(template => (
                      <div key={template.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-[#0EA5E9]" />
                            <div>
                              <h3 className="text-white font-medium">{template.name}</h3>
                              <p className="text-[#64748B] text-sm">{template.category || 'general'} {template.trigger_event && `• Trigger: ${template.trigger_event}`}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEmailTemplate({ ...template, is_active: !template.is_active })}
                              className={`px-3 py-1 rounded text-xs ${template.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                            >
                              {template.is_active ? 'Enabled' : 'Disabled'}
                            </button>
                            <button
                              onClick={() => { setEditingDbTemplate(template); setShowTemplateModal(true) }}
                              className="p-2 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F]"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteEmailTemplate(template.id)}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-[#0A0F2C] rounded-lg p-4">
                          <div className="text-[#94A3B8] text-sm mb-2">
                            <strong>Subject:</strong> {template.subject}
                          </div>
                          {template.body_text && (
                            <div className="text-[#64748B] text-sm line-clamp-2">
                              <strong>Body:</strong> {template.body_text.substring(0, 150)}{template.body_text.length > 150 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fallback: Show default templates when no database templates */}
                {!templatesLoading && dbEmailTemplates.length === 0 && (
                  <div className="space-y-4">
                    <p className="text-[#94A3B8] text-sm">No custom templates in database. Showing default templates:</p>
                    {emailTemplates.map(template => (
                      <div key={template.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-[#0EA5E9]" />
                            <div>
                              <h3 className="text-white font-medium">{template.name}</h3>
                              <p className="text-[#64748B] text-sm">{template.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${template.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {template.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <button
                              onClick={() => setEditingTemplate(template)}
                              className="p-2 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F]"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-[#0A0F2C] rounded-lg p-4">
                          <div className="text-[#94A3B8] text-sm mb-2">
                            <strong>Subject:</strong> {template.subject}
                          </div>
                          <div className="text-[#64748B] text-sm">
                            <strong>Trigger:</strong> {template.trigger}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit Template Modal */}
                {showTemplateModal && editingDbTemplate && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                      <h3 className="text-lg font-semibold text-white mb-4">{editingDbTemplate.id ? 'Edit Template' : 'Add Template'}</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#94A3B8] text-sm mb-2">Template Name</label>
                            <input
                              type="text"
                              value={editingDbTemplate.name}
                              onChange={e => setEditingDbTemplate({ ...editingDbTemplate, name: e.target.value })}
                              className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[#94A3B8] text-sm mb-2">Category</label>
                            <select
                              value={editingDbTemplate.category || 'general'}
                              onChange={e => setEditingDbTemplate({ ...editingDbTemplate, category: e.target.value })}
                              className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                            >
                              <option value="general">General</option>
                              <option value="onboarding">Onboarding</option>
                              <option value="pipeline">Pipeline</option>
                              <option value="reminders">Reminders</option>
                              <option value="notifications">Notifications</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Subject Line</label>
                          <input
                            type="text"
                            value={editingDbTemplate.subject}
                            onChange={e => setEditingDbTemplate({ ...editingDbTemplate, subject: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Trigger Event</label>
                          <select
                            value={editingDbTemplate.trigger_event || ''}
                            onChange={e => setEditingDbTemplate({ ...editingDbTemplate, trigger_event: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          >
                            <option value="">Manual Only</option>
                            <option value="stage_changed">Stage Changed</option>
                            <option value="application_submitted">Application Submitted</option>
                            <option value="agreement_signed">Agreement Signed</option>
                            <option value="trial_started">Trial Started</option>
                            <option value="reminder">Reminder</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Email Body</label>
                          <textarea
                            value={editingDbTemplate.body_text || ''}
                            onChange={e => setEditingDbTemplate({ ...editingDbTemplate, body_text: e.target.value })}
                            placeholder="Use {{variable}} for dynamic content"
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white h-40 font-mono text-sm"
                          />
                        </div>
                        <div className="text-[#64748B] text-xs">
                          Available variables: {'{{first_name}}'}, {'{{company_name}}'}, {'{{stage}}'}, {'{{calendly_link}}'}
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-[#94A3B8]">
                            <input
                              type="checkbox"
                              checked={editingDbTemplate.is_active !== false}
                              onChange={e => setEditingDbTemplate({ ...editingDbTemplate, is_active: e.target.checked })}
                              className="w-4 h-4 rounded border-[#2D3B5F]"
                            />
                            Template Enabled
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => { setShowTemplateModal(false); setEditingDbTemplate(null) }}
                          className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEmailTemplate(editingDbTemplate)}
                          className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dropdowns */}
            {settingsTab === 'dropdowns' && (
              <div className="space-y-4">
                {/* Header with Add button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setEditingDropdown({ name: '', slug: '', category: 'general', description: '' })
                      setShowDropdownModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                  >
                    <Plus className="w-4 h-4" /> Add Dropdown
                  </button>
                </div>

                {/* Loading state */}
                {dropdownsLoading && (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 text-[#0EA5E9] animate-spin" />
                    <p className="text-[#94A3B8]">Loading dropdowns...</p>
                  </div>
                )}

                {/* Database dropdowns */}
                {!dropdownsLoading && dbDropdowns.length > 0 && (
                  <div className="space-y-4">
                    {dbDropdowns.map(dropdown => {
                      const isExpanded = expandedDropdowns.has(dropdown.id)
                      return (
                        <div key={dropdown.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                          {/* Header - clickable to expand/collapse */}
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#2D3B5F]/30 transition-colors"
                            onClick={() => toggleDropdownExpanded(dropdown.id)}
                          >
                            <div className="flex items-center gap-3">
                              <ChevronDown className={`w-5 h-5 text-[#64748B] transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                              <div>
                                <h3 className="text-white font-medium">{dropdown.name}</h3>
                                <div className="flex items-center gap-2 text-[#64748B] text-sm">
                                  <span>{dropdown.slug}</span>
                                  <span>•</span>
                                  <span>{dropdown.category || 'general'}</span>
                                  <span>•</span>
                                  <span>{(dropdown.items || []).length} options</span>
                                  {dropdown.used_in_forms && dropdown.used_in_forms.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-[#0EA5E9]">Used in {dropdown.used_in_forms.length} form(s)</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => { setEditingDropdown(dropdown); setShowDropdownModal(true) }}
                                className="p-2 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F]"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteDropdown(dropdown.id)}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="border-t border-[#2D3B5F] p-4 space-y-4">
                              {/* Used in forms */}
                              {dropdown.used_in_forms && dropdown.used_in_forms.length > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-[#64748B]">Used in:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {dropdown.used_in_forms.map((form: string) => (
                                      <span key={form} className="px-2 py-0.5 bg-[#0EA5E9]/20 text-[#0EA5E9] rounded text-xs">{form}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Options list with edit/delete */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[#94A3B8] text-sm font-medium">Options</span>
                                  <span className="text-[#64748B] text-xs">{(dropdown.items || []).length} total</span>
                                </div>
                                <div className="grid gap-2">
                                  {(dropdown.items || []).map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-[#0A0F2C] rounded-lg group">
                                      <div>
                                        <span className="text-white text-sm">{item.label}</span>
                                        {item.description && (
                                          <p className="text-[#64748B] text-xs">{item.description}</p>
                                        )}
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => { setEditingDropdownItem(item); setShowDropdownItemModal(true) }}
                                          className="p-1 text-[#94A3B8] hover:text-white"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => deleteDropdownItem(item.id)}
                                          className="p-1 text-red-400 hover:text-red-300"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Add new option */}
                              <div className="flex gap-2 pt-2 border-t border-[#2D3B5F]">
                                <input
                                  type="text"
                                  placeholder="Add new option..."
                                  value={editingDropdown?.id === dropdown.id ? newOptionLabel : ''}
                                  onChange={e => { setEditingDropdown(dropdown); setNewOptionLabel(e.target.value) }}
                                  onKeyDown={e => { if (e.key === 'Enter' && newOptionLabel) addDropdownItem(dropdown.id, newOptionLabel) }}
                                  className="flex-1 px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm"
                                />
                                <button
                                  onClick={() => { if (newOptionLabel && editingDropdown?.id === dropdown.id) addDropdownItem(dropdown.id, newOptionLabel) }}
                                  className="flex items-center gap-1 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg text-sm hover:bg-[#0EA5E9]/80"
                                >
                                  <Plus className="w-4 h-4" /> Add Option
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Fallback: Show old dropdowns when no database dropdowns */}
                {!dropdownsLoading && dbDropdowns.length === 0 && dropdowns.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[#94A3B8] text-sm">Showing dropdowns from API:</p>
                    {dropdowns.map(dropdown => (
                      <div key={dropdown.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-white font-medium">{dropdown.name}</h3>
                            <p className="text-[#64748B] text-sm">{dropdown.options.length} options</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dropdown.options.slice(0, 10).map(opt => (
                            <span key={opt.value} className="px-2 py-1 bg-[#0A0F2C] text-[#94A3B8] rounded text-xs">
                              {opt.label}
                            </span>
                          ))}
                          {dropdown.options.length > 10 && (
                            <span className="px-2 py-1 bg-[#2D3B5F] text-[#64748B] rounded text-xs">
                              +{dropdown.options.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!dropdownsLoading && dbDropdowns.length === 0 && dropdowns.length === 0 && (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <List className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
                    <p className="text-[#94A3B8]">No dropdowns configured</p>
                    <p className="text-[#64748B] text-sm mt-2">Click "Add Dropdown" to create one</p>
                  </div>
                )}

                {/* Edit Dropdown Modal */}
                {showDropdownModal && editingDropdown && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 w-full max-w-md">
                      <h3 className="text-lg font-semibold text-white mb-4">{editingDropdown.id ? 'Edit Dropdown' : 'Add Dropdown'}</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Dropdown Name</label>
                          <input
                            type="text"
                            value={editingDropdown.name}
                            onChange={e => setEditingDropdown({ ...editingDropdown, name: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Slug</label>
                          <input
                            type="text"
                            value={editingDropdown.slug}
                            onChange={e => setEditingDropdown({ ...editingDropdown, slug: e.target.value })}
                            placeholder="auto-generated"
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Category</label>
                          <select
                            value={editingDropdown.category || 'general'}
                            onChange={e => setEditingDropdown({ ...editingDropdown, category: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          >
                            <option value="general">General</option>
                            <option value="forms">Forms</option>
                            <option value="pipeline">Pipeline</option>
                            <option value="partners">Partners</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Description</label>
                          <textarea
                            value={editingDropdown.description || ''}
                            onChange={e => setEditingDropdown({ ...editingDropdown, description: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white h-20"
                          />
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Used In Forms</label>
                          <div className="flex flex-wrap gap-2">
                            {['Partner Application', 'Venue Registration', 'Contractor Signup', 'Contact Form', 'Survey Form'].map(form => {
                              const usedForms = editingDropdown.used_in_forms || []
                              const isSelected = usedForms.includes(form)
                              return (
                                <label key={form} className="flex items-center gap-2 px-3 py-1.5 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg cursor-pointer hover:border-[#0EA5E9]">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={e => {
                                      const newForms = e.target.checked
                                        ? [...usedForms, form]
                                        : usedForms.filter((f: string) => f !== form)
                                      setEditingDropdown({ ...editingDropdown, used_in_forms: newForms })
                                    }}
                                    className="w-4 h-4 rounded border-[#2D3B5F] bg-[#0A0F2C] text-[#0EA5E9]"
                                  />
                                  <span className="text-white text-sm">{form}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => { setShowDropdownModal(false); setEditingDropdown(null) }}
                          className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveDropdown(editingDropdown)}
                          className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Dropdown Item Modal */}
                {showDropdownItemModal && editingDropdownItem && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 w-full max-w-md">
                      <h3 className="text-lg font-semibold text-white mb-4">Edit Option</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Label</label>
                          <input
                            type="text"
                            value={editingDropdownItem.label}
                            onChange={e => setEditingDropdownItem({ ...editingDropdownItem, label: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Value</label>
                          <input
                            type="text"
                            value={editingDropdownItem.value || ''}
                            onChange={e => setEditingDropdownItem({ ...editingDropdownItem, value: e.target.value })}
                            placeholder="auto-generated from label"
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Description (optional)</label>
                          <input
                            type="text"
                            value={editingDropdownItem.description || ''}
                            onChange={e => setEditingDropdownItem({ ...editingDropdownItem, description: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => { setShowDropdownItemModal(false); setEditingDropdownItem(null) }}
                          className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => updateDropdownItem(editingDropdownItem)}
                          className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Calendly */}
            {settingsTab === 'calendly' && (
              <div className="space-y-4">
                {/* Header with Add button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setEditingCalendly({ name: '', url: '', duration_minutes: 30, description: '', link_type: 'discovery_call' })
                      setShowCalendlyModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                  >
                    <Plus className="w-4 h-4" /> Add Calendly Link
                  </button>
                </div>

                {/* Loading state */}
                {calendlyDbLoading && (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 text-[#0EA5E9] animate-spin" />
                    <p className="text-[#94A3B8]">Loading Calendly links...</p>
                  </div>
                )}

                {/* Database Calendly links */}
                {!calendlyDbLoading && dbCalendlyLinks.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {dbCalendlyLinks.map(link => (
                      <div
                        key={link.id}
                        className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 cursor-pointer hover:border-[#0EA5E9]/50 transition-colors"
                        onClick={() => { setEditingCalendly(link); setShowCalendlyModal(true) }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: link.color || '#0EA5E9' }}
                            />
                            <h3 className="text-white font-medium">{link.name}</h3>
                          </div>
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => { setEditingCalendly(link); setShowCalendlyModal(true) }}
                              className="p-1 text-[#94A3B8] hover:text-white"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCalendlyLink(link.id)}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[#64748B] text-sm mb-2">{link.description || 'No description'}</p>
                        <div className="flex items-center gap-4 text-sm text-[#94A3B8] mb-3">
                          <span>{link.duration_minutes || link.duration} min</span>
                          <span className="px-2 py-0.5 bg-[#2D3B5F] rounded text-xs">{link.link_type || 'general'}</span>
                          {link.pipeline_stage_id && (
                            <span className="px-2 py-0.5 bg-[#0EA5E9]/20 text-[#0EA5E9] rounded text-xs">Auto-trigger</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={link.url}
                            readOnly
                            className="flex-1 px-3 py-1 bg-[#0A0F2C] border border-[#2D3B5F] rounded text-[#64748B] text-sm"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(link.url)
                              setCopiedLink(link.id)
                              setTimeout(() => setCopiedLink(null), 2000)
                            }}
                            className="px-3 py-1 bg-[#2D3B5F] text-[#94A3B8] rounded hover:bg-[#3D4B6F] text-sm"
                          >
                            {copiedLink === link.id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fallback: Show API calendly links when no database links */}
                {!calendlyDbLoading && dbCalendlyLinks.length === 0 && calendlyLinks.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[#94A3B8] text-sm">Showing links from Calendly API:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {calendlyLinks.map(link => (
                        <div key={link.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: link.color || '#0EA5E9' }} />
                            <h3 className="text-white font-medium">{link.name}</h3>
                          </div>
                          <p className="text-[#64748B] text-sm mb-3">{link.description || 'No description'}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[#94A3B8] text-sm">{link.duration} min</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(link.url)
                                setCopiedLink(link.id)
                                setTimeout(() => setCopiedLink(null), 2000)
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] text-sm"
                            >
                              {copiedLink === link.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copiedLink === link.id ? 'Copied!' : 'Copy Link'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!calendlyDbLoading && dbCalendlyLinks.length === 0 && calendlyLinks.length === 0 && (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
                    <p className="text-[#94A3B8]">No Calendly links configured</p>
                    <p className="text-[#64748B] text-sm mt-2">Click "Add Calendly Link" to create one</p>
                  </div>
                )}

                {/* Edit Calendly Modal */}
                {showCalendlyModal && editingCalendly && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 w-full max-w-md">
                      <h3 className="text-lg font-semibold text-white mb-4">{editingCalendly.id ? 'Edit Calendly Link' : 'Add Calendly Link'}</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Name</label>
                          <input
                            type="text"
                            value={editingCalendly.name}
                            onChange={e => setEditingCalendly({ ...editingCalendly, name: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">URL</label>
                          <input
                            type="url"
                            value={editingCalendly.url}
                            onChange={e => setEditingCalendly({ ...editingCalendly, url: e.target.value })}
                            placeholder="https://calendly.com/..."
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[#94A3B8] text-sm mb-2">Duration (min)</label>
                            <input
                              type="number"
                              value={editingCalendly.duration_minutes}
                              onChange={e => setEditingCalendly({ ...editingCalendly, duration_minutes: parseInt(e.target.value) })}
                              className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[#94A3B8] text-sm mb-2">Link Type</label>
                            <select
                              value={editingCalendly.link_type}
                              onChange={e => setEditingCalendly({ ...editingCalendly, link_type: e.target.value })}
                              className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                            >
                              <option value="discovery_call">Discovery Call</option>
                              <option value="site_survey">Site Survey</option>
                              <option value="follow_up">Follow Up</option>
                              <option value="onboarding">Onboarding</option>
                              <option value="general">General</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Description</label>
                          <textarea
                            value={editingCalendly.description || ''}
                            onChange={e => setEditingCalendly({ ...editingCalendly, description: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white h-20"
                          />
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Color</label>
                          <div className="flex gap-2">
                            {['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'].map(color => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setEditingCalendly({ ...editingCalendly, color })}
                                className={`w-8 h-8 rounded-full border-2 ${editingCalendly.color === color ? 'border-white' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Pipeline Stage Trigger</label>
                          <select
                            value={editingCalendly.pipeline_stage_id || ''}
                            onChange={e => setEditingCalendly({ ...editingCalendly, pipeline_stage_id: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          >
                            <option value="">No trigger (manual use only)</option>
                            {dbPipelineStages.map(stage => (
                              <option key={stage.id} value={stage.id}>{stage.name} ({stage.partner_type})</option>
                            ))}
                          </select>
                          <p className="text-[#64748B] text-xs mt-1">Automatically show this link when partner enters selected stage</p>
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Trigger Action</label>
                          <select
                            value={editingCalendly.trigger_action || ''}
                            onChange={e => setEditingCalendly({ ...editingCalendly, trigger_action: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          >
                            <option value="">None</option>
                            <option value="show_in_portal">Show in Partner Portal</option>
                            <option value="send_email">Send Email with Link</option>
                            <option value="create_task">Create Task for Admin</option>
                            <option value="add_to_sequence">Add to Email Sequence</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => { setShowCalendlyModal(false); setEditingCalendly(null) }}
                          className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveCalendlyLink(editingCalendly)}
                          className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pipeline Stages */}
            {settingsTab === 'stages' && (
              <div className="space-y-4">
                {/* Header with filter and add button */}
                <div className="flex items-center justify-between">
                  <select
                    value={stagesPartnerTypeFilter}
                    onChange={e => setStagesPartnerTypeFilter(e.target.value)}
                    className="px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white"
                  >
                    <option value="all">All Partner Types</option>
                    <option value="location_partner">Location Partner</option>
                    <option value="referral_partner">Referral Partner</option>
                    <option value="channel_partner">Channel Partner</option>
                    <option value="contractor">Contractor</option>
                  </select>
                  <button
                    onClick={() => {
                      setEditingStage({ name: '', slug: '', color: 'border-blue-500', partner_type: stagesPartnerTypeFilter === 'all' ? 'location_partner' : stagesPartnerTypeFilter, description: '', action_type: '', email_template_id: '', calendly_link_id: '' })
                      setShowStageModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                  >
                    <Plus className="w-4 h-4" /> Add Stage
                  </button>
                </div>

                {/* Loading state */}
                {stagesLoading && (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 text-[#0EA5E9] animate-spin" />
                    <p className="text-[#94A3B8]">Loading stages...</p>
                  </div>
                )}

                {/* Database stages grouped by partner type */}
                {!stagesLoading && dbPipelineStages.length > 0 && (
                  <div className="space-y-6">
                    {['location_partner', 'referral_partner', 'channel_partner', 'contractor']
                      .filter(pt => stagesPartnerTypeFilter === 'all' || stagesPartnerTypeFilter === pt)
                      .map(partnerType => {
                        const stagesForType = dbPipelineStages.filter(s => s.partner_type === partnerType)
                        if (stagesForType.length === 0) return null
                        return (
                          <div key={partnerType} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                            <div className="px-6 py-3 bg-[#0A0F2C] border-b border-[#2D3B5F]">
                              <h4 className="text-white font-medium capitalize">{partnerType.replace(/_/g, ' ')} Stages</h4>
                            </div>
                            <div className="p-4 space-y-2">
                              {stagesForType.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((stage, index) => (
                                <div key={stage.id} className={`flex items-center gap-4 p-3 bg-[#0A0F2C] rounded-lg border-l-4 ${stage.color || 'border-blue-500'}`}>
                                  <GripVertical className="w-5 h-5 text-[#64748B] cursor-move" />
                                  <div className="flex-1">
                                    <div className="text-white font-medium">{stage.name}</div>
                                    <div className="text-[#64748B] text-xs">{stage.slug} {stage.description && `• ${stage.description}`}</div>
                                    {stage.action_type && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 bg-[#2D3B5F] text-[#0EA5E9] rounded">Action: {stage.action_type}</span>
                                        {stage.email_template_id && <span className="text-xs text-[#64748B]">Email linked</span>}
                                        {stage.calendly_link_id && <span className="text-xs text-[#64748B]">Calendly linked</span>}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[#64748B] text-sm">#{index + 1}</span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => { setEditingStage(stage); setShowStageModal(true) }}
                                      className="p-2 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F]"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => deletePipelineStage(stage.id)}
                                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}

                {/* Fallback: Show hardcoded PIPELINE_STAGES when no database stages */}
                {!stagesLoading && dbPipelineStages.length === 0 && (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[#94A3B8] text-sm">No custom stages in database. Showing default stages:</p>
                    </div>
                    <div className="space-y-3">
                      {PIPELINE_STAGES.map((stage, index) => (
                        <div key={stage.id} className={`flex items-center gap-4 p-3 bg-[#0A0F2C] rounded-lg border-l-4 ${stage.color}`}>
                          <GripVertical className="w-5 h-5 text-[#64748B]" />
                          <div className="flex-1">
                            <div className="text-white font-medium">{stage.name}</div>
                            <div className="text-[#64748B] text-xs">{stage.id}</div>
                          </div>
                          <span className="text-[#64748B] text-sm">Stage {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edit Stage Modal */}
                {showStageModal && editingStage && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 w-full max-w-lg">
                      <h3 className="text-lg font-semibold text-white mb-4">{editingStage.id ? 'Edit Stage' : 'Add Stage'}</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Stage Name</label>
                          <input
                            type="text"
                            value={editingStage.name}
                            onChange={e => setEditingStage({ ...editingStage, name: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Slug</label>
                          <input
                            type="text"
                            value={editingStage.slug}
                            onChange={e => setEditingStage({ ...editingStage, slug: e.target.value })}
                            placeholder="auto-generated"
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Partner Types</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: 'location_partner', label: 'Location Partner' },
                              { value: 'referral_partner', label: 'Referral Partner' },
                              { value: 'channel_partner', label: 'Channel Partner' },
                              { value: 'contractor', label: 'Contractor' },
                            ].map(pt => {
                              const partnerTypes = editingStage.partner_types || (editingStage.partner_type ? [editingStage.partner_type] : [])
                              const isChecked = partnerTypes.includes(pt.value)
                              return (
                                <label key={pt.value} className="flex items-center gap-2 p-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg cursor-pointer hover:border-[#0EA5E9]">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => {
                                      const newTypes = e.target.checked
                                        ? [...partnerTypes, pt.value]
                                        : partnerTypes.filter((t: string) => t !== pt.value)
                                      setEditingStage({ ...editingStage, partner_types: newTypes, partner_type: newTypes[0] || '' })
                                    }}
                                    className="w-4 h-4 rounded border-[#2D3B5F] bg-[#0A0F2C] text-[#0EA5E9]"
                                  />
                                  <span className="text-white text-sm">{pt.label}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Color</label>
                          <select
                            value={editingStage.color}
                            onChange={e => setEditingStage({ ...editingStage, color: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          >
                            <option value="border-blue-500">Blue</option>
                            <option value="border-green-500">Green</option>
                            <option value="border-yellow-500">Yellow</option>
                            <option value="border-orange-500">Orange</option>
                            <option value="border-purple-500">Purple</option>
                            <option value="border-pink-500">Pink</option>
                            <option value="border-cyan-500">Cyan</option>
                            <option value="border-red-500">Red</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Description</label>
                          <textarea
                            value={editingStage.description || ''}
                            onChange={e => setEditingStage({ ...editingStage, description: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white h-20"
                          />
                        </div>
                        <div>
                          <label className="block text-[#94A3B8] text-sm mb-2">Auto Action</label>
                          <select
                            value={editingStage.action_type || ''}
                            onChange={e => setEditingStage({ ...editingStage, action_type: e.target.value })}
                            className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                          >
                            <option value="">None</option>
                            <option value="send_email">Send Email</option>
                            <option value="schedule_call">Schedule Call</option>
                            <option value="create_task">Create Task</option>
                            <option value="send_agreement">Send Agreement</option>
                            <option value="notify_admin">Notify Admin</option>
                          </select>
                        </div>
                        {/* Send Email - Email Template dropdown */}
                        {editingStage.action_type === 'send_email' && (
                          <div>
                            <label className="block text-[#94A3B8] text-sm mb-2">Email Template</label>
                            <select
                              value={editingStage.email_template_id || ''}
                              onChange={e => setEditingStage({ ...editingStage, email_template_id: e.target.value })}
                              className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                            >
                              <option value="">Select template...</option>
                              {emailTemplates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {/* Schedule Call - Calendly Link dropdown */}
                        {editingStage.action_type === 'schedule_call' && (
                          <div>
                            <label className="block text-[#94A3B8] text-sm mb-2">Calendly Link</label>
                            <select
                              value={editingStage.calendly_link_id || ''}
                              onChange={e => setEditingStage({ ...editingStage, calendly_link_id: e.target.value })}
                              className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                            >
                              <option value="">Select link...</option>
                              {calendlyLinks.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {/* Create Task - Task type and assignee fields */}
                        {editingStage.action_type === 'create_task' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[#94A3B8] text-sm mb-2">Task Type</label>
                              <select
                                value={editingStage.task_type || ''}
                                onChange={e => setEditingStage({ ...editingStage, task_type: e.target.value })}
                                className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                              >
                                <option value="">Select task type...</option>
                                <option value="follow_up">Follow Up</option>
                                <option value="review">Review Application</option>
                                <option value="onboarding">Onboarding Task</option>
                                <option value="document_collection">Document Collection</option>
                                <option value="site_visit">Site Visit</option>
                                <option value="contract_review">Contract Review</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[#94A3B8] text-sm mb-2">Assign To</label>
                              <select
                                value={editingStage.task_assignee || ''}
                                onChange={e => setEditingStage({ ...editingStage, task_assignee: e.target.value })}
                                className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                              >
                                <option value="">Auto-assign (round robin)</option>
                                <option value="partner_manager">Partner Manager</option>
                                <option value="sales_team">Sales Team</option>
                                <option value="operations">Operations</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          </div>
                        )}
                        {/* Send Agreement - Agreement template dropdown */}
                        {editingStage.action_type === 'send_agreement' && (
                          <div>
                            <label className="block text-[#94A3B8] text-sm mb-2">Agreement Template</label>
                            <select
                              value={editingStage.agreement_template_id || ''}
                              onChange={e => setEditingStage({ ...editingStage, agreement_template_id: e.target.value })}
                              className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                            >
                              <option value="">Select agreement...</option>
                              <option value="location_partner_agreement">Location Partner Agreement</option>
                              <option value="referral_partner_agreement">Referral Partner Agreement</option>
                              <option value="channel_partner_agreement">Channel Partner Agreement</option>
                              <option value="contractor_agreement">Contractor Agreement</option>
                              <option value="nda">Non-Disclosure Agreement</option>
                            </select>
                          </div>
                        )}
                        {/* Notify Admin - Notification options */}
                        {editingStage.action_type === 'notify_admin' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[#94A3B8] text-sm mb-2">Notification Type</label>
                              <select
                                value={editingStage.notification_type || ''}
                                onChange={e => setEditingStage({ ...editingStage, notification_type: e.target.value })}
                                className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                              >
                                <option value="">Select type...</option>
                                <option value="email">Email</option>
                                <option value="slack">Slack</option>
                                <option value="sms">SMS</option>
                                <option value="in_app">In-App Notification</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[#94A3B8] text-sm mb-2">Notify</label>
                              <select
                                value={editingStage.notify_recipient || ''}
                                onChange={e => setEditingStage({ ...editingStage, notify_recipient: e.target.value })}
                                className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white"
                              >
                                <option value="">Select recipient...</option>
                                <option value="all_admins">All Admins</option>
                                <option value="partner_managers">Partner Managers</option>
                                <option value="sales_lead">Sales Lead</option>
                                <option value="operations_lead">Operations Lead</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => { setShowStageModal(false); setEditingStage(null) }}
                          className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => savePipelineStage(editingStage)}
                          className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'venues' && <VenuesTab />}


        {/* Devices Tab */}
        {activeTab === 'devices' && <DevicesTab />}

        {/* Device Purchases Tab */}
        {activeTab === 'device-purchases' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Device Purchases</h2>
                <p className="text-[#94A3B8] text-sm">Track and manage device purchase requests</p>
              </div>
              <Link
                href="/admin/device-purchases"
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Full View
              </Link>
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
              <p className="text-[#94A3B8]">Device purchase management</p>
              <p className="text-[#64748B] text-sm mt-1">Click &quot;Open Full View&quot; to access the full device purchases dashboard</p>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {/* Analytics Tab */}
        {activeTab === 'analytics' && <AnalyticsTab />}

      </div>

      {/* User Detail Modal - Enhanced */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2D3B5F] flex items-center justify-between sticky top-0 bg-[#1A1F3A] z-10">
              <h2 className="text-xl font-semibold text-white">User Details</h2>
              <button onClick={() => setShowUserModal(false)} className="p-2 text-[#64748B] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header with avatar and basic info */}
              <div className="flex items-start gap-4">
                <img
                  src={selectedUser.imageUrl || `https://ui-avatars.com/api/?name=${selectedUser.firstName}+${selectedUser.lastName}&background=0EA5E9&color=fff`}
                  alt=""
                  className="w-20 h-20 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-[#94A3B8]">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedUser.userType)}`}>
                      {selectedUser.userType || 'Unknown'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedUser.status !== 'approved' && (
                    <button
                      onClick={() => { updateUserStatus(selectedUser.id, 'approved'); setShowUserModal(false) }}
                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium text-sm"
                    >
                      ✓ Approve
                    </button>
                  )}
                  {selectedUser.status !== 'rejected' && (
                    <button
                      onClick={() => { updateUserStatus(selectedUser.id, 'rejected'); setShowUserModal(false) }}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium text-sm"
                    >
                      ✗ Reject
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddRoleModal(true)}
                    className="px-4 py-2 bg-[#0EA5E9]/20 text-[#0EA5E9] rounded-lg hover:bg-[#0EA5E9]/30 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Role
                  </button>
                </div>
              </div>

              {/* System Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="text-[#64748B] text-sm mb-1">User ID</div>
                  <div className="text-white font-mono text-xs break-all">{selectedUser.id}</div>
                </div>
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="text-[#64748B] text-sm mb-1">Joined</div>
                  <div className="text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="text-[#64748B] text-sm mb-1">Last Active</div>
                  <div className="text-white">Today</div>
                </div>
              </div>

              {/* Pipeline Progress (for Location Partners) */}
              {selectedUser.userType === 'Location Partner' && (
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-[#0EA5E9]" />
                    Pipeline Progress
                  </h4>
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {PIPELINE_STAGES.slice(0, 8).map((stage, index) => {
                      const isCompleted = index < 3 // Mock: first 3 stages completed
                      const isCurrent = index === 3 // Mock: current stage
                      return (
                        <div key={stage.id} className="flex items-center">
                          <div className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium ${isCompleted
                            ? 'bg-green-500/20 text-green-400'
                            : isCurrent
                              ? 'bg-[#0EA5E9]/20 text-[#0EA5E9] ring-1 ring-[#0EA5E9]'
                              : 'bg-[#2D3B5F]/50 text-[#64748B]'
                            }`}>
                            {isCompleted && '✓ '}{stage.name}
                          </div>
                          {index < 7 && (
                            <ChevronRight className={`w-4 h-4 mx-1 ${isCompleted ? 'text-green-400' : 'text-[#64748B]'}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#2D3B5F]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#64748B]">Current Stage:</span>
                      <span className="text-[#0EA5E9] font-medium">Discovery Scheduled</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-[#64748B]">Days in Stage:</span>
                      <span className="text-white">5 days</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Submission Data */}
              <div className="bg-[#0A0F2C] rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0EA5E9]" />
                  Application Form Data
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h5 className="text-[#0EA5E9] text-sm font-medium uppercase tracking-wide">Contact Info</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">Full Name</span>
                        <span className="text-white text-sm">{selectedUser.firstName} {selectedUser.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">Email</span>
                        <span className="text-white text-sm">{selectedUser.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">Phone</span>
                        <span className="text-white text-sm">(555) 123-4567</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">Preferred Contact</span>
                        <span className="text-white text-sm">Email</span>
                      </div>
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className="space-y-3">
                    <h5 className="text-[#0EA5E9] text-sm font-medium uppercase tracking-wide">Company Info</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">Company Name</span>
                        <span className="text-white text-sm">Sample Business LLC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">DBA</span>
                        <span className="text-white text-sm">Sample Cafe</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">Industry</span>
                        <span className="text-white text-sm">Food & Beverage</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm"># of Locations</span>
                        <span className="text-white text-sm">2</span>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="space-y-3">
                    <h5 className="text-[#0EA5E9] text-sm font-medium uppercase tracking-wide">Location</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">Address</span>
                        <span className="text-white text-sm">123 Main Street</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">City</span>
                        <span className="text-white text-sm">Atlanta</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">State</span>
                        <span className="text-white text-sm">GA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">Zip</span>
                        <span className="text-white text-sm">30301</span>
                      </div>
                    </div>
                  </div>

                  {/* Venue Details */}
                  <div className="space-y-3">
                    <h5 className="text-[#0EA5E9] text-sm font-medium uppercase tracking-wide">Venue Details</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">Venue Type</span>
                        <span className="text-white text-sm">Café / Coffee Shop</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">Sq Footage</span>
                        <span className="text-white text-sm">2,500 sqft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">Daily Foot Traffic</span>
                        <span className="text-white text-sm">150-200</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] text-sm">Has Existing WiFi</span>
                        <span className="text-white text-sm">Yes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="mt-4 pt-4 border-t border-[#2D3B5F]">
                  <h5 className="text-[#0EA5E9] text-sm font-medium uppercase tracking-wide mb-2">Additional Notes</h5>
                  <p className="text-[#94A3B8] text-sm italic">
                    &quot;Interested in expanding to all 3 locations if pilot goes well. Has existing Ubiquiti equipment at main location.&quot;
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-[#0A0F2C] rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0EA5E9]" />
                  Activity Timeline
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                    <div>
                      <div className="text-white text-sm">Application Approved</div>
                      <div className="text-[#64748B] text-xs">Dec 7, 2025 at 2:30 PM by Admin</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#0EA5E9] mt-2"></div>
                    <div>
                      <div className="text-white text-sm">Discovery Call Scheduled</div>
                      <div className="text-[#64748B] text-xs">Dec 8, 2025 at 10:00 AM</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2"></div>
                    <div>
                      <div className="text-white text-sm">Awaiting Discovery Call</div>
                      <div className="text-[#64748B] text-xs">Scheduled for Dec 12, 2025</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-[#2D3B5F] pt-6">
                <h4 className="text-white font-medium mb-3">Quick Actions</h4>
                <div className="grid grid-cols-4 gap-3">
                  <button className="p-3 bg-[#0A0F2C] rounded-lg text-[#94A3B8] hover:bg-[#2D3B5F] hover:text-white transition-colors text-sm text-center">
                    <Mail className="w-5 h-5 mx-auto mb-1" />
                    Send Email
                  </button>
                  <button className="p-3 bg-[#0A0F2C] rounded-lg text-[#94A3B8] hover:bg-[#2D3B5F] hover:text-white transition-colors text-sm text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-1" />
                    Schedule Call
                  </button>
                  <button className="p-3 bg-[#0A0F2C] rounded-lg text-[#94A3B8] hover:bg-[#2D3B5F] hover:text-white transition-colors text-sm text-center">
                    <FileText className="w-5 h-5 mx-auto mb-1" />
                    Send LOI
                  </button>
                  <button className="p-3 bg-[#0A0F2C] rounded-lg text-[#94A3B8] hover:bg-[#2D3B5F] hover:text-white transition-colors text-sm text-center">
                    <Wallet className="w-5 h-5 mx-auto mb-1" />
                    Tipalti Invite
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {selectedUser && (
        <AddRoleModal
          user={{
            id: selectedUser.id,
            email: selectedUser.email,
            firstName: selectedUser.firstName,
            lastName: selectedUser.lastName,
            userType: selectedUser.userType,
            userRoles: selectedUser.userRoles || [selectedUser.userType],
            referralPartnerId: selectedUser.referralPartnerId
          }}
          isOpen={showAddRoleModal}
          onClose={() => setShowAddRoleModal(false)}
          onSuccess={() => {
            fetchUsers()
            setShowAddRoleModal(false)
          }}
        />
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-[#2D3B5F] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Invite User</h2>
              <button onClick={() => setShowInviteModal(false)} className="p-2 text-[#64748B] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">User Type</label>
                <select
                  value={inviteUserType}
                  onChange={(e) => setInviteUserType(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                >
                  {USER_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <button
                onClick={sendInvite}
                disabled={inviteSending || !inviteEmail.trim()}
                className="w-full py-3 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviteSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Template Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2D3B5F] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Edit Email Template</h2>
              <button onClick={() => setEditingTemplate(null)} className="p-2 text-[#64748B] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Template Name</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Subject Line</label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Greeting</label>
                <input
                  type="text"
                  value={editingTemplate.greeting}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, greeting: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-[#94A3B8]">
                  <input
                    type="checkbox"
                    checked={editingTemplate.enabled}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-[#2D3B5F]"
                  />
                  Template Enabled
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#2D3B5F]">
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="flex-1 py-3 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setEmailTemplates(prev => prev.map(t => t.id === editingTemplate.id ? editingTemplate : t))
                    setEditingTemplate(null)
                  }}
                  className="flex-1 py-3 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Reminder Modal */}
      {showReminderModal && selectedPartnerForFollowUp && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-[#2D3B5F] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Send Reminder</h2>
              <button onClick={() => { setShowReminderModal(false); setReminderNote(''); setReminderType('email') }} className="p-2 text-[#64748B] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Partner Info */}
              <div className="bg-[#0A0F2C] rounded-lg p-4">
                <div className="text-white font-medium">{selectedPartnerForFollowUp.contactFullName}</div>
                <div className="text-[#94A3B8] text-sm">{selectedPartnerForFollowUp.companyLegalName}</div>
                <div className="text-[#64748B] text-xs mt-1">
                  {selectedPartnerForFollowUp.contactEmail} • {selectedPartnerForFollowUp.contactPhone}
                </div>
              </div>

              {/* Waiting For Info */}
              <div className="bg-[#0A0F2C] rounded-lg p-4">
                <div className="text-[#64748B] text-xs mb-1">Waiting For:</div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{WAITING_TYPES.find(w => w.id === selectedPartnerForFollowUp.waitingFor)?.icon || '⏳'}</span>
                  <span className="text-white">{WAITING_TYPES.find(w => w.id === selectedPartnerForFollowUp.waitingFor)?.label || selectedPartnerForFollowUp.waitingFor}</span>
                </div>
                {selectedPartnerForFollowUp.followUpAttempts && selectedPartnerForFollowUp.followUpAttempts.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#2D3B5F]">
                    <div className="text-[#64748B] text-xs mb-1">Previous Attempts ({selectedPartnerForFollowUp.followUpAttempts.length}):</div>
                    <div className="space-y-1">
                      {selectedPartnerForFollowUp.followUpAttempts.slice(-3).map((attempt, i) => (
                        <div key={i} className="text-[#94A3B8] text-xs flex items-center gap-2">
                          {attempt.type === 'email' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                          {new Date(attempt.sentAt).toLocaleDateString()} - {attempt.note || 'No note'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reminder Type */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Reminder Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReminderType('email')}
                    className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${reminderType === 'email'
                      ? 'bg-[#0EA5E9] text-white'
                      : 'bg-[#0A0F2C] text-[#94A3B8] hover:bg-[#2D3B5F]'
                      }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    onClick={() => setReminderType('sms')}
                    className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${reminderType === 'sms'
                      ? 'bg-green-500 text-white'
                      : 'bg-[#0A0F2C] text-[#94A3B8] hover:bg-[#2D3B5F]'
                      }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </button>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Internal Note (optional)</label>
                <textarea
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  placeholder="Add a note about this reminder attempt..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-[#2D3B5F]">
                <button
                  onClick={() => { setShowReminderModal(false); setReminderNote(''); setReminderType('email') }}
                  className="flex-1 py-3 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => sendReminder(selectedPartnerForFollowUp.id, reminderType, reminderNote)}
                  disabled={sendingReminder}
                  className={`flex-1 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${reminderType === 'email' ? 'bg-[#0EA5E9] hover:bg-[#0EA5E9]/80' : 'bg-green-500 hover:bg-green-500/80'
                    }`}
                >
                  {sendingReminder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send {reminderType === 'email' ? 'Email' : 'SMS'} Reminder
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Editor Modal */}
      {showFormEditorModal && editingForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2D3B5F] flex items-center justify-between sticky top-0 bg-[#1A1F3A] z-10">
              <div>
                <h2 className="text-xl font-semibold text-white">Edit Form: {editingForm.name}</h2>
                <p className="text-[#64748B] text-sm">Manage form fields and settings</p>
              </div>
              <button onClick={() => { setShowFormEditorModal(false); setEditingForm(null) }} className="p-2 text-[#64748B] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Form Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">Form Name</label>
                  <input
                    type="text"
                    value={editingForm.name}
                    onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">Status</label>
                  <select
                    value={editingForm.settings.status}
                    onChange={(e) => setEditingForm({
                      ...editingForm,
                      settings: { ...editingForm.settings, status: e.target.value as 'active' | 'draft' | 'closed' }
                    })}
                    className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Form Fields */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">Form Fields ({editingForm.fields?.length || 0})</h3>
                  <button
                    onClick={() => {
                      const newField: FormField = {
                        id: `field_${Date.now()}`,
                        type: 'text',
                        label: 'New Field',
                        name: `new_field_${Date.now()}`,
                        required: false
                      }
                      setEditingForm({
                        ...editingForm,
                        fields: [...(editingForm.fields || []), newField]
                      })
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#0EA5E9]/20 text-[#0EA5E9] rounded-lg hover:bg-[#0EA5E9]/30 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </button>
                </div>

                <div className="space-y-3">
                  {(editingForm.fields || []).map((field: FormField, index: number) => (
                    <div key={field.id} className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-[#64748B] pt-2">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[#64748B] text-xs mb-1">Label</label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => {
                                const newFields = [...(editingForm.fields || [])]
                                newFields[index] = { ...field, label: e.target.value }
                                setEditingForm({ ...editingForm, fields: newFields })
                              }}
                              className="w-full px-3 py-1.5 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#64748B] text-xs mb-1">Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => {
                                const newFields = [...(editingForm.fields || [])]
                                newFields[index] = { ...field, type: e.target.value as 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'number' | 'checkbox' }
                                setEditingForm({ ...editingForm, fields: newFields })
                              }}
                              className="w-full px-3 py-1.5 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                              <option value="textarea">Textarea</option>
                              <option value="number">Number</option>
                              <option value="select">Dropdown</option>
                              <option value="checkbox">Checkbox</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[#64748B] text-xs mb-1">Field Name</label>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => {
                                const newFields = [...(editingForm.fields || [])]
                                newFields[index] = { ...field, name: e.target.value }
                                setEditingForm({ ...editingForm, fields: newFields })
                              }}
                              className="w-full px-3 py-1.5 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white text-sm font-mono focus:outline-none focus:border-[#0EA5E9]"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => {
                                  const newFields = [...(editingForm.fields || [])]
                                  newFields[index] = { ...field, required: e.target.checked }
                                  setEditingForm({ ...editingForm, fields: newFields })
                                }}
                                className="rounded border-[#2D3B5F] bg-[#1A1F3A] text-[#0EA5E9] focus:ring-[#0EA5E9]"
                              />
                              Required
                            </label>
                            <button
                              onClick={() => {
                                const newFields = (editingForm.fields || []).filter((_: FormField, i: number) => i !== index)
                                setEditingForm({ ...editingForm, fields: newFields })
                              }}
                              className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {field.type === 'select' && (
                        <div className="mt-3 ml-9">
                          <label className="block text-[#64748B] text-xs mb-1">Options (comma separated)</label>
                          <input
                            type="text"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => {
                              const newFields = [...(editingForm.fields || [])]
                              newFields[index] = { ...field, options: e.target.value.split(',').map(o => o.trim()) }
                              setEditingForm({ ...editingForm, fields: newFields })
                            }}
                            placeholder="Option 1, Option 2, Option 3"
                            className="w-full px-3 py-1.5 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-4 border-t border-[#2D3B5F]">
                <button
                  onClick={() => { setShowFormEditorModal(false); setEditingForm(null) }}
                  className="px-6 py-2 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setForms(forms.map(f => f.id === editingForm.id ? editingForm : f))
                    setShowFormEditorModal(false)
                    setEditingForm(null)
                  }}
                  className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {showSubmissionDetailModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2D3B5F] flex items-center justify-between sticky top-0 bg-[#1A1F3A] z-10">
              <div>
                <h2 className="text-xl font-semibold text-white">Submission Details</h2>
                <p className="text-[#64748B] text-sm">{selectedSubmission.formName}</p>
              </div>
              <button onClick={() => { setShowSubmissionDetailModal(false); setSelectedSubmission(null) }} className="p-2 text-[#64748B] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Meta */}
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedSubmission.status === 'new' ? 'bg-yellow-500/20 text-yellow-400' :
                  selectedSubmission.status === 'reviewed' ? 'bg-blue-500/20 text-blue-400' :
                    selectedSubmission.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                  }`}>
                  {selectedSubmission.status}
                </span>
                <span className="text-[#64748B] text-sm">
                  Submitted {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </span>
              </div>

              {/* All Submission Data */}
              <div className="space-y-4">
                <h3 className="text-white font-medium">Form Data</h3>
                <div className="bg-[#0A0F2C] rounded-lg divide-y divide-[#2D3B5F]">
                  {Object.entries(selectedSubmission.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start p-3">
                      <span className="text-[#64748B] text-sm capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-white text-sm text-right max-w-[60%]">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value) || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-[#2D3B5F]">
                {selectedSubmission.status === 'new' && (
                  <button
                    onClick={() => {
                      updateSubmissionStatus(selectedSubmission.id, 'reviewed')
                      setSelectedSubmission({ ...selectedSubmission, status: 'reviewed' })
                    }}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    Mark Reviewed
                  </button>
                )}
                {selectedSubmission.status !== 'approved' && (
                  <button
                    onClick={() => {
                      updateSubmissionStatus(selectedSubmission.id, 'approved')
                      setSelectedSubmission({ ...selectedSubmission, status: 'approved' })
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Approve
                  </button>
                )}
                {selectedSubmission.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      updateSubmissionStatus(selectedSubmission.id, 'rejected')
                      setSelectedSubmission({ ...selectedSubmission, status: 'rejected' })
                    }}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Reject
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