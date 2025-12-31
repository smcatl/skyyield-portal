'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'

export interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  fieldName?: string
}

export interface FormSettings {
  submitButtonText: string
  successMessage: string
  redirectUrl?: string
  status: string
}

export interface Form {
  id: string
  name: string
  slug: string
  description?: string
  fields: FormField[]
  settings: FormSettings
}

export interface DynamicFormProps {
  slug?: string
  form?: Form
  mode?: 'standalone' | 'modal' | 'embedded'
  isOpen?: boolean
  onClose?: () => void
  onSubmitSuccess?: (data: Record<string, any>) => void
  onSubmitError?: (error: string) => void
  showHeader?: boolean
  showFooter?: boolean
  className?: string
  initialData?: Record<string, any>
  additionalData?: Record<string, any>
}

export default function DynamicForm({
  slug,
  form: providedForm,
  mode = 'standalone',
  isOpen = true,
  onClose,
  onSubmitSuccess,
  onSubmitError,
  showHeader = true,
  showFooter = true,
  className = '',
  initialData = {},
  additionalData = {},
}: DynamicFormProps) {
  const [form, setForm] = useState<Form | null>(providedForm || null)
  const [loading, setLoading] = useState(!providedForm && !!slug)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>(initialData)

  useEffect(() => {
    if (slug && !providedForm) fetchForm()
  }, [slug])

  useEffect(() => {
    if (providedForm) {
      setForm(providedForm)
      initializeFormData(providedForm)
    }
  }, [providedForm])

  const fetchForm = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/forms?slug=${slug}`)
      if (!res.ok) { setError('Form not found'); return }
      const data = await res.json()
      if (data.form.settings.status !== 'active') { setError('This form is no longer accepting submissions'); return }
      setForm(data.form)
      initializeFormData(data.form)
    } catch (err) {
      setError('Failed to load form')
      onSubmitError?.('Failed to load form')
    } finally { setLoading(false) }
  }

  const initializeFormData = (formToInit: Form) => {
    const initial: Record<string, any> = { ...initialData }
    formToInit.fields.forEach((field: FormField) => {
      if (initial[field.id] === undefined) {
        initial[field.id] = field.type === 'checkbox' && !field.options ? false : ''
      }
    })
    setFormData(initial)
  }

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    for (const field of form.fields) {
      if (field.required && !formData[field.id]) { setError(`Please fill in: ${field.label}`); return }
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/forms/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: form.id, formName: form.name, data: { ...formData, ...additionalData } }),
      })
      if (!res.ok) throw new Error('Submission failed')
      const result = await res.json()
      setSubmitted(true)
      onSubmitSuccess?.({ ...formData, ...additionalData, submissionId: result.id })
      if (mode === 'modal' && onClose) {
        setTimeout(() => { onClose(); setSubmitted(false); setFormData(initialData) }, 1500)
      }
    } catch (err) {
      const errorMsg = 'Failed to submit form. Please try again.'
      setError(errorMsg)
      onSubmitError?.(errorMsg)
    } finally { setSubmitting(false) }
  }

  const renderField = (field: FormField) => {
    const baseInputClass = "w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9] transition-colors"
    switch (field.type) {
      case 'text': case 'email': case 'phone': case 'number': case 'date':
        return <input type={field.type === 'phone' ? 'tel' : field.type} value={formData[field.id] || ''} onChange={(e) => handleChange(field.id, e.target.value)} placeholder={field.placeholder} className={baseInputClass} required={field.required} />
      case 'address':
        return <input type="text" value={formData[field.id] || ''} onChange={(e) => handleChange(field.id, e.target.value)} placeholder={field.placeholder || 'Street address, City, State ZIP'} className={baseInputClass} required={field.required} />
      case 'textarea':
        return <textarea value={formData[field.id] || ''} onChange={(e) => handleChange(field.id, e.target.value)} placeholder={field.placeholder} rows={4} className={`${baseInputClass} resize-none`} required={field.required} />
      case 'select':
        return <select value={formData[field.id] || ''} onChange={(e) => handleChange(field.id, e.target.value)} className={baseInputClass} required={field.required}><option value="">Select an option...</option>{field.options?.map(option => <option key={option} value={option}>{option}</option>)}</select>
      case 'radio':
        return <div className="space-y-2">{field.options?.map(option => <label key={option} className="flex items-center gap-3 cursor-pointer"><input type="radio" name={field.id} value={option} checked={formData[field.id] === option} onChange={(e) => handleChange(field.id, e.target.value)} className="w-4 h-4 accent-[#0EA5E9]" required={field.required} /><span className="text-white">{option}</span></label>)}</div>
      case 'checkbox':
        if (field.options) {
          return <div className="space-y-2">{field.options.map(option => <label key={option} className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={(formData[field.id] || []).includes(option)} onChange={(e) => { const current = formData[field.id] || []; handleChange(field.id, e.target.checked ? [...current, option] : current.filter((v: string) => v !== option)) }} className="w-4 h-4 accent-[#0EA5E9]" /><span className="text-white">{option}</span></label>)}</div>
        }
        return <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={formData[field.id] || false} onChange={(e) => handleChange(field.id, e.target.checked)} className="w-4 h-4 mt-1 accent-[#0EA5E9]" required={field.required} /><span className="text-white text-sm">{field.label}</span></label>
      case 'file':
        return <input type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleChange(field.id, file.name) }} className={`${baseInputClass} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#0EA5E9] file:text-white file:cursor-pointer`} required={field.required} />
      case 'url':
        return <input type="url" value={formData[field.id] || ''} onChange={(e) => handleChange(field.id, e.target.value)} placeholder={field.placeholder || 'https://...'} className={baseInputClass} required={field.required} />
      default:
        return <input type="text" value={formData[field.id] || ''} onChange={(e) => handleChange(field.id, e.target.value)} placeholder={field.placeholder} className={baseInputClass} required={field.required} />
    }
  }

  if (loading) {
    if (mode === 'modal') return <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8"><Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin mx-auto" /></div></div>
    return <div className={`flex items-center justify-center p-8 ${className}`}><Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin" /></div>
  }

  if (error && !form) {
    const errorContent = <div className="text-center p-8"><AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" /><h2 className="text-xl font-semibold text-white mb-2">Form Not Available</h2><p className="text-[#94A3B8] mb-4">{error}</p>{mode === 'modal' && onClose && <button onClick={onClose} className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F]">Close</button>}</div>
    if (mode === 'modal') return <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-md w-full">{errorContent}</div></div>
    return <div className={className}>{errorContent}</div>
  }

  if (submitted) {
    const successContent = <div className="text-center p-8"><div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-400" /></div><h2 className="text-2xl font-semibold text-white mb-2">Submission Received!</h2><p className="text-[#94A3B8]">{form?.settings.successMessage || 'Thank you for your submission.'}</p></div>
    if (mode === 'modal') return <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl max-w-md w-full">{successContent}</div></div>
    return <div className={className}>{successContent}</div>
  }

  const formContent = (
    <>
      {showHeader && <div className={mode === 'modal' ? 'p-6 border-b border-[#2D3B5F]' : 'mb-6'}><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-white">{form?.name}</h2>{form?.description && <p className="text-[#94A3B8] text-sm mt-1">{form.description}</p>}</div>{mode === 'modal' && onClose && <button onClick={onClose} className="p-2 text-[#64748B] hover:text-white hover:bg-[#2D3B5F] rounded-lg transition-colors"><X className="w-5 h-5" /></button>}</div></div>}
      <div className={mode === 'modal' ? 'p-6 max-h-[60vh] overflow-y-auto' : ''}>
        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          {form?.fields.map(field => <div key={field.id}>{field.type !== 'checkbox' || field.options ? <label className="block text-sm font-medium text-[#94A3B8] mb-2">{field.label}{field.required && <span className="text-red-400 ml-1">*</span>}</label> : null}{renderField(field)}</div>)}
          <div className={mode === 'modal' ? 'pt-4 border-t border-[#2D3B5F] mt-6' : 'pt-2'}><div className="flex items-center gap-3">{mode === 'modal' && onClose && <button type="button" onClick={onClose} className="flex-1 py-3 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors">Cancel</button>}<button type="submit" disabled={submitting} className={`${mode === 'modal' ? 'flex-1' : 'w-full'} py-3 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}>{submitting ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting...</> : form?.settings.submitButtonText || 'Submit'}</button></div></div>
        </form>
      </div>
      {showFooter && mode === 'standalone' && <div className="text-center mt-8 text-[#64748B] text-sm">Powered by <Link href="/" className="text-[#0EA5E9] hover:underline">SkyYield</Link></div>}
    </>
  )

  if (mode === 'modal') {
    if (!isOpen) return null
    return <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden">{formContent}</div></div>
  }
  if (mode === 'embedded') return <div className={`bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 ${className}`}>{formContent}</div>
  return <div className={`min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] py-12 px-4 ${className}`}><div className="max-w-2xl mx-auto"><div className="text-center mb-8"><Link href="/" className="inline-block mb-6"><div className="flex items-center justify-center gap-2"><div className="w-10 h-10 bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] rounded-lg flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div><span className="text-xl font-bold text-white">SkyYield</span></div></Link></div><div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 md:p-8">{formContent}</div></div></div>
}

export function FormModal({ slug, isOpen, onClose, onSuccess, additionalData }: { slug: string; isOpen: boolean; onClose: () => void; onSuccess?: (data: Record<string, any>) => void; additionalData?: Record<string, any> }) {
  return <DynamicForm slug={slug} mode="modal" isOpen={isOpen} onClose={onClose} onSubmitSuccess={(data) => onSuccess?.(data)} additionalData={additionalData} />
}
