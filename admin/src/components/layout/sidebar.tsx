'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Car, CalendarCheck, Percent,
  DollarSign, Bell, BarChart3, Settings, ChevronLeft,
  ChevronRight, Menu, X, ParkingSquare, LogOut,
  Shield, Wallet, CreditCard, Star, Building2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/store';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/auth/permission-guard';

// ─── Navigation Items with Permission Requirements ───
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  role?: string;
}

const navigationItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/users', icon: Users, permission: 'view_users' },
  { label: 'User Vehicles', href: '/user-cars', icon: Car },
  { label: 'Parkings', href: '/parkings', icon: ParkingSquare },
  { label: 'Bookings', href: '/bookings', icon: CalendarCheck },
  { label: 'Offers', href: '/offers', icon: Percent },
  { label: 'Parking Offers', href: '/parking-offers', icon: Building2 },
  { label: 'Wallets', href: '/wallets', icon: Wallet },
  { label: 'Transactions', href: '/transactions', icon: CreditCard },
  { label: 'Pricing Engine', href: '/pricing', icon: DollarSign },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

// ─── Sidebar ───
export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { user, hasPermission, hasRole } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Filter nav items by permissions
  const visibleItems = navigationItems.filter((item) => {
    if (!mounted) return true;
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.role && !hasRole(item.role)) return false;
    return true;
  });

  // ─── Shared sidebar content ───
  const renderSidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100/50 dark:border-gray-800/50">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25">
            <Car className="h-4 w-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent"
            >
              Geopark
            </motion.span>
          )}
        </Link>
        <button
          onClick={() => {
            if (mobileMenuOpen) setMobileMenuOpen(false);
            else toggleSidebarCollapsed();
          }}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:flex hidden"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" role="navigation" aria-label="Sidebar navigation">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 dark:from-blue-950/50 dark:to-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-950/50 dark:to-blue-900/30"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={cn(
                'relative z-10 h-5 w-5 shrink-0',
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
              )} />
              {!sidebarCollapsed && (
                <span className="relative z-10">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      {mounted && !sidebarCollapsed && user && (
        <div className="border-t border-gray-100/50 dark:border-gray-800/50 p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold"
              aria-hidden="true"
            >
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.full_name}</p>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{user.role}</span>
                <Shield className="h-3 w-3 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-screen bg-white/80 backdrop-blur-xl border-r border-gray-200/50 dark:bg-gray-950/80 dark:border-gray-800/50 transition-all duration-300 hidden lg:block',
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        )}
        aria-label="Admin sidebar"
      >
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-72 bg-white dark:bg-gray-950 shadow-2xl lg:hidden"
              aria-label="Mobile sidebar"
            >
              {renderSidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
