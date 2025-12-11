// =============================================================================
// PURCHASE REQUESTS API FUNCTIONS
// File: src/lib/api/purchase-requests.ts
// =============================================================================

import {
  PurchaseRequest,
  PurchaseRequestsResponse,
  PurchaseRequestSummary,
  PurchaseRequestFilters,
  CreatePurchaseRequestInput,
  UpdateStatusInput,
} from '@/types/purchase-request';

const API_BASE = '/api/admin/purchase-requests';

// =============================================================================
// LIST PURCHASE REQUESTS
// =============================================================================
export async function fetchPurchaseRequests(
  filters: PurchaseRequestFilters,
  page: number = 1,
  limit: number = 20,
  sort: string = 'created_at',
  order: 'asc' | 'desc' = 'desc'
): Promise<PurchaseRequestsResponse> {
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.source) params.append('source', filters.source);
  if (filters.ownership) params.append('ownership', filters.ownership);
  if (filters.search) params.append('search', filters.search);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  params.append('sort', sort);
  params.append('order', order);

  const response = await fetch(`${API_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch purchase requests');
  }

  return response.json();
}

// =============================================================================
// GET SINGLE PURCHASE REQUEST
// =============================================================================
export async function fetchPurchaseRequest(id: string): Promise<PurchaseRequest> {
  const response = await fetch(`${API_BASE}/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch purchase request');
  }

  const data = await response.json();
  return data.data;
}

// =============================================================================
// GET SUMMARY COUNTS
// =============================================================================
export async function fetchPurchaseRequestSummary(): Promise<PurchaseRequestSummary> {
  const response = await fetch(`${API_BASE}/summary`);

  if (!response.ok) {
    throw new Error('Failed to fetch summary');
  }

  const data = await response.json();
  return data;
}

// =============================================================================
// CREATE PURCHASE REQUEST
// =============================================================================
export async function createPurchaseRequest(
  input: CreatePurchaseRequestInput
): Promise<PurchaseRequest> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create purchase request');
  }

  const data = await response.json();
  return data.data;
}

// =============================================================================
// UPDATE STATUS
// =============================================================================
export async function updatePurchaseRequestStatus(
  id: string,
  input: UpdateStatusInput
): Promise<PurchaseRequest> {
  const response = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update status');
  }

  const data = await response.json();
  return data.data;
}

// =============================================================================
// DELETE (CANCEL) PURCHASE REQUEST
// =============================================================================
export async function cancelPurchaseRequest(
  id: string,
  notes?: string
): Promise<void> {
  await updatePurchaseRequestStatus(id, {
    action: 'cancel',
    notes,
  });
}

// =============================================================================
// APPROVE PURCHASE REQUEST
// =============================================================================
export async function approvePurchaseRequest(
  id: string,
  notes?: string
): Promise<PurchaseRequest> {
  return updatePurchaseRequestStatus(id, {
    action: 'approve',
    notes,
  });
}

// =============================================================================
// MARK AS ORDERED
// =============================================================================
export async function markAsOrdered(
  id: string,
  orderDetails: {
    order_reference: string;
    supplier: string;
    expected_delivery_date?: string;
  }
): Promise<PurchaseRequest> {
  return updatePurchaseRequestStatus(id, {
    action: 'ordered',
    ...orderDetails,
  });
}

// =============================================================================
// MARK AS SHIPPED
// =============================================================================
export async function markAsShipped(
  id: string,
  tracking_number: string
): Promise<PurchaseRequest> {
  return updatePurchaseRequestStatus(id, {
    action: 'shipped',
    tracking_number,
  });
}

// =============================================================================
// MARK AS RECEIVED
// =============================================================================
export async function markAsReceived(id: string): Promise<PurchaseRequest> {
  return updatePurchaseRequestStatus(id, {
    action: 'received',
  });
}

// =============================================================================
// ASSIGN TO DEVICE
// =============================================================================
export async function assignToDevice(
  id: string,
  deviceDetails: {
    mac_address?: string;
    serial_number?: string;
    device_notes?: string;
  }
): Promise<PurchaseRequest> {
  return updatePurchaseRequestStatus(id, {
    action: 'assign',
    ...deviceDetails,
  });
}

// =============================================================================
// FETCH LOCATION PARTNERS (for dropdowns)
// =============================================================================
export async function fetchLocationPartners(): Promise<
  Array<{ id: string; company_legal_name: string }>
> {
  const response = await fetch('/api/admin/location-partners?status=all&limit=500');

  if (!response.ok) {
    throw new Error('Failed to fetch location partners');
  }

  const data = await response.json();
  return data.data;
}

// =============================================================================
// FETCH VENUES (for dropdowns, filtered by partner)
// =============================================================================
export async function fetchVenues(
  locationPartnerId?: string
): Promise<Array<{ id: string; venue_name: string; city: string; state: string }>> {
  const params = new URLSearchParams();
  if (locationPartnerId) {
    params.append('location_partner_id', locationPartnerId);
  }
  params.append('limit', '500');

  const response = await fetch(`/api/admin/venues?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch venues');
  }

  const data = await response.json();
  return data.data;
}

// =============================================================================
// FETCH APPROVED PRODUCTS (for dropdowns)
// =============================================================================
export async function fetchApprovedProducts(): Promise<
  Array<{ id: string; name: string; sku: string; our_cost: number; image_url?: string }>
> {
  const response = await fetch('/api/admin/products?is_approved=true&limit=500');

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await response.json();
  return data.data;
}
