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