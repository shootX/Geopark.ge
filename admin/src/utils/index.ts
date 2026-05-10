// ============================================================
// Geopark - Utility Functions
// ============================================================

import { format, formatDistanceToNow, parseISO } from 'date-fns';

// ─── Formatters ───
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ka-GE', {
    style: 'currency',
    currency: 'GEL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDate = (date: string | Date, formatStr = 'MMM dd, yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy HH:mm');
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
};

export const timeAgo = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatDuration = (hours: number): string => {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours === 1) return '1 hour';
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
};

// ─── Status Helpers ───
type StatusConfig = {
  label: string;
  variant: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'purple' | 'outline';
  dotColor: string;
};

export const getBookingStatusConfig = (status: string): StatusConfig => {
  const configs: Record<string, StatusConfig> = {
    pending: { label: 'Pending', variant: 'warning', dotColor: 'bg-yellow-500' },
    approved: { label: 'Approved', variant: 'success', dotColor: 'bg-green-500' },
    active: { label: 'Active', variant: 'info', dotColor: 'bg-blue-500' },
    completed: { label: 'Completed', variant: 'default', dotColor: 'bg-gray-500' },
    cancelled: { label: 'Cancelled', variant: 'destructive', dotColor: 'bg-red-500' },
    rejected: { label: 'Rejected', variant: 'destructive', dotColor: 'bg-red-600' },
  };
  return configs[status] || { label: status, variant: 'default', dotColor: 'bg-gray-400' };
};

export const getParkingStatusConfig = (status: string): StatusConfig => {
  const configs: Record<string, StatusConfig> = {
    active: { label: 'Active', variant: 'success', dotColor: 'bg-green-500' },
    inactive: { label: 'Inactive', variant: 'outline', dotColor: 'bg-gray-500' },
    maintenance: { label: 'Maintenance', variant: 'warning', dotColor: 'bg-yellow-500' },
  };
  return configs[status] || { label: status, variant: 'default', dotColor: 'bg-gray-400' };
};

export const getParkingOfferStatusConfig = (status: string): StatusConfig => {
  const configs: Record<string, StatusConfig> = {
    active: { label: 'Active', variant: 'success', dotColor: 'bg-green-500' },
    paused: { label: 'Paused', variant: 'warning', dotColor: 'bg-yellow-500' },
    blocked: { label: 'Blocked', variant: 'destructive', dotColor: 'bg-red-500' },
    draft: { label: 'Draft', variant: 'outline', dotColor: 'bg-gray-500' },
  };
  return configs[status] || { label: status, variant: 'default', dotColor: 'bg-gray-400' };
};

export const getTransactionStatusConfig = (status: string): StatusConfig => {
  const configs: Record<string, StatusConfig> = {
    pending: { label: 'Pending', variant: 'warning', dotColor: 'bg-yellow-500' },
    held: { label: 'Held', variant: 'info', dotColor: 'bg-blue-500' },
    released: { label: 'Released', variant: 'success', dotColor: 'bg-green-500' },
    refunded: { label: 'Refunded', variant: 'purple', dotColor: 'bg-purple-500' },
    failed: { label: 'Failed', variant: 'destructive', dotColor: 'bg-red-500' },
  };
  return configs[status] || { label: status, variant: 'default', dotColor: 'bg-gray-400' };
};

export const getWalletStatusConfig = (status: boolean): StatusConfig => {
  return status
    ? { label: 'Blocked', variant: 'destructive', dotColor: 'bg-red-500' }
    : { label: 'Active', variant: 'info', dotColor: 'bg-green-500' };
};

export const getOfferStatusConfig = (status: string): StatusConfig => {
  const configs: Record<string, StatusConfig> = {
    pending: { label: 'Pending', variant: 'warning', dotColor: 'bg-yellow-500' },
    accepted: { label: 'Accepted', variant: 'success', dotColor: 'bg-green-500' },
    rejected: { label: 'Rejected', variant: 'destructive', dotColor: 'bg-red-500' },
    countered: { label: 'Countered', variant: 'info', dotColor: 'bg-blue-500' },
    expired: { label: 'Expired', variant: 'outline', dotColor: 'bg-gray-500' },
  };
  return configs[status] || { label: status, variant: 'default', dotColor: 'bg-gray-400' };
};

// ─── Color Generation ───
export const generateColorPalette = (count: number): string[] => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
    '#84CC16', '#D946EF', '#0EA5E9', '#EAB308', '#22C55E',
  ];
  return colors.slice(0, count);
};

// ─── Validation ───
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return /^\+?[\d\s-()]{7,15}$/.test(phone);
};

// ─── Debounce ───
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// ─── Class Name Helper ───
export { cn } from './cn';

// ─── Query Key Factory ───
export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => ['dashboard', 'stats'] as const,
    reports: (filters?: Record<string, unknown>) => ['dashboard', 'reports', filters] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filters?: Record<string, unknown>) => ['users', 'list', filters] as const,
    detail: (id: number) => ['users', id] as const,
  },
  parkings: {
    all: ['parkings'] as const,
    list: (filters?: Record<string, unknown>) => ['parkings', 'list', filters] as const,
    detail: (id: number) => ['parkings', id] as const,
    nearby: (coords: { lat: number; lng: number }) => ['parkings', 'nearby', coords] as const,
    my: () => ['parkings', 'my'] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    list: (filters?: Record<string, unknown>) => ['bookings', 'list', filters] as const,
    detail: (id: number) => ['bookings', id] as const,
    my: () => ['bookings', 'my'] as const,
    active: () => ['bookings', 'active'] as const,
    history: () => ['bookings', 'history'] as const,
  },
  offers: {
    all: ['offers'] as const,
    list: (filters?: Record<string, unknown>) => ['offers', 'list', filters] as const,
    detail: (id: number) => ['offers', id] as const,
    pending: () => ['offers', 'pending'] as const,
  },
  pricing: {
    rules: {
      all: ['pricing-rules'] as const,
      list: (filters?: Record<string, unknown>) => ['pricing-rules', 'list', filters] as const,
      detail: (id: number) => ['pricing-rules', id] as const,
    },
    logs: (parkingId: number) => ['pricing-logs', parkingId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (filters?: Record<string, unknown>) => ['notifications', 'list', filters] as const,
    unread: () => ['notifications', 'unread'] as const,
    count: () => ['notifications', 'count'] as const,
  },
  userCars: {
    all: ['user-cars'] as const,
    list: (filters?: Record<string, unknown>) => ['user-cars', 'list', filters] as const,
    detail: (id: number) => ['user-cars', id] as const,
  },
  parkingOffers: {
    all: ['parking-offers'] as const,
    list: (filters?: Record<string, unknown>) => ['parking-offers', 'list', filters] as const,
    stats: () => ['parking-offers', 'stats'] as const,
  },
  wallets: {
    all: ['wallets'] as const,
    list: (filters?: Record<string, unknown>) => ['wallets', 'list', filters] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (filters?: Record<string, unknown>) => ['transactions', 'list', filters] as const,
  },
  ratings: {
    all: ['ratings'] as const,
    list: (filters?: Record<string, unknown>) => ['ratings', 'list', filters] as const,
  },
};
