'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { bookingService } from '@/services/booking';
import BookingStatusBadge from '@/components/marketplace/BookingStatusBadge';
import BookingTimeline from '@/components/marketplace/BookingTimeline';
import LiveLocationTracker from '@/components/marketplace/LiveLocationTracker';
import RatingStars from '@/components/marketplace/RatingStars';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Booking } from '@/types';

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useUIStore();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Rating modal state
  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadBooking();
  }, [isAuthenticated, id]);

  const loadBooking = async () => {
    try {
      const data = await bookingService.getById(id);
      setBooking(data);
    } catch {
      addToast({ type: 'error', title: 'Failed to load booking' });
      router.push('/my-bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: () => Promise<Booking>) => {
    setActionLoading(true);
    try {
      const updated = await action();
      setBooking(updated);
      addToast({ type: 'success', title: 'Action completed' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed';
      addToast({ type: 'error', title: message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (ratingValue === 0) {
      addToast({ type: 'error', title: 'Please select a rating' });
      return;
    }
    setActionLoading(true);
    try {
      const { ratingService } = await import('@/services/rating');
      await ratingService.submit(id, ratingValue, ratingComment || undefined);
      addToast({ type: 'success', title: 'Rating submitted' });
      setShowRating(false);
      loadBooking();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit rating';
      addToast({ type: 'error', title: message });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="min-h-screen bg-[var(--color-surface-secondary)] p-5"
      >
        <Skeleton className="h-10 w-48 mb-5" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </motion.main>
    );
  }

  if (!booking) return null;

  const isOwner = user && booking.parking_offer?.owner_id === user.id;
  const isRenter = user && booking.user_id === user.id;
  const status = booking.booking_status;

  // Determine what actions to show based on status and role
  const showApproveReject = isOwner && status === 'pending_owner_approval';
  const showStartTrip = isRenter && status === 'approved';
  const showConfirmArrival = isRenter && (status === 'renter_on_the_way' || status === 'owner_waiting');
  const showOwnerConfirmArrival = isOwner && status === 'arrived';
  const showComplete = isRenter && status === 'active';
  const showRate = (status === 'completed' || status === 'active') && (!booking.ratings || booking.ratings.length === 0);

  // Format price display
  const parkingPrice = booking.parking_offer?.hourly_price
    ? `₾${Number(booking.parking_offer.hourly_price).toFixed(2)} / hour`
    : booking.parking?.base_price
      ? `₾${Number(booking.parking.base_price).toFixed(2)} / hour`
      : '';

  const platformFee = booking.transaction?.platform_fee
    ? Number(booking.transaction.platform_fee)
    : 0;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[var(--color-surface-secondary)] pb-24"
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[var(--color-border-light)] sticky top-0 z-10">
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 -ml-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-bold text-base text-[var(--color-text-primary)]">Booking #{booking.id}</h1>
          </div>
          <BookingStatusBadge status={status} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Parking Info */}
        <div className="premium-card p-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">Parking Spot</h2>
          {(booking.parking_offer || booking.parking) ? (
            <div className="flex gap-3">
              {(booking.parking_offer?.images?.[0]?.url || (booking.parking?.images?.[0])) && (
                <img
                  src={booking.parking_offer?.images?.[0]?.url || booking.parking?.images?.[0] || ''}
                  alt="Parking"
                  className="w-16 h-16 rounded-xl object-cover"
                />
              )}
              <div>
                <p className="font-medium text-sm text-[var(--color-text-primary)]">
                  {booking.parking_offer?.title || booking.parking?.title || 'Parking'}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {booking.parking_offer?.address || booking.parking?.address || ''}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{parkingPrice}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-tertiary)]">Parking details not available</p>
          )}
        </div>

        {/* Time Info */}
        <div className="premium-card p-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">Booking Details</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[var(--color-text-tertiary)] text-xs">Start Time</p>
              <p className="font-medium">{formatDate(booking.start_time)}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-tertiary)] text-xs">End Time</p>
              <p className="font-medium">{formatDate(booking.end_time)}</p>
            </div>
            {booking.total_price && (
              <div className="col-span-2">
                <p className="text-[var(--color-text-tertiary)] text-xs">Total Price</p>
                <p className="font-bold text-[var(--color-primary-600)]">
                  ₾{Number(booking.total_price).toFixed(2)}
                  {platformFee > 0 && (
                    <span className="text-xs text-[var(--color-text-tertiary)] font-normal ml-1">
                      (incl. ₾{platformFee.toFixed(2)} fee)
                    </span>
                  )}
                </p>
              </div>
            )}
            {booking.cancellation_reason && (
              <div className="col-span-2">
                <p className="text-[var(--color-text-tertiary)] text-xs">Cancellation Reason</p>
                <p className="font-medium text-red-600">{booking.cancellation_reason}</p>
              </div>
            )}
            {booking.rejection_reason && (
              <div className="col-span-2">
                <p className="text-[var(--color-text-tertiary)] text-xs">Rejection Reason</p>
                <p className="font-medium text-red-600">{booking.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="premium-card p-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">
            {isOwner ? 'Renter' : 'Owner'}
          </h2>
          {isOwner && booking.user ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-600)] font-bold text-sm">
                {booking.user.full_name?.[0] || '?'}
              </div>
              <div>
                <p className="font-medium text-sm">{booking.user.full_name}</p>
                {booking.user.average_rating && booking.user.average_rating > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <RatingStars rating={booking.user.average_rating} size="sm" />
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      ({booking.user.total_reviews || 0})
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : isRenter && booking.parking_offer?.owner ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-600)] font-bold text-sm">
                {booking.parking_offer.owner.full_name?.[0] || '?'}
              </div>
              <div>
                <p className="font-medium text-sm">{booking.parking_offer.owner.full_name}</p>
                {booking.parking_offer.owner.average_rating && booking.parking_offer.owner.average_rating > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <RatingStars rating={booking.parking_offer.owner.average_rating} size="sm" />
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      ({booking.parking_offer.owner.total_reviews || 0})
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-tertiary)]">User info not available</p>
          )}
        </div>

        {/* Timeline */}
        <BookingTimeline booking={booking} />

        {/* Live Location Tracker */}
        {(status === 'approved' || status === 'renter_on_the_way' ||
          status === 'owner_waiting' || status === 'arrived') && (
          <LiveLocationTracker booking={booking} isRenter={!!isRenter} />
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {showApproveReject && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(() => bookingService.approve(id))}
                disabled={actionLoading}
                className="flex-1 py-3 bg-green-600 text-white rounded-2xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Reason for rejection (optional):');
                  handleAction(() => bookingService.reject(id, reason || undefined));
                }}
                disabled={actionLoading}
                className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}

          {showStartTrip && (
            <button
              onClick={() => handleAction(() => bookingService.startTrip(id))}
              disabled={actionLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-2xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : "Start Trip — I'm on my way"}
            </button>
          )}

          {showConfirmArrival && (
            <button
              onClick={() => handleAction(() => bookingService.confirmArrival(id))}
              disabled={actionLoading}
              className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Confirm Arrival'}
            </button>
          )}

          {showOwnerConfirmArrival && (
            <button
              onClick={async () => {
                const { locationService } = await import('@/services/location');
                handleAction(() => locationService.ownerConfirmArrival(id));
              }}
              disabled={actionLoading}
              className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Confirm Renter Arrived'}
            </button>
          )}

          {showComplete && (
            <button
              onClick={() => handleAction(() => bookingService.completeLifecycle(id))}
              disabled={actionLoading}
              className="w-full py-3 bg-purple-600 text-white rounded-2xl font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Complete Booking'}
            </button>
          )}

          {status === 'cancelled' && (
            <p className="text-xs text-center text-[var(--color-text-tertiary)]">
              This booking has been cancelled
            </p>
          )}

          {showRate && (
            <button
              onClick={() => setShowRating(true)}
              className="w-full py-3 bg-amber-500 text-white rounded-2xl font-semibold text-sm hover:bg-amber-600 transition-colors"
            >
              Rate {isOwner ? 'Renter' : 'Owner'}
            </button>
          )}
        </div>

        {/* Ratings Display */}
        {booking.ratings && booking.ratings.length > 0 && (
          <div className="premium-card p-5">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">Ratings</h2>
            {booking.ratings.map((rating, idx) => (
              <div key={rating.id || idx} className="flex items-start gap-3 py-2 border-b border-[var(--color-border-light)] last:border-0">
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center text-xs font-bold">
                  {rating.from_user?.full_name?.[0] || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{rating.from_user?.full_name || 'User'}</p>
                    <RatingStars rating={rating.rating} size="sm" />
                  </div>
                  {rating.comment && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{rating.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="font-semibold text-[var(--color-text-primary)] text-center mb-4">
              Rate your experience
            </h3>

            <div className="flex justify-center mb-4">
              <RatingStars
                rating={ratingValue}
                interactive
                size="lg"
                onChange={setRatingValue}
              />
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Write a comment (optional)..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm outline-none resize-none mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowRating(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--color-border-light)] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={actionLoading || ratingValue === 0}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.main>
  );
}
