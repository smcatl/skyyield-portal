'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calculator, DollarSign, Wifi, Building2, TrendingUp } from 'lucide-react'
import { PortalSwitcher } from '@/components/portal/PortalSwitcher'

export default function CalculatorPortalPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  const [sqft, setSqft] = useState(2000)
  const [footTraffic, setFootTraffic] = useState(500)
  const [hoursOpen, setHoursOpen] = useState(12)
  const [daysOpen, setDaysOpen] = useState(30)

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    
    const status = (user.unsafeMetadata as any)?.status || 'pending'
    if (status !== 'approved') {
      router.push('/pending-approval')
    }
  }, [isLoaded, user, router])

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  const status = (user.unsafeMetadata as any)?.status || 'pending'
  if (status !== 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  const dataPerVisitor = 0.15
  const pricePerGB = 0.20
  const conversionRate = 0.30
  
  const monthlyVisitors = footTraffic * daysOpen
  const connectedVisitors = monthlyVisitors * conversionRate
  const totalDataGB = connectedVisitors * dataPerVisitor
  const monthlyEarnings = totalDataGB * pricePerGB
  const yearlyEarnings = monthlyEarnings * 12

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-24 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Earnings <span className="text-[#0EA5E9]">Calculator</span>
            </h1>
            <p className="text-[#94A3B8] mt-2">
              Estimate your potential earnings as a SkyYield location partner.
            </p>
          </div>
          <PortalSwitcher currentPortal="calculator_user" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#0EA5E9]" />
              Location Details
            </h2>

            <div className="space-y-6">
              <div>
                <label className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Square Footage
                  </span>
                  <span className="text-white font-medium">{sqft.toLocaleString()} sq ft</span>
                </label>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={sqft}
                  onChange={(e) => setSqft(Number(e.target.value))}
                  className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    Daily Foot Traffic
                  </span>
                  <span className="text-white font-medium">{footTraffic.toLocaleString()} visitors</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="10000"
                  step="50"
                  value={footTraffic}
                  onChange={(e) => setFootTraffic(Number(e.target.value))}
                  className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span>Hours Open Per Day</span>
                  <span className="text-white font-medium">{hoursOpen} hours</span>
                </label>
                <input
                  type="range"
                  min="4"
                  max="24"
                  step="1"
                  value={hoursOpen}
                  onChange={(e) => setHoursOpen(Number(e.target.value))}
                  className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span>Days Open Per Month</span>
                  <span className="text-white font-medium">{daysOpen} days</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="31"
                  step="1"
                  value={daysOpen}
                  onChange={(e) => setDaysOpen(Number(e.target.value))}
                  className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#0EA5E9]/20 to-[#06B6D4]/20 border border-[#0EA5E9]/30 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#0EA5E9]" />
                Estimated Earnings
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A0F2C]/50 rounded-lg p-4">
                  <p className="text-[#94A3B8] text-sm mb-1">Monthly Earnings</p>
                  <p className="text-3xl font-bold text-[#0EA5E9]">${monthlyEarnings.toFixed(2)}</p>
                </div>
                <div className="bg-[#0A0F2C]/50 rounded-lg p-4">
                  <p className="text-[#94A3B8] text-sm mb-1">Yearly Earnings</p>
                  <p className="text-3xl font-bold text-green-400">${yearlyEarnings.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Monthly Visitors</span>
                  <span className="text-white">{monthlyVisitors.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Est. Connected Users (30%)</span>
                  <span className="text-white">{Math.round(connectedVisitors).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Est. Data Offloaded</span>
                  <span className="text-white">{totalDataGB.toFixed(1)} GB</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Rate per GB</span>
                  <span className="text-white">${pricePerGB.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-white font-medium mb-3">Ready to get started?</h3>
              <p className="text-[#94A3B8] text-sm mb-4">
                These are estimated earnings based on typical data offloading patterns. Actual earnings may vary based on location, carrier partnerships, and user behavior.
              </p>
              <Link
                href="/work-with-us"
                className="block w-full py-3 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white text-center rounded-lg font-medium hover:shadow-lg hover:shadow-[#0EA5E9]/25 transition-all"
              >
                Become a Location Partner
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center mb-3">
                <span className="text-[#0EA5E9] font-bold">1</span>
              </div>
              <h3 className="text-white font-medium mb-2">Install Equipment</h3>
              <p className="text-[#94A3B8] text-sm">
                We install our WiFi equipment at no cost to you. Installation takes about 30 minutes.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center mb-3">
                <span className="text-[#0EA5E9] font-bold">2</span>
              </div>
              <h3 className="text-white font-medium mb-2">Visitors Connect</h3>
              <p className="text-[#94A3B8] text-sm">
                Mobile users automatically offload their cellular data through your WiFi network.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center mb-3">
                <span className="text-[#0EA5E9] font-bold">3</span>
              </div>
              <h3 className="text-white font-medium mb-2">Earn Monthly</h3>
              <p className="text-[#94A3B8] text-sm">
                Get paid monthly based on the data offloaded through your location.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}