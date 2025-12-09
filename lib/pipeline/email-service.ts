// Email Service for SkyYield Pipeline
// lib/pipeline/email-service.ts

import { CALENDLY_LINKS, generateCalendlyLink } from './calendly-config'

// Email provider configuration (supports Resend, SendGrid, or custom SMTP)
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend' // 'resend' | 'sendgrid' | 'smtp'
const RESEND_API_KEY = process.env.RESEND_API_KEY
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'partners@skyyield.com'
const FROM_NAME = process.env.FROM_NAME || 'SkyYield Partners'

interface EmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

interface PartnerEmailData {
  id: string
  contactFullName: string
  contactPreferredName?: string
  contactEmail: string
  companyLegalName: string
  companyDBA?: string
}

// Send email via configured provider
async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (EMAIL_PROVIDER === 'resend' && RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
      })
      
      if (!res.ok) {
        const error = await res.text()
        return { success: false, error }
      }
      return { success: true }
    }
    
    if (EMAIL_PROVIDER === 'sendgrid' && SENDGRID_API_KEY) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: params.to }] }],
          from: { email: FROM_EMAIL, name: FROM_NAME },
          subject: params.subject,
          content: [
            { type: 'text/html', value: params.html },
            ...(params.text ? [{ type: 'text/plain', value: params.text }] : []),
          ],
        }),
      })
      
      if (!res.ok) {
        const error = await res.text()
        return { success: false, error }
      }
      return { success: true }
    }
    
    // Fallback: log email (for development)
    console.log('📧 Email would be sent:', {
      to: params.to,
      subject: params.subject,
      preview: params.html.substring(0, 200),
    })
    return { success: true }
    
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// Generate HTML email template
function generateEmailHTML(options: {
  greeting: string
  bodyParagraphs: string[]
  ctaText?: string
  ctaUrl?: string
  footerNote?: string
}): string {
  const { greeting, bodyParagraphs, ctaText, ctaUrl, footerNote } = options
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SkyYield</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0F2C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0F2C; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1A1F3A; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #2D3B5F;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-flex; align-items: center;">
                      <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0EA5E9, #22C55E); border-radius: 8px; margin-right: 12px;"></div>
                      <span style="font-size: 24px; font-weight: bold; color: #FFFFFF;">SkyYield</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #FFFFFF; font-size: 24px; margin: 0 0 24px 0; font-weight: 600;">
                ${greeting}
              </h1>
              
              ${bodyParagraphs.map(p => `
                <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  ${p}
                </p>
              `).join('')}
              
              ${ctaText && ctaUrl ? `
                <table cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #0EA5E9, #0284C7); border-radius: 8px;">
                      <a href="${ctaUrl}" style="display: inline-block; padding: 16px 32px; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 16px;">
                        ${ctaText}
                      </a>
                    </td>
                  </tr>
                </table>
              ` : ''}
              
              ${footerNote ? `
                <p style="color: #64748B; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #2D3B5F;">
                  ${footerNote}
                </p>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #0A0F2C; border-top: 1px solid #2D3B5F;">
              <p style="color: #64748B; font-size: 12px; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} SkyYield. All rights reserved.<br>
                <a href="https://skyyield.com" style="color: #0EA5E9; text-decoration: none;">skyyield.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// ============================================
// LOCATION PARTNER PIPELINE EMAILS
// ============================================

// Application Approved - Send Discovery Call Link
export async function sendApplicationApprovedEmail(partner: PartnerEmailData) {
  const name = partner.contactPreferredName || partner.contactFullName.split(' ')[0]
  const company = partner.companyDBA || partner.companyLegalName
  
  const calendlyUrl = generateCalendlyLink(
    CALENDLY_LINKS.locationPartner.introCall,
    {
      name: partner.contactFullName,
      email: partner.contactEmail,
      company,
    }
  )
  
  const html = generateEmailHTML({
    greeting: `Welcome to SkyYield, ${name}!`,
    bodyParagraphs: [
      `Great news! Your application to become a SkyYield Location Partner has been approved.`,
      `We're excited to learn more about ${company} and explore how we can help you monetize your WiFi infrastructure.`,
      `The next step is to schedule a quick discovery call where we'll discuss your venue details, answer any questions, and walk you through the onboarding process.`,
    ],
    ctaText: 'Schedule Discovery Call',
    ctaUrl: calendlyUrl,
    footerNote: `Can't make the available times? Reply to this email and we'll find a time that works for you.`,
  })
  
  return sendEmail({
    to: partner.contactEmail,
    subject: '🎉 Welcome to SkyYield - Schedule Your Discovery Call',
    html,
  })
}

// Application Denied
export async function sendApplicationDeniedEmail(partner: PartnerEmailData, reason?: string) {
  const name = partner.contactPreferredName || partner.contactFullName.split(' ')[0]
  
  const html = generateEmailHTML({
    greeting: `Hi ${name},`,
    bodyParagraphs: [
      `Thank you for your interest in becoming a SkyYield Location Partner.`,
      `After reviewing your application, we've determined that we're not able to move forward at this time.${reason ? ` ${reason}` : ''}`,
      `This decision is based on our current deployment priorities and coverage requirements. We encourage you to apply again in the future as our network expands.`,
      `If you have any questions, please don't hesitate to reach out.`,
    ],
    footerNote: `Best regards,<br>The SkyYield Team`,
  })
  
  return sendEmail({
    to: partner.contactEmail,
    subject: 'SkyYield Application Update',
    html,
  })
}

// Post-Discovery Approved - Send Venues Form Link
export async function sendPostCallApprovedEmail(partner: PartnerEmailData, venuesFormUrl: string) {
  const name = partner.contactPreferredName || partner.contactFullName.split(' ')[0]
  const company = partner.companyDBA || partner.companyLegalName
  
  const html = generateEmailHTML({
    greeting: `Great talking with you, ${name}!`,
    bodyParagraphs: [
      `We're excited to move forward with ${company} as a SkyYield Location Partner!`,
      `The next step is to submit your venue and device details. This helps us prepare your Letter of Intent (LOI) and plan the installation.`,
      `Please fill out the form below with information about each location where you'd like SkyYield equipment installed.`,
    ],
    ctaText: 'Submit Venue Details',
    ctaUrl: venuesFormUrl,
    footerNote: `Need help with the form? Schedule a quick call with our team: <a href="${CALENDLY_LINKS.locationPartner.introCall}" style="color: #0EA5E9;">Book Technical Assistance</a>`,
  })
  
  return sendEmail({
    to: partner.contactEmail,
    subject: '✅ Next Steps - Submit Your Venue Details',
    html,
  })
}

// LOI Signed - Send Install Scheduling Link
export async function sendLOISignedEmail(partner: PartnerEmailData) {
  const name = partner.contactPreferredName || partner.contactFullName.split(' ')[0]
  
  const calendlyUrl = generateCalendlyLink(
    CALENDLY_LINKS.locationPartner.installScheduling,
    {
      name: partner.contactFullName,
      email: partner.contactEmail,
      company: partner.companyDBA || partner.companyLegalName,
    }
  )
  
  const html = generateEmailHTML({
    greeting: `LOI Received - Let's Schedule Installation!`,
    bodyParagraphs: [
      `Hi ${name},`,
      `We've received your signed Letter of Intent. Thank you for officially joining the SkyYield network!`,
      `Now let's get your equipment installed. Click below to schedule your installation appointment. Our team will arrive with all the necessary equipment and have you up and running in no time.`,
    ],
    ctaText: 'Schedule Installation',
    ctaUrl: calendlyUrl,
    footerNote: `Equipment will be shipped to your venue before the installation date. You'll receive tracking information separately.`,
  })
  
  return sendEmail({
    to: partner.contactEmail,
    subject: '📦 LOI Signed - Schedule Your Installation',
    html,
  })
}

// Trial Started
export async function sendTrialStartedEmail(partner: PartnerEmailData, trialEndDate: string) {
  const name = partner.contactPreferredName || partner.contactFullName.split(' ')[0]
  const company = partner.companyDBA || partner.companyLegalName
  
  const html = generateEmailHTML({
    greeting: `Your Trial Has Begun! 🚀`,
    bodyParagraphs: [
      `Hi ${name},`,
      `Great news - ${company} is now live on the SkyYield network!`,
      `Your 60-day trial period has officially started. During this time, you'll be able to see real earnings from WiFi data offloading and experience the full benefits of our platform.`,
      `<strong>Trial End Date:</strong> ${new Date(trialEndDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      `You'll receive invitations to set up your payment account (Tipalti) and access the Partner Portal shortly.`,
    ],
    footerNote: `Questions about your trial? Reply to this email or visit your Partner Portal.`,
  })
  
  return sendEmail({
    to: partner.contactEmail,
    subject: '🚀 You\'re Live! Your SkyYield Trial Has Begun',
    html,
  })
}

// Trial Ending Soon (10 days remaining)
export async function sendTrialEndingEmail(partner: PartnerEmailData, daysRemaining: number) {
  const name = partner.contactPreferredName || partner.contactFullName.split(' ')[0]
  
  const calendlyUrl = generateCalendlyLink(
    CALENDLY_LINKS.locationPartner.negotiateLOI,
    {
      name: partner.contactFullName,
      email: partner.contactEmail,
      company: partner.companyDBA || partner.companyLegalName,
    }
  )
  
  const html = generateEmailHTML({
    greeting: `Your Trial Ends in ${daysRemaining} Days`,
    bodyParagraphs: [
      `Hi ${name},`,
      `Your SkyYield trial period is coming to an end soon. We hope you've seen great results from the WiFi data offloading!`,
      `Let's schedule a quick call to review your earnings, discuss the deployment contract, and answer any questions you have about continuing as a full SkyYield partner.`,
    ],
    ctaText: 'Schedule Review Call',
    ctaUrl: calendlyUrl,
    footerNote: `Not ready to continue? Let us know and we'll arrange equipment retrieval.`,
  })
  
  return sendEmail({
    to: partner.contactEmail,
    subject: `⏰ ${daysRemaining} Days Left - Let's Review Your Trial`,
    html,
  })
}

// Contract Ready
export async function sendContractReadyEmail(partner: PartnerEmailData, pandadocUrl: string) {
  const name = partner.contactPreferredName || partner.contactFullName.split(' ')[0]
  const company = partner.companyDBA || partner.companyLegalName
  
  const html = generateEmailHTML({
    greeting: `Your Deployment Contract is Ready!`,
    bodyParagraphs: [
      `Hi ${name},`,
      `Congratulations on a successful trial! We're thrilled to continue the partnership with ${company}.`,
      `Your Deployment Contract is ready for signature. Please review the terms and sign when ready to become an official SkyYield Location Partner.`,
    ],
    ctaText: 'Review & Sign Contract',
    ctaUrl: pandadocUrl,
    footerNote: `Have questions about the contract? Reply to this email or call us at (555) 123-4567.`,
  })
  
  return sendEmail({
    to: partner.contactEmail,
    subject: '📝 Your SkyYield Deployment Contract is Ready',
    html,
  })
}

// Welcome to Active Partnership
export async function sendActivePartnerWelcomeEmail(partner: PartnerEmailData, portalUrl: string) {
  const name = partner.contactPreferredName || partner.contactFullName.split(' ')[0]
  const company = partner.companyDBA || partner.companyLegalName
  
  const html = generateEmailHTML({
    greeting: `Welcome to the SkyYield Family! 🎉`,
    bodyParagraphs: [
      `Hi ${name},`,
      `It's official - ${company} is now a full SkyYield Location Partner!`,
      `Thank you for your trust in us. We're committed to helping you maximize your WiFi infrastructure revenue. Here's what you can expect:`,
      `<ul style="color: #94A3B8; margin: 16px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Monthly payouts via Tipalti</li>
        <li style="margin-bottom: 8px;">Real-time earnings in your Partner Portal</li>
        <li style="margin-bottom: 8px;">24/7 network monitoring and support</li>
        <li style="margin-bottom: 8px;">Dedicated partner success manager</li>
      </ul>`,
    ],
    ctaText: 'Access Partner Portal',
    ctaUrl: portalUrl,
    footerNote: `Your partner success manager will reach out within 48 hours to introduce themselves.`,
  })
  
  return sendEmail({
    to: partner.contactEmail,
    subject: '🎉 Welcome to SkyYield - You\'re Officially a Partner!',
    html,
  })
}

// Tipalti Invitation
export async function sendTipaltiInviteEmail(partner: PartnerEmailData, tipaltiUrl: string) {
  const name = partner.contactPreferredName || partner.contactFullName.split(' ')[0]
  
  const html = generateEmailHTML({
    greeting: `Set Up Your Payment Account`,
    bodyParagraphs: [
      `Hi ${name},`,
      `To receive your SkyYield earnings, please set up your payment account through Tipalti, our secure payment partner.`,
      `This only takes a few minutes and ensures you get paid on time every month.`,
    ],
    ctaText: 'Set Up Payments',
    ctaUrl: tipaltiUrl,
    footerNote: `Tipalti supports direct deposit, PayPal, and wire transfers. Choose the method that works best for you.`,
  })
  
  return sendEmail({
    to: partner.contactEmail,
    subject: '💰 Set Up Your Payment Account - Get Paid for WiFi',
    html,
  })
}

// Portal Invitation
export async function sendPortalInviteEmail(partner: PartnerEmailData, inviteUrl: string) {
  const name = partner.contactPreferredName || partner.contactFullName.split(' ')[0]
  
  const html = generateEmailHTML({
    greeting: `Access Your Partner Portal`,
    bodyParagraphs: [
      `Hi ${name},`,
      `Your SkyYield Partner Portal is ready! Here you can:`,
      `<ul style="color: #94A3B8; margin: 16px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">View real-time earnings and data usage</li>
        <li style="margin-bottom: 8px;">Monitor device status across all venues</li>
        <li style="margin-bottom: 8px;">Download monthly statements</li>
        <li style="margin-bottom: 8px;">Contact support</li>
      </ul>`,
    ],
    ctaText: 'Activate Portal Access',
    ctaUrl: inviteUrl,
    footerNote: `Bookmark this link for easy access: <a href="https://skyyield.com/portal" style="color: #0EA5E9;">skyyield.com/portal</a>`,
  })
  
  return sendEmail({
    to: partner.contactEmail,
    subject: '🔐 Your SkyYield Partner Portal is Ready',
    html,
  })
}

// Export all email functions
export const PipelineEmails = {
  sendApplicationApprovedEmail,
  sendApplicationDeniedEmail,
  sendPostCallApprovedEmail,
  sendLOISignedEmail,
  sendTrialStartedEmail,
  sendTrialEndingEmail,
  sendContractReadyEmail,
  sendActivePartnerWelcomeEmail,
  sendTipaltiInviteEmail,
  sendPortalInviteEmail,
}