// =============================================================================
// PURCHASE REQUESTS TABLE COMPONENT
// File: src/components/admin/device-purchases/PurchaseRequestsTable.tsx
// =============================================================================

'use client';

import { useState } from 'react';
import {
  PurchaseRequest,
  PurchaseRequestStatus,
  PaginationInfo,
} from '@/types/purchase-request';
import { StatusBadge, OwnershipBadge, SourceBadge } from './Badges';
import {
  Eye,
  Check,
  X,
  ShoppingCart,
  Truck,
  Package,
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  approvePurchaseRequest,
  cancelPurchaseRequest,
} from '@/lib/api/purchase-requests';
import { toast } from 'sonner';
import { ApproveDialog, RejectDialog, MarkOrderedDialog, MarkShippedDialog, MarkReceivedDialog, AssignDeviceDialog } from './dialogs';

interface PurchaseRequestsTableProps {
  data: PurchaseRequest[];
  isLoading: boolean;
  pagination: PaginationInfo;
  onViewDetails: (id: string) => void;
  onActionSuccess: () => void;
  onPageChange: (page: number) => void;
  onSort: (field: string, order: 'asc' | 'desc') => void;
}

type SortField = 'request_number' | 'created_at' | 'total_cost' | 'status';

export default function PurchaseRequestsTable({
  data,
  isLoading,
  pagination,
  onViewDetails,
  onActionSuccess,
  onPageChange,
  onSort,
}: PurchaseRequestsTableProps) {
  // Sort state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [orderedDialogOpen, setOrderedDialogOpen] = useState(false);
  const [shippedDialogOpen, setShippedDialogOpen] = useState(false);
  const [receivedDialogOpen, setReceivedDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  // Handle sort
  const handleSort = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    onSort(field, newOrder);
  };

  // Sort indicator
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  // Get available actions for a request
  const getAvailableActions = (request: PurchaseRequest) => {
    const actions: Array<{
      key: string;
      icon: React.ReactNode;
      label: string;
      onClick: () => void;
      variant?: 'success' | 'danger' | 'primary' | 'default';
    }> = [];

    switch (request.status) {
      case 'auto_created':
      case 'pending_approval':
        actions.push({
          key: 'approve',
          icon: <Check className="h-4 w-4" />,
          label: 'Approve',
          onClick: () => {
            setSelectedRequest(request);
            setApproveDialogOpen(true);
          },
          variant: 'success',
        });
        actions.push({
          key: 'reject',
          icon: <X className="h-4 w-4" />,
          label: 'Reject',
          onClick: () => {
            setSelectedRequest(request);
            setRejectDialogOpen(true);
          },
          variant: 'danger',
        });
        break;

      case 'approved':
        actions.push({
          key: 'ordered',
          icon: <ShoppingCart className="h-4 w-4" />,
          label: 'Mark Ordered',
          onClick: () => {
            setSelectedRequest(request);
            setOrderedDialogOpen(true);
          },
          variant: 'primary',
        });
        break;

      case 'ordered':
        actions.push({
          key: 'shipped',
          icon: <Truck className="h-4 w-4" />,
          label: 'Mark Shipped',
          onClick: () => {
            setSelectedRequest(request);
            setShippedDialogOpen(true);
          },
          variant: 'primary',
        });
        break;

      case 'shipped':
        actions.push({
          key: 'received',
          icon: <Package className="h-4 w-4" />,
          label: 'Mark Received',
          onClick: () => {
            setSelectedRequest(request);
            setReceivedDialogOpen(true);
          },
          variant: 'primary',
        });
        break;

      case 'received':
        actions.push({
          key: 'assign',
          icon: <MapPin className="h-4 w-4" />,
          label: 'Assign',
          onClick: () => {
            setSelectedRequest(request);
            setAssignDialogOpen(true);
          },
          variant: 'success',
        });
        break;
    }

    // Always add view action
    actions.push({
      key: 'view',
      icon: <Eye className="h-4 w-4" />,
      label: 'View',
      onClick: () => onViewDetails(request.id),
      variant: 'default',
    });

    return actions;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('request_number')}
              >
                <div className="flex items-center gap-1">
                  Request #
                  <SortIndicator field="request_number" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Partner
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Venue
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Qty
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total_cost')}
              >
                <div className="flex items-center justify-end gap-1">
                  Total
                  <SortIndicator field="total_cost" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ownership
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIndicator field="status" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Created
                  <SortIndicator field="created_at" />
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((request) => {
              const actions = getAvailableActions(request);

              return (
                <tr
                  key={request.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Request # */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-900">
                      {request.request_number}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3">
                    <SourceBadge source={request.source} size="sm" />
                  </td>

                  {/* Partner */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900">
                      {request.location_partner?.company_legal_name || '—'}
                    </span>
                  </td>

                  {/* Venue */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {request.venue?.venue_name || '—'}
                    </span>
                  </td>

                  {/* Product */}
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-sm text-gray-900 block">
                        {request.product?.name || request.product_name || '—'}
                      </span>
                      {(request.product?.sku || request.product_sku) && (
                        <span className="text-xs text-gray-500">
                          ({request.product?.sku || request.product_sku})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {request.quantity}
                    </span>
                  </td>

                  {/* Total Cost */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(request.total_cost)}
                    </span>
                  </td>

                  {/* Ownership */}
                  <td className="px-4 py-3">
                    <OwnershipBadge ownership={request.ownership} size="sm" />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} size="sm" />
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {formatRelativeTime(request.created_at)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {actions.slice(0, 3).map((action) => (
                        <button
                          key={action.key}
                          onClick={action.onClick}
                          title={action.label}
                          className={`p-1.5 rounded-lg transition-colors ${
                            action.variant === 'success'
                              ? 'text-green-600 hover:bg-green-100'
                              : action.variant === 'danger'
                              ? 'text-red-600 hover:bg-red-100'
                              : action.variant === 'primary'
                              ? 'text-cyan-600 hover:bg-cyan-100'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {selectedRequest && (
        <>
          <ApproveDialog
            open={approveDialogOpen}
            onClose={() => setApproveDialogOpen(false)}
            request={selectedRequest}
            onSuccess={onActionSuccess}
          />
          <RejectDialog
            open={rejectDialogOpen}
            onClose={() => setRejectDialogOpen(false)}
            request={selectedRequest}
            onSuccess={onActionSuccess}
          />
          <MarkOrderedDialog
            open={orderedDialogOpen}
            onClose={() => setOrderedDialogOpen(false)}
            request={selectedRequest}
            onSuccess={onActionSuccess}
          />
          <MarkShippedDialog
            open={shippedDialogOpen}
            onClose={() => setShippedDialogOpen(false)}
            request={selectedRequest}
            onSuccess={onActionSuccess}
          />
          <MarkReceivedDialog
            open={receivedDialogOpen}
            onClose={() => setReceivedDialogOpen(false)}
            request={selectedRequest}
            onSuccess={onActionSuccess}
          />
          <AssignDeviceDialog
            open={assignDialogOpen}
            onClose={() => setAssignDialogOpen(false)}
            request={selectedRequest}
            onSuccess={onActionSuccess}
          />
        </>
      )}
    </div>
  );
}
