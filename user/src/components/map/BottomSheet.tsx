'use client';

import { useCallback, useRef } from 'react';
import Image from 'next/image';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Parking } from '@/types';

interface BottomSheetProps {
  parking: Parking | null;
  onClose: () => void;
  onBookNow: (parking: Parking) => void;
}

export function BottomSheet({ parking, onClose, onBookNow }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const { bottomSheetHeight, setBottomSheetHeight, setDraggingSheet } = useUIStore();

  const handleDragStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setDraggingSheet(true);
    },
    [setDraggingSheet]
  );

  const handleDragMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!startY.current) return;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      currentY.current = startY.current - y;
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggingSheet(false);
    if (currentY.current > 100) {
      setBottomSheetHeight(Math.min(600, bottomSheetHeight + 150));
    } else if (currentY.current < -50) {
      onClose();
    }
    startY.current = 0;
    currentY.current = 0;
  }, [bottomSheetHeight, setBottomSheetHeight, setDraggingSheet, onClose]);

  if (!parking) return null;

  const occupancyPercent = parking.occupancy_rate ?? 0;
  const isOpen = parking.is_open;

  return (
    <AnimatePresence>
      <motion.div
        ref={sheetRef}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 35, stiffness: 350 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl
                   max-h-[85vh] overflow-y-auto scrollbar-hide"
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Content */}
        <div className="px-5 pb-10">
          {/* Image Gallery */}
          {parking.images && parking.images.length > 0 && (
            <div className="relative h-52 rounded-2xl overflow-hidden mb-5 bg-[var(--color-surface-tertiary)]">
              <Image
                src={parking.images[0]}
                alt={parking.title}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
              />
              {/* Status badge */}
              <div className="absolute top-3 left-3">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    isOpen
                      ? 'bg-emerald-500/90 text-white backdrop-blur-sm'
                      : 'bg-red-500/90 text-white backdrop-blur-sm'
                  }`}
                >
                  {isOpen ? '● Open' : 'Closed'}
                </span>
              </div>
              {parking.distance && (
                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-[var(--color-text-secondary)] shadow-sm">
                  {parking.distance.toFixed(1)} km
                </div>
              )}
            </div>
          )}

          {/* Title & Price */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] leading-tight">
                {parking.title}
              </h2>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {parking.address}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-2xl font-bold text-[var(--color-primary-600)]">
                {parking.base_price}₾
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]"> /h</span>
            </div>
          </div>

          {/* Amenities */}
          {Array.isArray(parking.amenities) && parking.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {parking.amenities.map((amenity, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] text-xs rounded-lg border border-[var(--color-border-light)]"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}

          {/* Availability — minimalist */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[var(--color-text-secondary)]">Available</span>
              <span
                className={`font-semibold ${
                  parking.available_slots > 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {parking.available_slots} / {parking.total_slots}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  occupancyPercent > 80
                    ? 'bg-red-400'
                    : occupancyPercent > 50
                    ? 'bg-amber-400'
                    : 'bg-[var(--color-primary-400)]'
                }`}
              />
            </div>
          </div>

          {/* Description */}
          {parking.description && (
            <p className="text-sm text-[var(--color-text-secondary)] mb-5 leading-relaxed">
              {parking.description}
            </p>
          )}

          {/* Hours */}
          <div className="flex items-center gap-4 text-sm text-[var(--color-text-tertiary)] mb-6">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {parking.opening_time || '00:00'} – {parking.closing_time || '24:00'}
            </span>
          </div>

          {/* Book Now Button — premium */}
          <button
            onClick={() => onBookNow(parking)}
            disabled={!parking.is_open || parking.available_slots <= 0}
            className="w-full py-4 bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)]
                       text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-200/50
                       hover:shadow-xl hover:shadow-emerald-200/60 active:scale-[0.98] transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
          >
            {parking.available_slots <= 0
              ? 'Sold Out'
              : !parking.is_open
              ? 'Currently Closed'
              : 'Book Now'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
