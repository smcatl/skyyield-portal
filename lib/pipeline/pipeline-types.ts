// Location Partner Onboarding Pipeline - Core Types
// All entities link together: Partner → Venues → Devices

// ============================================
// PIPELINE STAGE DEFINITIONS
// ============================================

export type PipelineStage = 
  | 'application'           // Step 1: Form submitted
  | 'initial_review'        // Step 2: Admin approve/deny
  | 'discovery_scheduled'   // Step 3: Calendly sent
  | 'discovery_complete'    // Step 4: After call approve/deny
  | 'venues_setup'          // Step 5: Venues/Devices form + optional Calendly
  | 'loi_sent'              // Step 6: LOI via DocuSeal
  | 'loi_signed'            // Step 7: LOI signed, install Calendly sent
  | 'install_scheduled'     // Step 8: Install date set, equipment PO
  | 'trial_active'          // Step 9: 60-day trial, Tipalti + Portal invites
  | 'trial_ending'          // Step 10: 10-day reminder, Calendly sent
  | 'contract_decision'     // Step 11: Contract or inactive
  | 'active'                // Step 12: Contract signed, active client
  | 'inactive'              // Declined at any stage or churned

export type ApprovalStatus = 'pending' | 'approved' | 'denied'
export type DocumentStatus = 'not_sent' | 'sent' | 'viewed' | 'signed' | 'declined'
export type CallStatus = 'not_scheduled' | 'scheduled' | 'completed' | 'no_show' | 'rescheduled'

// ============================================
// LOCATION PARTNER (CLIENT)
// ============================================

export interface LocationPartner {
  id: string
  
  // Pipeline tracking
  stage: PipelineStage
  stageEnteredAt: string
  createdAt: string
  updatedAt: string
  
  // Stage-specific statuses
  initialReviewStatus: ApprovalStatus
  initialReviewedBy?: string
  initialReviewedAt?: string
  initialReviewNotes?: string
  
  postCallReviewStatus: ApprovalStatus
  postCallReviewedBy?: string
  postCallReviewedAt?: string
  postCallReviewNotes?: string
  
  // Call tracking
  discoveryCallStatus: CallStatus
  discoveryCallScheduledAt?: string
  discoveryCallCompletedAt?: string
  discoveryCallNotes?: string
  
  technicalCallStatus: CallStatus
  technicalCallScheduledAt?: string
  technicalCallCompletedAt?: string
  technicalCallNotes?: string
  
  installCallStatus: CallStatus
  installCallScheduledAt?: string
  installCallCompletedAt?: string
  installCallNotes?: string
  
  trialReviewCallStatus: CallStatus
  trialReviewCallScheduledAt?: string
  trialReviewCallCompletedAt?: string
  trialReviewCallNotes?: string
  
  // Document tracking
  loiStatus: DocumentStatus
  loiSentAt?: string
  loiSignedAt?: string
  loiDocusealId?: string
  
  contractStatus: DocumentStatus
  contractSentAt?: string
  contractSignedAt?: string
  contractDocusealId?: string
  
  // Trial tracking
  trialStartDate?: string
  trialEndDate?: string
  trialDaysRemaining?: number
  
  // Invites tracking
  tipaltiInviteSent: boolean
  tipaltiInviteSentAt?: string
  tipaltiSignupComplete: boolean
  tipaltiSignupCompletedAt?: string
  
  portalInviteSent: boolean
  portalInviteSentAt?: string
  portalActivated: boolean
  portalActivatedAt?: string
  
  // ---- FORM 1 FIELDS (Application) ----
  // Contact Info
  contactFullName: string
  contactPreferredName?: string
  contactTitle?: string
  contactPhone: string
  contactEmail: string
  
  // Company Info
  companyLegalName: string
  companyDBA?: string
  companyIndustry?: string
  companyAddress1: string
  companyAddress2?: string
  companyCity: string
  companyState: string
  companyZip: string
  companyCountry: string
  
  // Additional Info
  linkedInProfile?: string
  howDidYouHear?: string
  numberOfLocations?: number
  currentInternetProvider?: string
  numberOfInternetLines?: number
  currentGbsInPlan?: number
  
  // Relationships
  referralPartnerId?: string  // Links to Referral Partner
  assignedAdminId?: string    // Admin managing this partner
  
  // Metadata
  source: 'website' | 'manual' | 'referral' | 'import'
  tags?: string[]
  notes?: string
}

// ============================================
// VENUE
// ============================================

export interface Venue {
  id: string
  locationPartnerId: string  // Links to Location Partner
  
  createdAt: string
  updatedAt: string
  
  // Venue Info (from Xnet Console form)
  name: string
  type: string  // From venue types dropdown
  phone: string
  address: string
  city: string
  state: string
  zip: string
  
  // Technical Info
  solanaWallet: string  // Usually 'SkyYield Wallet'
  isp: string           // From ISP dropdown
  connectionType: string  // Fiber, Cable, DSL, Satellite, Other
  serviceCategory: string // Business Internet, Consumer Internet
  internetSpeed: string   // 0-99 Mbps, 100-199 Mbps, etc.
  
  // Security
  onsiteSecurity: string[]  // Multiple selections
  
  // Status
  isActive: boolean
  installDate?: string
  
  // Metadata
  notes?: string
}

// ============================================
// DEVICE
// ============================================

export interface Device {
  id: string
  venueId: string           // Links to Venue
  locationPartnerId: string // Links to Location Partner (denormalized for easy queries)
  
  createdAt: string
  updatedAt: string
  
  // Device Info (from Xnet Console form)
  name: string              // Custom name
  model: string             // From approved products list
  macAddress: string
  serialNumber: string
  placement: 'Indoor' | 'Outdoor'
  
  // Categorization
  tags?: string[]
  
  // Status
  isActive: boolean
  installedAt?: string
  
  // Metadata
  notes?: string
}

// ============================================
// LOI DATA (Letter of Intent)
// ============================================

export interface LOIData {
  id: string
  locationPartnerId: string
  
  createdAt: string
  updatedAt: string
  
  // Dates
  loiDate: string
  trialPeriodStartDate?: string
  trialPeriodEndDate?: string
  
  // SkyYield Signer
  skyyieldSignerName: string
  skyyieldSignerTitle: string
  skyyieldSignature?: string
  skyyieldSignatureDate?: string
  
  // Location Partner Signer
  lpSignerName: string
  lpSignerTitle: string
  lpSignature?: string
  lpSignatureDate?: string
  
  // Prefilled from Partner
  lpName: string
  lpAddress1: string
  lpAddress2?: string
  lpCity: string
  lpState: string
  lpZip: string
  lpContactName: string
  lpContactTitle: string
  lpContactEmail: string
  lpCompanyName: string
  
  // Equipment Pricing (per unit)
  accessPointInsidePricePerUnit: number
  accessPointOutsidePricePerUnit: number
  routerPricePerUnit: number
  switchPricePerUnit: number
  softwareLicensePricePerUnit: number
  installationPricePerUnit: number
  
  // Equipment Counts
  accessPointInsideUnitCount: number
  accessPointOutsideUnitCount: number
  routerUnitCount: number
  switchUnitCount: number
  softwareLicenseUnitCount: number
  installationUnitCount: number
  
  // Calculated Totals (unit count × price per unit)
  accessPointInsideTotalCost: number
  accessPointOutsideTotalCost: number
  routerTotalCost: number
  switchTotalCost: number
  softwareLicenseTotalCost: number
  installationTotalCost: number
  
  totalCostToLocationPartner: number
  totalCostToSkyYield: number
  
  // Payment Responsibility (who pays)
  accessPointInsidePaymentResponsibility: 'SkyYield' | 'Location Partner'
  accessPointOutsidePaymentResponsibility: 'SkyYield' | 'Location Partner'
  routerPaymentResponsibility: 'SkyYield' | 'Location Partner'
  switchPaymentResponsibility: 'SkyYield' | 'Location Partner'
  softwareLicensePaymentResponsibility: 'SkyYield' | 'Location Partner'
  installationPaymentResponsibility: 'SkyYield' | 'Location Partner'
  
  // Ownership (who owns)
  accessPointInsideOwnership: 'SkyYield' | 'Location Partner'
  accessPointOutsideOwnership: 'SkyYield' | 'Location Partner'
  routerOwnership: 'SkyYield' | 'Location Partner'
  switchOwnership: 'SkyYield' | 'Location Partner'
  softwareLicenseOwnership: 'SkyYield' | 'Location Partner'
  installationOwnership: 'SkyYield' | 'Location Partner'
  
  // Revenue Share
  revenueDistributionPayout: number // percentage or fixed amount
  revenueDistributionType: 'percentage' | 'fixed'
}

// ============================================
// DEPLOYMENT DATA (Location Deployment form)
// ============================================

export interface DeploymentData {
  id: string
  locationPartnerId: string
  loiId: string
  
  createdAt: string
  updatedAt: string
  
  agreementDate: string
  deploymentOptionSelected: string[]
  
  // Copies pricing/counts from LOI but can be modified
  // Same structure as LOI equipment fields
  accessPointInsidePricePerUnit: number
  accessPointOutsidePricePerUnit: number
  routerPricePerUnit: number
  switchPricePerUnit: number
  softwareLicensePricePerUnit: number
  installationPricePerUnit: number
  
  accessPointInsideUnitCount: number
  accessPointOutsideUnitCount: number
  routerUnitCount: number
  switchUnitCount: number
  softwareLicenseUnitCount: number
  installationUnitCount: number
  
  // Totals
  accessPointInsideTotalCost: number
  accessPointOutsideTotalCost: number
  routerTotalCost: number
  switchTotalCost: number
  softwareLicenseTotalCost: number
  installationTotalCost: number
  
  totalCostToLocationPartner: number
  totalCostToSkyYield: number
  
  // Payment & Ownership (same as LOI)
  accessPointInsidePaymentResponsibility: 'SkyYield' | 'Location Partner'
  accessPointOutsidePaymentResponsibility: 'SkyYield' | 'Location Partner'
  routerPaymentResponsibility: 'SkyYield' | 'Location Partner'
  switchPaymentResponsibility: 'SkyYield' | 'Location Partner'
  softwareLicensePaymentResponsibility: 'SkyYield' | 'Location Partner'
  installationPaymentResponsibility: 'SkyYield' | 'Location Partner'
  
  accessPointInsideOwnership: 'SkyYield' | 'Location Partner'
  accessPointOutsideOwnership: 'SkyYield' | 'Location Partner'
  routerOwnership: 'SkyYield' | 'Location Partner'
  switchOwnership: 'SkyYield' | 'Location Partner'
  softwareLicenseOwnership: 'SkyYield' | 'Location Partner'
  installationOwnership: 'SkyYield' | 'Location Partner'
  
  revenueDistributionPayout: number
  revenueDistributionType: 'percentage' | 'fixed'
}

// ============================================
// ACTIVITY LOG (For audit trail)
// ============================================

export interface ActivityLog {
  id: string
  entityType: 'location_partner' | 'venue' | 'device' | 'loi' | 'deployment'
  entityId: string
  
  action: string  // e.g., 'stage_changed', 'field_updated', 'email_sent', 'call_scheduled'
  description: string
  
  previousValue?: string
  newValue?: string
  
  performedBy: string  // User ID or 'system'
  performedAt: string
  
  metadata?: Record<string, any>
}

// ============================================
// REFERRAL PARTNER (For linking)
// ============================================

export interface ReferralPartner {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  
  // Stats
  totalReferrals: number
  activeReferrals: number
  
  createdAt: string
  updatedAt: string
}

// ============================================
// PIPELINE FIELD CONFIGURATION
// (This is what admins edit in the backend)
// ============================================

export type FieldType = 
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'datetime'
  | 'textarea'
  | 'select'
  | 'multi_select'
  | 'checkbox'
  | 'radio'
  | 'address'
  | 'signature'
  | 'file'
  | 'calculated'

export interface FieldConfig {
  id: string
  key: string           // Database field name
  label: string         // Display label
  type: FieldType
  
  // Validation
  required: boolean
  requiredForStage?: PipelineStage  // Only required at certain stage
  
  // Options (for select, multi_select, radio)
  options?: string[]
  optionsSource?: 'venue_types' | 'isps' | 'approved_products' | 'custom'
  
  // Display
  placeholder?: string
  helpText?: string
  showInTable?: boolean
  showInCard?: boolean
  
  // Prefill
  prefillFrom?: string  // Field key to prefill from
  prefillSource?: 'partner' | 'venue' | 'loi'
  
  // Permissions
  editableBy: ('admin' | 'client')[]
  visibleTo: ('admin' | 'client')[]
  
  // Calculation (for calculated fields)
  calculation?: string  // e.g., 'unitCount * pricePerUnit'
  
  // Grouping
  section?: string
  order: number
}

export interface FormConfig {
  id: string
  name: string
  slug: string
  description?: string
  
  // Which stages this form applies to
  stages: PipelineStage[]
  
  // Fields in this form
  fields: FieldConfig[]
  
  // Sections for grouping
  sections: {
    id: string
    name: string
    order: number
    collapsible?: boolean
  }[]
  
  // Form settings
  settings: {
    submitButtonText: string
    successMessage: string
    allowSaveDraft: boolean
    requireAllFields: boolean
  }
  
  createdAt: string
  updatedAt: string
}

// ============================================
// DROPDOWN OPTIONS (Admin-editable)
// ============================================

export interface DropdownConfig {
  id: string
  key: string      // e.g., 'venue_types', 'isps', 'connection_types'
  name: string     // Display name
  options: {
    value: string
    label: string
    isActive: boolean
    order: number
  }[]
  
  allowCustom: boolean  // Can users add custom options?
  
  createdAt: string
  updatedAt: string
}

// ============================================
// CALENDLY CONFIGURATION
// ============================================

export interface CalendlyConfig {
  id: string
  name: string
  eventType: 'discovery' | 'technical' | 'install' | 'trial_review'
  calendlyUrl: string
  
  // When to auto-send
  triggerStage?: PipelineStage
  triggerAction?: string
  
  isActive: boolean
}

// ============================================
// EMAIL TEMPLATE CONFIGURATION
// ============================================

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string  // Supports {{variable}} placeholders
  
  // When to send
  triggerType: 'manual' | 'stage_change' | 'approval' | 'denial' | 'reminder'
  triggerStage?: PipelineStage
  triggerAction?: string
  
  // Include Calendly?
  includeCalendly?: boolean
  calendlyConfigId?: string
  
  isActive: boolean
  
  createdAt: string
  updatedAt: string
}