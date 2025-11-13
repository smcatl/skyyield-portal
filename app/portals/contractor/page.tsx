'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ContractorPortal() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000'
      }}>
        <div style={{ color: '#0EA5E9', fontSize: '18px' }}>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleSignOut = () => {
    router.push("/api/auth/signout")
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#FFFFFF'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#0A0F2C',
        borderBottom: '1px solid #1E293B',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            S
          </div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            margin: 0
          }}>
            SkyYield
          </h1>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <span style={{ color: '#94A3B8', fontSize: '14px' }}>
            {session.user?.email}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1E293B',
              color: '#FFFFFF',
              border: '1px solid #334155',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '40px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#FFFFFF'
          }}>
            Contractor Portal
          </h2>
          <p style={{
            color: '#94A3B8',
            fontSize: '16px',
            margin: 0
          }}>
            Welcome back, {session.user?.name || 'Contractor'}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {/* Active Projects */}
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
              Active Projects
            </div>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: '8px'
            }}>
              0
            </div>
            <div style={{
              fontSize: '14px',
              color: '#10F981',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              → Ready for assignments
            </div>
          </div>

          {/* Hours This Month */}
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
              Hours This Month
            </div>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: '8px'
            }}>
              0
            </div>
            <div style={{
              fontSize: '14px',
              color: '#94A3B8'
            }}>
              November 2025
            </div>
          </div>

          {/* Pending Payments */}
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
              Pending Payments
            </div>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: '8px'
            }}>
              $0
            </div>
            <div style={{
              fontSize: '14px',
              color: '#94A3B8'
            }}>
              Awaiting approval
            </div>
          </div>

          {/* Total Earnings */}
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
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: '8px'
            }}>
              $0
            </div>
            <div style={{
              fontSize: '14px',
              color: '#94A3B8'
            }}>
              All time
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {/* Getting Started */}
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#FFFFFF'
            }}>
              Getting Started
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  <div style={{ fontSize: '12px', color: '#666666', lineHeight: '1.4' }}>
                    Your contractor account is active
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
                    Complete Profile
                  </div>
                  <div style={{ fontSize: '12px', color: '#666666', lineHeight: '1.4' }}>
                    Add certifications and skills
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
                    Accept First Project
                  </div>
                  <div style={{ fontSize: '12px', color: '#666666', lineHeight: '1.4' }}>
                    View available assignments
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#FFFFFF'
            }}>
              Session Details
            </h3>

            <div style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '6px',
              padding: '16px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666666' }}>Email:</span>
                <span style={{ color: '#ffffff' }}>{session.user?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666666' }}>User Type:</span>
                <span style={{ color: '#0EA5E9' }}>contractor</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666666' }}>Status:</span>
                <span style={{ color: '#10F981' }}>● Active</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}