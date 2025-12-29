'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, MapPin, Cpu, DollarSign, FileText, Settings, 
  TrendingUp, CreditCard, RefreshCw, AlertCircle, CheckCircle,
  Wifi, Activity, Calendar, HelpCircle, ChevronRight, Plus,
  ExternalLink, Download, Eye, MoreVertical, Signal
} from 'lucide-react'
import { PortalSwitcher } from '@/components/portal/PortalSwitcher'

// Types
interface LocationPartner {
  id: string
  partner_id: string
  company_legal_name: string
  dba_name: string
  contact_first_name: string
  contact_last_name: string
  contact_email: string
  contact_phone: string
  pipeline_stage: string
  loi_status: string
  contract_status: string
  tipalti_status: string
  tipalti_payee_id: string
  trial_status: string
  trial_end_date: string
  commission_type: string
  commission_percentage: number
  commission_flat_fee: number
  last_payment_amount: number
  last_payment_date: string
  hasChildPartners: boolean
  managedLocationCount: number
}

interface Venue {
  id: string
  venue_name: string
  address: string
  city: string
  state: string
  zip: string
  square_footage: number
  venue_type: string
  status: string
  deviceCount: number
  activeDeviceCount: number
}

interface Device {
  id: string
  device_id: string
  device_name: string
  device_type: string
  mac_address: string
  status: string
  venue_id: string
  last_seen: string
  monthly_data_gb: number
  monthly_earnings: number
}

interface Commission {
  id: string
  commission_month: string
  amount: number
  status: string
  payment_date: string
}

interface Stats {
  totalVenues: number
  totalDevices: number
  activeDevices: number
  totalEarnings: number
  thisMonthEarnings: number
  managedLocations: number
}

interface ManagedLocation {
  id: string
  partnerId: string
  companyName: string
  email: string
  stage: string
}

// Icon mapping
const iconMap: Record<string, any> = {
  Building2, MapPin, Cpu, DollarSign, FileText, Settings,
  TrendingUp, CreditCard, HelpCircle, Wifi, Activity, Calendar
}

export default function LocationPortalPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  // Data state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partnerData, setPartnerData] = useState<LocationPartner | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [managedLocations, setManagedLocations] = useState<ManagedLocation[]>([])
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null)

  // Tab configuration (can be loaded from API)
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2, enabled: true },
    { id: 'venues', label: 'Venues', icon: MapPin, enabled: true },
    { id: 'devices', label: 'Devices', icon: Cpu, enabled: true },
    { id: 'earnings', label: 'Earnings', icon: DollarSign, enabled: true },
    { id: 'documents', label: 'Documents', icon: FileText, enabled: true },
    { id: 'support', label: 'Support', icon: HelpCircle, enabled: true },
    { id: 'settings', label: 'Settings', icon: Settings, enabled: true },
  ]

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      router.push('/sign-in')
      return
    }
    loadData()
  }, [user, isLoaded, router])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/portal/location-partner')
      const data = await res.json()

      if (data.success) {
        setPartnerData(data.partner)
        setStats(data.stats)
        setVenues(data.venues || [])
        setDevices(data.devices || [])
        setCommissions(data.commissions || [])
        setManagedLocations(data.managedLocations || [])
      } else {
        setError(data.error || 'Failed to load data')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[#0EA5E9] animate-spin mx-auto mb-4" />
          <p className="text-[#94A3B8]">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center p-4">
        <div className="bg-[#1A1F3A] border border-red-500/50 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Error</h2>
          <p className="text-[#94A3B8] mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30',
      'trial_active': 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30',
      'loi_sent': 'bg-orange-400/20 text-orange-400 border-orange-400/30',
      'loi_signed': 'bg-purple-400/20 text-purple-400 border-purple-400/30',
      'initial_review': 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
    }
    return colors[stage] || 'bg-gray-400/20 text-gray-400 border-gray-400/30'
  }

  const getDeviceStatusColor = (status: string) => {
    return status === 'active' ? 'text-emerald-400' : 'text-gray-400'
  }

  const getVenueDevices = (venueId: string) => {
    return devices.filter(d => d.venue_id === venueId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28]">
      {/* Header */}
      <header className="bg-[#0A0F2C]/80 backdrop-blur-xl border-b border-[#2D3B5F] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Wifi className="w-8 h-8 text-[#0EA5E9]" />
                <span className="text-xl font-bold text-white">SkyYield</span>
              </Link>
              <div className="h-6 w-px bg-[#2D3B5F]" />
              <span className="text-[#94A3B8]">Partner Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <PortalSwitcher />
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {partnerData?.contact_first_name || 'Partner'}!
          </h1>
          <p className="text-[#94A3B8]">
            {partnerData?.company_legal_name || partnerData?.dba_name}
            {managedLocations.length > 0 && (
              <span className="ml-2 text-[#0EA5E9]">
                • Managing {managedLocations.length + 1} locations
              </span>
            )}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.filter(t => t.enabled).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#0EA5E9] text-white'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#0EA5E9]/20 rounded-lg">
                    <MapPin className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Total Venues</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats?.totalVenues || 0}</p>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-400/20 rounded-lg">
                    <Cpu className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Active Devices</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {stats?.activeDevices || 0}
                  <span className="text-lg text-[#64748B]">/{stats?.totalDevices || 0}</span>
                </p>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-400/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">This Month</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(stats?.thisMonthEarnings || 0)}
                </p>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-400/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Total Earnings</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(stats?.totalEarnings || 0)}
                </p>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <span className="text-[#64748B] text-sm">Partnership Status</span>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStageColor(partnerData?.pipeline_stage || '')}`}>
                    {partnerData?.pipeline_stage === 'active' && <CheckCircle className="w-3.5 h-3.5" />}
                    {partnerData?.pipeline_stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
                <div>
                  <span className="text-[#64748B] text-sm">LOI Status</span>
                  <p className="text-white font-medium mt-1 capitalize">{partnerData?.loi_status || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[#64748B] text-sm">Contract Status</span>
                  <p className="text-white font-medium mt-1 capitalize">{partnerData?.contract_status || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[#64748B] text-sm">Payment Status</span>
                  <p className="text-white font-medium mt-1 capitalize">{partnerData?.tipalti_status || 'Pending Setup'}</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('venues')}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 text-left hover:border-[#0EA5E9]/50 transition-colors group"
              >
                <MapPin className="w-8 h-8 text-[#0EA5E9] mb-3" />
                <h4 className="text-white font-medium mb-1">Manage Venues</h4>
                <p className="text-[#64748B] text-sm">View and manage your {stats?.totalVenues || 0} venue(s)</p>
                <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-[#0EA5E9] mt-2 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('devices')}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 text-left hover:border-[#0EA5E9]/50 transition-colors group"
              >
                <Cpu className="w-8 h-8 text-emerald-400 mb-3" />
                <h4 className="text-white font-medium mb-1">Device Status</h4>
                <p className="text-[#64748B] text-sm">{stats?.activeDevices || 0} of {stats?.totalDevices || 0} devices online</p>
                <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-[#0EA5E9] mt-2 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('earnings')}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 text-left hover:border-[#0EA5E9]/50 transition-colors group"
              >
                <DollarSign className="w-8 h-8 text-purple-400 mb-3" />
                <h4 className="text-white font-medium mb-1">View Earnings</h4>
                <p className="text-[#64748B] text-sm">Track your commission payments</p>
                <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-[#0EA5E9] mt-2 transition-colors" />
              </button>
            </div>

            {/* Recent Activity */}
            {commissions.length > 0 && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Payments</h3>
                <div className="space-y-3">
                  {commissions.slice(0, 3).map(comm => (
                    <div key={comm.id} className="flex items-center justify-between py-3 border-b border-[#2D3B5F] last:border-0">
                      <div>
                        <p className="text-white font-medium">{formatDate(comm.commission_month)}</p>
                        <p className="text-[#64748B] text-sm capitalize">{comm.status}</p>
                      </div>
                      <p className="text-emerald-400 font-semibold">{formatCurrency(comm.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== VENUES TAB ==================== */}
        {activeTab === 'venues' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Your Venues</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">
                <Plus className="w-4 h-4" />
                Request New Venue
              </button>
            </div>

            {venues.length === 0 ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                <MapPin className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No Venues Yet</h3>
                <p className="text-[#94A3B8] text-sm">Your venues will appear here once equipment is installed.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {venues.map(venue => (
                  <div
                    key={venue.id}
                    className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9]/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedVenue(selectedVenue === venue.id ? null : venue.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-white font-semibold">{venue.venue_name}</h3>
                        <p className="text-[#64748B] text-sm">{venue.city}, {venue.state}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Signal className={`w-4 h-4 ${venue.activeDeviceCount > 0 ? 'text-emerald-400' : 'text-gray-400'}`} />
                        <span className="text-[#94A3B8] text-sm">
                          {venue.activeDeviceCount}/{venue.deviceCount}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[#64748B]">Address</span>
                        <p className="text-white">{venue.address || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[#64748B]">Type</span>
                        <p className="text-white capitalize">{venue.venue_type || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Expanded Device List */}
                    {selectedVenue === venue.id && (
                      <div className="mt-4 pt-4 border-t border-[#2D3B5F]">
                        <h4 className="text-[#94A3B8] text-sm font-medium mb-3">Devices at this venue</h4>
                        <div className="space-y-2">
                          {getVenueDevices(venue.id).map(device => (
                            <div key={device.id} className="flex items-center justify-between py-2 px-3 bg-[#0A0F2C] rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${device.status === 'active' ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                                <span className="text-white text-sm">{device.device_name || device.device_id}</span>
                              </div>
                              <span className="text-[#64748B] text-xs font-mono">{device.mac_address}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== DEVICES TAB ==================== */}
        {activeTab === 'devices' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">All Devices</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  {stats?.activeDevices || 0} Online
                </span>
                <span className="text-[#64748B]">•</span>
                <span className="text-[#64748B]">{(stats?.totalDevices || 0) - (stats?.activeDevices || 0)} Offline</span>
              </div>
            </div>

            {devices.length === 0 ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                <Cpu className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No Devices Yet</h3>
                <p className="text-[#94A3B8] text-sm">Your devices will appear here once installed.</p>
              </div>
            ) : (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#0A0F2C]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Device</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Venue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">MAC Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Last Seen</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#64748B] uppercase">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3B5F]">
                    {devices.map(device => {
                      const venue = venues.find(v => v.id === device.venue_id)
                      return (
                        <tr key={device.id} className="hover:bg-[#2D3B5F]/30">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${device.status === 'active' ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                              <span className={`text-sm capitalize ${device.status === 'active' ? 'text-emerald-400' : 'text-gray-400'}`}>
                                {device.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-white font-medium">{device.device_name || device.device_id}</p>
                            <p className="text-[#64748B] text-xs">{device.device_type}</p>
                          </td>
                          <td className="px-6 py-4 text-[#94A3B8]">{venue?.venue_name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-[#64748B] font-mono text-xs">{device.mac_address}</td>
                          <td className="px-6 py-4 text-[#94A3B8] text-sm">{formatDate(device.last_seen)}</td>
                          <td className="px-6 py-4 text-right text-emerald-400 font-medium">
                            {formatCurrency(device.monthly_earnings || 0)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== EARNINGS TAB ==================== */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Earnings History</h2>
              {partnerData?.tipalti_status !== 'payable' && (
                <a
                  href="#"
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-400/20 text-yellow-400 rounded-lg hover:bg-yellow-400/30"
                >
                  <AlertCircle className="w-4 h-4" />
                  Complete Payment Setup
                </a>
              )}
            </div>

            {/* Earnings Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <span className="text-[#64748B] text-sm">This Month</span>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats?.thisMonthEarnings || 0)}</p>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <span className="text-[#64748B] text-sm">Total Earnings</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(stats?.totalEarnings || 0)}</p>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <span className="text-[#64748B] text-sm">Commission Rate</span>
                <p className="text-2xl font-bold text-white mt-1">{partnerData?.commission_percentage || 50}%</p>
              </div>
            </div>

            {/* Commission History */}
            {commissions.length === 0 ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                <DollarSign className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No Earnings Yet</h3>
                <p className="text-[#94A3B8] text-sm">Your commission history will appear here.</p>
              </div>
            ) : (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#0A0F2C]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Payment Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#64748B] uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3B5F]">
                    {commissions.map(comm => (
                      <tr key={comm.id} className="hover:bg-[#2D3B5F]/30">
                        <td className="px-6 py-4 text-white font-medium">{formatDate(comm.commission_month)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            comm.status === 'paid' ? 'bg-emerald-400/20 text-emerald-400' :
                            comm.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                            'bg-gray-400/20 text-gray-400'
                          }`}>
                            {comm.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#94A3B8]">{formatDate(comm.payment_date)}</td>
                        <td className="px-6 py-4 text-right text-emerald-400 font-semibold">{formatCurrency(comm.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== DOCUMENTS TAB ==================== */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Documents</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* LOI */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-orange-400" />
                    <div>
                      <h3 className="text-white font-medium">Letter of Intent</h3>
                      <p className="text-[#64748B] text-sm capitalize">{partnerData?.loi_status || 'Not Created'}</p>
                    </div>
                  </div>
                  {partnerData?.loi_status === 'signed' && (
                    <button className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contract */}
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-green-400" />
                    <div>
                      <h3 className="text-white font-medium">Deployment Contract</h3>
                      <p className="text-[#64748B] text-sm capitalize">{partnerData?.contract_status || 'Not Created'}</p>
                    </div>
                  </div>
                  {partnerData?.contract_status === 'signed' && (
                    <button className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUPPORT TAB ==================== */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Support</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Contact Us</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-[#64748B] text-sm">Email</span>
                    <a href="mailto:support@skyyield.io" className="block text-[#0EA5E9] hover:underline">
                      support@skyyield.io
                    </a>
                  </div>
                  <div>
                    <span className="text-[#64748B] text-sm">Phone</span>
                    <p className="text-white">(888) SKY-YIELD</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Resources</h3>
                <div className="space-y-2">
                  <a href="#" className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F]/50">
                    <span className="text-white">Partner Guide</span>
                    <ExternalLink className="w-4 h-4 text-[#64748B]" />
                  </a>
                  <a href="#" className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg hover:bg-[#2D3B5F]/50">
                    <span className="text-white">FAQ</span>
                    <ExternalLink className="w-4 h-4 text-[#64748B]" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SETTINGS TAB ==================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Settings</h2>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Account Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#64748B] text-sm mb-1">Company Name</label>
                  <p className="text-white">{partnerData?.company_legal_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[#64748B] text-sm mb-1">Partner ID</label>
                  <p className="text-white font-mono">{partnerData?.partner_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[#64748B] text-sm mb-1">Contact Email</label>
                  <p className="text-white">{partnerData?.contact_email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-[#64748B] text-sm mb-1">Contact Phone</label>
                  <p className="text-white">{partnerData?.contact_phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Payment Settings</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Tipalti Payment Status</p>
                  <p className="text-[#64748B] text-sm capitalize">{partnerData?.tipalti_status || 'Not Set Up'}</p>
                </div>
                {partnerData?.tipalti_status !== 'payable' && (
                  <button className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">
                    Complete Setup
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
