'use client';

import { AdminLayout } from '@/components/layout/admin-layout';
import { PageGuard } from '@/components/auth/permission-guard';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export function ProtectedLayout({ children, requiredPermission, requiredRole }: ProtectedLayoutProps) {
  return (
    <AdminLayout>
      <PageGuard requiredPermission={requiredPermission} requiredRole={requiredRole}>
        {children}
      </PageGuard>
    </AdminLayout>
  );
}
