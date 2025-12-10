'use client'

// removed TipaltiIFrame import
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import CryptoPriceHeader from '@/components/CryptoPriceHeader'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, Package, FileText, Shield, LayoutDashboard, XCircle, ChevronLeft, Wifi,
  Bell, Search, Plus, Edit, Trash2, Eye, CheckCircle, Clock, Calendar, Mail,
  Send, Phone, MapPin, Building2, DollarSign, TrendingUp, BarChart3, Settings,
  GitBranch, Calculator, ClipboardList, Copy, Check, RefreshCw, ChevronDown,
  GripVertical, AlertCircle, SkipForward, X, UserPlus
} from 'lucide-react'


type TabType = 'overview' | 'users' | 'pipeline' | 'follow-ups' | 'products' | 'approved-products' | 'blog' | 'forms' | 'calculators' | 'payments' | 'settings' | 'analytics'

interface FollowUpAttempt {
  id: string
  sentAt: string
  type: 'email' | 'sms' | 'call'
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
  waitingFor?: 'calendly_discovery' | 'calendly_install' | 'calendly_review' | 'pandadoc_loi' | 'pandadoc_contract' | 'tipalti_setup' | 'portal_setup' | 'equipment_delivery' | 'other'
  waitingForLabel?: string
  waitingSince?: string
  followUpAttempts?: FollowUpAttempt[]
  lastContactDate?: string
  nextFollowUpDate?: string
  followUpNotes?: string
  status?: 'active' | 'inactive' | 'paused'
  partnerType?: string
}

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
  description: string
  trigger: string
  subject: string
  body: string
  isActive: boolean
  hasCalendly?: boolean
  enabled?: boolean
  greeting?: string
  bodyParagraphs?: string[]
  ctaText?: string
  ctaType?: string
  footerText?: string
}

interface CalendlyLink {
  id: string
  name: string
  duration: number
  description?: string
  active: boolean
  schedulingUrl: string
  slug?: string
  url?: string
  color?: string
}

interface Dropdown {
  id: string
  key: string
  name: string
  options: { value: string; label: string; isActive: boolean; order: number }[]
  allowCustom: boolean
}

const USER_TYPES = [
  'Administrator', 'Employee', 'Location Partner', 'Referral Partner',
  'Channel Partner', 'Relationship Partner', 'Contractor', 'Customer', 'Calculator Access'
]

const PIPELINE_STAGES = [
  { id: 'application', name: 'Application', color: 'border-blue-500', bgColor: 'bg-blue-500', waitingFor: null },
  { id: 'initial_review', name: 'Initial Review', color: 'border-yellow-500', bgColor: 'bg-yellow-500', waitingFor: null },
  { id: 'discovery_scheduled', name: 'Discovery', color: 'border-purple-500', bgColor: 'bg-purple-500', waitingFor: 'calendly_discovery' },
  { id: 'discovery_complete', name: 'Post-Call', color: 'border-yellow-500', bgColor: 'bg-yellow-500', waitingFor: null },
  { id: 'venues_setup', name: 'Venues Setup', color: 'border-cyan-500', bgColor: 'bg-cyan-500', waitingFor: null },
  { id: 'loi_sent', name: 'LOI Sent', color: 'border-orange-500', bgColor: 'bg-orange-500', waitingFor: 'pandadoc_loi' },
  { id: 'loi_signed', name: 'LOI Signed', color: 'border-green-500', bgColor: 'bg-green-500', waitingFor: null },
  { id: 'install_scheduled', name: 'Install', color: 'border-pink-500', bgColor: 'bg-pink-500', waitingFor: 'calendly_install' },
  { id: 'trial_active', name: 'Trial', color: 'border-indigo-500', bgColor: 'bg-indigo-500', waitingFor: null },
  { id: 'trial_ending', name: 'Trial Ending', color: 'border-amber-500', bgColor: 'bg-amber-500', waitingFor: 'calendly_review' },
  { id: 'contract_sent', name: 'Contract Sent', color: 'border-orange-500', bgColor: 'bg-orange-500', waitingFor: 'pandadoc_contract' },
  { id: 'active', name: 'Active', color: 'border-green-500', bgColor: 'bg-green-500', waitingFor: null },
  { id: 'inactive', name: 'Inactive', color: 'border-gray-500', bgColor: 'bg-gray-500', waitingFor: null },
]

const WAITING_TYPES = [
  { id: 'calendly_discovery', label: 'Waiting: Book Discovery Call', shortLabel: 'Discovery Call', icon: '📅', category: 'calendly', description: 'Partner needs to book their discovery call' },
  { id: 'calendly_install', label: 'Waiting: Book Install Appointment', shortLabel: 'Install Booking', icon: '🔧', category: 'calendly', description: 'Partner needs to schedule installation' },
  { id: 'calendly_review', label: 'Waiting: Book Review Call', shortLabel: 'Review Call', icon: '📊', category: 'calendly', description: 'Partner needs to book trial review call' },
  { id: 'pandadoc_loi', label: 'Waiting: Sign LOI', shortLabel: 'LOI Signature', icon: '📝', category: 'pandadoc', description: 'Partner needs to sign Letter of Intent' },
  { id: 'pandadoc_contract', label: 'Waiting: Sign Contract', shortLabel: 'Contract', icon: '📄', category: 'pandadoc', description: 'Partner needs to sign deployment contract' },
  { id: 'tipalti_setup', label: 'Waiting: Setup Payment', shortLabel: 'Tipalti Setup', icon: '💰', category: 'tipalti', description: 'Partner needs to complete Tipalti setup' },
  { id: 'portal_setup', label: 'Waiting: Activate Portal', shortLabel: 'Portal Setup', icon: '🔐', category: 'portal', description: 'Partner needs to activate their portal' },
  { id: 'equipment_delivery', label: 'Waiting: Equipment Arrival', shortLabel: 'Equipment', icon: '📦', category: 'logistics', description: 'Equipment in transit to partner' },
  { id: 'venue_info', label: 'Waiting: Venue Details', shortLabel: 'Venue Info', icon: '🏢', category: 'info', description: 'Partner needs to provide venue information' },
  { id: 'response', label: 'Waiting: Response', shortLabel: 'Response', icon: '💬', category: 'communication', description: 'Waiting for partner to respond' },
  { id: 'other', label: 'Waiting: Other', shortLabel: 'Other', icon: '⏳', category: 'other', description: 'Other pending item' },
]

const EMAIL_TRIGGERS = [
  { id: 'application_approved', label: 'Application Approved', stage: 'initial_review' },
  { id: 'application_denied', label: 'Application Denied', stage: 'initial_review' },
  { id: 'discovery_scheduled', label: 'Discovery Call Scheduled', stage: 'discovery_scheduled' },
  { id: 'post_call_approved', label: 'Post-Call Approved', stage: 'discovery_complete' },
  { id: 'post_call_denied', label: 'Post-Call Denied', stage: 'discovery_complete' },
  { id: 'venues_setup_complete', label: 'Venues Setup Complete', stage: 'venues_setup' },
  { id: 'loi_sent', label: 'LOI Sent', stage: 'loi_sent' },
  { id: 'loi_signed', label: 'LOI Signed', stage: 'loi_signed' },
  { id: 'install_scheduled', label: 'Install Scheduled', stage: 'install_scheduled' },
  { id: 'trial_started', label: 'Trial Started', stage: 'trial_active' },
  { id: 'trial_ending_10_days', label: 'Trial Ending (10 days)', stage: 'trial_ending' },
  { id: 'trial_ending_3_days', label: 'Trial Ending (3 days)', stage: 'trial_ending' },
  { id: 'contract_sent', label: 'Contract Sent', stage: 'contract_sent' },
  { id: 'contract_signed', label: 'Contract Signed', stage: 'active' },
  { id: 'manual', label: 'Manual Send Only', stage: null },
]

const PARTNER_STATUSES = ['active', 'inactive', 'paused', 'pending']
const PARTNER_TYPES = ['Location Partner', 'Referral Partner', 'Channel Partner', 'Relationship Partner']

const REMINDER_THRESHOLDS = {
  first: 3,
  second: 7,
  third: 14,
  inactive: 30,
}

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to SkyYield Partner Program!',
    description: 'Sent when a new partner signs up',
    trigger: 'partner_signup',
    body: 'Welcome to SkyYield! We are excited to have you join our partner program. Our team will be in touch shortly to help you get started.',
    isActive: true,
    hasCalendly: true,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['Welcome to the SkyYield Partner Program! We are thrilled to have you on board.', 'Our team will guide you through the onboarding process and answer any questions you may have.'],
    ctaText: 'Schedule Onboarding Call',
    ctaType: 'calendly',
    footerText: 'Best regards, The SkyYield Team',
  },
  {
    id: 'contract_sent',
    name: 'Contract Sent',
    subject: 'Your SkyYield Partnership Agreement is Ready',
    description: 'Sent when contract is sent via PandaDoc',
    trigger: 'contract_sent',
    body: 'Your partnership agreement is ready for review and signature. Please click the link below to access your document.',
    isActive: true,
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['Your SkyYield Partnership Agreement is ready for your review.', 'Please take a moment to review the terms and sign the document at your earliest convenience.'],
    ctaText: 'Review Contract',
    ctaType: 'none',
    footerText: 'If you have any questions, please don\'t hesitate to reach out.',
  },
  {
    id: 'contract_signed',
    name: 'Contract Signed Confirmation',
    subject: 'Partnership Agreement Confirmed - Welcome Aboard!',
    description: 'Sent after partner signs the contract',
    trigger: 'contract_signed',
    body: 'Thank you for signing your partnership agreement! We are excited to officially welcome you to the SkyYield family.',
    isActive: true,
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['Congratulations! Your partnership agreement has been signed and confirmed.', 'Next steps: Our team will reach out to schedule your technical setup and installation.'],
    ctaText: 'View Dashboard',
    ctaType: 'custom',
    footerText: 'Welcome to the SkyYield family!',
  },
  {
    id: 'tipalti_setup',
    name: 'Payment Setup Required',
    subject: 'Set Up Your Payment Account - Action Required',
    description: 'Sent to prompt Tipalti payment setup',
    trigger: 'tipalti_setup',
    body: 'To receive your earnings, please complete your payment account setup through our secure payment portal.',
    isActive: true,
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['To ensure you receive your earnings on time, please set up your payment account.', 'This secure process only takes a few minutes and ensures fast, reliable payments.'],
    ctaText: 'Set Up Payments',
    ctaType: 'none',
    footerText: 'Questions? Contact our support team.',
  },
  {
    id: 'payment_sent',
    name: 'Payment Sent',
    subject: 'Your SkyYield Payment Has Been Sent',
    description: 'Sent when a payment is processed',
    trigger: 'payment_sent',
    body: 'Great news! Your payment has been processed and is on its way to your account.',
    isActive: true,
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['Your payment of {{amount}} has been processed and sent to your account.', 'Funds typically arrive within 2-3 business days depending on your payment method.'],
    ctaText: 'View Payment Details',
    ctaType: 'custom',
    footerText: 'Thank you for being a SkyYield partner!',
  },
  {
    id: 'installation_scheduled',
    name: 'Installation Scheduled',
    subject: 'Your SkyYield Installation is Confirmed',
    description: 'Sent when installation appointment is scheduled',
    trigger: 'installation_scheduled',
    body: 'Your WiFi access point installation has been scheduled. Our technician will arrive at the confirmed date and time.',
    isActive: true,
    hasCalendly: true,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['Your installation appointment has been confirmed!', 'Our certified technician will arrive at {{date}} to complete your setup.'],
    ctaText: 'Reschedule if Needed',
    ctaType: 'calendly',
    footerText: 'Please ensure someone is available to provide access.',
  },
  {
    id: 'installation_complete',
    name: 'Installation Complete',
    subject: 'Your SkyYield System is Now Live!',
    description: 'Sent after successful installation',
    trigger: 'installation_complete',
    body: 'Congratulations! Your SkyYield WiFi system has been successfully installed and is now live.',
    isActive: true,
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['Great news! Your SkyYield system is now live and ready to start generating revenue.', 'You can monitor your performance and earnings through your partner dashboard.'],
    ctaText: 'View Dashboard',
    ctaType: 'custom',
    footerText: 'Start earning passive income today!',
  },
  {
    id: 'followup_reminder',
    name: 'Follow-up Reminder',
    subject: 'Checking In - SkyYield Partnership',
    description: 'Sent as a follow-up for pending actions',
    trigger: 'followup_reminder',
    body: 'We noticed there are some pending items on your account. Let us help you complete your setup.',
    isActive: true,
    hasCalendly: true,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['We wanted to follow up on your SkyYield partnership.', 'It looks like there are some items that need your attention to complete your setup.'],
    ctaText: 'Schedule a Call',
    ctaType: 'calendly',
    footerText: 'We\'re here to help!',
  },
  {
    id: 'monthly_report',
    name: 'Monthly Performance Report',
    subject: 'Your SkyYield Monthly Report - {{month}}',
    description: 'Sent monthly with performance summary',
    trigger: 'monthly_report',
    body: 'Your monthly performance report is ready. See how your location performed this month.',
    isActive: true,
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['Your monthly performance report for {{month}} is ready!', 'This month you earned {{amount}} from {{data_usage}} of data offloaded.'],
    ctaText: 'View Full Report',
    ctaType: 'custom',
    footerText: 'Keep up the great work!',
  },
  {
    id: 'referral_bonus',
    name: 'Referral Bonus Earned',
    subject: 'You Earned a Referral Bonus!',
    description: 'Sent when a referral bonus is credited',
    trigger: 'referral_bonus',
    body: 'Congratulations! You\'ve earned a referral bonus for bringing a new partner to SkyYield.',
    isActive: true,
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['Great news! Your referral {{referral_name}} has completed their setup.', 'A bonus of {{amount}} has been added to your account.'],
    ctaText: 'Refer More Partners',
    ctaType: 'custom',
    footerText: 'Thank you for spreading the word!',
  },
  {
    id: 'equipment_shipped',
    name: 'Equipment Shipped',
    subject: 'Your SkyYield Equipment is On the Way',
    description: 'Sent when equipment is shipped',
    trigger: 'equipment_shipped',
    body: 'Your WiFi equipment has been shipped and is on its way to you.',
    isActive: true,
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['Your SkyYield equipment has been shipped!', 'Tracking number: {{tracking_number}}. Expected delivery: {{delivery_date}}.'],
    ctaText: 'Track Shipment',
    ctaType: 'custom',
    footerText: 'Get ready for installation!',
  },
  {
    id: 'support_ticket',
    name: 'Support Ticket Received',
    subject: 'Support Request Received - Ticket #{{ticket_id}}',
    description: 'Sent when a support ticket is created',
    trigger: 'support_ticket',
    body: 'We\'ve received your support request and our team is working on it.',
    isActive: true,
    hasCalendly: true,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['We\'ve received your support request (Ticket #{{ticket_id}}).', 'Our team will review your issue and respond within 24 hours.'],
    ctaText: 'Schedule Support Call',
    ctaType: 'calendly',
    footerText: 'We\'re here to help!',
  },
  {
    id: 'account_inactive',
    name: 'Account Inactive Notice',
    subject: 'We Miss You - SkyYield Partnership',
    description: 'Sent when account has been inactive',
    trigger: 'account_inactive',
    body: 'We noticed your SkyYield account has been inactive. Let us help you get back on track.',
    isActive: true,
    hasCalendly: false,
    enabled: true,
    greeting: 'Hi {{name}},',
    bodyParagraphs: ['We noticed it\'s been a while since we\'ve seen activity on your account.', 'Is there anything we can help with? We\'d love to help you maximize your earnings.'],
    ctaText: 'Contact Support',
    ctaType: 'custom',
    footerText: 'We\'re here when you\'re ready!',
  },
]

interface PaymentPartner {
  id: string
  name: string
  email: string
  company?: string
  partnerType: string
  payeeId?: string
  totalEarned: number
  totalPaid: number
  pendingAmount: number
  tipaltiStatus: 'active' | 'pending' | 'inactive' | 'not_setup'
  tipaltiPayeeId: string
  lastPaymentDate?: string
  lastPaymentAmount?: number
  totalEarnings?: number
  paymentStatus?: string
}

const MOCK_PAYMENT_PARTNERS: PaymentPartner[] = [
  {
    id: 'pay-1',
    name: 'John Smith',
    email: 'john@coffeeshop.com',
    company: 'Downtown Coffee Shop',
    partnerType: 'Location Partner',
    payeeId: 'tip-001',
    tipaltiPayeeId: 'tip-001',
    tipaltiStatus: 'active',
    totalEarned: 4500,
    totalPaid: 3200,
    pendingAmount: 1300,
    lastPaymentDate: '2024-11-15',
    lastPaymentAmount: 850,
  },
  {
    id: 'pay-2',
    name: 'Sarah Johnson',
    email: 'sarah@fitnesscenter.com',
    company: 'FitLife Gym',
    partnerType: 'Location Partner',
    payeeId: 'tip-002',
    tipaltiPayeeId: 'tip-002',
    tipaltiStatus: 'active',
    totalEarned: 8200,
    totalPaid: 7000,
    pendingAmount: 1200,
    lastPaymentDate: '2024-11-20',
    lastPaymentAmount: 1200,
  },
  {
    id: 'pay-3',
    name: 'Mike Chen',
    email: 'mike@techsolutions.com',
    company: 'Tech Solutions Inc',
    partnerType: 'Channel Partner',
    payeeId: 'tip-003',
    tipaltiPayeeId: 'tip-003',
    tipaltiStatus: 'pending',
    totalEarned: 2500,
    totalPaid: 0,
    pendingAmount: 2500,
  },
  {
    id: 'pay-4',
    name: 'Emily Davis',
    email: 'emily@retailgroup.com',
    company: 'Retail Group LLC',
    partnerType: 'Location Partner',
    payeeId: 'tip-004',
    tipaltiPayeeId: 'tip-004',
    tipaltiStatus: 'not_setup',
    totalEarned: 1800,
    totalPaid: 0,
    pendingAmount: 1800,
  },
  {
    id: 'pay-5',
    name: 'David Wilson',
    email: 'david@hotelchain.com',
    company: 'Comfort Inn Downtown',
    partnerType: 'Location Partner',
    payeeId: 'tip-005',
    tipaltiPayeeId: 'tip-005',
    tipaltiStatus: 'active',
    totalEarned: 12500,
    totalPaid: 11000,
    pendingAmount: 1500,
    lastPaymentDate: '2024-11-18',
    lastPaymentAmount: 2200,
  },
  {
    id: 'pay-6',
    name: 'Lisa Martinez',
    email: 'lisa@networksales.com',
    company: 'Network Sales Pro',
    partnerType: 'Referral Partner',
    payeeId: 'tip-006',
    tipaltiPayeeId: 'tip-006',
    tipaltiStatus: 'active',
    totalEarned: 3400,
    totalPaid: 2800,
    pendingAmount: 600,
    lastPaymentDate: '2024-11-10',
    lastPaymentAmount: 600,
  },
]

const DEFAULT_CALENDLY_LINKS: CalendlyLink[] = [
  {
    id: 'cal-1',
    name: 'Discovery Call',
    slug: 'discovery-call',
    url: 'https://calendly.com/skyyield/discovery',
    schedulingUrl: 'https://calendly.com/skyyield/discovery',
    duration: 30,
    description: 'Initial discovery call with potential partners',
    active: true,
    color: '#0EA5E9',
  },
  {
    id: 'cal-2',
    name: 'Partner Onboarding',
    slug: 'partner-onboarding',
    url: 'https://calendly.com/skyyield/onboarding',
    schedulingUrl: 'https://calendly.com/skyyield/onboarding',
    duration: 60,
    description: 'Full onboarding session for new partners',
    active: true,
    color: '#10F981',
  },
  {
    id: 'cal-3',
    name: 'Technical Setup',
    slug: 'technical-setup',
    url: 'https://calendly.com/skyyield/technical',
    schedulingUrl: 'https://calendly.com/skyyield/technical',
    duration: 45,
    description: 'Technical installation and configuration support',
    active: true,
    color: '#8B5CF6',
  },
  {
    id: 'cal-4',
    name: 'Contract Review',
    slug: 'contract-review',
    url: 'https://calendly.com/skyyield/contract',
    schedulingUrl: 'https://calendly.com/skyyield/contract',
    duration: 30,
    description: 'Review and discuss partnership agreement',
    active: true,
    color: '#F59E0B',
  },
  {
    id: 'cal-5',
    name: 'Support Call',
    slug: 'support-call',
    url: 'https://calendly.com/skyyield/support',
    schedulingUrl: 'https://calendly.com/skyyield/support',
    duration: 30,
    description: 'General support and troubleshooting',
    active: true,
    color: '#EF4444',
  },
  {
    id: 'cal-6',
    name: 'Quarterly Review',
    slug: 'quarterly-review',
    url: 'https://calendly.com/skyyield/quarterly',
    schedulingUrl: 'https://calendly.com/skyyield/quarterly',
    duration: 45,
    description: 'Quarterly performance review with partners',
    active: true,
    color: '#06B6D4',
  },
]

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

type VenueProfile = {
  name: string
  label: string
  wifiMultiplier: number
  avgDwell: string
  avgDataGB: number
  description?: string
}

const VENUE_PROFILES: Record<string, VenueProfile> = {
  // Food & Beverage
  cafe_coffee: { name: 'Coffee Shop', label: 'Coffee Shop', wifiMultiplier: 1.2, avgDwell: '45 min', avgDataGB: 0.5, description: 'High WiFi usage during work sessions' },
  restaurant_casual: { name: 'Casual Restaurant', label: 'Casual Restaurant', wifiMultiplier: 0.8, avgDwell: '60 min', avgDataGB: 0.3, description: 'Moderate usage during meals' },
  restaurant_fine: { name: 'Fine Dining', label: 'Fine Dining', wifiMultiplier: 0.4, avgDwell: '90 min', avgDataGB: 0.2, description: 'Lower usage, focus on experience' },
  bar_lounge: { name: 'Bar/Lounge', label: 'Bar/Lounge', wifiMultiplier: 0.6, avgDwell: '120 min', avgDataGB: 0.4, description: 'Social venue with moderate usage' },
  fast_food: { name: 'Fast Food', label: 'Fast Food', wifiMultiplier: 0.9, avgDwell: '20 min', avgDataGB: 0.2, description: 'Quick visits, mobile-focused' },
  bakery: { name: 'Bakery', label: 'Bakery', wifiMultiplier: 1.0, avgDwell: '30 min', avgDataGB: 0.4, description: 'Morning rush work sessions' },
  food_court: { name: 'Food Court', label: 'Food Court', wifiMultiplier: 0.7, avgDwell: '40 min', avgDataGB: 0.3, description: 'High volume, shorter sessions' },
  juice_bar: { name: 'Juice Bar', label: 'Juice Bar', wifiMultiplier: 1.1, avgDwell: '25 min', avgDataGB: 0.3, description: 'Health-conscious, quick visits' },
  brewery: { name: 'Brewery', label: 'Brewery', wifiMultiplier: 0.7, avgDwell: '90 min', avgDataGB: 0.4, description: 'Social atmosphere, moderate usage' },
  winery: { name: 'Winery', label: 'Winery', wifiMultiplier: 0.5, avgDwell: '120 min', avgDataGB: 0.3, description: 'Tasting room experience' },
  ice_cream: { name: 'Ice Cream Shop', label: 'Ice Cream Shop', wifiMultiplier: 0.6, avgDwell: '20 min', avgDataGB: 0.2, description: 'Quick treat visits' },
  deli: { name: 'Deli', label: 'Deli', wifiMultiplier: 0.7, avgDwell: '25 min', avgDataGB: 0.2, description: 'Quick lunch stops' },
  food_truck: { name: 'Food Truck', label: 'Food Truck', wifiMultiplier: 0.4, avgDwell: '15 min', avgDataGB: 0.1, description: 'Outdoor quick service' },
  catering: { name: 'Catering Venue', label: 'Catering Venue', wifiMultiplier: 0.8, avgDwell: '180 min', avgDataGB: 0.5, description: 'Event-based usage' },

  // Retail
  retail_large: { name: 'Large Retail Store', label: 'Large Retail Store', wifiMultiplier: 0.5, avgDwell: '45 min', avgDataGB: 0.2, description: 'Shopping-focused visits' },
  retail_small: { name: 'Small Retail Shop', label: 'Small Retail Shop', wifiMultiplier: 0.4, avgDwell: '20 min', avgDataGB: 0.1, description: 'Quick shopping trips' },
  mall: { name: 'Shopping Mall', label: 'Shopping Mall', wifiMultiplier: 0.6, avgDwell: '90 min', avgDataGB: 0.4, description: 'Extended shopping sessions' },
  grocery: { name: 'Grocery Store', label: 'Grocery Store', wifiMultiplier: 0.3, avgDwell: '30 min', avgDataGB: 0.1, description: 'Task-focused visits' },
  pharmacy: { name: 'Pharmacy', label: 'Pharmacy', wifiMultiplier: 0.3, avgDwell: '15 min', avgDataGB: 0.1, description: 'Quick prescription pickups' },
  electronics: { name: 'Electronics Store', label: 'Electronics Store', wifiMultiplier: 0.8, avgDwell: '40 min', avgDataGB: 0.3, description: 'Tech-savvy customers' },
  bookstore: { name: 'Bookstore', label: 'Bookstore', wifiMultiplier: 1.1, avgDwell: '60 min', avgDataGB: 0.5, description: 'Browsing and reading time' },
  clothing: { name: 'Clothing Store', label: 'Clothing Store', wifiMultiplier: 0.5, avgDwell: '35 min', avgDataGB: 0.2, description: 'Shopping and trying on' },
  furniture: { name: 'Furniture Store', label: 'Furniture Store', wifiMultiplier: 0.4, avgDwell: '45 min', avgDataGB: 0.2, description: 'Browsing large items' },
  home_improvement: { name: 'Home Improvement', label: 'Home Improvement', wifiMultiplier: 0.5, avgDwell: '50 min', avgDataGB: 0.2, description: 'Project shopping' },
  pet_store: { name: 'Pet Store', label: 'Pet Store', wifiMultiplier: 0.4, avgDwell: '25 min', avgDataGB: 0.1, description: 'Pet supply shopping' },
  sporting_goods: { name: 'Sporting Goods', label: 'Sporting Goods', wifiMultiplier: 0.5, avgDwell: '35 min', avgDataGB: 0.2, description: 'Equipment shopping' },
  jewelry: { name: 'Jewelry Store', label: 'Jewelry Store', wifiMultiplier: 0.3, avgDwell: '30 min', avgDataGB: 0.1, description: 'High-value browsing' },
  convenience: { name: 'Convenience Store', label: 'Convenience Store', wifiMultiplier: 0.3, avgDwell: '10 min', avgDataGB: 0.1, description: 'Quick grab-and-go' },
  liquor_store: { name: 'Liquor Store', label: 'Liquor Store', wifiMultiplier: 0.3, avgDwell: '15 min', avgDataGB: 0.1, description: 'Quick beverage purchase' },
  florist: { name: 'Florist', label: 'Florist', wifiMultiplier: 0.3, avgDwell: '20 min', avgDataGB: 0.1, description: 'Gift shopping' },
  gift_shop: { name: 'Gift Shop', label: 'Gift Shop', wifiMultiplier: 0.4, avgDwell: '25 min', avgDataGB: 0.1, description: 'Browsing for gifts' },
  thrift_store: { name: 'Thrift Store', label: 'Thrift Store', wifiMultiplier: 0.5, avgDwell: '45 min', avgDataGB: 0.2, description: 'Treasure hunting' },
  outlet: { name: 'Outlet Store', label: 'Outlet Store', wifiMultiplier: 0.5, avgDwell: '60 min', avgDataGB: 0.3, description: 'Deal shopping' },

  // Healthcare
  hospital: { name: 'Hospital', label: 'Hospital', wifiMultiplier: 1.5, avgDwell: '180 min', avgDataGB: 0.8, description: 'Long waits, high usage' },
  clinic: { name: 'Medical Clinic', label: 'Medical Clinic', wifiMultiplier: 1.2, avgDwell: '45 min', avgDataGB: 0.4, description: 'Waiting room usage' },
  dental: { name: 'Dental Office', label: 'Dental Office', wifiMultiplier: 1.0, avgDwell: '60 min', avgDataGB: 0.3, description: 'Appointment-based visits' },
  veterinary: { name: 'Veterinary Clinic', label: 'Veterinary Clinic', wifiMultiplier: 0.9, avgDwell: '40 min', avgDataGB: 0.3, description: 'Pet owner waiting time' },
  urgent_care: { name: 'Urgent Care', label: 'Urgent Care', wifiMultiplier: 1.3, avgDwell: '90 min', avgDataGB: 0.5, description: 'Extended wait times' },
  physical_therapy: { name: 'Physical Therapy', label: 'Physical Therapy', wifiMultiplier: 1.0, avgDwell: '60 min', avgDataGB: 0.4, description: 'Treatment sessions' },
  chiropractic: { name: 'Chiropractic', label: 'Chiropractic', wifiMultiplier: 0.8, avgDwell: '45 min', avgDataGB: 0.3, description: 'Adjustment appointments' },
  optometry: { name: 'Optometry', label: 'Optometry', wifiMultiplier: 0.9, avgDwell: '50 min', avgDataGB: 0.3, description: 'Eye exams and fitting' },
  dermatology: { name: 'Dermatology', label: 'Dermatology', wifiMultiplier: 0.9, avgDwell: '40 min', avgDataGB: 0.3, description: 'Skin care appointments' },
  mental_health: { name: 'Mental Health', label: 'Mental Health', wifiMultiplier: 0.7, avgDwell: '60 min', avgDataGB: 0.2, description: 'Therapy sessions' },
  dialysis: { name: 'Dialysis Center', label: 'Dialysis Center', wifiMultiplier: 1.8, avgDwell: '240 min', avgDataGB: 1.0, description: 'Long treatment sessions' },
  imaging: { name: 'Imaging Center', label: 'Imaging Center', wifiMultiplier: 1.0, avgDwell: '60 min', avgDataGB: 0.4, description: 'Diagnostic appointments' },
  lab: { name: 'Lab/Blood Draw', label: 'Lab/Blood Draw', wifiMultiplier: 0.6, avgDwell: '30 min', avgDataGB: 0.2, description: 'Quick testing visits' },
  nursing_home: { name: 'Nursing Home', label: 'Nursing Home', wifiMultiplier: 1.4, avgDwell: '120 min', avgDataGB: 0.6, description: 'Visitor waiting' },
  assisted_living: { name: 'Assisted Living', label: 'Assisted Living', wifiMultiplier: 1.3, avgDwell: '90 min', avgDataGB: 0.5, description: 'Resident and visitor usage' },

  // Hospitality
  hotel_luxury: { name: 'Luxury Hotel', label: 'Luxury Hotel', wifiMultiplier: 1.8, avgDwell: '720 min', avgDataGB: 2.0, description: 'Extended stays, high expectations' },
  hotel_business: { name: 'Business Hotel', label: 'Business Hotel', wifiMultiplier: 2.0, avgDwell: '480 min', avgDataGB: 1.5, description: 'Work-focused travelers' },
  hotel_budget: { name: 'Budget Hotel', label: 'Budget Hotel', wifiMultiplier: 1.4, avgDwell: '480 min', avgDataGB: 1.0, description: 'Cost-conscious travelers' },
  hostel: { name: 'Hostel', label: 'Hostel', wifiMultiplier: 1.6, avgDwell: '360 min', avgDataGB: 1.2, description: 'Young travelers, social spaces' },
  resort: { name: 'Resort', label: 'Resort', wifiMultiplier: 1.3, avgDwell: '720 min', avgDataGB: 1.0, description: 'Vacation-focused, poolside usage' },
  motel: { name: 'Motel', label: 'Motel', wifiMultiplier: 1.2, avgDwell: '480 min', avgDataGB: 0.8, description: 'Road trip stays' },
  bed_breakfast: { name: 'Bed & Breakfast', label: 'Bed & Breakfast', wifiMultiplier: 1.3, avgDwell: '600 min', avgDataGB: 0.9, description: 'Cozy getaway stays' },
  vacation_rental: { name: 'Vacation Rental', label: 'Vacation Rental', wifiMultiplier: 1.5, avgDwell: '1440 min', avgDataGB: 1.5, description: 'Extended home-like stays' },
  campground: { name: 'Campground', label: 'Campground', wifiMultiplier: 0.8, avgDwell: '720 min', avgDataGB: 0.5, description: 'Outdoor recreation' },
  rv_park: { name: 'RV Park', label: 'RV Park', wifiMultiplier: 1.2, avgDwell: '1440 min', avgDataGB: 1.0, description: 'Mobile living' },
  event_venue: { name: 'Event Venue', label: 'Event Venue', wifiMultiplier: 1.0, avgDwell: '180 min', avgDataGB: 0.5, description: 'Weddings and conferences' },
  convention_center: { name: 'Convention Center', label: 'Convention Center', wifiMultiplier: 1.5, avgDwell: '360 min', avgDataGB: 0.8, description: 'Trade shows and events' },

  // Transportation
  airport: { name: 'Airport', label: 'Airport', wifiMultiplier: 1.8, avgDwell: '120 min', avgDataGB: 0.8, description: 'High usage during delays' },
  train_station: { name: 'Train Station', label: 'Train Station', wifiMultiplier: 1.2, avgDwell: '30 min', avgDataGB: 0.3, description: 'Commuter usage' },
  bus_station: { name: 'Bus Station', label: 'Bus Station', wifiMultiplier: 1.0, avgDwell: '45 min', avgDataGB: 0.3, description: 'Transit waiting time' },
  gas_station: { name: 'Gas Station', label: 'Gas Station', wifiMultiplier: 0.4, avgDwell: '10 min', avgDataGB: 0.1, description: 'Quick stops' },
  truck_stop: { name: 'Truck Stop', label: 'Truck Stop', wifiMultiplier: 1.3, avgDwell: '60 min', avgDataGB: 0.6, description: 'Driver rest stops' },
  car_dealership: { name: 'Car Dealership', label: 'Car Dealership', wifiMultiplier: 1.1, avgDwell: '90 min', avgDataGB: 0.5, description: 'Service waiting area' },
  car_wash: { name: 'Car Wash', label: 'Car Wash', wifiMultiplier: 0.6, avgDwell: '20 min', avgDataGB: 0.2, description: 'Waiting for wash' },
  parking_garage: { name: 'Parking Garage', label: 'Parking Garage', wifiMultiplier: 0.3, avgDwell: '15 min', avgDataGB: 0.1, description: 'Minimal dwell time' },
  ferry_terminal: { name: 'Ferry Terminal', label: 'Ferry Terminal', wifiMultiplier: 1.1, avgDwell: '45 min', avgDataGB: 0.4, description: 'Waiting for departure' },
  cruise_terminal: { name: 'Cruise Terminal', label: 'Cruise Terminal', wifiMultiplier: 1.4, avgDwell: '120 min', avgDataGB: 0.6, description: 'Check-in and boarding' },
  rest_area: { name: 'Rest Area', label: 'Rest Area', wifiMultiplier: 0.8, avgDwell: '25 min', avgDataGB: 0.3, description: 'Highway break stops' },
  marina: { name: 'Marina', label: 'Marina', wifiMultiplier: 1.0, avgDwell: '180 min', avgDataGB: 0.5, description: 'Boat owners and visitors' },

  // Entertainment
  gym_fitness: { name: 'Gym/Fitness Center', label: 'Gym/Fitness Center', wifiMultiplier: 1.3, avgDwell: '75 min', avgDataGB: 0.6, description: 'Streaming during workouts' },
  movie_theater: { name: 'Movie Theater', label: 'Movie Theater', wifiMultiplier: 0.5, avgDwell: '150 min', avgDataGB: 0.2, description: 'Pre/post show usage' },
  bowling: { name: 'Bowling Alley', label: 'Bowling Alley', wifiMultiplier: 0.7, avgDwell: '120 min', avgDataGB: 0.4, description: 'Social entertainment' },
  arcade: { name: 'Arcade', label: 'Arcade', wifiMultiplier: 0.6, avgDwell: '90 min', avgDataGB: 0.3, description: 'Gaming-focused venue' },
  museum: { name: 'Museum', label: 'Museum', wifiMultiplier: 0.8, avgDwell: '120 min', avgDataGB: 0.4, description: 'Educational content access' },
  stadium: { name: 'Stadium/Arena', label: 'Stadium/Arena', wifiMultiplier: 1.5, avgDwell: '180 min', avgDataGB: 0.7, description: 'Event-based high density' },
  amusement_park: { name: 'Amusement Park', label: 'Amusement Park', wifiMultiplier: 0.9, avgDwell: '360 min', avgDataGB: 0.6, description: 'Family entertainment' },
  water_park: { name: 'Water Park', label: 'Water Park', wifiMultiplier: 0.6, avgDwell: '300 min', avgDataGB: 0.4, description: 'Outdoor water fun' },
  zoo: { name: 'Zoo', label: 'Zoo', wifiMultiplier: 0.7, avgDwell: '180 min', avgDataGB: 0.4, description: 'Family outings' },
  aquarium: { name: 'Aquarium', label: 'Aquarium', wifiMultiplier: 0.8, avgDwell: '120 min', avgDataGB: 0.4, description: 'Educational visits' },
  theater: { name: 'Theater', label: 'Theater', wifiMultiplier: 0.4, avgDwell: '150 min', avgDataGB: 0.2, description: 'Live performances' },
  concert_venue: { name: 'Concert Venue', label: 'Concert Venue', wifiMultiplier: 1.2, avgDwell: '180 min', avgDataGB: 0.6, description: 'Live music events' },
  nightclub: { name: 'Nightclub', label: 'Nightclub', wifiMultiplier: 0.8, avgDwell: '180 min', avgDataGB: 0.5, description: 'Nightlife entertainment' },
  casino: { name: 'Casino', label: 'Casino', wifiMultiplier: 1.1, avgDwell: '240 min', avgDataGB: 0.6, description: 'Gaming and entertainment' },
  golf_course: { name: 'Golf Course', label: 'Golf Course', wifiMultiplier: 0.6, avgDwell: '240 min', avgDataGB: 0.4, description: 'Clubhouse usage' },
  ski_resort: { name: 'Ski Resort', label: 'Ski Resort', wifiMultiplier: 1.0, avgDwell: '360 min', avgDataGB: 0.6, description: 'Lodge and base area' },
  escape_room: { name: 'Escape Room', label: 'Escape Room', wifiMultiplier: 0.5, avgDwell: '90 min', avgDataGB: 0.2, description: 'Team entertainment' },
  trampoline_park: { name: 'Trampoline Park', label: 'Trampoline Park', wifiMultiplier: 0.7, avgDwell: '90 min', avgDataGB: 0.3, description: 'Active entertainment' },
  go_kart: { name: 'Go Kart Track', label: 'Go Kart Track', wifiMultiplier: 0.6, avgDwell: '75 min', avgDataGB: 0.3, description: 'Racing entertainment' },
  mini_golf: { name: 'Mini Golf', label: 'Mini Golf', wifiMultiplier: 0.5, avgDwell: '60 min', avgDataGB: 0.2, description: 'Family entertainment' },
  laser_tag: { name: 'Laser Tag', label: 'Laser Tag', wifiMultiplier: 0.6, avgDwell: '75 min', avgDataGB: 0.3, description: 'Active gaming' },
  pool_hall: { name: 'Pool Hall', label: 'Pool Hall', wifiMultiplier: 0.8, avgDwell: '120 min', avgDataGB: 0.5, description: 'Social gaming' },
  country_club: { name: 'Country Club', label: 'Country Club', wifiMultiplier: 0.9, avgDwell: '180 min', avgDataGB: 0.5, description: 'Member amenities' },

  // Services
  salon_spa: { name: 'Salon/Spa', label: 'Salon/Spa', wifiMultiplier: 1.4, avgDwell: '90 min', avgDataGB: 0.6, description: 'Service wait time' },
  auto_service: { name: 'Auto Service Center', label: 'Auto Service Center', wifiMultiplier: 1.5, avgDwell: '120 min', avgDataGB: 0.7, description: 'Extended wait times' },
  laundromat: { name: 'Laundromat', label: 'Laundromat', wifiMultiplier: 1.6, avgDwell: '60 min', avgDataGB: 0.8, description: 'Captive audience' },
  bank: { name: 'Bank', label: 'Bank', wifiMultiplier: 0.6, avgDwell: '20 min', avgDataGB: 0.2, description: 'Quick transactions' },
  dry_cleaner: { name: 'Dry Cleaner', label: 'Dry Cleaner', wifiMultiplier: 0.3, avgDwell: '10 min', avgDataGB: 0.1, description: 'Quick drop-off/pickup' },
  barbershop: { name: 'Barbershop', label: 'Barbershop', wifiMultiplier: 1.2, avgDwell: '45 min', avgDataGB: 0.4, description: 'Haircut waiting' },
  nail_salon: { name: 'Nail Salon', label: 'Nail Salon', wifiMultiplier: 1.4, avgDwell: '60 min', avgDataGB: 0.5, description: 'Service time' },
  tattoo_parlor: { name: 'Tattoo Parlor', label: 'Tattoo Parlor', wifiMultiplier: 1.3, avgDwell: '120 min', avgDataGB: 0.6, description: 'Long session time' },
  massage: { name: 'Massage Therapy', label: 'Massage Therapy', wifiMultiplier: 0.8, avgDwell: '75 min', avgDataGB: 0.3, description: 'Relaxation services' },
  real_estate: { name: 'Real Estate Office', label: 'Real Estate Office', wifiMultiplier: 0.7, avgDwell: '45 min', avgDataGB: 0.3, description: 'Client meetings' },
  insurance: { name: 'Insurance Office', label: 'Insurance Office', wifiMultiplier: 0.6, avgDwell: '30 min', avgDataGB: 0.2, description: 'Policy discussions' },
  legal: { name: 'Law Office', label: 'Law Office', wifiMultiplier: 0.7, avgDwell: '60 min', avgDataGB: 0.3, description: 'Client consultations' },
  accounting: { name: 'Accounting Office', label: 'Accounting Office', wifiMultiplier: 0.6, avgDwell: '45 min', avgDataGB: 0.2, description: 'Tax and finance meetings' },
  print_shop: { name: 'Print Shop', label: 'Print Shop', wifiMultiplier: 0.8, avgDwell: '30 min', avgDataGB: 0.3, description: 'Waiting for printing' },
  shipping_store: { name: 'Shipping Store', label: 'Shipping Store', wifiMultiplier: 0.7, avgDwell: '20 min', avgDataGB: 0.2, description: 'Package services' },
  storage_facility: { name: 'Storage Facility', label: 'Storage Facility', wifiMultiplier: 0.4, avgDwell: '30 min', avgDataGB: 0.1, description: 'Access visits' },
  funeral_home: { name: 'Funeral Home', label: 'Funeral Home', wifiMultiplier: 0.6, avgDwell: '120 min', avgDataGB: 0.3, description: 'Service attendance' },
  wedding_venue: { name: 'Wedding Venue', label: 'Wedding Venue', wifiMultiplier: 0.9, avgDwell: '240 min', avgDataGB: 0.5, description: 'Event attendance' },

  // Education
  library: { name: 'Library', label: 'Library', wifiMultiplier: 1.8, avgDwell: '120 min', avgDataGB: 0.9, description: 'Study sessions' },
  university: { name: 'University', label: 'University', wifiMultiplier: 2.0, avgDwell: '240 min', avgDataGB: 1.2, description: 'Student heavy usage' },
  coworking: { name: 'Coworking Space', label: 'Coworking Space', wifiMultiplier: 2.2, avgDwell: '300 min', avgDataGB: 1.5, description: 'Work-focused, all day' },
  school_k12: { name: 'K-12 School', label: 'K-12 School', wifiMultiplier: 1.5, avgDwell: '360 min', avgDataGB: 0.8, description: 'Student and visitor usage' },
  tutoring: { name: 'Tutoring Center', label: 'Tutoring Center', wifiMultiplier: 1.4, avgDwell: '90 min', avgDataGB: 0.6, description: 'Learning sessions' },
  driving_school: { name: 'Driving School', label: 'Driving School', wifiMultiplier: 1.0, avgDwell: '60 min', avgDataGB: 0.4, description: 'Classroom time' },
  language_school: { name: 'Language School', label: 'Language School', wifiMultiplier: 1.3, avgDwell: '90 min', avgDataGB: 0.5, description: 'Class sessions' },
  dance_studio: { name: 'Dance Studio', label: 'Dance Studio', wifiMultiplier: 0.9, avgDwell: '75 min', avgDataGB: 0.4, description: 'Class and practice' },
  music_school: { name: 'Music School', label: 'Music School', wifiMultiplier: 0.8, avgDwell: '60 min', avgDataGB: 0.3, description: 'Lesson time' },
  art_studio: { name: 'Art Studio', label: 'Art Studio', wifiMultiplier: 0.9, avgDwell: '120 min', avgDataGB: 0.4, description: 'Creative sessions' },
  cooking_school: { name: 'Cooking School', label: 'Cooking School', wifiMultiplier: 0.7, avgDwell: '150 min', avgDataGB: 0.3, description: 'Class time' },
  trade_school: { name: 'Trade School', label: 'Trade School', wifiMultiplier: 1.2, avgDwell: '240 min', avgDataGB: 0.7, description: 'Vocational training' },
  daycare: { name: 'Daycare', label: 'Daycare', wifiMultiplier: 0.5, avgDwell: '30 min', avgDataGB: 0.2, description: 'Parent drop-off/pickup' },
  preschool: { name: 'Preschool', label: 'Preschool', wifiMultiplier: 0.5, avgDwell: '30 min', avgDataGB: 0.2, description: 'Parent visits' },
  test_center: { name: 'Testing Center', label: 'Testing Center', wifiMultiplier: 1.0, avgDwell: '180 min', avgDataGB: 0.4, description: 'Exam sessions' },

  // Other
  church: { name: 'Church/Religious', label: 'Church/Religious', wifiMultiplier: 0.5, avgDwell: '90 min', avgDataGB: 0.2, description: 'Service-based attendance' },
  community_center: { name: 'Community Center', label: 'Community Center', wifiMultiplier: 1.0, avgDwell: '120 min', avgDataGB: 0.5, description: 'Various activities' },
  office_building: { name: 'Office Building', label: 'Office Building', wifiMultiplier: 0.8, avgDwell: '480 min', avgDataGB: 0.6, description: 'Visitor/lobby usage' },
  government: { name: 'Government Office', label: 'Government Office', wifiMultiplier: 1.2, avgDwell: '60 min', avgDataGB: 0.4, description: 'Waiting for services' },
  post_office: { name: 'Post Office', label: 'Post Office', wifiMultiplier: 0.8, avgDwell: '25 min', avgDataGB: 0.2, description: 'Mail services' },
  dmv: { name: 'DMV', label: 'DMV', wifiMultiplier: 1.5, avgDwell: '90 min', avgDataGB: 0.6, description: 'Long wait times' },
  courthouse: { name: 'Courthouse', label: 'Courthouse', wifiMultiplier: 1.3, avgDwell: '180 min', avgDataGB: 0.6, description: 'Legal proceedings' },
  fire_station: { name: 'Fire Station', label: 'Fire Station', wifiMultiplier: 0.4, avgDwell: '20 min', avgDataGB: 0.1, description: 'Community visits' },
  police_station: { name: 'Police Station', label: 'Police Station', wifiMultiplier: 0.8, avgDwell: '45 min', avgDataGB: 0.3, description: 'Public services' },
  military_base: { name: 'Military Base', label: 'Military Base', wifiMultiplier: 1.0, avgDwell: '120 min', avgDataGB: 0.5, description: 'Visitor areas' },
  embassy: { name: 'Embassy/Consulate', label: 'Embassy/Consulate', wifiMultiplier: 1.2, avgDwell: '120 min', avgDataGB: 0.5, description: 'Visa appointments' },
  nonprofit: { name: 'Nonprofit Office', label: 'Nonprofit Office', wifiMultiplier: 0.8, avgDwell: '60 min', avgDataGB: 0.4, description: 'Client services' },
  shelter: { name: 'Shelter', label: 'Shelter', wifiMultiplier: 1.4, avgDwell: '480 min', avgDataGB: 0.7, description: 'Resident services' },
  senior_center: { name: 'Senior Center', label: 'Senior Center', wifiMultiplier: 1.0, avgDwell: '180 min', avgDataGB: 0.4, description: 'Daily activities' },
  youth_center: { name: 'Youth Center', label: 'Youth Center', wifiMultiplier: 1.3, avgDwell: '150 min', avgDataGB: 0.6, description: 'After-school programs' },
  rec_center: { name: 'Recreation Center', label: 'Recreation Center', wifiMultiplier: 1.1, avgDwell: '120 min', avgDataGB: 0.5, description: 'Sports and activities' },
  park: { name: 'Park', label: 'Park', wifiMultiplier: 0.6, avgDwell: '60 min', avgDataGB: 0.3, description: 'Outdoor recreation' },
  beach: { name: 'Beach', label: 'Beach', wifiMultiplier: 0.5, avgDwell: '180 min', avgDataGB: 0.3, description: 'Outdoor leisure' },
  campsite: { name: 'Campsite', label: 'Campsite', wifiMultiplier: 0.7, avgDwell: '720 min', avgDataGB: 0.4, description: 'Outdoor stays' },
  farm: { name: 'Farm/Ranch', label: 'Farm/Ranch', wifiMultiplier: 0.5, avgDwell: '120 min', avgDataGB: 0.3, description: 'Agricultural tourism' },
  vineyard: { name: 'Vineyard', label: 'Vineyard', wifiMultiplier: 0.6, avgDwell: '150 min', avgDataGB: 0.3, description: 'Wine tasting' },
  other: { name: 'Other', label: 'Other', wifiMultiplier: 0.8, avgDwell: '60 min', avgDataGB: 0.4, description: 'General venue' },
}

interface User {
  id: string
  name: string
  email: string
  imageUrl: string
  userType: string
  status: string
  createdAt: number
  lastActive?: string

}

interface Product {
  id: string
  priceId?: string
  price: number
  imageUrl?: string
  stock: number
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
  author: string
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

  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())

  // Blog state
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [articleSearch, setArticleSearch] = useState('')
  const [articleStatusFilter, setArticleStatusFilter] = useState('all')

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

  // Pipeline state
  const [partners, setPartners] = useState<LocationPartner[]>([])
  const [pipelineLoading, setPipelineLoading] = useState(false)
  const [pipelineStageFilter, setPipelineStageFilter] = useState<string | null>(null)

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
  const [settingsTab, setSettingsTab] = useState<'dropdowns' | 'stages' | 'calendly' | 'emails'>('emails')
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [dropdowns, setDropdowns] = useState<Dropdown[]>([])
  const [calendlyLinks, setCalendlyLinks] = useState<CalendlyLink[]>([])
  const [calendlyUser, setCalendlyUser] = useState<{ name: string; email: string; timezone: string } | null>(null)
  const [calendlyLoading, setCalendlyLoading] = useState(false)
  const [calendlyError, setCalendlyError] = useState<string | null>(null)

  // Payments state
  const [paymentsViewType, setPaymentsViewType] = useState<'paymentHistory' | 'invoiceHistory' | 'paymentDetails'>('paymentHistory')

  // User modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteUserType, setInviteUserType] = useState('Location Partner')
  const [inviteSending, setInviteSending] = useState(false)

  const [selectedPayeeId, setSelectedPayeeId] = useState<string | null>(null)
  const [selectedPayeeName, setSelectedPayeeName] = useState<string>('')
  const [paymentPartners, setPaymentPartners] = useState<PaymentPartner[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  const [showCalendlyEmailModal, setShowCalendlyEmailModal] = useState(false)
  const [selectedCalendlyLink, setSelectedCalendlyLink] = useState<CalendlyLink | null>(null)
  const [calendlyEmailRecipient, setCalendlyEmailRecipient] = useState('')
  const [calendlyEmailSubject, setCalendlyEmailSubject] = useState('')
  const [calendlyEmailMessage, setCalendlyEmailMessage] = useState('')
  const [sendingCalendlyEmail, setSendingCalendlyEmail] = useState(false)

  // Load approved IDs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('skyyield-approved-products')
    if (saved) {
      setApprovedIds(new Set<string>(JSON.parse(saved)))
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
      setUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setUsersLoading(false)
    }
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

  // Fetch blog articles
  const fetchArticles = async () => {
    setArticlesLoading(true)
    try {
      const res = await fetch('/api/blog/articles')
      if (res.ok) {
        const data = await res.json()
        setArticles(data.articles || [])
      } else {
        console.error('Articles API returned:', res.status)
        setArticles([])
      }
    } catch (err) {
      console.error('Error fetching articles:', err)
      setArticles([])
    } finally {
      setArticlesLoading(false)
    }
  }

  // Update article status
  const updateArticleStatus = async (articleId: string, status: string) => {
    try {
      await fetch(`/api/blog/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setArticles(prev => prev.map(a =>
        a.id === articleId ? { ...a, status: status as BlogArticle['status'] } : a
      ))
    } catch (err) {
      console.error('Error updating article:', err)
    }
  }

  // Delete article
  const deleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return
    try {
      await fetch(`/api/blog/articles/${articleId}`, {
        method: 'DELETE',
      })
      setArticles(prev => prev.filter(a => a.id !== articleId))
    } catch (err) {
      console.error('Error deleting article:', err)
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
      const stage = PIPELINE_STAGES.find(s => s.id === partner.stage)
      if (stage?.waitingFor || partner.waitingFor) {
        const waitingFor = partner.waitingFor || stage?.waitingFor || 'other'
        const waitingType = WAITING_TYPES.find(w => w.id === waitingFor)
        const waitingSince = partner.waitingSince || partner.updatedAt || partner.createdAt
        const waitingDate = new Date(waitingSince)
        const daysPending = Math.floor((now.getTime() - waitingDate.getTime()) / (1000 * 60 * 60 * 24))
        const attemptCount = partner.followUpAttempts?.length || 0

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

    setWaitingItems(items)
  }

  // Get filtered and sorted waiting items
  const getFilteredWaitingItems = () => {
    let filtered = [...waitingItems]

    if (followUpSearch) {
      const search = followUpSearch.toLowerCase()
      filtered = filtered.filter(item =>
        item.partnerName.toLowerCase().includes(search) ||
        item.companyName.toLowerCase().includes(search) ||
        item.partnerEmail.toLowerCase().includes(search)
      )
    }

    if (followUpStatusFilter !== 'all') {
      filtered = filtered.filter(item => item.partnerStatus === followUpStatusFilter)
    }

    if (followUpItemTypeFilter !== 'all') {
      if (followUpItemTypeFilter === 'calendly') {
        filtered = filtered.filter(item => item.waitingForCategory === 'calendly')
      } else if (followUpItemTypeFilter === 'pandadoc') {
        filtered = filtered.filter(item => item.waitingForCategory === 'pandadoc')
      } else if (followUpItemTypeFilter === 'tipalti') {
        filtered = filtered.filter(item => item.waitingForCategory === 'tipalti')
      } else {
        filtered = filtered.filter(item => item.waitingFor === followUpItemTypeFilter)
      }
    }

    if (followUpPartnerTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.partnerType === followUpPartnerTypeFilter)
    }

    filtered = filtered.filter(item =>
      item.daysPending >= followUpMinDays && item.daysPending <= followUpMaxDays
    )

    filtered.sort((a, b) => {
      switch (followUpSortBy) {
        case 'days_desc': return b.daysPending - a.daysPending
        case 'days_asc': return a.daysPending - b.daysPending
        case 'name': return a.partnerName.localeCompare(b.partnerName)
        case 'company': return a.companyName.localeCompare(b.companyName)
        case 'attempts': return b.attemptCount - a.attemptCount
        default: return b.daysPending - a.daysPending
      }
    })

    return filtered
  }
  // Send reminder to partner
  const sendReminder = async () => {
    if (!selectedPartnerForFollowUp) return
    setSendingReminder(true)

    try {
      const res = await fetch('/api/pipeline/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: selectedPartnerForFollowUp.id,
          type: reminderType,
          note: reminderNote,
          templateId: selectedPartnerForFollowUp.waitingFor,
        }),
      })

      if (res.ok) {
        // Update local state
        setPartners(prev => prev.map(p => {
          if (p.id === selectedPartnerForFollowUp.id) {
            const newAttempt: FollowUpAttempt = {
              id: crypto.randomUUID(),
              sentAt: new Date().toISOString(),
              type: reminderType,
              note: reminderNote,
              sentBy: user?.primaryEmailAddress?.emailAddress || 'admin',
            }
            return {
              ...p,
              followUpAttempts: [...(p.followUpAttempts || []), newAttempt],
            }
          }
          return p
        }))
        generateWaitingItems(partners)
        setShowReminderModal(false)
        setReminderNote('')
      }
    } catch (err) {
      console.error('Error sending reminder:', err)
    } finally {
      setSendingReminder(false)
    }
  }

  // Skip current step for partner
  const skipStep = async (partnerId: string) => {
    if (!confirm('Are you sure you want to skip this step?')) return

    try {
      const partner = partners.find(p => p.id === partnerId)
      if (!partner) return

      const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === partner.stage)
      const nextStage = PIPELINE_STAGES[currentStageIndex + 1]

      if (nextStage) {
        await fetch(`/api/pipeline/partners/${partnerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: nextStage.id,
            waitingFor: nextStage.waitingFor || null,
            waitingSince: new Date().toISOString(),
          }),
        })
        fetchPipeline()
      }
    } catch (err) {
      console.error('Error skipping step:', err)
    }
  }

  // Mark partner as inactive
  const markInactive = async (partnerId: string) => {
    if (!confirm('Mark this partner as inactive? They will be removed from follow-ups.')) return

    try {
      await fetch(`/api/pipeline/partners/${partnerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' }),
      })
      fetchPipeline()
    } catch (err) {
      console.error('Error marking inactive:', err)
    }
  }

  // Update partner stage
  const updatePartnerStage = async (partnerId: string, newStage: string) => {
    try {
      const stage = PIPELINE_STAGES.find(s => s.id === newStage)
      await fetch(`/api/pipeline/partners/${partnerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          waitingFor: stage?.waitingFor || null,
          waitingSince: new Date().toISOString(),
        }),
      })
      fetchPipeline()
    } catch (err) {
      console.error('Error updating stage:', err)
    }
  }

  // Fetch Calendly links
  const fetchCalendlyLinks = async () => {
    setCalendlyLoading(true)
    setCalendlyError(null)
    try {
      const res = await fetch('/api/calendly/event-types')
      if (res.ok) {
        const data = await res.json()
        setCalendlyLinks(data.eventTypes || [])
        setCalendlyUser(data.user || null)
      } else {
        const error = await res.json()
        setCalendlyError(error.message || 'Failed to fetch Calendly links')
      }
    } catch (err) {
      console.error('Error fetching Calendly:', err)
      setCalendlyError('Failed to connect to Calendly')
    } finally {
      setCalendlyLoading(false)
    }
  }

  // Copy link to clipboard
  const copyToClipboard = (link: string, id: string) => {
    navigator.clipboard.writeText(link)
    setCopiedLink(id)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  // Open send email modal for Calendly link
  const openCalendlyEmailModal = (link: CalendlyLink) => {
    setSelectedCalendlyLink(link)
    setCalendlyEmailSubject(`Schedule Your ${link.name}`)
    setCalendlyEmailMessage(`Hi,\n\nPlease use the link below to schedule your ${link.name}:\n\n${link.schedulingUrl}\n\nLooking forward to connecting with you!\n\nBest regards,\nSkyYield Team`)
    setShowCalendlyEmailModal(true)
  }

  // Send Calendly email
  const sendCalendlyEmail = async () => {
    if (!calendlyEmailRecipient || !selectedCalendlyLink) return
    setSendingCalendlyEmail(true)

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: calendlyEmailRecipient,
          subject: calendlyEmailSubject,
          body: calendlyEmailMessage,
          templateType: 'calendly_invite',
        }),
      })

      if (res.ok) {
        setShowCalendlyEmailModal(false)
        setCalendlyEmailRecipient('')
        setSelectedCalendlyLink(null)
      }
    } catch (err) {
      console.error('Error sending email:', err)
    } finally {
      setSendingCalendlyEmail(false)
    }
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = userSearch === '' ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    const matchesType = typeFilter === 'all' || u.userType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = productSearch === '' ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku?.toLowerCase() || '').includes(productSearch.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Filter articles
  const filteredArticles = articles.filter(a => {
    const matchesSearch = articleSearch === '' ||
      a.title.toLowerCase().includes(articleSearch.toLowerCase())
    const matchesStatus = articleStatusFilter === 'all' || a.status === articleStatusFilter
    return matchesSearch && matchesStatus
  })

  // Approved products
  const approvedProducts = products.filter(p => approvedIds.has(p.id))

  // Toggle product approval
  const toggleApproval = (productId: string) => {
    const newIds = new Set(approvedIds)
    if (newIds.has(productId)) {
      newIds.delete(productId)
    } else {
      newIds.add(productId)
    }
    saveApprovedIds(newIds)
  }

  // Fetch payment partners
  const fetchPaymentPartners = async () => {
    setPaymentsLoading(true)
    try {
      // For now, use mock data
      setPaymentPartners(MOCK_PAYMENT_PARTNERS)
    } catch (err) {
      console.error('Error fetching payment partners:', err)
    } finally {
      setPaymentsLoading(false)
    }
  }

  // Update submission status
  const updateSubmissionStatus = async (submissionId: string, status: string) => {
    try {
      await fetch(`/api/forms/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setSubmissions(prev => prev.map(s =>
        s.id === submissionId ? { ...s, status: status as FormSubmission['status'] } : s
      ))
    } catch (err) {
      console.error('Error updating submission:', err)
    }
  }

  // Send invite email
  const sendInvite = async () => {
    if (!inviteEmail) return
    setInviteSending(true)

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          userType: inviteUserType,
        }),
      })

      if (res.ok) {
        setShowInviteModal(false)
        setInviteEmail('')
      }
    } catch (err) {
      console.error('Error sending invite:', err)
    } finally {
      setInviteSending(false)
    }
  }

  // Update user status
  const updateUserStatus = async (userId: string, status: string) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, status: status as User['status'] } : u
      ))
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, status: status as User['status'] })
      }
    } catch (err) {
      console.error('Error updating user:', err)
    }
  }

  // Save email template
  const saveEmailTemplate = (template: EmailTemplate) => {
    setEmailTemplates(prev => prev.map(t =>
      t.id === template.id ? template : t
    ))
    setEditingTemplate(null)
  }

  // Save form
  const saveForm = async (form: Form) => {
    try {
      const method = form.id ? 'PUT' : 'POST'
      const url = form.id ? `/api/forms/${form.id}` : '/api/forms'

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      fetchForms()
      setShowFormEditorModal(false)
      setEditingForm(null)
    } catch (err) {
      console.error('Error saving form:', err)
    }
  }

  // Calculate earnings helper
  const calculateEarnings = () => {
    const profile = VENUE_PROFILES[calcVenueType] || VENUE_PROFILES['cafe_coffee']
    const dailyVisitors = calcFootTraffic
    const wifiUsers = Math.round(dailyVisitors * (calcWifiAdoption / 100))
    const avgDataPerUser = profile.avgDataGB || 0.5
    const dailyDataGB = wifiUsers * avgDataPerUser
    const dailyEarnings = dailyDataGB * calcRatePerGB
    const monthlyEarnings = dailyEarnings * calcDaysOpen
    const yearlyEarnings = monthlyEarnings * 12

    return {
      dailyVisitors,
      wifiUsers,
      dailyDataGB: dailyDataGB.toFixed(2),
      dailyEarnings: dailyEarnings.toFixed(2),
      monthlyEarnings: monthlyEarnings.toFixed(2),
      yearlyEarnings: yearlyEarnings.toFixed(2),
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }


  // Format date
const formatDate = (dateString: string | number) => {
  return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'low': return 'text-green-400 bg-green-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-500/20'
      case 'pending': return 'text-yellow-400 bg-yellow-500/20'
      case 'rejected': return 'text-red-400 bg-red-500/20'
      case 'active': return 'text-green-400 bg-green-500/20'
      case 'inactive': return 'text-gray-400 bg-gray-500/20'
      case 'published': return 'text-green-400 bg-green-500/20'
      case 'draft': return 'text-gray-400 bg-gray-500/20'
      case 'new': return 'text-cyan-400 bg-cyan-500/20'
      case 'reviewed': return 'text-blue-400 bg-blue-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  // Tab data loading effect
  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers()
    } else if (activeTab === 'products' && products.length === 0) {
      fetchProducts()
    } else if (activeTab === 'approved-products' && products.length === 0) {
      fetchProducts()
    } else if (activeTab === 'blog' && articles.length === 0) {
      fetchArticles()
    } else if (activeTab === 'forms' && forms.length === 0) {
      fetchForms()
      fetchSubmissions()
    } else if (activeTab === 'pipeline' && partners.length === 0) {
      fetchPipeline()
    } else if (activeTab === 'follow-ups' && partners.length === 0) {
      fetchPipeline()
    } else if (activeTab === 'payments' && paymentPartners.length === 0) {
      fetchPaymentPartners()
    } else if (activeTab === 'settings' && settingsTab === 'calendly' && calendlyLinks.length === 0) {
      fetchCalendlyLinks()
    }
  }, [activeTab, settingsTab])

  // Fetch submissions when form selected
  useEffect(() => {
    if (selectedFormId) {
      fetchSubmissions(selectedFormId)
    }
  }, [selectedFormId])

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-[#0A0F2C]">
      {/* Header */}
      <header className="bg-[#0A0F2C]/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-green-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                <p className="text-xs text-gray-400">SkyYield Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.[0] || 'A'}
                  </span>
                </div>
                <span className="text-sm text-gray-300 hidden sm:block">
                  {user?.firstName || 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-[#0A0F2C]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
              { id: 'follow-ups', label: 'Follow-ups', icon: Clock },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'approved-products', label: 'Approved', icon: CheckCircle },
              { id: 'blog', label: 'Blog', icon: FileText },
              { id: 'forms', label: 'Forms', icon: ClipboardList },
              { id: 'calculators', label: 'Calculators', icon: Calculator },
              { id: 'payments', label: 'Payments', icon: DollarSign },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-white mt-1">{users.length || '—'}</p>
                  </div>
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +12%
                  </span>
                  <span className="text-gray-500">vs last month</span>
                </div>
              </div>

              <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Partners</p>
                    <p className="text-3xl font-bold text-white mt-1">{partners.filter(p => p.status === 'active').length || '—'}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +8%
                  </span>
                  <span className="text-gray-500">vs last month</span>
                </div>
              </div>

              <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending Follow-ups</p>
                    <p className="text-3xl font-bold text-white mt-1">{waitingItems.length || '—'}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-red-400 flex items-center gap-1">
                    {waitingItems.filter(i => i.priority === 'high').length} high priority
                  </span>
                </div>
              </div>

              <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Products</p>
                    <p className="text-3xl font-bold text-white mt-1">{products.length || '—'}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-cyan-400">{approvedIds.size} approved</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <UserPlus className="w-6 h-6 text-cyan-400" />
                  <span className="text-sm text-gray-300">Invite User</span>
                </button>
                <button
                  onClick={() => setActiveTab('pipeline')}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <GitBranch className="w-6 h-6 text-green-400" />
                  <span className="text-sm text-gray-300">View Pipeline</span>
                </button>
                <button
                  onClick={() => setActiveTab('follow-ups')}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Clock className="w-6 h-6 text-yellow-400" />
                  <span className="text-sm text-gray-300">Follow-ups</span>
                </button>
                <button
                  onClick={() => { setActiveTab('settings'); setSettingsTab('emails'); }}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Mail className="w-6 h-6 text-purple-400" />
                  <span className="text-sm text-gray-300">Email Templates</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  { icon: UserPlus, text: 'New user registration: john@example.com', time: '5 min ago', color: 'text-cyan-400' },
                  { icon: CheckCircle, text: 'Partner approved: ABC Company', time: '1 hour ago', color: 'text-green-400' },
                  { icon: Mail, text: 'Follow-up sent to XYZ Corp', time: '2 hours ago', color: 'text-yellow-400' },
                  { icon: FileText, text: 'Contract signed: Demo Partner', time: '3 hours ago', color: 'text-purple-400' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center ${activity.color}`}>
                      <activity.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.text}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-[#1a1f3e] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 w-full sm:w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-[#1a1f3e] border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 bg-[#1a1f3e] border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Types</option>
                  {USER_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite User
              </button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="bg-[#1a1f3e] rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">User</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Type</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Joined</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium">{u.name[0]}</span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{u.name}</p>
                                <p className="text-gray-400 text-sm">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-300">{u.userType}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(u.status)}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                          {formatDate(String(u.createdAt))}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setSelectedUser(u); setShowUserModal(true); }}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {u.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateUserStatus(u.id, 'approved')}
                                    className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => updateUserStatus(u.id, 'rejected')}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-[#1a1f3e] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 w-full sm:w-64"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 bg-[#1a1f3e] border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Categories</option>
                  <option value="access-points">Access Points</option>
                  <option value="switches">Switches</option>
                  <option value="routers">Routers</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <div className="text-sm text-gray-400">
                {approvedIds.size} of {products.length} approved
              </div>
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-[#1a1f3e] rounded-xl border border-white/10 overflow-hidden hover:border-cyan-500/30 transition-colors">
                    <div className="aspect-video bg-white/5 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-12 h-12 text-gray-600" />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-white font-medium">{product.name}</h3>
                          <p className="text-gray-400 text-sm">{product.sku}</p>
                        </div>
                        <button
                          onClick={() => toggleApproval(product.id)}
                          className={`p-2 rounded-lg transition-colors ${approvedIds.has(product.id)
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                        >
                          {approvedIds.has(product.id) ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Plus className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-cyan-400 font-semibold">{formatCurrency(product.price)}</span>
                        <span className={`text-xs px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Approved Products Tab */}
        {activeTab === 'approved-products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Approved Products ({approvedProducts.length})</h2>
              <button
                onClick={() => setActiveTab('products')}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add More
              </button>
            </div>

            {approvedProducts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No approved products yet</p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedProducts.map(product => (
                  <div key={product.id} className="bg-[#1a1f3e] rounded-xl border border-green-500/30 overflow-hidden">
                    <div className="aspect-video bg-white/5 flex items-center justify-center relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-12 h-12 text-gray-600" />
                      )}
                      <div className="absolute top-2 right-2 bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium">
                        Approved
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-medium">{product.name}</h3>
                      <p className="text-gray-400 text-sm">{product.sku}</p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-cyan-400 font-semibold">{formatCurrency(product.price)}</span>
                        <button
                          onClick={() => toggleApproval(product.id)}
                          className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Blog Tab */}
        {activeTab === 'blog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={articleSearch}
                    onChange={(e) => setArticleSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-[#1a1f3e] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 w-full sm:w-64"
                  />
                </div>
                <select
                  value={articleStatusFilter}
                  onChange={(e) => setArticleStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-[#1a1f3e] border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <button
                onClick={() => router.push('/portals/admin/blog/new')}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Article
              </button>
            </div>

            {articlesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No articles found</p>
              </div>
            ) : (
              <div className="bg-[#1a1f3e] rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Title</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Author</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Created</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArticles.map(article => (
                        <tr key={article.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-white font-medium">{article.title}</p>
                            <p className="text-gray-500 text-sm line-clamp-1">{article.excerpt}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{article.author}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}>
                              {article.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {formatDate(article.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => router.push(`/portals/admin/blog/${article.id}`)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {article.status === 'draft' ? (
                                <button
                                  onClick={() => updateArticleStatus(article.id, 'published')}
                                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateArticleStatus(article.id, 'draft')}
                                  className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteArticle(article.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Forms Tab */}
        {activeTab === 'forms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <h2 className="text-xl font-semibold text-white">Form Submissions</h2>
              <button
                onClick={() => { setEditingForm(null); setShowFormEditorModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Form
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#1a1f3e] rounded-xl p-4 border border-white/10">
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{submissionStats.total}</p>
              </div>
              <div className="bg-[#1a1f3e] rounded-xl p-4 border border-cyan-500/30">
                <p className="text-cyan-400 text-sm">New</p>
                <p className="text-2xl font-bold text-cyan-400">{submissionStats.new}</p>
              </div>
              <div className="bg-[#1a1f3e] rounded-xl p-4 border border-blue-500/30">
                <p className="text-blue-400 text-sm">Reviewed</p>
                <p className="text-2xl font-bold text-blue-400">{submissionStats.reviewed}</p>
              </div>
              <div className="bg-[#1a1f3e] rounded-xl p-4 border border-green-500/30">
                <p className="text-green-400 text-sm">Approved</p>
                <p className="text-2xl font-bold text-green-400">{submissionStats.approved}</p>
              </div>
              <div className="bg-[#1a1f3e] rounded-xl p-4 border border-red-500/30">
                <p className="text-red-400 text-sm">Rejected</p>
                <p className="text-2xl font-bold text-red-400">{submissionStats.rejected}</p>
              </div>
            </div>

            {/* Forms List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`bg-[#1a1f3e] rounded-xl p-4 border cursor-pointer transition-colors ${selectedFormId === null ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'
                  }`}
                onClick={() => { setSelectedFormId(null); fetchSubmissions(); }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">All Submissions</p>
                    <p className="text-gray-400 text-sm">View all forms</p>
                  </div>
                </div>
              </div>
              {forms.map(form => (
                <div
                  key={form.id}
                  className={`bg-[#1a1f3e] rounded-xl p-4 border cursor-pointer transition-colors ${selectedFormId === form.id ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'
                    }`}
                  onClick={() => setSelectedFormId(form.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{form.name}</p>
                        <p className="text-gray-400 text-sm">{form.fields?.length || 0} fields</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(`${window.location.origin}/forms/${form.slug}`, form.id); }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {copiedLink === form.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingForm(form); setShowFormEditorModal(true); }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Submissions Table */}
            {submissionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 bg-[#1a1f3e] rounded-xl border border-white/10">
                <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No submissions yet</p>
              </div>
            ) : (
              <div className="bg-[#1a1f3e] rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Submitted</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Form</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Contact</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(sub => (
                        <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {formatRelativeTime(sub.submittedAt)}
                          </td>
                          <td className="px-6 py-4 text-white">{sub.formName}</td>
                          <td className="px-6 py-4">
                            <p className="text-white">{sub.data?.name || sub.data?.email || 'N/A'}</p>
                            <p className="text-gray-400 text-sm">{sub.data?.email || ''}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setSelectedSubmission(sub); setShowSubmissionDetailModal(true); }}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {sub.status === 'new' && (
                                <button
                                  onClick={() => updateSubmissionStatus(sub.id, 'reviewed')}
                                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calculators Tab */}
        {activeTab === 'calculators' && (
          <div className="space-y-6">
            <div className="flex gap-4 mb-6">
              {['earnings', 'coverage', 'roi'].map(calc => (
                <button
                  key={calc}
                  onClick={() => setActiveCalculator(calc)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeCalculator === calc
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {calc === 'earnings' ? 'Earnings Calculator' : calc === 'coverage' ? 'Coverage Calculator' : 'ROI Calculator'}
                </button>
              ))}
            </div>

            {activeCalculator === 'earnings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-6">Venue Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Venue Type</label>
                      <select
                        value={calcVenueType}
                        onChange={(e) => setCalcVenueType(e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        {Object.entries(VENUE_CATEGORIES).map(([category, venues]) => (
                          <optgroup key={category} label={category}>
                            {venues.map(venue => (
                              <option key={venue} value={venue}>
                                {VENUE_PROFILES[venue]?.label || venue}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Daily Foot Traffic</label>
                      <input
                        type="number"
                        value={calcFootTraffic}
                        onChange={(e) => setCalcFootTraffic(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">WiFi Adoption Rate (%)</label>
                      <input
                        type="number"
                        value={calcWifiAdoption}
                        onChange={(e) => setCalcWifiAdoption(Number(e.target.value))}
                        min={1}
                        max={100}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Rate per GB ($)</label>
                      <input
                        type="number"
                        value={calcRatePerGB}
                        onChange={(e) => setCalcRatePerGB(Number(e.target.value))}
                        step={0.01}
                        min={0.01}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Operating Days per Month</label>
                      <input
                        type="number"
                        value={calcDaysOpen}
                        onChange={(e) => setCalcDaysOpen(Number(e.target.value))}
                        min={1}
                        max={31}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-6">Projected Earnings</h3>
                  {(() => {
                    const results = calculateEarnings()
                    return (
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-lg">
                          <p className="text-gray-400 text-sm">Daily WiFi Users</p>
                          <p className="text-2xl font-bold text-white">{results.wifiUsers.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                          <p className="text-gray-400 text-sm">Daily Data (GB)</p>
                          <p className="text-2xl font-bold text-white">{results.dailyDataGB}</p>
                        </div>
                        <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                          <p className="text-cyan-400 text-sm">Daily Earnings</p>
                          <p className="text-2xl font-bold text-cyan-400">${results.dailyEarnings}</p>
                        </div>
                        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                          <p className="text-green-400 text-sm">Monthly Earnings</p>
                          <p className="text-3xl font-bold text-green-400">${results.monthlyEarnings}</p>
                        </div>
                        <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                          <p className="text-purple-400 text-sm">Yearly Earnings</p>
                          <p className="text-3xl font-bold text-purple-400">${results.yearlyEarnings}</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {activeCalculator === 'coverage' && (
              <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Coverage Calculator</h3>
                <p className="text-gray-400">Calculate WiFi coverage requirements based on square footage and layout.</p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Square Footage</label>
                    <input
                      type="number"
                      value={calcSquareFootage}
                      onChange={(e) => setCalcSquareFootage(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30 w-full">
                      <p className="text-cyan-400 text-sm">Recommended APs</p>
                      <p className="text-2xl font-bold text-cyan-400">{Math.ceil(calcSquareFootage / 1500)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCalculator === 'roi' && (
              <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">ROI Calculator</h3>
                <p className="text-gray-400">Calculate return on investment for WiFi infrastructure deployment.</p>
                <div className="mt-6 text-center py-12">
                  <Calculator className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">Coming soon</p>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <h2 className="text-xl font-semibold text-white">Partner Pipeline</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPipelineStageFilter(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${pipelineStageFilter === null
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  All
                </button>
                {PIPELINE_STAGES.slice(0, 5).map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => setPipelineStageFilter(stage.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${pipelineStageFilter === stage.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {stage.name}
                  </button>
                ))}
              </div>
            </div>

            {pipelineLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : partners.length === 0 ? (
              <div className="text-center py-12">
                <GitBranch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No partners in pipeline</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {PIPELINE_STAGES.map(stage => {
                  const stagePartners = partners.filter(p =>
                    p.stage === stage.id && (pipelineStageFilter === null || pipelineStageFilter === stage.id)
                  )
                  if (pipelineStageFilter !== null && pipelineStageFilter !== stage.id) return null

                  return (
                    <div key={stage.id} className="bg-[#1a1f3e] rounded-xl border border-white/10 overflow-hidden">
                      <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                          <h3 className="text-white font-medium">{stage.name}</h3>
                        </div>
                        <span className="text-gray-400 text-sm">{stagePartners.length}</span>
                      </div>
                      <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                        {stagePartners.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-4">No partners</p>
                        ) : (
                          stagePartners.map(partner => (
                            <div
                              key={partner.id}
                              className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer"
                              onClick={() => { setSelectedPartnerForFollowUp(partner); setShowFollowUpModal(true); }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-white text-sm font-medium">{partner.companyLegalName}</p>
                                  <p className="text-gray-400 text-xs">{partner.contactFullName}</p>
                                </div>
                                {partner.waitingFor && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                                    Waiting
                                  </span>
                                )}
                              </div>
                              {partner.companyCity && (
                                <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {partner.companyCity}, {partner.companyState}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                <select
                                  value={partner.stage}
                                  onChange={(e) => { e.stopPropagation(); updatePartnerStage(partner.id, e.target.value); }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 text-xs px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-300 focus:outline-none"
                                >
                                  {PIPELINE_STAGES.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Follow-ups Tab */}
        {activeTab === 'follow-ups' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <h2 className="text-xl font-semibold text-white">Follow-up Queue</h2>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={followUpSearch}
                    onChange={(e) => setFollowUpSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-[#1a1f3e] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 w-48"
                  />
                </div>
                <select
                  value={followUpItemTypeFilter}
                  onChange={(e) => setFollowUpItemTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-[#1a1f3e] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Types</option>
                  <option value="calendly">Calendly</option>
                  <option value="pandadoc">PandaDoc</option>
                  <option value="tipalti">Tipalti</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={followUpPartnerTypeFilter}
                  onChange={(e) => setFollowUpPartnerTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-[#1a1f3e] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Partners</option>
                  {PARTNER_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select
                  value={followUpSortBy}
                  onChange={(e) => setFollowUpSortBy(e.target.value as typeof followUpSortBy)}
                  className="px-3 py-2 bg-[#1a1f3e] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="days_desc">Oldest First</option>
                  <option value="days_asc">Newest First</option>
                  <option value="name">By Name</option>
                  <option value="company">By Company</option>
                  <option value="attempts">By Attempts</option>
                </select>
              </div>
            </div>

            {/* Priority Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#1a1f3e] rounded-xl p-4 border border-red-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-red-400 text-sm">High Priority</p>
                    <p className="text-2xl font-bold text-white">{waitingItems.filter(i => i.priority === 'high').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a1f3e] rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-yellow-400 text-sm">Medium Priority</p>
                    <p className="text-2xl font-bold text-white">{waitingItems.filter(i => i.priority === 'medium').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a1f3e] rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-green-400 text-sm">Low Priority</p>
                    <p className="text-2xl font-bold text-white">{waitingItems.filter(i => i.priority === 'low').length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Follow-up Items */}
            {followUpsLoading || pipelineLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : getFilteredWaitingItems().length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-400">No pending follow-ups</p>
              </div>
            ) : (
              <div className="bg-[#1a1f3e] rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Partner</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Waiting For</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Days</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Attempts</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Priority</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredWaitingItems().map(item => (
                        <tr key={item.partnerId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-medium">{item.companyName}</p>
                              <p className="text-gray-400 text-sm">{item.partnerName}</p>
                              <p className="text-gray-500 text-xs">{item.partnerEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {item.waitingForCategory === 'calendly' && <Calendar className="w-4 h-4 text-blue-400" />}
                              {item.waitingForCategory === 'pandadoc' && <FileText className="w-4 h-4 text-purple-400" />}
                              {item.waitingForCategory === 'tipalti' && <DollarSign className="w-4 h-4 text-green-400" />}
                              <span className="text-gray-300">{item.waitingForLabel}</span>
                            </div>
                            <p className="text-gray-500 text-xs mt-1">Stage: {item.stageName}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-medium ${item.daysPending >= 14 ? 'text-red-400' : item.daysPending >= 7 ? 'text-yellow-400' : 'text-gray-300'}`}>
                              {item.daysPending} days
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-300">{item.attemptCount}</span>
                              {item.lastAttemptDate && (
                                <span className="text-gray-500 text-xs">
                                  (Last: {formatRelativeTime(item.lastAttemptDate)})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  const partner = partners.find(p => p.id === item.partnerId)
                                  if (partner) {
                                    setSelectedPartnerForFollowUp(partner)
                                    setShowReminderModal(true)
                                  }
                                }}
                                className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                                title="Send Reminder"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => skipStep(item.partnerId)}
                                className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors"
                                title="Skip Step"
                              >
                                <SkipForward className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => markInactive(item.partnerId)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Mark Inactive"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <h2 className="text-xl font-semibold text-white">Payment Management</h2>
              <div className="flex gap-2">
                {['paymentHistory', 'invoiceHistory', 'paymentDetails'].map(view => (
                  <button
                    key={view}
                    onClick={() => setPaymentsViewType(view as typeof paymentsViewType)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${paymentsViewType === view
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {view === 'paymentHistory' ? 'Payment History' : view === 'invoiceHistory' ? 'Invoice History' : 'Payment Details'}
                  </button>
                ))}
              </div>
            </div>

            {paymentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : paymentsViewType === 'paymentHistory' ? (
              <div className="bg-[#1a1f3e] rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Partner</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Type</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Total Earned</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Total Paid</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Pending</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentPartners.map(partner => (
                        <tr key={partner.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-medium">{partner.name}</p>
                              <p className="text-gray-400 text-sm">{partner.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{partner.partnerType}</td>
                          <td className="px-6 py-4 text-white font-medium">{formatCurrency(partner.totalEarned)}</td>
                          <td className="px-6 py-4 text-green-400">{formatCurrency(partner.totalPaid)}</td>
                          <td className="px-6 py-4 text-yellow-400">{formatCurrency(partner.pendingAmount)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${partner.tipaltiStatus === 'active' ? 'bg-green-500/20 text-green-400' :
                              partner.tipaltiStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                              {partner.tipaltiStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setSelectedPayeeId(partner.tipaltiPayeeId); setSelectedPayeeName(partner.name); setPaymentsViewType('paymentDetails'); }}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {partner.pendingAmount > 0 && partner.tipaltiStatus === 'active' && (
                                <button
                                  className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm transition-colors"
                                >
                                  Pay Now
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : paymentsViewType === 'invoiceHistory' ? (
              <div className="bg-[#1a1f3e] rounded-xl border border-white/10 p-8 text-center">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Invoice history coming soon</p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => { setSelectedPayeeId(null); setPaymentsViewType('paymentHistory'); }}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Payment History
                </button>
                <div className="bg-[#1a1f3e] rounded-xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Payment Details: {selectedPayeeName}</h3>
                  <p className="text-gray-400">Detailed payment information and history will appear here.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex gap-4 mb-6">
              {[
                { id: 'emails', label: 'Email Templates', icon: Mail },
                { id: 'dropdowns', label: 'Dropdowns', icon: ChevronDown },
                { id: 'calendly', label: 'Calendly', icon: Calendar },
                { id: 'stages', label: 'Pipeline Stages', icon: GitBranch },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id as typeof settingsTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Email Templates Settings */}
            {settingsTab === 'emails' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Email Templates</h3>
                  <p className="text-gray-400 text-sm">{emailTemplates.length} templates</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emailTemplates.map(template => (
                    <div key={template.id} className="bg-[#1a1f3e] rounded-xl border border-white/10 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-medium">{template.name}</h4>
                            {template.isActive ? (
                              <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">Active</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">Inactive</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                          <p className="text-gray-500 text-xs mt-2">Trigger: {template.trigger}</p>
                        </div>
                        <button
                          onClick={() => setEditingTemplate(template)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-3 p-3 bg-white/5 rounded-lg">
                        <p className="text-gray-400 text-xs mb-1">Subject:</p>
                        <p className="text-white text-sm">{template.subject}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dropdowns Settings */}
            {settingsTab === 'dropdowns' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Dropdown Options</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Dropdown
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Partner Types', options: PARTNER_TYPES },
                    { name: 'Partner Statuses', options: PARTNER_STATUSES },
                    { name: 'User Types', options: USER_TYPES },
                  ].map((dropdown, idx) => (
                    <div key={idx} className="bg-[#1a1f3e] rounded-xl border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium">{dropdown.name}</h4>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dropdown.options.map((opt, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded">
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendly Settings */}
            {settingsTab === 'calendly' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Calendly Integration</h3>
                  <button
                    onClick={fetchCalendlyLinks}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${calendlyLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {calendlyError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400">{calendlyError}</p>
                  </div>
                )}

                {calendlyUser && (
                  <div className="bg-[#1a1f3e] rounded-xl border border-white/10 p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{calendlyUser.name}</p>
                        <p className="text-gray-400 text-sm">{calendlyUser.email}</p>
                        <p className="text-gray-500 text-xs">{calendlyUser.timezone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {calendlyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
                  </div>
                ) : calendlyLinks.length === 0 ? (
                  <div className="text-center py-12 bg-[#1a1f3e] rounded-xl border border-white/10">
                    <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No Calendly event types found</p>
                    <button
                      onClick={fetchCalendlyLinks}
                      className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                    >
                      Connect Calendly
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {calendlyLinks.map(link => (
                      <div key={link.id} className="bg-[#1a1f3e] rounded-xl border border-white/10 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-medium">{link.name}</h4>
                            <p className="text-gray-400 text-sm mt-1">{link.duration} minutes</p>
                            {link.description && (
                              <p className="text-gray-500 text-xs mt-2">{link.description}</p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${link.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {link.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(link.schedulingUrl, link.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors text-sm"
                          >
                            {copiedLink === link.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {copiedLink === link.id ? 'Copied!' : 'Copy Link'}
                          </button>
                          <button
                            onClick={() => openCalendlyEmailModal(link)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors text-sm"
                          >
                            <Mail className="w-4 h-4" />
                            Send
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pipeline Stages Settings */}
            {settingsTab === 'stages' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Pipeline Stages</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Stage
                  </button>
                </div>
                <div className="space-y-2">
                  {PIPELINE_STAGES.map((stage, idx) => (
                    <div key={stage.id} className="bg-[#1a1f3e] rounded-xl border border-white/10 p-4 flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-sm">{idx + 1}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full ${stage.color}`}></div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{stage.name}</p>
                        {stage.waitingFor && (
                          <p className="text-gray-500 text-xs">Waiting for: {stage.waitingFor}</p>
                        )}
                      </div>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Analytics Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-white mt-1">$124,500</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +18%
                  </span>
                  <span className="text-gray-500">vs last month</span>
                </div>
              </div>

              <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Data Offloaded</p>
                    <p className="text-3xl font-bold text-white mt-1">2.4 TB</p>
                  </div>
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Wifi className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +24%
                  </span>
                  <span className="text-gray-500">vs last month</span>
                </div>
              </div>

              <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Locations</p>
                    <p className="text-3xl font-bold text-white mt-1">87</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +5
                  </span>
                  <span className="text-gray-500">new this month</span>
                </div>
              </div>

              <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Conversion Rate</p>
                    <p className="text-3xl font-bold text-white mt-1">34%</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +2%
                  </span>
                  <span className="text-gray-500">vs last month</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Revenue by Partner Type</h3>
                <div className="space-y-4">
                  {[
                    { type: 'Location Partners', amount: 78500, percent: 63 },
                    { type: 'Channel Partners', amount: 32000, percent: 26 },
                    { type: 'Referral Partners', amount: 14000, percent: 11 },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-300">{item.type}</span>
                        <span className="text-white font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-green-500 h-2 rounded-full"
                          style={{ width: `${item.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1a1f3e] rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Pipeline Overview</h3>
                <div className="space-y-3">
                  {PIPELINE_STAGES.slice(0, 6).map(stage => {
                    const count = partners.filter(p => p.stage === stage.id).length
                    const percent = partners.length > 0 ? (count / partners.length) * 100 : 0
                    return (
                      <div key={stage.id} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                        <span className="text-gray-300 flex-1">{stage.name}</span>
                        <span className="text-white font-medium">{count}</span>
                        <div className="w-20 bg-white/10 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${stage.color}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3e] rounded-xl border border-white/10 w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">User Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{selectedUser.name[0]}</span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white">{selectedUser.name}</h4>
                  <p className="text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs">User Type</p>
                  <p className="text-white font-medium">{selectedUser.userType}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs">Joined</p>
                  <p className="text-white font-medium">{formatDate(String(selectedUser.createdAt))}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs">Last Active</p>
                  <p className="text-white font-medium">{selectedUser.lastActive ? formatRelativeTime(selectedUser.lastActive) : 'Never'}</p>
                </div>
              </div>
              {selectedUser.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { updateUserStatus(selectedUser.id, 'approved'); setShowUserModal(false); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => { updateUserStatus(selectedUser.id, 'rejected'); setShowUserModal(false); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3e] rounded-xl border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Invite User</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">User Type</label>
                <select
                  value={inviteUserType}
                  onChange={(e) => setInviteUserType(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                >
                  {USER_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={sendInvite}
                disabled={!inviteEmail || inviteSending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {inviteSending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invite
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Reminder Modal */}
      {showReminderModal && selectedPartnerForFollowUp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3e] rounded-xl border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Send Reminder</h3>
              <button
                onClick={() => setShowReminderModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-white font-medium">{selectedPartnerForFollowUp.companyLegalName}</p>
                <p className="text-gray-400 text-sm">{selectedPartnerForFollowUp.contactFullName}</p>
                <p className="text-gray-500 text-xs">{selectedPartnerForFollowUp.contactEmail}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Reminder Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReminderType('email')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${reminderType === 'email'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    onClick={() => setReminderType('sms')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${reminderType === 'sms'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                  >
                    <Phone className="w-4 h-4" />
                    SMS
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Note (optional)</label>
                <textarea
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  placeholder="Add a personal note..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>
              <button
                onClick={sendReminder}
                disabled={sendingReminder}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {sendingReminder ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reminder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Detail Modal */}
      {showFollowUpModal && selectedPartnerForFollowUp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3e] rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#1a1f3e]">
              <h3 className="text-lg font-semibold text-white">Partner Details</h3>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Company</p>
                  <p className="text-white font-medium">{selectedPartnerForFollowUp.companyLegalName}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Contact</p>
                  <p className="text-white font-medium">{selectedPartnerForFollowUp.contactFullName}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Email</p>
                  <p className="text-white">{selectedPartnerForFollowUp.contactEmail}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Phone</p>
                  <p className="text-white">{selectedPartnerForFollowUp.contactPhone || 'N/A'}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Stage</p>
                  <p className="text-white">{PIPELINE_STAGES.find(s => s.id === selectedPartnerForFollowUp.stage)?.name || selectedPartnerForFollowUp.stage}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPartnerForFollowUp.status || 'active')}`}>
                    {selectedPartnerForFollowUp.status || 'active'}
                  </span>
                </div>
              </div>

              {selectedPartnerForFollowUp.followUpAttempts && selectedPartnerForFollowUp.followUpAttempts.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">Follow-up History</h4>
                  <div className="space-y-2">
                    {selectedPartnerForFollowUp.followUpAttempts.map((attempt, idx) => (
                      <div key={idx} className="p-3 bg-white/5 rounded-lg flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${attempt.type === 'email' ? 'bg-cyan-500/20' : 'bg-green-500/20'}`}>
                          {attempt.type === 'email' ? <Mail className="w-4 h-4 text-cyan-400" /> : <Phone className="w-4 h-4 text-green-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-white text-sm font-medium capitalize">{attempt.type} sent</p>
                            <p className="text-gray-500 text-xs">{formatDate(attempt.sentAt)}</p>
                          </div>
                          {attempt.note && <p className="text-gray-400 text-sm mt-1">{attempt.note}</p>}
                          <p className="text-gray-500 text-xs mt-1">By: {attempt.sentBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowFollowUpModal(false); setShowReminderModal(true); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Send Reminder
                </button>
                <button
                  onClick={() => { skipStep(selectedPartnerForFollowUp.id); setShowFollowUpModal(false); }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip
                </button>
                <button
                  onClick={() => { markInactive(selectedPartnerForFollowUp.id); setShowFollowUpModal(false); }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Inactive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Template Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3e] rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#1a1f3e]">
              <h3 className="text-lg font-semibold text-white">Edit Email Template</h3>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Template Name</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <input
                  type="text"
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Subject Line</label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email Body</label>
                <textarea
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 resize-none font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTemplate.isActive}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-gray-300">Active</span>
                </label>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-gray-400 text-xs mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {['{{name}}', '{{company}}', '{{email}}', '{{link}}', '{{stage}}', '{{date}}'].map(v => (
                    <code key={v} className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">{v}</code>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveEmailTemplate(editingTemplate)}
                  className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendly Email Modal */}
      {showCalendlyEmailModal && selectedCalendlyLink && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3e] rounded-xl border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Send Calendly Link</h3>
              <button
                onClick={() => setShowCalendlyEmailModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-sm font-medium">{selectedCalendlyLink.name}</p>
                <p className="text-gray-400 text-xs">{selectedCalendlyLink.duration} minutes</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Recipient Email</label>
                <input
                  type="email"
                  value={calendlyEmailRecipient}
                  onChange={(e) => setCalendlyEmailRecipient(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Subject</label>
                <input
                  type="text"
                  value={calendlyEmailSubject}
                  onChange={(e) => setCalendlyEmailSubject(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Message</label>
                <textarea
                  value={calendlyEmailMessage}
                  onChange={(e) => setCalendlyEmailMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>
              <button
                onClick={sendCalendlyEmail}
                disabled={!calendlyEmailRecipient || sendingCalendlyEmail}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {sendingCalendlyEmail ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Editor Modal */}
      {showFormEditorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3e] rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#1a1f3e]">
              <h3 className="text-lg font-semibold text-white">{editingForm ? 'Edit Form' : 'Create Form'}</h3>
              <button
                onClick={() => { setShowFormEditorModal(false); setEditingForm(null); }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-400 text-center py-8">Form editor coming soon...</p>
              <button
                onClick={() => { setShowFormEditorModal(false); setEditingForm(null); }}
                className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {showSubmissionDetailModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3e] rounded-xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#1a1f3e]">
              <h3 className="text-lg font-semibold text-white">Submission Details</h3>
              <button
                onClick={() => { setShowSubmissionDetailModal(false); setSelectedSubmission(null); }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Form: {selectedSubmission.formName}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSubmission.status)}`}>
                  {selectedSubmission.status}
                </span>
              </div>
              <div className="text-gray-500 text-xs">
                Submitted: {formatDate(selectedSubmission.submittedAt)}
              </div>
              <div className="space-y-3">
                {Object.entries(selectedSubmission.data || {}).map(([key, value]) => (
                  <div key={key} className="p-3 bg-white/5 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-white">{String(value)}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { updateSubmissionStatus(selectedSubmission.id, 'approved'); setShowSubmissionDetailModal(false); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => { updateSubmissionStatus(selectedSubmission.id, 'rejected'); setShowSubmissionDetailModal(false); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
