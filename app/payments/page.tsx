'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import TipaltiIFrame from "@/components/TipaltiIFrame"

export default function PaymentHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [viewType, setViewType] = useState<'paymentHistory' | 'invoiceHistory' | 'paymentDetails'>('paymentHistory')
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])
  
  if (status === "loading") {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}></div>
  }
  
  if (!session) {
    return null
  }

  // In production, this would come from the user's database record
  // For now, using email as payee ID (you'll want to use actual Tipalti payee ID)
  const payeeId = session.user?.email?.replace('@', '_at_') || 'unknown'

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Navigation Bar */}
      <nav style={{
        backgroundColor: '#111111',
        borderBottom: '1px solid #222222',
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <div 
            onClick={() => router.push('/dashboard')}
            style={{
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '-0.02em',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            SkyYield
          </div>
          
          {/* User Info */}
          <div style={{ 
            fontSize: '13px', 
            color: '#888888',
            fontWeight: '500'
          }}>
            {session.user?.email}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '3rem 2rem'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              color: '#666666',
              border: '1px solid #333333',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#555555'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#333333'
              e.currentTarget.style.color = '#666666'
            }}
          >
            ← Back to Dashboard
          </button>
          
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '600', 
            marginBottom: '8px',
            letterSpacing: '-0.02em',
            color: '#ffffff'
          }}>
            Payments
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#666666',
            fontWeight: '400',
            letterSpacing: '-0.01em'
          }}>
            View your payment history and manage payment details
          </p>
        </div>

        {/* View Type Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #222222',
          paddingBottom: '0'
        }}>
          <button
            onClick={() => setViewType('paymentHistory')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: viewType === 'paymentHistory' ? '#ffffff' : '#666666',
              border: 'none',
              borderBottom: viewType === 'paymentHistory' ? '2px solid #ffffff' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              letterSpacing: '-0.01em'
            }}
          >
            Payment History
          </button>
          
          <button
            onClick={() => setViewType('invoiceHistory')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: viewType === 'invoiceHistory' ? '#ffffff' : '#666666',
              border: 'none',
              borderBottom: viewType === 'invoiceHistory' ? '2px solid #ffffff' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              letterSpacing: '-0.01em'
            }}
          >
            Invoice History
          </button>
          
          <button
            onClick={() => setViewType('paymentDetails')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: viewType === 'paymentDetails' ? '#ffffff' : '#666666',
              border: 'none',
              borderBottom: viewType === 'paymentDetails' ? '2px solid #ffffff' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              letterSpacing: '-0.01em'
            }}
          >
            Payment Details
          </button>
        </div>

        {/* Tipalti iFrame */}
        <TipaltiIFrame 
          payeeId={payeeId}
          viewType={viewType}
          environment="sandbox"
        />

        {/* Info Box */}
        <div style={{
          marginTop: '2rem',
          padding: '16px',
          backgroundColor: '#111111',
          border: '1px solid #222222',
          borderRadius: '8px'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#666666',
            margin: 0,
            lineHeight: '1.5'
          }}>
            <strong style={{ color: '#888888' }}>Note:</strong> Payment processing is handled securely by Tipalti. 
            You can update your payment details, view past payments, and download invoices directly from this portal.
          </p>
        </div>
      </main>
    </div>
  )
}