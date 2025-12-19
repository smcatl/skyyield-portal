'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, Percent, Save, RefreshCw, Search, 
  User, Building, ChevronDown, Check, X, Edit2,
  Calculator, FileText, Send
} from 'lucide-react'

interface Partner {
  id: string
  partner_id: string
  contact_name: string
  email: string
  company_name: string
  partner_type: 'location_partner' | 'referral_partner' | 'channel_partner' | 'relationship_partner'
  tipalti_payee_id: string | null
  tipalti_status: string | null
  commission_structure_type: 'flat_fee' | 'percentage' | 'per_referral' | 'hybrid' | 'none'
  commission_flat_fee_monthly: number
  commission_percentage: number
  commission_per_referral: number
  commission_notes: string | null
  status: string
}

interface Commission {
  id: string
  commission_id: string
  commission_month: string
  recipient_type: string
  partner_id: string
  partner_name: string
  company_name: string
  tipalti_payee_id: string
  commission_amount: number
  calculation_method: string
  calculation_details: string
  revenue_basis: number | null
  payment_status: string
  payment_date: string | null
}

export default function CommissionManagement() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'partners' | 'commissions'>('partners')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [editForm, setEditForm] = useState<Partial<Partner>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load partners with commission info
      const partnersRes = await fetch('/api/admin/commissions/partners')
      const partnersData = await partnersRes.json()
      if (partnersData.success) {
        setPartners(partnersData.partners || [])
      }

      // Load commission records
      const commissionsRes = await fetch('/api/admin/commissions')
      const commissionsData = await commissionsRes.json()
      if (commissionsData.success) {
        setCommissions(commissionsData.commissions || [])
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const savePartnerCommission = async () => {
    if (!editingPartner) return
    setSaving(true)

    try {
      const res = await fetch('/api/admin/commissions/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPartner.id,
          partner_type: editingPartner.partner_type,
          ...editForm
        })
      })

      const data = await res.json()
      if (data.success) {
        loadData()
        setEditingPartner(null)
        setEditForm({})
      } else {
        alert(data.error || 'Failed to save')
      }
    } catch (err) {
      alert('Failed to save commission settings')
    } finally {
      setSaving(false)
    }
  }

  const calculateCommission = async (partnerId: string, partnerType: string, month: string, revenueBasis?: number) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/commissions/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, partnerType, month, revenueBasis })
      })

      const data = await res.json()
      if (data.success) {
        loadData()
        alert(`Commission calculated: $${data.commission.commission_amount}`)
      } else {
        alert(data.error || 'Failed to calculate')
      }
    } catch (err) {
      alert('Failed to calculate commission')
    } finally {
      setSaving(false)
    }
  }

  const getPartnerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      location_partner: 'Location Partner',
      referral_partner: 'Referral Partner',
      channel_partner: 'Channel Partner',
      relationship_partner: 'Relationship Partner'
    }
    return labels[type] || type
  }

  const getPartnerTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      location_partner: 'bg-green-500/20 text-green-400',
      referral_partner: 'bg-blue-500/20 text-blue-400',
      channel_partner: 'bg-purple-500/20 text-purple-400',
      relationship_partner: 'bg-orange-500/20 text-orange-400'
    }
    return colors[type] || 'bg-gray-500/20 text-gray-400'
  }

  const getCommissionDisplay = (partner: Partner) => {
    switch (partner.commission_structure_type) {
      case 'percentage':
        return `${partner.commission_percentage}%`
      case 'flat_fee':
        return `$${partner.commission_flat_fee_monthly}/mo`
      case 'per_referral':
        return `$${partner.commission_per_referral}/ref`
      case 'hybrid':
        return `$${partner.commission_flat_fee_monthly} + ${partner.commission_percentage}%`
      default:
        return 'Not Set'
    }
  }

  const filteredPartners = partners.filter(p => {
    const matchesSearch = !searchTerm || 
      p.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.partner_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || p.partner_type === filterType
    return matchesSearch && matchesType
  })

  const filteredCommissions = commissions.filter(c => {
    const matchesSearch = !searchTerm || 
      c.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Commission Management</h2>
          <p className="text-[#94A3B8] text-sm">Configure partner commissions and track payments</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'partners'
              ? 'bg-[#0EA5E9] text-white'
              : 'bg-[#1A1F3A] text-[#94A3B8] hover:text-white border border-[#2D3B5F]'
          }`}
        >
          Partner Rates
        </button>
        <button
          onClick={() => setActiveTab('commissions')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'commissions'
              ? 'bg-[#0EA5E9] text-white'
              : 'bg-[#1A1F3A] text-[#94A3B8] hover:text-white border border-[#2D3B5F]'
          }`}
        >
          Commission Records
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search partners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>
        {activeTab === 'partners' && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
          >
            <option value="all">All Partner Types</option>
            <option value="location_partner">Location Partners</option>
            <option value="referral_partner">Referral Partners</option>
            <option value="channel_partner">Channel Partners</option>
            <option value="relationship_partner">Relationship Partners</option>
          </select>
        )}
      </div>

      {/* Partner Rates Tab */}
      {activeTab === 'partners' && (
        <div className="space-y-3">
          {loading ? (
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0EA5E9]" />
              <p className="text-[#94A3B8]">Loading partners...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
              <User className="w-12 h-12 mx-auto mb-3 text-[#64748B]" />
              <p className="text-[#94A3B8]">No partners found</p>
            </div>
          ) : (
            filteredPartners.map(partner => (
              <div 
                key={partner.id} 
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4 hover:border-[#0EA5E9]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#2D3B5F] rounded-full flex items-center justify-center">
                      <Building className="w-5 h-5 text-[#94A3B8]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{partner.contact_name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getPartnerTypeColor(partner.partner_type)}`}>
                          {getPartnerTypeLabel(partner.partner_type)}
                        </span>
                      </div>
                      <div className="text-[#64748B] text-sm">
                        {partner.company_name} • {partner.partner_id}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Commission Display */}
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {partner.commission_structure_type === 'percentage' ? (
                          <Percent className="w-4 h-4 text-[#0EA5E9]" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-[#10F981]" />
                        )}
                        <span className="text-white font-semibold text-lg">
                          {getCommissionDisplay(partner)}
                        </span>
                      </div>
                      <div className="text-[#64748B] text-xs">
                        {partner.commission_structure_type === 'percentage' ? 'of revenue' : 
                         partner.commission_structure_type === 'per_referral' ? 'per conversion' :
                         partner.commission_structure_type === 'flat_fee' ? 'monthly' : ''}
                      </div>
                    </div>

                    {/* Tipalti Status */}
                    <div className={`px-2 py-1 rounded text-xs ${
                      partner.tipalti_status === 'active' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {partner.tipalti_payee_id || 'No Tipalti'}
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => { 
                        setEditingPartner(partner)
                        setEditForm({
                          commission_structure_type: partner.commission_structure_type,
                          commission_flat_fee_monthly: partner.commission_flat_fee_monthly,
                          commission_percentage: partner.commission_percentage,
                          commission_per_referral: partner.commission_per_referral,
                          commission_notes: partner.commission_notes
                        })
                      }}
                      className="p-2 text-[#0EA5E9] bg-[#0EA5E9]/10 rounded hover:bg-[#0EA5E9]/20"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Commission Notes */}
                {partner.commission_notes && (
                  <div className="mt-3 pt-3 border-t border-[#2D3B5F]">
                    <p className="text-[#94A3B8] text-sm">{partner.commission_notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Commission Records Tab */}
      {activeTab === 'commissions' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3B5F]">
                <th className="text-left px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Partner</th>
                <th className="text-left px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Month</th>
                <th className="text-left px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Method</th>
                <th className="text-right px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Amount</th>
                <th className="text-center px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Status</th>
                <th className="text-center px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#94A3B8]">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No commission records found</p>
                  </td>
                </tr>
              ) : (
                filteredCommissions.map(comm => (
                  <tr key={comm.id} className="border-t border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{comm.partner_name}</div>
                      <div className="text-[#64748B] text-sm">{comm.company_name}</div>
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8]">
                      {new Date(comm.commission_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[#94A3B8] text-sm">{comm.calculation_details}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[#10F981] font-semibold">${comm.commission_amount.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        comm.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        comm.payment_status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                        comm.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {comm.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {comm.payment_status === 'pending' && (
                        <button className="p-1.5 text-[#0EA5E9] bg-[#0EA5E9]/10 rounded hover:bg-[#0EA5E9]/20">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Commission Modal */}
      {editingPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-[#2D3B5F]">
              <h3 className="text-lg font-semibold text-white">Edit Commission Settings</h3>
              <button
                onClick={() => { setEditingPartner(null); setEditForm({}) }}
                className="p-2 text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Partner Info */}
              <div className="bg-[#1A1F3A] rounded-lg p-3">
                <div className="text-white font-medium">{editingPartner.contact_name}</div>
                <div className="text-[#64748B] text-sm">{editingPartner.company_name} • {editingPartner.partner_id}</div>
              </div>

              {/* Commission Type */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Commission Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'percentage', label: 'Percentage', icon: Percent },
                    { value: 'flat_fee', label: 'Flat Fee', icon: DollarSign },
                    { value: 'per_referral', label: 'Per Referral', icon: User },
                    { value: 'hybrid', label: 'Hybrid', icon: Calculator },
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setEditForm({ ...editForm, commission_structure_type: type.value as any })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        editForm.commission_structure_type === type.value
                          ? 'bg-[#0EA5E9] border-[#0EA5E9] text-white'
                          : 'bg-[#1A1F3A] border-[#2D3B5F] text-[#94A3B8] hover:border-[#0EA5E9]'
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Percentage Input */}
              {(editForm.commission_structure_type === 'percentage' || editForm.commission_structure_type === 'hybrid') && (
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Percentage Rate</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={editForm.commission_percentage || 0}
                      onChange={(e) => setEditForm({ ...editForm, commission_percentage: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 pr-8 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  </div>
                </div>
              )}

              {/* Flat Fee Input */}
              {(editForm.commission_structure_type === 'flat_fee' || editForm.commission_structure_type === 'hybrid') && (
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Monthly Flat Fee</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={editForm.commission_flat_fee_monthly || 0}
                      onChange={(e) => setEditForm({ ...editForm, commission_flat_fee_monthly: parseFloat(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                </div>
              )}

              {/* Per Referral Input */}
              {editForm.commission_structure_type === 'per_referral' && (
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Amount Per Referral</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      type="number"
                      step="25"
                      min="0"
                      value={editForm.commission_per_referral || 0}
                      onChange={(e) => setEditForm({ ...editForm, commission_per_referral: parseFloat(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[#94A3B8] text-sm mb-1">Commission Notes</label>
                <textarea
                  value={editForm.commission_notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, commission_notes: e.target.value })}
                  rows={3}
                  placeholder="Special terms, payment schedule, etc."
                  className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-[#2D3B5F]">
              <button
                onClick={() => { setEditingPartner(null); setEditForm({}) }}
                className="px-4 py-2 text-[#94A3B8] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={savePartnerCommission}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
