'use client'

import { Mail, Calendar, MessageSquare, ExternalLink } from 'lucide-react'

interface ContactCardProps {
  title?: string
  calendlyUrl?: string
  supportEmail?: string
  showTicket?: boolean
}

export default function ContactCard({
  title = 'Need Help?',
  calendlyUrl = 'https://calendly.com/skyyield',
  supportEmail = 'support@skyyield.io',
  showTicket = true,
}: ContactCardProps) {
  return (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      
      <div className="space-y-3">
        {/* Schedule a Call - Calendly */}
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F] transition-colors group"
        >
          <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#0EA5E9]" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium">Schedule a Call</div>
            <div className="text-[#64748B] text-sm">Book time with our team</div>
          </div>
          <ExternalLink className="w-4 h-4 text-[#64748B] group-hover:text-white" />
        </a>

        {/* Submit a Ticket */}
        {showTicket && (
          <a
            href={`mailto:${supportEmail}?subject=Support Request`}
            className="flex items-center gap-3 p-3 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F] transition-colors"
          >
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">Submit a Ticket</div>
              <div className="text-[#64748B] text-sm">Get help via email</div>
            </div>
          </a>
        )}

        {/* Email Button Only - No Call Button */}
        <div className="pt-2">
          <a
            href={`mailto:${supportEmail}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-[#94A3B8] hover:text-white hover:border-[#0EA5E9] transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
        </div>
      </div>
    </div>
  )
}
