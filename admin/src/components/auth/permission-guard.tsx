'use client';

import * as React from 'react';
import { useAuthStore } from '@/store';

// ─── PermissionGuard ───
// Renders children only if user has the required permission.
// Falls back to <Fallback> component if provided, otherwise null.
interface PermissionGuardProps {
  permission?: string;
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  permission,
  role,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasRole } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ─── RequireAuth ───
// Wraps protected pages. Redirects to login if not authenticated.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR / first mount, show nothing
  if (!mounted) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />
      </div>
    );
  }

  // Not authenticated — the admin-layout will handle redirect
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// ─── PageGuard ───
// Combination: checks auth + permission in one component
interface PageGuardProps {
  requiredPermission?: string;
  requiredRole?: string;
  children: React.ReactNode;
}

export function PageGuard({ requiredPermission, requiredRole, children }: PageGuardProps) {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Access Denied</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          You do not have the required role to access this page.
        </p>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Access Denied</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Internal Shield Icon ───
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}
