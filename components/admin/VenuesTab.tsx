'use client'

import { useState, useEffect } from 'react'
import { Building2, MapPin, Plus, Search, Edit2, X, Loader2 } from 'lucide-react'

interface Partner {
  id: string
  partner_id: string
  company_legal_name: string
  contact_first_name: string
  contact_last_name: string
  pipeline_stage: string
}

interface Venue {
  id: string
  venue_id: string
  venue_name: string
  venue_type: string
  city: string
  state: string
  status: string
  device_count?: number
  location_partner_id?: string
  location_partners?: {
    id: string
    partner_id: string
    company_legal_name: string
    contact_first_name: string
    contact_last_name: string
  }
}

export default function VenuesTab() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    venue_name: '',
    venue_type: '',
    address_line_1: '',
    city: '',
    state: '',
    zip: '',
    location_partner_id: '',
    status: 'pending',
  })

  useEffect(() => { 
    fetchVenues()
    fetchPartners()
  }, [])

  const fetchVenues = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/venues')
      const data = await res.json()
      if (data.venues) setVenues(data.venues)
    } catch (err) { console.error('Failed to fetch venues:', err) }
    finally { setLoading(false) }
  }

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/pipeline/partners?type=location_partner')
      const data = await res.json()
      if (data.partners) {
        setPartners(data.partners.filter((p: Partner) => 
          ['active', 'trial_active', 'trial_ending', 'loi_signed', 'install_scheduled'].includes(p.pipeline_stage)
        ))
      }
    } catch (err) { console.error('Failed to fetch partners:', err) }
  }

  const stats = {
    total: venues.length,
    active: venues.filter(v => v.status === 'active').length,
    trial: venues.filter(v => v.status === 'trial').length,
    pending: venues.filter(v => v.status === 'pending').length,
    inactive: venues.filter(v => v.status === 'inactive').length,
  }

  const filteredVenues = venues.filter(v => 
    v.venue_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.city?.toLowerCase().includes(search.toLowerCase()) ||
    v.venue_id?.toLowerCase().includes(search.toLowerCase()) ||
    v.location_partners?.company_legal_name?.toLowerCase().includes(search.toLowerCase())
  )

  const openAddModal = () => {
    setEditingVenue(null)
    setFormData({ venue_name: '', venue_type: '', address_line_1: '', city: '', state: '', zip: '', location_partner_id: '', status: 'pending' })
    setShowModal(true)
  }

  const openEditModal = (venue: Venue) => {
    setEditingVenue(venue)
    setFormData({ 
      venue_name: venue.venue_name || '', 
      venue_type: venue.venue_type || '', 
      address_line_1: '', 
      city: venue.city || '', 
      state: venue.state || '', 
      zip: '', 
      location_partner_id: venue.location_partner_id || '',
      status: venue.status || 'pending',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const method = editingVenue ? 'PUT' : 'POST'
      const body = editingVenue ? { id: editingVenue.id, ...formData } : formData
      const res = await fetch('/api/admin/venues', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { setShowModal(false); fetchVenues() }
    } catch (err) { console.error('Save failed:', err) }
    finally { setSaving(false) }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'trial': return 'bg-blue-500/20 text-blue-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Venues</h2>
          <p className="text-[#94A3B8] text-sm">Manage partner venues and locations</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">
          <Plus className="w-4 h-4" />Add Venue
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Active', value: stats.active, color: 'text-green-400' },
          { label: 'Trial', value: stats.trial, color: 'text-blue-400' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Inactive', value: stats.inactive, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[#64748B] text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
        <input type="text" placeholder="Search venues or partners..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]" />
      </div>

      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2D3B5F]">
              <th className="text-left px-6 py-4 text-[#64748B] text-sm font-medium">Venue</th>
              <th className="text-left px-6 py-4 text-[#64748B] text-sm font-medium">Partner</th>
              <th className="text-left px-6 py-4 text-[#64748B] text-sm font-medium">Location</th>
              <th className="text-left px-6 py-4 text-[#64748B] text-sm font-medium">Devices</th>
              <th className="text-left px-6 py-4 text-[#64748B] text-sm font-medium">Status</th>
              <th className="text-right px-6 py-4 text-[#64748B] text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin mx-auto" /></td></tr>
            ) : filteredVenues.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">No venues found</td></tr>
            ) : filteredVenues.map((venue) => (
              <tr key={venue.id} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                <td className="px-6 py-4"><div className="text-white font-medium">{venue.venue_name}</div><div className="text-[#64748B] text-xs">{venue.venue_id}</div></td>
                <td className="px-6 py-4 text-[#94A3B8]">{venue.location_partners?.company_legal_name || 'N/A'}</td>
                <td className="px-6 py-4 text-[#94A3B8]">{venue.city}, {venue.state}</td>
                <td className="px-6 py-4 text-[#94A3B8]">{venue.device_count || 0}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(venue.status)}`}>{venue.status}</span></td>
                <td className="px-6 py-4 text-right"><button onClick={() => openEditModal(venue)} className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded"><Edit2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2D3B5F]">
              <h3 className="text-lg font-semibold text-white">{editingVenue ? 'Edit Venue' : 'Add Venue'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Location Partner *</label>
                <select value={formData.location_partner_id} onChange={(e) => setFormData({ ...formData, location_partner_id: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]">
                  <option value="">Select Partner...</option>
                  {partners.map(p => (<option key={p.id} value={p.id}>{p.company_legal_name} ({p.contact_first_name} {p.contact_last_name})</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Venue Name *</label>
                <input type="text" value={formData.venue_name} onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Address</label>
                <input type="text" value={formData.address_line_1} onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm text-[#94A3B8] mb-1">City *</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" /></div>
                <div><label className="block text-sm text-[#94A3B8] mb-1">State *</label><input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" maxLength={2} /></div>
                <div><label className="block text-sm text-[#94A3B8] mb-1">ZIP</label><input type="text" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-[#94A3B8] mb-1">Venue Type</label><select value={formData.venue_type} onChange={(e) => setFormData({ ...formData, venue_type: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"><option value="">Select type...</option><option value="salon">Salon Suite</option><option value="cafe">Cafe/Coffee Shop</option><option value="restaurant">Restaurant</option><option value="retail">Retail</option><option value="gym">Gym/Fitness</option><option value="office">Office</option><option value="other">Other</option></select></div>
                <div><label className="block text-sm text-[#94A3B8] mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"><option value="pending">Pending</option><option value="active">Active</option><option value="trial">Trial</option><option value="inactive">Inactive</option></select></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#2D3B5F]">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-[#94A3B8] hover:text-white">Cancel</button>
              <button onClick={handleSave} disabled={saving || !formData.venue_name || !formData.city || !formData.state || !formData.location_partner_id} className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
