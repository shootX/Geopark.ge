'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useNotificationCount } from '@/hooks/useQueries';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

export function TopNav() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { data: unreadCount = 0 } = useNotificationCount();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 safe-top pointer-events-none">
      <div className="flex items-center justify-between px-5 py-3 pointer-events-auto">
        {/* Logo — minimalist, premium */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/50 group-hover:shadow-xl group-hover:shadow-emerald-200/60 transition-shadow">
            <span className="text-white font-bold text-base tracking-tight">G</span>
          </div>
          <span className="font-bold text-lg text-white drop-shadow-sm tracking-tight">
            GeoPark
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          {isAuthenticated ? (
            <>
              {/* Notifications bell */}
              <Link
                href="/notifications"
                className="relative w-10 h-10 glass rounded-full flex items-center justify-center shadow-lg hover:bg-white/95 transition-all"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile avatar */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-10 h-10 glass rounded-full flex items-center justify-center shadow-lg hover:bg-white/95 transition-all overflow-hidden"
                  aria-label="Profile menu"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[var(--color-primary-600)] font-bold text-sm">
                      {user?.first_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-2.5 w-56 bg-white rounded-2xl shadow-xl border border-[var(--color-border-light)] overflow-hidden"
                    >
                      {/* User info */}
                      <div className="px-4 py-3.5 border-b border-[var(--color-border-light)]">
                        <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                          {user?.full_name}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                          {user?.email}
                        </p>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <DropdownItem href="/profile" label="Profile" icon={
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        } />
                        <DropdownItem href="/my-bookings" label="My Bookings" icon={
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        } />
                        <DropdownItem href="/my-offers" label="My Offers" icon={
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                          </svg>
                        } />
                        <DropdownItem href="/my-parking-offers" label="My Parking Offers" icon={
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          </svg>
                        } />
                        <DropdownItem href="/wallet" label="Wallet" icon={
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        } />
                      </div>

                      {/* Sign out */}
                      <div className="border-t border-[var(--color-border-light)] py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="glass text-[var(--color-text-primary)] font-semibold px-5 py-2.5 rounded-full shadow-lg hover:bg-white/95 transition-all text-sm btn-press"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function DropdownItem({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="w-full px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] flex items-center gap-3 transition-colors"
    >
      <span className="text-[var(--color-text-tertiary)]">{icon}</span>
      {label}
    </Link>
  );
}
