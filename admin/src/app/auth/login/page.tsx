'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Car, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const { error: showError, success: showSuccess } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [form, setForm] = React.useState({ email: '', password: '', remember: false });

  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      showError('Validation', 'Please enter email and password');
      return;
    }
    setLoading(true);

    try {
      const response = await api.auth.login(form);
      const data = response.data || response;
      const user = data.user || data;
      const token = data.token || data.access_token;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      // Single source: Zustand persist handles all storage
      login(user, token);
      showSuccess('Welcome back!', `Signed in as ${user.full_name || user.email}`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showError('Login failed', axiosError?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Brand Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-blue-500/20 blur-[100px]" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-blue-400/10 blur-[80px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl shadow-blue-500/30">
              <Car className="h-10 w-10 text-white" />
            </div>
            <h1 className="mb-3 text-5xl font-bold text-white">Geopark</h1>
            <p className="text-xl text-blue-200/80">Enterprise Admin Panel</p>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20">
                  <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-sm text-blue-200">Real-time parking management</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20">
                  <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <p className="text-sm text-blue-200">Advanced analytics & reports</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/20">
                  <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-sm text-blue-200">Dynamic pricing engine</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex w-full items-center justify-center bg-white p-8 lg:w-1/2 dark:bg-gray-950">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Geopark</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@geopark.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="h-12"
                aria-describedby="email-error"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Remember me
              </label>
              <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Forgot password?
              </button>
            </div>

            <Button type="submit" loading={loading} className="h-12 w-full text-base">
              Sign in
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Secure admin access only. Unauthorized access is prohibited.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
