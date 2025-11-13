'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminPortal() {
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
          <span style={{
            marginLeft: '12px',
            padding: '4px 8px',
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: '600',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            ADMIN
          </span>
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
            Admin Portal
          </h2>
          <p style={{
            color: '#94A3B8',
            fontSize: '16px',
            margin: 0
          }}>
            Full system access and management
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {/* Total Partners */}
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
              Total Partners
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
              All partner types
            </div>
          </div>

          {/* Active Users */}
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
              Active Users
            </div>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: '8px'
            }}>
              9
            </div>
            <div style={{
              fontSize: '14px',
              color: '#10F981',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ● System operational
            </div>
          </div>

          {/* Pending Approvals */}
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
              Pending Approvals
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
              Require review
            </div>
          </div>

          {/* Monthly Payouts */}
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
              This Month Payouts
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
              November 2025
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {/* Admin Actions */}
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
              Admin Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Action 1 */}
              <button style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'border-color 0.2s'
              }}>
                <span>Manage Partners</span>
                <span style={{ color: '#0EA5E9' }}>→</span>
              </button>

              {/* Action 2 */}
              <button style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <span>User Management</span>
                <span style={{ color: '#0EA5E9' }}>→</span>
              </button>

              {/* Action 3 */}
              <button style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <span>Process Commissions</span>
                <span style={{ color: '#0EA5E9' }}>→</span>
              </button>

              {/* Action 4 */}
              <button style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <span>Reports & Analytics</span>
                <span style={{ color: '#0EA5E9' }}>→</span>
              </button>

              {/* Action 5 */}
              <button style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #DC2626',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <span>System Settings</span>
                <span style={{ color: '#DC2626' }}>⚙</span>
              </button>
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
              lineHeight: '1.6',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666666' }}>Email:</span>
                <span style={{ color: '#ffffff' }}>{session.user?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666666' }}>User Type:</span>
                <span style={{ color: '#DC2626' }}>admin</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666666' }}>Status:</span>
                <span style={{ color: '#10F981' }}>● Active</span>
              </div>
            </div>

            {/* System Status */}
            <div style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '6px',
              padding: '16px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#666666',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px'
              }}>
                System Health
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>API Status:</span>
                  <span style={{ color: '#10F981' }}>● Online</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Database:</span>
                  <span style={{ color: '#10F981' }}>● Connected</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Last Backup:</span>
                  <span style={{ color: '#94A3B8' }}>2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          marginTop: '24px',
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
            Recent Activity
          </h3>
          <div style={{
            color: '#666666',
            fontSize: '14px',
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            No recent activity to display
          </div>
        </div>
      </main>
    </div>
  )
}