// Default dropdown options for Location Partner Onboarding
// These are admin-editable via the pipeline backend

import { DropdownConfig } from './pipeline-types'

export const defaultDropdowns: DropdownConfig[] = [
  // ============================================
  // VENUE TYPES
  // ============================================
  {
    id: 'dropdown_venue_types',
    key: 'venue_types',
    name: 'Venue Types',
    allowCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: 'amusement_park', label: 'Amusement Park', isActive: true, order: 1 },
      { value: 'aquarium', label: 'Aquarium', isActive: true, order: 2 },
      { value: 'attorney_office', label: 'Attorney Office', isActive: true, order: 3 },
      { value: 'automotive_service', label: 'Automotive Service Station', isActive: true, order: 4 },
      { value: 'bank', label: 'Bank', isActive: true, order: 5 },
      { value: 'bar', label: 'Bar', isActive: true, order: 6 },
      { value: 'boarding_house', label: 'Boarding House', isActive: true, order: 7 },
      { value: 'bus_stop', label: 'Bus Stop', isActive: true, order: 8 },
      { value: 'coffee_shop', label: 'Coffee Shop', isActive: true, order: 9 },
      { value: 'college', label: 'College', isActive: true, order: 10 },
      { value: 'convention_center', label: 'Convention Center', isActive: true, order: 11 },
      { value: 'dentist', label: 'Dentist', isActive: true, order: 12 },
      { value: 'doctor', label: 'Doctor', isActive: true, order: 13 },
      { value: 'emergency_center', label: 'Emergency Coordination Center', isActive: true, order: 14 },
      { value: 'factory', label: 'Factory', isActive: true, order: 15 },
      { value: 'gas_station', label: 'Gas Station', isActive: true, order: 16 },
      { value: 'grocery_market', label: 'Grocery Market', isActive: true, order: 17 },
      { value: 'group_home', label: 'Group Home', isActive: true, order: 18 },
      { value: 'hospital', label: 'Hospital', isActive: true, order: 19 },
      { value: 'hotel', label: 'Hotel', isActive: true, order: 20 },
      { value: 'kiosk', label: 'Kiosk', isActive: true, order: 21 },
      { value: 'library', label: 'Library', isActive: true, order: 22 },
      { value: 'long_term_care', label: 'Long-term Care Facility', isActive: true, order: 23 },
      { value: 'motel', label: 'Motel', isActive: true, order: 24 },
      { value: 'museum', label: 'Museum', isActive: true, order: 25 },
      { value: 'passenger_terminal', label: 'Passenger Terminal', isActive: true, order: 26 },
      { value: 'park', label: 'Park', isActive: true, order: 27 },
      { value: 'place_of_worship', label: 'Place of Worship', isActive: true, order: 28 },
      { value: 'police_station', label: 'Police Station', isActive: true, order: 29 },
      { value: 'post_office', label: 'Post Office', isActive: true, order: 30 },
      { value: 'prison_jail', label: 'Prison or Jail', isActive: true, order: 31 },
      { value: 'professional_office', label: 'Professional Office', isActive: true, order: 32 },
      { value: 'rehab_center', label: 'Rehabilitation Center', isActive: true, order: 33 },
      { value: 'rest_area', label: 'Rest Area', isActive: true, order: 34 },
      { value: 'restaurant', label: 'Restaurant', isActive: true, order: 35 },
      { value: 'retail_store', label: 'Retail Store', isActive: true, order: 36 },
      { value: 'school', label: 'School', isActive: true, order: 37 },
      { value: 'shopping_mall', label: 'Shopping Mall', isActive: true, order: 38 },
      { value: 'stadium', label: 'Stadium', isActive: true, order: 39 },
      { value: 'theater', label: 'Theater', isActive: true, order: 40 },
      { value: 'university', label: 'University', isActive: true, order: 41 },
      { value: 'zoo_aquarium', label: 'Zoo or Aquarium', isActive: true, order: 42 },
    ],
  },

  // ============================================
  // ISP PROVIDERS
  // ============================================
  {
    id: 'dropdown_isps',
    key: 'isps',
    name: 'Internet Service Providers',
    allowCustom: true,  // Allow "Other" custom entry
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: 'alaska_communications', label: 'Alaska Communications', isActive: true, order: 1 },
      { value: 'allo_communications', label: 'Allo Communications', isActive: true, order: 2 },
      { value: 'att', label: 'AT&T', isActive: true, order: 3 },
      { value: 'astound_broadband', label: 'Astound Broadband (Wave, RCN)', isActive: true, order: 4 },
      { value: 'blue_ridge', label: 'Blue Ridge Communications', isActive: true, order: 5 },
      { value: 'breezeline', label: 'Breezeline (formerly Atlantic Broadband)', isActive: true, order: 6 },
      { value: 'brigham_net', label: 'Brigham Net', isActive: true, order: 7 },
      { value: 'broadband_vi', label: 'Broadband VI', isActive: true, order: 8 },
      { value: 'buckeye_broadband', label: 'Buckeye Broadband', isActive: true, order: 9 },
      { value: 'cable_one', label: 'Cable One', isActive: true, order: 10 },
      { value: 'chat_mobility', label: 'Chat Mobility', isActive: true, order: 11 },
      { value: 'centurylink', label: 'CenturyLink', isActive: true, order: 12 },
      { value: 'cincinnati_bell', label: 'Cincinnati Bell (altafiber)', isActive: true, order: 13 },
      { value: 'clearwave', label: 'Clearwave Communications', isActive: true, order: 14 },
      { value: 'community_fiber', label: 'Community Fiber Solutions', isActive: true, order: 15 },
      { value: 'consolidated', label: 'Consolidated Communications', isActive: true, order: 16 },
      { value: 'cox', label: 'Cox', isActive: true, order: 17 },
      { value: 'digitalpath', label: 'DigitalPath', isActive: true, order: 18 },
      { value: 'earthlink', label: 'EarthLink', isActive: true, order: 19 },
      { value: 'epb_fiber', label: 'EPB Fiber Optics', isActive: true, order: 20 },
      { value: 'fibersphere', label: 'Fibersphere Communications', isActive: true, order: 21 },
      { value: 'frontier', label: 'Frontier Communications', isActive: true, order: 22 },
      { value: 'google_fiber', label: 'Google Fiber', isActive: true, order: 23 },
      { value: 'grande', label: 'Grande Communications', isActive: true, order: 24 },
      { value: 'hargray', label: 'Hargray Communications', isActive: true, order: 25 },
      { value: 'hawaiian_telcom', label: 'Hawaiian Telcom', isActive: true, order: 26 },
      { value: 'hotwire', label: 'Hotwire Communications', isActive: true, order: 27 },
      { value: 'hughesnet', label: 'HughesNet', isActive: true, order: 28 },
      { value: 'kinetic_windstream', label: 'Kinetic by Windstream', isActive: true, order: 29 },
      { value: 'lumos', label: 'Lumos Networks', isActive: true, order: 30 },
      { value: 'mediacom', label: 'Mediacom', isActive: true, order: 31 },
      { value: 'mediastream', label: 'Mediastream', isActive: true, order: 32 },
      { value: 'metronet', label: 'MetroNet', isActive: true, order: 33 },
      { value: 'midco', label: 'Midco', isActive: true, order: 34 },
      { value: 'municipal_fiber', label: 'Municipal Fiber Networks', isActive: true, order: 35 },
      { value: 'nh_fastroads', label: 'New Hampshire FastRoads', isActive: true, order: 36 },
      { value: 'northstate', label: 'NorthState Communications', isActive: true, order: 37 },
      { value: 'optimum', label: 'Optimum (Altice USA)', isActive: true, order: 38 },
      { value: 'rcn', label: 'RCN', isActive: true, order: 39 },
      { value: 'rise_broadband', label: 'Rise Broadband', isActive: true, order: 40 },
      { value: 'riverstreet', label: 'RiverStreet Networks', isActive: true, order: 41 },
      { value: 'sonic', label: 'Sonic', isActive: true, order: 42 },
      { value: 'spectrum', label: 'Spectrum (Charter Communications)', isActive: true, order: 43 },
      { value: 'tmobile_home', label: 'T-Mobile Home Internet', isActive: true, order: 44 },
      { value: 'tds_telecom', label: 'TDS Telecom', isActive: true, order: 45 },
      { value: 'verizon_fios', label: 'Verizon Fios', isActive: true, order: 46 },
      { value: 'viasat', label: 'Viasat (Exede)', isActive: true, order: 47 },
      { value: 'windstream', label: 'Windstream', isActive: true, order: 48 },
      { value: 'xfinity', label: 'Xfinity', isActive: true, order: 49 },
      { value: 'ziply_fiber', label: 'Ziply Fiber', isActive: true, order: 50 },
      { value: 'other', label: 'Other', isActive: true, order: 99 },
    ],
  },

  // ============================================
  // CONNECTION TYPES
  // ============================================
  {
    id: 'dropdown_connection_types',
    key: 'connection_types',
    name: 'Connection Types',
    allowCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: 'fiber', label: 'Fiber', isActive: true, order: 1 },
      { value: 'cable', label: 'Cable', isActive: true, order: 2 },
      { value: 'dsl', label: 'DSL', isActive: true, order: 3 },
      { value: 'satellite', label: 'Satellite', isActive: true, order: 4 },
      { value: 'other', label: 'Other', isActive: true, order: 5 },
    ],
  },

  // ============================================
  // SERVICE CATEGORIES
  // ============================================
  {
    id: 'dropdown_service_categories',
    key: 'service_categories',
    name: 'Service Categories',
    allowCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: 'business_internet', label: 'Business Internet', isActive: true, order: 1 },
      { value: 'consumer_internet', label: 'Consumer Internet', isActive: true, order: 2 },
    ],
  },

  // ============================================
  // INTERNET SPEEDS
  // ============================================
  {
    id: 'dropdown_internet_speeds',
    key: 'internet_speeds',
    name: 'Internet Speeds',
    allowCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: '0_99_mbps', label: '0–99 Mbps', isActive: true, order: 1 },
      { value: '100_199_mbps', label: '100–199 Mbps', isActive: true, order: 2 },
      { value: '200_299_mbps', label: '200–299 Mbps', isActive: true, order: 3 },
      { value: '300_499_mbps', label: '300–499 Mbps', isActive: true, order: 4 },
      { value: '500_999_mbps', label: '500–999 Mbps', isActive: true, order: 5 },
      { value: '1_1_99_gbps', label: '1–1.99 Gbps', isActive: true, order: 6 },
      { value: '2_gbps_plus', label: '2 Gbps+', isActive: true, order: 7 },
    ],
  },

  // ============================================
  // ONSITE SECURITY OPTIONS
  // ============================================
  {
    id: 'dropdown_onsite_security',
    key: 'onsite_security',
    name: 'Onsite Security Options',
    allowCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: 'default_router', label: 'Default security settings on the router', isActive: true, order: 1 },
      { value: 'firewall', label: 'Firewall (L3) / Next Gen Firewall', isActive: true, order: 2 },
      { value: 'ids_ips', label: 'IDS / IPS', isActive: true, order: 3 },
      { value: 'vpn_gateway', label: 'VPN Gateway', isActive: true, order: 4 },
      { value: 'network_seg_l2', label: 'Network Segmentation (L2)', isActive: true, order: 5 },
      { value: 'network_seg_l3', label: 'Network Segmentation (L3) (VLANS)', isActive: true, order: 6 },
      { value: 'dns_sinkhole', label: 'DNS Sinkhole / Redirection', isActive: true, order: 7 },
      { value: 'physical_security', label: 'Physical Security (Cages/Locks)', isActive: true, order: 8 },
    ],
  },

  // ============================================
  // DEVICE PLACEMENT
  // ============================================
  {
    id: 'dropdown_device_placement',
    key: 'device_placement',
    name: 'Device Placement',
    allowCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: 'indoor', label: 'Indoor', isActive: true, order: 1 },
      { value: 'outdoor', label: 'Outdoor', isActive: true, order: 2 },
    ],
  },

  // ============================================
  // HOW DID YOU HEAR ABOUT US
  // ============================================
  {
    id: 'dropdown_referral_sources',
    key: 'referral_sources',
    name: 'How Did You Hear About Us',
    allowCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: 'google', label: 'Google Search', isActive: true, order: 1 },
      { value: 'linkedin', label: 'LinkedIn', isActive: true, order: 2 },
      { value: 'referral', label: 'Referral from Partner', isActive: true, order: 3 },
      { value: 'social_media', label: 'Social Media', isActive: true, order: 4 },
      { value: 'trade_show', label: 'Trade Show / Conference', isActive: true, order: 5 },
      { value: 'email', label: 'Email Campaign', isActive: true, order: 6 },
      { value: 'word_of_mouth', label: 'Word of Mouth', isActive: true, order: 7 },
      { value: 'other', label: 'Other', isActive: true, order: 99 },
    ],
  },

  // ============================================
  // COMPANY INDUSTRIES
  // ============================================
  {
    id: 'dropdown_industries',
    key: 'industries',
    name: 'Company Industries',
    allowCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: 'hospitality', label: 'Hospitality', isActive: true, order: 1 },
      { value: 'food_beverage', label: 'Food & Beverage', isActive: true, order: 2 },
      { value: 'retail', label: 'Retail', isActive: true, order: 3 },
      { value: 'healthcare', label: 'Healthcare', isActive: true, order: 4 },
      { value: 'education', label: 'Education', isActive: true, order: 5 },
      { value: 'entertainment', label: 'Entertainment', isActive: true, order: 6 },
      { value: 'transportation', label: 'Transportation', isActive: true, order: 7 },
      { value: 'real_estate', label: 'Real Estate', isActive: true, order: 8 },
      { value: 'professional_services', label: 'Professional Services', isActive: true, order: 9 },
      { value: 'manufacturing', label: 'Manufacturing', isActive: true, order: 10 },
      { value: 'government', label: 'Government', isActive: true, order: 11 },
      { value: 'nonprofit', label: 'Non-Profit', isActive: true, order: 12 },
      { value: 'other', label: 'Other', isActive: true, order: 99 },
    ],
  },

  // ============================================
  // PAYMENT RESPONSIBILITY
  // ============================================
  {
    id: 'dropdown_payment_responsibility',
    key: 'payment_responsibility',
    name: 'Payment Responsibility',
    allowCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: 'skyyield', label: 'SkyYield', isActive: true, order: 1 },
      { value: 'location_partner', label: 'Location Partner', isActive: true, order: 2 },
    ],
  },

  // ============================================
  // OWNERSHIP
  // ============================================
  {
    id: 'dropdown_ownership',
    key: 'ownership',
    name: 'Equipment Ownership',
    allowCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: 'skyyield', label: 'SkyYield', isActive: true, order: 1 },
      { value: 'location_partner', label: 'Location Partner', isActive: true, order: 2 },
    ],
  },

  // ============================================
  // DEPLOYMENT OPTIONS
  // ============================================
  {
    id: 'dropdown_deployment_options',
    key: 'deployment_options',
    name: 'Deployment Options',
    allowCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: 'skyyield_install', label: 'SkyYield Installation', isActive: true, order: 1 },
      { value: 'self_install', label: 'Self Installation', isActive: true, order: 2 },
      { value: 'msp_install', label: 'MSP Installation', isActive: true, order: 3 },
    ],
  },

  // ============================================
  // SOLANA WALLET
  // ============================================
  {
    id: 'dropdown_solana_wallet',
    key: 'solana_wallet',
    name: 'Solana Wallet',
    allowCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { value: 'skyyield_wallet', label: 'SkyYield Wallet', isActive: true, order: 1 },
    ],
  },
]

// Helper to get dropdown options by key
export function getDropdownOptions(key: string): { value: string; label: string }[] {
  const dropdown = defaultDropdowns.find(d => d.key === key)
  if (!dropdown) return []
  return dropdown.options
    .filter(o => o.isActive)
    .sort((a, b) => a.order - b.order)
    .map(o => ({ value: o.value, label: o.label }))
}