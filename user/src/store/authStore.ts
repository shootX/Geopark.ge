import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthCredentials, RegisterPayload } from '@/types';
import { authService } from '@/services/auth';
import { setAuthToken } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: AuthCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.login(credentials);
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          let message = 'Login failed';
          if (err && typeof err === 'object' && 'response' in err) {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
            if (axiosErr.response?.data?.errors) {
              const firstErrorKey = Object.keys(axiosErr.response.data.errors)[0];
              message = axiosErr.response.data.errors[firstErrorKey][0];
            } else if (axiosErr.response?.data?.message) {
              message = axiosErr.response.data.message;
            }
          } else if (err instanceof Error) {
            message = err.message;
          }
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.register(payload);
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          let message = 'Registration failed';
          if (err && typeof err === 'object' && 'response' in err) {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
            if (axiosErr.response?.data?.errors) {
              const firstErrorKey = Object.keys(axiosErr.response.data.errors)[0];
              message = axiosErr.response.data.errors[firstErrorKey][0];
            } else if (axiosErr.response?.data?.message) {
              message = axiosErr.response.data.message;
            }
          } else if (err instanceof Error) {
            message = err.message;
          }
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // ignore
        }
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      fetchUser: async () => {
        try {
          const user = await authService.me();
          set({ user, isAuthenticated: true });
        } catch {
          // Token is invalid
          set({ user: null, token: null, isAuthenticated: false });
          localStorage.removeItem('geopark_token');
        }
      },

      updateUser: (user) => set({ user }),

      clearError: () => set({ error: null }),

      initialize: async () => {
        const { token } = get();
        if (token) {
          setAuthToken(token);
          try {
            const user = await authService.me();
            set({ user, isAuthenticated: true });
          } catch {
            set({ user: null, token: null, isAuthenticated: false });
            localStorage.removeItem('geopark_token');
          }
        }
      },
    }),
    {
      name: 'geopark-auth',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAuthToken(state.token);
        }
      },
    }
  )
);
