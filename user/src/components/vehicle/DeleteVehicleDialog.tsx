'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { UserCar } from '@/types';

interface DeleteVehicleDialogProps {
  car: UserCar | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteVehicleDialog({
  car,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteVehicleDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && car && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm mx-auto"
          >
            {/* Icon */}
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-center text-[var(--color-text-primary)]">
              Delete Vehicle
            </h3>
            <p className="text-sm text-[var(--color-text-tertiary)] text-center mt-2 leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[var(--color-text-secondary)]">
                {car.brand} {car.model}
              </span>
              {' '}with plate{' '}
              <span className="font-mono font-semibold text-[var(--color-text-secondary)]">
                {car.plate_number}
              </span>
              ?
            </p>

            {car.is_default && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-3 text-center">
                This is your default vehicle. Another vehicle will be set as default automatically.
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 py-3 border border-[var(--color-border)] rounded-2xl text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200/40"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
