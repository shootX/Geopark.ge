import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parkingService } from '@/services/parking';
import { bookingService } from '@/services/booking';
import { notificationService } from '@/services/notifications';
import { useMapStore } from '@/store/mapStore';
import { useAuthStore } from '@/store/authStore';
import { STALE_TIMES } from '@/utils/constants';
import type {
  Parking,
  NearbyParkingsQuery,
  CreateBookingPayload,
  PriceCalculatePayload,
  PriceCalculation,
} from '@/types';

// ─── PARKING HOOKS ───

export function useNearbyParkings(query: NearbyParkingsQuery) {
  const setNearbyParkings = useMapStore((s) => s.setNearbyParkings);

  return useQuery({
    queryKey: ['parkings', 'nearby', query],
    queryFn: async () => {
      const parkings = await parkingService.getNearby(query);
      setNearbyParkings(parkings);
      return parkings;
    },
    staleTime: STALE_TIMES.parkings,
    gcTime: 5 * 60_000,
    enabled: !!query.latitude && !!query.longitude,
  });
}

export function useParkingDetail(id: number | null) {
  return useQuery({
    queryKey: ['parkings', id],
    queryFn: () => parkingService.getById(id!),
    enabled: !!id,
    staleTime: STALE_TIMES.parkings,
  });
}

export function useAllParkings(filters?: { onlyAvailable?: boolean }) {
  return useQuery({
    queryKey: ['parkings', 'all', filters],
    queryFn: () => parkingService.getAll(filters),
    staleTime: STALE_TIMES.parkings,
  });
}

// ─── BOOKING HOOKS ───

export function useMyBookings() {
  return useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: () => bookingService.getMyBookings(),
    staleTime: STALE_TIMES.bookings,
  });
}

export function useActiveBooking() {
  return useQuery({
    queryKey: ['bookings', 'active'],
    queryFn: () => bookingService.getActiveBooking(),
    staleTime: STALE_TIMES.bookings,
  });
}

export function useBookingHistory() {
  return useQuery({
    queryKey: ['bookings', 'history'],
    queryFn: () => bookingService.getHistory(),
    staleTime: STALE_TIMES.bookings,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['parkings', 'nearby'] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      bookingService.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['parkings'] });
    },
  });
}

// ─── PRICING HOOKS ───

export function useCalculatePrice() {
  return useMutation({
    mutationFn: (payload: PriceCalculatePayload): Promise<PriceCalculation> =>
      bookingService.calculatePrice(payload),
  });
}

// ─── NOTIFICATION HOOKS ───

export function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll(),
    staleTime: STALE_TIMES.notifications,
    refetchInterval: isAuthenticated ? 30_000 : false,
    enabled: isAuthenticated,
  });
}

export function useUnreadNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationService.getUnread(),
    staleTime: STALE_TIMES.notifications,
    refetchInterval: isAuthenticated ? 15_000 : false,
    enabled: isAuthenticated,
  });
}

export function useNotificationCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: () => notificationService.getCount(),
    staleTime: STALE_TIMES.notifications,
    refetchInterval: isAuthenticated ? 15_000 : false,
    enabled: isAuthenticated,
  });
}
