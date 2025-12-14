'use client'

import { useState } from 'react'
import { Copy, Mail, MessageSquare, Share2, Check, QrCode, Link } from 'lucide-react'

interface ReferralCodeCardProps {
  referralCode: string
  referralLink?: string
  totalReferrals?: number
  pendingReferrals?: number
  earnedFromReferrals?: number
  showStats?: boolean
}

export default function ReferralCodeCard({
  referralCode,
  referralLink,
  totalReferrals = 0,
  pendingReferrals = 0,
  earnedFromReferrals = 0,
  showStats = true,
}: ReferralCodeCardProps) {
  const [copied, setCopied] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePhone, setSharePhone] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<'email' | 'sms' | null>(null)

  const fullReferralLink = referralLink || `https://skyyield.io/apply/location-partner?ref=${referralCode}`

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(fullReferralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendEmail = async () => {
    if (!shareEmail.trim()) return
    setSending(true)
    try {
      // Open email client with pre-filled content
      const subject = encodeURIComponent('Partner with SkyYield - Earn Passive Income')
      const body = encodeURIComponent(
        `Hi!\n\nI wanted to share an opportunity with you. SkyYield offers a way to earn passive income by hosting WiFi infrastructure at your venue.\n\nUse my referral code: ${referralCode}\n\nOr sign up directly here: ${fullReferralLink}\n\nLet me know if you have any questions!`
      )
      window.open(`mailto:${shareEmail}?subject=${subject}&body=${body}`)
      setSent('email')
      setShareEmail('')
      setTimeout(() => setSent(null), 3000)
    } catch (err) {
      console.error('Error sending email:', err)
    } finally {
      setSending(false)
    }
  }

  const sendSMS = async () => {
    if (!sharePhone.trim()) return
    setSending(true)
    try {
      // Open SMS with pre-filled content
      const message = encodeURIComponent(
        `Check out SkyYield - earn passive income from WiFi! Use my code: ${referralCode} or sign up: ${fullReferralLink}`
      )
      window.open(`sms:${sharePhone}?body=${message}`)
      setSent('sms')
      setSharePhone('')
      setTimeout(() => setSent(null), 3000)
    } catch (err) {
      console.error('Error sending SMS:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Your Referral Code</h3>
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#0EA5E9] text-white rounded-lg text-sm hover:bg-[#0EA5E9]/80 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Referral Code Display */}
      <div className="bg-[#0A0F2C] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[#64748B] text-xs uppercase tracking-wide mb-1">Code</div>
            <div className="text-2xl font-mono font-bold text-[#0EA5E9]">{referralCode}</div>
          </div>
          <button
            onClick={copyCode}
            className="p-3 bg-[#1A1F3A] rounded-lg hover:bg-[#2D3B5F] transition-colors"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <Copy className="w-5 h-5 text-[#94A3B8]" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Share Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-[#0A0F2C] rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#2D3B5F] transition-colors"
        >
          <Link className="w-4 h-4" />
          <span className="text-sm">Copy Link</span>
        </button>
        <button
          onClick={() => setShowShareModal(true)}
          className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-[#0A0F2C] rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#2D3B5F] transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span className="text-sm">Email</span>
        </button>
        <button
          onClick={() => setShowShareModal(true)}
          className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-[#0A0F2C] rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#2D3B5F] transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">SMS</span>
        </button>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0A0F2C] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{totalReferrals}</div>
            <div className="text-[#64748B] text-xs">Total</div>
          </div>
          <div className="bg-[#0A0F2C] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-yellow-400">{pendingReferrals}</div>
            <div className="text-[#64748B] text-xs">Pending</div>
          </div>
          <div className="bg-[#0A0F2C] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-400">${earnedFromReferrals.toLocaleString()}</div>
            <div className="text-[#64748B] text-xs">Earned</div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-[#2D3B5F]">
              <h3 className="text-lg font-semibold text-white">Share Your Referral</h3>
              <p className="text-[#64748B] text-sm">Send your code to potential partners</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Email Share */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Send via Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                  <button
                    onClick={sendEmail}
                    disabled={!shareEmail.trim() || sending}
                    className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors disabled:opacity-50"
                  >
                    {sent === 'email' ? <Check className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* SMS Share */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Send via SMS</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={sharePhone}
                    onChange={(e) => setSharePhone(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                  <button
                    onClick={sendSMS}
                    disabled={!sharePhone.trim() || sending}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {sent === 'sms' ? <Check className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Link Display */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Referral Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fullReferralLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-[#94A3B8] text-sm"
                  />
                  <button
                    onClick={copyLink}
                    className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#2D3B5F]">
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
