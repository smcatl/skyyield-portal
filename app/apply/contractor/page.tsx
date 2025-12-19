'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { User, MapPin, Award, DollarSign, CheckCircle, ArrowRight, ArrowLeft, Loader2, Wifi } from 'lucide-react'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']

const CERTIFICATIONS = ['CompTIA Network+','CompTIA A+','Cisco CCNA','Ubiquiti UEWA','Ubiquiti UBRSS','Low Voltage License','OSHA 10','OSHA 30','Aerial/Lift Certified','First Aid/CPR']

const SERVICES = ['WiFi AP Installation','Network Cabling (Cat5e/Cat6)','Router/Switch Configuration','Site Surveys','Network Troubleshooting','Outdoor/Weatherproof Installations','Commercial Installations','Residential Installations']

const SERVICE_RADIUS = [{value:'25',label:'25 miles'},{value:'50',label:'50 miles'},{value:'100',label:'100 miles'},{value:'150',label:'150+ miles'}]

const EXPERIENCE_LEVELS = [{value:'1-2',label:'1-2 years'},{value:'3-5',label:'3-5 years'},{value:'6-10',label:'6-10 years'},{value:'10+',label:'10+ years'}]

const AVAILABILITY_OPTIONS = [{value:'full_time',label:'Full-time availability'},{value:'part_time',label:'Part-time / Evenings & Weekends'},{value:'weekends',label:'Weekends only'},{value:'on_call',label:'On-call / As needed'}]

function ContractorFormContent() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    entityType: 'individual', legalName: '', dbaName: '', ein: '',
    contactFirstName: '', contactLastName: '', contactEmail: '', contactPhone: '', contactTitle: '',
    addressLine1: '', city: '', state: '', zip: '', serviceRadiusMiles: '50', vehicleType: '',
    yearsExperience: '', certifications: [] as string[], servicesOffered: [] as string[], toolsOwned: '',
    hourlyRate: '', perInstallRate: '', availability: '', portfolioUrl: '', notes: '', agreedToTerms: false,
  })

  const updateField = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const toggleArrayItem = (field: 'certifications' | 'servicesOffered', item: string) => {
    const current = formData[field]
    updateField(field, current.includes(item) ? current.filter(i => i !== item) : [...current, item])
  }

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {}
    if (stepNum === 1) {
      if (formData.entityType === 'business' && !formData.legalName.trim()) newErrors.legalName = 'Required'
      if (!formData.contactFirstName.trim()) newErrors.contactFirstName = 'Required'
      if (!formData.contactLastName.trim()) newErrors.contactLastName = 'Required'
      if (!formData.contactEmail.trim()) newErrors.contactEmail = 'Required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) newErrors.contactEmail = 'Invalid email'
      if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Required'
    }
    if (stepNum === 2) {
      if (!formData.city.trim()) newErrors.city = 'Required'
      if (!formData.state) newErrors.state = 'Required'
      if (!formData.zip.trim()) newErrors.zip = 'Required'
    }
    if (stepNum === 3) {
      if (!formData.yearsExperience) newErrors.yearsExperience = 'Required'
      if (formData.servicesOffered.length === 0) newErrors.servicesOffered = 'Select at least one'
    }
    if (stepNum === 4) {
      if (!formData.availability) newErrors.availability = 'Required'
      if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => { if (validateStep(step)) setStep(step + 1) }
  const prevStep = () => setStep(step - 1)

  const handleSubmit = async () => {
    if (!validateStep(4)) return
    setIsSubmitting(true)
    try {
      const fullName = `${formData.contactFirstName} ${formData.contactLastName}`.trim()
      const response = await fetch('/api/pipeline/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: formData.entityType,
          legal_name: formData.entityType === 'business' ? formData.legalName : fullName,
          dba_name: formData.dbaName, ein: formData.ein,
          contact_full_name: fullName, contact_first_name: formData.contactFirstName,
          contact_last_name: formData.contactLastName, contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone, contact_title: formData.contactTitle,
          address_line_1: formData.addressLine1, city: formData.city, state: formData.state, zip: formData.zip,
          service_radius_miles: parseInt(formData.serviceRadiusMiles), vehicle_type: formData.vehicleType,
          years_experience: formData.yearsExperience, certifications: formData.certifications,
          services_offered: formData.servicesOffered, tools_owned: formData.toolsOwned,
          hourly_rate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
          per_install_rate: formData.perInstallRate ? parseFloat(formData.perInstallRate) : null,
          availability: formData.availability, portfolio_url: formData.portfolioUrl, notes: formData.notes,
        }),
      })
      if (!response.ok) throw new Error('Failed')
      setIsSuccess(true)
    } catch (error) {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Application Submitted!</h1>
          <p className="text-[#94A3B8] mb-8">We'll review your qualifications and contact you within 3-5 business days.</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-[#0EA5E9] text-white rounded-lg font-medium hover:bg-[#0EA5E9]/90">Return Home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0F2C] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wifi className="w-8 h-8 text-[#0EA5E9]" />
            <span className="text-2xl font-bold text-white">SkyYield</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Contractor Application</h1>
          <p className="text-[#94A3B8]">Join our network of certified installation professionals</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1,2,3,4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${s === step ? 'bg-[#0EA5E9] text-white' : s < step ? 'bg-green-500 text-white' : 'bg-[#1E293B] text-[#64748B]'}`}>
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 4 && <div className={`w-12 h-1 mx-1 ${s < step ? 'bg-green-500' : 'bg-[#1E293B]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#0F1629] border border-[#2D3B5F] rounded-xl p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6"><User className="w-6 h-6 text-[#0EA5E9]" /><h2 className="text-xl font-semibold text-white">Business Information</h2></div>
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-3">I am applying as *</label>
                <div className="flex gap-4">
                  {['individual', 'business'].map(type => (
                    <button key={type} type="button" onClick={() => updateField('entityType', type)}
                      className={`flex-1 py-3 px-4 rounded-lg border capitalize ${formData.entityType === type ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'border-[#2D3B5F] bg-[#1E293B] text-[#94A3B8]'}`}>
                      {type === 'business' ? 'Business Entity' : 'Individual'}
                    </button>
                  ))}
                </div>
              </div>
              {formData.entityType === 'business' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Legal Business Name *</label>
                    <input type="text" value={formData.legalName} onChange={(e) => updateField('legalName', e.target.value)} className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.legalName ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`} placeholder="Your Company, LLC" />
                    {errors.legalName && <p className="text-red-500 text-sm mt-1">{errors.legalName}</p>}
                  </div>
                  <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">DBA Name</label><input type="text" value={formData.dbaName} onChange={(e) => updateField('dbaName', e.target.value)} className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" placeholder="Doing Business As..." /></div>
                  <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">EIN</label><input type="text" value={formData.ein} onChange={(e) => updateField('ein', e.target.value)} className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" placeholder="XX-XXXXXXX" /></div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">First Name *</label><input type="text" value={formData.contactFirstName} onChange={(e) => updateField('contactFirstName', e.target.value)} className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.contactFirstName ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`} placeholder="John" />{errors.contactFirstName && <p className="text-red-500 text-sm mt-1">{errors.contactFirstName}</p>}</div>
                <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Last Name *</label><input type="text" value={formData.contactLastName} onChange={(e) => updateField('contactLastName', e.target.value)} className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.contactLastName ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`} placeholder="Doe" />{errors.contactLastName && <p className="text-red-500 text-sm mt-1">{errors.contactLastName}</p>}</div>
              </div>
              <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Email *</label><input type="email" value={formData.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)} className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.contactEmail ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`} placeholder="john@example.com" />{errors.contactEmail && <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Phone *</label><input type="tel" value={formData.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.contactPhone ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`} placeholder="(404) 555-0123" />{errors.contactPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>}</div>
                <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Title</label><input type="text" value={formData.contactTitle} onChange={(e) => updateField('contactTitle', e.target.value)} className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" placeholder="Owner / Lead Tech" /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6"><MapPin className="w-6 h-6 text-[#0EA5E9]" /><h2 className="text-xl font-semibold text-white">Service Area</h2></div>
              <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Street Address</label><input type="text" value={formData.addressLine1} onChange={(e) => updateField('addressLine1', e.target.value)} className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" placeholder="123 Main Street" /></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium text-[#94A3B8] mb-2">City *</label><input type="text" value={formData.city} onChange={(e) => updateField('city', e.target.value)} className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.city ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`} placeholder="Atlanta" />{errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}</div>
                <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">State *</label><select value={formData.state} onChange={(e) => updateField('state', e.target.value)} className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.state ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`}><option value="">State</option>{US_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select>{errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}</div>
                <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">ZIP *</label><input type="text" value={formData.zip} onChange={(e) => updateField('zip', e.target.value)} className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.zip ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`} placeholder="30309" />{errors.zip && <p className="text-red-500 text-sm mt-1">{errors.zip}</p>}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Service Radius</label><select value={formData.serviceRadiusMiles} onChange={(e) => updateField('serviceRadiusMiles', e.target.value)} className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]">{SERVICE_RADIUS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Vehicle Type</label><input type="text" value={formData.vehicleType} onChange={(e) => updateField('vehicleType', e.target.value)} className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" placeholder="Van, Truck, SUV" /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6"><Award className="w-6 h-6 text-[#0EA5E9]" /><h2 className="text-xl font-semibold text-white">Qualifications</h2></div>
              <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Years of Experience *</label><select value={formData.yearsExperience} onChange={(e) => updateField('yearsExperience', e.target.value)} className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.yearsExperience ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`}><option value="">Select...</option>{EXPERIENCE_LEVELS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}</select>{errors.yearsExperience && <p className="text-red-500 text-sm mt-1">{errors.yearsExperience}</p>}</div>
              <div><label className="block text-sm font-medium text-[#94A3B8] mb-3">Services You Offer *</label><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{SERVICES.map(s => (<label key={s} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${formData.servicesOffered.includes(s) ? 'border-[#0EA5E9] bg-[#0EA5E9]/10' : 'border-[#2D3B5F] bg-[#1E293B]'}`}><input type="checkbox" checked={formData.servicesOffered.includes(s)} onChange={() => toggleArrayItem('servicesOffered', s)} className="w-4 h-4 rounded" /><span className="text-sm text-[#94A3B8]">{s}</span></label>))}</div>{errors.servicesOffered && <p className="text-red-500 text-sm mt-1">{errors.servicesOffered}</p>}</div>
              <div><label className="block text-sm font-medium text-[#94A3B8] mb-3">Certifications</label><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{CERTIFICATIONS.map(c => (<label key={c} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${formData.certifications.includes(c) ? 'border-[#10F981] bg-[#10F981]/10' : 'border-[#2D3B5F] bg-[#1E293B]'}`}><input type="checkbox" checked={formData.certifications.includes(c)} onChange={() => toggleArrayItem('certifications', c)} className="w-4 h-4 rounded" /><span className="text-sm text-[#94A3B8]">{c}</span></label>))}</div></div>
              <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Tools & Equipment</label><textarea value={formData.toolsOwned} onChange={(e) => updateField('toolsOwned', e.target.value)} rows={3} className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] resize-none" placeholder="List tools, testing equipment, ladders, lifts..." /></div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6"><DollarSign className="w-6 h-6 text-[#0EA5E9]" /><h2 className="text-xl font-semibold text-white">Rates & Availability</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Hourly Rate ($)</label><input type="number" value={formData.hourlyRate} onChange={(e) => updateField('hourlyRate', e.target.value)} className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" placeholder="75" /></div>
                <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Per-Install Rate ($)</label><input type="number" value={formData.perInstallRate} onChange={(e) => updateField('perInstallRate', e.target.value)} className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" placeholder="150" /></div>
              </div>
              <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Availability *</label><select value={formData.availability} onChange={(e) => updateField('availability', e.target.value)} className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.availability ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`}><option value="">Select...</option>{AVAILABILITY_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}</select>{errors.availability && <p className="text-red-500 text-sm mt-1">{errors.availability}</p>}</div>
              <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Portfolio URL</label><input type="url" value={formData.portfolioUrl} onChange={(e) => updateField('portfolioUrl', e.target.value)} className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]" placeholder="https://yoursite.com" /></div>
              <div><label className="block text-sm font-medium text-[#94A3B8] mb-2">Notes</label><textarea value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] resize-none" placeholder="Anything else?" /></div>
              <div className="p-4 bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 rounded-lg"><h3 className="text-[#0EA5E9] font-medium mb-2">What's Next?</h3><p className="text-[#94A3B8] text-sm">Approved contractors receive an agreement to sign and access to our job dispatch system.</p></div>
              <div className="flex items-start gap-3 p-4 bg-[#1E293B] rounded-lg"><input type="checkbox" id="terms" checked={formData.agreedToTerms} onChange={(e) => updateField('agreedToTerms', e.target.checked)} className="w-5 h-5 mt-0.5 rounded" /><label htmlFor="terms" className="text-sm text-[#94A3B8]">I agree to the <a href="/terms" className="text-[#0EA5E9] hover:underline">Terms</a> and <a href="/privacy" className="text-[#0EA5E9] hover:underline">Privacy Policy</a>.</label></div>
              {errors.agreedToTerms && <p className="text-red-500 text-sm">{errors.agreedToTerms}</p>}
              {errors.submit && <p className="text-red-500 text-sm text-center">{errors.submit}</p>}
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-[#2D3B5F]">
            {step > 1 ? <button onClick={prevStep} className="flex items-center gap-2 px-6 py-3 text-[#94A3B8] hover:text-white"><ArrowLeft className="w-4 h-4" />Back</button> : <div />}
            {step < 4 ? (
              <button onClick={nextStep} className="flex items-center gap-2 px-6 py-3 bg-[#0EA5E9] text-white rounded-lg font-medium hover:bg-[#0EA5E9]/90">Continue<ArrowRight className="w-4 h-4" /></button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-8 py-3 bg-[#10F981] text-[#0A0F2C] rounded-lg font-medium hover:bg-[#10F981]/90 disabled:opacity-50">
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <>Submit<CheckCircle className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-[#64748B] text-sm mt-6">Questions? <a href="mailto:contractors@skyyield.io" className="text-[#0EA5E9] hover:underline">contractors@skyyield.io</a></p>
      </div>
    </div>
  )
}

export default function ContractorApplicationPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin" /></div>}><ContractorFormContent /></Suspense>
}
