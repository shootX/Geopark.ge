'use client';

import { useUIStore } from '@/store/uiStore';
import { useMapStore } from '@/store/mapStore';

interface MapControlsProps {
  onLocateMe: () => void;
  hasUserLocation: boolean;
}

export function MapControls({ onLocateMe, hasUserLocation }: MapControlsProps) {
  const { setFilterPanelOpen } = useUIStore();
  const { resetFilters } = useMapStore();

  const btnClass =
    'w-11 h-11 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center hover:bg-white active:scale-95 transition-all border border-[var(--color-border-light)]';

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      {/* Locate Me */}
      <button
        onClick={onLocateMe}
        disabled={!hasUserLocation}
        className={btnClass}
        aria-label="My location"
      >
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Filter */}
      <button
        onClick={() => setFilterPanelOpen(true)}
        className={btnClass}
        aria-label="Filters"
      >
        <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>

      {/* Reset View */}
      <button
        onClick={() => resetFilters()}
        className={btnClass}
        aria-label="Reset view"
      >
        <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
}
