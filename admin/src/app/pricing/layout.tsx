'use client';

import { ProtectedLayout } from '@/components/layout/protected-layout';

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
