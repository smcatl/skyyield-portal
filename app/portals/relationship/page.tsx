'use client'

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function RelationshipPartnerPortal() {
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
        Relationship Partner <span style={{ color: '#0EA5E9' }}>Portal</span>
      </h1>
      
      <div style={{
        background: '#1A1F3A',
        border: '1px solid #2D3B5F',
        borderRadius: '12px',
        padding: '2rem',
        marginTop: '2rem'
      }}>
        <p style={{ color: '#94A3B8' }}>
          Relationship Partner portal is under construction. Coming soon!
        </p>
      </div>
    </div>
  )
}
