'use client'

import { useState } from 'react'
import { Calendar, MessageSquare, Send, Mail, ExternalLink } from 'lucide-react'

interface ContactCardProps {
  calendlyUrl?: string
  supportEmail?: string
  showTicketForm?: boolean  // Keep for backward compatibility
  showTicket?: boolean      // New prop name
  userName?: string
  userEmail?: string
  title?: string
}

export default function ContactCard({
  calendlyUrl = 'https://calendly.com/scohen-skyyield',
  supportEmail = 'support@skyyield.io',
  showTicketForm = true,  // Default true for backward compatibility
  showTicket,             // Can override showTicketForm
  userName = '',
  userEmail = '',
  title = 'Need Help?',
}: ContactCardProps) {
  // Support both prop names - showTicket takes precedence if provided
  const shouldShowTicket = showTicket !== undefined ? showTicket : showTicketForm
  
  const [showTicketPanel, setShowTicketPanel] = useState(false)
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submitTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) return
    
    setSubmitting(true)
    try {
      // Send via mailto for now - can connect to actual ticket API later
      const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(ticketSubject)}&body=${encodeURIComponent(ticketMessage)}`
      window.open(mailtoUrl, '_blank')
      
      setSubmitted(true)
      setTicketSubject('')
      setTicketMessage('')
      setTimeout(() => {
        setSubmitted(false)
        setShowTicketPanel(false)
      }, 2000)
    } catch (err) {
      console.error('Error submitting ticket:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      
      <div className="space-y-3">
        {/* Schedule Call - Calendly */}
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-[#0A0F2C] rounded-lg hover:bg-[#0EA5E9]/10 transition-colors group"
        >
          <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#0EA5E9]" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium group-hover:text-[#0EA5E9] transition-colors">
              Schedule a Call
            </div>
            <div className="text-[#64748B] text-sm">Book time with our team</div>
          </div>
          <ExternalLink className="w-4 h-4 text-[#64748B] group-hover:text-[#0EA5E9]" />
        </a>

        {/* Submit Ticket */}
        {shouldShowTicket && (
          <button
            onClick={() => setShowTicketPanel(!showTicketPanel)}
            className="w-full flex items-center gap-3 p-3 bg-[#0A0F2C] rounded-lg hover:bg-[#0EA5E9]/10 transition-colors group text-left"
          >
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium group-hover:text-purple-400 transition-colors">
                Submit a Ticket
              </div>
              <div className="text-[#64748B] text-sm">Get help via email</div>
            </div>
          </button>
        )}

        {/* Ticket Form */}
        {showTicketPanel && (
          <div className="bg-[#0A0F2C] rounded-lg p-4 space-y-3 border border-[#2D3B5F]">
            {submitted ? (
              <div className="text-center py-4">
                <div className="text-green-400 font-medium">✓ Ticket Submitted!</div>
                <div className="text-[#64748B] text-sm mt-1">We will get back to you soon.</div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Subject"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                />
                <textarea
                  placeholder="How can we help?"
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] resize-none"
                />
                <button
                  onClick={submitTicket}
                  disabled={submitting || !ticketSubject.trim() || !ticketMessage.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Sending...' : 'Send Ticket'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Email Only - No Call Button */}
        <div className="pt-2">
          <a
            href={\`mailto:\${supportEmail}\`}
            className="flex items-center justify-center gap-2 w-full p-2 bg-[#0A0F2C] rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#2D3B5F] transition-colors text-sm"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
        </div>
      </div>
    </div>
  )
}
