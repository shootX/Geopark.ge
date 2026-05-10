'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    birth_date: '',
    personal_number: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register(form);
      router.push('/');
    } catch {
      // error handled by store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-surface)] via-[var(--color-primary-50)] to-[var(--color-surface)] py-10 px-5 flex items-start justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/50">
              <span className="text-white font-bold text-xl tracking-tight">G</span>
            </div>
            <span className="font-bold text-2xl text-[var(--color-text-primary)] tracking-tight">GeoPark</span>
          </Link>
          <p className="text-[var(--color-text-tertiary)] mt-2 text-sm">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-[var(--color-border-light)] p-7 space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">First Name</label>
              <input
                required
                value={form.first_name}
                onChange={handleChange('first_name')}
                className="premium-input"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Last Name</label>
              <input
                required
                value={form.last_name}
                onChange={handleChange('last_name')}
                className="premium-input"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={handleChange('email')}
              className="premium-input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Phone</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={handleChange('phone')}
              className="premium-input"
              placeholder="+995 5XX XXX XXX"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Birth Date</label>
              <input
                type="date"
                required
                value={form.birth_date}
                onChange={handleChange('birth_date')}
                max={new Date().toISOString().split('T')[0]}
                className="premium-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Personal #</label>
              <input
                type="text"
                required
                minLength={11}
                maxLength={11}
                value={form.personal_number}
                onChange={handleChange('personal_number')}
                className="premium-input"
                placeholder="11 digits"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange('password')}
              className="premium-input"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Confirm Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password_confirmation}
              onChange={handleChange('password_confirmation')}
              className="premium-input"
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 premium-btn rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200/40"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

          <p className="text-center text-sm text-[var(--color-text-tertiary)]">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--color-primary-600)] font-semibold hover:text-[var(--color-primary-700)] transition-colors">
              Sign In
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
