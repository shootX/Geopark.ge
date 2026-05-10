import apiClient from './api';
import type { ApiResponse, LiveLocation, Booking } from '@/types';

export const locationService = {
  async updateLocation(
    bookingId: number,
    latitude: number,
    longitude: number,
    heading?: number,
    speed?: number
  ): Promise<LiveLocation> {
    const { data } = await apiClient.post<ApiResponse<LiveLocation>>(
      `/bookings/${bookingId}/location`,
      { latitude, longitude, heading, speed }
    );
    return data.data!;
  },

  async getLocation(bookingId: number): Promise<{
    locations: LiveLocation[];
    parking_location: Record<string, unknown> | null;
    eta_minutes: number | null;
  }> {
    const { data } = await apiClient.get<ApiResponse<unknown>>(`/bookings/${bookingId}/location`);
    const result = data.data as {
      locations: LiveLocation[];
      parking_location: Record<string, unknown> | null;
      eta_minutes: number | null;
    };
    return result;
  },

  async confirmArrival(bookingId: number): Promise<Booking> {
    const { data } = await apiClient.post<ApiResponse<Booking>>(
      `/bookings/${bookingId}/confirm-arrival`
    );
    return data.data!;
  },

  async ownerConfirmArrival(bookingId: number): Promise<Booking> {
    const { data } = await apiClient.post<ApiResponse<Booking>>(
      `/bookings/${bookingId}/owner-confirm-arrival`
    );
    return data.data!;
  },

  async getEta(bookingId: number): Promise<{ eta_minutes: number | null }> {
    const { data } = await apiClient.get<ApiResponse<{ eta_minutes: number | null }>>(
      `/bookings/${bookingId}/eta`
    );
    return data.data!;
  },
};
