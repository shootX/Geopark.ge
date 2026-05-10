'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import ParkingOfferCard from '@/components/marketplace/ParkingOfferCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ParkingOfferFilters } from '@/types';

function OfferGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden">
          <Skeleton className="h-40 w-full" />
          <div className="p-4 space-y-2">
            <Skeleton variant="text" className="w-2/3" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OffersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { offers, offersLoading, fetchOffers, offerFilters, setOfferFilters, clearOfferFilters } =
    useMarketplaceStore();

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleBook = (offerId: number) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    router.push(`/booking?parkingOfferId=${offerId}`);
  };

  const parkingTypes = [
    { value: '', label: 'All Types' },
    { value: 'private', label: 'Private' },
    { value: 'municipal', label: 'Municipal' },
  ];

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[var(--color-surface-secondary)] pb-20"
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[var(--color-border-light)] sticky top-0 z-10">
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center">
            <button onClick={() => router.push('/')} className="mr-3 -ml-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-secondary)] transition-colors">
              <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-bold text-base text-[var(--color-text-primary)]">Parking Offers</h1>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-4 space-y-3 border-t border-[var(--color-border-light)] pt-3"
          >
            <div className="flex gap-3">
              <select
                value={offerFilters.parking_type || ''}
                onChange={(e) => {
                  setOfferFilters({ parking_type: e.target.value || undefined });
                  fetchOffers({ parking_type: e.target.value || undefined });
                }}
                className="flex-1 premium-input text-sm"
              >
                {parkingTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Max price"
                value={offerFilters.max_price ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setOfferFilters({ max_price: val });
                  fetchOffers({ max_price: val });
                }}
                className="flex-1 premium-input text-sm"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Radius (km)"
                value={offerFilters.radius ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setOfferFilters({ radius: val });
                }}
                className="flex-1 premium-input text-sm"
              />
              <button
                onClick={() => {
                  clearOfferFilters();
                  fetchOffers({});
                }}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-secondary)]"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {offersLoading ? (
          <OfferGridSkeleton />
        ) : offers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--color-surface-tertiary)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <h2 className="font-bold text-[var(--color-text-primary)] mb-1">No offers available</h2>
            <p className="text-[var(--color-text-tertiary)] text-sm mb-5">
              Check back later for available parking offers
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 premium-btn rounded-2xl font-semibold text-sm"
            >
              Browse Map
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {offers.map((offer) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ParkingOfferCard
                  offer={offer}
                  onBook={handleBook}
                  showActions={true}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.main>
  );
}
