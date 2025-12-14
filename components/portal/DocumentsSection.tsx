'use client'

import { useState } from 'react'
import { FileText, Download, Eye, Clock, CheckCircle, AlertCircle, ExternalLink, File } from 'lucide-react'

interface Document {
  id: string
  name: string
  type: 'loi' | 'contract' | 'agreement' | 'policy' | 'other'
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'expired'
  createdAt: string
  signedAt?: string
  expiresAt?: string
  downloadUrl?: string
  viewUrl?: string
  pandadocId?: string
}

interface DocumentsSectionProps {
  documents: Document[]
  loading?: boolean
  title?: string
  showUpload?: boolean
  onSign?: (docId: string) => void
}

export default function DocumentsSection({
  documents,
  loading = false,
  title = 'Documents',
  showUpload = false,
  onSign,
}: DocumentsSectionProps) {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'viewed': return <Eye className="w-4 h-4 text-blue-400" />
      case 'sent': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'pending': return <Clock className="w-4 h-4 text-[#64748B]" />
      case 'expired': return <AlertCircle className="w-4 h-4 text-red-400" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'viewed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'sent': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'pending': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'loi': return 'Letter of Intent'
      case 'contract': return 'Contract'
      case 'agreement': return 'Agreement'
      case 'policy': return 'Policy'
      default: return 'Document'
    }
  }

  const getTypeIcon = (type: string) => {
    return <FileText className="w-5 h-5 text-[#0EA5E9]" />
  }

  const pendingSignatures = documents.filter(d => d.status === 'sent' || d.status === 'viewed')
  const signedDocs = documents.filter(d => d.status === 'signed')

  return (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl">
      {/* Header */}
      <div className="p-4 border-b border-[#2D3B5F]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="flex items-center gap-2 text-sm">
            {pendingSignatures.length > 0 && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                {pendingSignatures.length} pending
              </span>
            )}
            <span className="text-[#64748B]">{documents.length} total</span>
          </div>
        </div>
      </div>

      {/* Pending Signatures Alert */}
      {pendingSignatures.length > 0 && (
        <div className="p-4 border-b border-[#2D3B5F] bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <div className="text-yellow-400 font-medium">Action Required</div>
              <div className="text-[#94A3B8] text-sm">
                You have {pendingSignatures.length} document(s) waiting for your signature
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="divide-y divide-[#2D3B5F]">
        {loading ? (
          <div className="p-8 text-center text-[#64748B]">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-[#64748B]">No documents yet</div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              className="p-4 hover:bg-[#0A0F2C]/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0A0F2C] rounded-lg flex items-center justify-center">
                  {getTypeIcon(doc.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-white font-medium">{doc.name}</div>
                      <div className="text-[#64748B] text-sm">{getTypeLabel(doc.type)}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(doc.status)}`}>
                      {getStatusIcon(doc.status)}
                      {doc.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-[#64748B]">
                      Created {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                    {doc.signedAt && (
                      <span className="text-green-400">
                        Signed {new Date(doc.signedAt).toLocaleDateString()}
                      </span>
                    )}
                    {doc.expiresAt && doc.status !== 'signed' && (
                      <span className="text-yellow-400">
                        Expires {new Date(doc.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {(doc.status === 'sent' || doc.status === 'viewed') && doc.viewUrl && (
                      <a
                        href={doc.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0EA5E9] text-white rounded-lg text-sm hover:bg-[#0EA5E9]/80 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Sign Document
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {doc.viewUrl && (
                      <a
                        href={doc.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0F2C] text-[#94A3B8] rounded-lg text-sm hover:text-white hover:bg-[#2D3B5F] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </a>
                    )}
                    {doc.downloadUrl && doc.status === 'signed' && (
                      <a
                        href={doc.downloadUrl}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0F2C] text-[#94A3B8] rounded-lg text-sm hover:text-white hover:bg-[#2D3B5F] transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
