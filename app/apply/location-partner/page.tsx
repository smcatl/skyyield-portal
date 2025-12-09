'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { 
  Building2, User, Phone, Mail, MapPin, Globe, Wifi,
  ChevronRight, ChevronLeft, Check, AlertCircle, Loader2
} from 'lucide-react'

interface FormData {
  // Contact Info
  contactFullName: string
  contactPreferredName: string
  contactTitle: string
  contactPhone: string
  contactEmail: string
  
  // Company Info
  companyLegalName: string
  companyDBA: string
  companyIndustry: string
  companyAddress1: string
  companyAddress2: string
  companyCity: string
  companyState: string
  companyZip: string
  companyCountry: string
  
  // Additional Info
  linkedInProfile: string
  howDidYouHear: string
  numberOfLocations: string
  currentInternetProvider: string
  numberOfInternetLines: string
  currentGbsInPlan: string
  
  // Terms
  agreedToTerms: boolean
}

const initialFormData: FormData = {
  contactFullName: '',
  contactPreferredName: '',
  contactTitle: '',
  contactPhone: '',
  contactEmail: '',
  companyLegalName: '',
  companyDBA: '',
  companyIndustry: '',
  companyAddress1: '',
  companyAddress2: '',
  companyCity: '',
  companyState: '',
  companyZip: '',
  companyCountry: 'USA',
  linkedInProfile: '',
  howDidYouHear: '',
  numberOfLocations: '',
  currentInternetProvider: '',
  numberOfInternetLines: '',
  currentGbsInPlan: '',
  agreedToTerms: false,
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]

export default function LocationPartnerApplicationPage() {
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref')
  
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  
  // Dropdown options
  const [industries, setIndustries] = useState<{value: string; label: string}[]>([])
  const [referralSources, setReferralSources] = useState<{value: string; label: string}[]>([])
  const [isps, setIsps] = useState<{value: string; label: string}[]>([])

  useEffect(() => {
    // Fetch dropdown options
    fetchDropdowns()
  }, [])

  const fetchDropdowns = async () => {
    try {
      const [industriesRes, sourcesRes, ispsRes] = await Promise.all([
        fetch('/api/pipeline/dropdowns?key=industries'),
        fetch('/api/pipeline/dropdowns?key=referral_sources'),
        fetch('/api/pipeline/dropdowns?key=isps'),
      ])
      
      if (industriesRes.ok) {
        const data = await industriesRes.json()
        setIndustries(data.options || [])
      }
      if (sourcesRes.ok) {
        const data = await sourcesRes.json()
        setReferralSources(data.options || [])
      }
      if (ispsRes.ok) {
        const data = await ispsRes.json()
        setIsps(data.options || [])
      }
    } catch (err) {
      console.error('Error fetching dropdowns:', err)
    }
  }

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    
    if (step === 1) {
      if (!formData.contactFullName.trim()) newErrors.contactFullName = 'Full name is required'
      if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Phone number is required'
      if (!formData.contactEmail.trim()) {
        newErrors.contactEmail = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
        newErrors.contactEmail = 'Invalid email address'
      }
    }
    
    if (step === 2) {
      if (!formData.companyLegalName.trim()) newErrors.companyLegalName = 'Company name is required'
      if (!formData.companyAddress1.trim()) newErrors.companyAddress1 = 'Address is required'
      if (!formData.companyCity.trim()) newErrors.companyCity = 'City is required'
      if (!formData.companyState.trim()) newErrors.companyState = 'State is required'
      if (!formData.companyZip.trim()) newErrors.companyZip = 'ZIP code is required'
    }
    
    if (step === 3) {
      if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return
    
    setSubmitting(true)
    setSubmitError('')
    
    try {
      const res = await fetch('/api/pipeline/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          numberOfLocations: formData.numberOfLocations ? parseInt(formData.numberOfLocations) : undefined,
          numberOfInternetLines: formData.numberOfInternetLines ? parseInt(formData.numberOfInternetLines) : undefined,
          currentGbsInPlan: formData.currentGbsInPlan ? parseInt(formData.currentGbsInPlan) : undefined,
          source: referralCode ? 'referral' : 'website',
          referralPartnerId: referralCode || undefined,
        }),
      })
      
      if (!res.ok) {
        throw new Error('Failed to submit application')
      }
      
      setSubmitted(true)
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Success Screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Application Submitted!</h1>
          <p className="text-[#94A3B8] mb-8">
            Thank you for your interest in becoming a SkyYield Location Partner. 
            Our team will review your application and contact you within 2 business days.
          </p>
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 text-left">
            <h3 className="text-white font-medium mb-3">What happens next?</h3>
            <ul className="space-y-3 text-sm text-[#94A3B8]">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-[#0EA5E9] rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-0.5">1</span>
                <span>Our team reviews your application</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-[#2D3B5F] rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-0.5">2</span>
                <span>You'll receive an email to schedule a discovery call</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-[#2D3B5F] rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-0.5">3</span>
                <span>We'll discuss your venue details and equipment needs</span>
              </li>
            </ul>
          </div>
          <p className="text-[#64748B] text-sm mt-6">
            Questions? Email us at <a href="mailto:partners@skyyield.com" className="text-[#0EA5E9] hover:underline">partners@skyyield.com</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28]">
      {/* Header */}
      <header className="border-b border-[#2D3B5F]">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0EA5E9] to-green-500 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SkyYield</span>
          </div>
          {referralCode && (
            <span className="text-xs text-[#64748B] bg-[#1A1F3A] px-3 py-1 rounded-full">
              Referred Partner
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Location Partner Application</h1>
          <p className="text-[#94A3B8]">
            Join our network and monetize your WiFi infrastructure
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { step: 1, label: 'Contact Info' },
            { step: 2, label: 'Company Details' },
            { step: 3, label: 'Review & Submit' },
          ].map(({ step, label }) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                currentStep >= step
                  ? 'bg-[#0EA5E9] text-white'
                  : 'bg-[#2D3B5F] text-[#64748B]'
              }`}>
                {currentStep > step ? <Check className="w-4 h-4" /> : step}
              </div>
              <span className={`hidden sm:block text-sm ${
                currentStep >= step ? 'text-white' : 'text-[#64748B]'
              }`}>
                {label}
              </span>
              {step < 3 && <ChevronRight className="w-4 h-4 text-[#64748B]" />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl p-6 sm:p-8">
          
          {/* Step 1: Contact Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-[#0EA5E9]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Contact Information</h2>
                  <p className="text-[#64748B] text-sm">Tell us how to reach you</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactFullName}
                    onChange={(e) => updateField('contactFullName', e.target.value)}
                    placeholder="John Smith"
                    className={`w-full px-4 py-3 bg-[#0A0F2C] border rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] ${
                      errors.contactFullName ? 'border-red-500' : 'border-[#2D3B5F]'
                    }`}
                  />
                  {errors.contactFullName && (
                    <p className="text-red-400 text-sm mt-1">{errors.contactFullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Preferred Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactPreferredName}
                    onChange={(e) => updateField('contactPreferredName', e.target.value)}
                    placeholder="John"
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.contactTitle}
                    onChange={(e) => updateField('contactTitle', e.target.value)}
                    placeholder="Owner / Manager"
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => updateField('contactPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className={`w-full px-4 py-3 bg-[#0A0F2C] border rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] ${
                      errors.contactPhone ? 'border-red-500' : 'border-[#2D3B5F]'
                    }`}
                  />
                  {errors.contactPhone && (
                    <p className="text-red-400 text-sm mt-1">{errors.contactPhone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    placeholder="john@company.com"
                    className={`w-full px-4 py-3 bg-[#0A0F2C] border rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] ${
                      errors.contactEmail ? 'border-red-500' : 'border-[#2D3B5F]'
                    }`}
                  />
                  {errors.contactEmail && (
                    <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    LinkedIn Profile
                  </label>
                  <input
                    type="text"
                    value={formData.linkedInProfile}
                    onChange={(e) => updateField('linkedInProfile', e.target.value)}
                    placeholder="linkedin.com/in/johnsmith"
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Company Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#0EA5E9]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Company Details</h2>
                  <p className="text-[#64748B] text-sm">Tell us about your business</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Legal Company Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyLegalName}
                    onChange={(e) => updateField('companyLegalName', e.target.value)}
                    placeholder="Acme Inc."
                    className={`w-full px-4 py-3 bg-[#0A0F2C] border rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] ${
                      errors.companyLegalName ? 'border-red-500' : 'border-[#2D3B5F]'
                    }`}
                  />
                  {errors.companyLegalName && (
                    <p className="text-red-400 text-sm mt-1">{errors.companyLegalName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    DBA (Doing Business As)
                  </label>
                  <input
                    type="text"
                    value={formData.companyDBA}
                    onChange={(e) => updateField('companyDBA', e.target.value)}
                    placeholder="Acme Coffee"
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Industry
                  </label>
                  <select
                    value={formData.companyIndustry}
                    onChange={(e) => updateField('companyIndustry', e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="">Select industry...</option>
                    {industries.map(ind => (
                      <option key={ind.value} value={ind.value}>{ind.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    How Did You Hear About Us?
                  </label>
                  <select
                    value={formData.howDidYouHear}
                    onChange={(e) => updateField('howDidYouHear', e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="">Select...</option>
                    {referralSources.map(src => (
                      <option key={src.value} value={src.value}>{src.label}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Street Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyAddress1}
                    onChange={(e) => updateField('companyAddress1', e.target.value)}
                    placeholder="123 Main Street"
                    className={`w-full px-4 py-3 bg-[#0A0F2C] border rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] ${
                      errors.companyAddress1 ? 'border-red-500' : 'border-[#2D3B5F]'
                    }`}
                  />
                  {errors.companyAddress1 && (
                    <p className="text-red-400 text-sm mt-1">{errors.companyAddress1}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.companyAddress2}
                    onChange={(e) => updateField('companyAddress2', e.target.value)}
                    placeholder="Suite 100"
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyCity}
                    onChange={(e) => updateField('companyCity', e.target.value)}
                    placeholder="Atlanta"
                    className={`w-full px-4 py-3 bg-[#0A0F2C] border rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] ${
                      errors.companyCity ? 'border-red-500' : 'border-[#2D3B5F]'
                    }`}
                  />
                  {errors.companyCity && (
                    <p className="text-red-400 text-sm mt-1">{errors.companyCity}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                      State <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.companyState}
                      onChange={(e) => updateField('companyState', e.target.value)}
                      className={`w-full px-4 py-3 bg-[#0A0F2C] border rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] ${
                        errors.companyState ? 'border-red-500' : 'border-[#2D3B5F]'
                      }`}
                    >
                      <option value="">Select...</option>
                      {US_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.companyState && (
                      <p className="text-red-400 text-sm mt-1">{errors.companyState}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                      ZIP <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.companyZip}
                      onChange={(e) => updateField('companyZip', e.target.value)}
                      placeholder="30301"
                      className={`w-full px-4 py-3 bg-[#0A0F2C] border rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] ${
                        errors.companyZip ? 'border-red-500' : 'border-[#2D3B5F]'
                      }`}
                    />
                    {errors.companyZip && (
                      <p className="text-red-400 text-sm mt-1">{errors.companyZip}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Number of Locations
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.numberOfLocations}
                    onChange={(e) => updateField('numberOfLocations', e.target.value)}
                    placeholder="1"
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    Current Internet Provider
                  </label>
                  <select
                    value={formData.currentInternetProvider}
                    onChange={(e) => updateField('currentInternetProvider', e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="">Select...</option>
                    {isps.map(isp => (
                      <option key={isp.value} value={isp.value}>{isp.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#0EA5E9]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Review & Submit</h2>
                  <p className="text-[#64748B] text-sm">Confirm your information</p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-4">
                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <h3 className="text-[#94A3B8] text-sm font-medium mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-[#64748B]">Name:</span> <span className="text-white">{formData.contactFullName}</span></div>
                    <div><span className="text-[#64748B]">Email:</span> <span className="text-white">{formData.contactEmail}</span></div>
                    <div><span className="text-[#64748B]">Phone:</span> <span className="text-white">{formData.contactPhone}</span></div>
                    {formData.contactTitle && <div><span className="text-[#64748B]">Title:</span> <span className="text-white">{formData.contactTitle}</span></div>}
                  </div>
                </div>

                <div className="bg-[#0A0F2C] rounded-lg p-4">
                  <h3 className="text-[#94A3B8] text-sm font-medium mb-3">Company Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="col-span-2"><span className="text-[#64748B]">Company:</span> <span className="text-white">{formData.companyLegalName}</span></div>
                    {formData.companyDBA && <div className="col-span-2"><span className="text-[#64748B]">DBA:</span> <span className="text-white">{formData.companyDBA}</span></div>}
                    <div className="col-span-2">
                      <span className="text-[#64748B]">Address:</span>{' '}
                      <span className="text-white">
                        {formData.companyAddress1}, {formData.companyCity}, {formData.companyState} {formData.companyZip}
                      </span>
                    </div>
                    {formData.numberOfLocations && <div><span className="text-[#64748B]">Locations:</span> <span className="text-white">{formData.numberOfLocations}</span></div>}
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className={`p-4 rounded-lg border ${errors.agreedToTerms ? 'border-red-500 bg-red-500/10' : 'border-[#2D3B5F]'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) => updateField('agreedToTerms', e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-[#2D3B5F] bg-[#0A0F2C] text-[#0EA5E9] focus:ring-[#0EA5E9]"
                  />
                  <span className="text-sm text-[#94A3B8]">
                    I agree to SkyYield's <a href="/terms" className="text-[#0EA5E9] hover:underline">Terms of Service</a> and{' '}
                    <a href="/privacy" className="text-[#0EA5E9] hover:underline">Privacy Policy</a>. 
                    I consent to being contacted about becoming a Location Partner.
                  </span>
                </label>
                {errors.agreedToTerms && (
                  <p className="text-red-400 text-sm mt-2">{errors.agreedToTerms}</p>
                )}
              </div>

              {submitError && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400 text-sm">{submitError}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2D3B5F]">
            {currentStep > 1 ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-[#64748B] text-sm">
          <p>Need help? Contact us at <a href="mailto:support@skyyield.com" className="text-[#0EA5E9] hover:underline">support@skyyield.com</a></p>
        </div>
      </main>
    </div>
  )
}