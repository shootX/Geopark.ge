'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import { FilterPanel } from '@/components/parking/FilterPanel';
import { BottomSheet } from '@/components/map/BottomSheet';
import { MapLoadingSkeleton } from '@/components/ui/Skeleton';
import { TopNav } from '@/components/layout/TopNav';
import type { Parking } from '@/types';

// Dynamic import for map (no SSR - Mapbox needs window)
const MapView = dynamic(
  () => import('@/components/map/MapView').then((mod) => ({ default: mod.MapView })),
  {
    ssr: false,
    loading: () => <MapLoadingSkeleton />,
  }
);

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { setSelectedParking, selectedParking, isBottomSheetOpen } = useMapStore();
  const { addToast } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleParkingSelect = useCallback(
    (parking: Parking) => {
      setSelectedParking(parking);
    },
    [setSelectedParking]
  );

  const handleCloseSheet = useCallback(() => {
    setSelectedParking(null);
  }, [setSelectedParking]);

  const handleBookNow = useCallback(
    (parking: Parking) => {
      if (!isAuthenticated) {
        addToast({
          type: 'warning',
          title: 'Sign in required',
          message: 'Please sign in to book a parking spot',
        });
        router.push('/login');
        return;
      }
      router.push(`/booking?parkingId=${parking.id}`);
    },
    [isAuthenticated, router, addToast]
  );

  if (!mounted) {
    return <MapLoadingSkeleton />;
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {/* Map — full bleed */}
      <div className="absolute inset-0">
        <MapView
          onParkingSelect={handleParkingSelect}
          className="w-full h-full"
        />
      </div>

      {/* Top Navigation */}
      <TopNav />

      {/* Premium Search Overlay */}
      <div className="absolute top-20 left-5 right-5 z-20 max-w-lg mx-auto pointer-events-none">
        <div className="pointer-events-auto">
          <SearchBar />
        </div>
      </div>

      {/* Filter trigger — floating pill */}
      <FloatingFilterButton />

      {/* Filter Panel (slide-in drawer) */}
      <FilterPanel />

      {/* Bottom Sheet */}
      {isBottomSheetOpen && (
        <BottomSheet
          parking={selectedParking}
          onClose={handleCloseSheet}
          onBookNow={handleBookNow}
        />
      )}
    </main>
  );
}

// ─── Premium Search Bar ───

function SearchBar() {
  const { setSearchOpen } = useUIStore();
  const { filters, setFilters } = useMapStore();

  return (
    <button
      onClick={() => setSearchOpen(true)}
      className="w-full glass rounded-2xl px-5 py-3.5 flex items-center gap-3
                 border border-white/20 shadow-xl hover:bg-white/90 transition-all"
    >
      <svg className="w-5 h-5 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span className="text-[var(--color-text-tertiary)] text-sm flex-1 text-left">
        {filters.searchQuery || 'Search parking locations...'}
      </span>
      {filters.searchQuery && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFilters({ searchQuery: '' });
          }}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-border)] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </button>
  );
}

// ─── Floating Filter Button ───

function FloatingFilterButton() {
  const { isFilterPanelOpen, setFilterPanelOpen } = useUIStore();
  const { filters } = useMapStore();

  const hasActiveFilters = filters.onlyAvailable || filters.minPrice !== null || filters.maxPrice !== null || filters.maxDistance < 50;

  return (
    <button
      onClick={() => setFilterPanelOpen(!isFilterPanelOpen)}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 glass rounded-full px-5 py-3
                 shadow-xl border border-white/20 flex items-center gap-2.5
                 hover:bg-white/95 transition-all btn-press"
    >
      <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      <span className="text-sm font-medium text-[var(--color-text-primary)]">Filters</span>
      {hasActiveFilters && (
        <span className="w-2 h-2 rounded-full bg-[var(--color-primary-500)]" />
      )}
    </button>
  );
}
