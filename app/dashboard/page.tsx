'use client'

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#94A3B8' }}>Loading...</div>
      </div>
    )
  }

  // Placeholder user data
  const user = {
    name: "Partner",
    email: "partner@skyyield.com",
    userType: "referral_partner"
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
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
              letterSpacing: '-0.02em',
              color: '#ffffff'
            }}>
              SkyYield
            </span>
          </div>
          
          {/* Right Side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ 
              fontSize: '13px', 
              color: '#94A3B8',
              fontWeight: '500'
            }}>
              {user.email}
            </div>
            <button
              type="button"
              onClick={() => router.push('/login')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#94A3B8',
                border: '1px solid #2D3B5F',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s',
                letterSpacing: '-0.01em'
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
              Sign Out
            </button>
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
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '600', 
            marginBottom: '8px',
            letterSpacing: '-0.02em',
            color: '#ffffff'
          }}>
            Dashboard
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#94A3B8',
            fontWeight: '400',
            letterSpacing: '-0.01em'
          }}>
            Welcome back, {user.email.split('@')[0]}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {/* Stat Card 1 */}
          <div style={{
            backgroundColor: '#1A1F3A',
            border: '1px solid #2D3B5F',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#94A3B8', 
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              Total Referrals
            </div>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: '300', 
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: '1',
              marginBottom: '8px'
            }}>
              0
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#10F981',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>→</span> Ready to start
            </div>
          </div>

          {/* Stat Card 2 */}
          <div style={{
            backgroundColor: '#1A1F3A',
            border: '1px solid #2D3B5F',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#94A3B8', 
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              Total Earnings
            </div>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: '300', 
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: '1',
              marginBottom: '8px'
            }}>
              $0
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#94A3B8',
              fontWeight: '500'
            }}>
              All time
            </div>
          </div>

          {/* Stat Card 3 */}
          <div style={{
            backgroundColor: '#1A1F3A',
            border: '1px solid #2D3B5F',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#94A3B8', 
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              This Month
            </div>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: '300', 
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: '1',
              marginBottom: '8px'
            }}>
              $0
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#94A3B8',
              fontWeight: '500'
            }}>
              November 2025
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Getting Started */}
          <div style={{
            backgroundColor: '#1A1F3A',
            border: '1px solid #2D3B5F',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '20px',
              color: '#ffffff',
              letterSpacing: '-0.01em'
            }}>
              Getting Started
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Step 1 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: '#0A0F2C',
                border: '1px solid #2D3B5F'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#10F981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#000000',
                  flexShrink: 0
                }}>
                  ✓
                </div>
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '4px',
                    color: '#ffffff'
                  }}>
                    Authentication Complete
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.4' }}>
                    Your account is set up and ready to use
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: '#0A0F2C',
                border: '1px solid #2D3B5F'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#2D3B5F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#94A3B8',
                  flexShrink: 0
                }}>
                  2
                </div>
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '4px',
                    color: '#ffffff'
                  }}>
                    Connect Base44 Data
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.4' }}>
                    Link your portal to Base44 PortalUsers table
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: '#0A0F2C',
                border: '1px solid #2D3B5F'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#2D3B5F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#94A3B8',
                  flexShrink: 0
                }}>
                  3
                </div>
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '4px',
                    color: '#ffffff'
                  }}>
                    Build Partner Portals
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.4' }}>
                    Create dashboards for each partner type
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div style={{
            backgroundColor: '#1A1F3A',
            border: '1px solid #2D3B5F',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '20px',
              color: '#ffffff',
              letterSpacing: '-0.01em'
            }}>
              Session Details
            </h2>
            <div style={{
              backgroundColor: '#0A0F2C',
              border: '1px solid #2D3B5F',
              borderRadius: '6px',
              padding: '16px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Email:</span>
                  <span style={{ fontSize: '12px', color: '#ffffff' }}>{user.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>User Type:</span>
                  <span style={{ fontSize: '12px', color: '#ffffff' }}>
                    {user.userType}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Status:</span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#10F981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ 
                      width: '6px', 
                      height: '6px', 
                      backgroundColor: '#10F981', 
                      borderRadius: '50%' 
                    }}></span>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}