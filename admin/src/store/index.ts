// ============================================================
// Geopark - Zustand Stores
// SINGLE SOURCE OF TRUTH — Zustand persist handles all persistence
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';
import type { User, AppNotification, DashboardStats } from '@/types';

// ─── Auth Store ───
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, token: string) => void;
  /** Full logout: clears state, calls backend, redirects */
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),

      login: (user, token) => {
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await api.auth.logout();
        } catch {
          // Even if API call fails, clear local state
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          // Clear localStorage completely for auth
          if (typeof window !== 'undefined') {
            localStorage.removeItem('geopark_auth');
            // Redirect to login
            window.location.href = '/auth/login';
          }
        }
      },

      hasRole: (role) => {
        const user = get().user;
        return user?.role === role;
      },

      hasPermission: (permission) => {
        const user = get().user;
        // Admin bypass: admins have all permissions
        if (user?.role === 'admin') return true;
        return user?.permissions?.includes(permission) ?? false;
      },
    }),
    {
      name: 'geopark_auth',
      // Only persist these fields — exclude isLoading (transient)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ─── Notification Store ───
interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  setNotifications: (notifications: AppNotification[]) => void;
  addNotification: (notification: AppNotification) => void;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      isOpen: false,

      setNotifications: (notifications) => set({ notifications }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        })),

      setUnreadCount: (count) => set({ unreadCount: count }),

      decrementUnread: () =>
        set((state) => ({
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            read_at: n.read_at || new Date().toISOString(),
          })),
          unreadCount: 0,
        })),

      clearAll: () =>
        set({ notifications: [], unreadCount: 0 }),

      setIsOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: 'geopark_notifications',
      partialize: (state) => ({
        unreadCount: state.unreadCount,
      }),
    }
  )
);

// ─── Dashboard Store ───
interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  setStats: (stats: DashboardStats) => void;
  setLoading: (loading: boolean) => void;
  updateStat: (key: keyof DashboardStats, value: number) => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  stats: null,
  isLoading: false,

  setStats: (stats) => set({ stats }),

  setLoading: (isLoading) => set({ isLoading }),

  updateStat: (key, value) =>
    set((state) => ({
      stats: state.stats ? { ...state.stats, [key]: value } : null,
    })),
}));

// ─── UI Store ───
interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      theme: 'system',
      mobileMenuOpen: false,
      searchOpen: false,

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
    }),
    {
      name: 'geopark_ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
