'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Users, User, MapPin, Handshake, CheckCircle, ArrowRight, ArrowLeft, Loader2, Wifi } from 'lucide-react'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]

const COMPANY_TYPES = [
  'LLC',
  'Corporation',
  'Partnership',
  'Sole Proprietorship',
  'Other'
]

const REFERRAL_ESTIMATES = [
  '1-2 per month',
  '3-5 per month',
  '6-10 per month',
  '10+ per month'
]

const HOW_HEARD = [
  'LinkedIn',
  'Google Search',
  'Referral from a friend',
  'Industry Event',
  'Social Media',
  'Other'
]

function ReferralPartnerFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Step 1: Contact Info
    entityType: 'individual', // individual or business
    firstName: '',
    lastName: '',
    companyName: '',
    companyType: '',
    contactEmail: '',
    contactPhone: '',
    contactTitle: '',
    linkedInProfile: '',

    // Step 2: Location
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',

    // Step 3: Partnership Details
    networkDescription: '',
    estimatedReferrals: '',
    howDidYouHear: '',
    additionalNotes: '',

    // Hidden
    referredByCode: refCode || '',
    agreedToTerms: false,
  })

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (stepNum === 1) {
      if (formData.entityType === 'individual') {
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
      } else {
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required'
        if (!formData.companyType) newErrors.companyType = 'Company type is required'
      }
      if (!formData.contactEmail.trim()) newErrors.contactEmail = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) newErrors.contactEmail = 'Invalid email'
      if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Phone is required'
    }

    if (stepNum === 2) {
      if (!formData.city.trim()) newErrors.city = 'City is required'
      if (!formData.state) newErrors.state = 'State is required'
    }

    if (stepNum === 3) {
      if (!formData.networkDescription.trim()) newErrors.networkDescription = 'Please describe your network'
      if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const prevStep = () => setStep(step - 1)

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setIsSubmitting(true)
    try {
      const fullName = formData.entityType === 'individual'
        ? `${formData.firstName} ${formData.lastName}`.trim()
        : formData.contactTitle ? `${formData.firstName} ${formData.lastName}`.trim() : ''

      const response = await fetch('/api/pipeline/referral-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_type: 'referral',
          entity_type: formData.entityType,
          company_name: formData.entityType === 'business' ? formData.companyName : null,
          company_type: formData.entityType === 'business' ? formData.companyType : null,
          contact_full_name: fullName,
          contact_first_name: formData.firstName,
          contact_last_name: formData.lastName,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          contact_title: formData.contactTitle,
          linkedin_profile: formData.linkedInProfile,
          address_line_1: formData.addressLine1,
          address_line_2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          network_description: formData.networkDescription,
          estimated_referrals: formData.estimatedReferrals,
          referral_source: formData.howDidYouHear || 'website',
          referred_by_code: formData.referredByCode,
          notes: formData.additionalNotes,
        }),
      })

      if (!response.ok) throw new Error('Submission failed')

      setIsSuccess(true)
    } catch (error) {
      console.error('Submission error:', error)
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
          <p className="text-[#94A3B8] mb-8">
            Thank you for your interest in becoming a SkyYield Referral Partner. We'll review your application and reach out within 2 business days with next steps.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#0EA5E9] text-white rounded-lg font-medium hover:bg-[#0EA5E9]/90 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0F2C] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wifi className="w-8 h-8 text-[#0EA5E9]" />
            <span className="text-2xl font-bold text-white">SkyYield</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Referral Partner Application</h1>
          <p className="text-[#94A3B8]">Earn commissions by connecting businesses with SkyYield</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s === step
                    ? 'bg-[#0EA5E9] text-white'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-[#1E293B] text-[#64748B]'
                }`}
              >
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 mx-1 ${s < step ? 'bg-green-500' : 'bg-[#1E293B]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-[#0F1629] border border-[#2D3B5F] rounded-xl p-6 md:p-8">
          {/* Step 1: Contact Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-[#0EA5E9]" />
                <h2 className="text-xl font-semibold text-white">Contact Information</h2>
              </div>

              {/* Entity Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-3">I am applying as *</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => updateField('entityType', 'individual')}
                    className={`flex-1 py-3 px-4 rounded-lg border ${
                      formData.entityType === 'individual'
                        ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9]'
                        : 'border-[#2D3B5F] bg-[#1E293B] text-[#94A3B8]'
                    } transition-colors`}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('entityType', 'business')}
                    className={`flex-1 py-3 px-4 rounded-lg border ${
                      formData.entityType === 'business'
                        ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9]'
                        : 'border-[#2D3B5F] bg-[#1E293B] text-[#94A3B8]'
                    } transition-colors`}
                  >
                    Business Entity
                  </button>
                </div>
              </div>

              {/* Business fields */}
              {formData.entityType === 'business' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => updateField('companyName', e.target.value)}
                      className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.companyName ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`}
                      placeholder="Your Company, LLC"
                    />
                    {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Entity Type *</label>
                    <select
                      value={formData.companyType}
                      onChange={(e) => updateField('companyType', e.target.value)}
                      className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.companyType ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`}
                    >
                      <option value="">Select type...</option>
                      {COMPANY_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.companyType && <p className="text-red-500 text-sm mt-1">{errors.companyType}</p>}
                  </div>
                </div>
              )}

              {/* Name fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    {formData.entityType === 'business' ? 'Contact First Name' : 'First Name *'}
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.firstName ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    {formData.entityType === 'business' ? 'Contact Last Name' : 'Last Name *'}
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.lastName ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`}
                    placeholder="Doe"
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.contactEmail ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`}
                  placeholder="john@example.com"
                />
                {errors.contactEmail && <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => updateField('contactPhone', e.target.value)}
                    className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.contactPhone ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`}
                    placeholder="(404) 555-0123"
                  />
                  {errors.contactPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.contactTitle}
                    onChange={(e) => updateField('contactTitle', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    placeholder="Business Development"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">LinkedIn Profile (optional)</label>
                <input
                  type="url"
                  value={formData.linkedInProfile}
                  onChange={(e) => updateField('linkedInProfile', e.target.value)}
                  className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-[#0EA5E9]" />
                <h2 className="text-xl font-semibold text-white">Your Location</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">Street Address (optional)</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => updateField('addressLine1', e.target.value)}
                  className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">Suite / Unit (optional)</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => updateField('addressLine2', e.target.value)}
                  className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  placeholder="Suite 100"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.city ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`}
                    placeholder="Atlanta"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">State *</label>
                  <select
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.state ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]`}
                  >
                    <option value="">State</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">ZIP</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => updateField('zip', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    placeholder="30309"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Partnership Details */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Handshake className="w-6 h-6 text-[#0EA5E9]" />
                <h2 className="text-xl font-semibold text-white">Partnership Details</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                  Describe your network and how you plan to refer businesses *
                </label>
                <textarea
                  value={formData.networkDescription}
                  onChange={(e) => updateField('networkDescription', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 bg-[#1E293B] border ${errors.networkDescription ? 'border-red-500' : 'border-[#2D3B5F]'} rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] resize-none`}
                  placeholder="Tell us about your connections in the hospitality, retail, or commercial real estate space..."
                />
                {errors.networkDescription && <p className="text-red-500 text-sm mt-1">{errors.networkDescription}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Estimated Referrals</label>
                  <select
                    value={formData.estimatedReferrals}
                    onChange={(e) => updateField('estimatedReferrals', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="">Select...</option>
                    {REFERRAL_ESTIMATES.map(est => (
                      <option key={est} value={est}>{est}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">How did you hear about us?</label>
                  <select
                    value={formData.howDidYouHear}
                    onChange={(e) => updateField('howDidYouHear', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="">Select...</option>
                    {HOW_HEARD.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">Additional Notes</label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => updateField('additionalNotes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1E293B] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] resize-none"
                  placeholder="Anything else you'd like us to know?"
                />
              </div>

              {/* Commission Info */}
              <div className="p-4 bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 rounded-lg">
                <h3 className="text-[#0EA5E9] font-medium mb-2">Commission Structure</h3>
                <p className="text-[#94A3B8] text-sm">
                  As a Referral Partner, you'll earn a percentage of recurring revenue from each business you refer. Commission rates are discussed during onboarding and vary based on deal size and partnership tier.
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-[#1E293B] rounded-lg">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.agreedToTerms}
                  onChange={(e) => updateField('agreedToTerms', e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-[#2D3B5F] bg-[#0F1629] text-[#0EA5E9] focus:ring-[#0EA5E9]"
                />
                <label htmlFor="terms" className="text-sm text-[#94A3B8]">
                  I agree to the{' '}
                  <a href="/terms" className="text-[#0EA5E9] hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-[#0EA5E9] hover:underline">Privacy Policy</a>
                  . I understand SkyYield will contact me regarding this application.
                </label>
              </div>
              {errors.agreedToTerms && <p className="text-red-500 text-sm">{errors.agreedToTerms}</p>}
              {errors.submit && <p className="text-red-500 text-sm text-center">{errors.submit}</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-[#2D3B5F]">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 text-[#94A3B8] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-[#0EA5E9] text-white rounded-lg font-medium hover:bg-[#0EA5E9]/90 transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-[#10F981] text-[#0A0F2C] rounded-lg font-medium hover:bg-[#10F981]/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#64748B] text-sm mt-6">
          Questions? Contact us at{' '}
          <a href="mailto:partners@skyyield.io" className="text-[#0EA5E9] hover:underline">
            partners@skyyield.io
          </a>
        </p>
      </div>
    </div>
  )
}

export default function ReferralPartnerApplicationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin" />
      </div>
    }>
      <ReferralPartnerFormContent />
    </Suspense>
  )
}
