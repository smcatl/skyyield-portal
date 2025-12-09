import { NextRequest, NextResponse } from 'next/server'

// Types
interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date' | 'file' | 'address'
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // For select, checkbox, radio
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

interface Form {
  id: string
  name: string
  slug: string
  description?: string
  fields: FormField[]
  settings: {
    submitButtonText: string
    successMessage: string
    redirectUrl?: string
    notifyEmail?: string
    requireAuth: boolean
    status: 'draft' | 'active' | 'closed'
  }
  category: 'onboarding' | 'application' | 'survey' | 'support' | 'other'
  createdAt: string
  updatedAt: string
  submissionCount: number
}

interface FormSubmission {
  id: string
  formId: string
  formName: string
  data: Record<string, any>
  submittedAt: string
  submittedBy?: {
    userId?: string
    email?: string
    name?: string
  }
  status: 'new' | 'reviewed' | 'approved' | 'rejected' | 'archived'
  notes?: string
}

// In-memory storage (replace with database in production)
let forms: Form[] = [
  {
    id: 'form_location_partner',
    name: 'Location Partner Application',
    slug: 'location-partner-application',
    description: 'Apply to become a SkyYield Location Partner and earn passive income from your WiFi.',
    fields: [
      { id: 'business_name', type: 'text', label: 'Business Name', required: true, placeholder: 'Your business name' },
      { id: 'contact_name', type: 'text', label: 'Contact Name', required: true, placeholder: 'Full name' },
      { id: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'you@example.com' },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: true, placeholder: '(555) 123-4567' },
      { id: 'business_type', type: 'select', label: 'Business Type', required: true, options: ['Restaurant/Cafe', 'Retail Store', 'Hotel/Hospitality', 'Office Building', 'Medical/Healthcare', 'Gym/Fitness', 'Other'] },
      { id: 'address', type: 'address', label: 'Business Address', required: true, placeholder: '123 Main St, City, State ZIP' },
      { id: 'square_footage', type: 'number', label: 'Approximate Square Footage', required: true, placeholder: '2500' },
      { id: 'daily_visitors', type: 'number', label: 'Estimated Daily Visitors', required: true, placeholder: '500' },
      { id: 'current_wifi', type: 'select', label: 'Current WiFi Provider', required: false, options: ['Comcast/Xfinity', 'AT&T', 'Verizon', 'Spectrum', 'Other', 'None'] },
      { id: 'additional_info', type: 'textarea', label: 'Additional Information', required: false, placeholder: 'Tell us more about your business...' },
      { id: 'agree_terms', type: 'checkbox', label: 'I agree to the terms and conditions', required: true },
    ],
    settings: {
      submitButtonText: 'Submit Application',
      successMessage: 'Thank you for your application! We\'ll review it and get back to you within 2-3 business days.',
      notifyEmail: 'partners@skyyield.io',
      requireAuth: false,
      status: 'active',
    },
    category: 'application',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissionCount: 12,
  },
  {
    id: 'form_referral_partner',
    name: 'Referral Partner Sign-Up',
    slug: 'referral-partner',
    description: 'Join our referral program and earn commissions for every location you refer.',
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', required: true, placeholder: 'Your full name' },
      { id: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'you@example.com' },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: true, placeholder: '(555) 123-4567' },
      { id: 'company', type: 'text', label: 'Company (if applicable)', required: false, placeholder: 'Your company name' },
      { id: 'referral_source', type: 'select', label: 'How did you hear about us?', required: true, options: ['Google', 'LinkedIn', 'Referral', 'Social Media', 'Other'] },
      { id: 'experience', type: 'textarea', label: 'Tell us about your network', required: false, placeholder: 'What types of businesses do you work with?' },
    ],
    settings: {
      submitButtonText: 'Join Program',
      successMessage: 'Welcome to the SkyYield Referral Program! Check your email for next steps.',
      requireAuth: false,
      status: 'active',
    },
    category: 'application',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissionCount: 28,
  },
  {
    id: 'form_contractor',
    name: 'Contractor Application',
    slug: 'contractor-application',
    description: 'Apply to become a certified SkyYield installation contractor.',
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', required: true },
      { id: 'email', type: 'email', label: 'Email', required: true },
      { id: 'phone', type: 'phone', label: 'Phone', required: true },
      { id: 'company', type: 'text', label: 'Company Name', required: false },
      { id: 'service_area', type: 'text', label: 'Service Area (Cities/Regions)', required: true },
      { id: 'experience', type: 'select', label: 'Years of Experience', required: true, options: ['0-1 years', '2-5 years', '5-10 years', '10+ years'] },
      { id: 'certifications', type: 'textarea', label: 'Relevant Certifications', required: false, placeholder: 'List any networking or installation certifications' },
      { id: 'insurance', type: 'checkbox', label: 'I have liability insurance', required: true },
    ],
    settings: {
      submitButtonText: 'Apply Now',
      successMessage: 'Application received! Our team will review and contact you soon.',
      requireAuth: false,
      status: 'active',
    },
    category: 'application',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissionCount: 8,
  },
  {
    id: 'form_site_survey',
    name: 'Site Survey Request',
    slug: 'site-survey',
    description: 'Request a free site survey for your location.',
    fields: [
      { id: 'contact_name', type: 'text', label: 'Contact Name', required: true },
      { id: 'email', type: 'email', label: 'Email', required: true },
      { id: 'phone', type: 'phone', label: 'Phone', required: true },
      { id: 'business_name', type: 'text', label: 'Business Name', required: true },
      { id: 'address', type: 'address', label: 'Location Address', required: true },
      { id: 'preferred_date', type: 'date', label: 'Preferred Survey Date', required: false },
      { id: 'notes', type: 'textarea', label: 'Additional Notes', required: false },
    ],
    settings: {
      submitButtonText: 'Request Survey',
      successMessage: 'Survey request submitted! We\'ll contact you to confirm the appointment.',
      requireAuth: false,
      status: 'active',
    },
    category: 'onboarding',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissionCount: 15,
  },
  {
    id: 'form_support',
    name: 'Support Request',
    slug: 'support',
    description: 'Submit a support ticket for technical assistance.',
    fields: [
      { id: 'name', type: 'text', label: 'Name', required: true },
      { id: 'email', type: 'email', label: 'Email', required: true },
      { id: 'location', type: 'text', label: 'Location/Business Name', required: false },
      { id: 'category', type: 'select', label: 'Issue Category', required: true, options: ['Equipment Issue', 'Connectivity Problem', 'Billing Question', 'Account Access', 'Other'] },
      { id: 'priority', type: 'radio', label: 'Priority', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      { id: 'description', type: 'textarea', label: 'Describe the Issue', required: true },
    ],
    settings: {
      submitButtonText: 'Submit Ticket',
      successMessage: 'Support ticket created! You\'ll receive a confirmation email with your ticket number.',
      requireAuth: false,
      status: 'active',
    },
    category: 'support',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissionCount: 34,
  },
]

let submissions: FormSubmission[] = [
  {
    id: 'sub_1',
    formId: 'form_location_partner',
    formName: 'Location Partner Application',
    data: {
      business_name: 'Downtown Coffee Co.',
      contact_name: 'John Smith',
      email: 'john@downtowncoffee.com',
      phone: '(555) 123-4567',
      business_type: 'Restaurant/Cafe',
      address: '123 Main St, Atlanta, GA 30301',
      square_footage: 2500,
      daily_visitors: 350,
      current_wifi: 'Comcast/Xfinity',
      additional_info: 'We have high foot traffic during morning and lunch hours.',
      agree_terms: true,
    },
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'new',
  },
  {
    id: 'sub_2',
    formId: 'form_location_partner',
    formName: 'Location Partner Application',
    data: {
      business_name: 'Fitness First Gym',
      contact_name: 'Sarah Johnson',
      email: 'sarah@fitnessfirst.com',
      phone: '(555) 987-6543',
      business_type: 'Gym/Fitness',
      address: '456 Oak Ave, Atlanta, GA 30302',
      square_footage: 8000,
      daily_visitors: 200,
      current_wifi: 'AT&T',
      agree_terms: true,
    },
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'reviewed',
  },
  {
    id: 'sub_3',
    formId: 'form_referral_partner',
    formName: 'Referral Partner Sign-Up',
    data: {
      name: 'Mike Davis',
      email: 'mike@techsales.com',
      phone: '(555) 456-7890',
      company: 'Tech Sales Inc',
      referral_source: 'LinkedIn',
      experience: 'I work with many retail and restaurant clients in the Atlanta area.',
    },
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'approved',
  },
]

// GET - Fetch all forms or single form by slug/id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const id = searchParams.get('id')
  const category = searchParams.get('category')
  const status = searchParams.get('status')

  // Get single form by slug
  if (slug) {
    const form = forms.find(f => f.slug === slug)
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }
    return NextResponse.json({ form })
  }

  // Get single form by id
  if (id) {
    const form = forms.find(f => f.id === id)
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }
    return NextResponse.json({ form })
  }

  // Get all forms with optional filtering
  let filteredForms = forms

  if (category && category !== 'all') {
    filteredForms = filteredForms.filter(f => f.category === category)
  }

  if (status && status !== 'all') {
    filteredForms = filteredForms.filter(f => f.settings.status === status)
  }

  return NextResponse.json({ forms: filteredForms })
}

// POST - Create new form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newForm: Form = {
      id: `form_${Date.now()}`,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: body.description || '',
      fields: body.fields || [],
      settings: {
        submitButtonText: body.settings?.submitButtonText || 'Submit',
        successMessage: body.settings?.successMessage || 'Thank you for your submission!',
        redirectUrl: body.settings?.redirectUrl,
        notifyEmail: body.settings?.notifyEmail,
        requireAuth: body.settings?.requireAuth || false,
        status: body.settings?.status || 'draft',
      },
      category: body.category || 'other',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submissionCount: 0,
    }

    forms.push(newForm)

    return NextResponse.json({ form: newForm }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 })
  }
}

// PUT - Update form
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    const formIndex = forms.findIndex(f => f.id === id)
    if (formIndex === -1) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    forms[formIndex] = {
      ...forms[formIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ form: forms[formIndex] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 })
  }
}

// DELETE - Delete form
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Form ID required' }, { status: 400 })
  }

  const formIndex = forms.findIndex(f => f.id === id)
  if (formIndex === -1) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  forms.splice(formIndex, 1)
  // Also delete related submissions
  submissions = submissions.filter(s => s.formId !== id)

  return NextResponse.json({ success: true })
}