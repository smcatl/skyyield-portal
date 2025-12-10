// API Route: Pipeline Partners
// app/api/pipeline/partners/route.ts

import { NextRequest, NextResponse } from 'next/server'

// In-memory store (replace with database)
const partners: Map<string, any> = new Map()
const activityLogs: any[] = []

const generateId = () => `lp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

function calculateTrialDays(endDate?: string): number | undefined {
  if (!endDate) return undefined
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function logActivity(entityId: string, action: string, description: string, performedBy = 'system') {
  activityLogs.push({
    id: `log_${Date.now()}`,
    entityType: 'location_partner',
    entityId,
    action,
    description,
    performedBy,
    performedAt: new Date().toISOString(),
  })
}

// Send email via internal API
async function sendEmail(templateId: string, partner: any, extraData?: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await fetch(`${baseUrl}/api/pipeline/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, partner, extraData }),
    })
    console.log(`✉️ Sent ${templateId} to ${partner.contactEmail}`)
  } catch (e) {
    console.error('Email error:', e)
  }
}

// Handle stage transition emails
async function handleStageTransition(partner: any, prevStage: string, newStage: string, approval?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (prevStage === 'initial_review' && newStage === 'discovery_scheduled') {
    await sendEmail('applicationApproved', partner)
  }
  if (prevStage === 'initial_review' && newStage === 'inactive' && approval === 'denied') {
    await sendEmail('applicationDenied', partner)
  }
  if (prevStage === 'discovery_complete' && newStage === 'venues_setup') {
    await sendEmail('postCallApproved', partner, { venuesFormUrl: `${baseUrl}/pipeline/venues/${partner.id}` })
  }
  if (newStage === 'loi_signed' && prevStage !== 'loi_signed') {
    await sendEmail('loiSigned', partner)
  }
  if (newStage === 'trial_active' && prevStage !== 'trial_active') {
    await sendEmail('trialStarted', partner, { trialEndDate: partner.trialEndDate })
  }
  if (newStage === 'trial_ending' && prevStage !== 'trial_ending') {
    await sendEmail('trialEnding', partner, { daysRemaining: partner.trialDaysRemaining || 10 })
  }
}

// Initialize sample data
function initSamples() {
  if (partners.size > 0) return
  const now = new Date()

  const samples = [
    {
      id: 'lp_001',
      stage: 'discovery_scheduled',
      contactFullName: 'Sarah Johnson',
      contactPreferredName: 'Sarah',
      contactEmail: 'sarah@downtowncoffee.com',
      contactPhone: '(404) 555-0101',
      companyLegalName: 'Downtown Coffee LLC',
      companyDBA: 'Downtown Coffee',
      companyIndustry: 'food_beverage',
      companyCity: 'Atlanta',
      companyState: 'GA',
      companyZip: '30303',
      initialReviewStatus: 'approved',
      postCallReviewStatus: 'pending',
      discoveryCallStatus: 'scheduled',
      loiStatus: 'not_sent',
      trialStartDate: undefined as string | undefined,
      trialEndDate: undefined as string | undefined,
      tipaltiInviteSent: false,
      portalActivated: false,
      source: 'website',
      tags: ['high_priority'],
      numberOfLocations: 1,
      // Follow-up tracking
      waitingFor: 'calendly_discovery',
      waitingSince: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      partnerType: 'Location Partner',
      status: 'active',
      followUpAttempts: [
        { id: 'att_1', type: 'email', sentAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), sentBy: 'admin', note: 'Initial reminder sent' }
      ],
    },
    {
      id: 'lp_002',
      stage: 'trial_active',
      contactFullName: 'Michael Chen',
      contactPreferredName: 'Michael',
      contactEmail: 'mchen@hotelhaven.com',
      contactPhone: '(305) 555-0202',
      companyLegalName: 'Haven Hospitality Group',
      companyDBA: 'Hotel Haven',
      companyIndustry: 'hospitality',
      companyCity: 'Miami',
      companyState: 'FL',
      companyZip: '33131',
      initialReviewStatus: 'approved',
      postCallReviewStatus: 'approved',
      discoveryCallStatus: 'completed',
      loiStatus: 'signed',
      trialStartDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      trialEndDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      tipaltiInviteSent: true,
      portalActivated: true,
      source: 'referral',
      tags: ['enterprise'],
      numberOfLocations: 5,
      // Follow-up tracking - no waiting, trial is active
      partnerType: 'Location Partner',
      status: 'active',
    },
    {
      id: 'lp_003',
      stage: 'initial_review',
      contactFullName: 'Jennifer Martinez',
      contactPreferredName: 'Jen',
      contactEmail: 'jen@fitnessfirst.com',
      contactPhone: '(512) 555-0303',
      companyLegalName: 'Fitness First Austin LLC',
      companyDBA: 'Fitness First',
      companyIndustry: 'entertainment',
      companyCity: 'Austin',
      companyState: 'TX',
      companyZip: '78701',
      initialReviewStatus: 'pending',
      postCallReviewStatus: 'pending',
      discoveryCallStatus: 'not_scheduled',
      loiStatus: 'not_sent',
      trialStartDate: undefined as string | undefined,
      trialEndDate: undefined as string | undefined,
      tipaltiInviteSent: false,
      portalActivated: false,
      source: 'google',
      tags: [],
      numberOfLocations: 2,
      // No waiting - in initial review (admin action needed)
      partnerType: 'Location Partner',
      status: 'active',
    },
    // Additional sample partners for follow-up testing
    {
      id: 'lp_004',
      stage: 'loi_sent',
      contactFullName: 'David Thompson',
      contactPreferredName: 'Dave',
      contactEmail: 'dave@brewpub.com',
      contactPhone: '(303) 555-0404',
      companyLegalName: 'Mountain Brew Pub LLC',
      companyDBA: 'Mountain Brew',
      companyIndustry: 'food_beverage',
      companyCity: 'Denver',
      companyState: 'CO',
      companyZip: '80202',
      initialReviewStatus: 'approved',
      postCallReviewStatus: 'approved',
      discoveryCallStatus: 'completed',
      loiStatus: 'sent',
      tipaltiInviteSent: false,
      portalActivated: false,
      source: 'referral',
      tags: [],
      numberOfLocations: 1,
      // Follow-up tracking - waiting on LOI signature
      waitingFor: 'pandadoc_loi',
      waitingSince: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
      partnerType: 'Location Partner',
      status: 'active',
      followUpAttempts: [
        { id: 'att_2', type: 'email', sentAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(), sentBy: 'admin', note: 'First reminder' },
        { id: 'att_3', type: 'email', sentAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), sentBy: 'admin', note: 'Second reminder' },
      ],
      followUpNotes: 'Said he would sign by end of week',
    },
    {
      id: 'lp_005',
      stage: 'install_scheduled',
      contactFullName: 'Lisa Wong',
      contactPreferredName: 'Lisa',
      contactEmail: 'lisa@wongsdiner.com',
      contactPhone: '(415) 555-0505',
      companyLegalName: 'Wongs Family Diner Inc',
      companyDBA: 'Wongs Diner',
      companyIndustry: 'food_beverage',
      companyCity: 'San Francisco',
      companyState: 'CA',
      companyZip: '94102',
      initialReviewStatus: 'approved',
      postCallReviewStatus: 'approved',
      discoveryCallStatus: 'completed',
      loiStatus: 'signed',
      tipaltiInviteSent: true,
      portalActivated: true,
      source: 'website',
      tags: ['high_priority'],
      numberOfLocations: 3,
      // Follow-up tracking - waiting on install booking
      waitingFor: 'calendly_install',
      waitingSince: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      partnerType: 'Location Partner',
      status: 'active',
      followUpAttempts: [
        { id: 'att_4', type: 'email', sentAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), sentBy: 'admin', note: 'Sent install scheduling link' },
      ],
    },
    {
      id: 'lp_006',
      stage: 'contract_sent',
      contactFullName: 'Robert Garcia',
      contactPreferredName: 'Rob',
      contactEmail: 'rob@garciahotels.com',
      contactPhone: '(702) 555-0606',
      companyLegalName: 'Garcia Hospitality LLC',
      companyDBA: 'Garcia Hotels',
      companyIndustry: 'hospitality',
      companyCity: 'Las Vegas',
      companyState: 'NV',
      companyZip: '89101',
      initialReviewStatus: 'approved',
      postCallReviewStatus: 'approved',
      discoveryCallStatus: 'completed',
      loiStatus: 'signed',
      tipaltiInviteSent: true,
      portalActivated: true,
      source: 'channel_partner',
      tags: ['enterprise', 'high_priority'],
      numberOfLocations: 8,
      // Follow-up tracking - waiting on contract signature (35 days!)
      waitingFor: 'pandadoc_contract',
      waitingSince: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago!
      partnerType: 'Location Partner',
      status: 'active',
      followUpAttempts: [
        { id: 'att_5', type: 'email', sentAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), sentBy: 'admin', note: 'Sent contract' },
        { id: 'att_6', type: 'email', sentAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(), sentBy: 'admin', note: 'First reminder' },
        { id: 'att_7', type: 'sms', sentAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), sentBy: 'admin', note: 'Called and left voicemail' },
        { id: 'att_8', type: 'email', sentAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), sentBy: 'admin', note: 'Final reminder' },
      ],
      followUpNotes: 'Legal review taking longer than expected. Consider marking inactive.',
    },
    {
      id: 'lp_007',
      stage: 'loi_signed',
      contactFullName: 'Amanda Foster',
      contactPreferredName: 'Amanda',
      contactEmail: 'amanda@fosterfitness.com',
      contactPhone: '(206) 555-0707',
      companyLegalName: 'Foster Fitness Studios',
      companyDBA: 'Foster Fitness',
      companyIndustry: 'entertainment',
      companyCity: 'Seattle',
      companyState: 'WA',
      companyZip: '98101',
      initialReviewStatus: 'approved',
      postCallReviewStatus: 'approved',
      discoveryCallStatus: 'completed',
      loiStatus: 'signed',
      tipaltiInviteSent: false,
      portalActivated: false,
      source: 'website',
      tags: [],
      numberOfLocations: 2,
      // Follow-up tracking - waiting on Tipalti setup
      waitingFor: 'tipalti_setup',
      waitingSince: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      partnerType: 'Location Partner',
      status: 'active',
    },
    {
      id: 'lp_008',
      stage: 'trial_ending',
      contactFullName: 'James Wilson',
      contactPreferredName: 'James',
      contactEmail: 'james@wilsonmotors.com',
      contactPhone: '(214) 555-0808',
      companyLegalName: 'Wilson Auto Group',
      companyDBA: 'Wilson Motors',
      companyIndustry: 'automotive',
      companyCity: 'Dallas',
      companyState: 'TX',
      companyZip: '75201',
      initialReviewStatus: 'approved',
      postCallReviewStatus: 'approved',
      discoveryCallStatus: 'completed',
      loiStatus: 'signed',
      trialStartDate: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString(),
      trialEndDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      tipaltiInviteSent: true,
      portalActivated: true,
      source: 'referral',
      tags: ['enterprise'],
      numberOfLocations: 4,
      // Follow-up tracking - waiting on review call booking
      waitingFor: 'calendly_review',
      waitingSince: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      partnerType: 'Location Partner',
      status: 'active',
      followUpAttempts: [
        { id: 'att_9', type: 'email', sentAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), sentBy: 'admin', note: 'Trial ending soon - schedule review' },
      ],
      followUpNotes: 'Trial ending in 5 days - urgent!',
    },
  ]

  samples.forEach((s) => {
    const p = {
      ...s,
      companyAddress1: '123 Main St',
      companyAddress2: '',
      companyCountry: 'USA',
      stageEnteredAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      technicalCallStatus: 'not_scheduled',
      installCallStatus: 'not_scheduled',
      trialReviewCallStatus: 'not_scheduled',
      contractStatus: 'not_sent',
      tipaltiSignupComplete: false,
      portalInviteSent: false,
      trialDaysRemaining: calculateTrialDays(s.trialEndDate),
    }
    partners.set(p.id, p)
  })
}

export async function GET(request: NextRequest) {
  initSamples()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const partner = partners.get(id)
    if (!partner) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    partner.trialDaysRemaining = calculateTrialDays(partner.trialEndDate)
    const logs = activityLogs.filter((l) => l.entityId === id).slice(-50)
    return NextResponse.json({ partner, activityLog: logs })
  }

  let result = Array.from(partners.values())
  const stage = searchParams.get('stage')
  const search = searchParams.get('search')?.toLowerCase()

  if (stage) result = result.filter((p) => p.stage === stage)
  if (search) {
    result = result.filter(
      (p) =>
        p.contactFullName?.toLowerCase().includes(search) ||
        p.companyLegalName?.toLowerCase().includes(search) ||
        p.companyDBA?.toLowerCase().includes(search) ||
        p.contactEmail?.toLowerCase().includes(search)
    )
  }

  result.forEach((p) => {
    p.trialDaysRemaining = calculateTrialDays(p.trialEndDate)
  })

  const stats = {
    total: partners.size,
    byStage: {} as Record<string, number>,
    pendingReview: 0,
    inTrial: 0,
    trialEndingSoon: 0,
    active: 0,
  }

  partners.forEach((p) => {
    stats.byStage[p.stage] = (stats.byStage[p.stage] || 0) + 1
    if (p.stage === 'initial_review' || p.stage === 'discovery_complete') stats.pendingReview++
    if (p.stage === 'trial_active' || p.stage === 'trial_ending') stats.inTrial++
    if (p.stage === 'trial_active' && (p.trialDaysRemaining || 999) <= 10) stats.trialEndingSoon++
    if (p.stage === 'active') stats.active++
  })

  return NextResponse.json({ partners: result, stats })
}

export async function POST(request: NextRequest) {
  initSamples()
  const body = await request.json()

  const partner = {
    id: generateId(),
    stage: 'application',
    stageEnteredAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    initialReviewStatus: 'pending',
    postCallReviewStatus: 'pending',
    discoveryCallStatus: 'not_scheduled',
    technicalCallStatus: 'not_scheduled',
    installCallStatus: 'not_scheduled',
    trialReviewCallStatus: 'not_scheduled',
    loiStatus: 'not_sent',
    contractStatus: 'not_sent',
    tipaltiInviteSent: false,
    tipaltiSignupComplete: false,
    portalInviteSent: false,
    portalActivated: false,
    companyCountry: 'USA',
    source: 'website',
    tags: [],
    trialDaysRemaining: undefined as number | undefined,
    ...body,
  }

  partners.set(partner.id, partner)
  logActivity(partner.id, 'created', `Application submitted for ${partner.companyDBA || partner.companyLegalName}`)

  // Auto-move to initial_review
  partner.stage = 'initial_review'
  partner.stageEnteredAt = new Date().toISOString()
  logActivity(partner.id, 'stage_change', 'Moved to Initial Review', 'system')

  return NextResponse.json({ partner }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  initSamples()
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const partner = partners.get(id)
  if (!partner) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const previousStage = partner.stage
  let approvalStatus: string | undefined

  // Track approval changes
  if (updates.initialReviewStatus && updates.initialReviewStatus !== partner.initialReviewStatus) {
    approvalStatus = updates.initialReviewStatus
    updates.initialReviewedAt = new Date().toISOString()
    logActivity(id, 'review', `Initial review: ${updates.initialReviewStatus}`)
  }
  if (updates.postCallReviewStatus && updates.postCallReviewStatus !== partner.postCallReviewStatus) {
    approvalStatus = updates.postCallReviewStatus
    updates.postCallReviewedAt = new Date().toISOString()
    logActivity(id, 'review', `Post-call review: ${updates.postCallReviewStatus}`)
  }

  // Apply updates
  Object.assign(partner, updates, { updatedAt: new Date().toISOString() })

  // Track stage change
  if (updates.stage && updates.stage !== previousStage) {
    partner.stageEnteredAt = new Date().toISOString()
    logActivity(id, 'stage_change', `Stage: ${previousStage} → ${updates.stage}`)

    // Set trial dates if moving to trial_active
    if (updates.stage === 'trial_active' && !partner.trialStartDate) {
      const now = new Date()
      partner.trialStartDate = now.toISOString()
      partner.trialEndDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()
    }

    // Send stage transition emails
    await handleStageTransition(partner, previousStage, updates.stage, approvalStatus)
  }

  partner.trialDaysRemaining = calculateTrialDays(partner.trialEndDate)
  partners.set(id, partner)

  return NextResponse.json({ partner })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (!partners.has(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  partners.delete(id)
  logActivity(id, 'deleted', 'Partner deleted')

  return NextResponse.json({ success: true })
}