'use client'

import { useState, useEffect } from 'react'
import { Wifi, Plus, Search, Edit2, X, Loader2 } from 'lucide-react'

interface Venue {
  id: string
  venue_id: string
  venue_name: string
  city: string
  state: string
  location_partner_id: string
  location_partners?: { company_legal_name: string }
}

interface Device {
  id: string
  device_id: string
  device_name: string
  device_type: string
  serial_number: string
  mac_address: string
  status: string
  venue_id: string
  venues?: { id: string; venue_id: string; venue_name: string; city: string; state: string; location_partner_id: string; location_partners?: { company_legal_name: string } }
}

export default function DevicesTab() {
  const [devices, setDevices] = useState<Device[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ device_name: '', device_type: 'access_point', serial_number: '', mac_address: '', venue_id: '', status: 'pending' })

  useEffect(() => { fetchDevices(); fetchVenues() }, [])

  const fetchDevices = async () => {
    setLoading(true)
    try { const res = await fetch('/api/admin/devices'); const data = await res.json(); if (data.devices) setDevices(data.devices) }
    catch (err) { console.error('Failed to fetch devices:', err) }
    finally { setLoading(false) }
  }

  const fetchVenues = async () => {
    try { const res = await fetch('/api/admin/venues'); const data = await res.json(); if (data.venues) setVenues(data.venues) }
    catch (err) { console.error('Failed to fetch venues:', err) }
  }

  const stats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online' || d.status === 'active').length,
    offline: devices.filter(d => d.status === 'offline').length,
    pending: devices.filter(d => d.status === 'pending').length,
    unassigned: devices.filter(d => !d.venue_id).length,
  }

  const filteredDevices = devices.filter(d => d.device_name?.toLowerCase().includes(search.toLowerCase()) || d.device_id?.toLowerCase().includes(search.toLowerCase()) || d.serial_number?.toLowerCase().includes(search.toLowerCase()) || d.mac_address?.toLowerCase().includes(search.toLowerCase()) || d.venues?.venue_name?.toLowerCase().includes(search.toLowerCase()) || d.venues?.location_partners?.company_legal_name?.toLowerCase().includes(search.toLowerCase()))

  const openAddModal = () => { setEditingDevice(null); setFormData({ device_name: '', device_type: 'access_point', serial_number: '', mac_address: '', venue_id: '', status: 'pending' }); setShowModal(true) }
  const openEditModal = (device: Device) => { setEditingDevice(device); setFormData({ device_name: device.device_name || '', device_type: device.device_type || 'access_point', serial_number: device.serial_number || '', mac_address: device.mac_address || '', venue_id: device.venue_id || '', status: device.status || 'pending' }); setShowModal(true) }

  const handleSave = async () => {
    setSaving(true)
    try { const method = editingDevice ? 'PUT' : 'POST'; const body = editingDevice ? { id: editingDevice.id, ...formData } : formData; const res = await fetch('/api/admin/devices', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (res.ok) { setShowModal(false); fetchDevices() } }
    catch (err) { console.error('Save failed:', err) }
    finally { setSaving(false) }
  }

  const getStatusColor = (status: string) => { switch (status) { case 'online': case 'active': return 'bg-green-500/20 text-green-400'; case 'offline': return 'bg-red-500/20 text-red-400'; case 'pending': return 'bg-yellow-500/20 text-yellow-400'; default: return 'bg-gray-500/20 text-gray-400' } }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold text-white">Devices</h2><p className="text-[#94A3B8] text-sm">Manage deployed network devices</p></div>
        <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"><Plus className="w-4 h-4" />Add Device</button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[{ label: 'Total', value: stats.total, color: 'text-white' }, { label: 'Online', value: stats.online, color: 'text-green-400' }, { label: 'Offline', value: stats.offline, color: 'text-red-400' }, { label: 'Pending', value: stats.pending, color: 'text-yellow-400' }, { label: 'Unassigned', value: stats.unassigned, color: 'text-orange-400' }].map(s => (
          <div key={s.label} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg p-4"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-[#64748B] text-sm">{s.label}</div></div>
        ))}
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" /><input type="text" placeholder="Search devices, venues, or partners..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]" /></div>

      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-[#2D3B5F]"><th className="text-left px-6 py-4 text-[#64748B] text-sm font-medium">Device</th><th className="text-left px-6 py-4 text-[#64748B] text-sm font-medium">Serial / MAC</th><th className="text-left px-6 py-4 text-[#64748B] text-sm font-medium">Venue</th><th className="text-left px-6 py-4 text-[#64748B] text-sm font-medium">Partner</th><th className="text-left px-6 py-4 text-[#64748B] text-sm font-medium">Status</th><th className="text-right px-6 py-4 text-[#64748B] text-sm font-medium">Actions</th></tr></thead>
          <tbody>
            {loading ? (<tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin mx-auto" /></td></tr>
            ) : filteredDevices.length === 0 ? (<tr><td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">No devices found</td></tr>
            ) : filteredDevices.map((device) => (
              <tr key={device.id} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center"><Wifi className="w-5 h-5 text-purple-400" /></div><div><div className="text-white font-medium">{device.device_name || device.device_type}</div><div className="text-[#64748B] text-xs">{device.device_id}</div></div></div></td>
                <td className="px-6 py-4"><div className="text-[#94A3B8]">{device.serial_number || '-'}</div><div className="text-[#64748B] text-xs font-mono">{device.mac_address || '-'}</div></td>
                <td className="px-6 py-4 text-[#94A3B8]">{device.venues?.venue_name || 'Unassigned'}</td>
                <td className="px-6 py-4 text-[#94A3B8]">{device.venues?.location_partners?.company_legal_name || 'N/A'}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(device.status)}`}>{device.status}</span></td>
                <td className="px-6 py-4 text-right"><button onClick={() => openEditModal(device)} className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded"><Edit2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2D3B5F]"><h3 className="text-lg font-semibold text-white">{editingDevice ? 'Edit Device' : 'Add Device'}</h3><button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm text-[#94A3B8] mb-1">Assign to Venue</label><select value={formData.venue_id} onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"><option value="">Unassigned</option>{venues.map(v => (<option key={v.id} value={v.id}>{v.venue_name} - {v.location_partners?.company_legal_name || 'No Partner'} ({v.city}, {v.state})</option>))}</select></div>
              <div><label className="block text-sm text-[#94A3B8] mb-1">Device Name</label><input type="text" value={formData.device_name} onChange={(e) => setFormData({ ...formData, device_name: e.target.value })} placeholder="e.g., Lobby AP, Main Gateway" className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm text-[#94A3B8] mb-1">Serial Number</label><input type="text" value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" /></div><div><label className="block text-sm text-[#94A3B8] mb-1">MAC Address</label><input type="text" value={formData.mac_address} onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })} placeholder="AA:BB:CC:DD:EE:FF" className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white font-mono focus:outline-none focus:border-[#0EA5E9]" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm text-[#94A3B8] mb-1">Device Type</label><select value={formData.device_type} onChange={(e) => setFormData({ ...formData, device_type: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"><option value="access_point">Access Point</option><option value="gateway">Gateway</option><option value="switch">Switch</option><option value="router">Router</option></select></div><div><label className="block text-sm text-[#94A3B8] mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"><option value="pending">Pending</option><option value="online">Online</option><option value="offline">Offline</option><option value="active">Active</option></select></div></div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#2D3B5F]"><button onClick={() => setShowModal(false)} className="px-4 py-2 text-[#94A3B8] hover:text-white">Cancel</button><button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
