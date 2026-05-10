'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useParkingDetail, useCalculatePrice, useCreateBooking } from '@/hooks/useQueries';
import type { PriceCalculation } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { VehicleSelector } from '@/components/vehicle/VehicleSelector';

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parkingId = Number(searchParams.get('parkingId'));
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUIStore();

  const { data: parking, isLoading: parkingLoading } = useParkingDetail(parkingId);
  const calculatePrice = useCalculatePrice();
  const createBooking = useCreateBooking();

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [notes, setNotes] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState<PriceCalculation | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Set default times
  useEffect(() => {
    if (!startTime) {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const next = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      setStartTime(now.toISOString().slice(0, 16));
      setEndTime(next.toISOString().slice(0, 16));
    }
  }, [startTime]);

  // Calculate price when times change
  useEffect(() => {
    if (!parkingId || !startTime || !endTime || startTime >= endTime) {
      setCalculatedPrice(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await calculatePrice.mutateAsync({
          parking_id: parkingId,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
        });
        setCalculatedPrice(result);
      } catch {
        setCalculatedPrice(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [parkingId, startTime, endTime, calculatePrice]);

  const handleBooking = useCallback(async () => {
    if (!parkingId || !startTime || !endTime) return;

    try {
      const booking = await createBooking.mutateAsync({
        parking_id: parkingId,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        user_car_id: selectedCarId ?? undefined,
        vehicle_plate: vehiclePlate || undefined,
        notes: notes || undefined,
      });

      addToast({
        type: 'success',
        title: 'Booking Confirmed!',
        message: `Your parking at ${parking?.title} has been booked.`,
      });

      router.push(`/my-bookings`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Booking failed';
      addToast({ type: 'error', title: 'Booking Failed', message });
    }
  }, [parkingId, startTime, endTime, selectedCarId, vehiclePlate, notes, createBooking, addToast, parking, router]);

  const isValid = startTime && endTime && startTime < endTime && !!calculatedPrice;

  if (parkingLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-secondary)] p-5 space-y-4">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton variant="text" className="w-2/3" />
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (!parking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-surface-tertiary)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-[var(--color-text-secondary)] font-medium">Parking not found</p>
          <Link href="/" className="text-[var(--color-primary-600)] font-semibold mt-3 inline-block hover:underline">
            Back to map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[var(--color-surface-secondary)] pb-36"
    >
      {/* Simple Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[var(--color-border-light)] sticky top-0 z-10">
        <div className="flex items-center px-5 h-14">
          <button onClick={() => router.back()} className="mr-3 -ml-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-secondary)] transition-colors">
            <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-base text-[var(--color-text-primary)]">Book Parking</h1>
        </div>
      </div>

      {/* Parking Info — premium card */}
      <div className="premium-card mx-5 mt-5 p-4">
        <div className="flex gap-4">
          {parking.images?.[0] && (
            <img
              src={parking.images[0]}
              alt={parking.title}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-[var(--color-text-primary)]">{parking.title}</h2>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5 truncate">{parking.address}</p>
            <p className="text-[var(--color-primary-600)] font-bold mt-1.5">
              {parking.base_price}₾{' '}
              <span className="text-xs text-[var(--color-text-tertiary)] font-normal">/ hour</span>
            </p>
          </div>
        </div>
      </div>

      {/* Time Selection */}
      <div className="premium-card mx-5 mt-3 p-5">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Select Time</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1.5">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="premium-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1.5">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={startTime || new Date().toISOString().slice(0, 16)}
              className="premium-input"
            />
          </div>
        </div>

        {/* Duration quick select */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {[
            { label: '1h', value: 1 },
            { label: '2h', value: 2 },
            { label: '4h', value: 4 },
            { label: '8h', value: 8 },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => {
                const start = new Date();
                start.setMinutes(0, 0, 0);
                const end = new Date(start.getTime() + value * 60 * 60 * 1000);
                setStartTime(start.toISOString().slice(0, 16));
                setEndTime(end.toISOString().slice(0, 16));
              }}
              className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)]
                         hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Selection */}
      <div className="premium-card mx-5 mt-3 p-5">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">Vehicle (Optional)</h3>
        <VehicleSelector
          selectedCarId={selectedCarId}
          onChange={setSelectedCarId}
          onPlateChange={setVehiclePlate}
          vehiclePlate={vehiclePlate}
        />
      </div>

      {/* Notes */}
      <div className="premium-card mx-5 mt-3 p-5">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">Notes (Optional)</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special requests..."
          rows={3}
          className="premium-input resize-none"
        />
      </div>

      {/* Price Summary */}
      {calculatedPrice && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card mx-5 mt-3 p-5"
        >
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Price Summary</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Base Price</span>
              <span className="font-medium text-[var(--color-text-primary)]">{calculatedPrice.base_price}₾</span>
            </div>
            {calculatedPrice.demand_factor !== 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Demand Factor</span>
                <span className="font-medium text-[var(--color-text-primary)]">×{calculatedPrice.demand_factor}</span>
              </div>
            )}
            {calculatedPrice.weekend_multiplier !== 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Weekend Multiplier</span>
                <span className="font-medium text-[var(--color-text-primary)]">×{calculatedPrice.weekend_multiplier}</span>
              </div>
            )}
            <div className="border-t border-[var(--color-border)] pt-3 flex justify-between items-center">
              <span className="font-semibold text-[var(--color-text-primary)]">Total</span>
              <div className="text-right">
                <span className="font-bold text-xl text-[var(--color-primary-600)]">
                  {calculatedPrice.price}₾
                </span>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {calculatedPrice.hours}h
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading price */}
      {calculatePrice.isPending && (
        <div className="premium-card mx-5 mt-3 p-5">
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-tertiary)]">
            <div className="w-4 h-4 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
            Calculating price...
          </div>
        </div>
      )}

      {/* Sticky Booking Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-[var(--color-border-light)] p-5 safe-bottom">
        <button
          onClick={handleBooking}
          disabled={!isValid || createBooking.isPending}
          className="w-full py-4 premium-btn rounded-2xl font-bold text-base shadow-lg shadow-emerald-200/40"
        >
          {createBooking.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Booking...
            </span>
          ) : calculatedPrice ? (
            `Book Now — ${calculatedPrice.price}₾`
          ) : (
            'Select Time'
          )}
        </button>
      </div>
    </motion.main>
  );
}
