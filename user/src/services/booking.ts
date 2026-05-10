import apiClient from './api';
import type {
  ApiResponse,
  Booking,
  CreateBookingPayload,
  PriceCalculation,
  PriceCalculatePayload,
} from '@/types';

/**
 * Laravel paginated responses wrap collections in a keyed object, e.g.
 * `{ bookings: Booking[], meta: {...} }`.  Extract the array safely.
 */
function extractBookingList(payload: unknown): Booking[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as Booking[];
  const list = (payload as { bookings?: unknown }).bookings;
  if (Array.isArray(list)) return list as Booking[];
  return [];
}

function extractSingleBooking(payload: unknown): Booking | null {
  if (!payload) return null;
  // If the response is wrapped in { bookings: [...] }, grab the first one
  const list = extractBookingList(payload);
  if (list.length > 0) return list[0];
  // Otherwise assume the payload itself is the booking object
  if (typeof payload === 'object' && 'id' in (payload as Record<string, unknown>)) {
    return payload as Booking;
  }
  return null;
}

export const bookingService = {
  // ─── Bookings ───

  async getMyBookings(): Promise<Booking[]> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/my-bookings');
    return extractBookingList(data.data);
  },

  async getActiveBooking(): Promise<Booking | null> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/my-bookings/active');
    return extractSingleBooking(data.data);
  },

  async getHistory(): Promise<Booking[]> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/my-bookings/history');
    return extractBookingList(data.data);
  },

  async getById(id: number): Promise<Booking> {
    const { data } = await apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return data.data!;
  },

  async create(payload: CreateBookingPayload): Promise<Booking> {
    const { data } = await apiClient.post<ApiResponse<Booking>>('/bookings', payload);
    return data.data!;
  },

  async cancel(id: number, reason?: string): Promise<Booking> {
    const { data } = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/cancel`, {
      reason,
    });
    return data.data!;
  },

  // ─── Marketplace Lifecycle ───

  async approve(id: number): Promise<Booking> {
    const { data } = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/approve`);
    return data.data!;
  },

  async reject(id: number, reason?: string): Promise<Booking> {
    const { data } = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/reject`, {
      reason,
    });
    return data.data!;
  },

  async startTrip(id: number): Promise<Booking> {
    const { data } = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/start-trip`);
    return data.data!;
  },

  async confirmArrival(id: number): Promise<Booking> {
    const { data } = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/confirm-arrival`);
    return data.data!;
  },

  async completeLifecycle(id: number): Promise<Booking> {
    const { data } = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/complete`);
    return data.data!;
  },

  async getPendingApproval(): Promise<Booking[]> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/my-bookings/pending-approval');
    return extractBookingList(data.data);
  },

  // ─── Pricing ───

  async calculatePrice(payload: PriceCalculatePayload): Promise<PriceCalculation> {
    const { data } = await apiClient.post<ApiResponse<PriceCalculation>>(
      '/pricing/calculate',
      payload
    );
    return data.data!;
  },

  async calculateDynamic(payload: PriceCalculatePayload): Promise<PriceCalculation> {
    const { data } = await apiClient.post<ApiResponse<PriceCalculation>>(
      '/pricing/calculate-dynamic',
      payload
    );
    return data.data!;
  },
};
