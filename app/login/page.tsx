'use client'

import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"

function LoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #2D3B5F',
        borderTopColor: '#0EA5E9',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showError, setShowError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('error')) {
      setShowError(true)
    }
  }, [searchParams])

  const clearError = () => {
    if (showError) {
      setShowError(false)
      router.replace('/login')
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setShowError(false)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const userType = formData.get("userType") as string
    
    if (!userType) {
      setIsLoading(false)
      setShowError(true)
      return
    }
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        userType,
        redirect: false,
      })
      
      console.log('SignIn result:', result)
      
      if (result?.ok && !result?.error) {
        window.location.href = `/portals/${userType}`
      } else {
        setShowError(true)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setShowError(true)
      setIsLoading(false)
    }
  }

  const portalTypes = [
    { value: 'referral', label: 'Referral Partner' },
    { value: 'location', label: 'Location Partner' },
    { value: 'relationship', label: 'Relationship Partner' },
    { value: 'channel', label: 'Channel Partner' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'employee', label: 'Employee' },
    { value: 'admin', label: 'Administrator' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundImage: 'radial-gradient(circle at 50% 50%, #0EA5E9 0%, transparent 50%)'
      }}></div>

      <div style={{
        backgroundColor: '#1A1F3A',
        padding: '48px',
        borderRadius: '16px',
        border: '1px solid #2D3B5F',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              color: '#FFFFFF',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              S
            </span>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            margin: 0
          }}>
            SkyYield
          </h1>
        </div>
        
        <p style={{
          color: '#94A3B8',
          textAlign: 'center',
          marginBottom: '32px',
          fontSize: '15px'
        }}>
          Partner Portal Access
        </p>

        {showError && (
          <div style={{
            padding: '14px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{ 
              color: '#FCA5A5', 
              margin: 0, 
              fontSize: '14px'
            }}>
              Invalid credentials for selected portal type
            </p>
            <button
              onClick={() => setShowError(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#FCA5A5',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0 4px'
              }}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="userType"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#FFFFFF',
                fontSize: '14px'
              }}
            >
              I am a...
            </label>
            <select
              id="userType"
              name="userType"
              required
              onChange={clearError}
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: '#0A0F2C',
                border: '1px solid #2D3B5F',
                borderRadius: '8px',
                fontSize: '15px',
                color: '#FFFFFF',
                boxSizing: 'border-box',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%2394A3B8\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center'
              }}
            >
              <option value="" style={{ backgroundColor: '#0A0F2C' }}>
                Select portal type...
              </option>
              {portalTypes.map(type => (
                <option 
                  key={type.value} 
                  value={type.value}
                  style={{ backgroundColor: '#0A0F2C' }}
                >
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#FFFFFF',
                fontSize: '14px'
              }}
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="partner@example.com"
              onChange={clearError}
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: '#0A0F2C',
                border: '1px solid #2D3B5F',
                borderRadius: '8px',
                fontSize: '15px',
                color: '#FFFFFF',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label 
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#FFFFFF',
                fontSize: '14px'
              }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              onChange={clearError}
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: '#0A0F2C',
                border: '1px solid #2D3B5F',
                borderRadius: '8px',
                fontSize: '15px',
                color: '#FFFFFF',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: isLoading 
                ? '#64748B' 
                : 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '28px',
          padding: '16px',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(14, 165, 233, 0.2)'
        }}>
          <p style={{ 
            fontSize: '13px', 
            color: '#0EA5E9',
            margin: '0 0 8px 0',
            fontWeight: '600'
          }}>
            Test Credentials:
          </p>
          <p style={{ 
            fontSize: '12px', 
            color: '#94A3B8',
            margin: 0,
            lineHeight: '1.6'
          }}>
            Portal: Referral Partner<br />
            Email: referral@skyyield.com<br />
            Password: test123
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  )
}