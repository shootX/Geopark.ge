'use client';

import { useUIStore } from '@/store/uiStore';
import { useMapStore } from '@/store/mapStore';
import { motion, AnimatePresence } from 'framer-motion';

export function FilterPanel() {
  const { isFilterPanelOpen, setFilterPanelOpen } = useUIStore();
  const { filters, setFilters, resetFilters } = useMapStore();

  return (
    <AnimatePresence>
      {isFilterPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setFilterPanelOpen(false)}
          />

          {/* Panel — slides from bottom on mobile, from right on desktop */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl
                       max-h-[85vh] overflow-y-auto scrollbar-hide
                       md:right-0 md:top-0 md:left-auto md:w-96 md:rounded-none md:rounded-l-3xl md:max-h-none"
          >
            {/* Drag handle (mobile only) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden sticky top-0 bg-white z-10">
              <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
            </div>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-7">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Filters</h2>
                <button
                  onClick={() => setFilterPanelOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-surface-secondary)] hover:bg-[var(--color-border)] transition-colors"
                >
                  <svg className="w-4 h-4 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Available Only — toggle */}
              <div className="mb-7">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">Available only</span>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Show only parking with free spots</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={filters.onlyAvailable}
                      onChange={(e) => setFilters({ onlyAvailable: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--color-border)] rounded-full peer-checked:bg-[var(--color-primary-500)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm" />
                  </div>
                </label>
              </div>

              {/* Max Distance */}
              <div className="mb-7">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">Max Distance</span>
                  <span className="text-sm font-bold text-[var(--color-primary-600)]">{filters.maxDistance} km</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={filters.maxDistance}
                  onChange={(e) => setFilters({ maxDistance: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[var(--color-text-tertiary)] mt-1.5">
                  <span>1 km</span>
                  <span>50 km</span>
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-7">
                <span className="text-sm font-medium text-[var(--color-text-primary)] block mb-3">Price Range</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--color-text-tertiary)] mb-1.5">Min (₾)</label>
                    <input
                      type="number"
                      placeholder="No min"
                      value={filters.minPrice ?? ''}
                      onChange={(e) => setFilters({ minPrice: e.target.value ? Number(e.target.value) : null })}
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--color-text-tertiary)] mb-1.5">Max (₾)</label>
                    <input
                      type="number"
                      placeholder="No max"
                      value={filters.maxPrice ?? ''}
                      onChange={(e) => setFilters({ maxPrice: e.target.value ? Number(e.target.value) : null })}
                      className="premium-input"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    resetFilters();
                    setFilterPanelOpen(false);
                  }}
                  className="flex-1 py-3.5 premium-btn-outline rounded-xl font-medium text-sm"
                >
                  Reset
                </button>
                <button
                  onClick={() => setFilterPanelOpen(false)}
                  className="flex-1 py-3.5 premium-btn rounded-xl font-medium text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
