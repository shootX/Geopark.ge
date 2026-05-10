'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { useUIStore } from '@/store/uiStore';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ParkingOffer } from '@/types';

type EditFormData = {
  title: string;
  description: string;
  parking_type: 'private' | 'public';
  hourly_price: number;
  minimum_hours: number;
  supported_vehicle_sizes: string[];
  address: string;
};

const vehicleSizeOptions = ['sedan', 'hatchback', 'suv', 'minivan', 'truck', 'motorcycle'];

export default function EditParkingOfferPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { isAuthenticated } = useAuthStore();
  const { fetchOfferById } = useMarketplaceStore();
  const { addToast } = useUIStore();

  const [formData, setFormData] = useState<EditFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadOffer();
  }, [isAuthenticated, id]);

  const loadOffer = async () => {
    try {
      const offer = await fetchOfferById(id);
      if (!offer) {
        addToast({ type: 'error', title: 'Offer not found' });
        router.push('/my-parking-offers');
        return;
      }
      setFormData({
        title: offer.title || '',
        description: offer.description || '',
        parking_type: (offer.parking_type as 'private' | 'public') || 'private',
        hourly_price: offer.hourly_price || 0,
        minimum_hours: offer.minimum_hours || 1,
        supported_vehicle_sizes: offer.supported_vehicle_sizes || [],
        address: offer.address || '',
      });
    } catch {
      addToast({ type: 'error', title: 'Failed to load offer' });
      router.push('/my-parking-offers');
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof EditFormData>(
    key: K,
    value: EditFormData[K]
  ) => {
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleVehicleSize = (size: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const sizes = prev.supported_vehicle_sizes.includes(size)
        ? prev.supported_vehicle_sizes.filter((s) => s !== size)
        : [...prev.supported_vehicle_sizes, size];
      return { ...prev, supported_vehicle_sizes: sizes };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSubmitting(true);
    try {
      const { parkingOfferService } = await import('@/services/parking-offer');
      await parkingOfferService.update(id, formData as Partial<ParkingOffer>);
      addToast({ type: 'success', title: 'Offer updated!' });
      router.push('/my-parking-offers');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update offer';
      addToast({ type: 'error', title: 'Update failed', message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="min-h-screen bg-[var(--color-surface-secondary)] p-5"
      >
        <div className="space-y-5">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </motion.main>
    );
  }

  if (!formData) return null;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[var(--color-surface-secondary)] pb-24"
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[var(--color-border-light)] sticky top-0 z-10">
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 -ml-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-bold text-base text-[var(--color-text-primary)]">Edit Offer</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Title */}
        <div className="premium-card p-5">
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary-500)]"
          />
        </div>

        {/* Description */}
        <div className="premium-card p-5">
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary-500)] resize-none"
          />
        </div>

        {/* Address */}
        <div className="premium-card p-5">
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary-500)]"
          />
        </div>

        {/* Parking Type */}
        <div className="premium-card p-5">
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Parking Type
          </label>
          <div className="flex gap-2">
            {(['private', 'public'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateField('parking_type', type)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  formData.parking_type === type
                    ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]'
                    : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                {type === 'private' ? 'Private' : 'Public'}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="premium-card p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
                Hourly Price (₾)
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={formData.hourly_price || ''}
                onChange={(e) => updateField('hourly_price', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
                Min Hours
              </label>
              <input
                type="number"
                min={1}
                value={formData.minimum_hours}
                onChange={(e) => updateField('minimum_hours', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary-500)]"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Sizes */}
        <div className="premium-card p-5">
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Supported Vehicle Sizes
          </label>
          <div className="flex flex-wrap gap-2">
            {vehicleSizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleVehicleSize(size)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                  formData.supported_vehicle_sizes.includes(size)
                    ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]'
                    : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 premium-btn rounded-2xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </motion.main>
  );
}
