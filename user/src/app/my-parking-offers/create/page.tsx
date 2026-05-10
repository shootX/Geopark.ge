'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { useUIStore } from '@/store/uiStore';
import type { ParkingOffer, ParkingOfferFilters } from '@/types';

type OfferFormData = {
  title: string;
  description: string;
  parking_type: 'private' | 'public';
  hourly_price: number;
  minimum_hours: number;
  supported_vehicle_sizes: string[];
  address: string;
  latitude: number | null;
  longitude: number | null;
  available_from: string;
  available_until: string;
};

const initialFormData: OfferFormData = {
  title: '',
  description: '',
  parking_type: 'private',
  hourly_price: 0,
  minimum_hours: 1,
  supported_vehicle_sizes: [],
  address: '',
  latitude: null,
  longitude: null,
  available_from: '',
  available_until: '',
};

const vehicleSizeOptions = ['sedan', 'hatchback', 'suv', 'minivan', 'truck', 'motorcycle'];

export default function CreateParkingOfferPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { createOffer } = useMarketplaceStore();
  const { addToast } = useUIStore();
  const [formData, setFormData] = useState<OfferFormData>(initialFormData);
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const updateField = <K extends keyof OfferFormData>(
    key: K,
    value: OfferFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const toggleVehicleSize = (size: string) => {
    setFormData((prev) => {
      const sizes = prev.supported_vehicle_sizes.includes(size)
        ? prev.supported_vehicle_sizes.filter((s) => s !== size)
        : [...prev.supported_vehicle_sizes, size];
      return { ...prev, supported_vehicle_sizes: sizes };
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast({ type: 'error', title: 'Geolocation not supported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
      },
      () => {
        addToast({ type: 'error', title: 'Could not get location' });
      }
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.address.trim()) errs.address = 'Address is required';
    if (formData.hourly_price <= 0) errs.hourly_price = 'Price must be greater than 0';
    if (formData.minimum_hours < 1) errs.minimum_hours = 'Minimum hours must be at least 1';
    if (formData.latitude === null || formData.longitude === null) {
      errs.location = 'Please set location';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: Partial<ParkingOffer> & { availability?: unknown[] } = {
        title: formData.title,
        description: formData.description,
        parking_type: formData.parking_type,
        hourly_price: formData.hourly_price,
        minimum_hours: formData.minimum_hours,
        supported_vehicle_sizes: formData.supported_vehicle_sizes,
        address: formData.address,
        latitude: formData.latitude!,
        longitude: formData.longitude!,
        available_from: formData.available_from || undefined,
        available_until: formData.available_until || undefined,
      };

      const offer = await createOffer(payload);
      if (images.length > 0) {
        const { parkingOfferService } = await import('@/services/parking-offer');
        await parkingOfferService.addImages(offer.id, images);
      }
      addToast({ type: 'success', title: 'Parking offer created!' });
      router.push('/my-parking-offers');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create offer';
      addToast({ type: 'error', title: 'Failed to create offer', message });
    } finally {
      setSubmitting(false);
    }
  };

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
            <h1 className="font-bold text-base text-[var(--color-text-primary)]">Create Offer</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Title */}
        <div className="premium-card p-5">
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g. Covered parking in city center"
            className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--color-surface-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary-500)] ${
              errors.title ? 'border-red-400' : 'border-[var(--color-border-light)]'
            }`}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="premium-card p-5">
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe your parking spot..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary-500)] resize-none"
          />
        </div>

        {/* Address & Location */}
        <div className="premium-card p-5 space-y-3">
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            Address *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Full address"
            className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--color-surface-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary-500)] ${
              errors.address ? 'border-red-400' : 'border-[var(--color-border-light)]'
            }`}
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}

          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">
              {formData.latitude !== null
                ? `📍 ${formData.latitude.toFixed(6)}, ${formData.longitude?.toFixed(6)}`
                : 'No location set'}
            </span>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              📍 Get Current Location
            </button>
          </div>
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
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
                Hourly Price (₾) *
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={formData.hourly_price || ''}
                onChange={(e) => updateField('hourly_price', parseFloat(e.target.value) || 0)}
                className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--color-surface-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary-500)] ${
                  errors.hourly_price ? 'border-red-400' : 'border-[var(--color-border-light)]'
                }`}
              />
              {errors.hourly_price && <p className="text-red-500 text-xs mt-1">{errors.hourly_price}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
                Min Hours *
              </label>
              <input
                type="number"
                min={1}
                value={formData.minimum_hours}
                onChange={(e) => updateField('minimum_hours', parseInt(e.target.value) || 1)}
                className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--color-surface-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary-500)] ${
                  errors.minimum_hours ? 'border-red-400' : 'border-[var(--color-border-light)]'
                }`}
              />
              {errors.minimum_hours && <p className="text-red-500 text-xs mt-1">{errors.minimum_hours}</p>}
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

        {/* Availability */}
        <div className="premium-card p-5">
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Availability (optional)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--color-text-tertiary)] mb-1">Available From</label>
              <input
                type="datetime-local"
                value={formData.available_from}
                onChange={(e) => updateField('available_from', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-tertiary)] mb-1">Available To</label>
              <input
                type="datetime-local"
                value={formData.available_until}
                onChange={(e) => updateField('available_until', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary-500)]"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="premium-card p-5">
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files || []))}
            className="w-full text-sm text-[var(--color-text-secondary)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--color-primary-50)] file:text-[var(--color-primary-600)] hover:file:bg-[var(--color-primary-100)]"
          />
          {images.length > 0 && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{images.length} file(s) selected</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 premium-btn rounded-2xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating...' : 'Create Parking Offer'}
        </button>
      </form>
    </motion.main>
  );
}
