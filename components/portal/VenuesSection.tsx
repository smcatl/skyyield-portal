'use client'

import { useState } from 'react'
import { 
  Building2, MapPin, Wifi, Activity, TrendingUp, 
  ChevronRight, CheckCircle, AlertCircle, Clock,
  BarChart3, Users, Zap
} from 'lucide-react'

interface Venue {
  id: string
  name: string
  address: string
  city: string
  state: string
  type: string
  status: 'active' | 'trial' | 'pending' | 'inactive'
  
  // Stats
  devicesInstalled?: number
  dataUsageGB?: number
  monthlyEarnings?: number
  uniqueConnections?: number
  
  // Trial info
  trialStartDate?: string
  trialEndDate?: string
  trialDaysRemaining?: number
  
  // Install info
  installDate?: string
  lastMaintenanceDate?: string
}

interface VenuesSectionProps {
  venues: Venue[]
  loading?: boolean
  title?: string
  onViewDetails?: (venueId: string) => void
  onAddVenue?: () => void
}

export default function VenuesSection({
  venues,
  loading = false,
  title = 'My Venues',
  onViewDetails,
  onAddVenue,
}: VenuesSectionProps) {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'trial': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const activeVenues = venues.filter(v => v.status === 'active')
  const trialVenues = venues.filter(v => v.status === 'trial')
  const totalEarnings = venues.reduce((sum, v) => sum + (v.monthlyEarnings || 0), 0)
  const totalDataUsage = venues.reduce((sum, v) => sum + (v.dataUsageGB || 0), 0)

  return (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl">
      {/* Header */}
      <div className="p-4 border-b border-[#2D3B5F]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {onAddVenue && (
            <button
              onClick={onAddVenue}
              className="px-3 py-1.5 bg-[#0EA5E9] text-white rounded-lg text-sm hover:bg-[#0EA5E9]/80 transition-colors"
            >
              + Add Venue
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#0A0F2C] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{venues.length}</div>
            <div className="text-[#64748B] text-xs">Total</div>
          </div>
          <div className="bg-[#0A0F2C] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-400">{activeVenues.length}</div>
            <div className="text-[#64748B] text-xs">Active</div>
          </div>
          <div className="bg-[#0A0F2C] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-[#0EA5E9]">{totalDataUsage.toFixed(1)}</div>
            <div className="text-[#64748B] text-xs">GB Total</div>
          </div>
          <div className="bg-[#0A0F2C] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-400">${totalEarnings.toLocaleString()}</div>
            <div className="text-[#64748B] text-xs">Earnings</div>
          </div>
        </div>
      </div>

      {/* Venues List */}
      <div className="divide-y divide-[#2D3B5F]">
        {loading ? (
          <div className="p-8 text-center text-[#64748B]">Loading venues...</div>
        ) : venues.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-[#2D3B5F] mx-auto mb-3" />
            <div className="text-[#64748B]">No venues yet</div>
            {onAddVenue && (
              <button
                onClick={onAddVenue}
                className="mt-3 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg text-sm hover:bg-[#0EA5E9]/80 transition-colors"
              >
                Add Your First Venue
              </button>
            )}
          </div>
        ) : (
          venues.map(venue => (
            <div
              key={venue.id}
              className="p-4 hover:bg-[#0A0F2C]/50 transition-colors cursor-pointer"
              onClick={() => setSelectedVenue(venue)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#0A0F2C] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-[#0EA5E9]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-white font-medium">{venue.name}</div>
                      <div className="flex items-center gap-1 text-[#64748B] text-sm mt-1">
                        <MapPin className="w-3 h-3" />
                        {venue.city}, {venue.state}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(venue.status)}`}>
                      {venue.status}
                    </span>
                  </div>

                  {/* Venue Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    {venue.devicesInstalled !== undefined && (
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-[#64748B]" />
                        <span className="text-[#94A3B8] text-sm">{venue.devicesInstalled} devices</span>
                      </div>
                    )}
                    {venue.dataUsageGB !== undefined && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#64748B]" />
                        <span className="text-[#94A3B8] text-sm">{venue.dataUsageGB.toFixed(1)} GB</span>
                      </div>
                    )}
                    {venue.monthlyEarnings !== undefined && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm">${venue.monthlyEarnings}</span>
                      </div>
                    )}
                  </div>

                  {/* Trial Notice */}
                  {venue.status === 'trial' && venue.trialDaysRemaining !== undefined && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400">{venue.trialDaysRemaining} days remaining in trial</span>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-[#64748B] flex-shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Venue Detail Modal */}
      {selectedVenue && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2D3B5F]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0A0F2C] rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedVenue.name}</h3>
                    <div className="text-[#64748B] text-sm">{selectedVenue.type}</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedVenue.status)}`}>
                  {selectedVenue.status}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Location */}
              <div>
                <div className="text-[#64748B] text-sm mb-2">Location</div>
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="text-white">{selectedVenue.address}</div>
                  <div className="text-[#94A3B8]">{selectedVenue.city}, {selectedVenue.state}</div>
                </div>
              </div>

              {/* Performance Stats */}
              <div>
                <div className="text-[#64748B] text-sm mb-2">Performance</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0A0F2C] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[#64748B] text-sm mb-1">
                      <Wifi className="w-4 h-4" />
                      Devices
                    </div>
                    <div className="text-2xl font-bold text-white">{selectedVenue.devicesInstalled || 0}</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[#64748B] text-sm mb-1">
                      <Activity className="w-4 h-4" />
                      Data Usage
                    </div>
                    <div className="text-2xl font-bold text-[#0EA5E9]">{(selectedVenue.dataUsageGB || 0).toFixed(1)} GB</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[#64748B] text-sm mb-1">
                      <Users className="w-4 h-4" />
                      Connections
                    </div>
                    <div className="text-2xl font-bold text-purple-400">{selectedVenue.uniqueConnections || 0}</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[#64748B] text-sm mb-1">
                      <TrendingUp className="w-4 h-4" />
                      Earnings
                    </div>
                    <div className="text-2xl font-bold text-green-400">${selectedVenue.monthlyEarnings || 0}</div>
                  </div>
                </div>
              </div>

              {/* Trial Info */}
              {selectedVenue.status === 'trial' && (
                <div>
                  <div className="text-[#64748B] text-sm mb-2">Trial Period</div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-blue-400 font-medium">
                          {selectedVenue.trialDaysRemaining} days remaining
                        </div>
                        <div className="text-[#64748B] text-sm">
                          Ends {selectedVenue.trialEndDate ? new Date(selectedVenue.trialEndDate).toLocaleDateString() : 'TBD'}
                        </div>
                      </div>
                      <Clock className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {onViewDetails && (
                  <button
                    onClick={() => { onViewDetails(selectedVenue.id); setSelectedVenue(null) }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Details
                  </button>
                )}
                <button
                  onClick={() => setSelectedVenue(null)}
                  className="flex-1 px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
