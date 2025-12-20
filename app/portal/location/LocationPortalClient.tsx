// app/portal/location/LocationPortalClient.tsx
'use client'

import { useState } from 'react'
import { 
  Building2, MapPin, Cpu, DollarSign, FileText, Settings, 
  TrendingUp, Calendar, Bell, CreditCard, ChevronRight, 
  Wifi, Activity, Clock, CheckCircle, AlertCircle, Send,
  Download, ExternalLink, Plus, BarChart3, Users
} from 'lucide-react'

interface PortalData {
  partner: {
    id: string
    partner_id: string
    company_legal_name: string
    dba_name?: string
    contact_first_name: string
    contact_last_name: string
    contact_email: string
    contact_phone?: string
    stage: string
    loi_status?: string
    loi_signed_at?: string
    deployment_status?: string
    deployment_signed_at?: string
    contract_status?: string
    contract_signed_at?: string
    nda_status?: string
    nda_signed_at?: string
    trial_status?: string
    trial_start_date?: string
    trial_end_date?: string
    trial_days_remaining?: number
    tipalti_payee_id?: string
    tipalti_status?: string
    commission_type?: string
    commission_percentage?: number
    commission_flat_fee?: number
    last_payment_amount?: number
    last_payment_date?: string
  }
  stats: {
    totalVenues: number
    activeVenues: number
    trialVenues: number
    totalDevices: number
    activeDevices: number
    totalEarnings: number
    totalDataGB: number
    nextPaymentAmount: number
    lastPaymentAmount?: number
    lastPaymentDate?: string
  }
  venues: Array<{
    id: string
    venue_id: string
    name: string
    address?: string
    city?: string
    state?: string
    type?: string
    status: string
    devicesInstalled: number
    activeDevices: number
    dataUsageGB: number
    monthlyEarnings: number
    trialStartDate?: string
    trialEndDate?: string
    trialDaysRemaining?: number | null
    installDate?: string
    created_at: string
  }>
  commissions: Array<{
    id: string
    commission_month: string
    amount: number
    status: string
    paid_at?: string
  }>
  payments: Array<{
    id: string
    amount: number
    payment_date: string
    status: string
  }>
}

interface LocationPortalClientProps {
  data: PortalData
}

export default function LocationPortalClient({ data }: LocationPortalClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'venues' | 'devices' | 'payments' | 'documents' | 'settings'>('overview')
  const { partner, stats, venues, commissions, payments } = data

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'devices', label: 'Devices', icon: Cpu },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      trial: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      signed: 'bg-emerald-500/20 text-emerald-400',
      sent: 'bg-blue-500/20 text-blue-400',
      viewed: 'bg-purple-500/20 text-purple-400',
      not_sent: 'bg-gray-500/20 text-gray-400',
      payable: 'bg-emerald-500/20 text-emerald-400',
      completed: 'bg-emerald-500/20 text-emerald-400',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      application: 'Application',
      discovery: 'Discovery Call',
      loi: 'Letter of Intent',
      trial: 'Trial Period',
      contract: 'Contract',
      active: 'Active',
    }
    return labels[stage] || stage
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-[#0A0F2C]">
      {/* Header */}
      <header className="bg-[#0F1629] border-b border-[#2D3B5F] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0EA5E9] to-[#10F981] rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {partner.dba_name || partner.company_legal_name}
              </h1>
              <p className="text-[#64748B] text-sm">
                Partner ID: <span className="text-[#0EA5E9] font-mono">{partner.partner_id}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm text-[#64748B]">Welcome back,</p>
              <p className="text-white font-medium">
                {partner.contact_first_name} {partner.contact_last_name}
              </p>
            </div>
            <button className="p-2 text-[#64748B] hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors relative">
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
                      ? 'bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/30'
                      : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          {/* Stage Progress */}
          <div className="mt-8 p-4 bg-[#0A0F2C] rounded-xl">
            <h4 className="text-sm font-medium text-[#64748B] mb-3">Onboarding Progress</h4>
            <div className="space-y-2">
              {['application', 'discovery', 'loi', 'trial', 'contract', 'active'].map((stage, i) => {
                const stages = ['application', 'discovery', 'loi', 'trial', 'contract', 'active']
                const currentIndex = stages.indexOf(partner.stage)
                const isComplete = i < currentIndex
                const isCurrent = i === currentIndex
                
                return (
                  <div key={stage} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isComplete ? 'bg-emerald-500 text-white' : 
                      isCurrent ? 'bg-[#0EA5E9] text-white' : 
                      'bg-[#2D3B5F] text-[#64748B]'
                    }`}>
                      {isComplete ? '✓' : i + 1}
                    </div>
                    <span className={`text-sm ${isCurrent ? 'text-[#0EA5E9] font-medium' : 'text-[#64748B]'}`}>
                      {getStageLabel(stage)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Mobile Tab Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0F1629] border-t border-[#2D3B5F] px-2 py-2 z-50">
          <div className="flex justify-around">
            {tabs.slice(0, 5).map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                    activeTab === tab.id ? 'text-[#0EA5E9]' : 'text-[#64748B]'
                  }`}
                >
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
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-[#0EA5E9]/20 to-[#10F981]/20 rounded-xl p-6 border border-[#0EA5E9]/30">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome, {partner.contact_first_name}!
                </h2>
                <p className="text-[#94A3B8]">
                  Here&apos;s an overview of your SkyYield partnership.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(partner.stage)}`}>
                    {getStageLabel(partner.stage)}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm">Active Venues</p>
                      <p className="text-3xl font-bold text-white mt-1">{stats.activeVenues}</p>
                      {stats.trialVenues > 0 && (
                        <p className="text-xs text-blue-400 mt-1">+{stats.trialVenues} in trial</p>
                      )}
                    </div>
                    <MapPin className="w-10 h-10 text-[#0EA5E9]/30" />
                  </div>
                </div>
                
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm">Total Earnings</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {formatCurrency(stats.totalEarnings)}
                      </p>
                      {stats.lastPaymentDate && (
                        <p className="text-xs text-[#64748B] mt-1">
                          Last: {formatDate(stats.lastPaymentDate)}
                        </p>
                      )}
                    </div>
                    <DollarSign className="w-10 h-10 text-emerald-400/30" />
                  </div>
                </div>
                
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm">Data Offloaded</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {stats.totalDataGB.toFixed(1)} <span className="text-lg">GB</span>
                      </p>
                      <p className="text-xs text-[#64748B] mt-1">All time</p>
                    </div>
                    <Activity className="w-10 h-10 text-purple-400/30" />
                  </div>
                </div>
                
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm">Active Devices</p>
                      <p className="text-3xl font-bold text-white mt-1">{stats.activeDevices}</p>
                      <p className="text-xs text-[#64748B] mt-1">
                        of {stats.totalDevices} total
                      </p>
                    </div>
                    <Wifi className="w-10 h-10 text-[#10F981]/30" />
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Venues Summary */}
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F]">
                  <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Your Venues</h3>
                    <button 
                      onClick={() => setActiveTab('venues')}
                      className="text-[#0EA5E9] text-sm hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-[#2D3B5F]">
                    {venues.length === 0 ? (
                      <div className="p-8 text-center">
                        <Building2 className="w-12 h-12 text-[#2D3B5F] mx-auto mb-3" />
                        <p className="text-[#64748B]">No venues yet</p>
                        <p className="text-sm text-[#4B5563] mt-1">
                          Venues will appear here once added
                        </p>
                      </div>
                    ) : (
                      venues.slice(0, 3).map(venue => (
                        <div key={venue.id} className="p-4 hover:bg-[#0A0F2C]/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#0A0F2C] rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-[#0EA5E9]" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{venue.name}</p>
                                <p className="text-[#64748B] text-sm">
                                  {venue.devicesInstalled} devices • {venue.city}, {venue.state}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(venue.status)}`}>
                              {venue.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Documents Summary */}
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F]">
                  <div className="p-4 border-b border-[#2D3B5F] flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Documents</h3>
                    <button 
                      onClick={() => setActiveTab('documents')}
                      className="text-[#0EA5E9] text-sm hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <DocumentRow 
                      name="Letter of Intent" 
                      status={partner.loi_status || 'not_sent'} 
                      date={partner.loi_signed_at}
                    />
                    <DocumentRow 
                      name="Deployment Agreement" 
                      status={partner.deployment_status || 'not_sent'} 
                      date={partner.deployment_signed_at}
                    />
                    <DocumentRow 
                      name="Contract" 
                      status={partner.contract_status || 'not_sent'} 
                      date={partner.contract_signed_at}
                    />
                    {partner.nda_status && (
                      <DocumentRow 
                        name="NDA" 
                        status={partner.nda_status} 
                        date={partner.nda_signed_at}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Setup Card */}
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      partner.tipalti_status === 'payable' ? 'bg-emerald-500/20' : 'bg-yellow-500/20'
                    }`}>
                      <CreditCard className={`w-6 h-6 ${
                        partner.tipalti_status === 'payable' ? 'text-emerald-400' : 'text-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Payment Setup</h3>
                      <p className="text-[#64748B] text-sm">
                        {partner.tipalti_status === 'payable' 
                          ? 'Your payment method is verified and ready'
                          : partner.tipalti_status === 'completed'
                          ? 'Onboarding complete - pending verification'
                          : partner.tipalti_status === 'invite_sent'
                          ? 'Please complete your payment setup'
                          : 'Set up your payment method to receive earnings'}
                      </p>
                    </div>
                  </div>
                  {partner.tipalti_status !== 'payable' && (
                    <button className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                      Complete Setup
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Venues Tab */}
          {activeTab === 'venues' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Your Venues</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Venue
                </button>
              </div>

              {/* Venue Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#0F1629] rounded-lg p-4 text-center border border-[#2D3B5F]">
                  <div className="text-2xl font-bold text-white">{stats.totalVenues}</div>
                  <div className="text-[#64748B] text-sm">Total</div>
                </div>
                <div className="bg-[#0F1629] rounded-lg p-4 text-center border border-[#2D3B5F]">
                  <div className="text-2xl font-bold text-emerald-400">{stats.activeVenues}</div>
                  <div className="text-[#64748B] text-sm">Active</div>
                </div>
                <div className="bg-[#0F1629] rounded-lg p-4 text-center border border-[#2D3B5F]">
                  <div className="text-2xl font-bold text-blue-400">{stats.trialVenues}</div>
                  <div className="text-[#64748B] text-sm">In Trial</div>
                </div>
                <div className="bg-[#0F1629] rounded-lg p-4 text-center border border-[#2D3B5F]">
                  <div className="text-2xl font-bold text-[#0EA5E9]">{stats.totalDevices}</div>
                  <div className="text-[#64748B] text-sm">Devices</div>
                </div>
              </div>

              {/* Venues List */}
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F]">
                {venues.length === 0 ? (
                  <div className="p-12 text-center">
                    <Building2 className="w-16 h-16 text-[#2D3B5F] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No venues yet</h3>
                    <p className="text-[#64748B] mb-4">Add your first venue to get started</p>
                    <button className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                      Add Your First Venue
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#2D3B5F]">
                    {venues.map(venue => (
                      <div key={venue.id} className="p-4 hover:bg-[#0A0F2C]/50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-[#0A0F2C] rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 text-[#0EA5E9]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-white font-medium">{venue.name}</p>
                                <div className="flex items-center gap-1 text-[#64748B] text-sm mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {venue.address && `${venue.address}, `}{venue.city}, {venue.state}
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(venue.status)}`}>
                                {venue.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-3">
                              <div className="flex items-center gap-2">
                                <Wifi className="w-4 h-4 text-[#64748B]" />
                                <span className="text-[#94A3B8] text-sm">{venue.devicesInstalled} devices</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[#64748B]" />
                                <span className="text-[#94A3B8] text-sm">{venue.dataUsageGB.toFixed(1)} GB</span>
                              </div>
                              {venue.status === 'trial' && venue.trialDaysRemaining !== null && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-blue-400" />
                                  <span className="text-blue-400 text-sm">{venue.trialDaysRemaining} days left</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#64748B] flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Payments</h2>

              {/* Payment Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Total Earned</p>
                  <p className="text-3xl font-bold text-white mt-1">{formatCurrency(stats.totalEarnings)}</p>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Next Payment</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-1">{formatCurrency(stats.nextPaymentAmount)}</p>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Payment Status</p>
                  <p className="text-xl font-semibold text-white mt-1 capitalize">
                    {partner.tipalti_status?.replace(/_/g, ' ') || 'Not Set Up'}
                  </p>
                </div>
              </div>

              {/* Tipalti Setup */}
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    partner.tipalti_status === 'payable' ? 'bg-emerald-500/20' : 'bg-yellow-500/20'
                  }`}>
                    <CreditCard className={`w-6 h-6 ${
                      partner.tipalti_status === 'payable' ? 'text-emerald-400' : 'text-yellow-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Payment Setup Status</h3>
                    <p className="text-[#64748B] text-sm">
                      {partner.tipalti_status === 'payable' 
                        ? 'Your payment method is verified and ready to receive payments'
                        : 'Complete your payment setup to receive revenue share payments'}
                    </p>
                  </div>
                </div>
                {partner.tipalti_status !== 'payable' && (
                  <button className="w-full md:w-auto px-6 py-3 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                    Complete Payment Setup
                  </button>
                )}
              </div>

              {/* Commission History */}
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F]">
                <div className="p-4 border-b border-[#2D3B5F]">
                  <h3 className="text-lg font-semibold text-white">Commission History</h3>
                </div>
                {commissions.length === 0 ? (
                  <div className="p-8 text-center text-[#64748B]">
                    No commission history yet
                  </div>
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
                        {commissions.map(commission => (
                          <tr key={commission.id} className="border-b border-[#2D3B5F] last:border-0">
                            <td className="p-4 text-white">
                              {new Date(commission.commission_month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                            </td>
                            <td className="p-4 text-emerald-400 font-medium">
                              {formatCurrency(commission.amount)}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(commission.status)}`}>
                                {commission.status}
                              </span>
                            </td>
                            <td className="p-4 text-[#94A3B8]">
                              {commission.paid_at ? formatDate(commission.paid_at) : '-'}
                            </td>
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

              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F]">
                <div className="divide-y divide-[#2D3B5F]">
                  <DocumentDetailRow 
                    name="Letter of Intent (LOI)"
                    description="Initial agreement outlining deployment terms"
                    status={partner.loi_status || 'not_sent'}
                    signedAt={partner.loi_signed_at}
                  />
                  <DocumentDetailRow 
                    name="Deployment Agreement"
                    description="Equipment and installation details"
                    status={partner.deployment_status || 'not_sent'}
                    signedAt={partner.deployment_signed_at}
                  />
                  <DocumentDetailRow 
                    name="Location Contract"
                    description="Final partnership agreement"
                    status={partner.contract_status || 'not_sent'}
                    signedAt={partner.contract_signed_at}
                  />
                  {partner.nda_status && (
                    <DocumentDetailRow 
                      name="Non-Disclosure Agreement"
                      description="Confidentiality agreement"
                      status={partner.nda_status}
                      signedAt={partner.nda_signed_at}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Devices Tab */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Devices</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Total Devices</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalDevices}</p>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Active</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.activeDevices}</p>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Data Offloaded</p>
                  <p className="text-3xl font-bold text-[#0EA5E9] mt-1">{stats.totalDataGB.toFixed(1)} GB</p>
                </div>
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-5">
                  <p className="text-[#64748B] text-sm">Venues</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalVenues}</p>
                </div>
              </div>

              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-8 text-center">
                <Cpu className="w-16 h-16 text-[#2D3B5F] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Device Details</h3>
                <p className="text-[#64748B]">
                  Detailed device information will be shown here once devices are deployed.
                </p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Settings</h2>

              {/* Account Info */}
              <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#64748B] text-sm">Company Name</label>
                    <p className="text-white mt-1">{partner.company_legal_name}</p>
                  </div>
                  {partner.dba_name && (
                    <div>
                      <label className="text-[#64748B] text-sm">DBA Name</label>
                      <p className="text-white mt-1">{partner.dba_name}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-[#64748B] text-sm">Contact Name</label>
                    <p className="text-white mt-1">{partner.contact_first_name} {partner.contact_last_name}</p>
                  </div>
                  <div>
                    <label className="text-[#64748B] text-sm">Email</label>
                    <p className="text-white mt-1">{partner.contact_email}</p>
                  </div>
                  {partner.contact_phone && (
                    <div>
                      <label className="text-[#64748B] text-sm">Phone</label>
                      <p className="text-white mt-1">{partner.contact_phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-[#64748B] text-sm">Partner ID</label>
                    <p className="text-[#0EA5E9] font-mono mt-1">{partner.partner_id}</p>
                  </div>
                </div>
              </div>

              {/* Commission Structure */}
              {partner.commission_type && (
                <div className="bg-[#0F1629] rounded-xl border border-[#2D3B5F] p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Commission Structure</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[#64748B] text-sm">Type</label>
                      <p className="text-white mt-1 capitalize">{partner.commission_type?.replace(/_/g, ' ')}</p>
                    </div>
                    {partner.commission_percentage && (
                      <div>
                        <label className="text-[#64748B] text-sm">Percentage</label>
                        <p className="text-white mt-1">{partner.commission_percentage}%</p>
                      </div>
                    )}
                    {partner.commission_flat_fee && (
                      <div>
                        <label className="text-[#64748B] text-sm">Flat Fee</label>
                        <p className="text-white mt-1">{formatCurrency(partner.commission_flat_fee)}/month</p>
                      </div>
                    )}
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

// Helper Components
function DocumentRow({ name, status, date }: { name: string; status: string; date?: string }) {
  const statusColors: Record<string, string> = {
    signed: 'bg-emerald-500/20 text-emerald-400',
    sent: 'bg-blue-500/20 text-blue-400',
    viewed: 'bg-purple-500/20 text-purple-400',
    not_sent: 'bg-gray-500/20 text-gray-400',
    declined: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-[#64748B]" />
        <div>
          <p className="text-white font-medium">{name}</p>
          {date && (
            <p className="text-[#64748B] text-sm">
              Signed {new Date(date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status] || statusColors.not_sent}`}>
        {status.replace(/_/g, ' ')}
      </span>
    </div>
  )
}

function DocumentDetailRow({ 
  name, 
  description, 
  status, 
  signedAt 
}: { 
  name: string
  description: string
  status: string
  signedAt?: string 
}) {
  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    signed: { color: 'text-emerald-400', icon: CheckCircle, label: 'Signed' },
    sent: { color: 'text-blue-400', icon: Send, label: 'Awaiting Signature' },
    viewed: { color: 'text-purple-400', icon: ExternalLink, label: 'Viewed' },
    not_sent: { color: 'text-gray-400', icon: Clock, label: 'Not Sent' },
    declined: { color: 'text-red-400', icon: AlertCircle, label: 'Declined' },
  }

  const config = statusConfig[status] || statusConfig.not_sent
  const Icon = config.icon

  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#0A0F2C] rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#0EA5E9]" />
        </div>
        <div>
          <p className="text-white font-medium">{name}</p>
          <p className="text-[#64748B] text-sm">{description}</p>
          {signedAt && (
            <p className="text-[#64748B] text-xs mt-1">
              Signed on {new Date(signedAt).toLocaleDateString()}
            </p>
          )}
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
