// =============================================================================
// USE PURCHASE REQUESTS HOOK
// File: src/hooks/usePurchaseRequests.ts
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PurchaseRequest,
  PurchaseRequestSummary,
  PurchaseRequestFilters,
  PaginationInfo,
} from '@/types/purchase-request';
import { fetchPurchaseRequests } from '@/lib/api/purchase-requests';

interface UsePurchaseRequestsReturn {
  data: PurchaseRequest[];
  summary: PurchaseRequestSummary;
  pagination: PaginationInfo;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setSort: (field: string, order: 'asc' | 'desc') => void;
}

const DEFAULT_SUMMARY: PurchaseRequestSummary = {
  pending_approval: 0,
  auto_created: 0,
  approved: 0,
  ordered: 0,
  shipped: 0,
  received: 0,
  assigned: 0,
  cancelled: 0,
  total: 0,
};

const DEFAULT_PAGINATION: PaginationInfo = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

export function usePurchaseRequests(
  filters: PurchaseRequestFilters
): UsePurchaseRequestsReturn {
  const [data, setData] = useState<PurchaseRequest[]>([]);
  const [summary, setSummary] = useState<PurchaseRequestSummary>(DEFAULT_SUMMARY);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchPurchaseRequests(
        filters,
        page,
        20,
        sortField,
        sortOrder
      );

      setData(response.data);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData([]);
      setSummary(DEFAULT_SUMMARY);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.source, filters.ownership, filters.search]);

  const setSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
  }, []);

  return {
    data,
    summary,
    pagination,
    isLoading,
    error,
    refetch: fetchData,
    setPage,
    setSort,
  };
}

// =============================================================================
// USE SINGLE PURCHASE REQUEST HOOK
// =============================================================================

import { fetchPurchaseRequest } from '@/lib/api/purchase-requests';

interface UsePurchaseRequestReturn {
  data: PurchaseRequest | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePurchaseRequest(id: string | null): UsePurchaseRequestReturn {
  const [data, setData] = useState<PurchaseRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchPurchaseRequest(id);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
