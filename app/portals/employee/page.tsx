'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, FileText, Settings, BarChart3, Calendar,
  Briefcase, CheckCircle, Clock, AlertCircle, RefreshCw,
  ClipboardList, Building2, Shield
} from 'lucide-react'
import { PortalSwitcher } from '@/components/portal/PortalSwitcher'
import { PartnerSettings } from '@/components/portal'
import { useRolePermissions } from '@/hooks/useRolePermissions'

type TabType = 'overview' | 'tasks' | 'schedule' | 'documents' | 'directory' | 'admin' | 'settings'

interface EmployeeData {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  job_title: string
  department: string
  employment_type: string
  status: string
  start_date: string
  salary: number
  pay_frequency: string
  offer_letter_status: string
  non_compete_status: string
  nda_status: string
  writeup_count: number
  last_writeup_date: string
}

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  due_date: string
}

export default function EmployeePortalPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [employee, setEmployee] = useState<EmployeeData | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [manager, setManager] = useState<any>(null)

  // Role permissions
  const { canView, canEdit } = useRolePermissions()

  // Define all tabs with permission keys
  const allTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, permKey: 'emp_dashboard' },
    { id: 'tasks', label: 'My Tasks', icon: ClipboardList, permKey: 'emp_tasks' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, permKey: 'emp_schedule' },
    { id: 'documents', label: 'Documents', icon: FileText, permKey: 'emp_documents' },
    { id: 'directory', label: 'Directory', icon: Users, permKey: 'emp_directory' },
    { id: 'admin', label: 'Admin Access', icon: Shield, permKey: 'emp_admin' },
    { id: 'settings', label: 'Settings', icon: Settings, permKey: 'emp_settings' },
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

      const res = await fetch('/api/portal/employee')
      const data = await res.json()

      if (data.success) {
        setEmployee(data.employee)
        setTasks(data.tasks || [])
        setManager(data.manager)
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
      signed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      sent: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-green-500/20 text-green-400',
    }
    return colors[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-400'
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28]">
      <header className="bg-[#0F1629] border-b border-[#2D3B5F] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Employee Portal</h1>
              <p className="text-[#64748B] text-sm">{employee?.job_title || 'Team Member'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <PortalSwitcher currentPortal="employee" />
            <UserButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome back, {employee?.first_name || user?.firstName}!
          </h2>
          <p className="text-[#94A3B8]">
            {employee?.department && `${employee.department} • `}
            Employee ID: <span className="text-[#0EA5E9] font-mono">{employee?.employee_id}</span>
          </p>
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
                    ? 'bg-purple-500 text-white'
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
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Start Date</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {employee?.start_date ? new Date(employee.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Pending Tasks</span>
                </div>
                <div className="text-3xl font-bold text-yellow-400">{pendingTasks.length}</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Completed</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{completedTasks.length}</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Status</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(employee?.status || '')}`}>
                  {employee?.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Manager Info */}
            {manager && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Reports To</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{manager.first_name} {manager.last_name}</p>
                    <p className="text-[#94A3B8] text-sm">{manager.job_title}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Tasks Preview */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Tasks</h3>
                <button onClick={() => setActiveTab('tasks')} className="text-purple-400 text-sm hover:underline">
                  View All
                </button>
              </div>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-[#64748B]">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tasks assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                      <div>
                        <p className="text-white font-medium">{task.title}</p>
                        {task.due_date && (
                          <p className="text-[#64748B] text-sm">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pending Tasks</h3>
              {pendingTasks.length === 0 ? (
                <div className="text-center py-12 text-[#64748B]">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No pending tasks</p>
                  <p className="text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                      <div>
                        <p className="text-white font-medium">{task.title}</p>
                        {task.description && <p className="text-[#94A3B8] text-sm mt-1">{task.description}</p>}
                        {task.due_date && (
                          <p className="text-[#64748B] text-sm mt-1">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.priority && (
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {task.priority}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Completed Tasks</h3>
              {completedTasks.length === 0 ? (
                <div className="text-center py-12 text-[#64748B]">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No completed tasks yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg">
                      <div>
                        <p className="text-white font-medium">{task.title}</p>
                        {task.due_date && (
                          <p className="text-[#64748B] text-sm">Completed: {new Date(task.due_date).toLocaleDateString()}</p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
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
            <div className="text-center py-12 text-[#64748B]">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Schedule view coming soon</p>
              <p className="text-sm mt-1">Your work schedule and meetings will appear here.</p>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">My Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#64748B]" />
                  <div>
                    <p className="text-white font-medium">Offer Letter</p>
                    <p className="text-[#64748B] text-sm">Employment offer</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(employee?.offer_letter_status || '')}`}>
                  {employee?.offer_letter_status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#64748B]" />
                  <div>
                    <p className="text-white font-medium">Non-Compete</p>
                    <p className="text-[#64748B] text-sm">Agreement</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(employee?.non_compete_status || '')}`}>
                  {employee?.non_compete_status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#64748B]" />
                  <div>
                    <p className="text-white font-medium">NDA</p>
                    <p className="text-[#64748B] text-sm">Non-disclosure</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(employee?.nda_status || '')}`}>
                  {employee?.nda_status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Directory Tab */}
        {activeTab === 'directory' && (
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Company Directory</h3>
            {manager ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-[#0A0F2C] rounded-lg">
                  <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#0EA5E9]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{manager.first_name} {manager.last_name}</p>
                    <p className="text-[#94A3B8] text-sm">{manager.job_title}</p>
                  </div>
                  <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">Manager</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#64748B]">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Directory coming soon</p>
                <p className="text-sm mt-1">Team members will be listed here.</p>
              </div>
            )}
          </div>
        )}

        {/* Admin Access Tab */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Admin Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/portals/admin"
                  className="flex items-center gap-4 p-4 bg-[#0A0F2C] rounded-lg hover:bg-[#0A0F2C]/80 transition-colors"
                >
                  <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Admin Dashboard</p>
                    <p className="text-[#64748B] text-sm">Access admin controls</p>
                  </div>
                </Link>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-4 p-4 bg-[#0A0F2C] rounded-lg hover:bg-[#0A0F2C]/80 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">User Management</p>
                    <p className="text-[#64748B] text-sm">Manage user accounts</p>
                  </div>
                </Link>
                <Link
                  href="/admin/blog"
                  className="flex items-center gap-4 p-4 bg-[#0A0F2C] rounded-lg hover:bg-[#0A0F2C]/80 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Blog Management</p>
                    <p className="text-[#64748B] text-sm">Create and manage posts</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <PartnerSettings
            partnerId={employee?.id || ''}
            partnerType="contractor"
            showCompanyInfo={false}
            showPaymentSettings={false}
            showNotifications={true}
            readOnly={!canEdit('emp_settings')}
          />
        )}
      </div>
    </div>
  )
}
