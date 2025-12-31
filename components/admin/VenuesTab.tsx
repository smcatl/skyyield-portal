'use client'

import { useState, useEffect } from 'react'
import {
  MapPin, Search, RefreshCw, Plus, Edit, Trash2, Eye,
  Building2, Wifi, ChevronDown, ExternalLink, Filter,
  CheckCircle, Clock, AlertCircle, X
} from 'lucide-react'

interface Venue {
  id: string
  venue_id: string
  venue_name: string
  venue_type: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  zip: string
  status: string
  square_footage?: number
  monthly_visitors?: number
  deviceCount: number
  activeDeviceCount: number
  location_partner?: {
    id: string
    partner_id: string
    company_legal_name: string
    dba_name?: string
    contact_email: string
  }
  created_at: string
}

interface VenueStats {
  total: number
  active: number
  trial: number
  pending: number
  inactive: number
}

export default function VenuesTab() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [stats, setStats] = useState<VenueStats>({ total: 0, active: 0, trial: 0, pending: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchVenues()
  }, [statusFilter])

  const fetchVenues = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search) params.append('search', search)

      const res = await fetch(`/api/admin/venues?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setVenues(data.venues || [])
        setStats(data.stats || { total: 0, active: 0, trial: 0, pending: 0, inactive: 0 })
      }
    } catch (error) {
      console.error('Error fetching venues:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchVenues()
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/venues?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        setVenues(venues.filter(v => v.id !== id))
        setShowDeleteConfirm(null)
      } else {
        alert(data.error || 'Failed to delete venue')
      }
    } catch (error) {
      console.error('Error deleting venue:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      trial: 'bg-blue-500/20 text-blue-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      inactive: 'bg-gray-500/20 text-gray-400',
    }
    return styles[status] || 'bg-gray-500/20 text-gray-400'
  }

  const filteredVenues = venues.filter(v => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      v.venue_name?.toLowerCase().includes(searchLower) ||
      v.city?.toLowerCase().includes(searchLower) ||
      v.location_partner?.company_legal_name?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Venues</h2>
          <p className="text-[#94A3B8] text-sm">Manage all partner venues and locations</p>
        </div>
        <button
          onClick={() => { setSelectedVenue(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Venue
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-[#94A3B8] text-sm">Total</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-[#94A3B8] text-sm">Active</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-4 h-4 text-blue-400" />
            <span className="text-[#94A3B8] text-sm">In Trial</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{stats.trial}</div>
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
            <AlertCircle className="w-4 h-4 text-gray-400" />
            <span className="text-[#94A3B8] text-sm">Inactive</span>
          </div>
          <div className="text-2xl font-bold text-gray-400">{stats.inactive}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search venues, cities, partners..."
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
            <option value="active">Active</option>
            <option value="trial">In Trial</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={fetchVenues}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Venues Table */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3B5F]">
                <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Venue</th>
                <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Partner</th>
                <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Location</th>
                <th className="text-center px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Devices</th>
                <th className="text-center px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Status</th>
                <th className="text-right px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading venues...
                  </td>
                </tr>
              ) : filteredVenues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No venues found</p>
                  </td>
                </tr>
              ) : (
                filteredVenues.map((venue) => (
                  <tr key={venue.id} className="border-b border-[#2D3B5F] hover:bg-[#2D3B5F]/30">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-[#0EA5E9]" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{venue.venue_name}</div>
                          <div className="text-[#64748B] text-xs">{venue.venue_id} • {venue.venue_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {venue.location_partner ? (
                        <div>
                          <div className="text-white text-sm">{venue.location_partner.dba_name || venue.location_partner.company_legal_name}</div>
                          <div className="text-[#64748B] text-xs">{venue.location_partner.partner_id}</div>
                        </div>
                      ) : (
                        <span className="text-[#64748B] text-sm">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white text-sm">{venue.city}, {venue.state}</div>
                      <div className="text-[#64748B] text-xs">{venue.address_line_1}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-white font-medium">{venue.activeDeviceCount}/{venue.deviceCount}</div>
                      <div className="text-[#64748B] text-xs">active/total</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(venue.status)}`}>
                        {venue.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedVenue(venue); setShowModal(true) }}
                          className="p-2 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors"
                          title="View/Edit"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(venue.id)}
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
            <h3 className="text-lg font-semibold text-white mb-4">Delete Venue?</h3>
            <p className="text-[#94A3B8] mb-6">
              Are you sure you want to delete this venue? This action cannot be undone.
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
