'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Wrench, DollarSign, CheckCircle, Clock, Calendar,
  MapPin, FileText, AlertCircle, RefreshCw, Settings,
  Briefcase, BarChart3
} from 'lucide-react'
import { PortalSwitcher } from '@/components/portal/PortalSwitcher'
import { PartnerSettings } from '@/components/portal'
import { useRolePermissions } from '@/hooks/useRolePermissions'

type TabType = 'overview' | 'jobs' | 'schedule' | 'earnings' | 'documents' | 'settings'

interface ContractorData {
  id: string
  contractor_id: string
  legal_name: string
  dba_name: string
  contact_email: string
  contact_phone: string
  pipeline_stage: string
  skills: string[]
  service_area: string[]
  hourly_rate: number
  day_rate: number
  per_install_rate: number
  total_jobs_completed: number
  average_rating: number
  agreement_status: string
  tipalti_status: string
  w9_status: string
  insurance_status: string
  background_check_status: string
}

interface Job {
  id: string
  job_number: string
  job_type: string
  description: string
  scheduled_date: string
  scheduled_time_start: string
  status: string
  payment_amount: number
  payment_status: string
  venues?: {
    venue_name: string
    address_line_1: string
    city: string
    state: string
  }
}

interface Stats {
  scheduledJobs: number
  completedJobs: number
  pendingPayment: number
  totalEarned: number
}

export default function ContractorPortalPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contractor, setContractor] = useState<ContractorData | null>(null)
  const [stats, setStats] = useState<Stats>({ scheduledJobs: 0, completedJobs: 0, pendingPayment: 0, totalEarned: 0 })
  const [jobs, setJobs] = useState<Job[]>([])

  // Role permissions
  const { canView, canEdit } = useRolePermissions()

  // Define all tabs with permission keys
  const allTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, permKey: 'con_dashboard' },
    { id: 'jobs', label: 'My Jobs', icon: Briefcase, permKey: 'con_jobs' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, permKey: 'con_schedule' },
    { id: 'earnings', label: 'Earnings', icon: DollarSign, permKey: 'con_earnings' },
    { id: 'documents', label: 'Documents', icon: FileText, permKey: 'con_documents' },
    { id: 'settings', label: 'Settings', icon: Settings, permKey: 'con_settings' },
  ]

  // Filter tabs based on user's role permissions
  const tabs = allTabs.filter(tab => canView(tab.permKey))

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      router.push('/sign-in')
      return
    }
    loadData()
  }, [isLoaded, user, router])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/portal/contractor')
      const data = await res.json()

      if (data.success) {
        setContractor(data.contractor)
        setStats(data.stats)
        setJobs(data.jobs || [])
      } else {
        setError(data.error || 'Failed to load data')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0EA5E9] mx-auto mb-4" />
          <p className="text-[#94A3B8]">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      completed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      scheduled: 'bg-blue-500/20 text-blue-400',
      signed: 'bg-green-500/20 text-green-400',
      payable: 'bg-green-500/20 text-green-400',
    }
    return colors[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-400'
  }

  const upcomingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'scheduled')
  const completedJobs = jobs.filter(j => j.status === 'completed')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28]">
      <header className="bg-[#0F1629] border-b border-[#2D3B5F] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Contractor Portal</h1>
              <p className="text-[#64748B] text-sm">{contractor?.dba_name || contractor?.legal_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <PortalSwitcher currentPortal="contractor" />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {user?.firstName}!</h2>
          <p className="text-[#94A3B8]">Contractor ID: <span className="text-[#0EA5E9] font-mono">{contractor?.contractor_id}</span></p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Scheduled Jobs</span>
                </div>
                <div className="text-3xl font-bold text-white">{stats.scheduledJobs}</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Completed</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{stats.completedJobs}</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Pending Payment</span>
                </div>
                <div className="text-3xl font-bold text-yellow-400">${stats.pendingPayment.toFixed(2)}</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Total Earned</span>
                </div>
                <div className="text-3xl font-bold text-[#0EA5E9]">${stats.totalEarned.toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#64748B]" />
                  <div>
                    <p className="text-[#94A3B8] text-sm">Agreement</p>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(contractor?.agreement_status || '')}`}>
                      {contractor?.agreement_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#64748B]" />
                  <div>
                    <p className="text-[#94A3B8] text-sm">W9</p>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(contractor?.w9_status || '')}`}>
                      {contractor?.w9_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#64748B]" />
                  <div>
                    <p className="text-[#94A3B8] text-sm">Insurance</p>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(contractor?.insurance_status || '')}`}>
                      {contractor?.insurance_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-[#64748B]" />
                  <div>
                    <p className="text-[#94A3B8] text-sm">Payment</p>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(contractor?.tipalti_status || '')}`}>
                      {contractor?.tipalti_status?.toUpperCase() || 'NOT SET'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Upcoming Jobs</h3>
                <button onClick={() => setActiveTab('jobs')} className="text-orange-400 text-sm hover:underline">
                  View All
                </button>
              </div>
              {upcomingJobs.length === 0 ? (
                <div className="text-center py-8 text-[#64748B]">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming jobs</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingJobs.slice(0, 3).map(job => (
                    <div key={job.id} className="bg-[#0A0F2C] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium">{job.job_type}</h4>
                          <p className="text-[#64748B] text-sm">{job.job_number}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>{job.status}</span>
                      </div>
                      {job.venues && (
                        <div className="flex items-center gap-2 text-[#94A3B8] text-sm">
                          <MapPin className="w-4 h-4" />
                          {job.venues.venue_name} - {job.venues.city}, {job.venues.state}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Upcoming Jobs</h3>
              {upcomingJobs.length === 0 ? (
                <div className="text-center py-12 text-[#64748B]">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming jobs</p>
                  <p className="text-sm mt-1">New installation jobs will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingJobs.map(job => (
                    <div key={job.id} className="bg-[#0A0F2C] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white font-medium">{job.job_type}</h4>
                          <p className="text-[#64748B] text-sm">{job.job_number}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>{job.status}</span>
                      </div>
                      {job.venues && (
                        <div className="flex items-center gap-2 text-[#94A3B8] text-sm mb-2">
                          <MapPin className="w-4 h-4" />
                          {job.venues.venue_name} - {job.venues.city}, {job.venues.state}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#94A3B8]">
                          {new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[#0EA5E9] font-medium">${job.payment_amount?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Job History</h3>
              {completedJobs.length === 0 ? (
                <div className="text-center py-12 text-[#64748B]">
                  <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No completed jobs yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedJobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                      <div>
                        <p className="text-white font-medium">{job.job_type}</p>
                        <p className="text-[#64748B] text-sm">{new Date(job.scheduled_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-medium">${job.payment_amount?.toFixed(2) || '0.00'}</p>
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(job.payment_status)}`}>
                          {job.payment_status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">My Schedule</h3>
            {upcomingJobs.length === 0 ? (
              <div className="text-center py-12 text-[#64748B]">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No scheduled jobs</p>
                <p className="text-sm mt-1">Your upcoming schedule will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingJobs.map(job => (
                  <div key={job.id} className="flex items-center gap-4 p-4 bg-[#0A0F2C] rounded-lg">
                    <div className="w-16 h-16 bg-orange-500/20 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-orange-400 text-xs font-medium">
                        {new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="text-white text-lg font-bold">
                        {new Date(job.scheduled_date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{job.job_type}</h4>
                      {job.venues && (
                        <p className="text-[#94A3B8] text-sm">{job.venues.venue_name} - {job.venues.city}, {job.venues.state}</p>
                      )}
                      <p className="text-[#64748B] text-sm">{job.scheduled_time_start || 'Time TBD'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>{job.status}</span>
                      <p className="text-[#0EA5E9] font-medium mt-1">${job.payment_amount?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Total Earned</span>
                </div>
                <div className="text-3xl font-bold text-[#0EA5E9]">${stats.totalEarned.toFixed(2)}</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Pending Payment</span>
                </div>
                <div className="text-3xl font-bold text-yellow-400">${stats.pendingPayment.toFixed(2)}</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Jobs Completed</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{stats.completedJobs}</div>
              </div>
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Payment History</h3>
              {completedJobs.length === 0 ? (
                <div className="text-center py-12 text-[#64748B]">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No payment history yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2D3B5F]">
                        <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Job</th>
                        <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Date</th>
                        <th className="text-left px-4 py-3 text-[#64748B] text-sm font-medium">Status</th>
                        <th className="text-right px-4 py-3 text-[#64748B] text-sm font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedJobs.map(job => (
                        <tr key={job.id} className="border-b border-[#2D3B5F]">
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">{job.job_type}</p>
                            <p className="text-[#64748B] text-sm">{job.job_number}</p>
                          </td>
                          <td className="px-4 py-3 text-[#94A3B8]">
                            {new Date(job.scheduled_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(job.payment_status)}`}>
                              {job.payment_status || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-green-400 font-medium">
                            ${job.payment_amount?.toFixed(2) || '0.00'}
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
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">My Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#64748B]" />
                  <div>
                    <p className="text-white font-medium">Contractor Agreement</p>
                    <p className="text-[#64748B] text-sm">Service contract</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(contractor?.agreement_status || '')}`}>
                  {contractor?.agreement_status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#64748B]" />
                  <div>
                    <p className="text-white font-medium">W-9 Form</p>
                    <p className="text-[#64748B] text-sm">Tax documentation</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(contractor?.w9_status || '')}`}>
                  {contractor?.w9_status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#64748B]" />
                  <div>
                    <p className="text-white font-medium">Insurance Certificate</p>
                    <p className="text-[#64748B] text-sm">Liability coverage</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(contractor?.insurance_status || '')}`}>
                  {contractor?.insurance_status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#64748B]" />
                  <div>
                    <p className="text-white font-medium">Background Check</p>
                    <p className="text-[#64748B] text-sm">Verification status</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(contractor?.background_check_status || '')}`}>
                  {contractor?.background_check_status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <PartnerSettings
            partnerId={contractor?.id || ''}
            partnerType="contractor"
            showCompanyInfo={true}
            showPaymentSettings={true}
            showNotifications={true}
            readOnly={!canEdit('con_settings')}
          />
        )}
      </div>
    </div>
  )
}
