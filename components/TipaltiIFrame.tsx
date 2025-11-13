'use client'

import { useEffect, useState } from 'react'

interface TipaltiIFrameProps {
  payeeId: string
  viewType: 'paymentHistory' | 'invoiceHistory' | 'paymentDetails'
  environment?: 'sandbox' | 'production'
}

export default function TipaltiIFrame({ 
  payeeId, 
  viewType = 'paymentHistory',
  environment = 'sandbox' 
}: TipaltiIFrameProps) {
  const [iframeUrl, setIframeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function generateIFrameUrl() {
      try {
        setLoading(true)
        setError('')

        // Call your API route to generate the authenticated iFrame URL
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

        if (!response.ok) {
          throw new Error('Failed to generate Tipalti iFrame URL')
        }

        const data = await response.json()
        setIframeUrl(data.iframeUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (payeeId) {
      generateIFrameUrl()
    }
  }, [payeeId, viewType, environment])

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111111',
        border: '1px solid #222222',
        borderRadius: '8px'
      }}>
        <div style={{ color: '#666666', fontSize: '14px' }}>
          Loading payment history...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2a1a1a',
        border: '1px solid #4a2222',
        borderRadius: '8px'
      }}>
        <div style={{ color: '#ff6b6b', fontSize: '14px' }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      height: '600px',
      backgroundColor: '#111111',
      border: '1px solid #222222',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <iframe
        src={iframeUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title={`Tipalti ${viewType === 'paymentHistory' ? 'Payment History' : viewType === 'invoiceHistory' ? 'Invoice History' : 'Payment Details'}`}
        allow="payment"
      />
    </div>
  )
}