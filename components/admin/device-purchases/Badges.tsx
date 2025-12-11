import { PurchaseRequestStatus, DeviceOwnership, PurchaseRequestSource, STATUS_CONFIG, OWNERSHIP_CONFIG, SOURCE_CONFIG } from '@/lib/types/purchase-request';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: PurchaseRequestStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{status}</span>;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium', config.bgColor, config.textColor, size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm')}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

interface OwnershipBadgeProps {
  ownership: DeviceOwnership;
  size?: 'sm' | 'md';
}

export function OwnershipBadge({ ownership, size = 'md' }: OwnershipBadgeProps) {
  const config = OWNERSHIP_CONFIG[ownership];
  if (!config) return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{ownership}</span>;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium', config.bgColor, config.textColor, size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm')}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

interface SourceBadgeProps {
  source: PurchaseRequestSource;
  size?: 'sm' | 'md';
}

export function SourceBadge({ source, size = 'md' }: SourceBadgeProps) {
  const config = SOURCE_CONFIG[source];
  if (!config) return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{source}</span>;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium', config.bgColor, config.textColor, size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm')} title={`Source: ${config.label}`}>
      <span>{config.icon}</span>
      {size === 'md' && <span>{config.label}</span>}
    </span>
  );
}
