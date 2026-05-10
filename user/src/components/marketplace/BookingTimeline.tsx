'use client';

import type { Booking } from '@/types';

interface BookingTimelineProps {
  booking: Booking;
}

interface TimelineStep {
  key: string;
  label: string;
  timestamp: string | null | undefined;
  isReached: boolean;
  isActive: boolean;
}

function formatTimestamp(ts: string | null | undefined): string | null {
  if (!ts) return null;
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) + ', ' +
      d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch {
    return null;
  }
}

export default function BookingTimeline({ booking }: BookingTimelineProps) {
  const steps: TimelineStep[] = [
    {
      key: 'created',
      label: 'Создано',
      timestamp: booking.created_at,
      isReached: true,
      isActive: false,
    },
    {
      key: 'pending_owner_approval',
      label: 'Ожидает подтверждения',
      timestamp: booking.created_at,
      isReached: !['pending_owner_approval', 'cancelled', 'rejected'].includes(booking.booking_status),
      isActive: booking.booking_status === 'pending_owner_approval',
    },
    {
      key: 'approved',
      label: 'Подтверждено владельцем',
      timestamp: booking.approved_at,
      isReached: !!booking.approved_at,
      isActive: booking.booking_status === 'approved',
    },
    {
      key: 'renter_on_the_way',
      label: 'Водитель в пути',
      timestamp: booking.started_at,
      isReached: !!booking.started_at,
      isActive: booking.booking_status === 'renter_on_the_way',
    },
    {
      key: 'arrived',
      label: 'Прибыл на место',
      timestamp: booking.arrived_at,
      isReached: !!booking.arrived_at,
      isActive: booking.booking_status === 'arrived' || booking.booking_status === 'owner_waiting',
    },
    {
      key: 'active',
      label: 'Парковка активна',
      timestamp: booking.arrived_at,
      isReached: booking.booking_status === 'active' || booking.booking_status === 'completed',
      isActive: booking.booking_status === 'active',
    },
    {
      key: 'completed',
      label: 'Завершено',
      timestamp: booking.completed_at,
      isReached: booking.booking_status === 'completed',
      isActive: booking.booking_status === 'completed',
    },
  ];

  // If the booking is cancelled/rejected/expired, show terminal state
  const terminalSteps: TimelineStep[] | null = ['cancelled', 'rejected', 'expired'].includes(booking.booking_status)
    ? [
        {
          key: 'created',
          label: 'Создано',
          timestamp: booking.created_at,
          isReached: true,
          isActive: false,
        },
        {
          key: booking.booking_status,
          label:
            booking.booking_status === 'cancelled'
              ? 'Отменено'
              : booking.booking_status === 'rejected'
                ? 'Отклонено'
                : 'Истекло',
          timestamp: booking.cancelled_at || booking.completed_at,
          isReached: true,
          isActive: true,
        },
      ]
    : null;

  const displaySteps = terminalSteps || steps;

  return (
    <div className="relative">
      {displaySteps.map((step, idx) => (
        <div key={step.key} className="flex items-start gap-3 pb-5 last:pb-0 relative">
          {/* Vertical line */}
          {idx < displaySteps.length - 1 && (
            <div
              className={`absolute left-[7px] top-4 w-0.5 h-full -z-10 ${
                step.isReached ? 'bg-blue-400' : 'bg-gray-200'
              }`}
            />
          )}

          {/* Dot */}
          <div
            className={`flex-shrink-0 w-4 h-4 rounded-full border-2 mt-0.5 ${
              step.isActive
                ? 'border-blue-500 bg-blue-500 ring-2 ring-blue-200'
                : step.isReached
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white'
            }`}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${
                step.isActive
                  ? 'text-blue-700'
                  : step.isReached
                    ? 'text-gray-900'
                    : 'text-gray-400'
              }`}
            >
              {step.label}
              {step.isActive && (
                <span className="inline-block ml-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              )}
            </p>
            {step.timestamp && (
              <p className="text-xs text-gray-500 mt-0.5">
                {formatTimestamp(step.timestamp)}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Rejection reason */}
      {booking.rejection_reason && booking.booking_status === 'rejected' && (
        <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-100">
          <p className="text-xs font-medium text-red-800 mb-0.5">Причина отклонения:</p>
          <p className="text-sm text-red-600">{booking.rejection_reason}</p>
        </div>
      )}

      {/* Cancellation reason */}
      {booking.cancellation_reason && booking.booking_status === 'cancelled' && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs font-medium text-gray-800 mb-0.5">Причина отмены:</p>
          <p className="text-sm text-gray-600">{booking.cancellation_reason}</p>
        </div>
      )}
    </div>
  );
}
