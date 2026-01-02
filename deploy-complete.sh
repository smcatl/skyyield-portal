#!/bin/bash
# Run this from your skyyield-portal directory

# ============================================
# 1. Network Import API
# ============================================
mkdir -p app/api/network/import

cat > app/api/network/import/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NETWORK_IMPORT_API_KEY = process.env.NETWORK_IMPORT_API_KEY

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const apiKey = authHeader?.replace('Bearer ', '') || request.headers.get('X-API-Key')
    
    if (!NETWORK_IMPORT_API_KEY || apiKey !== NETWORK_IMPORT_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const records = Array.isArray(body) ? body : body.records || [body]
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const defaultNetwork = searchParams.get('network')?.toUpperCase() || 'SYH'

    const validRecords = records
      .filter((r: any) => r.date && (r.gateway_name || r.mac_address))
      .map((r: any) => {
        const networkType = (r.network_type || defaultNetwork).toUpperCase()
        const isSYH = ['SYH', 'HELIUM', 'HNT'].includes(networkType)
        
        return {
          date: r.date,
          network_type: isSYH ? 'SYH' : 'SYX',
          mac_address: r.mac_address || null,
          gateway_name: r.gateway_name?.trim() || null,
          nas_id: r.nas_id || null,
          site_name: r.site_name || r.site || null,
          data_gb: parseFloat(r.data_gb) || 0,
          rewardable_gb: parseFloat(r.rewardable_gb) || 0,
          sessions: parseInt(r.sessions) || 0,
          subscribers: parseInt(r.subscribers) || 0,
          rewards: parseFloat(r.rewards) || 0,
          poc_rewards: parseFloat(r.poc_rewards || r.poc) || 0,
          total_tokens: parseFloat(r.total_tokens) || (parseFloat(r.rewards) || 0) + (parseFloat(r.poc_rewards || r.poc) || 0),
          usd_value: parseFloat(r.usd_value) || 0,
          raw_data: r,
          imported_at: new Date().toISOString(),
        }
      })

    if (validRecords.length === 0) {
      return NextResponse.json({ error: 'No valid records' }, { status: 400 })
    }

    const { error } = await supabase
      .from('network_device_earnings')
      .upsert(validRecords, { onConflict: 'date,network_type,gateway_name' })

    if (error) {
      console.error('Import error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, imported: validRecords.length })
  } catch (error) {
    console.error('Network import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const apiKey = authHeader?.replace('Bearer ', '') || request.headers.get('X-API-Key')
    
    if (!NETWORK_IMPORT_API_KEY || apiKey !== NETWORK_IMPORT_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: records } = await supabase
      .from('network_device_earnings')
      .select('network_type, usd_value')
      .gte('date', startDate.toISOString().split('T')[0])

    const summary = (records || []).reduce((acc: any, r) => {
      if (!acc[r.network_type]) acc[r.network_type] = { count: 0, usd: 0 }
      acc[r.network_type].count++
      acc[r.network_type].usd += parseFloat(r.usd_value || 0)
      return acc
    }, {})

    const { data: unlinked } = await supabase.rpc('get_unlinked_earnings')

    return NextResponse.json({
      success: true,
      period: `${days} days`,
      byNetwork: summary,
      unlinked: { count: (unlinked || []).length, records: (unlinked || []).slice(0, 10) }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
EOF

echo "✓ Created app/api/network/import/route.ts"

# ============================================
# 2. Admin Analytics API
# ============================================
cat > app/api/admin/analytics/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const now = new Date()
    let startDate: Date
    switch (period) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break
      case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const { data: venueEarnings } = await supabase
      .from('v_earnings_by_venue')
      .select('*')
      .order('total_usd_value', { ascending: false })
      .limit(10)

    const { data: partnerEarnings } = await supabase
      .from('v_earnings_by_partner')
      .select('*')
      .order('total_usd_value', { ascending: false })
      .limit(10)

    const { data: totals } = await supabase
      .from('network_device_earnings')
      .select('network_type, usd_value, data_gb')
      .gte('date', startDate.toISOString().split('T')[0])

    const totalRevenue = (totals || []).reduce((sum, r) => sum + parseFloat(r.usd_value || 0), 0)
    const totalDataGB = (totals || []).reduce((sum, r) => sum + parseFloat(r.data_gb || 0), 0)

    const byNetwork = (totals || []).reduce((acc: any, r) => {
      if (!acc[r.network_type]) acc[r.network_type] = { records: 0, usd: 0, dataGB: 0 }
      acc[r.network_type].records++
      acc[r.network_type].usd += parseFloat(r.usd_value || 0)
      acc[r.network_type].dataGB += parseFloat(r.data_gb || 0)
      return acc
    }, {})

    const { count: venueCount } = await supabase.from('venues').select('*', { count: 'exact', head: true })
    const { count: deviceCount } = await supabase.from('devices').select('*', { count: 'exact', head: true })
    const { data: unlinked } = await supabase.rpc('get_unlinked_earnings')

    return NextResponse.json({
      success: true,
      period,
      stats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalDataGB: Math.round(totalDataGB * 100) / 100,
        totalVenues: venueCount || 0,
        totalDevices: deviceCount || 0,
      },
      venueEarnings: (venueEarnings || []).map(v => ({
        id: v.venue_id,
        name: v.venue_name || 'Unknown Venue',
        earnings: Math.round((v.total_usd_value || 0) * 100) / 100,
        dataGB: Math.round((v.total_data_gb || 0) * 100) / 100,
        network: v.network_type,
      })),
      partnerEarnings: (partnerEarnings || []).map(p => ({
        id: p.partner_id,
        name: p.partner_name || 'Unknown Partner',
        earnings: Math.round((p.total_usd_value || 0) * 100) / 100,
        dataGB: Math.round((p.total_data_gb || 0) * 100) / 100,
        network: p.network_type,
      })),
      networkSummary: {
        totalRecords: (totals || []).length,
        linkedRecords: (totals || []).length - (unlinked || []).length,
        unlinkedRecords: (unlinked || []).length,
        unlinkedSample: (unlinked || []).slice(0, 10).map((u: any) => ({
          identifier: u.gateway_name || u.mac_address,
          network: u.network_type,
          usd: u.total_usd,
        })),
        byNetwork,
      },
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
EOF

echo "✓ Created app/api/admin/analytics/route.ts"

# ============================================
# 3. VenuesTab Component
# ============================================
cat > components/admin/VenuesTab.tsx << 'EOF'
'use client'

import { useState, useEffect } from 'react'
import { Building2, Plus, Search, Edit2, X, Loader2 } from 'lucide-react'
import { FormModal } from './DynamicForm'

interface LocationPartner {
  company_legal_name: string
}

interface Venue {
  id: string
  venue_id: string
  venue_name: string
  city: string
  state: string
  status: string
  device_count: number
  location_partner_id: string
  location_partners?: LocationPartner
  helium_gateway_name: string | null
  helium_nas_id: string | null
}

export default function VenuesTab() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showFormModal, setShowFormModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    venue_name: '',
    city: '',
    state: '',
    status: 'pending',
    location_partner_id: '',
    helium_gateway_name: '',
    helium_nas_id: '',
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
    } catch (err) {
      console.error('Failed to fetch venues:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/admin/partners')
      const data = await res.json()
      if (data.partners) setPartners(data.partners)
    } catch (err) {
      console.error('Failed to fetch partners:', err)
    }
  }

  const stats = {
    total: venues.length,
    active: venues.filter(v => v.status === 'active').length,
    trial: venues.filter(v => v.status === 'trial').length,
    pending: venues.filter(v => v.status === 'pending').length,
    withHelium: venues.filter(v => v.helium_gateway_name).length,
  }

  const filteredVenues = venues.filter(v =>
    v.venue_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.venue_id?.toLowerCase().includes(search.toLowerCase()) ||
    v.city?.toLowerCase().includes(search.toLowerCase()) ||
    v.helium_gateway_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.location_partners?.company_legal_name?.toLowerCase().includes(search.toLowerCase())
  )

  const openEditModal = (venue: Venue) => {
    setEditingVenue(venue)
    setFormData({
      venue_name: venue.venue_name || '',
      city: venue.city || '',
      state: venue.state || '',
      status: venue.status || 'pending',
      location_partner_id: venue.location_partner_id || '',
      helium_gateway_name: venue.helium_gateway_name || '',
      helium_nas_id: venue.helium_nas_id || '',
    })
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!editingVenue) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/venues', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingVenue.id, ...formData })
      })
      if (res.ok) {
        setShowEditModal(false)
        fetchVenues()
      }
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleFormSuccess = () => {
    setShowFormModal(false)
    fetchVenues()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'trial': return 'bg-blue-500/20 text-blue-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'inactive': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Venues</h2>
          <p className="text-[#94A3B8] text-sm">Manage partner locations</p>
        </div>
        <button onClick={() => setShowFormModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">
          <Plus className="w-4 h-4" />Add Venue
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-[#64748B] text-sm">Total</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          <div className="text-[#64748B] text-sm">Active</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-400">{stats.trial}</div>
          <div className="text-[#64748B] text-sm">Trial</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-[#64748B] text-sm">Pending</div>
        </div>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-400">{stats.withHelium}</div>
          <div className="text-[#64748B] text-sm">With Helium</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#64748B]" />
        <input type="text" placeholder="Search venues, gateway names, partners..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]" />
      </div>

      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0A0F2C]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Venue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Partner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Helium Gateway</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Devices</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#64748B] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin mx-auto" /></td></tr>
            ) : filteredVenues.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">No venues found</td></tr>
            ) : filteredVenues.map((venue) => (
              <tr key={venue.id} className="border-b border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                <td className="px-6 py-4">
                  <div className="text-white font-medium">{venue.venue_name}</div>
                  <div className="text-[#64748B] text-xs">{venue.venue_id}</div>
                </td>
                <td className="px-6 py-4 text-[#94A3B8]">{venue.location_partners?.company_legal_name || 'N/A'}</td>
                <td className="px-6 py-4 text-[#94A3B8]">{venue.city}, {venue.state}</td>
                <td className="px-6 py-4">
                  {venue.helium_gateway_name ? (
                    <span className="text-purple-400 text-sm">{venue.helium_gateway_name}</span>
                  ) : (
                    <span className="text-[#64748B] text-sm">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-[#94A3B8]">{venue.device_count || 0}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(venue.status)}`}>{venue.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEditModal(venue)} className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormModal slug="venue-onboarding" isOpen={showFormModal} onClose={() => setShowFormModal(false)} onSuccess={handleFormSuccess} />

      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2D3B5F]">
              <h3 className="text-lg font-semibold text-white">Edit Venue</h3>
              <button onClick={() => setShowEditModal(false)} className="text-[#64748B] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Venue Name</label>
                <input type="text" value={formData.venue_name} onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Location Partner</label>
                <select value={formData.location_partner_id} onChange={(e) => setFormData({ ...formData, location_partner_id: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]">
                  <option value="">Select Partner</option>
                  {partners.map(p => (<option key={p.id} value={p.id}>{p.company_legal_name || p.dba_name || `${p.contact_first_name} ${p.contact_last_name}`}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">City</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" />
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">State</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" />
                </div>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg space-y-4">
                <div className="text-purple-400 text-sm font-medium">Helium (SYH) Configuration</div>
                <p className="text-[#64748B] text-xs">If this venue uses Helium, add the 3-word gateway name to link earnings.</p>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">3-Word Gateway Name</label>
                  <input type="text" value={formData.helium_gateway_name} onChange={(e) => setFormData({ ...formData, helium_gateway_name: e.target.value })} placeholder="e.g., Quaint Lilac Cougar" className="w-full px-4 py-2 bg-[#0A0F2C] border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Helium NAS ID (Optional)</label>
                  <input type="text" value={formData.helium_nas_id} onChange={(e) => setFormData({ ...formData, helium_nas_id: e.target.value })} placeholder="e.g., 0c:ea:14:fc:3f:d9" className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white font-mono focus:outline-none focus:border-[#0EA5E9]" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]">
                  <option value="pending">Pending</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#2D3B5F]">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-[#94A3B8] hover:text-white">Cancel</button>
              <button onClick={handleEditSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
EOF

echo "✓ Created components/admin/VenuesTab.tsx"

# ============================================
# 4. Done - show next steps
# ============================================
echo ""
echo "============================================"
echo "✓ All files created!"
echo "============================================"
echo ""
echo "Now run:"
echo ""
echo "  git add ."
echo "  git commit -m 'Add network earnings API and venue Helium fields'"
echo "  git push"
echo ""
echo "Then in Vercel, add environment variable:"
echo "  NETWORK_IMPORT_API_KEY = $(openssl rand -hex 32)"
echo ""
