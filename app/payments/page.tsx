'use client'

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import TipaltiIFrame from "@/components/TipaltiIFrame"

export default function PaymentHistoryPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [viewType, setViewType] = useState<'paymentHistory' | 'invoiceHistory' | 'paymentDetails'>('paymentHistory')
  
  // Simple mounted check to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0A0F2C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#94A3B8' }}>Loading...</div>
      </div>
    )
  }

  // In production, this would come from the session/database
  // For now, using a placeholder
  const userEmail = "partner@skyyield.com"
  const payeeId = userEmail.replace('@', '_at_')

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)',
      color: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Navigation Bar */}
      <nav style={{
        backgroundColor: '#1A1F3A',
        borderBottom: '1px solid #2D3B5F',
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
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              S
            </div>
            <span style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#FFFFFF'
            }}>
              SkyYield Portal
            </span>
          </div>
          
          {/* User Info */}
          <div style={{ 
            fontSize: '14px', 
            color: '#94A3B8',
            fontWeight: '500'
          }}>
            {userEmail}
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
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#94A3B8',
              border: '1px solid #2D3B5F',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '1.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#0EA5E9'
              e.currentTarget.style.color = '#0EA5E9'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#2D3B5F'
              e.currentTarget.style.color = '#94A3B8'
            }}
          >
            ← Back to Dashboard
          </button>
          
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#FFFFFF'
          }}>
            Payments & <span style={{ color: '#0EA5E9' }}>Invoices</span>
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#94A3B8',
            margin: 0
          }}>
            View your payment history and manage payment details
          </p>
        </div>

        {/* View Type Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #2D3B5F'
        }}>
          <button
            onClick={() => setViewType('paymentHistory')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: viewType === 'paymentHistory' ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              borderBottom: viewType === 'paymentHistory' ? '2px solid #0EA5E9' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            Payment History
          </button>
          
          <button
            onClick={() => setViewType('invoiceHistory')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: viewType === 'invoiceHistory' ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              borderBottom: viewType === 'invoiceHistory' ? '2px solid #0EA5E9' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            Invoice History
          </button>
          
          <button
            onClick={() => setViewType('paymentDetails')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: viewType === 'paymentDetails' ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              borderBottom: viewType === 'paymentDetails' ? '2px solid #0EA5E9' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            Payment Details
          </button>
        </div>

        {/* Tipalti iFrame Container */}
        <div style={{
          backgroundColor: '#1A1F3A',
          border: '1px solid #2D3B5F',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '2rem'
        }}>
          <TipaltiIFrame 
            payeeId={payeeId}
            viewType={viewType}
            environment="sandbox"
          />
        </div>

        {/* Info Box */}
        <div style={{
          padding: '20px',
          backgroundColor: '#1A1F3A',
          border: '1px solid #2D3B5F',
          borderRadius: '12px'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#94A3B8',
            margin: 0,
            lineHeight: '1.6'
          }}>
            <strong style={{ color: '#FFFFFF' }}>Note:</strong> Payment processing is handled securely by Tipalti. 
            You can update your payment details, view past payments, and download invoices directly from this portal.
          </p>
        </div>
      </main>
    </div>
  )
}