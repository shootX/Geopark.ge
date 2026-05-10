'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { userCarService } from '@/services/userCars';
import type { UserCar } from '@/types';

interface VehicleSelectorProps {
  selectedCarId: number | null;
  onChange: (carId: number | null) => void;
  onPlateChange: (plate: string) => void;
  vehiclePlate: string;
}

export function VehicleSelector({
  selectedCarId,
  onChange,
  onPlateChange,
  vehiclePlate,
}: VehicleSelectorProps) {
  const [cars, setCars] = useState<UserCar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    userCarService
      .getAll()
      .then((data) => {
        if (mounted) {
          setCars(data);
          // Auto-select default car
          const defaultCar = data.find((c) => c.is_default);
          if (defaultCar && !selectedCarId) {
            onChange(defaultCar.id);
            onPlateChange(defaultCar.plate_number);
          }
        }
      })
      .catch(() => {
        // Silently fail, user can type plate manually
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCar = cars.find((c) => c.id === selectedCarId);

  const handleSelectCar = useCallback(
    (car: UserCar) => {
      onChange(car.id);
      onPlateChange(car.plate_number);
      setIsOpen(false);
    },
    [onChange, onPlateChange]
  );

  const handleManualEntry = useCallback(() => {
    onChange(null);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
        Vehicle
      </label>

      {isLoading ? (
        <div className="h-12 bg-[var(--color-surface-tertiary)] rounded-xl animate-pulse" />
      ) : cars.length > 0 ? (
        <>
          {/* Selected vehicle display */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full premium-input flex items-center gap-3 text-left"
          >
            {selectedCar ? (
              <>
                <span className="w-8 h-8 bg-[var(--color-primary-50)] rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                  🚗
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[var(--color-text-primary)] block truncate">
                    {selectedCar.brand} {selectedCar.model}
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                    {selectedCar.plate_number}
                  </span>
                </div>
                {selectedCar.is_default && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    DEFAULT
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            ) : (
              <span className="text-sm text-[var(--color-text-tertiary)]">Select a vehicle</span>
            )}
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="mt-1 bg-white border border-[var(--color-border)] rounded-xl shadow-lg overflow-hidden"
              >
                <div className="max-h-48 overflow-y-auto py-1">
                  {cars.map((car) => (
                    <button
                      key={car.id}
                      type="button"
                      onClick={() => handleSelectCar(car)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface-tertiary)] transition-colors ${
                        car.id === selectedCarId ? 'bg-[var(--color-primary-50)]' : ''
                      }`}
                    >
                      <span className="w-8 h-8 bg-[var(--color-surface-tertiary)] rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                        🚗
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-[var(--color-text-primary)] block truncate">
                          {car.brand} {car.model}
                        </span>
                        <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                          {car.plate_number}
                        </span>
                      </div>
                      {car.is_default && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          DEFAULT
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-[var(--color-border-light)] px-4 py-2">
                  <button
                    type="button"
                    onClick={handleManualEntry}
                    className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    Or enter plate manually
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* No vehicles - manual entry or link to add */
        <div>
          <input
            type="text"
            value={vehiclePlate}
            onChange={(e) => {
              onPlateChange(e.target.value);
              if (selectedCarId) onChange(null);
            }}
            placeholder="License plate number"
            className="premium-input"
          />
          <Link
            href="/profile/vehicles"
            className="inline-block mt-1.5 text-xs text-[var(--color-primary-600)] font-semibold hover:underline"
          >
            + Add a vehicle to your account
          </Link>
        </div>
      )}
    </div>
  );
}
