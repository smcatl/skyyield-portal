'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, FileText, Settings, BarChart3, Bell, Calendar, 
  Briefcase, CheckCircle, Clock, AlertCircle, RefreshCw
} from 'lucide-react'
import { PortalSwitcher } from '@/components/portal/PortalSwitcher'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [employee, setEmployee] = useState<EmployeeData | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [manager, setManager] = useState<any>(null)

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
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome back, {employee?.first_name || user?.firstName}!
          </h2>
          <p className="text-[#94A3B8]">
            {employee?.department && `${employee.department} • `}
            Employee ID: <span className="text-[#0EA5E9] font-mono">{employee?.employee_id}</span>
          </p>
        </div>

        {/* Quick Actions for Employees with Admin Access */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link 
            href="/portals/admin"
            className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <span className="text-white font-medium">Admin Dashboard</span>
            </div>
            <p className="text-[#64748B] text-sm">Access admin controls and pipeline</p>
          </Link>

          <Link 
            href="/admin/users"
            className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-white font-medium">User Management</span>
            </div>
            <p className="text-[#64748B] text-sm">Approve and manage user accounts</p>
          </Link>

          <Link 
            href="/admin/blog"
            className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-white font-medium">Blog Management</span>
            </div>
            <p className="text-[#64748B] text-sm">Create and manage blog posts</p>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

        {/* Document Status */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Document Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#64748B]" />
                <span className="text-white">Offer Letter</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(employee?.offer_letter_status || '')}`}>
                {employee?.offer_letter_status?.toUpperCase() || 'PENDING'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#64748B]" />
                <span className="text-white">Non-Compete</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(employee?.non_compete_status || '')}`}>
                {employee?.non_compete_status?.toUpperCase() || 'PENDING'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#64748B]" />
                <span className="text-white">NDA</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(employee?.nda_status || '')}`}>
                {employee?.nda_status?.toUpperCase() || 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        {/* Manager Info */}
        {manager && (
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 mb-8">
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

        {/* Tasks */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">My Tasks</h3>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tasks assigned</p>
              <p className="text-sm mt-1">Your tasks will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 10).map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                  <div>
                    <p className="text-white font-medium">{task.title}</p>
                    {task.due_date && (
                      <p className="text-[#64748B] text-sm">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
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
      </div>
    </div>
  )
}
