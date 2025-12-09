// API Route: PandaDoc Document Management
// app/api/pipeline/pandadoc/route.ts

import { NextRequest, NextResponse } from 'next/server'

const PANDADOC_API_BASE = 'https://api.pandadoc.com/public/v1'

// Helper to make PandaDoc API requests
async function pandadocFetch(endpoint: string, options: RequestInit = {}) {
  const apiKey = process.env.PANDADOC_API_KEY
  
  if (!apiKey) {
    throw new Error('PANDADOC_API_KEY not configured')
  }

  const res = await fetch(`${PANDADOC_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `API-Key ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`PandaDoc API error: ${error}`)
  }

  return res.json()
}

// GET: List documents or get document status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get('documentId')
  const partnerId = searchParams.get('partnerId')

  try {
    if (documentId) {
      // Get specific document
      const doc = await pandadocFetch(`/documents/${documentId}`)
      return NextResponse.json({ success: true, document: doc })
    }

    if (partnerId) {
      // Search documents by partner metadata
      const docs = await pandadocFetch(`/documents?metadata_partner_id=${partnerId}`)
      return NextResponse.json({ success: true, documents: docs.results })
    }

    // List recent documents
    const docs = await pandadocFetch('/documents?count=20&order_by=date_created')
    return NextResponse.json({ success: true, documents: docs.results })

  } catch (error) {
    console.error('PandaDoc GET error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch documents',
      details: String(error)
    }, { status: 500 })
  }
}

// POST: Create and send document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, partner, documentType, templateId } = body

    if (!partner) {
      return NextResponse.json({ error: 'Partner data required' }, { status: 400 })
    }

    switch (action) {
      case 'create_loi':
        return await createLOI(partner, templateId)
      
      case 'create_contract':
        return await createDeploymentContract(partner, templateId)
      
      case 'send':
        return await sendDocument(body.documentId)
      
      case 'download':
        return await downloadDocument(body.documentId)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('PandaDoc POST error:', error)
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: String(error)
    }, { status: 500 })
  }
}

// Create Letter of Intent
async function createLOI(partner: any, templateId?: string) {
  const recipientEmail = partner.contactEmail
  const recipientName = partner.contactFullName
  const companyName = partner.companyDBA || partner.companyLegalName

  // If no template, create from scratch
  const documentData = {
    name: `Letter of Intent - ${companyName}`,
    template_uuid: templateId || process.env.PANDADOC_LOI_TEMPLATE_ID,
    recipients: [
      {
        email: recipientEmail,
        first_name: recipientName.split(' ')[0],
        last_name: recipientName.split(' ').slice(1).join(' ') || '',
        role: 'signer',
      }
    ],
    tokens: [
      { name: 'partner_name', value: recipientName },
      { name: 'company_name', value: companyName },
      { name: 'company_legal_name', value: partner.companyLegalName || companyName },
      { name: 'contact_email', value: recipientEmail },
      { name: 'contact_phone', value: partner.contactPhone || '' },
      { name: 'venue_address', value: partner.venues?.[0]?.address || '' },
      { name: 'venue_count', value: String(partner.venues?.length || 1) },
      { name: 'date', value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { name: 'trial_duration', value: '60 days' },
      { name: 'revenue_share', value: '50%' },
    ],
    metadata: {
      partner_id: partner.id,
      document_type: 'loi',
      company_name: companyName,
    },
    parse_form_fields: false,
  }

  try {
    // Create document from template
    const doc = await pandadocFetch('/documents', {
      method: 'POST',
      body: JSON.stringify(documentData),
    })

    console.log(`📄 Created LOI document: ${doc.id}`)

    return NextResponse.json({
      success: true,
      message: 'LOI created successfully',
      document: {
        id: doc.id,
        name: doc.name,
        status: doc.status,
        uuid: doc.uuid,
      }
    })

  } catch (error) {
    console.error('Failed to create LOI:', error)
    return NextResponse.json({ 
      error: 'Failed to create LOI',
      details: String(error)
    }, { status: 500 })
  }
}

// Create Deployment Contract
async function createDeploymentContract(partner: any, templateId?: string) {
  const recipientEmail = partner.contactEmail
  const recipientName = partner.contactFullName
  const companyName = partner.companyDBA || partner.companyLegalName

  const documentData = {
    name: `Deployment Agreement - ${companyName}`,
    template_uuid: templateId || process.env.PANDADOC_CONTRACT_TEMPLATE_ID,
    recipients: [
      {
        email: recipientEmail,
        first_name: recipientName.split(' ')[0],
        last_name: recipientName.split(' ').slice(1).join(' ') || '',
        role: 'signer',
      }
    ],
    tokens: [
      { name: 'partner_name', value: recipientName },
      { name: 'company_name', value: companyName },
      { name: 'company_legal_name', value: partner.companyLegalName || companyName },
      { name: 'contact_email', value: recipientEmail },
      { name: 'contact_phone', value: partner.contactPhone || '' },
      { name: 'venue_count', value: String(partner.venues?.length || 1) },
      { name: 'device_count', value: String(partner.deviceCount || partner.venues?.reduce((sum: number, v: any) => sum + (v.devices?.length || 1), 0) || 1) },
      { name: 'date', value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { name: 'contract_duration', value: '24 months' },
      { name: 'revenue_share', value: '50%' },
      { name: 'trial_earnings', value: partner.trialEarnings || '$0.00' },
    ],
    metadata: {
      partner_id: partner.id,
      document_type: 'deployment_contract',
      company_name: companyName,
    },
    parse_form_fields: false,
  }

  try {
    const doc = await pandadocFetch('/documents', {
      method: 'POST',
      body: JSON.stringify(documentData),
    })

    console.log(`📄 Created Deployment Contract: ${doc.id}`)

    return NextResponse.json({
      success: true,
      message: 'Deployment Contract created successfully',
      document: {
        id: doc.id,
        name: doc.name,
        status: doc.status,
        uuid: doc.uuid,
      }
    })

  } catch (error) {
    console.error('Failed to create contract:', error)
    return NextResponse.json({ 
      error: 'Failed to create contract',
      details: String(error)
    }, { status: 500 })
  }
}

// Send document for signature
async function sendDocument(documentId: string) {
  if (!documentId) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
  }

  try {
    // First check document status
    const doc = await pandadocFetch(`/documents/${documentId}`)
    
    if (doc.status !== 'document.draft') {
      return NextResponse.json({ 
        error: `Cannot send document in status: ${doc.status}`,
        currentStatus: doc.status
      }, { status: 400 })
    }

    // Send the document
    await pandadocFetch(`/documents/${documentId}/send`, {
      method: 'POST',
      body: JSON.stringify({
        message: 'Please review and sign this document at your earliest convenience.',
        subject: `Document Ready for Signature: ${doc.name}`,
        silent: false, // Send email notification
      }),
    })

    console.log(`📤 Sent document ${documentId} for signature`)

    return NextResponse.json({
      success: true,
      message: 'Document sent for signature',
      documentId,
    })

  } catch (error) {
    console.error('Failed to send document:', error)
    return NextResponse.json({ 
      error: 'Failed to send document',
      details: String(error)
    }, { status: 500 })
  }
}

// Download signed document
async function downloadDocument(documentId: string) {
  if (!documentId) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
  }

  try {
    const apiKey = process.env.PANDADOC_API_KEY
    
    const res = await fetch(`${PANDADOC_API_BASE}/documents/${documentId}/download`, {
      headers: {
        'Authorization': `API-Key ${apiKey}`,
      },
    })

    if (!res.ok) {
      throw new Error('Failed to download document')
    }

    // Return download URL or PDF
    const downloadUrl = `${PANDADOC_API_BASE}/documents/${documentId}/download`
    
    return NextResponse.json({
      success: true,
      downloadUrl,
      message: 'Use the download URL with your API key to download the PDF',
    })

  } catch (error) {
    console.error('Failed to download document:', error)
    return NextResponse.json({ 
      error: 'Failed to download document',
      details: String(error)
    }, { status: 500 })
  }
}

// List available templates
export async function PUT(request: NextRequest) {
  try {
    const templates = await pandadocFetch('/templates')
    
    return NextResponse.json({
      success: true,
      templates: templates.results?.map((t: any) => ({
        id: t.id,
        name: t.name,
        created: t.date_created,
        modified: t.date_modified,
      }))
    })
  } catch (error) {
    console.error('Failed to list templates:', error)
    return NextResponse.json({ 
      error: 'Failed to list templates',
      details: String(error)
    }, { status: 500 })
  }
}