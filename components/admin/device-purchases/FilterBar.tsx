// =============================================================================
// FILTER BAR COMPONENT
// File: src/components/admin/device-purchases/FilterBar.tsx
// =============================================================================

'use client';

import { useState, useEffect } from 'react';
import { PurchaseRequestFilters } from '@/lib/types/purchase-request';
import { Search, Plus, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface FilterBarProps {
  filters: PurchaseRequestFilters;
  onFilterChange: (filters: Partial<PurchaseRequestFilters>) => void;
  onCreateNew: () => void;
}

// Status options
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_approval', label: '⚠️ Pending Approval' },
  { value: 'auto_created', label: '📋 Auto-Created' },
  { value: 'approved', label: '✅ Approved' },
  { value: 'ordered', label: '🛒 Ordered' },
  { value: 'shipped', label: '🚚 Shipped' },
  { value: 'received', label: '📦 Received' },
  { value: 'assigned', label: '✅ Assigned' },
  { value: 'cancelled', label: '❌ Cancelled' },
];

// Source options
const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'loi_auto', label: '📋 LOI Auto-Created' },
  { value: 'employee_request', label: '👤 Employee Request' },
  { value: 'admin', label: '👑 Admin Created' },
];

// Ownership options
const OWNERSHIP_OPTIONS = [
  { value: '', label: 'All Ownership' },
  { value: 'skyyield', label: '🏢 SkyYield Owned' },
  { value: 'partner', label: '👤 Partner Owned' },
  { value: 'existing', label: '🏠 Existing' },
];

export default function FilterBar({
  filters,
  onFilterChange,
  onCreateNew,
}: FilterBarProps) {
  // Local search state with debounce
  const [searchValue, setSearchValue] = useState(filters.search);
  const debouncedSearch = useDebounce(searchValue, 300);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ search: debouncedSearch });
    }
  }, [debouncedSearch, filters.search, onFilterChange]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.status || filters.source || filters.ownership || filters.search;

  // Clear all filters
  const clearFilters = () => {
    setSearchValue('');
    onFilterChange({
      status: '',
      source: '',
      ownership: '',
      search: '',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by request #, partner, product, venue..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-w-[160px]"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={filters.source}
            onChange={(e) => onFilterChange({ source: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-w-[160px]"
          >
            {SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Ownership Filter */}
          <select
            value={filters.ownership}
            onChange={(e) => onFilterChange({ ownership: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-w-[160px]"
          >
            {OWNERSHIP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}

          {/* Create New Button */}
          <button
            onClick={onCreateNew}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            New Request
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// useDebounce Hook (if not already in your project)
// =============================================================================
// File: src/hooks/useDebounce.ts

/*
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
*/
