"use client"

import { useState, useEffect } from "react"

// Data rates in GB/hr per activity type (expanded to 8 categories)
const DATA_RATES_GB: Record<string, number> = {
  sdVideo: 0.7,      // SD streaming (480p YouTube, TikTok, etc.)
  hdVideo: 3.0,      // HD/4K streaming (Netflix HD, YouTube 1080p+)
  videoCalls: 1.5,   // Zoom, FaceTime, Teams
  social: 0.15,      // Scrolling feeds, photos, Stories
  music: 0.075,      // Spotify, Apple Music, podcasts
  browsing: 0.05,    // Email, news, shopping
  gaming: 0.15,      // Mobile games (cloud gaming would be higher)
  cloudSync: 0.3     // iCloud, Google Drive, photo backups, uploads
}

// Activity type metadata for UI
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

// Venue categories for organized dropdown
const VENUE_CATEGORIES: Record<string, string[]> = {
  "Food & Beverage": ["restaurant_fastfood", "restaurant_sitdown", "cafe_coffee", "bar", "nightclub"],
  "Retail": ["convenience_gas", "convenience_nogas", "grocery", "retail_small", "retail_bigbox", "mall"],
  "Residential": ["apartment_single", "apartment_midrise", "apartment_highrise", "condo_single", "condo_midrise", "condo_highrise", "student_housing"],
  "Hospitality": ["hotel_single", "hotel_midrise", "hotel_highrise"],
  "Services": ["hair_salon", "pet_groomer", "medical_office", "animal_hospital", "daycare"],
  "Education": ["college", "school_k5", "school_middle", "school_high"],
  "Recreation & Entertainment": ["dog_park", "stadium", "museum", "library"],
  "Transportation": ["airport"],
  "Workspace": ["coworking"],
  "Custom": ["custom"]
}

// Venue profile type
interface VenueProfile {
  name: string
  description: string
  avgDwell: string
  sdVideo: number
  hdVideo: number
  videoCalls: number
  social: number
  music: number
  browsing: number
  gaming: number
  cloudSync: number
  wifiMultiplier: number
}

// Venue profiles with activity mix defaults (8 activities, must sum to 100)
const VENUE_PROFILES: Record<string, VenueProfile> = {
  // Food & Beverage
  restaurant_fastfood: { name: "Fast Food Restaurant", description: "Quick service, drive-thru", avgDwell: "15-25 min", sdVideo: 10, hdVideo: 0, videoCalls: 0, social: 45, music: 25, browsing: 15, gaming: 5, cloudSync: 0, wifiMultiplier: 1.3 },
  restaurant_sitdown: { name: "Sit-Down Restaurant", description: "Casual & fine dining", avgDwell: "45-90 min", sdVideo: 15, hdVideo: 5, videoCalls: 0, social: 40, music: 20, browsing: 15, gaming: 3, cloudSync: 2, wifiMultiplier: 1.5 },
  cafe_coffee: { name: "Café / Coffee Shop", description: "Coffee shops, bakeries", avgDwell: "30-60 min", sdVideo: 15, hdVideo: 5, videoCalls: 10, social: 30, music: 15, browsing: 20, gaming: 3, cloudSync: 2, wifiMultiplier: 1.6 },
  bar: { name: "Bar", description: "Sports bars, pubs, lounges", avgDwell: "60-120 min", sdVideo: 20, hdVideo: 10, videoCalls: 0, social: 40, music: 15, browsing: 10, gaming: 5, cloudSync: 0, wifiMultiplier: 1.5 },
  nightclub: { name: "Nightclub", description: "Dance clubs, venues", avgDwell: "2-4 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 0, social: 55, music: 15, browsing: 5, gaming: 5, cloudSync: 5, wifiMultiplier: 1.4 },
  
  // Retail
  convenience_gas: { name: "Convenience Store (w/ Gas)", description: "Gas stations with stores", avgDwell: "5-10 min", sdVideo: 0, hdVideo: 0, videoCalls: 0, social: 35, music: 40, browsing: 20, gaming: 5, cloudSync: 0, wifiMultiplier: 1.2 },
  convenience_nogas: { name: "Convenience Store (w/o Gas)", description: "Standalone convenience stores", avgDwell: "5-15 min", sdVideo: 0, hdVideo: 0, videoCalls: 0, social: 40, music: 35, browsing: 20, gaming: 5, cloudSync: 0, wifiMultiplier: 1.2 },
  grocery: { name: "Grocery Store", description: "Supermarkets, grocery chains", avgDwell: "20-45 min", sdVideo: 5, hdVideo: 0, videoCalls: 5, social: 30, music: 35, browsing: 20, gaming: 0, cloudSync: 5, wifiMultiplier: 1.3 },
  retail_small: { name: "Retail Store", description: "Boutiques, specialty stores", avgDwell: "15-30 min", sdVideo: 5, hdVideo: 0, videoCalls: 0, social: 45, music: 30, browsing: 15, gaming: 5, cloudSync: 0, wifiMultiplier: 1.3 },
  retail_bigbox: { name: "Big Box Retail", description: "Target, Walmart, Costco", avgDwell: "30-60 min", sdVideo: 5, hdVideo: 0, videoCalls: 5, social: 35, music: 30, browsing: 20, gaming: 0, cloudSync: 5, wifiMultiplier: 1.3 },
  mall: { name: "Shopping Mall", description: "Indoor malls, outlets", avgDwell: "1-3 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 5, social: 40, music: 20, browsing: 15, gaming: 3, cloudSync: 2, wifiMultiplier: 1.5 },
  
  // Residential
  apartment_single: { name: "Apartment (Single Level)", description: "Garden-style apartments", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  apartment_midrise: { name: "Apartment (Midrise)", description: "4-12 story apartments", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  apartment_highrise: { name: "Apartment (Highrise)", description: "12+ story apartments", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  condo_single: { name: "Condo (Single Level)", description: "Townhomes, garden condos", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  condo_midrise: { name: "Condo (Midrise)", description: "4-12 story condos", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  condo_highrise: { name: "Condo (Highrise)", description: "12+ story condos", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 20, music: 10, browsing: 10, gaming: 10, cloudSync: 5, wifiMultiplier: 2.0 },
  student_housing: { name: "Student Housing", description: "Dorms, off-campus housing", avgDwell: "Resident", sdVideo: 20, hdVideo: 15, videoCalls: 10, social: 25, music: 10, browsing: 5, gaming: 10, cloudSync: 5, wifiMultiplier: 2.2 },
  
  // Hospitality
  hotel_single: { name: "Hotel (Single Level)", description: "Motels, budget hotels", avgDwell: "1-3 nights", sdVideo: 25, hdVideo: 20, videoCalls: 10, social: 15, music: 10, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 2.0 },
  hotel_midrise: { name: "Hotel (Midrise)", description: "Business hotels, mid-tier", avgDwell: "1-3 nights", sdVideo: 20, hdVideo: 20, videoCalls: 15, social: 15, music: 10, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 2.2 },
  hotel_highrise: { name: "Hotel (Highrise)", description: "Full-service, luxury hotels", avgDwell: "1-5 nights", sdVideo: 20, hdVideo: 20, videoCalls: 15, social: 15, music: 10, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 2.3 },
  
  // Services
  hair_salon: { name: "Hair Salon", description: "Salons, barbershops, spas", avgDwell: "45-90 min", sdVideo: 25, hdVideo: 5, videoCalls: 0, social: 40, music: 15, browsing: 10, gaming: 5, cloudSync: 0, wifiMultiplier: 1.5 },
  pet_groomer: { name: "Pet Groomer", description: "Pet grooming services", avgDwell: "30-60 min (waiting)", sdVideo: 20, hdVideo: 5, videoCalls: 5, social: 35, music: 20, browsing: 10, gaming: 5, cloudSync: 0, wifiMultiplier: 1.5 },
  medical_office: { name: "Medical Office", description: "Clinics, doctor offices", avgDwell: "30-60 min", sdVideo: 15, hdVideo: 0, videoCalls: 5, social: 35, music: 20, browsing: 20, gaming: 5, cloudSync: 0, wifiMultiplier: 1.4 },
  animal_hospital: { name: "Animal Hospital", description: "Vet clinics, emergency vet", avgDwell: "30-90 min", sdVideo: 15, hdVideo: 5, videoCalls: 5, social: 35, music: 20, browsing: 15, gaming: 5, cloudSync: 0, wifiMultiplier: 1.4 },
  daycare: { name: "Daycare", description: "Childcare centers", avgDwell: "5-15 min (drop-off)", sdVideo: 5, hdVideo: 0, videoCalls: 5, social: 40, music: 25, browsing: 20, gaming: 0, cloudSync: 5, wifiMultiplier: 1.2 },
  
  // Education
  college: { name: "College/University", description: "Higher education campuses", avgDwell: "2-8 hrs", sdVideo: 15, hdVideo: 10, videoCalls: 15, social: 25, music: 10, browsing: 15, gaming: 5, cloudSync: 5, wifiMultiplier: 2.0 },
  school_k5: { name: "School (K-5)", description: "Elementary schools", avgDwell: "Staff/Parent: 15-30 min", sdVideo: 5, hdVideo: 0, videoCalls: 5, social: 35, music: 25, browsing: 25, gaming: 0, cloudSync: 5, wifiMultiplier: 1.3 },
  school_middle: { name: "School (6-8)", description: "Middle schools", avgDwell: "Staff/Parent: 15-30 min", sdVideo: 10, hdVideo: 5, videoCalls: 5, social: 40, music: 20, browsing: 15, gaming: 5, cloudSync: 0, wifiMultiplier: 1.4 },
  school_high: { name: "School (9-12)", description: "High schools", avgDwell: "Staff/Parent: 15-30 min", sdVideo: 15, hdVideo: 5, videoCalls: 5, social: 40, music: 15, browsing: 10, gaming: 10, cloudSync: 0, wifiMultiplier: 1.5 },
  
  // Recreation & Entertainment
  dog_park: { name: "Dog Park", description: "Off-leash parks", avgDwell: "30-60 min", sdVideo: 10, hdVideo: 0, videoCalls: 10, social: 40, music: 25, browsing: 10, gaming: 0, cloudSync: 5, wifiMultiplier: 1.3 },
  stadium: { name: "Stadium/Arena", description: "Sports venues, concert halls", avgDwell: "2-4 hrs", sdVideo: 15, hdVideo: 5, videoCalls: 5, social: 50, music: 5, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 1.5 },
  museum: { name: "Museum", description: "Art, history, science museums", avgDwell: "1-3 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 0, social: 40, music: 15, browsing: 25, gaming: 0, cloudSync: 5, wifiMultiplier: 1.4 },
  library: { name: "Library", description: "Public & university libraries", avgDwell: "1-4 hrs", sdVideo: 15, hdVideo: 10, videoCalls: 5, social: 20, music: 15, browsing: 30, gaming: 0, cloudSync: 5, wifiMultiplier: 1.8 },
  
  // Transportation
  airport: { name: "Airport", description: "Terminals, lounges", avgDwell: "1-4 hrs", sdVideo: 20, hdVideo: 15, videoCalls: 15, social: 20, music: 10, browsing: 10, gaming: 5, cloudSync: 5, wifiMultiplier: 2.3 },
  
  // Workspace
  coworking: { name: "Co-Working Space", description: "Shared offices, WeWork", avgDwell: "4-8 hrs", sdVideo: 10, hdVideo: 5, videoCalls: 25, social: 15, music: 15, browsing: 20, gaming: 0, cloudSync: 10, wifiMultiplier: 2.0 },
  
  // Custom
  custom: { name: "Custom Mix", description: "Set your own percentages", avgDwell: "Varies", sdVideo: 15, hdVideo: 10, videoCalls: 10, social: 25, music: 15, browsing: 15, gaming: 5, cloudSync: 5, wifiMultiplier: 1.5 }
}

type ProfileKey = keyof typeof VENUE_PROFILES
type ActivityKey = "sdVideo" | "hdVideo" | "videoCalls" | "social" | "music" | "browsing" | "gaming" | "cloudSync"

export default function CalculatorPage() {
  // Location inputs
  const [address, setAddress] = useState("")
  const [nearbyRadius, setNearbyRadius] = useState(200)
  const [analysisPeriod, setAnalysisPeriod] = useState(90)
  
  // WiFi parameters
  const [insideAdoption, setInsideAdoption] = useState(35)
  const [nearbyAdoption, setNearbyAdoption] = useState(17.5)
  const [wifiFreedomMultiplier, setWifiFreedomMultiplier] = useState(1.5)
  
  // Venue profile
  const [selectedVenue, setSelectedVenue] = useState<ProfileKey>("hair_salon")
  const [customMix, setCustomMix] = useState({
    sdVideo: 15, hdVideo: 10, videoCalls: 10, social: 25, music: 15, browsing: 15, gaming: 5, cloudSync: 5
  })
  
  // Earnings rate
  const [ratePerGB, setRatePerGB] = useState(0.50)
  
  // Calculated values (in GB)
  const [dataPerHourGB, setDataPerHourGB] = useState(0)
  
  // Update WiFi multiplier when venue changes
  useEffect(() => {
    if (selectedVenue !== "custom") {
      setWifiFreedomMultiplier(VENUE_PROFILES[selectedVenue].wifiMultiplier)
    }
  }, [selectedVenue])
  
  // Get current activity mix based on venue selection
  const getCurrentMix = () => {
    if (selectedVenue === "custom") return customMix
    const profile = VENUE_PROFILES[selectedVenue]
    return {
      sdVideo: profile.sdVideo, hdVideo: profile.hdVideo, videoCalls: profile.videoCalls,
      social: profile.social, music: profile.music, browsing: profile.browsing,
      gaming: profile.gaming, cloudSync: profile.cloudSync
    }
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
  
  // Check if custom mix totals 100%
  const customTotal = Object.values(customMix).reduce((a, b) => a + b, 0)
  const isCustomValid = customTotal === 100
  
  // Update custom mix value
  const updateCustomMix = (key: ActivityKey, value: number) => {
    setCustomMix(prev => ({ ...prev, [key]: value }))
  }

  // Handle form submission
  const handleAnalyze = async () => {
    if (!address.trim()) { alert("Please enter an address"); return }
    if (selectedVenue === "custom" && !isCustomValid) { alert("Custom activity mix must total 100%"); return }
    console.log("Analyzing:", { address, nearbyRadius, analysisPeriod, insideAdoption, nearbyAdoption, wifiFreedomMultiplier, venueType: selectedVenue, activityMix: getCurrentMix(), ratePerGB, dataPerHourGB })
    alert("Analysis would run here once Placer.ai API is connected!")
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", color: "#FFFFFF", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <nav style={{ backgroundColor: "#1A1F3A", borderBottom: "1px solid #2D3B5F", padding: "16px 24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)", borderRadius: "8px" }}></div>
            <span style={{ fontSize: "20px", fontWeight: "bold" }}>Location Intelligence Calculator</span>
          </div>
          <a href="/dashboard" style={{ padding: "8px 16px", color: "#94A3B8", border: "1px solid #2D3B5F", borderRadius: "6px", textDecoration: "none", fontSize: "14px" }}>← Back to Dashboard</a>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "32px" }}>
          {/* Left Column - Inputs */}
          <div>
            {/* Location Section */}
            <div style={{ backgroundColor: "#1A1F3A", border: "1px solid #2D3B5F", borderRadius: "16px", padding: "28px", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "24px", color: "#0EA5E9" }}>📍 Location Parameters</h2>
              
              {/* Address Input */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94A3B8" }}>Property Address *</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address (e.g., 123 Main St, Dallas, TX)" style={{ width: "100%", padding: "14px 16px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", borderRadius: "8px", color: "#FFFFFF", fontSize: "15px", outline: "none", boxSizing: "border-box" }} />
              </div>
              
              {/* Nearby Radius Slider */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label style={{ fontSize: "14px", color: "#94A3B8" }}>Nearby Radius</label>
                  <span style={{ fontSize: "14px", color: "#0EA5E9", fontWeight: "600" }}>{nearbyRadius} ft</span>
                </div>
                <input type="range" min="50" max="500" step="25" value={nearbyRadius} onChange={(e) => setNearbyRadius(Number(e.target.value))} style={{ width: "100%", accentColor: "#0EA5E9" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B", marginTop: "4px" }}><span>50 ft</span><span>500 ft</span></div>
              </div>
              
              {/* Analysis Period */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#94A3B8" }}>Analysis Period</label>
                <select value={analysisPeriod} onChange={(e) => setAnalysisPeriod(Number(e.target.value))} style={{ width: "100%", padding: "14px 16px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", borderRadius: "8px", color: "#FFFFFF", fontSize: "15px", outline: "none" }}>
                  <option value={30}>Last 30 days</option>
                  <option value={60}>Last 60 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>
            </div>

            {/* Venue Type Section */}
            <div style={{ backgroundColor: "#1A1F3A", border: "1px solid #2D3B5F", borderRadius: "16px", padding: "28px", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px", color: "#0EA5E9" }}>🏢 Venue Type</h2>
              <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>Select your venue type. This sets typical visitor behavior and WiFi usage patterns.</p>
              
              {/* Venue Type Dropdown */}
              <select value={selectedVenue} onChange={(e) => setSelectedVenue(e.target.value as ProfileKey)} style={{ width: "100%", padding: "14px 16px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", borderRadius: "8px", color: "#FFFFFF", fontSize: "15px", outline: "none", marginBottom: "16px" }}>
                {Object.entries(VENUE_CATEGORIES).map(([category, venues]) => (
                  <optgroup key={category} label={category}>
                    {venues.map(venueKey => (<option key={venueKey} value={venueKey}>{VENUE_PROFILES[venueKey].name}</option>))}
                  </optgroup>
                ))}
              </select>
              
              {/* Venue Info Card */}
              {selectedVenue && VENUE_PROFILES[selectedVenue] && (
                <div style={{ backgroundColor: "#0A0F2C", borderRadius: "12px", padding: "16px", border: "1px solid #2D3B5F" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "600", color: "#FFFFFF" }}>{VENUE_PROFILES[selectedVenue].name}</div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{VENUE_PROFILES[selectedVenue].description}</div>
                    </div>
                    <div style={{ padding: "4px 12px", backgroundColor: "#1A1F3A", borderRadius: "20px", fontSize: "12px", color: "#94A3B8" }}>{VENUE_PROFILES[selectedVenue].avgDwell}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                    <span style={{ color: "#64748B" }}>Default WiFi Multiplier:</span>
                    <span style={{ color: "#10F981", fontWeight: "600" }}>{VENUE_PROFILES[selectedVenue].wifiMultiplier}x</span>
                  </div>
                </div>
              )}
            </div>

            {/* WiFi Parameters Section */}
            <div style={{ backgroundColor: "#1A1F3A", border: "1px solid #2D3B5F", borderRadius: "16px", padding: "28px", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "24px", color: "#0EA5E9" }}>📶 WiFi Usage Parameters</h2>
              
              {/* Inside WiFi Adoption */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label style={{ fontSize: "14px", color: "#94A3B8" }}>Inside WiFi Adoption Rate</label>
                  <span style={{ fontSize: "14px", color: "#10F981", fontWeight: "600" }}>{insideAdoption}%</span>
                </div>
                <input type="range" min="10" max="80" step="5" value={insideAdoption} onChange={(e) => setInsideAdoption(Number(e.target.value))} style={{ width: "100%", accentColor: "#10F981" }} />
                <p style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>% of visitors inside property who connect to WiFi</p>
              </div>
              
              {/* Nearby WiFi Adoption */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label style={{ fontSize: "14px", color: "#94A3B8" }}>Nearby WiFi Adoption Rate</label>
                  <span style={{ fontSize: "14px", color: "#10F981", fontWeight: "600" }}>{nearbyAdoption}%</span>
                </div>
                <input type="range" min="5" max="40" step="2.5" value={nearbyAdoption} onChange={(e) => setNearbyAdoption(Number(e.target.value))} style={{ width: "100%", accentColor: "#10F981" }} />
                <p style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>% of nearby foot traffic who connect to WiFi</p>
              </div>
              
              {/* WiFi Freedom Multiplier */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label style={{ fontSize: "14px", color: "#94A3B8" }}>WiFi Freedom Multiplier</label>
                  <span style={{ fontSize: "14px", color: "#10F981", fontWeight: "600" }}>{wifiFreedomMultiplier.toFixed(1)}x</span>
                </div>
                <input type="range" min="1.0" max="2.5" step="0.1" value={wifiFreedomMultiplier} onChange={(e) => setWifiFreedomMultiplier(Number(e.target.value))} style={{ width: "100%", accentColor: "#10F981" }} />
                <p style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>People use more data on free WiFi (1.0x = same as cellular, 2.5x = heavy increase)</p>
              </div>
            </div>

            {/* Activity Profile Section */}
            <div style={{ backgroundColor: "#1A1F3A", border: "1px solid #2D3B5F", borderRadius: "16px", padding: "28px", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px", color: "#0EA5E9" }}>📊 Activity Mix</h2>
              <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>
                {selectedVenue === "custom" ? "Set custom percentages for each activity type. Must total 100%." : `Based on typical ${VENUE_PROFILES[selectedVenue]?.name || "visitor"} behavior. Select "Custom Mix" to adjust.`}
              </p>
              
              <div style={{ backgroundColor: "#0A0F2C", borderRadius: "12px", padding: "20px", border: "1px solid #2D3B5F" }}>
                {selectedVenue === "custom" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", padding: "12px", backgroundColor: isCustomValid ? "rgba(16, 249, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", borderRadius: "8px", border: `1px solid ${isCustomValid ? "#10F981" : "#EF4444"}` }}>
                    <span style={{ fontSize: "14px", color: isCustomValid ? "#10F981" : "#EF4444" }}>{isCustomValid ? "✓ Mix is valid" : "⚠ Must total 100%"}</span>
                    <span style={{ fontSize: "16px", fontWeight: "600", color: isCustomValid ? "#10F981" : "#EF4444" }}>{customTotal}%</span>
                  </div>
                )}
                
                {/* Activity Items */}
                {Object.entries(ACTIVITY_TYPES).map(([key, activity]) => {
                  const mixKey = key as ActivityKey
                  const currentValue = selectedVenue === "custom" ? customMix[mixKey] : (VENUE_PROFILES[selectedVenue]?.[mixKey] ?? 0)
                  
                  return (
                    <div key={key} style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "13px", color: "#94A3B8" }}>{activity.icon} {activity.label} <span style={{ color: "#64748B", fontSize: "11px" }}>({activity.rate})</span></span>
                        <span style={{ fontSize: "13px", color: "#FFFFFF", fontWeight: "500" }}>{currentValue}%</span>
                      </div>
                      {selectedVenue === "custom" ? (
                        <input type="range" min="0" max="100" value={customMix[mixKey]} onChange={(e) => updateCustomMix(mixKey, Number(e.target.value))} style={{ width: "100%", accentColor: activity.color }} />
                      ) : (
                        <div style={{ height: "8px", backgroundColor: "#2D3B5F", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${currentValue}%`, height: "100%", backgroundColor: activity.color, transition: "width 0.3s ease" }}></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Earnings Rate */}
            <div style={{ backgroundColor: "#1A1F3A", border: "1px solid #2D3B5F", borderRadius: "16px", padding: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "24px", color: "#0EA5E9" }}>💰 Earnings Configuration</h2>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label style={{ fontSize: "14px", color: "#94A3B8" }}>Rate per GB</label>
                  <span style={{ fontSize: "14px", color: "#10F981", fontWeight: "600" }}>${ratePerGB.toFixed(2)}</span>
                </div>
                <input type="range" min="0.10" max="2.00" step="0.05" value={ratePerGB} onChange={(e) => setRatePerGB(Number(e.target.value))} style={{ width: "100%", accentColor: "#10F981" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B", marginTop: "4px" }}><span>$0.10</span><span>$2.00</span></div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Actions */}
          <div>
            <div style={{ backgroundColor: "#1A1F3A", border: "2px solid #0EA5E9", borderRadius: "16px", padding: "28px", position: "sticky", top: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "24px", color: "#FFFFFF" }}>📈 Estimate Preview</h2>
              
              {/* Data Rate Display - IN GB */}
              <div style={{ backgroundColor: "#0A0F2C", borderRadius: "12px", padding: "20px", marginBottom: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", fontWeight: "bold", color: "#0EA5E9", marginBottom: "4px" }}>{dataPerHourGB.toFixed(2)}</div>
                <div style={{ fontSize: "14px", color: "#94A3B8" }}>GB/hr per WiFi user</div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "8px" }}>Based on {VENUE_PROFILES[selectedVenue]?.name || "selected venue"}{wifiFreedomMultiplier !== 1.0 && ` × ${wifiFreedomMultiplier.toFixed(1)}x multiplier`}</div>
              </div>
              
              {/* Activity Mix Display */}
              <div style={{ backgroundColor: "#0A0F2C", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "14px", color: "#94A3B8", marginBottom: "16px", textAlign: "center" }}>Activity Mix</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                  {(() => {
                    const mix = getCurrentMix()
                    return Object.entries(ACTIVITY_TYPES).filter(([key]) => mix[key as ActivityKey] > 0).map(([key, activity]) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", backgroundColor: "#1A1F3A", borderRadius: "20px", fontSize: "11px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: activity.color }}></div>
                        <span style={{ color: "#94A3B8" }}>{activity.label}</span>
                        <span style={{ color: "#FFFFFF", fontWeight: "600" }}>{mix[key as ActivityKey]}%</span>
                      </div>
                    ))
                  })()}
                </div>
              </div>
              
              {/* Configuration Summary */}
              <div style={{ backgroundColor: "#0A0F2C", borderRadius: "12px", padding: "16px", marginBottom: "24px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ color: "#64748B" }}>Venue Type</span><span style={{ color: "#FFFFFF" }}>{VENUE_PROFILES[selectedVenue]?.name || "—"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ color: "#64748B" }}>Nearby Radius</span><span style={{ color: "#FFFFFF" }}>{nearbyRadius} ft</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ color: "#64748B" }}>Inside Adoption</span><span style={{ color: "#FFFFFF" }}>{insideAdoption}%</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ color: "#64748B" }}>Nearby Adoption</span><span style={{ color: "#FFFFFF" }}>{nearbyAdoption}%</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ color: "#64748B" }}>WiFi Multiplier</span><span style={{ color: "#FFFFFF" }}>{wifiFreedomMultiplier.toFixed(1)}x</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B" }}>Rate per GB</span><span style={{ color: "#10F981" }}>${ratePerGB.toFixed(2)}</span></div>
              </div>
              
              {/* Analyze Button */}
              <button onClick={handleAnalyze} disabled={!address.trim() || (selectedVenue === "custom" && !isCustomValid)} style={{ width: "100%", padding: "16px", background: address.trim() && (selectedVenue !== "custom" || isCustomValid) ? "linear-gradient(135deg, #10F981 0%, #00FF66 100%)" : "#2D3B5F", color: address.trim() && (selectedVenue !== "custom" || isCustomValid) ? "#0A0F2C" : "#64748B", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "bold", cursor: address.trim() && (selectedVenue !== "custom" || isCustomValid) ? "pointer" : "not-allowed", marginBottom: "16px" }}>🔍 Analyze Location</button>
              
              {/* Subscription Info */}
              <div style={{ padding: "12px", backgroundColor: "rgba(14, 165, 233, 0.1)", borderRadius: "8px", border: "1px solid rgba(14, 165, 233, 0.2)", fontSize: "12px", color: "#94A3B8", textAlign: "center" }}>
                <strong style={{ color: "#0EA5E9" }}>Basic Plan:</strong> $49/mo includes 100 reports<br /><span style={{ fontSize: "11px" }}>Additional reports: $1 each</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}