'use client'

import { useState } from 'react'
import { 
  DollarSign, MapPin, Target, Clock, Users, Building2, 
  Lock, Activity 
} from 'lucide-react'

// Venue Categories
const VENUE_CATEGORIES: Record<string, string[]> = {
  "Food & Beverage": ["restaurant_fastfood", "restaurant_sitdown", "cafe_coffee", "bar", "nightclub"],
  "Retail": ["convenience_gas", "convenience_nogas", "grocery", "retail_small", "retail_bigbox", "mall"],
  "Residential": ["apartment_single", "apartment_midrise", "apartment_highrise", "student_housing"],
  "Hospitality": ["hotel_single", "hotel_midrise", "hotel_highrise"],
  "Services": ["hair_salon", "pet_groomer", "medical_office", "animal_hospital", "daycare"],
  "Education": ["college", "school_k5", "school_middle", "school_high"],
  "Recreation": ["dog_park", "stadium", "museum", "library", "gym"],
  "Transportation": ["airport", "transit_station"],
  "Workspace": ["coworking", "office_building"],
}

// Venue Profiles with WiFi multipliers
const VENUE_PROFILES: Record<string, { name: string; wifiMultiplier: number; avgDwell: string; description?: string }> = {
  // Food & Beverage
  restaurant_fastfood: { name: "Fast Food Restaurant", wifiMultiplier: 1.3, avgDwell: "15-25 min", description: "Quick service restaurants" },
  restaurant_sitdown: { name: "Sit-Down Restaurant", wifiMultiplier: 1.5, avgDwell: "45-90 min", description: "Casual & fine dining" },
  cafe_coffee: { name: "Café / Coffee Shop", wifiMultiplier: 1.6, avgDwell: "30-60 min", description: "Coffee shops, bakeries" },
  bar: { name: "Bar / Pub", wifiMultiplier: 1.5, avgDwell: "60-120 min", description: "Sports bars, pubs, lounges" },
  nightclub: { name: "Nightclub", wifiMultiplier: 1.4, avgDwell: "2-4 hrs", description: "Dance clubs, venues" },
  // Retail
  convenience_gas: { name: "Convenience Store (w/ Gas)", wifiMultiplier: 1.2, avgDwell: "5-10 min", description: "Gas stations with stores" },
  convenience_nogas: { name: "Convenience Store", wifiMultiplier: 1.2, avgDwell: "5-15 min", description: "Standalone convenience stores" },
  grocery: { name: "Grocery Store", wifiMultiplier: 1.3, avgDwell: "20-45 min", description: "Supermarkets, grocery chains" },
  retail_small: { name: "Retail Store", wifiMultiplier: 1.3, avgDwell: "15-30 min", description: "Boutiques, specialty stores" },
  retail_bigbox: { name: "Big Box Retail", wifiMultiplier: 1.3, avgDwell: "30-60 min", description: "Target, Walmart, Costco" },
  mall: { name: "Shopping Mall", wifiMultiplier: 1.5, avgDwell: "1-3 hrs", description: "Indoor malls, outlets" },
  // Residential
  apartment_single: { name: "Apartment (Single Level)", wifiMultiplier: 2.0, avgDwell: "Resident", description: "Garden-style apartments" },
  apartment_midrise: { name: "Apartment (Midrise)", wifiMultiplier: 2.0, avgDwell: "Resident", description: "4-12 story apartments" },
  apartment_highrise: { name: "Apartment (Highrise)", wifiMultiplier: 2.0, avgDwell: "Resident", description: "12+ story apartments" },
  student_housing: { name: "Student Housing", wifiMultiplier: 2.2, avgDwell: "Resident", description: "Dorms, off-campus housing" },
  // Hospitality
  hotel_single: { name: "Hotel (Single Level)", wifiMultiplier: 2.0, avgDwell: "1-3 nights", description: "Motels, budget hotels" },
  hotel_midrise: { name: "Hotel (Midrise)", wifiMultiplier: 2.2, avgDwell: "1-3 nights", description: "Business hotels, mid-tier" },
  hotel_highrise: { name: "Hotel (Highrise)", wifiMultiplier: 2.3, avgDwell: "1-5 nights", description: "Full-service, luxury hotels" },
  // Services
  hair_salon: { name: "Hair Salon / Spa", wifiMultiplier: 1.5, avgDwell: "45-90 min", description: "Salons, barbershops, spas" },
  pet_groomer: { name: "Pet Groomer", wifiMultiplier: 1.5, avgDwell: "30-60 min", description: "Pet grooming services" },
  medical_office: { name: "Medical Office", wifiMultiplier: 1.4, avgDwell: "30-60 min", description: "Clinics, doctor offices" },
  animal_hospital: { name: "Animal Hospital", wifiMultiplier: 1.4, avgDwell: "30-90 min", description: "Vet clinics, emergency vet" },
  daycare: { name: "Daycare", wifiMultiplier: 1.2, avgDwell: "Drop-off", description: "Childcare centers" },
  // Education
  college: { name: "College/University", wifiMultiplier: 2.0, avgDwell: "2-8 hrs", description: "Higher education campuses" },
  school_k5: { name: "School (K-5)", wifiMultiplier: 1.3, avgDwell: "Staff hours", description: "Elementary schools" },
  school_middle: { name: "School (6-8)", wifiMultiplier: 1.4, avgDwell: "Staff hours", description: "Middle schools" },
  school_high: { name: "School (9-12)", wifiMultiplier: 1.5, avgDwell: "Staff hours", description: "High schools" },
  // Recreation
  dog_park: { name: "Dog Park", wifiMultiplier: 1.3, avgDwell: "30-60 min", description: "Off-leash parks" },
  stadium: { name: "Stadium / Arena", wifiMultiplier: 1.5, avgDwell: "2-4 hrs", description: "Sports venues, concert halls" },
  museum: { name: "Museum", wifiMultiplier: 1.4, avgDwell: "1-3 hrs", description: "Art, history, science museums" },
  library: { name: "Library", wifiMultiplier: 1.8, avgDwell: "1-4 hrs", description: "Public & university libraries" },
  gym: { name: "Gym / Fitness", wifiMultiplier: 1.6, avgDwell: "1-2 hrs", description: "Fitness centers, gyms" },
  // Transportation
  airport: { name: "Airport", wifiMultiplier: 2.3, avgDwell: "1-4 hrs", description: "Terminals, lounges" },
  transit_station: { name: "Transit Station", wifiMultiplier: 1.4, avgDwell: "15-45 min", description: "Bus/train stations" },
  // Workspace
  coworking: { name: "Co-Working Space", wifiMultiplier: 2.0, avgDwell: "4-8 hrs", description: "Shared offices, WeWork" },
  office_building: { name: "Office Building", wifiMultiplier: 1.8, avgDwell: "8+ hrs", description: "Commercial offices" },
}

interface FullCalculatorProps {
  isSubscribed?: boolean
  showAllCalculators?: boolean // Admin sees all, partners may see limited
  accentColor?: string // Allow color customization per portal
}

export default function FullCalculator({ 
  isSubscribed = false, 
  showAllCalculators = false,
  accentColor = '#0EA5E9'
}: FullCalculatorProps) {
  const [activeCalculator, setActiveCalculator] = useState<string>('earnings')
  
  // Calculator state
  const [calcSquareFootage, setCalcSquareFootage] = useState(2500)
  const [calcFootTraffic, setCalcFootTraffic] = useState(500)
  const [calcHoursOpen, setCalcHoursOpen] = useState(12)
  const [calcDaysOpen, setCalcDaysOpen] = useState(26)
  const [calcVenueType, setCalcVenueType] = useState<string>('cafe_coffee')
  const [calcWifiAdoption, setCalcWifiAdoption] = useState(35)
  const [calcRatePerGB, setCalcRatePerGB] = useState(0.50)
  const [calcAddress, setCalcAddress] = useState('')

  const calculators = [
    { id: 'earnings', label: 'WiFi Earnings', icon: DollarSign, color: 'text-green-400', free: true },
    { id: 'trade-area', label: 'Trade Area', icon: MapPin, color: 'text-blue-400', free: false },
    { id: 'competitor', label: 'Competitor', icon: Target, color: 'text-orange-400', free: false },
    { id: 'peak-hours', label: 'Peak Hours', icon: Clock, color: 'text-purple-400', free: false },
    { id: 'demographics', label: 'Demographics', icon: Users, color: 'text-cyan-400', free: false },
    { id: 'venue-score', label: 'Venue Score', icon: Building2, color: 'text-yellow-400', free: false },
  ]

  const isCalculatorAvailable = (calcId: string) => {
    if (showAllCalculators) return true
    const calc = calculators.find(c => c.id === calcId)
    return calc?.free || isSubscribed
  }

  // Locked overlay for non-subscribed users
  const LockedOverlay = () => (
    <div className="absolute inset-0 bg-[#0A0F2C]/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">
      <Lock className="w-12 h-12 text-[#64748B] mb-4" />
      <h3 className="text-white font-semibold mb-2">Premium Calculator</h3>
      <p className="text-[#94A3B8] text-sm text-center max-w-xs mb-4">
        Subscribe to Calculator Access to unlock all location intelligence tools
      </p>
      <a
        href="/pricing?plan=calculator"
        className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
      >
        Upgrade Now
      </a>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Location Intelligence Calculators</h2>
        <p className="text-[#94A3B8] text-sm">Analyze venues and estimate potential earnings using foot traffic data</p>
      </div>

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
            {!calc.free && !isSubscribed && !showAllCalculators && (
              <Lock className="absolute top-2 right-2 w-3 h-3 text-[#64748B]" />
            )}
            <calc.icon className={`w-6 h-6 mx-auto mb-2 ${calc.color}`} />
            <div className="text-xs font-medium">{calc.label}</div>
          </button>
        ))}
      </div>

      {/* WiFi Earnings Calculator */}
      {activeCalculator === 'earnings' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            WiFi Earnings Calculator
          </h3>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Location & Venue */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Property Address</label>
                <input
                  type="text"
                  value={calcAddress}
                  onChange={(e) => setCalcAddress(e.target.value)}
                  placeholder="Enter address..."
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Venue Type</label>
                <select
                  value={calcVenueType}
                  onChange={(e) => setCalcVenueType(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                >
                  {Object.entries(VENUE_CATEGORIES).map(([category, venueIds]) => (
                    <optgroup key={category} label={category}>
                      {venueIds.map(id => (
                        <option key={id} value={id}>
                          {VENUE_PROFILES[id]?.name || id}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Venue Details Box */}
              {calcVenueType && VENUE_PROFILES[calcVenueType] && (
                <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                  <div className="text-white font-medium mb-2">{VENUE_PROFILES[calcVenueType].name}</div>
                  <div className="text-[#64748B] text-sm mb-3">{VENUE_PROFILES[calcVenueType].description}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[#64748B]">Avg Dwell:</span>
                      <span className="text-white ml-2">{VENUE_PROFILES[calcVenueType].avgDwell}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">WiFi Multiplier:</span>
                      <span className="text-[#0EA5E9] ml-2">{VENUE_PROFILES[calcVenueType].wifiMultiplier}x</span>
                    </div>
                  </div>
                </div>
              )}

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
            </div>

            {/* Middle Column - Traffic & Hours */}
            <div className="space-y-6">
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
                  <span>WiFi Adoption Rate</span>
                  <span className="text-white font-medium">{calcWifiAdoption}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={calcWifiAdoption}
                  onChange={(e) => setCalcWifiAdoption(Number(e.target.value))}
                  className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                />
                <div className="flex justify-between text-xs text-[#64748B] mt-1">
                  <span>10%</span>
                  <span>80%</span>
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

              <div>
                <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                  <span>Rate Per GB</span>
                  <span className="text-white font-medium">${calcRatePerGB.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.10"
                  max="1.00"
                  step="0.05"
                  value={calcRatePerGB}
                  onChange={(e) => setCalcRatePerGB(Number(e.target.value))}
                  className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                />
                <div className="flex justify-between text-xs text-[#64748B] mt-1">
                  <span>$0.10</span>
                  <span>$1.00</span>
                </div>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-4">
              {(() => {
                const venueMultiplier = VENUE_PROFILES[calcVenueType]?.wifiMultiplier || 1.5
                const connectedUsers = Math.round(calcFootTraffic * (calcWifiAdoption / 100))
                const dataPerUserGB = 0.15 * venueMultiplier
                const dailyDataGB = connectedUsers * dataPerUserGB
                const monthlyDataGB = dailyDataGB * calcDaysOpen
                const monthlyEarnings = monthlyDataGB * calcRatePerGB
                const yearlyEarnings = monthlyEarnings * 12

                return (
                  <>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl p-6 border border-green-500/30">
                      <div className="text-green-300 text-sm mb-1">Estimated Monthly Earnings</div>
                      <div className="text-4xl font-bold text-green-400">
                        ${monthlyEarnings.toFixed(0)}
                      </div>
                      <div className="text-green-300/60 text-xs mt-1">Partner revenue share</div>
                    </div>

                    <div className="bg-[#0A0F2C] rounded-xl p-6 border border-[#2D3B5F]">
                      <div className="text-[#94A3B8] text-sm mb-1">Estimated Yearly Earnings</div>
                      <div className="text-3xl font-bold text-[#0EA5E9]">
                        ${yearlyEarnings.toFixed(0)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                        <div className="text-[#64748B] text-xs mb-1">Connected Users/Day</div>
                        <div className="text-xl font-semibold text-white">
                          {connectedUsers.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                        <div className="text-[#64748B] text-xs mb-1">Data Offloaded/Month</div>
                        <div className="text-xl font-semibold text-white">
                          {monthlyDataGB.toFixed(0)} GB
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                      <div className="text-[#64748B] text-xs mb-2">Calculation Breakdown</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Daily visitors:</span>
                          <span className="text-white">{calcFootTraffic.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">WiFi adoption ({calcWifiAdoption}%):</span>
                          <span className="text-white">{connectedUsers} users</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Data per user ({venueMultiplier}x):</span>
                          <span className="text-white">{dataPerUserGB.toFixed(2)} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Daily data:</span>
                          <span className="text-white">{dailyDataGB.toFixed(1)} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Monthly data ({calcDaysOpen} days):</span>
                          <span className="text-white">{monthlyDataGB.toFixed(0)} GB</span>
                        </div>
                        <div className="flex justify-between border-t border-[#2D3B5F] pt-1 mt-1">
                          <span className="text-[#94A3B8]">× ${calcRatePerGB.toFixed(2)}/GB:</span>
                          <span className="text-green-400 font-medium">${monthlyEarnings.toFixed(0)}/mo</span>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Trade Area Analyzer */}
      {activeCalculator === 'trade-area' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isCalculatorAvailable('trade-area') && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            Trade Area Analyzer
          </h3>
          <p className="text-[#94A3B8] mb-6">Understand where your venue&apos;s visitors come from and identify optimal coverage areas.</p>

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

          <div className="bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F] text-center">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
            <p className="text-[#94A3B8]">Enter a venue address to analyze its trade area</p>
            <div className="mt-4 flex gap-2 max-w-md mx-auto">
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

      {/* Competitor Comparison */}
      {activeCalculator === 'competitor' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isCalculatorAvailable('competitor') && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-400" />
            Competitor Comparison
          </h3>
          <p className="text-[#94A3B8] mb-6">Compare foot traffic metrics against nearby competitors.</p>

          <div className="bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F] text-center">
            <Target className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
            <p className="text-[#94A3B8]">Select venues to compare foot traffic and performance</p>
            <button className="mt-4 px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
              Select Venues
            </button>
          </div>
        </div>
      )}

      {/* Peak Hours Optimizer */}
      {activeCalculator === 'peak-hours' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isCalculatorAvailable('peak-hours') && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Peak Hours Optimizer
          </h3>
          <p className="text-[#94A3B8] mb-6">Identify peak visitation times to optimize WiFi capacity and earnings.</p>

          <div className="grid md:grid-cols-7 gap-2 mb-6">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={day} className="text-center">
                <div className="text-xs text-[#64748B] mb-2">{day}</div>
                <div className={`h-24 rounded-lg ${i === 4 || i === 5 ? 'bg-purple-500/30' : 'bg-[#2D3B5F]/30'}`}>
                  <div 
                    className="bg-purple-500 rounded-b-lg transition-all"
                    style={{ height: `${[60, 55, 65, 70, 90, 95, 45][i]}%`, marginTop: 'auto' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
            <div className="text-[#94A3B8] text-sm">Peak hours are typically <span className="text-purple-400 font-medium">Friday & Saturday evenings</span> for this venue type.</div>
          </div>
        </div>
      )}

      {/* Demographics Analyzer */}
      {activeCalculator === 'demographics' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isCalculatorAvailable('demographics') && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Demographics Analyzer
          </h3>
          <p className="text-[#94A3B8] mb-6">Understand visitor demographics and tailor your offerings.</p>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
              <div className="text-[#64748B] text-sm mb-1">Avg Age</div>
              <div className="text-2xl font-bold text-cyan-400">32</div>
            </div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
              <div className="text-[#64748B] text-sm mb-1">Avg Income</div>
              <div className="text-2xl font-bold text-green-400">$68k</div>
            </div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
              <div className="text-[#64748B] text-sm mb-1">Home Owners</div>
              <div className="text-2xl font-bold text-blue-400">45%</div>
            </div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
              <div className="text-[#64748B] text-sm mb-1">College Educated</div>
              <div className="text-2xl font-bold text-purple-400">62%</div>
            </div>
          </div>

          <div className="bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F] text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
            <p className="text-[#94A3B8]">Enter a venue address to analyze visitor demographics</p>
          </div>
        </div>
      )}

      {/* Venue Score */}
      {activeCalculator === 'venue-score' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isCalculatorAvailable('venue-score') && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-yellow-400" />
            Venue Score Calculator
          </h3>
          <p className="text-[#94A3B8] mb-6">Get an overall WiFi revenue potential score for any venue.</p>

          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#2D3B5F" strokeWidth="12" />
                <circle 
                  cx="80" cy="80" r="70" fill="none" 
                  stroke="#EAB308" strokeWidth="12" 
                  strokeLinecap="round"
                  strokeDasharray={`${78 * 4.4} 440`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-yellow-400">78</div>
                <div className="text-xs text-[#64748B]">out of 100</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-[#94A3B8] text-sm">Foot Traffic: <span className="text-white">Excellent</span></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-[#94A3B8] text-sm">Dwell Time: <span className="text-white">Good</span></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-[#94A3B8] text-sm">Demographics: <span className="text-white">Excellent</span></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[#94A3B8] text-sm">Competition: <span className="text-white">Moderate</span></span>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
            <div className="text-[#94A3B8] text-sm">This venue has <span className="text-yellow-400 font-medium">high revenue potential</span> based on traffic patterns and demographics.</div>
          </div>
        </div>
      )}
    </div>
  )
}
