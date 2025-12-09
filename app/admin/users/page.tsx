'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Check, X, Search } from 'lucide-react'

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string
  userType: string
  status: string
  createdAt: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      
      if (data.error) {
        setError(data.error + (data.details ? `: ${data.details}` : ''))
        setUsers([])
      } else {
        setUsers(data.users || [])
      }
    } catch (err: any) {
      setError('Failed to fetch users: ' + err.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      })
      
      const data = await res.json()
      if (data.success) {
        fetchUsers()
      } else {
        alert('Error: ' + (data.error || 'Unknown error'))
      }
    } catch (err: any) {
      alert('Error updating user: ' + err.message)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.firstName?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (user.lastName?.toLowerCase() || '').includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesType = typeFilter === 'all' || user.userType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const userTypes = [...new Set(users.map(u => u.userType))].filter(Boolean)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Administrator': 'bg-purple-500/20 text-purple-400',
      'Employee': 'bg-blue-500/20 text-blue-400',
      'Referral Partner': 'bg-cyan-500/20 text-cyan-400',
      'Location Partner': 'bg-green-500/20 text-green-400',
      'Channel Partner': 'bg-orange-500/20 text-orange-400',
      'Contractor': 'bg-pink-500/20 text-pink-400',
    }
    return colors[type] || 'bg-gray-500/20 text-gray-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-[#94A3B8] mt-1">Approve and manage user accounts</p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white hover:bg-[#2D3B5F] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
            >
              <option value="all">All Types</option>
              {userTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3B5F]">
                <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase tracking-wider">Signed Up</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
                    No users yet
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-[#2D3B5F] hover:bg-[#2D3B5F]/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.imageUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0EA5E9&color=fff`} 
                          alt="" 
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="text-white font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-[#64748B] text-sm">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(user.userType)}`}>
                        {user.userType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#94A3B8]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.status !== 'approved' && (
                          <button
                            onClick={() => updateUserStatus(user.id, 'approved')}
                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {user.status !== 'rejected' && (
                          <button
                            onClick={() => updateUserStatus(user.id, 'rejected')}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-[#64748B] text-sm">Total Users</div>
          </div>
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
            <div className="text-2xl font-bold text-yellow-400">{users.filter(u => u.status === 'pending').length}</div>
            <div className="text-[#64748B] text-sm">Pending Approval</div>
          </div>
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
            <div className="text-2xl font-bold text-green-400">{users.filter(u => u.status === 'approved').length}</div>
            <div className="text-[#64748B] text-sm">Approved</div>
          </div>
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
            <div className="text-2xl font-bold text-red-400">{users.filter(u => u.status === 'rejected').length}</div>
            <div className="text-[#64748B] text-sm">Rejected</div>
          </div>
        </div>
      </div>
    </div>
  )
}