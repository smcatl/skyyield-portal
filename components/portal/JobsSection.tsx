'use client'

import { useState } from 'react'
import { 
  Calendar, MapPin, Clock, CheckCircle, AlertCircle, 
  ChevronRight, Phone, Mail, Building2, Package,
  Camera, FileText, Navigation
} from 'lucide-react'

interface Job {
  id: string
  jobNumber: string
  type: 'install' | 'maintenance' | 'removal' | 'repair'
  status: 'pending' | 'assigned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  
  // Location
  venueName: string
  venueAddress: string
  venueCity: string
  venueState: string
  
  // Contact
  contactName: string
  contactPhone: string
  contactEmail?: string
  
  // Schedule
  scheduledDate: string
  scheduledTimeStart?: string
  scheduledTimeEnd?: string
  
  // Equipment
  equipmentList?: { name: string; quantity: number; serialNumber?: string }[]
  
  // Payment
  paymentAmount?: number
  paymentStatus?: 'pending' | 'approved' | 'paid'
  
  // Notes
  instructions?: string
  completionNotes?: string
}

interface JobsSectionProps {
  jobs: Job[]
  loading?: boolean
  title?: string
  onStartJob?: (jobId: string) => void
  onCompleteJob?: (jobId: string) => void
  showCalendarView?: boolean
}

export default function JobsSection({
  jobs,
  loading = false,
  title = 'My Jobs',
  onStartJob,
  onCompleteJob,
  showCalendarView = false,
}: JobsSectionProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [view, setView] = useState<'list' | 'calendar'>('list')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'scheduled': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'assigned': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'pending': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'install': return 'Installation'
      case 'maintenance': return 'Maintenance'
      case 'removal': return 'Removal'
      case 'repair': return 'Repair'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'install': return 'text-green-400'
      case 'maintenance': return 'text-blue-400'
      case 'removal': return 'text-orange-400'
      case 'repair': return 'text-yellow-400'
      default: return 'text-[#94A3B8]'
    }
  }

  const filteredJobs = statusFilter === 'all' 
    ? jobs 
    : jobs.filter(j => j.status === statusFilter)

  const upcomingJobs = jobs.filter(j => ['assigned', 'scheduled'].includes(j.status))
  const activeJobs = jobs.filter(j => j.status === 'in_progress')
  const completedJobs = jobs.filter(j => j.status === 'completed')

  const openMaps = (job: Job) => {
    const address = encodeURIComponent(`${job.venueAddress}, ${job.venueCity}, ${job.venueState}`)
    window.open(`https://maps.google.com/?q=${address}`, '_blank')
  }

  return (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl">
      {/* Header */}
      <div className="p-4 border-b border-[#2D3B5F]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {showCalendarView && (
            <div className="flex gap-1 bg-[#0A0F2C] rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 rounded text-sm ${view === 'list' ? 'bg-[#0EA5E9] text-white' : 'text-[#94A3B8]'}`}
              >
                List
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1 rounded text-sm ${view === 'calendar' ? 'bg-[#0EA5E9] text-white' : 'text-[#94A3B8]'}`}
              >
                Calendar
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#0A0F2C] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-yellow-400">{upcomingJobs.length}</div>
            <div className="text-[#64748B] text-xs">Upcoming</div>
          </div>
          <div className="bg-[#0A0F2C] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-400">{activeJobs.length}</div>
            <div className="text-[#64748B] text-xs">In Progress</div>
          </div>
          <div className="bg-[#0A0F2C] rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-400">{completedJobs.length}</div>
            <div className="text-[#64748B] text-xs">Completed</div>
          </div>
        </div>

        {/* Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white text-sm focus:outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">All Jobs</option>
          <option value="assigned">Assigned</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Jobs List */}
      <div className="divide-y divide-[#2D3B5F]">
        {loading ? (
          <div className="p-8 text-center text-[#64748B]">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-8 text-center text-[#64748B]">No jobs found</div>
        ) : (
          filteredJobs.map(job => (
            <div
              key={job.id}
              className="p-4 hover:bg-[#0A0F2C]/50 transition-colors cursor-pointer"
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#64748B] text-sm font-mono">{job.jobNumber}</span>
                    <span className={`text-sm ${getTypeColor(job.type)}`}>
                      {getTypeLabel(job.type)}
                    </span>
                  </div>
                  
                  <div className="text-white font-medium">{job.venueName}</div>
                  
                  <div className="flex items-center gap-1 text-[#64748B] text-sm mt-1">
                    <MapPin className="w-3 h-3" />
                    {job.venueCity}, {job.venueState}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1 text-[#94A3B8]">
                      <Calendar className="w-3 h-3" />
                      {new Date(job.scheduledDate).toLocaleDateString()}
                    </span>
                    {job.scheduledTimeStart && (
                      <span className="flex items-center gap-1 text-[#94A3B8]">
                        <Clock className="w-3 h-3" />
                        {job.scheduledTimeStart}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                  {job.paymentAmount && (
                    <span className="text-green-400 font-medium">
                      ${job.paymentAmount}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#64748B]" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2D3B5F]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[#64748B] text-sm font-mono">{selectedJob.jobNumber}</div>
                  <h3 className="text-xl font-semibold text-white">{selectedJob.venueName}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedJob.status)}`}>
                  {selectedJob.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Location */}
              <div>
                <div className="text-[#64748B] text-sm mb-2">Location</div>
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="text-white">{selectedJob.venueAddress}</div>
                  <div className="text-[#94A3B8]">{selectedJob.venueCity}, {selectedJob.venueState}</div>
                  <button
                    onClick={() => openMaps(selectedJob)}
                    className="flex items-center gap-2 mt-3 text-[#0EA5E9] text-sm hover:underline"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Maps
                  </button>
                </div>
              </div>

              {/* Contact */}
              <div>
                <div className="text-[#64748B] text-sm mb-2">Contact</div>
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <div className="text-white font-medium">{selectedJob.contactName}</div>
                  <div className="flex items-center gap-4 mt-2">
                    <a href={`tel:${selectedJob.contactPhone}`} className="flex items-center gap-1 text-[#0EA5E9] text-sm">
                      <Phone className="w-4 h-4" />
                      {selectedJob.contactPhone}
                    </a>
                    {selectedJob.contactEmail && (
                      <a href={`mailto:${selectedJob.contactEmail}`} className="flex items-center gap-1 text-[#0EA5E9] text-sm">
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <div className="text-[#64748B] text-sm mb-2">Schedule</div>
                <div className="bg-[#0A0F2C] rounded-lg p-4 flex items-center gap-4">
                  <Calendar className="w-5 h-5 text-[#0EA5E9]" />
                  <div>
                    <div className="text-white">{new Date(selectedJob.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                    {selectedJob.scheduledTimeStart && (
                      <div className="text-[#94A3B8] text-sm">
                        {selectedJob.scheduledTimeStart} - {selectedJob.scheduledTimeEnd || 'TBD'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Equipment */}
              {selectedJob.equipmentList && selectedJob.equipmentList.length > 0 && (
                <div>
                  <div className="text-[#64748B] text-sm mb-2">Equipment</div>
                  <div className="bg-[#0A0F2C] rounded-lg p-4 space-y-2">
                    {selectedJob.equipmentList.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#64748B]" />
                          <span className="text-white">{item.name}</span>
                        </div>
                        <span className="text-[#94A3B8]">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {selectedJob.instructions && (
                <div>
                  <div className="text-[#64748B] text-sm mb-2">Special Instructions</div>
                  <div className="bg-[#0A0F2C] rounded-lg p-4 text-[#94A3B8] text-sm">
                    {selectedJob.instructions}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {selectedJob.status === 'scheduled' && onStartJob && (
                  <button
                    onClick={() => { onStartJob(selectedJob.id); setSelectedJob(null) }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Start Job
                  </button>
                )}
                {selectedJob.status === 'in_progress' && onCompleteJob && (
                  <button
                    onClick={() => { onCompleteJob(selectedJob.id); setSelectedJob(null) }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete Job
                  </button>
                )}
                <button
                  onClick={() => setSelectedJob(null)}
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
