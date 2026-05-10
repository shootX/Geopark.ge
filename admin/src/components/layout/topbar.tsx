'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Search, Bell, Sun, Moon, Monitor,
  ChevronDown, User, Settings as SettingsIcon,
  LogOut, Shield, Home
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUIStore, useAuthStore, useNotificationStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

// ─── Breadcrumbs ───
function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname?.split('/').filter(Boolean) || [];

  const breadcrumbLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    users: 'Users',
    parkings: 'Parkings',
    bookings: 'Bookings',
    offers: 'Offers',
    pricing: 'Pricing Engine',
    notifications: 'Notifications',
    reports: 'Reports',
    settings: 'Settings',
  };

  if (pathname === '/dashboard') return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Dashboard home">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;
        const label = breadcrumbLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        return (
          <React.Fragment key={segment}>
            <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">/</span>
            {isLast ? (
              <span className="font-medium text-gray-900 dark:text-gray-100" aria-current="page">{label}</span>
            ) : (
              <Link href={href} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── Global Search ───
function GlobalSearch() {
  const { searchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  return (
    <>
      <button
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-gray-200/50 bg-gray-50/50 px-3 py-1.5 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-600 dark:border-gray-700/50 dark:bg-gray-800/50 dark:hover:border-gray-600 dark:hover:text-gray-300 transition-all w-56 lg:w-64"
        aria-label="Open search (Ctrl+K)"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span>Search...</span>
        <kbd className="ml-auto hidden rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-800 lg:inline-flex" aria-hidden="true">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
              role="dialog"
              aria-label="Search"
            >
              <div className="overflow-hidden rounded-2xl border border-gray-200/50 bg-white shadow-2xl dark:border-gray-700/50 dark:bg-gray-900">
                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search pages, users, parkings..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                    aria-label="Search query"
                  />
                  <kbd className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-700 dark:bg-gray-800" aria-hidden="true">
                    ESC
                  </kbd>
                </div>
                <div className="p-2">
                  <div className="rounded-xl bg-gray-50 p-3 text-center text-sm text-gray-500 dark:bg-gray-800/50" role="status">
                    {query ? 'No results found' : 'Type to search...'}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Notification Center ───
function NotificationCenter() {
  const { unreadCount, notifications, markAllAsRead, isOpen, setIsOpen } = useNotificationStore();

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white" aria-hidden="true">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" aria-label="Notifications">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
              className="text-xs font-normal text-blue-600 hover:text-blue-700 dark:text-blue-400"
              aria-label="Mark all as read"
            >
              Mark all as read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto" role="list">
          {notifications.length === 0 ? (
            <div className="px-3 py-8 text-center" role="status">
              <Bell className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" aria-hidden="true" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
            </div>
          ) : (
            notifications.slice(0, 10).map((notif) => (
              <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 py-3" role="listitem">
                <div className="flex items-start gap-2 w-full">
                  {!notif.read_at && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="Unread notification" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {notif.data?.title || 'Notification'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {notif.data?.message}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-4">
                  {formatRelativeTime(notif.created_at)}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center text-sm text-blue-600 dark:text-blue-400">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Theme Switcher ───
function ThemeSwitcher() {
  const { theme, setTheme } = useUIStore();

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={`Theme: ${theme}`}
        >
          {theme === 'dark' ? <Moon className="h-5 w-5" aria-hidden="true" /> :
           theme === 'light' ? <Sun className="h-5 w-5" aria-hidden="true" /> :
           <Monitor className="h-5 w-5" aria-hidden="true" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label="Theme selection">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
          <Sun className="h-4 w-4" aria-hidden="true" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
          <Moon className="h-4 w-4" aria-hidden="true" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
          <Monitor className="h-4 w-4" aria-hidden="true" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── User Dropdown ───
function UserDropdown() {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label={`User menu: ${user.full_name}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold" aria-hidden="true">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden text-left lg:block">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none">{user.full_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{user.role}</p>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-gray-400 lg:block" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" aria-label="User menu">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold" aria-hidden="true">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs font-normal text-gray-500">{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="gap-2"><User className="h-4 w-4" aria-hidden="true" /> Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="gap-2"><SettingsIcon className="h-4 w-4" aria-hidden="true" /> Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => { e.preventDefault(); logout(); }}
          className="gap-2 text-red-600 dark:text-red-400"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Topbar ───
export function Topbar() {
  const { setMobileMenuOpen } = useUIStore();

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-950/80">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Breadcrumbs />
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          <ThemeSwitcher />
          <NotificationCenter />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
