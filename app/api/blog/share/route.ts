import { NextRequest, NextResponse } from "next/server"

// This uses a generic email sending approach
// In production, you'd use SendGrid, Resend, AWS SES, or similar
export async function POST(request: NextRequest) {
  try {
    const { to, postTitle, postSummary, postUrl, postImage, message } = await request.json()

    if (!to || !postTitle || !postUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    // Build the branded HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${postTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0F2C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #1A1F3A 0%, #0A0F2C 100%); border-radius: 16px 16px 0 0; border: 1px solid #2D3B5F; border-bottom: none;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td>
                    <div style="display: inline-block; padding: 8px 12px; background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%); border-radius: 8px; margin-bottom: 16px;">
                      <span style="color: #FFFFFF; font-weight: bold; font-size: 18px;">SkyYield</span>
                    </div>
                    <p style="color: #94A3B8; font-size: 14px; margin: 0;">
                      Someone thought you'd enjoy this article
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Personal Message (if provided) -->
          ${message ? `
          <tr>
            <td style="padding: 24px 32px; background-color: #1A1F3A; border-left: 1px solid #2D3B5F; border-right: 1px solid #2D3B5F;">
              <div style="padding: 20px; background-color: rgba(14, 165, 233, 0.1); border-radius: 12px; border-left: 4px solid #0EA5E9;">
                <p style="color: #CBD5E1; font-size: 15px; line-height: 1.6; margin: 0; font-style: italic;">
                  "${message}"
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Article Card -->
          <tr>
            <td style="padding: 32px; background-color: #1A1F3A; border-left: 1px solid #2D3B5F; border-right: 1px solid #2D3B5F;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td>
                    <!-- Article Image -->
                    ${postImage ? `
                    <img src="${postImage}" alt="${postTitle}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 24px;">
                    ` : ''}
                    
                    <!-- Article Title -->
                    <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; line-height: 1.3; margin: 0 0 16px 0;">
                      ${postTitle}
                    </h1>
                    
                    <!-- Article Summary -->
                    <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      ${postSummary}
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td>
                          <a href="${postUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%); color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                            Read Full Article →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; background-color: #0A0F2C; border-radius: 0 0 16px 16px; border: 1px solid #2D3B5F; border-top: none;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="color: #64748B; font-size: 14px; margin: 0 0 16px 0;">
                      Power the people's network. Deploy 6G hotspots and earn USD rewards.
                    </p>
                    <table role="presentation">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="https://skyyield.io" style="color: #0EA5E9; text-decoration: none; font-size: 14px;">Website</a>
                        </td>
                        <td style="color: #2D3B5F;">|</td>
                        <td style="padding: 0 8px;">
                          <a href="https://skyyield.io/blog" style="color: #0EA5E9; text-decoration: none; font-size: 14px;">Blog</a>
                        </td>
                        <td style="color: #2D3B5F;">|</td>
                        <td style="padding: 0 8px;">
                          <a href="https://skyyield.io/store" style="color: #0EA5E9; text-decoration: none; font-size: 14px;">Store</a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #475569; font-size: 12px; margin: 24px 0 0 0;">
                      © ${new Date().getFullYear()} SkyYield. All rights reserved.<br>
                      Atlanta, GA | info@skyyield.io
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Plain text fallback
    const textContent = `
${message ? `Personal message: "${message}"\n\n` : ''}
${postTitle}

${postSummary}

Read the full article: ${postUrl}

---
SkyYield - Power the people's network
https://skyyield.io
    `.trim()

    // In production, send via your email provider
    // Example with SendGrid:
    // 
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    // await sgMail.send({
    //   to,
    //   from: 'blog@skyyield.io',
    //   subject: `SkyYield: ${postTitle}`,
    //   text: textContent,
    //   html: htmlContent,
    // })

    // Example with Resend:
    //
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'SkyYield Blog <blog@skyyield.io>',
    //   to,
    //   subject: `SkyYield: ${postTitle}`,
    //   html: htmlContent,
    //   text: textContent,
    // })

    // For now, check if we have an email provider configured
    if (process.env.RESEND_API_KEY) {
      // Using Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SkyYield Blog <blog@skyyield.io>',
          to: [to],
          subject: `SkyYield: ${postTitle}`,
          html: htmlContent,
          text: textContent,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Resend error:', error)
        throw new Error('Failed to send email')
      }

      return NextResponse.json({ success: true, message: "Email sent successfully" })
    } else if (process.env.SENDGRID_API_KEY) {
      // Using SendGrid
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: 'blog@skyyield.io', name: 'SkyYield Blog' },
          subject: `SkyYield: ${postTitle}`,
          content: [
            { type: 'text/plain', value: textContent },
            { type: 'text/html', value: htmlContent },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }

      return NextResponse.json({ success: true, message: "Email sent successfully" })
    } else {
      // No email provider configured - log for development
      console.log('=== BLOG SHARE EMAIL (No provider configured) ===')
      console.log('To:', to)
      console.log('Subject:', `SkyYield: ${postTitle}`)
      console.log('Message:', message || '(none)')
      console.log('URL:', postUrl)
      console.log('===============================================')
      
      // Return success for development/testing
      return NextResponse.json({ 
        success: true, 
        message: "Email logged (no provider configured)",
        dev: true 
      })
    }
  } catch (error) {
    console.error("Error sending share email:", error)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}