'use client'

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
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
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            letterSpacing: '-0.02em',
            color: '#ffffff'
          }}>
            SkyYield
          </div>
          
          {/* Right Side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ 
              fontSize: '13px', 
              color: '#888888',
              fontWeight: '500'
            }}>
              {session.user?.email}
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#888888',
                border: '1px solid #333333',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s',
                letterSpacing: '-0.01em'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#555555'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#333333'
                e.currentTarget.style.color = '#888888'
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
            color: '#666666',
            fontWeight: '400',
            letterSpacing: '-0.01em'
          }}>
            Welcome back, {session.user?.email?.split('@')[0]}
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
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '8px',
            padding: '24px',
            transition: 'border-color 0.2s'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#666666', 
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
              color: '#4ade80',
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
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#666666', 
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
              color: '#666666',
              fontWeight: '500'
            }}>
              All time
            </div>
          </div>

          {/* Stat Card 3 */}
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#666666', 
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
              color: '#666666',
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
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '8px',
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
                backgroundColor: '#0a0a0a',
                border: '1px solid #1a1a1a'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#4ade80',
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
                  <div style={{ fontSize: '12px', color: '#666666', lineHeight: '1.4' }}>
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
                backgroundColor: '#0a0a0a',
                border: '1px solid #1a1a1a'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#333333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#666666',
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
                  <div style={{ fontSize: '12px', color: '#666666', lineHeight: '1.4' }}>
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
                backgroundColor: '#0a0a0a',
                border: '1px solid #1a1a1a'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#333333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#666666',
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
                  <div style={{ fontSize: '12px', color: '#666666', lineHeight: '1.4' }}>
                    Create dashboards for each partner type
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '8px',
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
              backgroundColor: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '6px',
              padding: '16px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#666666' }}>Email:</span>
                  <span style={{ fontSize: '12px', color: '#ffffff' }}>{session.user?.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#666666' }}>User Type:</span>
                  <span style={{ fontSize: '12px', color: '#ffffff' }}>
                    {session.user?.userType || 'Not set'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#666666' }}>Status:</span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#4ade80',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ 
                      width: '6px', 
                      height: '6px', 
                      backgroundColor: '#4ade80', 
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
