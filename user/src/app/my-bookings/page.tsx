'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useMyBookings, useCancelBooking } from '@/hooks/useQueries';
import { BookingCardSkeleton } from '@/components/ui/Skeleton';
import { BookingStatus } from '@/types';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  active: { label: 'Active', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  completed: { label: 'Completed', color: 'text-[var(--color-text-tertiary)]', bg: 'bg-[var(--color-surface-tertiary)] border-[var(--color-border)]' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

export default function MyBookingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUIStore();
  const { data: bookings, isLoading, error } = useMyBookings();
  const cancelBooking = useCancelBooking();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const handleCancel = async (id: number) => {
    try {
      await cancelBooking.mutateAsync({ id });
      addToast({ type: 'success', title: 'Booking cancelled' });
    } catch {
      addToast({ type: 'error', title: 'Failed to cancel' });
    }
  };

  const getStatusStyle = (status: BookingStatus) =>
    statusConfig[status] || { label: status, color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[var(--color-surface-secondary)]"
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[var(--color-border-light)] sticky top-0 z-10">
        <div className="flex items-center px-5 h-14">
          <button onClick={() => router.push('/')} className="mr-3 -ml-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-secondary)] transition-colors">
            <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-base text-[var(--color-text-primary)]">My Bookings</h1>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {isLoading && (
          <>
            <BookingCardSkeleton />
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-[var(--color-text-secondary)] font-medium">Failed to load bookings</p>
          </div>
        )}

        {bookings && bookings.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--color-surface-tertiary)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="font-bold text-[var(--color-text-primary)] mb-1">No bookings yet</h2>
            <p className="text-[var(--color-text-tertiary)] text-sm mb-5">Find a parking spot on the map</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 premium-btn rounded-2xl font-semibold text-sm"
            >
              Find Parking
            </Link>
          </div>
        )}

        {bookings?.map((booking) => {
          const status = getStatusStyle(booking.booking_status);
          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
                    {booking.parking?.title || `Parking #${booking.parking_id}`}
                  </h3>
                  <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                    {new Date(booking.start_time).toLocaleString('ka-GE', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    —{' '}
                    {new Date(booking.end_time).toLocaleString('ka-GE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-[var(--color-primary-600)]">{booking.total_price}₾</span>
                {booking.vehicle_plate && (
                  <span className="text-[var(--color-text-tertiary)] text-xs font-mono">{booking.vehicle_plate}</span>
                )}
              </div>

              {(booking.booking_status === 'pending' || booking.booking_status === 'approved') && (
                <button
                  onClick={() => handleCancel(booking.id)}
                  disabled={cancelBooking.isPending}
                  className="mt-3 w-full py-2.5 premium-btn-outline rounded-xl text-sm font-medium text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all disabled:opacity-50"
                >
                  {cancelBooking.isPending ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.main>
  );
}
