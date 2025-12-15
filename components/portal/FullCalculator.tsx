'use client'

import { useState, useEffect } from 'react'
import { DollarSign, MapPin, Target, Clock, Users, Building2, Lock } from 'lucide-react'

const DATA_RATES_GB: Record<string, number> = {
  sdVideo: 0.7, hdVideo: 3.0, videoCalls: 1.5, social: 0.15, music: 0.075, browsing: 0.05, gaming: 0.15, cloudSync: 0.3
}

const ACTIVITY_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  sdVideo: { label: "SD Video", icon: "📺", color: "#8B5CF6" },
  hdVideo: { label: "HD/4K Video", icon: "🎬", color: "#EC4899" },
  videoCalls: { label: "Video Calls", icon: "📹", color: "#F43F5E" },
  social: { label: "Social Media", icon: "📱", color: "#3B82F6" },
  music: { label: "Music/Podcasts", icon: "🎵", color: "#10B981" },
  browsing: { label: "Web/Email", icon: "🌐", color: "#F59E0B" },
  gaming: { label: "Gaming", icon: "🎮", color: "#6366F1" },
  cloudSync: { label: "Cloud/Uploads", icon: "☁️", color: "#06B6D4" }
}

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
  "Custom": ["custom"]
}

interface VenueProfile {
  name: string; description: string; avgDwell: string;
  sdVideo: number; hdVideo: number; videoCalls: number; social: number;
  music: number; browsing: number; gaming: number; cloudSync: number; wifiMultiplier: number;
}

const VENUE_PROFILES: Record<string, VenueProfile> = {
  restaurant_fastfood: { name: "Fast Food Restaurant", description: "Quick service", avgDwell: "15-25 min", sdVideo: 10, hdVideo: 0, videoCalls: 0, social: 45, music: 25, browsing: 15, gaming: 5, cloudSync: 0, wifiMultiplier: 1.3 },
  restaurant_sitdown: { name: "Sit-Down Restaurant", description: "Casual & fine dining", avgDwell: "45-90 min", sdVideo: 15, hdVideo: 5, videoCalls: 0, social: 40, music: 20, browsing: 15, gaming: 3, cloudSync: 2, wifiMultiplier: 1.5 },
  cafe_coffee: { name: "Café / Coffee Shop", description: "Coffee shops, bakeries", avgDwell: "30-60 min", sdVideo: 15, hdVideo: 5, videoCalls: 10, social: 30, music: 15, browsing: 20, gaming: 3, cloudSync: 2, wifiMultiplier: 1.6 },
  bar: { name: "Bar / Pub", description: "Sports bars, pubs", avgDwell: "60-120 min", sdVideo: 20, hdVideo: 10, videoCalls: 0, social: 40, music: 15, browsing: 10, gaming: 5, cloudSync: 0, wifiMultiplier: 1.5 },
  nightclub: { name: "Nightclub", description: "Dance clubs", avgDwell: "2-4 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 0, social: 55, music: 15, browsing: 5, gaming: 5, cloudSync: 5, wifiMultiplier: 1.4 },
  convenience_gas: { name: "Convenience Store (w/ Gas)", description: "Gas stations", avgDwell: "5-10 min", sdVideo: 0, hdVideo: 0, videoCalls: 0, social: 35, music: 40, browsing: 20, gaming: 5, cloudSync: 0, wifiMultiplier: 1.2 },
  convenience_nogas: { name: "Convenience Store", description: "Standalone stores", avgDwell: "5-15 min", sdVideo: 0, hdVideo: 0, videoCalls: 0, social: 40, music: 35, browsing: 20, gaming: 5, cloudSync: 0, wifiMultiplier: 1.2 },
  grocery: { name: "Grocery Store", description: "Supermarkets", avgDwell: "20-45 min", sdVideo: 5, hdVideo: 0, videoCalls: 5, social: 30, music: 35, browsing: 20, gaming: 0, cloudSync: 5, wifiMultiplier: 1.3 },
  retail_small: { name: "Retail Store", description: "Boutiques", avgDwell: "15-30 min", sdVideo: 5, hdVideo: 0, videoCalls: 0, social: 45, music: 30, browsing: 15, gaming: 5, cloudSync: 0, wifiMultiplier: 1.3 },
  retail_bigbox: { name: "Big Box Retail", description: "Target, Walmart", avgDwell: "30-60 min", sdVideo: 5, hdVideo: 0, videoCalls: 5, social: 35, music: 30, browsing: 20, gaming: 0, cloudSync: 5, wifiMultiplier: 1.3 },
  mall: { name: "Shopping Mall", description: "Indoor malls", avgDwell: "1-3 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 5, social: 40, music: 20, browsing: 15, gaming: 3, cloudSync: 2, wifiMultiplier: 1.5 },
  apartment_single: { name: "Apartment (Single Level)", description: "Garden-style", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  apartment_midrise: { name: "Apartment (Midrise)", description: "4-12 story", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  apartment_highrise: { name: "Apartment (Highrise)", description: "12+ story", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  student_housing: { name: "Student Housing", description: "Dorms", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 25, music: 10, browsing: 5, gaming: 10, cloudSync: 5, wifiMultiplier: 2.2 },
  hotel_single: { name: "Hotel (Single Level)", description: "Budget hotels", avgDwell: "1-3 nights", sdVideo: 25, hdVideo: 20, videoCalls: 10, social: 15, music: 10, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 2.0 },
  hotel_midrise: { name: "Hotel (Midrise)", description: "Business hotels", avgDwell: "1-3 nights", sdVideo: 20, hdVideo: 20, videoCalls: 15, social: 15, music: 10, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 2.2 },
  hotel_highrise: { name: "Hotel (Highrise)", description: "Luxury hotels", avgDwell: "1-5 nights", sdVideo: 20, hdVideo: 20, videoCalls: 15, social: 15, music: 10, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 2.3 },
  hair_salon: { name: "Hair Salon / Spa", description: "Salons, spas", avgDwell: "45-90 min", sdVideo: 25, hdVideo: 5, videoCalls: 0, social: 40, music: 15, browsing: 10, gaming: 5, cloudSync: 0, wifiMultiplier: 1.5 },
  pet_groomer: { name: "Pet Groomer", description: "Pet grooming", avgDwell: "30-60 min", sdVideo: 20, hdVideo: 5, videoCalls: 5, social: 35, music: 20, browsing: 10, gaming: 5, cloudSync: 0, wifiMultiplier: 1.5 },
  medical_office: { name: "Medical Office", description: "Clinics", avgDwell: "30-60 min", sdVideo: 15, hdVideo: 0, videoCalls: 5, social: 35, music: 20, browsing: 20, gaming: 5, cloudSync: 0, wifiMultiplier: 1.4 },
  animal_hospital: { name: "Animal Hospital", description: "Vet clinics", avgDwell: "30-90 min", sdVideo: 15, hdVideo: 5, videoCalls: 5, social: 35, music: 20, browsing: 15, gaming: 5, cloudSync: 0, wifiMultiplier: 1.4 },
  daycare: { name: "Daycare", description: "Childcare", avgDwell: "Drop-off", sdVideo: 5, hdVideo: 0, videoCalls: 5, social: 40, music: 25, browsing: 20, gaming: 0, cloudSync: 5, wifiMultiplier: 1.2 },
  college: { name: "College/University", description: "Higher education", avgDwell: "2-8 hrs", sdVideo: 15, hdVideo: 10, videoCalls: 15, social: 25, music: 10, browsing: 15, gaming: 5, cloudSync: 5, wifiMultiplier: 2.0 },
  school_k5: { name: "School (K-5)", description: "Elementary", avgDwell: "Staff hours", sdVideo: 5, hdVideo: 0, videoCalls: 5, social: 35, music: 25, browsing: 25, gaming: 0, cloudSync: 5, wifiMultiplier: 1.3 },
  school_middle: { name: "School (6-8)", description: "Middle schools", avgDwell: "Staff hours", sdVideo: 10, hdVideo: 5, videoCalls: 5, social: 40, music: 20, browsing: 15, gaming: 5, cloudSync: 0, wifiMultiplier: 1.4 },
  school_high: { name: "School (9-12)", description: "High schools", avgDwell: "Staff hours", sdVideo: 15, hdVideo: 5, videoCalls: 5, social: 40, music: 15, browsing: 10, gaming: 10, cloudSync: 0, wifiMultiplier: 1.5 },
  dog_park: { name: "Dog Park", description: "Off-leash parks", avgDwell: "30-60 min", sdVideo: 10, hdVideo: 0, videoCalls: 10, social: 40, music: 25, browsing: 10, gaming: 0, cloudSync: 5, wifiMultiplier: 1.3 },
  stadium: { name: "Stadium / Arena", description: "Sports venues", avgDwell: "2-4 hrs", sdVideo: 15, hdVideo: 5, videoCalls: 5, social: 50, music: 5, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 1.5 },
  museum: { name: "Museum", description: "Art, history", avgDwell: "1-3 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 0, social: 40, music: 15, browsing: 25, gaming: 0, cloudSync: 5, wifiMultiplier: 1.4 },
  library: { name: "Library", description: "Public libraries", avgDwell: "1-4 hrs", sdVideo: 15, hdVideo: 10, videoCalls: 5, social: 20, music: 15, browsing: 30, gaming: 0, cloudSync: 5, wifiMultiplier: 1.8 },
  gym: { name: "Gym / Fitness", description: "Fitness centers", avgDwell: "1-2 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 0, social: 25, music: 40, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 1.6 },
  airport: { name: "Airport", description: "Terminals", avgDwell: "1-4 hrs", sdVideo: 20, hdVideo: 15, videoCalls: 15, social: 20, music: 10, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 2.3 },
  transit_station: { name: "Transit Station", description: "Bus/train", avgDwell: "15-45 min", sdVideo: 10, hdVideo: 5, videoCalls: 5, social: 40, music: 25, browsing: 10, gaming: 5, cloudSync: 0, wifiMultiplier: 1.4 },
  coworking: { name: "Co-Working Space", description: "Shared offices", avgDwell: "4-8 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 25, social: 15, music: 15, browsing: 20, gaming: 0, cloudSync: 10, wifiMultiplier: 2.0 },
  office_building: { name: "Office Building", description: "Commercial", avgDwell: "8+ hrs", sdVideo: 5, hdVideo: 5, videoCalls: 20, social: 15, music: 15, browsing: 30, gaming: 0, cloudSync: 10, wifiMultiplier: 1.8 },
  custom: { name: "Custom Mix", description: "Set your own", avgDwell: "Varies", sdVideo: 15, hdVideo: 10, videoCalls: 10, social: 25, music: 15, browsing: 15, gaming: 5, cloudSync: 5, wifiMultiplier: 1.5 }
}

type ActivityKey = "sdVideo" | "hdVideo" | "videoCalls" | "social" | "music" | "browsing" | "gaming" | "cloudSync"

interface Props { isSubscribed?: boolean; showAllCalculators?: boolean }

export default function FullCalculator({ isSubscribed = false, showAllCalculators = false }: Props) {
  const [activeCalculator, setActiveCalculator] = useState('earnings')
  const [address, setAddress] = useState('')
  const [selectedVenue, setSelectedVenue] = useState('cafe_coffee')
  const [customMix, setCustomMix] = useState({ sdVideo: 15, hdVideo: 10, videoCalls: 10, social: 25, music: 15, browsing: 15, gaming: 5, cloudSync: 5 })
  const [calcSquareFootage, setCalcSquareFootage] = useState(2500)
  const [calcFootTraffic, setCalcFootTraffic] = useState(500)
  const [calcHoursOpen, setCalcHoursOpen] = useState(12)
  const [calcDaysOpen, setCalcDaysOpen] = useState(26)
  const [insideAdoption, setInsideAdoption] = useState(35)
  const [wifiFreedomMultiplier, setWifiFreedomMultiplier] = useState(1.5)
  const [ratePerGB, setRatePerGB] = useState(0.50)
  const [dataPerHourGB, setDataPerHourGB] = useState(0)

  const calculators = [
    { id: 'earnings', label: 'WiFi Earnings', icon: DollarSign, color: 'text-green-400', free: true },
    { id: 'trade-area', label: 'Trade Area', icon: MapPin, color: 'text-blue-400', free: false },
    { id: 'competitor', label: 'Competitor', icon: Target, color: 'text-orange-400', free: false },
    { id: 'peak-hours', label: 'Peak Hours', icon: Clock, color: 'text-purple-400', free: false },
    { id: 'demographics', label: 'Demographics', icon: Users, color: 'text-cyan-400', free: false },
    { id: 'venue-score', label: 'Venue Score', icon: Building2, color: 'text-yellow-400', free: false },
  ]

  const isAvailable = (id: string) => showAllCalculators || calculators.find(c => c.id === id)?.free || isSubscribed

  useEffect(() => {
    if (selectedVenue !== 'custom' && VENUE_PROFILES[selectedVenue]) {
      setWifiFreedomMultiplier(VENUE_PROFILES[selectedVenue].wifiMultiplier)
    }
  }, [selectedVenue])

  const getCurrentMix = () => {
    if (selectedVenue === 'custom') return customMix
    const p = VENUE_PROFILES[selectedVenue]
    return p ? { sdVideo: p.sdVideo, hdVideo: p.hdVideo, videoCalls: p.videoCalls, social: p.social, music: p.music, browsing: p.browsing, gaming: p.gaming, cloudSync: p.cloudSync } : customMix
  }

  useEffect(() => {
    const mix = getCurrentMix()
    const base = (mix.sdVideo/100)*DATA_RATES_GB.sdVideo + (mix.hdVideo/100)*DATA_RATES_GB.hdVideo + (mix.videoCalls/100)*DATA_RATES_GB.videoCalls + (mix.social/100)*DATA_RATES_GB.social + (mix.music/100)*DATA_RATES_GB.music + (mix.browsing/100)*DATA_RATES_GB.browsing + (mix.gaming/100)*DATA_RATES_GB.gaming + (mix.cloudSync/100)*DATA_RATES_GB.cloudSync
    setDataPerHourGB(base * wifiFreedomMultiplier)
  }, [selectedVenue, customMix, wifiFreedomMultiplier])

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

      {activeCalculator === 'earnings' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-5">
              <h3 className="text-base font-semibold text-[#0EA5E9] mb-4">📍 Location</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-2">Address</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter address..." className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]" />
                </div>
                <div>
                  <label className="flex justify-between text-sm text-[#94A3B8] mb-2"><span>Square Footage</span><span className="text-white font-medium">{calcSquareFootage.toLocaleString()} sq ft</span></label>
                  <input type="range" min="500" max="50000" step="100" value={calcSquareFootage} onChange={e => setCalcSquareFootage(Number(e.target.value))} className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer accent-[#0EA5E9]" />
                </div>
                <div>
                  <label className="flex justify-between text-sm text-[#94A3B8] mb-2"><span>Daily Foot Traffic</span><span className="text-white font-medium">{calcFootTraffic.toLocaleString()}</span></label>
                  <input type="range" min="50" max="10000" step="50" value={calcFootTraffic} onChange={e => setCalcFootTraffic(Number(e.target.value))} className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer accent-[#0EA5E9]" />
                </div>
              </div>
            </div>
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-5">
              <h3 className="text-base font-semibold text-[#0EA5E9] mb-4">🏢 Venue Type</h3>
              <select value={selectedVenue} onChange={e => setSelectedVenue(e.target.value)} className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] mb-3">
                {Object.entries(VENUE_CATEGORIES).map(([cat, ids]) => (
                  <optgroup key={cat} label={cat}>{ids.map(id => <option key={id} value={id}>{VENUE_PROFILES[id]?.name || id}</option>)}</optgroup>
                ))}
              </select>
              {VENUE_PROFILES[selectedVenue] && (
                <div className="bg-[#0A0F2C] rounded-lg p-3 border border-[#2D3B5F]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-white font-medium text-sm">{VENUE_PROFILES[selectedVenue].name}</div>
                    <span className="px-2 py-0.5 bg-[#1A1F3A] rounded text-xs text-[#94A3B8]">{VENUE_PROFILES[selectedVenue].avgDwell}</span>
                  </div>
                  <div className="text-[#64748B] text-xs mb-2">{VENUE_PROFILES[selectedVenue].description}</div>
                  <div className="text-xs"><span className="text-[#64748B]">WiFi Multiplier:</span><span className="text-[#10F981] ml-2 font-semibold">{VENUE_PROFILES[selectedVenue].wifiMultiplier}x</span></div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-5">
              <h3 className="text-base font-semibold text-[#0EA5E9] mb-4">📶 WiFi Parameters</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex justify-between text-sm text-[#94A3B8] mb-2"><span>WiFi Adoption</span><span className="text-[#10F981] font-medium">{insideAdoption}%</span></label>
                  <input type="range" min="10" max="80" step="5" value={insideAdoption} onChange={e => setInsideAdoption(Number(e.target.value))} className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer accent-[#10F981]" />
                </div>
                <div>
                  <label className="flex justify-between text-sm text-[#94A3B8] mb-2"><span>WiFi Freedom Multiplier</span><span className="text-[#10F981] font-medium">{wifiFreedomMultiplier.toFixed(1)}x</span></label>
                  <input type="range" min="1.0" max="2.5" step="0.1" value={wifiFreedomMultiplier} onChange={e => setWifiFreedomMultiplier(Number(e.target.value))} className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer accent-[#10F981]" />
                  <p className="text-xs text-[#64748B] mt-1">Users consume more data on free WiFi</p>
                </div>
                <div>
                  <label className="flex justify-between text-sm text-[#94A3B8] mb-2"><span>Hours Open/Day</span><span className="text-white font-medium">{calcHoursOpen}</span></label>
                  <input type="range" min="4" max="24" value={calcHoursOpen} onChange={e => setCalcHoursOpen(Number(e.target.value))} className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer accent-[#0EA5E9]" />
                </div>
                <div>
                  <label className="flex justify-between text-sm text-[#94A3B8] mb-2"><span>Days Open/Month</span><span className="text-white font-medium">{calcDaysOpen}</span></label>
                  <input type="range" min="15" max="31" value={calcDaysOpen} onChange={e => setCalcDaysOpen(Number(e.target.value))} className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer accent-[#0EA5E9]" />
                </div>
                <div>
                  <label className="flex justify-between text-sm text-[#94A3B8] mb-2"><span>Rate Per GB</span><span className="text-[#10F981] font-medium">${ratePerGB.toFixed(2)}</span></label>
                  <input type="range" min="0.10" max="1.00" step="0.05" value={ratePerGB} onChange={e => setRatePerGB(Number(e.target.value))} className="w-full h-2 bg-[#2D3B5F] rounded-lg cursor-pointer accent-[#10F981]" />
                </div>
              </div>
            </div>
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-5">
              <h3 className="text-base font-semibold text-[#0EA5E9] mb-3">📊 Activity Mix</h3>
              <p className="text-xs text-[#64748B] mb-4">Based on {VENUE_PROFILES[selectedVenue]?.name}</p>
              <div className="space-y-2">
                {Object.entries(ACTIVITY_TYPES).map(([key, act]) => {
                  const val = selectedVenue === 'custom' ? customMix[key as ActivityKey] : (VENUE_PROFILES[selectedVenue]?.[key as keyof VenueProfile] as number ?? 0)
                  return (
                    <div key={key}>
                      <div className="flex justify-between mb-1"><span className="text-xs text-[#94A3B8]">{act.icon} {act.label}</span><span className="text-xs text-white font-medium">{val}%</span></div>
                      <div className="h-1.5 bg-[#2D3B5F] rounded-full overflow-hidden"><div style={{ width: `${val}%`, backgroundColor: act.color }} className="h-full" /></div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-[#1A1F3A] border-2 border-[#0EA5E9] rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">📈 Earnings Estimate</h3>
              <div className="bg-[#0A0F2C] rounded-lg p-4 mb-4 text-center">
                <div className="text-4xl font-bold text-[#0EA5E9] mb-1">{dataPerHourGB.toFixed(2)}</div>
                <div className="text-sm text-[#94A3B8]">GB/hr per WiFi user</div>
              </div>
              {(() => {
                const users = Math.round(calcFootTraffic * (insideAdoption / 100))
                const dailyGB = users * dataPerHourGB * 0.75
                const monthlyGB = dailyGB * calcDaysOpen
                const monthly = monthlyGB * ratePerGB
                const yearly = monthly * 12
                return (
                  <>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl p-4 mb-4 border border-green-500/30">
                      <div className="text-green-300 text-sm mb-1">Monthly Earnings</div>
                      <div className="text-3xl font-bold text-green-400">${monthly.toFixed(0)}</div>
                    </div>
                    <div className="bg-[#0A0F2C] rounded-lg p-4 mb-4">
                      <div className="text-[#94A3B8] text-sm mb-1">Yearly Earnings</div>
                      <div className="text-2xl font-bold text-[#0EA5E9]">${yearly.toFixed(0)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#0A0F2C] rounded-lg p-3"><div className="text-[#64748B] text-xs mb-1">Users/Day</div><div className="text-lg font-semibold text-white">{users.toLocaleString()}</div></div>
                      <div className="bg-[#0A0F2C] rounded-lg p-3"><div className="text-[#64748B] text-xs mb-1">Data/Month</div><div className="text-lg font-semibold text-white">{monthlyGB.toFixed(0)} GB</div></div>
                    </div>
                    <div className="bg-[#0A0F2C] rounded-lg p-3 text-xs space-y-1">
                      <div className="flex justify-between"><span className="text-[#64748B]">Daily visitors:</span><span className="text-white">{calcFootTraffic.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-[#64748B]">WiFi adoption:</span><span className="text-white">{insideAdoption}%</span></div>
                      <div className="flex justify-between"><span className="text-[#64748B]">Connected users:</span><span className="text-white">{users}</span></div>
                      <div className="flex justify-between border-t border-[#2D3B5F] pt-1 mt-1"><span className="text-[#94A3B8]">× ${ratePerGB.toFixed(2)}/GB:</span><span className="text-green-400 font-medium">${monthly.toFixed(0)}/mo</span></div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {activeCalculator === 'trade-area' && (
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative">
          {!isAvailable('trade-area') && <LockedOverlay />}
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-400" />Trade Area Analyzer</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
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
          <div className="grid grid-cols-7 gap-2 mb-4">
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
