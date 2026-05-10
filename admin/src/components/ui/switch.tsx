'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

function Switch({ checked, onCheckedChange, disabled, className, size = 'default' }: SwitchProps) {
  const sizeClasses = {
    sm: 'h-4 w-7',
    default: 'h-5 w-9',
    lg: 'h-6 w-11',
  };

  const thumbSizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked
          ? 'bg-blue-600 dark:bg-blue-500'
          : 'bg-gray-200 dark:bg-gray-700',
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200',
          thumbSizeClasses[size],
          checked
            ? size === 'sm' ? 'translate-x-3.5' : size === 'default' ? 'translate-x-[1.15rem]' : 'translate-x-5'
            : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

export { Switch };
