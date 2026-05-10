'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authService } from '@/services/auth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser, logout } = useAuthStore();
  const { addToast } = useUIStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedUser = await authService.updateProfile(form);
      updateUser(updatedUser);
      setIsEditing(false);
      addToast({ type: 'success', title: 'Profile updated' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update profile';
      addToast({ type: 'error', title: 'Update failed', message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[var(--color-surface-secondary)]"
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[var(--color-border-light)] sticky top-0 z-10">
        <div className="flex items-center px-5 h-14">
          <button onClick={() => router.push('/')} className="mr-3 -ml-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-secondary)] transition-colors">
            <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-base text-[var(--color-text-primary)]">Profile</h1>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center py-10 px-5">
        <div className="w-24 h-24 bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-200)] rounded-full flex items-center justify-center text-3xl font-bold text-[var(--color-primary-700)] shadow-inner mb-4">
          {user.first_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{user.full_name}</h2>
        <p className="text-sm text-[var(--color-text-tertiary)]">{user.email}</p>
        <span className="mt-2.5 px-3 py-1 bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold rounded-full capitalize border border-[var(--color-primary-200)]">
          {user.role}
        </span>

        {/* Vehicle Status */}
        {user.has_vehicle !== undefined && (
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
            <span className={`w-2 h-2 rounded-full ${user.has_vehicle ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {user.has_vehicle
              ? `${user.cars_count ?? 0} vehicle(s) registered`
              : 'No vehicle registered'}
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div className="premium-card mx-5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--color-text-primary)]">Personal Information</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-[var(--color-primary-600)] text-sm font-semibold hover:text-[var(--color-primary-700)] transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">First Name</label>
            <input
              value={form.first_name}
              onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
              disabled={!isEditing}
              className="premium-input disabled:bg-[var(--color-surface-secondary)] disabled:text-[var(--color-text-tertiary)] disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Last Name</label>
            <input
              value={form.last_name}
              onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
              disabled={!isEditing}
              className="premium-input disabled:bg-[var(--color-surface-secondary)] disabled:text-[var(--color-text-tertiary)] disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              disabled={!isEditing}
              placeholder="Not set"
              className="premium-input disabled:bg-[var(--color-surface-secondary)] disabled:text-[var(--color-text-tertiary)] disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Email</label>
            <input
              value={user.email}
              disabled
              className="premium-input bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] cursor-not-allowed"
            />
          </div>

          {isEditing && (
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 premium-btn rounded-2xl font-semibold text-sm"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          )}
        </form>
      </div>

      {/* Account Links */}
      <div className="premium-card mx-5 mt-3 p-5 space-y-1">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Account</h3>
        <ActionLink href="/my-bookings" label="My Bookings" />
        <ActionLink href="/profile/vehicles" label="My Vehicles" />
        <ActionLink href="/my-offers" label="My Offers" />
        <ActionLink href="/notifications" label="Notifications" />
      </div>

      {/* Logout */}
      <div className="mx-5 mt-3 mb-10">
        <button
          onClick={handleLogout}
          className="w-full py-3.5 premium-btn-outline rounded-2xl font-semibold text-sm text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
        >
          Sign Out
        </button>
      </div>
    </motion.main>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="w-full flex items-center gap-3 py-3 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
    >
      {label}
      <svg className="w-4 h-4 ml-auto text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
