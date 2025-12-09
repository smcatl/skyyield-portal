'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { 
  Building2, Wifi, Plus, Trash2, ChevronDown, ChevronRight,
  Check, AlertCircle, Loader2
} from 'lucide-react'

interface DeviceForm {
  id: string
  name: string
  model: string
  macAddress: string
  serialNumber: string
  placement: string
}

interface VenueForm {
  id: string
  name: string
  type: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  isp: string
  connectionType: string
  serviceCategory: string
  internetSpeed: string
  onsiteSecurity: string[]
  devices: DeviceForm[]
  isExpanded: boolean
}

const createEmptyDevice = (): DeviceForm => ({
  id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: '', model: '', macAddress: '', serialNumber: '', placement: 'Indoor',
})

const createEmptyVenue = (): VenueForm => ({
  id: `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: '', type: '', phone: '', address: '', city: '', state: '', zip: '',
  isp: '', connectionType: '', serviceCategory: '', internetSpeed: '',
  onsiteSecurity: [], devices: [], isExpanded: true,
})

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']

export default function VenuesSetupPage() {
  const params = useParams()
  const partnerId = params.partnerId as string
  
  const [venues, setVenues] = useState<VenueForm[]>([createEmptyVenue()])
  const [partnerInfo, setPartnerInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  
  const [venueTypes, setVenueTypes] = useState<{value: string; label: string}[]>([])
  const [isps, setIsps] = useState<{value: string; label: string}[]>([])
  const [connectionTypes, setConnectionTypes] = useState<{value: string; label: string}[]>([])
  const [serviceCategories, setServiceCategories] = useState<{value: string; label: string}[]>([])
  const [internetSpeeds, setInternetSpeeds] = useState<{value: string; label: string}[]>([])
  const [securityOptions, setSecurityOptions] = useState<{value: string; label: string}[]>([])
  const [deviceModels, setDeviceModels] = useState<{value: string; label: string}[]>([])

  useEffect(() => { fetchData() }, [partnerId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const partnerRes = await fetch(`/api/pipeline/partners?id=${partnerId}`)
      if (partnerRes.ok) { const data = await partnerRes.json(); setPartnerInfo(data.partner) }

      const keys = ['venue_types','isps','connection_types','service_categories','internet_speeds','onsite_security']
      const results = await Promise.all(keys.map(k => fetch(`/api/pipeline/dropdowns?key=${k}`).then(r => r.ok ? r.json() : {options:[]})))
      
      setVenueTypes(results[0].options || [])
      setIsps(results[1].options || [])
      setConnectionTypes(results[2].options || [])
      setServiceCategories(results[3].options || [])
      setInternetSpeeds(results[4].options || [])
      setSecurityOptions(results[5].options || [])
      
      const productsRes = await fetch('/api/products?status=approved')
      if (productsRes.ok) {
        const data = await productsRes.json()
        setDeviceModels((data.products || []).map((p: any) => ({ value: p.id, label: p.name })))
      }
    } catch (err) { setError('Failed to load') }
    finally { setLoading(false) }
  }

  const addVenue = () => setVenues(prev => [...prev, createEmptyVenue()])
  const removeVenue = (id: string) => { if (venues.length > 1) setVenues(prev => prev.filter(v => v.id !== id)) }
  const updateVenue = (id: string, field: keyof VenueForm, value: any) => setVenues(prev => prev.map(v => v.id === id ? {...v, [field]: value} : v))
  const toggleVenue = (id: string) => setVenues(prev => prev.map(v => v.id === id ? {...v, isExpanded: !v.isExpanded} : v))
  const toggleSecurity = (venueId: string, val: string) => setVenues(prev => prev.map(v => v.id === venueId ? {...v, onsiteSecurity: v.onsiteSecurity.includes(val) ? v.onsiteSecurity.filter(s => s !== val) : [...v.onsiteSecurity, val]} : v))
  const addDevice = (venueId: string) => setVenues(prev => prev.map(v => v.id === venueId ? {...v, devices: [...v.devices, createEmptyDevice()]} : v))
  const removeDevice = (venueId: string, deviceId: string) => setVenues(prev => prev.map(v => v.id === venueId ? {...v, devices: v.devices.filter(d => d.id !== deviceId)} : v))
  const updateDevice = (venueId: string, deviceId: string, field: keyof DeviceForm, value: string) => setVenues(prev => prev.map(v => v.id === venueId ? {...v, devices: v.devices.map(d => d.id === deviceId ? {...d, [field]: value} : d)} : v))

  const handleSubmit = async () => {
    for (const v of venues) { if (!v.name || !v.type || !v.address || !v.city || !v.state || !v.zip) { setError('Fill required fields'); return } }
    setSubmitting(true); setError('')
    try {
      for (const venue of venues) {
        const venueRes = await fetch('/api/pipeline/venues', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locationPartnerId:partnerId,...venue})})
        if (!venueRes.ok) throw new Error('Failed')
        const {venue: newVenue} = await venueRes.json()
        for (const device of venue.devices) {
          if (!device.name) continue
          await fetch('/api/pipeline/devices', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({venueId:newVenue.id,locationPartnerId:partnerId,...device})})
        }
      }
      await fetch('/api/pipeline/partners', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:partnerId,stage:'loi_sent'})})
      setSubmitted(true)
    } catch { setError('Something went wrong') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center"><Loader2 className="w-12 h-12 text-[#0EA5E9] animate-spin" /></div>

  if (submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><Check className="w-10 h-10 text-white" /></div>
        <h1 className="text-3xl font-bold text-white mb-4">Venues Submitted!</h1>
        <p className="text-[#94A3B8]">We'll prepare your LOI next.</p>
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 mt-6 text-left">
          <p className="text-[#94A3B8] text-sm">Venues: <span className="text-white font-medium">{venues.length}</span></p>
          <p className="text-[#94A3B8] text-sm">Devices: <span className="text-white font-medium">{venues.reduce((a,v) => a + v.devices.length, 0)}</span></p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28]">
      <header className="border-b border-[#2D3B5F]">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0EA5E9] to-green-500 rounded-lg flex items-center justify-center"><Wifi className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-bold text-white">SkyYield</span>
          </div>
          {partnerInfo && <h1 className="text-2xl font-bold text-white">{partnerInfo.companyDBA || partnerInfo.companyLegalName}</h1>}
          <p className="text-[#94A3B8]">Venue & Device Setup</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-400" /><p className="text-red-400 text-sm">{error}</p></div>}

        <div className="space-y-6">
          {venues.map((venue, i) => (
            <div key={venue.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#2D3B5F]/30" onClick={() => toggleVenue(venue.id)}>
                <div className="flex items-center gap-3">
                  {venue.isExpanded ? <ChevronDown className="w-5 h-5 text-[#64748B]" /> : <ChevronRight className="w-5 h-5 text-[#64748B]" />}
                  <Building2 className="w-5 h-5 text-[#0EA5E9]" />
                  <div><h3 className="text-white font-medium">{venue.name || `Venue ${i+1}`}</h3>{venue.city && <p className="text-[#64748B] text-sm">{venue.city}, {venue.state}</p>}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#64748B] text-sm">{venue.devices.length} devices</span>
                  {venues.length > 1 && <button onClick={(e) => {e.stopPropagation(); removeVenue(venue.id)}} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>

              {venue.isExpanded && (
                <div className="border-t border-[#2D3B5F] p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Venue Name *</label><input type="text" value={venue.name} onChange={e => updateVenue(venue.id,'name',e.target.value)} placeholder="Downtown Location" className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]" /></div>
                    <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Venue Type *</label><select value={venue.type} onChange={e => updateVenue(venue.id,'type',e.target.value)} className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"><option value="">Select...</option>{venueTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Phone</label><input type="tel" value={venue.phone} onChange={e => updateVenue(venue.id,'phone',e.target.value)} placeholder="(555) 123-4567" className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-[#94A3B8] mb-2">Address *</label><input type="text" value={venue.address} onChange={e => updateVenue(venue.id,'address',e.target.value)} placeholder="123 Main St" className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]" /></div>
                    <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">City *</label><input type="text" value={venue.city} onChange={e => updateVenue(venue.id,'city',e.target.value)} placeholder="Atlanta" className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">State *</label><select value={venue.state} onChange={e => updateVenue(venue.id,'state',e.target.value)} className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"><option value="">Select...</option>{US_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                      <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">ZIP *</label><input type="text" value={venue.zip} onChange={e => updateVenue(venue.id,'zip',e.target.value)} placeholder="30301" className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">ISP</label><select value={venue.isp} onChange={e => updateVenue(venue.id,'isp',e.target.value)} className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"><option value="">Select...</option>{isps.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Connection</label><select value={venue.connectionType} onChange={e => updateVenue(venue.id,'connectionType',e.target.value)} className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"><option value="">Select...</option>{connectionTypes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Speed</label><select value={venue.internetSpeed} onChange={e => updateVenue(venue.id,'internetSpeed',e.target.value)} className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"><option value="">Select...</option>{internetSpeeds.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Category</label><select value={venue.serviceCategory} onChange={e => updateVenue(venue.id,'serviceCategory',e.target.value)} className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"><option value="">Select...</option>{serviceCategories.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                  </div>

                  {/* Devices */}
                  <div className="border-t border-[#2D3B5F] pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-medium flex items-center gap-2"><Wifi className="w-4 h-4 text-[#0EA5E9]" />Devices</h4>
                      <button onClick={() => addDevice(venue.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#0EA5E9] hover:bg-[#0EA5E9]/10 rounded"><Plus className="w-4 h-4" />Add</button>
                    </div>
                    {venue.devices.length === 0 ? (
                      <div className="text-center py-8 bg-[#0A0F2C] rounded-lg"><p className="text-[#64748B] text-sm">No devices</p><button onClick={() => addDevice(venue.id)} className="mt-2 text-sm text-[#0EA5E9]">Add first device</button></div>
                    ) : (
                      <div className="space-y-3">
                        {venue.devices.map((device, di) => (
                          <div key={device.id} className="bg-[#0A0F2C] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3"><span className="text-[#64748B] text-sm">Device {di+1}</span><button onClick={() => removeDevice(venue.id, device.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded"><Trash2 className="w-4 h-4" /></button></div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div><label className="block text-xs text-[#64748B] mb-1">Name</label><input type="text" value={device.name} onChange={e => updateDevice(venue.id,device.id,'name',e.target.value)} placeholder="Lobby AP" className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white text-sm focus:outline-none focus:border-[#0EA5E9]" /></div>
                              <div><label className="block text-xs text-[#64748B] mb-1">Model</label><select value={device.model} onChange={e => updateDevice(venue.id,device.id,'model',e.target.value)} className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white text-sm focus:outline-none focus:border-[#0EA5E9]"><option value="">Select...</option>{deviceModels.map(m => <option key={m.value} value={m.label}>{m.label}</option>)}</select></div>
                              <div><label className="block text-xs text-[#64748B] mb-1">Placement</label><select value={device.placement} onChange={e => updateDevice(venue.id,device.id,'placement',e.target.value)} className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white text-sm focus:outline-none focus:border-[#0EA5E9]"><option value="Indoor">Indoor</option><option value="Outdoor">Outdoor</option></select></div>
                              <div><label className="block text-xs text-[#64748B] mb-1">MAC</label><input type="text" value={device.macAddress} onChange={e => updateDevice(venue.id,device.id,'macAddress',e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white text-sm font-mono focus:outline-none focus:border-[#0EA5E9]" /></div>
                              <div><label className="block text-xs text-[#64748B] mb-1">Serial</label><input type="text" value={device.serialNumber} onChange={e => updateDevice(venue.id,device.id,'serialNumber',e.target.value)} placeholder="SN12345" className="w-full px-3 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded text-white text-sm font-mono focus:outline-none focus:border-[#0EA5E9]" /></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={addVenue} className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-[#2D3B5F] text-[#94A3B8] rounded-xl hover:border-[#0EA5E9] hover:text-[#0EA5E9]"><Plus className="w-5 h-5" />Add Another Venue</button>

        <div className="mt-8 p-6 bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl flex items-center justify-between">
          <div><h3 className="text-white font-medium">Ready?</h3><p className="text-[#64748B] text-sm">{venues.length} venues • {venues.reduce((a,v) => a + v.devices.length, 0)} devices</p></div>
          <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><Check className="w-4 h-4" />Submit</>}
          </button>
        </div>
      </main>
    </div>
  )
}