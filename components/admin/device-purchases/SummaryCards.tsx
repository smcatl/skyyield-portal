// =============================================================================
// SUMMARY CARDS COMPONENT
// File: src/components/admin/device-purchases/SummaryCards.tsx
// =============================================================================

'use client';

import { PurchaseRequestSummary } from '@/types/purchase-request';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  FileText,
  ShoppingCart,
  Truck,
  Package,
  CheckCircle,
} from 'lucide-react';

interface SummaryCardsProps {
  summary: PurchaseRequestSummary;
  activeFilter: string;
  onCardClick: (status: string) => void;
}

interface CardConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  description: string;
}

const CARDS: CardConfig[] = [
  {
    key: 'pending_approval',
    label: 'Needs Approval',
    icon: <AlertTriangle className="h-6 w-6" />,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-900',
    iconColor: 'text-orange-600',
    description: 'Action Required',
  },
  {
    key: 'auto_created',
    label: 'Auto-Created',
    icon: <FileText className="h-6 w-6" />,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-600',
    description: 'From LOI',
  },
  {
    key: 'ordered',
    label: 'Ordered',
    icon: <ShoppingCart className="h-6 w-6" />,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-900',
    iconColor: 'text-purple-600',
    description: 'In Transit',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    icon: <Truck className="h-6 w-6" />,
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-900',
    iconColor: 'text-indigo-600',
    description: 'On Way',
  },
  {
    key: 'received',
    label: 'Received',
    icon: <Package className="h-6 w-6" />,
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-900',
    iconColor: 'text-teal-600',
    description: 'Ready to Assign',
  },
  {
    key: 'assigned',
    label: 'Assigned',
    icon: <CheckCircle className="h-6 w-6" />,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-900',
    iconColor: 'text-green-600',
    description: 'Complete',
  },
];

export default function SummaryCards({
  summary,
  activeFilter,
  onCardClick,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {CARDS.map((card) => {
        const count = summary[card.key as keyof PurchaseRequestSummary] || 0;
        const isActive = activeFilter === card.key;
        const hasItems = count > 0;

        return (
          <button
            key={card.key}
            onClick={() => onCardClick(card.key)}
            className={cn(
              'relative p-4 rounded-xl border-2 transition-all duration-200',
              'hover:shadow-md hover:scale-[1.02]',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500',
              isActive
                ? `${card.bgColor} ${card.borderColor} shadow-md`
                : 'bg-white border-gray-200 hover:border-gray-300',
              // Highlight if pending approval has items
              card.key === 'pending_approval' && hasItems && !isActive
                ? 'border-orange-300 bg-orange-50/50'
                : ''
            )}
          >
            {/* Badge for pending items */}
            {card.key === 'pending_approval' && hasItems && (
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                {count > 9 ? '9+' : count}
              </span>
            )}

            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div
                className={cn(
                  'mb-2',
                  isActive ? card.iconColor : 'text-gray-400'
                )}
              >
                {card.icon}
              </div>

              {/* Count */}
              <div
                className={cn(
                  'text-2xl font-bold mb-1',
                  isActive ? card.textColor : 'text-gray-900'
                )}
              >
                {count}
              </div>

              {/* Label */}
              <div
                className={cn(
                  'text-sm font-medium',
                  isActive ? card.textColor : 'text-gray-700'
                )}
              >
                {card.label}
              </div>

              {/* Description */}
              <div
                className={cn(
                  'text-xs mt-1',
                  isActive ? card.textColor : 'text-gray-500'
                )}
              >
                {card.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
