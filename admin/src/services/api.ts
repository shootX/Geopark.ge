// ============================================================
// Geopark API Client - Axios-based HTTP Client
// SINGLE SOURCE OF TRUTH FOR TOKEN MANAGEMENT
// ============================================================

import axios, { type AxiosInstance, type AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store';
import { getPublicApiBaseUrl, getPublicApiOrigin } from '@/lib/api-public';

const API_BASE_URL = getPublicApiBaseUrl();

// ─── Single source of truth: Zustand persist handles localStorage
// Reads directly from Zustand store (the SSR-safe single source of truth)
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return useAuthStore.getState().token;
  } catch {
    return null;
  }
};

// ─── CSRF Token ───
let csrfTokenPromise: Promise<void> | null = null;

const getCsrfToken = async (): Promise<void> => {
  if (csrfTokenPromise) return csrfTokenPromise;
  csrfTokenPromise = axios
    .get(`${getPublicApiOrigin()}/sanctum/csrf-cookie`, { withCredentials: true })
    .then(() => undefined);
  return csrfTokenPromise;
};

// ─── API Client ───
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

// ─── Request Interceptor ───
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getPublicApiBaseUrl();
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───
// Fixed: NO more refresh loop. 401 = immediate logout + redirect.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear Zustand auth state (which also clears the persisted localStorage)
      useAuthStore.getState().logout();
      
      if (typeof window !== 'undefined') {
        // Clear any stale localStorage keys
        localStorage.removeItem('geopark_auth');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── API Service ───
export const api = {
  // Auth
  auth: {
    login: async (credentials: { email: string; password: string; device_name?: string }) => {
      await getCsrfToken();
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    },
    register: async (data: { first_name: string; last_name: string; email: string; password: string; password_confirmation: string }) => {
      await getCsrfToken();
      const response = await apiClient.post('/auth/register', data);
      return response.data;
    },
    logout: () => apiClient.post('/auth/logout'),
    logoutAll: () => apiClient.post('/auth/logout-all'),
    me: () => apiClient.get('/auth/me'),
    updateProfile: (data: FormData | Record<string, unknown>) => apiClient.put('/auth/profile', data),
    forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
      apiClient.post('/auth/reset-password', data),
  },

  // Dashboard (Admin)
  dashboard: {
    index: () => apiClient.get('/admin/dashboard'),
    reports: (params?: Record<string, unknown>) => apiClient.get('/admin/dashboard/reports', { params }),
  },

  // Users (Admin)
  users: {
    list: (params?: Record<string, unknown>) => apiClient.get('/admin/users', { params }),
    get: (id: number) => apiClient.get(`/admin/users/${id}`),
    update: (id: number, data: Record<string, unknown>) => apiClient.put(`/admin/users/${id}`, data),
    delete: (id: number) => apiClient.delete(`/admin/users/${id}`),
  },

  // Parkings
  parkings: {
    list: (params?: Record<string, unknown>) => apiClient.get('/parkings', { params }),
    nearby: (params: { latitude: number; longitude: number; radius?: number }) =>
      apiClient.get('/parkings/nearby', { params }),
    get: (id: number) => apiClient.get(`/parkings/${id}`),
    create: (data: FormData) => apiClient.post('/parkings', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id: number, data: FormData | Record<string, unknown>) => {
      if (data instanceof FormData) {
        // FormData requires method spoofing — HTML forms don't support PUT
        return apiClient.post(`/parkings/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { _method: 'PUT' },
        });
      }
      return apiClient.put(`/parkings/${id}`, data);
    },
    delete: (id: number) => apiClient.delete(`/parkings/${id}`),
    toggleStatus: (id: number) => apiClient.patch(`/parkings/${id}/status`),
    myParkings: () => apiClient.get('/my-parkings'),
    adminList: (params?: Record<string, unknown>) => apiClient.get('/admin/parkings', { params }),
  },

  // Bookings
  bookings: {
    list: (params?: Record<string, unknown>) => apiClient.get('/bookings', { params }),
    get: (id: number) => apiClient.get(`/bookings/${id}`),
    create: (data: Record<string, unknown>) => apiClient.post('/bookings', data),
    cancel: (id: number) => apiClient.post(`/bookings/${id}/cancel`),
    approve: (id: number) => apiClient.post(`/bookings/${id}/approve`),
    myBookings: () => apiClient.get('/my-bookings'),
    active: () => apiClient.get('/my-bookings/active'),
    history: () => apiClient.get('/my-bookings/history'),
    adminList: (params?: Record<string, unknown>) => apiClient.get('/admin/bookings', { params }),
  },

  // Offers
  offers: {
    list: (params?: Record<string, unknown>) => apiClient.get('/offers', { params }),
    get: (id: number) => apiClient.get(`/offers/${id}`),
    create: (data: Record<string, unknown>) => apiClient.post('/offers', data),
    accept: (id: number) => apiClient.post(`/offers/${id}/accept`),
    reject: (id: number, reason?: string) =>
      apiClient.post(`/offers/${id}/reject`, { reason }),
    myOffers: () => apiClient.get('/my-offers'),
    pending: () => apiClient.get('/my-offers/pending'),
  },

  // Pricing
  pricing: {
    rules: {
      list: (params?: Record<string, unknown>) => apiClient.get('/pricing-rules', { params }),
      get: (id: number) => apiClient.get(`/pricing-rules/${id}`),
      create: (data: Record<string, unknown>) => apiClient.post('/pricing-rules', data),
      update: (id: number, data: Record<string, unknown>) => apiClient.put(`/pricing-rules/${id}`, data),
      delete: (id: number) => apiClient.delete(`/pricing-rules/${id}`),
      adminList: (params?: Record<string, unknown>) => apiClient.get('/admin/pricing-rules', { params }),
    },
    calculate: (data: Record<string, unknown>) => apiClient.post('/pricing/calculate', data),
    calculateDynamic: (data: Record<string, unknown>) => apiClient.post('/pricing/calculate-dynamic', data),
    validateFormula: (formula: string) => apiClient.post('/pricing/validate-formula', { formula }),
    logs: (parkingId: number, params?: Record<string, unknown>) =>
      apiClient.get(`/parkings/${parkingId}/pricing-logs`, { params }),
  },

  // Notifications
  notifications: {
    list: (params?: Record<string, unknown>) => apiClient.get('/notifications', { params }),
    unread: () => apiClient.get('/notifications/unread'),
    markAsRead: (id: string) => apiClient.post(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.post('/notifications/read-all'),
    delete: (id: string) => apiClient.delete(`/notifications/${id}`),
    clearAll: () => apiClient.delete('/notifications'),
    count: () => apiClient.get('/notifications/count'),
  },

  // Parking Offers (Marketplace Admin)
  parkingOffers: {
    adminList: (params?: Record<string, unknown>) => apiClient.get('/admin/marketplace/parking-offers', { params }),
    stats: () => apiClient.get('/admin/marketplace/parking-offers/stats'),
  },

  // Wallets (Marketplace Admin)
  wallets: {
    adminList: (params?: Record<string, unknown>) => apiClient.get('/admin/marketplace/wallets', { params }),
  },

  // Transactions (Marketplace Admin)
  transactions: {
    adminList: (params?: Record<string, unknown>) => apiClient.get('/admin/marketplace/transactions', { params }),
  },

  // Ratings (Marketplace Admin)
  ratings: {
    adminList: (params?: Record<string, unknown>) => apiClient.get('/admin/marketplace/ratings', { params }),
  },

  // User Cars (Admin)
  userCars: {
    list: (params?: Record<string, unknown>) => apiClient.get('/admin/user-cars', { params }),
    get: (id: number) => apiClient.get(`/admin/user-cars/${id}`),
    delete: (id: number) => apiClient.delete(`/admin/user-cars/${id}`),
    flag: (id: number) => apiClient.post(`/admin/user-cars/${id}/flag`),
  },
};

// ─── Clean exports: only what's needed ───
// No separate tokenManager — Zustand persist is the single source of truth
export default apiClient;
