'use client';

import { ProtectedLayout } from '@/components/layout/protected-layout';

export default function FeatureLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
