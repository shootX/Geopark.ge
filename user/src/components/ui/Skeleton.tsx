'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const baseClass = 'skeleton-shimmer';
  const variantClass = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-lg h-4',
  }[variant];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${baseClass} ${variantClass} ${className}`}
    />
  );
}

export function ParkingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-border-light)]">
      <Skeleton className="h-44 w-full mb-4 rounded-xl" />
      <Skeleton variant="text" className="w-3/4 mb-2.5" />
      <Skeleton variant="text" className="w-1/2 mb-4" />
      <div className="flex justify-between">
        <Skeleton className="h-6 w-20 rounded-lg" />
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-border-light)]">
      <Skeleton variant="text" className="w-1/3 mb-2.5" />
      <Skeleton variant="text" className="w-2/3 mb-2" />
      <Skeleton variant="text" className="w-1/2 mb-4" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

export function MapLoadingSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[var(--color-surface-secondary)] to-[var(--color-surface-tertiary)]">
      <div className="relative">
        <div className="w-14 h-14 border-[3px] border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-[var(--color-text-secondary)] font-medium mt-5">Loading map...</p>
      <p className="text-[var(--color-text-tertiary)] text-sm mt-1">Finding nearby parking spots</p>
    </div>
  );
}
