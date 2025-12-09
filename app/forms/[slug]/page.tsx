'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface Form {
  id: string
  name: string
  slug: string
  description?: string
  fields: FormField[]
  settings: {
    submitButtonText: string
    successMessage: string
    redirectUrl?: string
    status: string
  }
}

export default function PublicFormPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchForm()
  }, [slug])

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms?slug=${slug}`)
      if (!res.ok) {
        setError('Form not found')
        return
      }
      const data = await res.json()
      
      if (data.form.settings.status !== 'active') {
        setError('This form is no longer accepting submissions')
        return
      }
      
      setForm(data.form)
      
      // Initialize form data
      const initialData: Record<string, any> = {}
      data.form.fields.forEach((field: FormField) => {
        if (field.type === 'checkbox' && !field.options) {
          initialData[field.id] = false
        } else {
          initialData[field.id] = ''
        }
      })
      setFormData(initialData)
    } catch (err) {
      setError('Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    // Validate required fields
    for (const field of form.fields) {
      if (field.required && !formData[field.id]) {
        setError(`Please fill in: ${field.label}`)
        return
      }
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/forms/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          formName: form.name,
          data: formData,
        }),
      })

      if (!res.ok) {
        throw new Error('Submission failed')
      }

      setSubmitted(true)

      // Redirect if configured
      if (form.settings.redirectUrl) {
        setTimeout(() => {
          router.push(form.settings.redirectUrl!)
        }, 2000)
      }
    } catch (err) {
      setError('Failed to submit form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const baseInputClass = "w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] transition-colors"

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
      case 'date':
        return (
          <input
            type={field.type === 'phone' ? 'tel' : field.type}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
            required={field.required}
          />
        )

      case 'address':
        return (
          <input
            type="text"
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || 'Street address, City, State ZIP'}
            className={baseInputClass}
            required={field.required}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`${baseInputClass} resize-none`}
            required={field.required}
          />
        )

      case 'select':
        return (
          <select
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={baseInputClass}
            required={field.required}
          >
            <option value="">Select an option...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <label key={option} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={formData[field.id] === option}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="w-4 h-4 accent-[#0EA5E9]"
                  required={field.required}
                />
                <span className="text-white">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        if (field.options) {
          // Multiple checkboxes
          return (
            <div className="space-y-2">
              {field.options.map(option => (
                <label key={option} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData[field.id] || []).includes(option)}
                    onChange={(e) => {
                      const current = formData[field.id] || []
                      if (e.target.checked) {
                        handleChange(field.id, [...current, option])
                      } else {
                        handleChange(field.id, current.filter((v: string) => v !== option))
                      }
                    }}
                    className="w-4 h-4 accent-[#0EA5E9]"
                  />
                  <span className="text-white">{option}</span>
                </label>
              ))}
            </div>
          )
        }
        // Single checkbox (agreement/consent)
        return (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData[field.id] || false}
              onChange={(e) => handleChange(field.id, e.target.checked)}
              className="w-4 h-4 mt-1 accent-[#0EA5E9]"
              required={field.required}
            />
            <span className="text-white text-sm">{field.label}</span>
          </label>
        )

      default:
        return (
          <input
            type="text"
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
            required={field.required}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin" />
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center p-4">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Form Not Available</h1>
          <p className="text-[#94A3B8] mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center p-4">
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Submission Received!</h1>
          <p className="text-[#94A3B8] mb-6">{form?.settings.successMessage}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-white">SkyYield</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{form?.name}</h1>
          {form?.description && (
            <p className="text-[#94A3B8]">{form.description}</p>
          )}
        </div>

        {/* Form */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {form?.fields.map(field => (
              <div key={field.id}>
                {field.type !== 'checkbox' || field.options ? (
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                ) : null}
                {renderField(field)}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                form?.settings.submitButtonText || 'Submit'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-[#64748B] text-sm">
          Powered by <Link href="/" className="text-[#0EA5E9] hover:underline">SkyYield</Link>
        </div>
      </div>
    </div>
  )
}