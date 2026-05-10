'use client';

import { motion } from 'framer-motion';
import type { UserCar } from '@/types';

interface VehicleCardProps {
  car: UserCar;
  onEdit: (car: UserCar) => void;
  onDelete: (car: UserCar) => void;
  onSetDefault: (car: UserCar) => void;
}

const categoryIcons: Record<string, string> = {
  sedan: '🚗',
  hatchback: '🚙',
  suv: '🚙',
  crossover: '🚐',
  coupe: '🏎️',
  convertible: '🚗',
  wagon: '🚙',
  minivan: '🚐',
  pickup: '🛻',
  van: '🚐',
  truck: '🚛',
  motorcycle: '🏍️',
  electric: '⚡',
  other: '🚗',
};

export function VehicleCard({ car, onEdit, onDelete, onSetDefault }: VehicleCardProps) {
  const icon = categoryIcons[car.category] || '🚗';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white rounded-2xl border border-[var(--color-border-light)] p-4 shadow-sm relative overflow-hidden"
    >
      {/* Default badge */}
      {car.is_default && (
        <div className="absolute top-0 right-0">
          <div className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
            DEFAULT
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 bg-[var(--color-primary-50)] rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
          {icon}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
            {car.brand} {car.model}
          </h3>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
            {car.category} · {car.fuel_type ?? '—'} · {car.year}
          </p>
          <p className="font-mono text-sm font-medium text-[var(--color-text-secondary)] mt-1 tracking-wider">
            {car.plate_number}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border-light)]">
        {!car.is_default && (
          <button
            onClick={() => onSetDefault(car)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50"
          >
            Set Default
          </button>
        )}
        <button
          onClick={() => onEdit(car)}
          className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors px-2 py-1 rounded-lg hover:bg-[var(--color-surface-tertiary)]"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(car)}
          className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 ml-auto"
        >
          Delete
        </button>
      </div>
    </motion.div>
  );
}
