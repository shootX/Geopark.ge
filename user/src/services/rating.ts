import apiClient from './api';
import type { ApiResponse, Rating, PaginationMeta } from '@/types';

function extractRatingList(payload: unknown): Rating[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as Rating[];
  const list = (payload as { ratings?: unknown }).ratings;
  if (Array.isArray(list)) return list as Rating[];
  return [];
}

export const ratingService = {
  async submit(bookingId: number, rating: number, comment?: string): Promise<Rating> {
    const { data } = await apiClient.post<ApiResponse<Rating>>(`/bookings/${bookingId}/ratings`, {
      rating,
      comment,
    });
    return data.data!;
  },

  async getReceived(): Promise<{ ratings: Rating[]; meta?: PaginationMeta }> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/ratings/received');
    return {
      ratings: extractRatingList(data.data),
      meta: (data.data as { meta?: PaginationMeta })?.meta,
    };
  },

  async getGiven(): Promise<{ ratings: Rating[]; meta?: PaginationMeta }> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/ratings/given');
    return {
      ratings: extractRatingList(data.data),
      meta: (data.data as { meta?: PaginationMeta })?.meta,
    };
  },

  async getBookingRatings(bookingId: number): Promise<Rating[]> {
    const { data } = await apiClient.get<ApiResponse<unknown>>(`/bookings/${bookingId}/ratings`);
    return extractRatingList(data.data);
  },
};
