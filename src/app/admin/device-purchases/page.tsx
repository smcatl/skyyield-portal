// =============================================================================
// DEVICE PURCHASES - MAIN PAGE
// File: src/app/admin/device-purchases/page.tsx
// =============================================================================

import { Metadata } from 'next';
import DevicePurchasesTab from '@/components/admin/device-purchases/DevicePurchasesTab';

export const metadata: Metadata = {
  title: 'Device Purchases | SkyYield Admin',
  description: 'Manage device purchase requests',
};

export default function DevicePurchasesPage() {
  return <DevicePurchasesTab />;
}
