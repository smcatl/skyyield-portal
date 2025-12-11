// =============================================================================
// EMPTY STATE COMPONENT
// File: src/components/admin/device-purchases/EmptyState.tsx
// =============================================================================

'use client';

import { Package, Plus } from 'lucide-react';

interface EmptyStateProps {
  onCreateNew: () => void;
}

export default function EmptyState({ onCreateNew }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-gray-100 rounded-full">
          <Package className="h-12 w-12 text-gray-400" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No purchase requests found
      </h3>

      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Purchase requests are created automatically when an LOI is signed (if SkyYield
        is purchasing equipment), or can be created manually using the button below.
      </p>

      <button
        onClick={onCreateNew}
        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors"
      >
        <Plus className="h-5 w-5" />
        New Request
      </button>
    </div>
  );
}
