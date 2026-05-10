'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/store';
import { useRealtime } from '@/hooks/use-realtime';

// ─── Public routes that don't need the admin layout ───
const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password'];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarCollapsed } = useUIStore();
  const [mounted, setMounted] = React.useState(false);

  // Initialize realtime connections
  useRealtime();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    // Skip redirect for public routes
    if (PUBLIC_ROUTES.some((route) => pathname?.startsWith(route))) {
      return;
    }

    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [mounted, isLoading, isAuthenticated, router, pathname]);

  // Don't render admin layout for public routes
  if (PUBLIC_ROUTES.some((route) => pathname?.startsWith(route))) {
    return <>{children}</>;
  }

  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50 dark:bg-gray-950">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        )}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
