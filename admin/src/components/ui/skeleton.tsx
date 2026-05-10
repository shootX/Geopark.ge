'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'chart';
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-xl',
    card: 'rounded-2xl h-48',
    text: 'rounded-lg h-4',
    avatar: 'rounded-full h-10 w-10',
    chart: 'rounded-xl h-64',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200/70 dark:bg-gray-700/50',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

// ─── Skeleton Card ───
function DashboardSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100/50 bg-white/50 p-6 dark:border-gray-800/50 dark:bg-gray-900/50">
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="mb-2 h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-gray-100/50 bg-white/50 p-6 dark:border-gray-800/50 dark:bg-gray-900/50">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="space-y-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className={`h-8 flex-1 ${j === 0 ? 'w-1/4' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100/50 bg-white/50 p-6 dark:border-gray-800/50 dark:bg-gray-900/50">
      <Skeleton className="mb-4 h-6 w-40" />
      <Skeleton variant="chart" />
    </div>
  );
}

export { Skeleton, DashboardSkeleton, TableSkeleton, ChartSkeleton };
