'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, Users, Building2, Wrench, ExternalLink, Copy, Check, 
  Eye, Clock, CheckCircle, XCircle, Filter, Search, RefreshCw,
  ChevronDown, MoreHorizontal, Mail, Phone, MapPin, Calendar
} from 'lucide-react'

type ApplicationType = 'all' | 'location_partner' | 'referral_partner' | 'contractor'
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

interface Application {
  id: string
  type: 'location_partner' | 'referral_partner' | 'contractor'
  name: string
  email: string
  phone: string
  company?: string
  city: string
  state: string
  status: string
  stage: string
  created_at: string
}

export default function AdminFormsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<ApplicationType>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://portal.skyyield.io'

  const formLinks = [
    {
      id: 'location-partner',
      name: 'Location Partner Application',
      description: 'For venue owners interested in WiFi monetization',
      url: `${BASE_URL}/apply/location-partner`,
      icon: Building2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      id: 'referral-partner',
      name: 'Referral Partner Application',
      description: 'For individuals/companies referring businesses',
      url: `${BASE_URL}/apply/referral-partner`,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      id: 'contractor',
      name: 'Contractor Application',
      description: 'For installation professionals',
      url: `${BASE_URL}/apply/contractor`,
      icon: Wrench,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
  ]

  useEffect(() => {
    fetchApplications()
  }, [typeFilter, statusFilter])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const results: Application[] = []

      // Fetch Location Partners
      if (typeFilter === 'all' || typeFilter === 'location_partner') {
        const lpRes = await fetch('/api/pipeline/partners?stage=application')
        if (lpRes.ok) {
          const lpData = await lpRes.json()
          lpData.partners?.forEach((p: any) => {
            results.push({
              id: p.id,
              type: 'location_partner',
              name: p.contact_name || 'Unknown',
              email: p.email || '',
              phone: p.phone || '',
              company: p.company_name,
              city: p.city || '',
              state: p.state || '',
              status: p.status || 'pending',
              stage: p.stage || 'application',
              created_at: p.created_at,
            })
          })
        }
      }

      // Fetch Referral Partners
      if (typeFilter === 'all' || typeFilter === 'referral_partner') {
        const rpRes = await fetch('/api/pipeline/referral-partners?stage=application')
        if (rpRes.ok) {
          const rpData = await rpRes.json()
          rpData.partners?.forEach((p: any) => {
            results.push({
              id: p.id,
              type: 'referral_partner',
              name: p.contact_full_name || 'Unknown',
              email: p.contact_email || '',
              phone: p.contact_phone || '',
              company: p.company_name,
              city: p.city || '',
              state: p.state || '',
              status: p.status || 'pending',
              stage: p.pipeline_stage || 'application',
              created_at: p.created_at,
            })
          })
        }
      }

      // Fetch Contractors
      if (typeFilter === 'all' || typeFilter === 'contractor') {
        const cRes = await fetch('/api/pipeline/contractors?stage=application')
        if (cRes.ok) {
          const cData = await cRes.json()
          cData.contractors?.forEach((c: any) => {
            results.push({
              id: c.id,
              type: 'contractor',
              name: c.contact_full_name || c.legal_name || 'Unknown',
              email: c.contact_email || '',
              phone: c.contact_phone || '',
              company: c.legal_name,
              city: c.city || '',
              state: c.state || '',
              status: c.status || 'pending',
              stage: c.pipeline_stage || 'application',
              created_at: c.created_at,
            })
          })
        }
      }

      // Sort by date
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Filter by status
      const filtered = statusFilter === 'all' 
        ? results 
        : results.filter(a => a.status === statusFilter)

      setApplications(filtered)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedLink(id)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const updateApplicationStatus = async (app: Application, newStatus: string) => {
    const endpoint = app.type === 'location_partner' 
      ? '/api/pipeline/partners'
      : app.type === 'referral_partner'
      ? '/api/pipeline/referral-partners'
      : '/api/pipeline/contractors'

    const updateField = app.type === 'location_partner' 
      ? { id: app.id, status: newStatus, initial_review_status: newStatus }
      : { id: app.id, status: newStatus }

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateField),
      })

      if (res.ok) {
        fetchApplications()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.name.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query) ||
      app.company?.toLowerCase().includes(query) ||
      app.city.toLowerCase().includes(query)
    )
  })

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'location_partner': return 'Location Partner'
      case 'referral_partner': return 'Referral Partner'
      case 'contractor': return 'Contractor'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'location_partner': return 'bg-blue-400/20 text-blue-400'
      case 'referral_partner': return 'bg-green-400/20 text-green-400'
      case 'contractor': return 'bg-orange-400/20 text-orange-400'
      default: return 'bg-gray-400/20 text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-400/20 text-yellow-400'
      case 'approved': return 'bg-green-400/20 text-green-400'
      case 'rejected': return 'bg-red-400/20 text-red-400'
      default: return 'bg-gray-400/20 text-gray-400'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Application Forms</h1>
          <p className="text-[#94A3B8]">Manage application links and review submissions</p>
        </div>
        <button
          onClick={fetchApplications}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F] transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Form Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {formLinks.map((form) => (
          <div
            key={form.id}
            className="bg-[#0F1629] border border-[#2D3B5F] rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${form.bgColor}`}>
                <form.icon className={`w-6 h-6 ${form.color}`} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(form.url, form.id)}
                  className="p-2 text-[#64748B] hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
                  title="Copy link"
                >
                  {copiedLink === form.id ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={form.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-[#64748B] hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
                  title="Open form"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <h3 className="text-white font-semibold mb-1">{form.name}</h3>
            <p className="text-[#64748B] text-sm mb-3">{form.description}</p>
            <div className="flex items-center gap-2 text-xs text-[#64748B] bg-[#1E293B] rounded-lg px-3 py-2 overflow-hidden">
              <span className="truncate">{form.url}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-[#0F1629] border border-[#2D3B5F] rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#64748B]" />
          <span className="text-[#94A3B8] text-sm">Filter:</span>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ApplicationType)}
          className="px-3 py-2 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">All Types</option>
          <option value="location_partner">Location Partners</option>
          <option value="referral_partner">Referral Partners</option>
          <option value="contractor">Contractors</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications..."
              className="w-full pl-10 pr-4 py-2 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>
        </div>

        <div className="text-[#64748B] text-sm">
          {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-[#0F1629] border border-[#2D3B5F] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3B5F]">
                <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-4">Applicant</th>
                <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-4">Type</th>
                <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-4">Location</th>
                <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-4">Date</th>
                <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3B5F]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading applications...
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No applications found
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={`${app.type}-${app.id}`} className="hover:bg-[#1E293B]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">{app.name}</div>
                        {app.company && app.company !== app.name && (
                          <div className="text-[#64748B] text-sm">{app.company}</div>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#64748B]">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {app.email}
                          </span>
                          {app.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {app.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getTypeColor(app.type)}`}>
                        {getTypeLabel(app.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-[#94A3B8] text-sm">
                        <MapPin className="w-3 h-3" />
                        {app.city}{app.state ? `, ${app.state}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-[#64748B] text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateApplicationStatus(app, 'approved')}
                              className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(app, 'rejected')}
                              className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          className="p-2 text-[#64748B] hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
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
    </div>
  )
}
