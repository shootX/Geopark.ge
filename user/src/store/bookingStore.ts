import { create } from 'zustand';
import type { Booking, CreateBookingPayload } from '@/types';
import { bookingService } from '@/services/booking';

interface BookingState {
  activeBooking: Booking | null;
  bookings: Booking[];
  bookingHistory: Booking[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;

  // Current booking flow
  selectedParkingId: number | null;
  startTime: string | null;
  endTime: string | null;

  fetchBookings: () => Promise<void>;
  fetchActiveBooking: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  createBooking: (payload: CreateBookingPayload) => Promise<Booking>;
  cancelBooking: (id: number, reason?: string) => Promise<void>;
  setBookingTimeSlot: (start: string, end: string) => void;
  setSelectedParking: (id: number | null) => void;
  clearBookingFlow: () => void;
  clearError: () => void;
  updateBookingStatus: (bookingId: number, status: Booking['booking_status']) => void;
}

export const useBookingStore = create<BookingState>()((set, get) => ({
  activeBooking: null,
  bookings: [],
  bookingHistory: [],
  isLoading: false,
  isCreating: false,
  error: null,
  selectedParkingId: null,
  startTime: null,
  endTime: null,

  fetchBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const bookings = await bookingService.getMyBookings();
      set({ bookings, isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to fetch bookings';
      set({ isLoading: false, error: message });
    }
  },

  fetchActiveBooking: async () => {
    try {
      const active = await bookingService.getActiveBooking();
      set({ activeBooking: active });
    } catch {
      // no active booking
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const history = await bookingService.getHistory();
      set({ bookingHistory: history, isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to fetch booking history';
      set({ isLoading: false, error: message });
    }
  },

  createBooking: async (payload) => {
    set({ isCreating: true, error: null });
    try {
      const booking = await bookingService.create(payload);
      set({ isCreating: false, activeBooking: booking });
      return booking;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create booking';
      set({ isCreating: false, error: message });
      throw err;
    }
  },

  cancelBooking: async (id, reason) => {
    set({ isLoading: true });
    try {
      await bookingService.cancel(id, reason);
      const { bookings, activeBooking } = get();
      set({
        bookings: bookings.map((b) =>
          b.id === id ? { ...b, booking_status: 'cancelled' as Booking['booking_status'] } : b
        ),
        activeBooking: activeBooking?.id === id ? { ...activeBooking, booking_status: 'cancelled' as Booking['booking_status'] } : activeBooking,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to cancel booking';
      set({ isLoading: false, error: message });
    }
  },

  setBookingTimeSlot: (start, end) => set({ startTime: start, endTime: end }),

  setSelectedParking: (id) => set({ selectedParkingId: id }),

  clearBookingFlow: () =>
    set({
      selectedParkingId: null,
      startTime: null,
      endTime: null,
      error: null,
    }),

  clearError: () => set({ error: null }),

  updateBookingStatus: (bookingId, status) => {
    const { bookings, activeBooking } = get();
    set({
      bookings: bookings.map((b) =>
        b.id === bookingId ? { ...b, booking_status: status } : b
      ),
      activeBooking:
        activeBooking?.id === bookingId
          ? { ...activeBooking, booking_status: status }
          : activeBooking,
    });
  },
}));
