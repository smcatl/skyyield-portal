// Calendly Configuration for SkyYield Pipeline
// lib/pipeline/calendly-config.ts

export const CALENDLY_LINKS = {
  // Location Partner Pipeline
  locationPartner: {
    introCall: 'https://calendly.com/skyyield-management/new-location-partner-intro-call',
    introCallAlt: 'https://calendly.com/scohen-skyyield/new-location-partner-intro-call',
    installScheduling: 'https://calendly.com/skyyield-management/new-location-partner-intro-call-clone',
    negotiateLOI: 'https://calendly.com/skyyield-management/new-location-partner-intro-call-clone-3',
  },
  
  // Referral Partner Pipeline
  referralPartner: {
    introCall: 'https://calendly.com/skyyield-management/new-location-partner-intro-call-clone-1',
    onboardingCall: 'https://calendly.com/skyyield-management/new-referral-partner-intro-call-clone-1',
  },
  
  // Contractor Pipeline
  contractor: {
    introCall: 'https://calendly.com/skyyield-management/new-referral-partner-intro-call-clone',
    onboardingCall: 'https://calendly.com/skyyield-management/new-contractor-intro-call-clone',
  },
  
  // General
  general: {
    thirtyMinMeeting: 'https://calendly.com/scohen-skyyield/30min',
    getInTouch: 'https://calendly.com/skyyield-management/new-location-partner-intro-call-clone-2',
  },
} as const

// Pipeline Stage to Calendly Link Mapping
export const PIPELINE_CALENDLY_MAP = {
  // Location Partner stages that trigger Calendly
  discovery_scheduled: CALENDLY_LINKS.locationPartner.introCall,
  venues_setup: CALENDLY_LINKS.locationPartner.introCall, // Technical call (optional)
  loi_signed: CALENDLY_LINKS.locationPartner.installScheduling,
  trial_ending: CALENDLY_LINKS.locationPartner.negotiateLOI,
} as const

// Email templates with Calendly links
export const EMAIL_TEMPLATES = {
  // Application Approved - Send Discovery Call Link
  applicationApproved: {
    subject: 'Welcome to SkyYield - Schedule Your Discovery Call',
    calendlyLink: CALENDLY_LINKS.locationPartner.introCall,
    triggerStage: 'initial_review',
    triggerAction: 'approved',
  },
  
  // Post-Call Approved - Send Venues Form (Calendly optional for technical help)
  postCallApproved: {
    subject: 'Next Steps - Submit Your Venue Details',
    calendlyLink: CALENDLY_LINKS.locationPartner.introCall, // Optional technical call
    triggerStage: 'discovery_complete',
    triggerAction: 'approved',
  },
  
  // LOI Signed - Send Install Scheduling Link
  loiSigned: {
    subject: 'LOI Received - Schedule Your Installation',
    calendlyLink: CALENDLY_LINKS.locationPartner.installScheduling,
    triggerStage: 'loi_signed',
  },
  
  // Trial Ending - Send Review/Contract Discussion Link
  trialEnding: {
    subject: 'Your Trial is Ending - Schedule Review Call',
    calendlyLink: CALENDLY_LINKS.locationPartner.negotiateLOI,
    triggerStage: 'trial_ending',
  },
  
  // Application Denied
  applicationDenied: {
    subject: 'SkyYield Application Update',
    calendlyLink: null,
    triggerStage: 'initial_review',
    triggerAction: 'denied',
  },
  
  // Post-Call Denied
  postCallDenied: {
    subject: 'SkyYield Partnership Update',
    calendlyLink: null,
    triggerStage: 'discovery_complete',
    triggerAction: 'denied',
  },
} as const

// Helper function to get Calendly link for a stage
export function getCalendlyLinkForStage(stage: string): string | null {
  return PIPELINE_CALENDLY_MAP[stage as keyof typeof PIPELINE_CALENDLY_MAP] || null
}

// Helper function to generate prefilled Calendly link with partner info
export function generateCalendlyLink(
  baseUrl: string,
  partner: {
    name?: string
    email?: string
    company?: string
  }
): string {
  const params = new URLSearchParams()
  
  if (partner.name) params.set('name', partner.name)
  if (partner.email) params.set('email', partner.email)
  if (partner.company) params.set('a1', partner.company) // Custom question 1
  
  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

// Type exports
export type CalendlyLinkKey = keyof typeof CALENDLY_LINKS
export type PipelineStageWithCalendly = keyof typeof PIPELINE_CALENDLY_MAP