'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { VehicleForm } from '@/components/vehicle/VehicleForm';
import { userCarService } from '@/services/userCars';
import type { VehicleFormData } from '@/types';

export default function OnboardingVehiclePage() {
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    // If user already has a vehicle, redirect to home
    if (user?.has_vehicle) {
      router.replace('/');
    }
    // Show skip option after 3 seconds
    const timer = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(timer);
  }, [user, router]);

  const handleSubmit = async (data: VehicleFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await userCarService.create(data);
      // Refresh user profile to get has_vehicle = true
      await fetchUser();
      router.push('/');
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const message = apiError?.response?.data?.message
        || apiError?.response?.data?.errors?.plate_number?.[0]
        || 'Failed to save vehicle. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-surface)] via-[var(--color-primary-50)] to-[var(--color-surface)] py-10 px-5 flex items-start justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/50">
              <span className="text-white font-bold text-xl tracking-tight">G</span>
            </div>
            <span className="font-bold text-2xl text-[var(--color-text-primary)] tracking-tight">GeoPark</span>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <div className="mt-4 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Step 1 of 1
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
              Add Your Vehicle
            </h1>
            <p className="text-[var(--color-text-tertiary)] mt-1.5 text-sm leading-relaxed">
              To start booking parking spots, please add at least one vehicle to your account.
            </p>
          </motion.div>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="bg-white rounded-3xl shadow-xl border border-[var(--color-border-light)] p-7"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-4"
            >
              {error}
            </motion.div>
          )}

          <VehicleForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Add Vehicle & Continue"
          />

          {/* Skip link (shown after delay) */}
          {showSkip && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-5 text-center"
            >
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors underline underline-offset-2"
              >
                I'll add my vehicle later
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Info note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-center text-xs text-[var(--color-text-tertiary)] mt-6 leading-relaxed px-4"
        >
          You can always add or manage your vehicles later from your profile settings.
        </motion.p>
      </motion.div>
    </div>
  );
}
