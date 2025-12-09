'use client'

import { useState, useEffect } from 'react'
import { useSignUp, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wifi } from 'lucide-react'

const userTypes = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'employee', label: 'Employee' },
  { value: 'referral', label: 'Referral Partner' },
  { value: 'location', label: 'Location Partner' },
  { value: 'relationship', label: 'Relationship Partner' },
  { value: 'channel', label: 'Channel Partner' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'calculator', label: 'Calculator Access' },
  { value: 'customer', label: 'Customer' },
]

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const { isSignedIn } = useAuth()
  const router = useRouter()
  
  const [userType, setUserType] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push('/pending-approval')
    }
  }, [isSignedIn, router])

  // Check if there's a pending signup that needs verification
  useEffect(() => {
    if (isLoaded && signUp?.status === 'missing_requirements') {
      setVerifying(true)
      setEmail(signUp.emailAddress || '')
    }
  }, [isLoaded, signUp])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  const handleSocialSignUp = async (provider: 'oauth_google' | 'oauth_facebook' | 'oauth_microsoft' | 'oauth_apple') => {
    if (!userType) {
      setError('Please select your account type first')
      return
    }

    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/complete-signup?userType=' + userType,
      })
    } catch (err: any) {
      console.error('Social signup error:', err)
      setError(err.errors?.[0]?.message || 'Something went wrong')
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userType) {
      setError('Please select your account type')
      return
    }

    setLoading(true)
    setError('')

    try {
      const selectedType = userTypes.find(u => u.value === userType)?.label || userType

      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
        unsafeMetadata: {
          userType: selectedType,
          status: 'pending',
        },
      })

      console.log('Signup result:', result.status)

      if (result.status === 'complete') {
        // Signup complete without email verification
        await setActive({ session: result.createdSessionId })
        router.push('/pending-approval')
      } else {
        // Need email verification
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setVerifying(true)
      }
    } catch (err: any) {
      console.error('Email signup error:', err)
      const errorMsg = err.errors?.[0]?.message || 'Something went wrong'
      
      // If user already exists, suggest sign in
      if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('exists')) {
        setError('An account with this email already exists. Please sign in instead.')
      } else {
        setError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      
      console.log('Verification result:', result.status)

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/pending-approval')
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: any) {
      console.error('Verification error:', err)
      const errorMessage = err.errors?.[0]?.message || 'Invalid verification code'
      
      // Handle "already verified" - try to complete signup
      if (errorMessage.toLowerCase().includes('already')) {
        try {
          // Check if signup is complete
          if (signUp.status === 'complete' && signUp.createdSessionId) {
            await setActive({ session: signUp.createdSessionId })
            router.push('/pending-approval')
            return
          } else {
            // Try to get the session anyway
            const result = await signUp.reload()
            if (result.status === 'complete' && result.createdSessionId) {
              await setActive({ session: result.createdSessionId })
              router.push('/pending-approval')
              return
            }
          }
        } catch (reloadErr) {
          console.error('Reload error:', reloadErr)
        }
        setError('Email already verified. Please try signing in instead.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      alert('New verification code sent!')
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to resend code')
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Verify Your Email</h1>
              <p className="text-[#94A3B8] mt-2">We sent a code to {email || signUp?.emailAddress}</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                  {error.includes('sign in') && (
                    <Link href="/sign-in" className="block mt-2 text-[#0EA5E9] hover:underline">
                      Go to Sign In →
                    </Link>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-3 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#0EA5E9]/25 transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <button
                onClick={handleResendCode}
                className="text-sm text-[#0EA5E9] hover:text-[#06B6D4]"
              >
                Didn't receive the code? Resend
              </button>
              <br />
              <button
                onClick={() => { setVerifying(false); setCode(''); setError(''); }}
                className="text-sm text-[#64748B] hover:text-white"
              >
                ← Back to sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] rounded-xl flex items-center justify-center">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">SkyYield</span>
            </Link>
            <h1 className="text-xl font-semibold text-white">Create Your Account</h1>
            <p className="text-[#94A3B8] mt-1">Join the SkyYield network</p>
          </div>

          {/* User Type Selection */}
          <div className="mb-6">
            <label className="block text-sm text-[#94A3B8] mb-2">I am a... *</label>
            <select
              value={userType}
              onChange={(e) => { setUserType(e.target.value); setError(''); }}
              className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] cursor-pointer"
              required
            >
              <option value="">Select account type...</option>
              {userTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialSignUp('oauth_google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white hover:bg-[#2D3B5F] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleSocialSignUp('oauth_microsoft')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white hover:bg-[#2D3B5F] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
              Continue with Microsoft
            </button>

            <button
              onClick={() => handleSocialSignUp('oauth_apple')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white hover:bg-[#2D3B5F] transition-colors"
            >
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continue with Apple
            </button>

            <button
              onClick={() => handleSocialSignUp('oauth_facebook')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white hover:bg-[#2D3B5F] transition-colors"
            >
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2D3B5F]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1A1F3A] text-[#64748B]">or continue with email</span>
            </div>
          </div>

          {/* Email Sign Up Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                required
                minLength={8}
              />
              <p className="text-xs text-[#64748B] mt-1">Must be at least 8 characters</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
                {error.includes('sign in') && (
                  <Link href="/sign-in" className="block mt-2 text-[#0EA5E9] hover:underline">
                    Go to Sign In →
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !userType}
              className="w-full py-3 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#0EA5E9]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center mt-6 text-[#94A3B8]">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-[#0EA5E9] hover:text-[#06B6D4] font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}