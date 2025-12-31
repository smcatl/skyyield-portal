'use client'

import { useState, useEffect } from 'react'
import {
  Cpu, Search, RefreshCw, Plus, Edit, Trash2, Eye,
  Wifi, WifiOff, CheckCircle, Clock, AlertCircle, X,
  MapPin, Building2, Filter, ChevronDown
} from 'lucide-react'

interface Device {
  id: string
  device_id: string
  device_name: string
  device_type: string
  serial_number: string
  mac_address: string
  status: string
  ownership: string
  firmware_version?: string
  last_seen_at?: string
  data_usage_gb?: number
  monthly_earnings?: number
  venue?: {
    id: string
    venue_id: string
    venue_name: string
    city: string
    state: string
    location_partner?: {
      id: string
      partner_id: string
      company_legal_name: string
      dba_name?: string
    }
  }
  product?: {
    id: string
    name: string
    sku: string
    manufacturer: string
  }
  created_at: string
}

interface DeviceStats {
  total: number
  active: number
  offline: number
  pending: number
  unassigned: number
}

export default function DevicesTab() {
  const [devices, setDevices] = useState<Device[]>([])
  const [stats, setStats] = useState<DeviceStats>({ total: 0, active: 0, offline: 0, pending: 0, unassigned: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchDevices()
  }, [statusFilter])

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search) params.append('search', search)

      const res = await fetch(`/api/admin/devices?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setDevices(data.devices || [])
        setStats(data.stats || { total: 0, active: 0, offline: 0, pending: 0, unassigned: 0 })
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchDevices()
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/devices?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        setDevices(devices.filter(d => d.id !== id))
        setShowDeleteConfirm(null)
      } else {
        alert(data.error || 'Failed to delete device')
      }
    } catch (error) {
      console.error('Error deleting device:', error)
    }
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedDevices.size === 0) return

    try {
      const res = await fetch('/api/admin/devices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceIds: Array.from(selectedDevices),
          updates: { status: newStatus },
        }),
      })
      const data = await res.json()
      
      if (data.success) {
        fetchDevices()
        setSelectedDevices(new Set())
        setShowBulkActions(false)
      }
    } catch (error) {
      console.error('Error updating devices:', error)
    }
  }

  const toggleSelectDevice = (id: string) => {
    const newSelected = new Set(selectedDevices)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedDevices(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedDevices.size === devices.length) {
      setSelectedDevices(new Set())
    } else {
      setSelectedDevices(new Set(devices.map(d => d.id)))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'online':
        return <Wifi className="w-4 h-4 text-green-400" />
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-400" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      online: 'bg-green-500/20 text-green-400',
      offline: 'bg-red-500/20 text-red-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      inactive: 'bg-gray-500/20 text-gray-400',
    }
    return styles[status] || 'bg-gray-500/20 text-gray-400'
  }

  const filteredDevices = devices.filter(d => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      d.device_name?.toLowerCase().includes(searchLower) ||
      d.serial_number?.toLowerCase().includes(searchLower) ||
      d.mac_address?.toLowerCase().includes(searchLower) ||
      d.venue?.venue_name?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Devices</h2>
          <p className="text-[#94A3B8] text-sm">Manage all deployed devices and equipment</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
          <Plus className="w-4 h-4" />
          Add Device
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-[#94A3B8] text-sm">Total</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-[#94A3B8] text-sm">Online</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-[#94A3B8] text-sm">Offline</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{stats.offline}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-[#94A3B8] text-sm">Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <span className="text-[#94A3B8] text-sm">Unassigned</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">{stats.unassigned}</div>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search devices, serial numbers, MAC addresses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
          >
            <option value="all">All Status</option>
            <option value="active">Online</option>
            <option value="offline">Offline</option>
            <option value="pending">Pending</option>
          </select>
          
          {selectedDevices.size > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
              >
                Bulk Actions ({selectedDevices.size})
                <ChevronDown className="w-4 h-4" />
              </button>
              {showBulkActions && (
                <div className="absolute right-0 top-full mt-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg shadow-xl z-10 min-w-[160px]">
                  <button
                    onClick={() => handleBulkStatusUpdate('active')}
                    className="w-full px-4 py-2 text-left text-white hover:bg-[#2D3B5F] flex items-center gap-2"
                  >
                    <Wifi className="w-4 h-4 text-green-400" />
                    Set Online
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('offline')}
                    className="w-full px-4 py-2 text-left text-white hover:bg-[#2D3B5F] flex items-center gap-2"
                  >
                    <WifiOff className="w-4 h-4 text-red-400" />
                    Set Offline
                  </button>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3B5F]">
                <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8]">
                  <input
                    type="checkbox"
                    checked={selectedDevices.size === devices.length && devices.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-[#2D3B5F] bg-[#0A0F2C] text-[#0EA5E9] focus:ring-[#0EA5E9]"
                  />
                </th>
                <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Device</th>
                <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Venue</th>
                <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Partner</th>
                <th className="text-center px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Status</th>
                <th className="text-right px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Last Seen</th>
                <th className="text-right px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading devices...
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">
                    <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No devices found</p>
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="border-b border-[#2D3B5F] hover:bg-[#2D3B5F]/30">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedDevices.has(device.id)}
                        onChange={() => toggleSelectDevice(device.id)}
                        className="rounded border-[#2D3B5F] bg-[#0A0F2C] text-[#0EA5E9] focus:ring-[#0EA5E9]"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                          {getStatusIcon(device.status)}
                        </div>
                        <div>
                          <div className="text-white font-medium">{device.device_name || device.serial_number}</div>
                          <div className="text-[#64748B] text-xs font-mono">{device.mac_address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {device.venue ? (
                        <div>
                          <div className="text-white text-sm">{device.venue.venue_name}</div>
                          <div className="text-[#64748B] text-xs">{device.venue.city}, {device.venue.state}</div>
                        </div>
                      ) : (
                        <span className="text-orange-400 text-sm">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {device.venue?.location_partner ? (
                        <div>
                          <div className="text-white text-sm">{device.venue.location_partner.dba_name || device.venue.location_partner.company_legal_name}</div>
                          <div className="text-[#64748B] text-xs">{device.venue.location_partner.partner_id}</div>
                        </div>
                      ) : (
                        <span className="text-[#64748B] text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {device.last_seen_at ? (
                        <div className="text-[#94A3B8] text-sm">
                          {new Date(device.last_seen_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-[#64748B] text-sm">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-2 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors"
                          title="View/Edit"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(device.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Device?</h3>
            <p className="text-[#94A3B8] mb-6">
              Are you sure you want to delete this device? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
