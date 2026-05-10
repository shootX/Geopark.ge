'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useNotifications } from '@/hooks/useQueries';
import { notificationService } from '@/services/notifications';
import { useQueryClient } from '@tanstack/react-query';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUIStore();
  const { data: notifications, isLoading } = useNotifications();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      addToast({ type: 'success', title: 'All marked as read' });
    } catch {
      addToast({ type: 'error', title: 'Failed to mark as read' });
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAll();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      addToast({ type: 'success', title: 'Notifications cleared' });
    } catch {
      addToast({ type: 'error', title: 'Failed to clear' });
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[var(--color-surface-secondary)]"
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[var(--color-border-light)] sticky top-0 z-10">
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center">
            <button onClick={() => router.back()} className="mr-3 -ml-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-secondary)] transition-colors">
              <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-bold text-base text-[var(--color-text-primary)]">Notifications</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handleMarkAllRead} className="text-xs text-[var(--color-primary-600)] font-semibold hover:text-[var(--color-primary-700)] transition-colors">
              Mark Read
            </button>
            <button onClick={handleClearAll} className="text-xs text-red-500 font-semibold hover:text-red-600 transition-colors">
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="p-5">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="premium-card p-5">
                <div className="h-4 skeleton-shimmer rounded-lg w-2/3 mb-2" />
                <div className="h-3 skeleton-shimmer rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        )}

        {notifications && notifications.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--color-surface-tertiary)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="font-bold text-[var(--color-text-primary)] mb-1">No notifications</h2>
            <p className="text-[var(--color-text-tertiary)] text-sm">You're all caught up!</p>
          </div>
        )}

        <div className="space-y-2">
          {notifications?.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`premium-card p-4 ${
                !notification.read_at
                  ? 'border-[var(--color-primary-200)] bg-[var(--color-primary-50)]'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {!notification.read_at && (
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary-500)] mt-2 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--color-text-primary)]">
                    {notification.data?.message as string || notification.type}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    {new Date(notification.created_at).toLocaleString('ka-GE', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.main>
  );
}
