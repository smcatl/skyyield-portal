'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PipelineRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to admin portal with pipeline tab selected
    router.replace('/portals/admin?tab=pipeline')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#94A3B8]">Redirecting to Admin Portal...</p>
      </div>
    </div>
  )
}
