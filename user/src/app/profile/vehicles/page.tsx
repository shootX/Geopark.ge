'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { VehicleModal } from '@/components/vehicle/VehicleModal';
import { DeleteVehicleDialog } from '@/components/vehicle/DeleteVehicleDialog';
import { userCarService } from '@/services/userCars';
import type { UserCar, VehicleFormData } from '@/types';

export default function MyVehiclesPage() {
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();
  const [cars, setCars] = useState<UserCar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCar, setEditingCar] = useState<UserCar | null>(null);
  const [deletingCar, setDeletingCar] = useState<UserCar | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCars = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await userCarService.getAll();
      setCars(data);
    } catch {
      setError('Failed to load vehicles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  const handleAdd = async (data: VehicleFormData) => {
    setIsSubmitting(true);
    try {
      const newCar = await userCarService.create(data);
      setCars((prev) => [...prev, newCar]);
      setShowAddModal(false);
      await fetchUser();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      throw new Error(apiError?.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: VehicleFormData) => {
    if (!editingCar) return;
    setIsSubmitting(true);
    try {
      const updated = await userCarService.update(editingCar.id, data);
      setCars((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCar(null);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      throw new Error(apiError?.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCar) return;
    setIsDeleting(true);
    try {
      await userCarService.delete(deletingCar.id);
      setCars((prev) => prev.filter((c) => c.id !== deletingCar.id));
      setDeletingCar(null);
      await fetchUser();
    } catch {
      setError('Failed to delete vehicle');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (car: UserCar) => {
    try {
      const updated = await userCarService.setDefault(car.id);
      setCars((prev) =>
        prev.map((c) => ({
          ...c,
          is_default: c.id === updated.id,
        }))
      );
      await fetchUser();
    } catch {
      setError('Failed to set default vehicle');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border-light)] safe-top">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">My Vehicles</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 max-w-lg mx-auto">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-4"
          >
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">&times;</button>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[var(--color-border-light)] p-4 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--color-surface-tertiary)] rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[var(--color-surface-tertiary)] rounded w-2/3" />
                    <div className="h-3 bg-[var(--color-surface-tertiary)] rounded w-1/2" />
                    <div className="h-3 bg-[var(--color-surface-tertiary)] rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : cars.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-[var(--color-primary-50)] rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-[var(--color-primary-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">No vehicles yet</h3>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1.5 mb-6">
              Add your first vehicle to start booking parking spots.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 py-3 px-6 premium-btn rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200/40"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Vehicle
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {cars.map((car) => (
                <VehicleCard
                  key={car.id}
                  car={car}
                  onEdit={setEditingCar}
                  onDelete={setDeletingCar}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </AnimatePresence>

            {/* Add another button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowAddModal(true)}
              className="w-full py-3.5 border-2 border-dashed border-[var(--color-border)] rounded-2xl text-sm font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Another Vehicle
            </motion.button>
          </div>
        )}
      </div>

      {/* Modals */}
      <VehicleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAdd}
        isSubmitting={isSubmitting}
      />

      <VehicleModal
        isOpen={!!editingCar}
        onClose={() => setEditingCar(null)}
        onSubmit={handleEdit}
        car={editingCar}
        isSubmitting={isSubmitting}
      />

      <DeleteVehicleDialog
        car={deletingCar}
        isOpen={!!deletingCar}
        onClose={() => setDeletingCar(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
