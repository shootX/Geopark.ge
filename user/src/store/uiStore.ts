import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  // Sidebar / Drawer
  isMobileMenuOpen: boolean;
  isFilterPanelOpen: boolean;
  isSearchOpen: boolean;

  // Toast notifications
  toasts: Toast[];

  // Global loading
  isGlobalLoading: boolean;

  // Bottom sheet
  bottomSheetHeight: number;
  isDraggingSheet: boolean;

  // Actions
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setFilterPanelOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  setGlobalLoading: (loading: boolean) => void;
  setBottomSheetHeight: (height: number) => void;
  setDraggingSheet: (dragging: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isMobileMenuOpen: false,
  isFilterPanelOpen: false,
  isSearchOpen: false,
  toasts: [],
  isGlobalLoading: false,
  bottomSheetHeight: 300,
  isDraggingSheet: false,

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  setFilterPanelOpen: (open) => set({ isFilterPanelOpen: open }),

  setSearchOpen: (open) => set({ isSearchOpen: open }),

  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast: Toast = { ...toast, id };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-remove after duration
    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  setBottomSheetHeight: (height) => set({ bottomSheetHeight: height }),

  setDraggingSheet: (dragging) => set({ isDraggingSheet: dragging }),
}));
