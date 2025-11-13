'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
      } else if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2rem'
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}>
            SkyYield
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666666',
            fontWeight: '400'
          }}>
            Partner Portal
          </p>
        </div>

        {/* Login Form */}
        <div style={{
          backgroundColor: '#111111',
          border: '1px solid #222222',
          borderRadius: '12px',
          padding: '32px'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#ffffff',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em'
                }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue="test@skyyield.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#555555'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#333333'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#ffffff',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em'
                }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                defaultValue="test123"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#555555'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#333333'}
              />
            </div>

            {(error || searchParams?.get('error')) && (
              <div style={{
                padding: '12px',
                backgroundColor: '#2a1a1a',
                border: '1px solid #4a2222',
                borderRadius: '6px',
                marginBottom: '24px'
              }}>
                <p style={{
                  fontSize: '13px',
                  color: '#ff6b6b',
                  margin: 0
                }}>
                  {error || 'Invalid email or password'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#ffffff',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s',
                letterSpacing: '-0.01em'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Test Credentials */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#111111',
          border: '1px solid #222222',
          borderRadius: '8px'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#666666',
            margin: 0,
            marginBottom: '8px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Test Credentials
          </p>
          <div style={{
            fontSize: '13px',
            color: '#888888',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          }}>
            <div style={{ marginBottom: '4px' }}>test@skyyield.com</div>
            <div>test123</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}