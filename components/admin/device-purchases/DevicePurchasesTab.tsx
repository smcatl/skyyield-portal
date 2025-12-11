// =============================================================================
// DEVICE PURCHASES TAB - MAIN CONTAINER
// File: src/components/admin/device-purchases/DevicePurchasesTab.tsx
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { usePurchaseRequests } from '@/hooks/usePurchaseRequests';
import { PurchaseRequestFilters } from '@/types/purchase-request';
import SummaryCards from './SummaryCards';
import FilterBar from './FilterBar';
import PurchaseRequestsTable from './PurchaseRequestsTable';
import CreateRequestModal from './CreateRequestModal';
import RequestDetailModal from './RequestDetailModal';
import EmptyState from './EmptyState';
import { AlertTriangle } from 'lucide-react';

export default function DevicePurchasesTab() {
  // Filters state
  const [filters, setFilters] = useState<PurchaseRequestFilters>({
    status: '',
    source: '',
    ownership: '',
    search: '',
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Fetch data
  const {
    data,
    summary,
    pagination,
    isLoading,
    error,
    refetch,
    setPage,
    setSort,
  } = usePurchaseRequests(filters);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (newFilters: Partial<PurchaseRequestFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  // Handle card click (quick filter)
  const handleCardClick = useCallback((status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status === status ? '' : status,
    }));
  }, []);

  // Handle view details
  const handleViewDetails = useCallback((id: string) => {
    setSelectedRequestId(id);
  }, []);

  // Handle create success
  const handleCreateSuccess = useCallback(() => {
    setShowCreateModal(false);
    refetch();
  }, [refetch]);

  // Handle detail close
  const handleDetailClose = useCallback(() => {
    setSelectedRequestId(null);
  }, []);

  // Handle action success (from table or detail modal)
  const handleActionSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Alert Banner - Pending Approvals */}
      {summary.pending_approval > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="text-orange-800 font-medium">
              {summary.pending_approval} purchase request
              {summary.pending_approval > 1 ? 's' : ''} require
              {summary.pending_approval === 1 ? 's' : ''} your approval
            </span>
          </div>
          <button
            onClick={() => handleFilterChange({ status: 'pending_approval' })}
            className="text-orange-600 font-semibold hover:underline"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <SummaryCards
        summary={summary}
        activeFilter={filters.status}
        onCardClick={handleCardClick}
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onCreateNew={() => setShowCreateModal(true)}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Data Table or Empty State */}
      {!isLoading && data.length === 0 ? (
        <EmptyState onCreateNew={() => setShowCreateModal(true)} />
      ) : (
        <PurchaseRequestsTable
          data={data}
          isLoading={isLoading}
          pagination={pagination}
          onViewDetails={handleViewDetails}
          onActionSuccess={handleActionSuccess}
          onPageChange={setPage}
          onSort={setSort}
        />
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <CreateRequestModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Request Detail Modal */}
      {selectedRequestId && (
        <RequestDetailModal
          requestId={selectedRequestId}
          onClose={handleDetailClose}
          onUpdate={handleActionSuccess}
        />
      )}
    </div>
  );
}
