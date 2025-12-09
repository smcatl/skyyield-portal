'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Calculator, MapPin, Target, Clock, Users, Building2, 
  DollarSign, Lock, Activity 
} from 'lucide-react'

interface CalculatorSectionProps {
  isSubscribed?: boolean
  showUpgradePrompt?: boolean
}

export default function CalculatorSection({ 
  isSubscribed = false, 
  showUpgradePrompt = true 
}: CalculatorSectionProps) {
  const [activeCalculator, setActiveCalculator] = useState<string>('earnings')
  const [calcSquareFootage, setCalcSquareFootage] = useState(2500)
  const [calcFootTraffic, setCalcFootTraffic] = useState(500)
  const [calcHoursOpen, setCalcHoursOpen] = useState(12)
  const [calcDaysOpen, setCalcDaysOpen] = useState(26)

  const calculators = [
    { id: 'earnings', label: 'WiFi Earnings', icon: DollarSign, color: 'text-green-400', free: true },
    { id: 'trade-area', label: 'Trade Area', icon: MapPin, color: 'text-blue-400', free: false },
    { id: 'competitor', label: 'Competitor', icon: Target, color: 'text-orange-400', free: false },
    { id: 'peak-hours', label: 'Peak Hours', icon: Clock, color: 'text-purple-400', free: false },
    { id: 'demographics', label: 'Demographics', icon: Users, color: 'text-cyan-400', free: false },
    { id: 'venue-score', label: 'Venue Score', icon: Building2, color: 'text-yellow-400', free: false },
  ]

  const isCalculatorAvailable = (calcId: string) => {
    const calc = calculators.find(c => c.id === calcId)
    return calc?.free || isSubscribed
  }

  // Locked overlay for non-subscribed users
  const LockedOverlay = () => (
    <div className="absolute inset-0 bg-[#0A0F2C]/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">
      <Lock className="w-12 h-12 text-[#64748B] mb-4" />
      <h3 className="text-white font-semibold mb-2">Premium Calculator</h3>
      <p className="text-[#94A3B8] text-sm text-center max-w-xs mb-4">
        Subscribe to Calculator Access to unlock all Placer.ai powered analytics tools
      </p>
      {showUpgradePrompt && (
        <Link
          href="/pricing?plan=calculator"
          className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
        >
          Upgrade Now
        </Link>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Calculator Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {calculators.map(calc => (
          <button
            key={calc.id}
            onClick={() => setActiveCalculator(calc.id)}
            className={`p-4 rounded-xl border transition-all relative ${
              activeCalculator === calc.id
                ? 'bg-[#0EA5E9]/20 border-[#0EA5E9] text-white'
                : 'bg-[#1A1F3A] border-[#2D3B5F] text-[#94A3B8] hover:border-[#0EA5E9]/50'
            }`}
          >
            {!calc.free && !isSubscribed && (
              <Lock className="absolute top-2 right-2 w-3 h-3 text-[#64748B]" />
            )}
            <calc.icon className={`w-6 h-6 mx-auto mb-2 ${calc.color}`} />
            <div className="text-xs font-medium">{calc.label}</div>
          </button>
        ))}
      </div>

      {/* WiFi Earnings Calculator (Always Available) */}
      {activeCalculator === 'earnings' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            WiFi Earnings Calculator
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-6">
              <div>
                <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                  <span>Square Footage</span>
                  <span className="text-white font-medium">{calcSquareFootage.toLocaleString()} sq ft</span>
                </label>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="100"
                  value={calcSquareFootage}
                  onChange={(e) => setCalcSquareFootage(Number(e.target.value))}
                  className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                />
                <div className="flex justify-between text-xs text-[#64748B] mt-1">
                  <span>500</span>
                  <span>50,000</span>
                </div>
              </div>

              <div>
                <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                  <span>Daily Foot Traffic</span>
                  <span className="text-white font-medium">{calcFootTraffic.toLocaleString()} visitors</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="10000"
                  step="50"
                  value={calcFootTraffic}
                  onChange={(e) => setCalcFootTraffic(Number(e.target.value))}
                  className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                />
                <div className="flex justify-between text-xs text-[#64748B] mt-1">
                  <span>50</span>
                  <span>10,000</span>
                </div>
              </div>

              <div>
                <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                  <span>Hours Open Per Day</span>
                  <span className="text-white font-medium">{calcHoursOpen} hours</span>
                </label>
                <input
                  type="range"
                  min="4"
                  max="24"
                  value={calcHoursOpen}
                  onChange={(e) => setCalcHoursOpen(Number(e.target.value))}
                  className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                />
                <div className="flex justify-between text-xs text-[#64748B] mt-1">
                  <span>4</span>
                  <span>24</span>
                </div>
              </div>

              <div>
                <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                  <span>Days Open Per Month</span>
                  <span className="text-white font-medium">{calcDaysOpen} days</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="31"
                  value={calcDaysOpen}
                  onChange={(e) => setCalcDaysOpen(Number(e.target.value))}
                  className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                />
                <div className="flex justify-between text-xs text-[#64748B] mt-1">
                  <span>15</span>
                  <span>31</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="bg-[#0A0F2C] rounded-xl p-6 border border-[#2D3B5F]">
                <div className="text-[#94A3B8] text-sm mb-1">Estimated Monthly Earnings</div>
                <div className="text-4xl font-bold text-green-400">
                  ${(calcFootTraffic * 0.30 * 0.15 * 0.20 * calcDaysOpen).toFixed(0)}
                </div>
                <div className="text-[#64748B] text-xs mt-1">Based on 30% WiFi connection rate</div>
              </div>

              <div className="bg-[#0A0F2C] rounded-xl p-6 border border-[#2D3B5F]">
                <div className="text-[#94A3B8] text-sm mb-1">Estimated Yearly Earnings</div>
                <div className="text-3xl font-bold text-[#0EA5E9]">
                  ${(calcFootTraffic * 0.30 * 0.15 * 0.20 * calcDaysOpen * 12).toFixed(0)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                  <div className="text-[#64748B] text-xs mb-1">Connected Users/Day</div>
                  <div className="text-xl font-semibold text-white">
                    {Math.round(calcFootTraffic * 0.30).toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                  <div className="text-[#64748B] text-xs mb-1">Data Offloaded/Month</div>
                  <div className="text-xl font-semibold text-white">
                    {(calcFootTraffic * 0.30 * 0.15 * calcDaysOpen).toFixed(0)} GB
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#64748B] p-3 bg-[#0A0F2C] rounded-lg border border-[#2D3B5F]">
                <strong className="text-[#94A3B8]">Assumptions:</strong> 30% WiFi connection rate, 
                0.15 GB avg data per visitor, $0.20 per GB offload rate
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Calculators with Gating */}
      {activeCalculator === 'trade-area' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isSubscribed && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            Trade Area Analyzer
          </h3>
          <p className="text-[#94A3B8] mb-6">Understand where your venue's visitors come from.</p>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
              <div className="text-[#64748B] text-sm mb-1">Primary Trade Area</div>
              <div className="text-2xl font-bold text-blue-400">5 mi</div>
              <div className="text-xs text-[#64748B]">70% of visitors</div>
            </div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
              <div className="text-[#64748B] text-sm mb-1">Secondary Trade Area</div>
              <div className="text-2xl font-bold text-cyan-400">15 mi</div>
              <div className="text-xs text-[#64748B]">25% of visitors</div>
            </div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
              <div className="text-[#64748B] text-sm mb-1">Extended Reach</div>
              <div className="text-2xl font-bold text-purple-400">30+ mi</div>
              <div className="text-xs text-[#64748B]">5% of visitors</div>
            </div>
          </div>

          <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter venue address..."
                className="flex-1 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
              />
              <button className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                Analyze
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCalculator === 'competitor' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isSubscribed && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-400" />
            Competitor Comparison
          </h3>
          <p className="text-[#94A3B8] mb-6">Compare foot traffic metrics against nearby competitors.</p>
          
          <div className="bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F] text-center">
            <Target className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
            <p className="text-[#94A3B8]">Select venues to compare</p>
            <button className="mt-4 px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
              Select Venues
            </button>
          </div>
        </div>
      )}

      {activeCalculator === 'peak-hours' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isSubscribed && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Peak Hours Optimizer
          </h3>
          <p className="text-[#94A3B8] mb-6">Identify peak visitation times.</p>
          
          <div className="grid md:grid-cols-7 gap-2 mb-6">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={day} className="bg-[#0A0F2C] rounded-lg p-3 border border-[#2D3B5F] text-center">
                <div className="text-[#64748B] text-xs mb-2">{day}</div>
                <div className={`text-lg font-bold ${i >= 5 ? 'text-green-400' : 'text-[#94A3B8]'}`}>
                  {i >= 5 ? '↑' : '—'}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter venue address..."
                className="flex-1 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
              />
              <button className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                Analyze
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCalculator === 'demographics' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isSubscribed && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Demographics Insights
          </h3>
          <p className="text-[#94A3B8] mb-6">Understand visitor demographics.</p>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
              <div className="text-[#64748B] text-sm mb-1">Median Income</div>
              <div className="text-xl font-bold text-green-400">$75,000</div>
            </div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
              <div className="text-[#64748B] text-sm mb-1">Avg Age</div>
              <div className="text-xl font-bold text-blue-400">34 yrs</div>
            </div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
              <div className="text-[#64748B] text-sm mb-1">Mobile Usage</div>
              <div className="text-xl font-bold text-purple-400">92%</div>
            </div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
              <div className="text-[#64748B] text-sm mb-1">Dwell Time</div>
              <div className="text-xl font-bold text-orange-400">45 min</div>
            </div>
          </div>

          <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter venue address..."
                className="flex-1 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
              />
              <button className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                Analyze
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCalculator === 'venue-score' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isSubscribed && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-yellow-400" />
            Venue Scoring Tool
          </h3>
          <p className="text-[#94A3B8] mb-6">Get a comprehensive score (1-100) for any venue.</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {[
                { label: 'Foot Traffic', value: 85, color: 'bg-green-400' },
                { label: 'Demographics', value: 72, color: 'bg-blue-400' },
                { label: 'Dwell Time', value: 90, color: 'bg-purple-400' },
                { label: 'Competition', value: 65, color: 'bg-orange-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg border border-[#2D3B5F]">
                  <span className="text-[#94A3B8]">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[#2D3B5F] rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                    </div>
                    <span className="text-white font-medium w-8">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F]">
              <div className="text-[#64748B] text-sm mb-2">Overall Venue Score</div>
              <div className="text-6xl font-bold text-yellow-400 mb-2">78</div>
              <div className="text-green-400 text-sm font-medium">Good Opportunity</div>
            </div>
          </div>

          <div className="mt-6 bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter venue address to score..."
                className="flex-1 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
              />
              <button className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                Score Venue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade CTA for non-subscribed users */}
      {!isSubscribed && showUpgradePrompt && (
        <div className="bg-gradient-to-r from-[#0EA5E9]/20 to-purple-500/20 border border-[#0EA5E9]/30 rounded-xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-semibold mb-1">Unlock All Calculators</h3>
              <p className="text-[#94A3B8] text-sm">
                Get access to Trade Area, Competitor Analysis, Peak Hours, Demographics, and Venue Scoring tools.
              </p>
            </div>
            <Link
              href="/pricing?plan=calculator"
              className="px-6 py-3 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors whitespace-nowrap font-medium"
            >
              Subscribe Now - $49/mo
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}