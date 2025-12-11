// =============================================================================
// PURCHASE REQUEST TYPES
// File: src/types/purchase-request.ts
// =============================================================================

export type PurchaseRequestStatus =
  | 'auto_created'
  | 'pending_approval'
  | 'approved'
  | 'ordered'
  | 'shipped'
  | 'received'
  | 'assigned'
  | 'cancelled';

export type PurchaseRequestSource =
  | 'loi_auto'
  | 'employee_request'
  | 'admin';

export type DeviceOwnership =
  | 'skyyield'
  | 'partner'
  | 'existing';

export type Urgency = 'standard' | 'rush' | 'critical';

// Related entities (partial)
export interface LocationPartnerRef {
  id: string;
  company_legal_name: string;
  user_id: string;
}

export interface VenueRef {
  id: string;
  venue_name: string;
  city: string;
  state: string;
  address_line_1: string;
}

export interface ProductRef {
  id: string;
  name: string;
  sku: string;
  our_cost: number;
  image_url?: string;
}

export interface UserRef {
  id: string;
  full_name: string;
  email: string;
}

// Timeline event
export interface TimelineEvent {
  action: string;
  timestamp: string;
  by: string | null;
  note: string | null;
}

// Main Purchase Request interface
export interface PurchaseRequest {
  id: string;
  request_number: string;
  source: PurchaseRequestSource;
  status: PurchaseRequestStatus;

  // Assignment
  location_partner_id: string | null;
  location_partner: LocationPartnerRef | null;
  venue_id: string | null;
  venue: VenueRef | null;

  // Product
  product_id: string | null;
  product: ProductRef | null;
  product_name: string | null;
  product_sku: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;

  // Ownership
  ownership: DeviceOwnership;

  // Approval
  requires_approval: boolean;
  approved_by: string | null;
  approver: UserRef | null;
  approved_at: string | null;
  approval_notes: string | null;

  // Order details
  ordered_at: string | null;
  order_reference: string | null;
  supplier: string | null;
  expected_delivery_date: string | null;

  // Shipping
  shipped_at: string | null;
  tracking_number: string | null;

  // Receipt
  received_at: string | null;
  received_by: string | null;
  receiver: UserRef | null;

  // Device assignment
  device_id: string | null;
  assigned_at: string | null;

  // Requester
  requested_by: string | null;
  requester: UserRef | null;

  // Notes
  notes: string | null;

  // Timeline (computed from activity_log)
  timeline?: TimelineEvent[];

  // Metadata
  created_at: string;
  updated_at: string;
}

// Summary for cards
export interface PurchaseRequestSummary {
  pending_approval: number;
  auto_created: number;
  approved: number;
  ordered: number;
  shipped: number;
  received: number;
  assigned: number;
  cancelled: number;
  total: number;
}

// Filters
export interface PurchaseRequestFilters {
  status: string;
  source: string;
  ownership: string;
  search: string;
}

// Pagination
export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response
export interface PurchaseRequestsResponse {
  data: PurchaseRequest[];
  pagination: PaginationInfo;
  summary: PurchaseRequestSummary;
}

// Create request input
export interface CreatePurchaseRequestInput {
  location_partner_id?: string;
  venue_id?: string;
  product_id?: string;
  product_name?: string;
  product_sku?: string;
  product_url?: string;
  quantity: number;
  unit_cost: number;
  ownership: DeviceOwnership;
  notes?: string;
  urgency?: Urgency;
  justification: string;
}

// Update status input
export interface UpdateStatusInput {
  action: 'approve' | 'cancel' | 'ordered' | 'shipped' | 'received' | 'assign';
  notes?: string;
  // For ordered
  order_reference?: string;
  supplier?: string;
  expected_delivery_date?: string;
  // For shipped
  tracking_number?: string;
  // For assign
  mac_address?: string;
  serial_number?: string;
  device_notes?: string;
}

// Status config for UI
export interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  icon: string;
}

export const STATUS_CONFIG: Record<PurchaseRequestStatus, StatusConfig> = {
  auto_created: {
    label: 'Auto-Created',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: '📋',
  },
  pending_approval: {
    label: 'Pending Approval',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    icon: '⚠️',
  },
  approved: {
    label: 'Approved',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '✅',
  },
  ordered: {
    label: 'Ordered',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    icon: '🛒',
  },
  shipped: {
    label: 'Shipped',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    icon: '🚚',
  },
  received: {
    label: 'Received',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    icon: '📦',
  },
  assigned: {
    label: 'Assigned',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '✅',
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    icon: '❌',
  },
};

export interface OwnershipConfig {
  label: string;
  bgColor: string;
  textColor: string;
  icon: string;
}

export const OWNERSHIP_CONFIG: Record<DeviceOwnership, OwnershipConfig> = {
  skyyield: {
    label: 'SkyYield',
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-800',
    icon: '🏢',
  },
  partner: {
    label: 'Partner',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    icon: '👤',
  },
  existing: {
    label: 'Existing',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    icon: '🏠',
  },
};

export interface SourceConfig {
  label: string;
  bgColor: string;
  textColor: string;
  icon: string;
}

export const SOURCE_CONFIG: Record<PurchaseRequestSource, SourceConfig> = {
  loi_auto: {
    label: 'LOI',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: '📋',
  },
  employee_request: {
    label: 'Employee',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    icon: '👤',
  },
  admin: {
    label: 'Admin',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    icon: '👑',
  },
};
