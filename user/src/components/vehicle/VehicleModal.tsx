'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { VehicleForm } from './VehicleForm';
import type { UserCar, VehicleFormData } from '@/types';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  car?: UserCar | null;
  isSubmitting?: boolean;
}

export function VehicleModal({
  isOpen,
  onClose,
  onSubmit,
  car,
  isSubmitting = false,
}: VehicleModalProps) {
  const isEditing = !!car;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-5 sm:mx-auto p-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Handle for mobile */}
            <div className="w-10 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-4 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                {isEditing ? 'Edit Vehicle' : 'Add Vehicle'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[var(--color-surface-tertiary)] transition-colors"
              >
                <svg className="w-5 h-5 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <VehicleForm
              onSubmit={onSubmit}
              initialData={
                car
                  ? {
                      brand: car.brand,
                      model: car.model,
                      category: car.category,
                      fuel_type: car.fuel_type,
                      year: car.year,
                      plate_number: car.plate_number,
                    }
                  : undefined
              }
              isSubmitting={isSubmitting}
              submitLabel={isEditing ? 'Update Vehicle' : 'Add Vehicle'}
              onCancel={onClose}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
