// app/api/cron/trial-check/route.ts
// Daily cron job to check trial status and send reminders
// Configure in Vercel: cron = "0 9 * * *" (9 AM daily)
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    processed: 0,
    trialEnding: [] as string[],
    trialExpired: [] as string[],
    errors: [] as string[],
  }

  try {
    const today = new Date()
    const tenDaysFromNow = new Date(today)
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10)

    // =========================================
    // 1. Find trials ending in 10 days
    // =========================================
    const { data: endingTrials, error: endingError } = await supabase
      .from('location_partners')
      .select('id, partner_id, company_name, contact_name, email, trial_end_date, stage')
      .eq('stage', 'trial_active')
      .lte('trial_end_date', tenDaysFromNow.toISOString().split('T')[0])
      .gt('trial_end_date', today.toISOString().split('T')[0])

    if (endingError) {
      results.errors.push(`Error fetching ending trials: ${endingError.message}`)
    } else if (endingTrials && endingTrials.length > 0) {
      for (const partner of endingTrials) {
        try {
          // Update stage to trial_ending
          await supabase
            .from('location_partners')
            .update({
              stage: 'trial_ending',
              stage_entered_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', partner.id)

          // Log activity
          await supabase.from('activity_log').insert([{
            entity_type: 'location_partner',
            entity_id: partner.id,
            entity_name: partner.company_name,
            action: 'trial_ending_reminder',
            action_category: 'cron',
            description: `Trial ending on ${partner.trial_end_date} - 10 day reminder`,
            new_values: { stage: 'trial_ending' },
          }])

          // TODO: Send email reminder
          // await sendTrialEndingEmail(partner)

          // TODO: Create task for admin follow-up
          // await createFollowUpTask(partner)

          results.trialEnding.push(partner.partner_id)
          results.processed++
        } catch (err: any) {
          results.errors.push(`Error processing ${partner.partner_id}: ${err.message}`)
        }
      }
    }

    // =========================================
    // 2. Find expired trials (past end date)
    // =========================================
    const { data: expiredTrials, error: expiredError } = await supabase
      .from('location_partners')
      .select('id, partner_id, company_name, trial_end_date, stage')
      .in('stage', ['trial_active', 'trial_ending'])
      .lt('trial_end_date', today.toISOString().split('T')[0])

    if (expiredError) {
      results.errors.push(`Error fetching expired trials: ${expiredError.message}`)
    } else if (expiredTrials && expiredTrials.length > 0) {
      for (const partner of expiredTrials) {
        try {
          // Update stage to contract_decision
          await supabase
            .from('location_partners')
            .update({
              stage: 'contract_decision',
              stage_entered_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', partner.id)

          // Log activity
          await supabase.from('activity_log').insert([{
            entity_type: 'location_partner',
            entity_id: partner.id,
            entity_name: partner.company_name,
            action: 'trial_expired',
            action_category: 'cron',
            description: `Trial expired on ${partner.trial_end_date} - requires decision`,
            new_values: { stage: 'contract_decision' },
          }])

          results.trialExpired.push(partner.partner_id)
          results.processed++
        } catch (err: any) {
          results.errors.push(`Error processing expired ${partner.partner_id}: ${err.message}`)
        }
      }
    }

    // =========================================
    // 3. Check for stale applications (no activity in 14 days)
    // =========================================
    const fourteenDaysAgo = new Date(today)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: staleApplications } = await supabase
      .from('location_partners')
      .select('id, partner_id, company_name, stage, updated_at')
      .in('stage', ['application', 'initial_review', 'discovery_scheduled'])
      .lt('updated_at', fourteenDaysAgo.toISOString())

    if (staleApplications && staleApplications.length > 0) {
      for (const partner of staleApplications) {
        // Log stale application for admin attention
        await supabase.from('activity_log').insert([{
          entity_type: 'location_partner',
          entity_id: partner.id,
          entity_name: partner.company_name,
          action: 'stale_application',
          action_category: 'cron',
          description: `Application stale - no activity since ${partner.updated_at}`,
          new_values: { days_stale: 14 },
        }])
      }
    }

    // =========================================
    // 4. Summary log
    // =========================================
    await supabase.from('activity_log').insert([{
      entity_type: 'system',
      entity_id: null,
      action: 'trial_check_cron',
      action_category: 'cron',
      description: `Daily trial check: ${results.trialEnding.length} ending, ${results.trialExpired.length} expired`,
      new_values: results,
    }])

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    })
  } catch (error: any) {
    console.error('Trial check cron error:', error)
    return NextResponse.json({ 
      error: error.message,
      results,
    }, { status: 500 })
  }
}

// Also support POST for Vercel Cron
export async function POST(request: NextRequest) {
  return GET(request)
}
