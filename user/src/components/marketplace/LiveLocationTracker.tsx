'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import type { Booking } from '@/types';

interface LiveLocationTrackerProps {
  booking: Booking;
  isRenter?: boolean;
  onArrivalConfirmed?: () => void;
}

export default function LiveLocationTracker({
  booking,
  isRenter = true,
  onArrivalConfirmed,
}: LiveLocationTrackerProps) {
  const { updateLocation, confirmArrival, ownerConfirmArrival, currentLocation, locationLoading } =
    useMarketplaceStore();

  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canStartTrip =
    isRenter &&
    (booking.booking_status === 'approved' || booking.booking_status === 'pending_owner_approval') &&
    !tracking;

  const canConfirmArrival =
    isRenter &&
    (booking.booking_status === 'renter_on_the_way' || booking.booking_status === 'owner_waiting');

  const canOwnerConfirm =
    !isRenter && booking.booking_status === 'renter_on_the_way';

  // Start tracking location
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }

    setTracking(true);
    setError(null);

    // Watch position for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const speed = position.coords.speed ?? undefined;
        const heading = position.coords.heading ?? undefined;

        updateLocation(booking.id, latitude, longitude, heading, speed);
        setLastUpdate(new Date());
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Ошибка получения геолокации');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    // Fallback periodic update
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation(booking.id, latitude, longitude);
          setLastUpdate(new Date());
        },
        () => {
          // silent fallback
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }, 30000);
  }, [booking.id, updateLocation]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    setTracking(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleConfirmArrival = async () => {
    if (isRenter) {
      await confirmArrival(booking.id);
    } else {
      await ownerConfirmArrival(booking.id);
    }
    stopTracking();
    onArrivalConfirmed?.();
  };

  const timeSinceLastUpdate = lastUpdate
    ? Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
    : null;

  const isStale = timeSinceLastUpdate !== null && timeSinceLastUpdate > 60;

  const startTripAction = async () => {
    const { bookingService } = await import('@/services/booking');
    await bookingService.startTrip(booking.id);
    startTracking();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-semibold text-gray-900">
            {isRenter ? 'Моя геолокация' : 'Геолокация арендатора'}
          </span>
        </div>
        {tracking && (
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Отслеживание
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {error && (
          <div className="p-2.5 bg-red-50 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        {tracking && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Последнее обновление:</span>
            <span className={`font-medium ${isStale ? 'text-red-500' : 'text-gray-700'}`}>
              {lastUpdate
                ? isStale
                  ? '> 1 мин назад'
                  : `${timeSinceLastUpdate} сек назад`
                : '—'}
            </span>
          </div>
        )}

        {/* Location coordinates display */}
        {currentLocation && (
          <div className="p-2.5 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-mono">
              {Number(currentLocation.latitude).toFixed(6)}, {Number(currentLocation.longitude).toFixed(6)}
            </p>
          </div>
        )}

        {/* Booking state info */}
        {booking.booking_status === 'renter_on_the_way' && (
          <div className="p-2.5 bg-indigo-50 rounded-lg text-xs text-indigo-700">
            {isRenter
              ? 'Вы в пути. Включите отслеживание, чтобы владелец мог видеть ваше местоположение.'
              : 'Арендатор в пути. Вы сможете подтвердить прибытие, когда он будет на месте.'}
          </div>
        )}

        {booking.booking_status === 'owner_waiting' && isRenter && (
          <div className="p-2.5 bg-purple-50 rounded-lg text-xs text-purple-700">
            Владелец ожидает вас. Подтвердите прибытие по прибытии на место.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {canStartTrip && (
            <button
              onClick={startTripAction}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Начать поездку
            </button>
          )}

          {canConfirmArrival && (
            <button
              onClick={handleConfirmArrival}
              disabled={locationLoading}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {locationLoading ? 'Подтверждение...' : 'Я на месте'}
            </button>
          )}

          {canOwnerConfirm && (
            <button
              onClick={handleConfirmArrival}
              disabled={locationLoading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {locationLoading ? 'Подтверждение...' : 'Подтвердить прибытие'}
            </button>
          )}

          {tracking && (
            <button
              onClick={stopTracking}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Остановить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
