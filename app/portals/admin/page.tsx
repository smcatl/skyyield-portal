'use client'

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminPortal() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)' }}></div>
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)',
      color: '#FFFFFF',
      padding: '2rem'
    }}>
      <nav style={{ marginBottom: '2rem' }}>
        <button onClick={() => router.push('/dashboard')} style={{
          padding: '8px 16px',
          background: 'transparent',
          color: '#94A3B8',
          border: '1px solid #2D3B5F',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          ← Back to Dashboard
        </button>
      </nav>
      
      <h1 style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: '1rem' }}>
        Admin <span style={{ color: '#0EA5E9' }}>Portal</span>
      </h1>
      
      <div style={{
        background: '#1A1F3A',
        border: '1px solid #2D3B5F',
        borderRadius: '12px',
        padding: '2rem',
        marginTop: '2rem'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '1rem', color: '#FFFFFF' }}>
          Admin Dashboard
        </h2>
        <p style={{ color: '#94A3B8', marginBottom: '2rem' }}>
          Admin portal with full system access. Under construction.
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            background: '#0A0F2C',
            border: '1px solid #2D3B5F',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '0.5rem' }}>
              Total Partners
            </h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF' }}>0</p>
          </div>
          
          <div style={{
            background: '#0A0F2C',
            border: '1px solid #2D3B5F',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '0.5rem' }}>
              Pending Approvals
            </h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF' }}>0</p>
          </div>
          
          <div style={{
            background: '#0A0F2C',
            border: '1px solid #2D3B5F',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '0.5rem' }}>
              Active Users
            </h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10F981' }}>1</p>
          </div>
        </div>
      </div>
    </div>
  )
}
