import { NextRequest, NextResponse } from 'next/server'

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

// Shared submissions storage (in production, use database)
// This would be imported from a shared module
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
    },
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'approved',
  },
]

// GET - Fetch submissions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const formId = searchParams.get('formId')
  const status = searchParams.get('status')
  const id = searchParams.get('id')

  // Get single submission
  if (id) {
    const submission = submissions.find(s => s.id === id)
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }
    return NextResponse.json({ submission })
  }

  // Filter submissions
  let filtered = submissions

  if (formId) {
    filtered = filtered.filter(s => s.formId === formId)
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(s => s.status === status)
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  // Stats
  const stats = {
    total: submissions.length,
    new: submissions.filter(s => s.status === 'new').length,
    reviewed: submissions.filter(s => s.status === 'reviewed').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }

  return NextResponse.json({ submissions: filtered, stats })
}

// POST - Create new submission (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId, formName, data, submittedBy } = body

    if (!formId || !data) {
      return NextResponse.json({ error: 'Form ID and data required' }, { status: 400 })
    }

    const newSubmission: FormSubmission = {
      id: `sub_${Date.now()}`,
      formId,
      formName: formName || 'Unknown Form',
      data,
      submittedAt: new Date().toISOString(),
      submittedBy,
      status: 'new',
    }

    submissions.push(newSubmission)

    return NextResponse.json({ 
      submission: newSubmission,
      message: 'Submission received successfully'
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 })
  }
}

// PATCH - Update submission status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes } = body

    const submissionIndex = submissions.findIndex(s => s.id === id)
    if (submissionIndex === -1) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (status) {
      submissions[submissionIndex].status = status
    }
    if (notes !== undefined) {
      submissions[submissionIndex].notes = notes
    }

    return NextResponse.json({ submission: submissions[submissionIndex] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}

// DELETE - Delete submission
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Submission ID required' }, { status: 400 })
  }

  const index = submissions.findIndex(s => s.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  submissions.splice(index, 1)

  return NextResponse.json({ success: true })
}