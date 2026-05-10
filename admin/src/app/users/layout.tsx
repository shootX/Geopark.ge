'use client';

import { ProtectedLayout } from '@/components/layout/protected-layout';

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout requiredPermission="view_users">{children}</ProtectedLayout>;
}
