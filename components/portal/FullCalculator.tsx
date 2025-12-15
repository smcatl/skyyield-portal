"use client"

import { useState, useEffect } from "react"
import { DollarSign, MapPin, Target, Clock, Users, Building2, Lock } from "lucide-react"

// Data rates in GB/hr per activity type
const DATA_RATES_GB: Record<string, number> = {
  sdVideo: 0.7, hdVideo: 3.0, videoCalls: 1.5, social: 0.15, music: 0.075, browsing: 0.05, gaming: 0.15, cloudSync: 0.3
}

const ACTIVITY_TYPES: Record<string, { label: string; icon: string; color: string; rate: string }> = {
  sdVideo: { label: "SD Video", icon: "📺", color: "#8B5CF6", rate: "0.7 GB/hr" },
  hdVideo: { label: "HD/4K Video", icon: "🎬", color: "#EC4899", rate: "3.0 GB/hr" },
  videoCalls: { label: "Video Calls", icon: "📹", color: "#F43F5E", rate: "1.5 GB/hr" },
  social: { label: "Social Media", icon: "📱", color: "#3B82F6", rate: "0.15 GB/hr" },
  music: { label: "Music/Podcasts", icon: "🎵", color: "#10B981", rate: "0.075 GB/hr" },
  browsing: { label: "Web/Email", icon: "🌐", color: "#F59E0B", rate: "0.05 GB/hr" },
  gaming: { label: "Gaming", icon: "🎮", color: "#6366F1", rate: "0.15 GB/hr" },
  cloudSync: { label: "Cloud/Uploads", icon: "☁️", color: "#06B6D4", rate: "0.3 GB/hr" }
}

const VENUE_CATEGORIES: Record<string, string[]> = {
  "Food & Beverage": ["restaurant_fastfood", "restaurant_sitdown", "cafe_coffee", "bar", "nightclub"],
  "Retail": ["convenience_gas", "convenience_nogas", "grocery", "retail_small", "retail_bigbox", "mall"],
  "Residential": ["apartment_single", "apartment_midrise", "apartment_highrise", "condo_single", "condo_midrise", "condo_highrise", "student_housing"],
  "Hospitality": ["hotel_single", "hotel_midrise", "hotel_highrise"],
  "Services": ["hair_salon", "pet_groomer", "medical_office", "animal_hospital", "daycare"],
  "Education": ["college", "school_k5", "school_middle", "school_high"],
  "Recreation": ["dog_park", "stadium", "museum", "library"],
  "Transportation": ["airport"],
  "Workspace": ["coworking"],
  "Custom": ["custom"]
}

interface VenueProfile {
  name: string; description: string; avgDwell: string;
  sdVideo: number; hdVideo: number; videoCalls: number; social: number;
  music: number; browsing: number; gaming: number; cloudSync: number; wifiMultiplier: number;
}

const VENUE_PROFILES: Record<string, VenueProfile> = {
  restaurant_fastfood: { name: "Fast Food Restaurant", description: "Quick service, drive-thru", avgDwell: "15-25 min", sdVideo: 10, hdVideo: 0, videoCalls: 0, social: 45, music: 25, browsing: 15, gaming: 5, cloudSync: 0, wifiMultiplier: 1.3 },
  restaurant_sitdown: { name: "Sit-Down Restaurant", description: "Casual & fine dining", avgDwell: "45-90 min", sdVideo: 15, hdVideo: 5, videoCalls: 0, social: 40, music: 20, browsing: 15, gaming: 3, cloudSync: 2, wifiMultiplier: 1.5 },
  cafe_coffee: { name: "Café / Coffee Shop", description: "Coffee shops, bakeries", avgDwell: "30-60 min", sdVideo: 15, hdVideo: 5, videoCalls: 10, social: 30, music: 15, browsing: 20, gaming: 3, cloudSync: 2, wifiMultiplier: 1.6 },
  bar: { name: "Bar", description: "Sports bars, pubs, lounges", avgDwell: "60-120 min", sdVideo: 20, hdVideo: 10, videoCalls: 0, social: 40, music: 15, browsing: 10, gaming: 5, cloudSync: 0, wifiMultiplier: 1.5 },
  nightclub: { name: "Nightclub", description: "Dance clubs, venues", avgDwell: "2-4 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 0, social: 55, music: 15, browsing: 5, gaming: 5, cloudSync: 5, wifiMultiplier: 1.4 },
  convenience_gas: { name: "Convenience Store (w/ Gas)", description: "Gas stations with stores", avgDwell: "5-10 min", sdVideo: 0, hdVideo: 0, videoCalls: 0, social: 35, music: 40, browsing: 20, gaming: 5, cloudSync: 0, wifiMultiplier: 1.2 },
  convenience_nogas: { name: "Convenience Store (w/o Gas)", description: "Standalone convenience stores", avgDwell: "5-15 min", sdVideo: 0, hdVideo: 0, videoCalls: 0, social: 40, music: 35, browsing: 20, gaming: 5, cloudSync: 0, wifiMultiplier: 1.2 },
  grocery: { name: "Grocery Store", description: "Supermarkets, grocery chains", avgDwell: "20-45 min", sdVideo: 5, hdVideo: 0, videoCalls: 5, social: 30, music: 35, browsing: 20, gaming: 0, cloudSync: 5, wifiMultiplier: 1.3 },
  retail_small: { name: "Retail Store", description: "Boutiques, specialty stores", avgDwell: "15-30 min", sdVideo: 5, hdVideo: 0, videoCalls: 0, social: 45, music: 30, browsing: 15, gaming: 5, cloudSync: 0, wifiMultiplier: 1.3 },
  retail_bigbox: { name: "Big Box Retail", description: "Target, Walmart, Costco", avgDwell: "30-60 min", sdVideo: 5, hdVideo: 0, videoCalls: 5, social: 35, music: 30, browsing: 20, gaming: 0, cloudSync: 5, wifiMultiplier: 1.3 },
  mall: { name: "Shopping Mall", description: "Indoor malls, outlets", avgDwell: "1-3 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 5, social: 40, music: 20, browsing: 15, gaming: 3, cloudSync: 2, wifiMultiplier: 1.5 },
  apartment_single: { name: "Apartment (Single Level)", description: "Garden-style apartments", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  apartment_midrise: { name: "Apartment (Midrise)", description: "4-12 story apartments", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  apartment_highrise: { name: "Apartment (Highrise)", description: "12+ story apartments", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  condo_single: { name: "Condo (Single Level)", description: "Townhomes, garden condos", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  condo_midrise: { name: "Condo (Midrise)", description: "4-12 story condos", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  condo_highrise: { name: "Condo (Highrise)", description: "12+ story condos", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  student_housing: { name: "Student Housing", description: "Dorms, off-campus housing", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 25, music: 10, browsing: 5, gaming: 10, cloudSync: 5, wifiMultiplier: 2.2 },
  hotel_single: { name: "Hotel (Single Level)", description: "Motels, budget hotels", avgDwell: "1-3 nights", sdVideo: 25, hdVideo: 20, videoCalls: 10, social: 15, music: 10, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 2.0 },
  hotel_midrise: { name: "Hotel (Midrise)", description: "Business hotels, mid-tier", avgDwell: "1-3 nights", sdVideo: 20, hdVideo: 20, videoCalls: 15, social: 15, music: 10, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 2.2 },
  hotel_highrise: { name: "Hotel (Highrise)", description: "Full-service, luxury hotels", avgDwell: "1-5 nights", sdVideo: 20, hdVideo: 20, videoCalls: 15, social: 15, music: 10, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 2.3 },
  hair_salon: { name: "Hair Salon", description: "Salons, barbershops, spas", avgDwell: "45-90 min", sdVideo: 25, hdVideo: 5, videoCalls: 0, social: 40, music: 15, browsing: 10, gaming: 5, cloudSync: 0, wifiMultiplier: 1.5 },
  pet_groomer: { name: "Pet Groomer", description: "Pet grooming services", avgDwell: "30-60 min (waiting)", sdVideo: 20, hdVideo: 5, videoCalls: 5, social: 35, music: 20, browsing: 10, gaming: 5, cloudSync: 0, wifiMultiplier: 1.5 },
  medical_office: { name: "Medical Office", description: "Clinics, doctor offices", avgDwell: "30-60 min", sdVideo: 15, hdVideo: 0, videoCalls: 5, social: 35, music: 20, browsing: 20, gaming: 5, cloudSync: 0, wifiMultiplier: 1.4 },
  animal_hospital: { name: "Animal Hospital", description: "Vet clinics, emergency vet", avgDwell: "30-90 min", sdVideo: 15, hdVideo: 5, videoCalls: 5, social: 35, music: 20, browsing: 15, gaming: 5, cloudSync: 0, wifiMultiplier: 1.4 },
  daycare: { name: "Daycare", description: "Childcare centers", avgDwell: "5-15 min (drop-off)", sdVideo: 5, hdVideo: 0, videoCalls: 5, social: 40, music: 25, browsing: 20, gaming: 0, cloudSync: 5, wifiMultiplier: 1.2 },
  college: { name: "College/University", description: "Higher education campuses", avgDwell: "2-8 hrs", sdVideo: 15, hdVideo: 10, videoCalls: 15, social: 25, music: 10, browsing: 15, gaming: 5, cloudSync: 5, wifiMultiplier: 2.0 },
  school_k5: { name: "School (K-5)", description: "Elementary schools", avgDwell: "Staff/Parent: 15-30 min", sdVideo: 5, hdVideo: 0, videoCalls: 5, social: 35, music: 25, browsing: 25, gaming: 0, cloudSync: 5, wifiMultiplier: 1.3 },
  school_middle: { name: "School (6-8)", description: "Middle schools", avgDwell: "Staff/Parent: 15-30 min", sdVideo: 10, hdVideo: 5, videoCalls: 5, social: 40, music: 20, browsing: 15, gaming: 5, cloudSync: 0, wifiMultiplier: 1.4 },
  school_high: { name: "School (9-12)", description: "High schools", avgDwell: "Staff/Parent: 15-30 min", sdVideo: 15, hdVideo: 5, videoCalls: 5, social: 40, music: 15, browsing: 10, gaming: 10, cloudSync: 0, wifiMultiplier: 1.5 },
  dog_park: { name: "Dog Park", description: "Off-leash parks", avgDwell: "30-60 min", sdVideo: 10, hdVideo: 0, videoCalls: 10, social: 40, music: 25, browsing: 10, gaming: 0, cloudSync: 5, wifiMultiplier: 1.3 },
  stadium: { name: "Stadium/Arena", description: "Sports venues, concert halls", avgDwell: "2-4 hrs", sdVideo: 15, hdVideo: 5, videoCalls: 5, social: 50, music: 5, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 1.5 },
  museum: { name: "Museum", description: "Art, history, science museums", avgDwell: "1-3 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 0, social: 40, music: 15, browsing: 25, gaming: 0, cloudSync: 5, wifiMultiplier: 1.4 },
  library: { name: "Library", description: "Public & university libraries", avgDwell: "1-4 hrs", sdVideo: 15, hdVideo: 10, videoCalls: 5, social: 20, music: 15, browsing: 30, gaming: 0, cloudSync: 5, wifiMultiplier: 1.8 },
  airport: { name: "Airport", description: "Terminals, lounges", avgDwell: "1-4 hrs", sdVideo: 20, hdVideo: 15, videoCalls: 15, social: 20, music: 10, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 2.3 },
  coworking: { name: "Co-Working Space", description: "Shared offices, WeWork", avgDwell: "4-8 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 25, social: 15, music: 15, browsing: 20, gaming: 0, cloudSync: 10, wifiMultiplier: 2.0 },
  custom: { name: "Custom Mix", description: "Set your own percentages", avgDwell: "Varies", sdVideo: 15, hdVideo: 10, videoCalls: 10, social: 25, music: 15, browsing: 15, gaming: 5, cloudSync: 5, wifiMultiplier: 1.5 }
}

type ActivityKey = "sdVideo" | "hdVideo" | "videoCalls" | "social" | "music" | "browsing" | "gaming" | "cloudSync"

interface Props { isSubscribed?: boolean; showAllCalculators?: boolean }

export default function FullCalculator({ isSubscribed = false, showAllCalculators = false }: Props) {
  // Location inputs
  const [address, setAddress] = useState("")
  const [nearbyRadius, setNearbyRadius] = useState(200)
  const [analysisPeriod, setAnalysisPeriod] = useState(90)
  
  // WiFi parameters
  const [insideAdoption, setInsideAdoption] = useState(35)
  const [nearbyAdoption, setNearbyAdoption] = useState(17.5)
  const [wifiFreedomMultiplier, setWifiFreedomMultiplier] = useState(1.5)
  
  // Venue profile
  const [selectedVenue, setSelectedVenue] = useState<string>("cafe_coffee")
  const [customMix, setCustomMix] = useState({
    sdVideo: 15, hdVideo: 10, videoCalls: 10, social: 25, music: 15, browsing: 15, gaming: 5, cloudSync: 5
  })
  
  // Earnings rate
  const [ratePerGB, setRatePerGB] = useState(0.50)
  
  // Calculated values
  const [dataPerHourGB, setDataPerHourGB] = useState(0)

  const [activeCalculator, setActiveCalculator] = useState('earnings')

  const calculators = [
    { id: 'earnings', label: 'WiFi Earnings', icon: DollarSign, color: 'text-green-400', free: true },
    { id: 'trade-area', label: 'Trade Area', icon: MapPin, color: 'text-blue-400', free: false },
    { id: 'competitor', label: 'Competitor', icon: Target, color: 'text-orange-400', free: false },
    { id: 'peak-hours', label: 'Peak Hours', icon: Clock, color: 'text-purple-400', free: false },
    { id: 'demographics', label: 'Demographics', icon: Users, color: 'text-cyan-400', free: false },
    { id: 'venue-score', label: 'Venue Score', icon: Building2, color: 'text-yellow-400', free: false },
  ]

  const isAvailable = (id: string) => showAllCalculators || calculators.find(c => c.id === id)?.free || isSubscribed

  // Update WiFi multiplier when venue changes
  useEffect(() => {
    if (selectedVenue !== "custom" && VENUE_PROFILES[selectedVenue]) {
      setWifiFreedomMultiplier(VENUE_PROFILES[selectedVenue].wifiMultiplier)
    }
  }, [selectedVenue])
  
  // Get current activity mix
  const getCurrentMix = () => {
    if (selectedVenue === "custom") return customMix
    const profile = VENUE_PROFILES[selectedVenue]
    return profile ? {
      sdVideo: profile.sdVideo, hdVideo: profile.hdVideo, videoCalls: profile.videoCalls,
      social: profile.social, music: profile.music, browsing: profile.browsing,
      gaming: profile.gaming, cloudSync: profile.cloudSync
    } : customMix
  }
  
  // Calculate data consumption per hour in GB
  useEffect(() => {
    const mix = getCurrentMix()
    const baseDataGB = 
      (mix.sdVideo / 100) * DATA_RATES_GB.sdVideo +
      (mix.hdVideo / 100) * DATA_RATES_GB.hdVideo +
      (mix.videoCalls / 100) * DATA_RATES_GB.videoCalls +
      (mix.social / 100) * DATA_RATES_GB.social +
      (mix.music / 100) * DATA_RATES_GB.music +
      (mix.browsing / 100) * DATA_RATES_GB.browsing +
      (mix.gaming / 100) * DATA_RATES_GB.gaming +
      (mix.cloudSync / 100) * DATA_RATES_GB.cloudSync
    setDataPerHourGB(baseDataGB * wifiFreedomMultiplier)
  }, [selectedVenue, customMix, wifiFreedomMultiplier])
  
  // Custom mix validation
  const customTotal = Object.values(customMix).reduce((a, b) => a + b, 0)
  const isCustomValid = customTotal === 100
  
  const updateCustomMix = (key: ActivityKey, value: number) => {
    setCustomMix(prev => ({ ...prev, [key]: value }))
  }

  const LockedOverlay = () => (
    <div className="absolute inset-0 bg-[#0A0F2C]/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">
      <Lock className="w-12 h-12 text-[#64748B] mb-4" />
      <h3 className="text-white font-semibold mb-2">Premium Calculator</h3>
      <p className="text-[#94A3B8] text-sm text-center max-w-xs mb-4">Subscribe to unlock all location intelligence tools</p>
      <a href="/pricing?plan=calculator" className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80">Upgrade Now</a>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Location Intelligence Calculators</h2>
        <p className="text-[#94A3B8] text-sm">Analyze venues and estimate potential earnings</p>
      </div>

      {/* Calculator Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {calculators.map(c => (
          <button key={c.id} onClick={() => setActiveCalculator(c.id)}
            className={`p-4 rounded-xl border transition-all relative ${activeCalculator === c.id ? 'bg-[#0EA5E9]/20 border-[#0EA5E9] text-white' : 'bg-[#1A1F3A] border-[#2D3B5F] text-[#94A3B8] hover:border-[#0EA5E9]/50'}`}>
            {!c.free && !isSubscribed && !showAllCalculators && <Lock className="absolute top-2 right-2 w-3 h-3 text-[#64748B]" />}
            <c.icon className={`w-6 h-6 mx-auto mb-2 ${c.color}`} />
            <div className="text-xs font-medium">{c.label}</div>
          </button>
        ))}
      </div>

      {/* WiFi Earnings Calculator - Full Featured */}
      {activeCalculator === 'earnings' && (
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Left Column - All Inputs */}
          <div className="space-y-6">
            {/* Location Parameters */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#0EA5E9] mb-6">📍 Location Parameters</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-2">Property Address *</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} 
                    placeholder="Enter address (e.g., 123 Main St, Dallas, TX)"
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-[#94A3B8]">Nearby Radius (exterior coverage)</label>
                    <span className="text-sm text-[#0EA5E9] font-semibold">{nearbyRadius} ft</span>
                  </div>
                  <input type="range" min="50" max="500" step="25" value={nearbyRadius} onChange={(e) => setNearbyRadius(Number(e.target.value))} 
                    className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer accent-[#0EA5E9]" />
                  <div className="flex justify-between text-xs text-[#64748B] mt-1"><span>50 ft</span><span>500 ft</span></div>
                </div>
                
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-2">Analysis Period</label>
                  <select value={analysisPeriod} onChange={(e) => setAnalysisPeriod(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]">
                    <option value={30}>Last 30 days</option>
                    <option value={60}>Last 60 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Venue Type */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#0EA5E9] mb-2">🏢 Venue Type</h3>
              <p className="text-xs text-[#64748B] mb-4">Select your venue type. This sets typical visitor behavior and WiFi usage patterns.</p>
              
              <select value={selectedVenue} onChange={(e) => setSelectedVenue(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] mb-4">
                {Object.entries(VENUE_CATEGORIES).map(([cat, ids]) => (
                  <optgroup key={cat} label={cat}>{ids.map(id => <option key={id} value={id}>{VENUE_PROFILES[id]?.name || id}</option>)}</optgroup>
                ))}
              </select>
              
              {VENUE_PROFILES[selectedVenue] && (
                <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-white font-semibold">{VENUE_PROFILES[selectedVenue].name}</div>
                    <span className="px-3 py-1 bg-[#1A1F3A] rounded-full text-xs text-[#94A3B8]">{VENUE_PROFILES[selectedVenue].avgDwell}</span>
                  </div>
                  <div className="text-[#64748B] text-sm mb-2">{VENUE_PROFILES[selectedVenue].description}</div>
                  <div className="text-sm">
                    <span className="text-[#64748B]">Default WiFi Multiplier:</span>
                    <span className="text-[#10F981] ml-2 font-semibold">{VENUE_PROFILES[selectedVenue].wifiMultiplier}x</span>
                  </div>
                </div>
              )}
            </div>

            {/* WiFi Usage Parameters */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#0EA5E9] mb-6">📶 WiFi Usage Parameters</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-[#94A3B8]">Inside WiFi Adoption Rate</label>
                    <span className="text-sm text-[#10F981] font-semibold">{insideAdoption}%</span>
                  </div>
                  <input type="range" min="10" max="80" step="5" value={insideAdoption} onChange={(e) => setInsideAdoption(Number(e.target.value))}
                    className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer accent-[#10F981]" />
                  <p className="text-xs text-[#64748B] mt-1">% of visitors inside property who connect to WiFi</p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-[#94A3B8]">Nearby WiFi Adoption Rate</label>
                    <span className="text-sm text-[#10F981] font-semibold">{nearbyAdoption}%</span>
                  </div>
                  <input type="range" min="5" max="40" step="2.5" value={nearbyAdoption} onChange={(e) => setNearbyAdoption(Number(e.target.value))}
                    className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer accent-[#10F981]" />
                  <p className="text-xs text-[#64748B] mt-1">% of nearby foot traffic (outside) who connect to WiFi</p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-[#94A3B8]">WiFi Freedom Multiplier</label>
                    <span className="text-sm text-[#10F981] font-semibold">{wifiFreedomMultiplier.toFixed(1)}x</span>
                  </div>
                  <input type="range" min="1.0" max="2.5" step="0.1" value={wifiFreedomMultiplier} onChange={(e) => setWifiFreedomMultiplier(Number(e.target.value))}
                    className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer accent-[#10F981]" />
                  <p className="text-xs text-[#64748B] mt-1">People use more data on free WiFi (1.0x = same as cellular, 2.5x = heavy increase)</p>
                </div>
              </div>
            </div>

            {/* Activity Mix */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#0EA5E9] mb-2">📊 Activity Mix</h3>
              <p className="text-xs text-[#64748B] mb-4">
                {selectedVenue === "custom" ? "Set custom percentages for each activity type. Must total 100%." : `Based on typical ${VENUE_PROFILES[selectedVenue]?.name || "visitor"} behavior. Select "Custom Mix" to adjust.`}
              </p>
              
              <div className="bg-[#0A0F2C] rounded-lg p-5 border border-[#2D3B5F]">
                {selectedVenue === "custom" && (
                  <div className={`flex justify-between items-center mb-5 p-3 rounded-lg border ${isCustomValid ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
                    <span className={`text-sm ${isCustomValid ? 'text-green-400' : 'text-red-400'}`}>{isCustomValid ? "✓ Mix is valid" : "⚠ Must total 100%"}</span>
                    <span className={`text-lg font-semibold ${isCustomValid ? 'text-green-400' : 'text-red-400'}`}>{customTotal}%</span>
                  </div>
                )}
                
                {Object.entries(ACTIVITY_TYPES).map(([key, activity]) => {
                  const mixKey = key as ActivityKey
                  const currentValue = selectedVenue === "custom" ? customMix[mixKey] : (VENUE_PROFILES[selectedVenue]?.[mixKey as keyof VenueProfile] as number ?? 0)
                  
                  return (
                    <div key={key} className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-[#94A3B8]">{activity.icon} {activity.label} <span className="text-[#64748B] text-xs">({activity.rate})</span></span>
                        <span className="text-sm text-white font-medium">{currentValue}%</span>
                      </div>
                      {selectedVenue === "custom" ? (
                        <input type="range" min="0" max="100" value={customMix[mixKey]} onChange={(e) => updateCustomMix(mixKey, Number(e.target.value))}
                          style={{ accentColor: activity.color }} className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer" />
                      ) : (
                        <div className="h-2 bg-[#2D3B5F] rounded-full overflow-hidden">
                          <div style={{ width: `${currentValue}%`, backgroundColor: activity.color }} className="h-full transition-all duration-300" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Earnings Configuration */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#0EA5E9] mb-6">💰 Earnings Configuration</h3>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-[#94A3B8]">Rate per GB</label>
                  <span className="text-sm text-[#10F981] font-semibold">${ratePerGB.toFixed(2)}</span>
                </div>
                <input type="range" min="0.10" max="2.00" step="0.05" value={ratePerGB} onChange={(e) => setRatePerGB(Number(e.target.value))}
                  className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer accent-[#10F981]" />
                <div className="flex justify-between text-xs text-[#64748B] mt-1"><span>$0.10</span><span>$2.00</span></div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Results */}
          <div>
            <div className="bg-[#1A1F3A] border-2 border-[#0EA5E9] rounded-xl p-6 sticky top-6">
              <h3 className="text-lg font-bold text-white mb-6">📈 Estimate Preview</h3>
              
              {/* Data Rate Display */}
              <div className="bg-[#0A0F2C] rounded-xl p-5 mb-5 text-center">
                <div className="text-5xl font-bold text-[#0EA5E9] mb-1">{dataPerHourGB.toFixed(2)}</div>
                <div className="text-sm text-[#94A3B8]">GB/hr per WiFi user</div>
                <div className="text-xs text-[#64748B] mt-2">Based on {VENUE_PROFILES[selectedVenue]?.name}{wifiFreedomMultiplier !== 1.5 && ` × ${wifiFreedomMultiplier.toFixed(1)}x multiplier`}</div>
              </div>
              
              {/* Activity Mix Pills */}
              <div className="bg-[#0A0F2C] rounded-xl p-4 mb-5">
                <h4 className="text-sm text-[#94A3B8] mb-3 text-center">Activity Mix</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(ACTIVITY_TYPES).filter(([key]) => {
                    const mix = getCurrentMix()
                    return mix[key as ActivityKey] > 0
                  }).map(([key, activity]) => {
                    const mix = getCurrentMix()
                    return (
                      <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1F3A] rounded-full text-xs">
                        <div style={{ backgroundColor: activity.color }} className="w-2 h-2 rounded-full" />
                        <span className="text-[#94A3B8]">{activity.label}</span>
                        <span className="text-white font-semibold">{mix[key as ActivityKey]}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Configuration Summary */}
              <div className="bg-[#0A0F2C] rounded-xl p-4 mb-5 text-sm">
                <div className="flex justify-between mb-2"><span className="text-[#64748B]">Venue Type</span><span className="text-white">{VENUE_PROFILES[selectedVenue]?.name || "—"}</span></div>
                <div className="flex justify-between mb-2"><span className="text-[#64748B]">Avg Dwell Time</span><span className="text-white">{VENUE_PROFILES[selectedVenue]?.avgDwell || "—"}</span></div>
                <div className="flex justify-between mb-2"><span className="text-[#64748B]">Nearby Radius</span><span className="text-white">{nearbyRadius} ft</span></div>
                <div className="flex justify-between mb-2"><span className="text-[#64748B]">Inside Adoption</span><span className="text-white">{insideAdoption}%</span></div>
                <div className="flex justify-between mb-2"><span className="text-[#64748B]">Nearby Adoption</span><span className="text-white">{nearbyAdoption}%</span></div>
                <div className="flex justify-between mb-2"><span className="text-[#64748B]">WiFi Multiplier</span><span className="text-white">{wifiFreedomMultiplier.toFixed(1)}x</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Rate per GB</span><span className="text-[#10F981]">${ratePerGB.toFixed(2)}</span></div>
              </div>
              
              {/* Analyze Button */}
              <button 
                disabled={!address.trim() || (selectedVenue === "custom" && !isCustomValid)}
                className={`w-full py-4 rounded-xl text-base font-bold mb-4 transition-all ${
                  address.trim() && (selectedVenue !== "custom" || isCustomValid) 
                    ? 'bg-gradient-to-r from-[#10F981] to-[#00FF66] text-[#0A0F2C] cursor-pointer hover:shadow-lg hover:shadow-green-500/25' 
                    : 'bg-[#2D3B5F] text-[#64748B] cursor-not-allowed'
                }`}>
                🔍 Analyze Location
              </button>
              
              {/* Subscription Info */}
              <div className="p-3 bg-[#0EA5E9]/10 rounded-lg border border-[#0EA5E9]/20 text-center text-xs text-[#94A3B8]">
                <strong className="text-[#0EA5E9]">Calculator Access:</strong> $49/mo includes 100 reports<br />
                <span className="text-[#64748B]">Additional reports: $1 each</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other calculators */}
      {activeCalculator === 'trade-area' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isAvailable('trade-area') && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-400" />Trade Area Analyzer</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F] text-center"><div className="text-2xl font-bold text-blue-400">5 mi</div><div className="text-xs text-[#64748B]">Primary (70%)</div></div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F] text-center"><div className="text-2xl font-bold text-cyan-400">15 mi</div><div className="text-xs text-[#64748B]">Secondary (25%)</div></div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F] text-center"><div className="text-2xl font-bold text-purple-400">30+ mi</div><div className="text-xs text-[#64748B]">Extended (5%)</div></div>
          </div>
        </div>
      )}

      {activeCalculator === 'competitor' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isAvailable('competitor') && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-orange-400" />Competitor Comparison</h3>
          <p className="text-[#94A3B8]">Compare foot traffic metrics against nearby competitors.</p>
        </div>
      )}

      {activeCalculator === 'peak-hours' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isAvailable('peak-hours') && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-purple-400" />Peak Hours Optimizer</h3>
          <div className="grid grid-cols-7 gap-2">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => (
              <div key={d} className="text-center">
                <div className="text-xs text-[#64748B] mb-2">{d}</div>
                <div className={`h-20 rounded-lg relative overflow-hidden ${i>=4 ? 'bg-purple-500/20' : 'bg-[#2D3B5F]/30'}`}>
                  <div className="absolute bottom-0 left-0 right-0 bg-purple-500" style={{ height: `${[55,50,60,65,85,90,40][i]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCalculator === 'demographics' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isAvailable('demographics') && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" />Demographics Analyzer</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-[#0A0F2C] rounded-xl p-4 text-center"><div className="text-2xl font-bold text-cyan-400">32</div><div className="text-xs text-[#64748B]">Avg Age</div></div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 text-center"><div className="text-2xl font-bold text-green-400">$68k</div><div className="text-xs text-[#64748B]">Income</div></div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 text-center"><div className="text-2xl font-bold text-blue-400">45%</div><div className="text-xs text-[#64748B]">Homeowners</div></div>
            <div className="bg-[#0A0F2C] rounded-xl p-4 text-center"><div className="text-2xl font-bold text-purple-400">62%</div><div className="text-xs text-[#64748B]">College</div></div>
          </div>
        </div>
      )}

      {activeCalculator === 'venue-score' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isAvailable('venue-score') && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-yellow-400" />Venue Score</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90"><circle cx="64" cy="64" r="56" fill="none" stroke="#2D3B5F" strokeWidth="10" /><circle cx="64" cy="64" r="56" fill="none" stroke="#EAB308" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${78*3.5} 352`} /></svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><div className="text-3xl font-bold text-yellow-400">78</div><div className="text-xs text-[#64748B]">/ 100</div></div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[#94A3B8]">Traffic: Excellent</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-[#94A3B8]">Dwell: Good</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[#94A3B8]">Demographics: Excellent</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
