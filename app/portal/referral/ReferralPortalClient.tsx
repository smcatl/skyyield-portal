// app/portal/referral/ReferralPortalClient.tsx
'use client'

import { useState } from 'react'
import { 
  Users, Link2, DollarSign, FileText, Settings, 
  Bell, CreditCard, ChevronRight, Copy, Check, 
  Share2, CheckCircle, Clock, AlertCircle, Send, 
  Download, BarChart3, Target, ExternalLink
} from 'lucide-react'

interface PortalData {
  partner: {
    id: string
    partner_id: string
    company_name?: string
    contact_name: string
    contact_email: string
    contact_phone?: string
    pipeline_stage: string
    referral_code?: string
    referral_tracking_url: string
    commission_type?: string
    commission_per_referral?: number
    commission_percentage?: number
    commission_flat_fee?: number
    agreement_status?: string
    agreement_signed_at?: string
    nda_status?: string
    nda_signed_at?: string
    tipalti_payee_id?: string
    tipalti_status?: string
    total_referrals: number
    active_referrals: number
    total_earned: number
  }
  stats: {
    totalReferrals: number
    activeReferrals: number
    pendingReferrals: number
    conversionRate: number
    totalEarnings: number
    pendingEarnings: number
    commissionPerReferral: number
  }
  referrals: Array<{
    id: string
    partner_id: string
    company_name: string
    contact_name: string
    contact_email: string
    status: string
    created_at: string
    is_active: boolean
  }>
  commissions: Array<{
    id: string
    commission_month: string
    amount: number
    status: string
    paid_at?: string
  }>
  payments: Array<any>
}

export default function ReferralPortalClient({ data }: { data: PortalData }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'earnings' | 'documents' | 'settings'>('overview')
  const [copied, setCopied] = useState(false)
  const { partner, stats, referrals, commissions } = data

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const

  const copyReferralLink = () => {
    navigator.clipboard.writeText(partner.referral_tracking_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      trial: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      application: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      discovery: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      signed: 'bg-emerald-500/20 text-emerald-400',
      sent: 'bg-blue-500/20 text-blue-400',
      not_sent: 'bg-gray-500/20 text-gray-400',
      payable: 'bg-emerald-500/20 text-emerald-400',
      paid: 'bg-emerald-500/20 text-emerald-400',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-[#0A0F2C]">
      {/* Header */}
      <header className="bg-[#0F1629] border-b border-[#2D3B5F] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#10F981] to-[#0EA5E9] rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{partner.company_name || partner.contact_name}</h1>
              <p className="text-[#64748B] text-sm">Referral Partner • <span className="text-[#10F981] font-mono">{partner.partner_id}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm text-[#64748B]">Welcome back,</p>
              <p className="text-white font-medium">{partner.contact_name}</p>
            </div>
            <button className="p-2 text-[#64748B] hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-73px)] bg-[#0F1629] border-r border-[#2D3B5F] p-4 hidden lg:block">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#10F981]/10 text-[#10F981] border border-[#10F981]/30'
                      : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Tab Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0F1629] border-t border-[#2D3B5F] px-2 py-2 z-50">
          <div className="flex justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${activeTab === tab.id ? 'text-[#10F981]' : 'text-[#64748B]'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-24 lg:pb-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Referral Link Card */}
              <div className="bg-gradient-to-r from-[#10F981]/20 to-[#0EA5E9]/20 rounded-xl p-6 border border-[#10F981]/30">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Your Referral Link</h2>
                    <p className="text-[#94A3B8] text-sm">Share this link to earn commissions</p>
                  </div>
                  {stats.commissionPerReferral > 0 && (
                    <span className="px-3 py-1 bg-[#10F981]/20 text-[#10F981] rounded-full text-sm font-medium">
                      {formatCurrency(stats.commissionPerReferral)} per referral
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 bg-[#0A0F2C] rounded-lg p-3">
                  <Link2 className="w-5 h-5 text-[#64748B] flex-shrink-0" />
                  <input type="text" value={partner.referral_tracking_url} readOnly className="flex-1 bg-transparent text-white text-sm outline-none" />
                  <button onClick={copyReferralLink} className="flex items-center gap-2 px-3 py-1.5 bg-[#10F981] text-black rounded-lg text-sm font-medium hover:bg-[#10F981]/80 transition-colors">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {partner.referral_code && (
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-[#64748B] text-sm">Code: <span className="text-[#10F981] font-mono font-bold">{partner.referral_code}</span></span>
                    <button className="flex items-center gap-1 text-[#0EA5E9] text-sm hover:underline">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Total Referrals</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalReferrals}</p>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Active Partners</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.activeReferrals}</p>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Total Earned</p>
                  <p className="text-3xl font-bold text-[#10F981] mt-1">{formatCurrency(stats.totalEarnings)}</p>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Conversion Rate</p>
                  <p className="text-3xl font-bold text-[#0EA5E9] mt-1">{stats.conversionRate}%</p>
                </div>
              </div>

              {/* Recent Referrals & Payment Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F]">
                  <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Recent Referrals</h3>
                    <button onClick={() => setActiveTab('referrals')} className="text-[#10F981] text-sm hover:underline">View All</button>
                  </div>
                  <div className="divide-y divide-[#2D3B5F]">
                    {referrals.length === 0 ? (
                      <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-[#2D3B5F] mx-auto mb-3" />
                        <p className="text-[#64748B]">No referrals yet</p>
                      </div>
                    ) : (
                      referrals.slice(0, 4).map(ref => (
                        <div key={ref.id} className="p-4 hover:bg-[#0A0F2C]/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{ref.company_name}</p>
                              <p className="text-[#64748B] text-sm">{ref.contact_name}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ref.status)}`}>{ref.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Payment Setup</h3>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${partner.tipalti_status === 'payable' ? 'bg-emerald-500/20' : 'bg-yellow-500/20'}`}>
                      <CreditCard className={`w-6 h-6 ${partner.tipalti_status === 'payable' ? 'text-emerald-400' : 'text-yellow-400'}`} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{partner.tipalti_status === 'payable' ? 'Ready to receive payments' : 'Setup required'}</p>
                      <p className="text-[#64748B] text-sm">{partner.tipalti_status === 'payable' ? 'Your payment method is verified' : 'Complete setup to receive earnings'}</p>
                    </div>
                  </div>
                  {partner.tipalti_status !== 'payable' && (
                    <button className="mt-4 w-full px-4 py-2 bg-[#10F981] text-black rounded-lg font-medium hover:bg-[#10F981]/80 transition-colors">Complete Payment Setup</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Your Referrals</h2>
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F]">
                {referrals.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-16 h-16 text-[#2D3B5F] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No referrals yet</h3>
                    <p className="text-[#64748B] mb-4">Share your referral link to start earning</p>
                    <button onClick={copyReferralLink} className="px-4 py-2 bg-[#10F981] text-black rounded-lg font-medium">Copy Referral Link</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#2D3B5F]">
                          <th className="text-left p-4 text-[#64748B] text-sm font-medium">Company</th>
                          <th className="text-left p-4 text-[#64748B] text-sm font-medium">Contact</th>
                          <th className="text-left p-4 text-[#64748B] text-sm font-medium">Status</th>
                          <th className="text-left p-4 text-[#64748B] text-sm font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map(ref => (
                          <tr key={ref.id} className="border-b border-[#2D3B5F] last:border-0">
                            <td className="p-4">
                              <p className="text-white font-medium">{ref.company_name}</p>
                              <p className="text-[#64748B] text-sm">{ref.partner_id}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-white">{ref.contact_name}</p>
                              <p className="text-[#64748B] text-sm">{ref.contact_email}</p>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ref.status)}`}>{ref.status}</span>
                            </td>
                            <td className="p-4 text-[#94A3B8]">{formatDate(ref.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Earnings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Total Earned</p>
                  <p className="text-3xl font-bold text-[#10F981] mt-1">{formatCurrency(stats.totalEarnings)}</p>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Pending</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-1">{formatCurrency(stats.pendingEarnings)}</p>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Per Referral</p>
                  <p className="text-3xl font-bold text-[#0EA5E9] mt-1">{formatCurrency(stats.commissionPerReferral)}</p>
                </div>
              </div>

              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F]">
                <div className="p-4 border-b border-[#2D3B5F]">
                  <h3 className="text-lg font-semibold text-white">Commission History</h3>
                </div>
                {commissions.length === 0 ? (
                  <div className="p-8 text-center text-[#64748B]">No commission history yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#2D3B5F]">
                          <th className="text-left p-4 text-[#64748B] text-sm font-medium">Period</th>
                          <th className="text-left p-4 text-[#64748B] text-sm font-medium">Amount</th>
                          <th className="text-left p-4 text-[#64748B] text-sm font-medium">Status</th>
                          <th className="text-left p-4 text-[#64748B] text-sm font-medium">Paid Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map(c => (
                          <tr key={c.id} className="border-b border-[#2D3B5F] last:border-0">
                            <td className="p-4 text-white">{new Date(c.commission_month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</td>
                            <td className="p-4 text-[#10F981] font-medium">{formatCurrency(c.amount)}</td>
                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(c.status)}`}>{c.status}</span></td>
                            <td className="p-4 text-[#94A3B8]">{c.paid_at ? formatDate(c.paid_at) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Documents</h2>
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] divide-y divide-[#2D3B5F]">
                <DocumentRow name="Referral Partner Agreement" description="Partnership terms and commission structure" status={partner.agreement_status || 'not_sent'} signedAt={partner.agreement_signed_at} />
                {partner.nda_status && <DocumentRow name="Non-Disclosure Agreement" description="Confidentiality agreement" status={partner.nda_status} signedAt={partner.nda_signed_at} />}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-[#64748B] text-sm">Name</label><p className="text-white mt-1">{partner.contact_name}</p></div>
                  {partner.company_name && <div><label className="text-[#64748B] text-sm">Company</label><p className="text-white mt-1">{partner.company_name}</p></div>}
                  <div><label className="text-[#64748B] text-sm">Email</label><p className="text-white mt-1">{partner.contact_email}</p></div>
                  {partner.contact_phone && <div><label className="text-[#64748B] text-sm">Phone</label><p className="text-white mt-1">{partner.contact_phone}</p></div>}
                  <div><label className="text-[#64748B] text-sm">Partner ID</label><p className="text-[#10F981] font-mono mt-1">{partner.partner_id}</p></div>
                  {partner.referral_code && <div><label className="text-[#64748B] text-sm">Referral Code</label><p className="text-[#10F981] font-mono mt-1">{partner.referral_code}</p></div>}
                </div>
              </div>
              {partner.commission_type && (
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Commission Structure</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-[#64748B] text-sm">Type</label><p className="text-white mt-1 capitalize">{partner.commission_type?.replace(/_/g, ' ')}</p></div>
                    {partner.commission_per_referral && <div><label className="text-[#64748B] text-sm">Per Referral</label><p className="text-white mt-1">{formatCurrency(partner.commission_per_referral)}</p></div>}
                    {partner.commission_percentage && <div><label className="text-[#64748B] text-sm">Percentage</label><p className="text-white mt-1">{partner.commission_percentage}%</p></div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function DocumentRow({ name, description, status, signedAt }: { name: string; description: string; status: string; signedAt?: string }) {
  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    signed: { color: 'text-emerald-400', icon: CheckCircle, label: 'Signed' },
    sent: { color: 'text-blue-400', icon: Send, label: 'Awaiting Signature' },
    not_sent: { color: 'text-gray-400', icon: Clock, label: 'Not Sent' },
  }
  const config = statusConfig[status] || statusConfig.not_sent
  const Icon = config.icon

  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#0A0F2C] rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#10F981]" />
        </div>
        <div>
          <p className="text-white font-medium">{name}</p>
          <p className="text-[#64748B] text-sm">{description}</p>
          {signedAt && <p className="text-[#64748B] text-xs mt-1">Signed on {new Date(signedAt).toLocaleDateString()}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 ${config.color}`}>
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        {status === 'signed' && (
          <button className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg transition-colors">
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
