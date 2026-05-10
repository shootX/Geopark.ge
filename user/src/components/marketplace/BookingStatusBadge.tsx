'use client';

import type { BookingStatus } from '@/types';

interface BookingStatusBadgeProps {
  status: BookingStatus;
  statusColor?: string;
  statusLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  pending_owner_approval: { bg: 'bg-yellow-50', text: 'text-yellow-800', dot: 'bg-yellow-400' },
  approved: { bg: 'bg-blue-50', text: 'text-blue-800', dot: 'bg-blue-400' },
  renter_on_the_way: { bg: 'bg-indigo-50', text: 'text-indigo-800', dot: 'bg-indigo-400' },
  owner_waiting: { bg: 'bg-purple-50', text: 'text-purple-800', dot: 'bg-purple-400' },
  arrived: { bg: 'bg-cyan-50', text: 'text-cyan-800', dot: 'bg-cyan-400' },
  active: { bg: 'bg-green-50', text: 'text-green-800', dot: 'bg-green-400' },
  completed: { bg: 'bg-gray-50', text: 'text-gray-800', dot: 'bg-gray-400' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-800', dot: 'bg-red-400' },
  rejected: { bg: 'bg-red-50', text: 'text-red-800', dot: 'bg-red-400' },
  expired: { bg: 'bg-orange-50', text: 'text-orange-800', dot: 'bg-orange-400' },
};

const statusLabels: Record<string, string> = {
  pending: 'Ожидание',
  pending_owner_approval: 'Ожидает подтверждения',
  approved: 'Подтверждено',
  renter_on_the_way: 'В пути',
  owner_waiting: 'Ожидание водителя',
  arrived: 'На месте',
  active: 'Активна',
  completed: 'Завершена',
  cancelled: 'Отменена',
  rejected: 'Отклонена',
  expired: 'Истекла',
};

export default function BookingStatusBadge({
  status,
  statusColor,
  statusLabel,
  size = 'md',
}: BookingStatusBadgeProps) {
  const style = statusStyles[status] || { bg: 'bg-gray-50', text: 'text-gray-800', dot: 'bg-gray-400' };
  const label = statusLabel || statusLabels[status] || status;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  // If a custom color is provided from the API, use it inline
  const customStyle = statusColor
    ? { backgroundColor: statusColor + '20', color: statusColor }
    : undefined;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]}`}
      style={customStyle}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${customStyle ? '' : style.dot}`}
        style={customStyle ? { backgroundColor: statusColor } : undefined}
      />
      <span>{label}</span>
    </span>
  );
}
