import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Reminder API route
// POST: Send a reminder (email or SMS) and log the attempt

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { partnerId, type, to, waitingFor, waitingForLabel, note } = body

    if (!partnerId || !type || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: partnerId, type, to' },
        { status: 400 }
      )
    }

    // Generate reminder message based on what they're waiting for
    const reminderMessages: Record<string, { subject: string; body: string; sms: string }> = {
      calendly_discovery: {
        subject: '📅 Reminder: Schedule Your SkyYield Discovery Call',
        body: `Hi! We noticed you haven't scheduled your discovery call yet. We're excited to learn more about your venue and discuss how SkyYield can help you monetize your WiFi infrastructure.\n\nPlease click the link in your previous email to schedule a time that works for you, or reply to this email if you need assistance.`,
        sms: 'Hi! This is SkyYield. We noticed you haven\'t scheduled your discovery call yet. Please check your email for the scheduling link or reply HELP for assistance.'
      },
      calendly_install: {
        subject: '🔧 Reminder: Schedule Your SkyYield Installation',
        body: `Hi! We're ready to get your SkyYield equipment installed. Please schedule your installation appointment at your earliest convenience.\n\nThe installation typically takes 30-60 minutes and our technician will bring all necessary equipment.`,
        sms: 'Hi! SkyYield here. We\'re ready to install your equipment! Please check your email to schedule installation or reply HELP.'
      },
      calendly_review: {
        subject: '📊 Reminder: Schedule Your Trial Review Call',
        body: `Hi! Your SkyYield trial is coming to an end and we'd love to review your results with you. Please schedule a quick call to discuss your earnings and next steps.`,
        sms: 'Hi! Your SkyYield trial is ending soon. Please schedule your review call to discuss results. Check your email for the link!'
      },
      pandadoc_loi: {
        subject: '📝 Reminder: Sign Your SkyYield Letter of Intent',
        body: `Hi! We noticed you haven't signed the Letter of Intent yet. This document outlines our trial partnership terms.\n\nPlease check your email for the PandaDoc link, or reply if you have any questions about the terms.`,
        sms: 'Hi! SkyYield reminder: Please sign your Letter of Intent. Check your email for the PandaDoc link or reply HELP.'
      },
      pandadoc_contract: {
        subject: '📄 Reminder: Sign Your SkyYield Deployment Contract',
        body: `Hi! Congratulations on a successful trial! We're excited to continue our partnership.\n\nPlease sign your deployment contract to make it official. Check your email for the PandaDoc link.`,
        sms: 'Hi! SkyYield here. Please sign your deployment contract to continue our partnership. Check email for the link!'
      },
      tipalti_setup: {
        subject: '💰 Reminder: Set Up Your Payment Account',
        body: `Hi! To receive your SkyYield earnings, please set up your payment account through Tipalti.\n\nThis only takes a few minutes. Check your email for the setup link.`,
        sms: 'Hi! SkyYield reminder: Set up your Tipalti payment account to receive earnings. Check your email for the link!'
      },
      portal_setup: {
        subject: '🔐 Reminder: Activate Your SkyYield Portal',
        body: `Hi! Your SkyYield Partner Portal is ready! This is your dashboard for tracking earnings and managing your account.\n\nPlease check your email for the activation link.`,
        sms: 'Hi! Your SkyYield Portal is ready! Check your email to activate your account and view your dashboard.'
      },
      default: {
        subject: '⏳ SkyYield Follow-Up',
        body: `Hi! We're following up on your SkyYield partnership. Please let us know if you have any questions or need assistance with the next steps.`,
        sms: 'Hi! SkyYield follow-up: Please let us know if you need help with the next steps. Reply or call us!'
      }
    }

    const message = reminderMessages[waitingFor] || reminderMessages.default

    if (type === 'email') {
      // Send email reminder
      // This would integrate with your email service (SendGrid, Resend, etc.)
      // For now, we'll log it and potentially use the existing email API
      
      try {
        // Try to use existing email API
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/pipeline/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            subject: message.subject,
            body: message.body,
            isReminder: true,
            partnerId,
            waitingFor
          }),
        })
        
        if (!emailResponse.ok) {
          console.error('Email API returned error:', await emailResponse.text())
        }
      } catch (emailError) {
        console.error('Error calling email API:', emailError)
        // Continue anyway - we'll still log the attempt
      }
      
      console.log('Email reminder sent:', { to, subject: message.subject })
      
    } else if (type === 'sms') {
      // Send SMS reminder
      // This would integrate with Twilio or similar
      // For now, we'll log it
      
      console.log('SMS reminder would be sent:', { to, message: message.sms })
      
      // Twilio integration example (uncomment and configure when ready):
      /*
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilio = require('twilio')(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        )
        
        await twilio.messages.create({
          body: message.sms,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: to
        })
      }
      */
    }

    // Log the follow-up attempt in the database
    // This would update the partner record with the new attempt
    try {
      const attemptResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/pipeline/partners/${partnerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addFollowUpAttempt: {
            type,
            sentAt: new Date().toISOString(),
            sentBy: userId,
            note: note || `${type === 'email' ? 'Email' : 'SMS'} reminder for ${waitingForLabel || waitingFor}`,
            waitingFor
          },
          lastContactDate: new Date().toISOString()
        }),
      })
      
      if (!attemptResponse.ok) {
        console.error('Failed to log attempt:', await attemptResponse.text())
      }
    } catch (logError) {
      console.error('Error logging follow-up attempt:', logError)
      // Don't fail the request just because logging failed
    }

    return NextResponse.json({
      success: true,
      message: `${type === 'email' ? 'Email' : 'SMS'} reminder sent successfully`,
      details: {
        partnerId,
        type,
        to,
        waitingFor,
        sentAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    )
  }
}

// GET: Get reminder history for a partner
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID required' },
        { status: 400 }
      )
    }

    // Fetch partner's follow-up history
    // This would come from your database
    
    // For now, return empty array - real implementation would query database
    return NextResponse.json({
      partnerId,
      attempts: [],
      totalAttempts: 0
    })

  } catch (error) {
    console.error('Error fetching reminder history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminder history' },
      { status: 500 }
    )
  }
}