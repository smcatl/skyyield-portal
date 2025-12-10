'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'

interface TipaltiIFrameProps {
  payeeId: string
  viewType: 'paymentHistory' | 'invoiceHistory' | 'paymentDetails'
  environment?: 'sandbox' | 'production'
}

export default function TipaltiIFrame({ 
  payeeId, 
  viewType = 'paymentHistory',
  environment = 'production'  // Default to production
}: TipaltiIFrameProps) {
  const [iframeUrl, setIframeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function generateIFrameUrl() {
      if (!payeeId) {
        setError('No payee selected')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        // Call API route to generate authenticated iFrame URL
        const response = await fetch('/api/tipalti/generate-iframe-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payeeId,
            viewType,
            environment
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate Tipalti iFrame URL')
        }

        setIframeUrl(data.iframeUrl)
      } catch (err) {
        console.error('Tipalti iframe error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    generateIFrameUrl()
  }, [payeeId, viewType, environment])

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0EA5E9] mx-auto mb-3" />
          <p className="text-[#94A3B8]">Loading payment information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-[#1A1F3A] border border-red-500/30 rounded-lg">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">Unable to Load Payment Details</h3>
          <p className="text-[#94A3B8] text-sm mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors text-sm"
            >
              Try Again
            </button>
            <div className="text-[#64748B] text-xs">
              If this payee hasn't set up payments yet, they'll be prompted to do so when they first access the iframe.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* iFrame Container */}
      <div className="w-full h-[600px] bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg overflow-hidden">
        <iframe
          src={iframeUrl}
          className="w-full h-full border-none"
          title={`Tipalti ${
            viewType === 'paymentHistory' ? 'Payment History' : 
            viewType === 'invoiceHistory' ? 'Invoice History' : 
            'Payment Details'
          }`}
          allow="payment"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
      
      {/* Footer with direct link */}
      <div className="mt-2 flex items-center justify-end">
        <a
          href={iframeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#64748B] hover:text-[#0EA5E9] text-xs transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Open in new tab
        </a>
      </div>
    </div>
  )
}