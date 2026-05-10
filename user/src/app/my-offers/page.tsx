'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { offerService } from '@/services/offers';
import type { Offer } from '@/types';

export default function MyOffersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['my-offers'],
    queryFn: () => offerService.getMyOffers(),
    enabled: isAuthenticated,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => offerService.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => offerService.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
    },
  });

  const getStatusStyle = (offer: Offer) => {
    const isExpired = offer.is_expired;
    if (isExpired) return 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] border border-[var(--color-border)]';
    switch (offer.status) {
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'rejected': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-amber-50 text-amber-700 border border-amber-200';
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
        <div className="flex items-center px-5 h-14">
          <button onClick={() => router.push('/')} className="mr-3 -ml-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-secondary)] transition-colors">
            <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-base text-[var(--color-text-primary)]">My Offers</h1>
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 mx-auto mb-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--color-text-tertiary)]">Loading offers...</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--color-surface-tertiary)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <h2 className="font-bold text-[var(--color-text-primary)] mb-1">No offers yet</h2>
            <p className="text-[var(--color-text-tertiary)] text-sm mb-5">
              Special price offers for your bookings will appear here
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 premium-btn rounded-2xl font-semibold text-sm"
            >
              Browse Parking
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => {
              const isExpired = offer.is_expired;
              const canAct = offer.status === 'pending' && !isExpired;

              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`premium-card p-5 ${isExpired ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 mr-3">
                      <h3 className="font-semibold text-[var(--color-text-primary)]">
                        {offer.sender?.full_name || `Offer #${offer.id}`}
                      </h3>
                      {offer.message && (
                        <p className="text-sm text-[var(--color-text-tertiary)] mt-1">{offer.message}</p>
                      )}
                      {offer.booking && (
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                          Booking #{offer.booking.id}
                          {offer.booking.parking && ` — ${offer.booking.parking.title}`}
                        </p>
                      )}
                    </div>
                    <span className="text-lg font-bold flex-shrink-0 text-[var(--color-primary-600)]">
                      ₾{offer.price_offer?.toFixed(2) ?? '—'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                    <span>
                      {isExpired ? 'Expired' : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusStyle(offer)}`}>
                        {isExpired ? 'Expired' : offer.status}
                      </span>
                      {canAct && (
                        <>
                          <button
                            onClick={() => acceptMutation.mutate(offer.id)}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(offer.id)}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.main>
  );
}
