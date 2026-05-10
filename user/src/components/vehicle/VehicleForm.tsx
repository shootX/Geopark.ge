'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { VehicleCategory, FuelType } from '@/types';
import { PlateNumberInput } from './PlateNumberInput';

interface VehicleFormData {
  brand: string;
  model: string;
  category: VehicleCategory;
  fuel_type: FuelType;
  year: number;
  plate_number: string;
}

interface VehicleFormErrors {
  brand?: string;
  model?: string;
  category?: string;
  fuel_type?: string;
  year?: string;
  plate_number?: string;
}

interface VehicleFormProps {
  onSubmit: (data: VehicleFormData) => Promise<void>;
  initialData?: Partial<VehicleFormData>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();

const vehicleCategoryLabels: Record<VehicleCategory, string> = {
  [VehicleCategory.Sedan]: 'Sedan',
  [VehicleCategory.Hatchback]: 'Hatchback',
  [VehicleCategory.SUV]: 'SUV',
  [VehicleCategory.Crossover]: 'Crossover',
  [VehicleCategory.Coupe]: 'Coupe',
  [VehicleCategory.Convertible]: 'Convertible',
  [VehicleCategory.Wagon]: 'Wagon',
  [VehicleCategory.Minivan]: 'Minivan',
  [VehicleCategory.Pickup]: 'Pickup',
  [VehicleCategory.Van]: 'Van',
  [VehicleCategory.Truck]: 'Truck',
  [VehicleCategory.Motorcycle]: 'Motorcycle',
  [VehicleCategory.Electric]: 'Electric',
  [VehicleCategory.Other]: 'Other',
};

const fuelTypeLabels: Record<FuelType, string> = {
  [FuelType.Petrol]: 'Petrol',
  [FuelType.Diesel]: 'Diesel',
  [FuelType.Electric]: 'Electric',
  [FuelType.Hybrid]: 'Hybrid',
  [FuelType.Gas]: 'Gas',
  [FuelType.LPG]: 'LPG',
  [FuelType.CNG]: 'CNG',
};

function validate(data: VehicleFormData): VehicleFormErrors {
  const errors: VehicleFormErrors = {};

  if (!data.brand.trim()) {
    errors.brand = 'Brand is required';
  }

  if (!data.model.trim()) {
    errors.model = 'Model is required';
  }

  if (data.year < 1950 || data.year > CURRENT_YEAR + 1) {
    errors.year = `Year must be between 1950 and ${CURRENT_YEAR + 1}`;
  }

  if (!data.plate_number.trim()) {
    errors.plate_number = 'Plate number is required';
  } else if (!/^[A-Z]{2}-[0-9]{3}-[A-Z]{2}$/.test(data.plate_number)) {
    errors.plate_number = 'Invalid plate format. Use AB-123-CD';
  }

  return errors;
}

export function VehicleForm({
  onSubmit,
  initialData,
  isSubmitting = false,
  submitLabel = 'Save Vehicle',
  onCancel,
}: VehicleFormProps) {
  const [form, setForm] = useState<VehicleFormData>({
    brand: initialData?.brand ?? '',
    model: initialData?.model ?? '',
    category: initialData?.category ?? VehicleCategory.Sedan,
    fuel_type: initialData?.fuel_type ?? FuelType.Petrol,
    year: initialData?.year ?? CURRENT_YEAR,
    plate_number: initialData?.plate_number ?? '',
  });

  const [errors, setErrors] = useState<VehicleFormErrors>({});

  const handleChange = (field: keyof VehicleFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = field === 'year' ? parseInt(e.target.value, 10) || 0 : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field as keyof VehicleFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Brand & Model row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Brand</label>
          <input
            required
            value={form.brand}
            onChange={handleChange('brand')}
            className={`premium-input ${errors.brand ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="e.g. Toyota"
          />
          {errors.brand && <p className="mt-1 text-xs text-red-500">{errors.brand}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Model</label>
          <input
            required
            value={form.model}
            onChange={handleChange('model')}
            className={`premium-input ${errors.model ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="e.g. Camry"
          />
          {errors.model && <p className="mt-1 text-xs text-red-500">{errors.model}</p>}
        </div>
      </div>

      {/* Category & Fuel Type row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={handleChange('category')}
            className="premium-input appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
          >
            {Object.entries(vehicleCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Fuel Type</label>
          <select
            value={form.fuel_type}
            onChange={handleChange('fuel_type')}
            className="premium-input appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
          >
            {Object.entries(fuelTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Year & Plate row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Year</label>
          <input
            type="number"
            required
            min={1950}
            max={CURRENT_YEAR + 1}
            value={form.year}
            onChange={handleChange('year')}
            className={`premium-input ${errors.year ? 'border-red-300 focus:ring-red-500' : ''}`}
          />
          {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year}</p>}
        </div>
        <div>
          <PlateNumberInput
            value={form.plate_number}
            onChange={(val) => {
              setForm((prev) => ({ ...prev, plate_number: val }));
              if (errors.plate_number) {
                setErrors((prev) => ({ ...prev, plate_number: undefined }));
              }
            }}
            error={errors.plate_number}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-3.5 border border-[var(--color-border)] rounded-2xl text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${onCancel ? 'flex-1' : 'w-full'} py-3.5 premium-btn rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200/40`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
