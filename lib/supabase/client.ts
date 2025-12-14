// Supabase Client Configuration
// lib/supabase/client.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for browser/public use (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper to get admin client (for API routes)
export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return supabaseAdmin
}

// Database types (matches our schema)
export interface LocationPartner {
  id: string
  user_id?: string
  partner_id: string
  company_legal_name: string
  dba_name?: string
  contact_first_name?: string
  contact_last_name?: string
  contact_email: string
  contact_phone?: string
  address_line_1?: string
  city?: string
  state?: string
  zip?: string
  pipeline_stage: string
  referred_by_partner_id?: string
  referral_code_used?: string
  intro_call_calendly_status: string
  intro_call_scheduled_at?: string
  loi_status: string
  loi_signed_at?: string
  loi_device_ownership?: string
  loi_device_count?: number
  install_status: string
  install_scheduled_at?: string
  trial_start_date?: string
  trial_end_date?: string
  trial_days_remaining?: number
  trial_status?: string
  contract_status: string
  contract_signed_at?: string
  tipalti_status: string
  tipalti_payee_id?: string
  commission_percentage?: number
  notes?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface ReferralPartner {
  id: string
  user_id?: string
  partner_id: string
  company_name?: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  referral_code: string
  commission_type: string
  commission_per_referral?: number
  commission_percentage?: number
  total_referrals: number
  active_referrals: number
  total_earned: number
  pipeline_stage: string
  tipalti_status: string
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  location_partner_id: string
  venue_id: string
  venue_name: string
  venue_type?: string
  address_line_1?: string
  city?: string
  state?: string
  zip?: string
  square_footage?: number
  monthly_visitors?: number
  status: string
  created_at: string
  updated_at: string
}

export interface Device {
  id: string
  venue_id: string
  product_id?: string
  device_id: string
  device_name?: string
  device_type: string
  serial_number?: string
  mac_address?: string
  ownership: string
  status: string
  installed_at?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  manufacturer?: string
  category?: string
  our_cost?: number
  partner_price?: number
  retail_price?: number
  description?: string
  image_url?: string
  in_stock: boolean
  is_visible: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface DevicePurchaseRequest {
  id: string
  request_number: string
  source: string
  location_partner_id?: string
  venue_id?: string
  product_id?: string
  product_name?: string
  product_sku?: string
  quantity: number
  unit_cost?: number
  total_cost?: number
  ownership: string
  status: string
  requested_by?: string
  approved_by?: string
  approved_at?: string
  ordered_at?: string
  order_reference?: string
  shipped_at?: string
  tracking_number?: string
  received_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Commission {
  id: string
  commission_id: string
  recipient_type: string
  location_partner_id?: string
  referral_partner_id?: string
  venue_id?: string
  period_start: string
  period_end: string
  gross_revenue?: number
  commission_rate?: number
  commission_amount: number
  status: string
  created_at: string
  updated_at: string
}

export interface DataUsage {
  id: string
  device_id: string
  venue_id: string
  location_partner_id?: string
  date: string
  gb_offloaded: number
  unique_users?: number
  total_sessions?: number
  revenue_generated?: number
  created_at: string
}
