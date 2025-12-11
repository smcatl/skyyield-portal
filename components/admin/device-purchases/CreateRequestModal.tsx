// =============================================================================
// CREATE REQUEST MODAL
// File: src/components/admin/device-purchases/CreateRequestModal.tsx
// =============================================================================

'use client';

import { useState, useEffect } from 'react';
import {
  CreatePurchaseRequestInput,
  DeviceOwnership,
  Urgency,
} from '@/lib/types/purchase-request';
import {
  createPurchaseRequest,
  fetchLocationPartners,
  fetchVenues,
  fetchApprovedProducts,
} from '@/lib/api/purchase-requests';
import { toast } from 'sonner';
import { X, Loader2, Plus, Minus } from 'lucide-react';

interface CreateRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface PartnerOption {
  id: string;
  company_legal_name: string;
}

interface VenueOption {
  id: string;
  venue_name: string;
  city: string;
  state: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  our_cost: number;
  image_url?: string;
}

export default function CreateRequestModal({
  onClose,
  onSuccess,
}: CreateRequestModalProps) {
  // Form state
  const [requestType, setRequestType] = useState<'partner' | 'inventory'>('partner');
  const [locationPartnerId, setLocationPartnerId] = useState('');
  const [venueId, setVenueId] = useState('');
  const [productType, setProductType] = useState<'approved' | 'custom'>('approved');
  const [productId, setProductId] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [customProductSku, setCustomProductSku] = useState('');
  const [customProductUrl, setCustomProductUrl] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [ownership, setOwnership] = useState<DeviceOwnership>('skyyield');
  const [justification, setJustification] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('standard');

  // Data state
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed
  const totalCost = quantity * unitCost;
  const selectedProduct = products.find((p) => p.id === productId);

  // Load partners on mount
  useEffect(() => {
    const loadPartners = async () => {
      setIsLoadingPartners(true);
      try {
        const data = await fetchLocationPartners();
        setPartners(data);
      } catch (error) {
        toast.error('Failed to load partners');
      } finally {
        setIsLoadingPartners(false);
      }
    };
    loadPartners();
  }, []);

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const data = await fetchApprovedProducts();
        setProducts(data);
      } catch (error) {
        toast.error('Failed to load products');
      } finally {
        setIsLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // Load venues when partner changes
  useEffect(() => {
    if (!locationPartnerId) {
      setVenues([]);
      setVenueId('');
      return;
    }

    const loadVenues = async () => {
      setIsLoadingVenues(true);
      try {
        const data = await fetchVenues(locationPartnerId);
        setVenues(data);
      } catch (error) {
        toast.error('Failed to load venues');
      } finally {
        setIsLoadingVenues(false);
      }
    };
    loadVenues();
  }, [locationPartnerId]);

  // Update unit cost when product changes
  useEffect(() => {
    if (selectedProduct) {
      setUnitCost(selectedProduct.our_cost);
    }
  }, [selectedProduct]);

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  // Validate form
  const isValid = () => {
    if (requestType === 'partner' && !locationPartnerId) return false;
    if (productType === 'approved' && !productId) return false;
    if (productType === 'custom' && !customProductName.trim()) return false;
    if (quantity < 1) return false;
    if (unitCost <= 0) return false;
    if (!justification.trim() || justification.length < 10) return false;
    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!isValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreatePurchaseRequestInput = {
        quantity,
        unit_cost: unitCost,
        ownership,
        justification,
        urgency,
      };

      if (requestType === 'partner') {
        input.location_partner_id = locationPartnerId;
        if (venueId) input.venue_id = venueId;
      }

      if (productType === 'approved') {
        input.product_id = productId;
      } else {
        input.product_name = customProductName;
        input.product_sku = customProductSku || undefined;
        input.product_url = customProductUrl || undefined;
      }

      await createPurchaseRequest(input);
      toast.success('Purchase request created successfully');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            New Purchase Request
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Request Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="requestType"
                  checked={requestType === 'partner'}
                  onChange={() => setRequestType('partner')}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700">For Existing Partner/Venue</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="requestType"
                  checked={requestType === 'inventory'}
                  onChange={() => setRequestType('inventory')}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700">Inventory Replenishment</span>
              </label>
            </div>
          </div>

          {/* Assignment (if partner) */}
          {requestType === 'partner' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Partner <span className="text-red-500">*</span>
                </label>
                <select
                  value={locationPartnerId}
                  onChange={(e) => setLocationPartnerId(e.target.value)}
                  disabled={isLoadingPartners}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                >
                  <option value="">Select Partner...</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.company_legal_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue
                </label>
                <select
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
                  disabled={!locationPartnerId || isLoadingVenues}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                >
                  <option value="">Select Venue...</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.venue_name} - {venue.city}, {venue.state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Product Selection
            </label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="productType"
                  checked={productType === 'approved'}
                  onChange={() => setProductType('approved')}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700">Select from Approved Products</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="productType"
                  checked={productType === 'custom'}
                  onChange={() => setProductType('custom')}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700">Custom Product</span>
              </label>
            </div>

            {productType === 'approved' ? (
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={isLoadingProducts}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              >
                <option value="">Select Product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku}) - {formatCurrency(product.our_cost)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    placeholder="e.g., Custom Access Point"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={customProductSku}
                    onChange={(e) => setCustomProductSku(e.target.value)}
                    placeholder="e.g., CUSTOM-AP-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product URL
                  </label>
                  <input
                    type="url"
                    value={customProductUrl}
                    onChange={(e) => setCustomProductUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quantity & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.01}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Cost
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-semibold text-gray-900">
                {formatCurrency(totalCost)}
              </div>
            </div>
          </div>

          {/* Ownership */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Equipment Ownership <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="radio"
                  name="ownership"
                  checked={ownership === 'skyyield'}
                  onChange={() => setOwnership('skyyield')}
                  className="mt-0.5 w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">SkyYield Owned</span>
                  <p className="text-xs text-gray-500">We purchase and retain ownership</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="radio"
                  name="ownership"
                  checked={ownership === 'partner'}
                  onChange={() => setOwnership('partner')}
                  className="mt-0.5 w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Partner Owned</span>
                  <p className="text-xs text-gray-500">Partner purchases through us</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="radio"
                  name="ownership"
                  checked={ownership === 'existing'}
                  onChange={() => setOwnership('existing')}
                  className="mt-0.5 w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Existing Equipment</span>
                  <p className="text-xs text-gray-500">Already at location</p>
                </div>
              </label>
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Purchase <span className="text-red-500">*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Enter reason for this purchase request (min 10 characters)..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {justification.length}/10 characters minimum
            </p>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Urgency
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  checked={urgency === 'standard'}
                  onChange={() => setUrgency('standard')}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700">Standard (5-7 days)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  checked={urgency === 'rush'}
                  onChange={() => setUrgency('rush')}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700">Rush (2-3 days)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  checked={urgency === 'critical'}
                  onChange={() => setUrgency('critical')}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700">Critical (next day)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Request
          </button>
        </div>
      </div>
    </div>
  );
}
