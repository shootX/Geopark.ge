'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import type { ParkingOffer } from '@/types';
import ParkingOfferCard from '@/components/marketplace/ParkingOfferCard';
import { Skeleton } from '@/components/ui/Skeleton';

export default function MyParkingOffersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    myOffers,
    offersLoading,
    fetchMyOffers,
    activateOffer,
    pauseOffer,
    deleteOffer,
    setSelectedOffer,
  } = useMarketplaceStore();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchMyOffers();
  }, [isAuthenticated, fetchMyOffers, router]);

  const filteredOffers = myOffers.filter((o) => {
    if (activeTab === 'active') return o.status === 'active';
    if (activeTab === 'inactive') return o.status === 'draft' || o.status === 'paused';
    return true;
  });

  const handleEdit = (offer: ParkingOffer) => {
    router.push(`/my-parking-offers/${offer.id}/edit`);
  };

  const handleToggle = async (offer: ParkingOffer) => {
    if (offer.status === 'active') {
      await pauseOffer(offer.id);
    } else {
      await activateOffer(offer.id);
    }
  };

  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'active' as const, label: 'Active' },
    { key: 'inactive' as const, label: 'Inactive' },
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
            <h1 className="font-bold text-base text-[var(--color-text-primary)]">My Parking Offers</h1>
          </div>
          <Link
            href="/my-parking-offers/create"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-[var(--color-primary-500)] text-white'
                  : 'text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {offersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton variant="text" className="w-2/3" />
                  <Skeleton variant="text" className="w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--color-surface-tertiary)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <h2 className="font-bold text-[var(--color-text-primary)] mb-1">
              {activeTab === 'all' ? 'No parking offers yet' : 'No offers in this category'}
            </h2>
            <p className="text-[var(--color-text-tertiary)] text-sm mb-5">
              Create your first parking offer to start earning
            </p>
            <Link
              href="/my-parking-offers/create"
              className="inline-flex items-center px-6 py-3 premium-btn rounded-2xl font-semibold text-sm"
            >
              Create Offer
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredOffers.map((offer) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ParkingOfferCard
                  offer={offer}
                  onEdit={handleEdit}
                  onToggle={handleToggle}
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
