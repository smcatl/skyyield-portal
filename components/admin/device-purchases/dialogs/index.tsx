"use client";

// =============================================================================
// APPROVE DIALOG
// File: src/components/admin/device-purchases/dialogs/ApproveDialog.tsx
// =============================================================================



import { useState } from 'react';
import { PurchaseRequest } from '@/lib/types/purchase-request';
import { approvePurchaseRequest, cancelPurchaseRequest, markAsOrdered, markAsShipped, markAsReceived, assignToDevice } from '@/lib/api/purchase-requests';
import { toast } from 'sonner';
import { X, Loader2, Check, ShoppingCart, Truck, Package, MapPin } from 'lucide-react';

interface ApproveDialogProps {
  open: boolean;
  onClose: () => void;
  request: PurchaseRequest;
  onSuccess: () => void;
}

export function ApproveDialog({
  open,
  onClose,
  request,
  onSuccess,
}: ApproveDialogProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await approvePurchaseRequest(request.id, notes || undefined);
      toast.success('Request approved');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Approve Purchase Request
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-600">
            Approve purchase request{' '}
            <span className="font-mono font-semibold">{request.request_number}</span>{' '}
            for{' '}
            <span className="font-semibold">
              {request.quantity}× {request.product?.name || request.product_name}
            </span>{' '}
            ({formatCurrency(request.total_cost)})?
          </p>

          <p className="text-sm text-gray-500">
            This will mark the request as ready for ordering.
          </p>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// REJECT DIALOG
// File: src/components/admin/device-purchases/dialogs/RejectDialog.tsx
// =============================================================================




interface RejectDialogProps {
  open: boolean;
  onClose: () => void;
  request: PurchaseRequest;
  onSuccess: () => void;
}

export function RejectDialog({
  open,
  onClose,
  request,
  onSuccess,
}: RejectDialogProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    try {
      await cancelPurchaseRequest(request.id, notes);
      toast.success('Request cancelled');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Reject Purchase Request
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to reject request{' '}
            <span className="font-mono font-semibold">{request.request_number}</span>?
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter reason..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !notes.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MARK ORDERED DIALOG
// File: src/components/admin/device-purchases/dialogs/MarkOrderedDialog.tsx
// =============================================================================




interface MarkOrderedDialogProps {
  open: boolean;
  onClose: () => void;
  request: PurchaseRequest;
  onSuccess: () => void;
}

export function MarkOrderedDialog({
  open,
  onClose,
  request,
  onSuccess,
}: MarkOrderedDialogProps) {
  const [orderReference, setOrderReference] = useState('');
  const [supplier, setSupplier] = useState('Ubiquiti Store');
  const [expectedDate, setExpectedDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!orderReference.trim()) {
      toast.error('Please enter an order reference');
      return;
    }
    if (!supplier.trim()) {
      toast.error('Please enter a supplier');
      return;
    }

    setIsSubmitting(true);
    try {
      await markAsOrdered(request.id, {
        order_reference: orderReference,
        supplier,
        expected_delivery_date: expectedDate || undefined,
      });
      toast.success('Order details saved');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Mark as Ordered</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={orderReference}
              onChange={(e) => setOrderReference(e.target.value)}
              placeholder="e.g., PO-12345"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Ubiquiti Store">Ubiquiti Store</option>
              <option value="Amazon">Amazon</option>
              <option value="B&H Photo">B&H Photo</option>
              <option value="CDW">CDW</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !orderReference.trim() || !supplier.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MARK SHIPPED DIALOG
// File: src/components/admin/device-purchases/dialogs/MarkShippedDialog.tsx
// =============================================================================




interface MarkShippedDialogProps {
  open: boolean;
  onClose: () => void;
  request: PurchaseRequest;
  onSuccess: () => void;
}

export function MarkShippedDialog({
  open,
  onClose,
  request,
  onSuccess,
}: MarkShippedDialogProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await markAsShipped(request.id, trackingNumber || '');
      toast.success('Shipping details saved');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Mark as Shipped</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tracking Number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g., 1Z999AA10123456784"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MARK RECEIVED DIALOG
// File: src/components/admin/device-purchases/dialogs/MarkReceivedDialog.tsx
// =============================================================================




interface MarkReceivedDialogProps {
  open: boolean;
  onClose: () => void;
  request: PurchaseRequest;
  onSuccess: () => void;
}

export function MarkReceivedDialog({
  open,
  onClose,
  request,
  onSuccess,
}: MarkReceivedDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await markAsReceived(request.id);
      toast.success('Receipt confirmed');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Confirm Receipt</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Confirm that you have received the equipment for request{' '}
            <span className="font-mono font-semibold">{request.request_number}</span>?
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>{request.quantity}×</strong>{' '}
              {request.product?.name || request.product_name}
            </p>
            {request.tracking_number && (
              <p className="text-sm text-gray-500 mt-1">
                Tracking: {request.tracking_number}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ASSIGN DEVICE DIALOG
// File: src/components/admin/device-purchases/dialogs/AssignDeviceDialog.tsx
// =============================================================================




interface AssignDeviceDialogProps {
  open: boolean;
  onClose: () => void;
  request: PurchaseRequest;
  onSuccess: () => void;
}

export function AssignDeviceDialog({
  open,
  onClose,
  request,
  onSuccess,
}: AssignDeviceDialogProps) {
  const [macAddress, setMacAddress] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [createDeviceRecord, setCreateDeviceRecord] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await assignToDevice(request.id, {
        mac_address: macAddress || undefined,
        serial_number: serialNumber || undefined,
        device_notes: notes || undefined,
      });
      toast.success('Device assigned to venue');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Assign to Device</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            This device will be assigned to:
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900">
              {request.location_partner?.company_legal_name || 'Unknown Partner'}
            </p>
            {request.venue && (
              <p className="text-sm text-gray-600">
                {request.venue.venue_name} - {request.venue.city}, {request.venue.state}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MAC Address (optional)
            </label>
            <input
              type="text"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
              placeholder="e.g., AA:BB:CC:DD:EE:FF"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serial Number (optional)
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g., SN123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Installed in lobby area"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createDeviceRecord}
              onChange={(e) => setCreateDeviceRecord(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-sm text-gray-700">
              Create device record automatically
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
