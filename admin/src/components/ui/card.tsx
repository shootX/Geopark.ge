'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'bordered';
  hover?: boolean;
}

function Card({ className, variant = 'default', hover = false, children, ...props }: CardProps) {
  const variantClasses = {
    default: 'bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50',
    glass: 'bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-lg',
    bordered: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-6 shadow-sm transition-all duration-300',
        variantClasses[variant],
        hover && 'hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex items-start justify-between', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-gray-500 dark:text-gray-400', className)} {...props} />;
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-4 flex items-center pt-4 border-t border-gray-100 dark:border-gray-800', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
