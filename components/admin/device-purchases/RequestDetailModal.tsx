// =============================================================================
// REQUEST DETAIL MODAL
// File: src/components/admin/device-purchases/RequestDetailModal.tsx
// =============================================================================

'use client';

import { useState } from 'react';
import { usePurchaseRequest } from '@/hooks/usePurchaseRequests';
import { PurchaseRequest, TimelineEvent } from '@/lib/types/purchase-request';
import { StatusBadge, OwnershipBadge, SourceBadge } from './Badges';
import {
  X,
  Loader2,
  ExternalLink,
  Check,
  ShoppingCart,
  Truck,
  Package,
  MapPin,
  Clock,
  User,
  Building,
  MapPinned,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ApproveDialog, RejectDialog, MarkOrderedDialog, MarkShippedDialog, MarkReceivedDialog, AssignDeviceDialog } from './dialogs';

interface RequestDetailModalProps {
  requestId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function RequestDetailModal({
  requestId,
  onClose,
  onUpdate,
}: RequestDetailModalProps) {
  const { data: request, isLoading, error, refetch } = usePurchaseRequest(requestId);

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [orderedDialogOpen, setOrderedDialogOpen] = useState(false);
  const [shippedDialogOpen, setShippedDialogOpen] = useState(false);
  const [receivedDialogOpen, setReceivedDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Format helpers
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
    } catch {
      return dateStr;
    }
  };

  // Handle action success
  const handleActionSuccess = () => {
    refetch();
    onUpdate();
  };

  // Get primary action based on status
  const getPrimaryAction = (request: PurchaseRequest) => {
    switch (request.status) {
      case 'auto_created':
      case 'pending_approval':
        return {
          label: 'Approve',
          icon: <Check className="h-4 w-4" />,
          onClick: () => setApproveDialogOpen(true),
          className: 'bg-green-600 hover:bg-green-700',
        };
      case 'approved':
        return {
          label: 'Mark Ordered',
          icon: <ShoppingCart className="h-4 w-4" />,
          onClick: () => setOrderedDialogOpen(true),
          className: 'bg-purple-600 hover:bg-purple-700',
        };
      case 'ordered':
        return {
          label: 'Mark Shipped',
          icon: <Truck className="h-4 w-4" />,
          onClick: () => setShippedDialogOpen(true),
          className: 'bg-indigo-600 hover:bg-indigo-700',
        };
      case 'shipped':
        return {
          label: 'Mark Received',
          icon: <Package className="h-4 w-4" />,
          onClick: () => setReceivedDialogOpen(true),
          className: 'bg-teal-600 hover:bg-teal-700',
        };
      case 'received':
        return {
          label: 'Assign to Device',
          icon: <MapPin className="h-4 w-4" />,
          onClick: () => setAssignDialogOpen(true),
          className: 'bg-green-600 hover:bg-green-700',
        };
      default:
        return null;
    }
  };

  // Build timeline from request data
  const buildTimeline = (request: PurchaseRequest): TimelineEvent[] => {
    const timeline: TimelineEvent[] = [];

    // Created
    timeline.push({
      action: 'Created',
      timestamp: request.created_at,
      by: request.source === 'loi_auto' ? 'System' : request.requester?.full_name || null,
      note:
        request.source === 'loi_auto'
          ? 'Auto-created from LOI signing'
          : request.source === 'employee_request'
          ? 'Employee request'
          : 'Admin created',
    });

    // Approved
    if (request.approved_at) {
      timeline.push({
        action: 'Approved',
        timestamp: request.approved_at,
        by: request.approver?.full_name || 'Admin',
        note: request.approval_notes,
      });
    }

    // Ordered
    if (request.ordered_at) {
      timeline.push({
        action: 'Ordered',
        timestamp: request.ordered_at,
        by: null,
        note: request.order_reference || null,
      });
    }

    // Shipped
    if (request.shipped_at) {
      timeline.push({
        action: 'Shipped',
        timestamp: request.shipped_at,
        by: null,
        note: request.tracking_number ? `Tracking: ${request.tracking_number}` : null,
      });
    }

    // Received
    if (request.received_at) {
      timeline.push({
        action: 'Received',
        timestamp: request.received_at,
        by: request.receiver?.full_name || null,
        note: null,
      });
    }

    // Assigned
    if (request.assigned_at) {
      timeline.push({
        action: 'Assigned',
        timestamp: request.assigned_at,
        by: null,
        note: request.device_id ? `Device ID: ${request.device_id}` : null,
      });
    }

    return timeline;
  };

  // Get pending steps
  const getPendingSteps = (request: PurchaseRequest): string[] => {
    const steps: string[] = [];
    const status = request.status;

    if (['auto_created', 'pending_approval'].includes(status)) {
      steps.push('Approval');
    }
    if (['auto_created', 'pending_approval', 'approved'].includes(status)) {
      steps.push('Ordered');
    }
    if (['auto_created', 'pending_approval', 'approved', 'ordered'].includes(status)) {
      steps.push('Shipped');
    }
    if (
      ['auto_created', 'pending_approval', 'approved', 'ordered', 'shipped'].includes(status)
    ) {
      steps.push('Received');
    }
    if (
      ['auto_created', 'pending_approval', 'approved', 'ordered', 'shipped', 'received'].includes(
        status
      )
    ) {
      steps.push('Assigned');
    }

    return steps;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative bg-white rounded-xl p-8">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl p-8">
          <p className="text-red-600">{error || 'Request not found'}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const primaryAction = getPrimaryAction(request);
  const timeline = buildTimeline(request);
  const pendingSteps = getPendingSteps(request);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Purchase Request: {request.request_number}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Status & Source */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              <StatusBadge status={request.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Source:</span>
              <SourceBadge source={request.source} />
            </div>
          </div>

          {/* Product Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Product Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Product</p>
                <p className="text-sm font-medium text-gray-900">
                  {request.product?.name || request.product_name || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">SKU</p>
                <p className="text-sm font-medium text-gray-900">
                  {request.product?.sku || request.product_sku || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Quantity</p>
                <p className="text-sm font-medium text-gray-900">{request.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unit Cost</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(request.unit_cost)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Cost</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(request.total_cost)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ownership</p>
                <OwnershipBadge ownership={request.ownership} size="sm" />
              </div>
            </div>
          </div>

          {/* Assignment */}
          {(request.location_partner || request.venue) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Assignment
              </h3>
              <div className="space-y-2">
                {request.location_partner && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {request.location_partner.company_legal_name}
                    </span>
                  </div>
                )}
                {request.venue && (
                  <div className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {request.venue.venue_name} - {request.venue.city}, {request.venue.state}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Details */}
          {(request.order_reference || request.tracking_number) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Order Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {request.order_reference && (
                  <div>
                    <p className="text-xs text-gray-500">Order Reference</p>
                    <p className="text-sm font-medium text-gray-900">
                      {request.order_reference}
                    </p>
                  </div>
                )}
                {request.supplier && (
                  <div>
                    <p className="text-xs text-gray-500">Supplier</p>
                    <p className="text-sm font-medium text-gray-900">{request.supplier}</p>
                  </div>
                )}
                {request.ordered_at && (
                  <div>
                    <p className="text-xs text-gray-500">Ordered</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(request.ordered_at)}
                    </p>
                  </div>
                )}
                {request.expected_delivery_date && (
                  <div>
                    <p className="text-xs text-gray-500">Expected Delivery</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(request.expected_delivery_date)}
                    </p>
                  </div>
                )}
                {request.tracking_number && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Tracking Number</p>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {request.tracking_number}
                      <a
                        href={`https://www.google.com/search?q=${request.tracking_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </p>
                  </div>
                )}
                {request.shipped_at && (
                  <div>
                    <p className="text-xs text-gray-500">Shipped</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(request.shipped_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Timeline
            </h3>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-green-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{event.action}</span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>
                    {event.by && (
                      <p className="text-sm text-gray-600">By: {event.by}</p>
                    )}
                    {event.note && (
                      <p className="text-sm text-gray-500">{event.note}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Pending steps */}
              {pendingSteps.length > 0 && (
                <>
                  {pendingSteps.map((step, index) => (
                    <div key={`pending-${index}`} className="flex gap-3 opacity-50">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full border-2 border-gray-300 bg-white" />
                        {index < pendingSteps.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <span className="font-medium text-gray-500">{step}</span>
                        <p className="text-sm text-gray-400">Pending</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {request.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Notes
              </h3>
              <p className="text-sm text-gray-700">{request.notes}</p>
            </div>
          )}
        </div>

        {/* Footer with Primary Action */}
        {primaryAction && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            {['auto_created', 'pending_approval'].includes(request.status) && (
              <button
                onClick={() => setRejectDialogOpen(true)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Reject
              </button>
            )}
            <button
              onClick={primaryAction.onClick}
              className={`px-4 py-2 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 ${primaryAction.className}`}
            >
              {primaryAction.icon}
              {primaryAction.label}
            </button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ApproveDialog
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        request={request}
        onSuccess={handleActionSuccess}
      />
      <RejectDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        request={request}
        onSuccess={handleActionSuccess}
      />
      <MarkOrderedDialog
        open={orderedDialogOpen}
        onClose={() => setOrderedDialogOpen(false)}
        request={request}
        onSuccess={handleActionSuccess}
      />
      <MarkShippedDialog
        open={shippedDialogOpen}
        onClose={() => setShippedDialogOpen(false)}
        request={request}
        onSuccess={handleActionSuccess}
      />
      <MarkReceivedDialog
        open={receivedDialogOpen}
        onClose={() => setReceivedDialogOpen(false)}
        request={request}
        onSuccess={handleActionSuccess}
      />
      <AssignDeviceDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        request={request}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
