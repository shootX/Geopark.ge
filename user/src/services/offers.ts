import apiClient from './api';
import type { ApiResponse, Offer } from '@/types';

/**
 * Laravel paginated responses wrap collections, e.g.
 * `{ offers: Offer[], meta: {...} }`.  Extract the array safely.
 */
function extractOfferList(payload: unknown): Offer[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as Offer[];
  const list = (payload as { offers?: unknown }).offers;
  if (Array.isArray(list)) return list as Offer[];
  return [];
}

function extractSingleOffer(payload: unknown): Offer | null {
  if (!payload) return null;
  const list = extractOfferList(payload);
  if (list.length > 0) return list[0];
  if (typeof payload === 'object' && 'id' in (payload as Record<string, unknown>)) {
    return payload as Offer;
  }
  return null;
}

export interface SendOfferPayload {
  receiver_id: number;
  booking_id: number;
  price_offer: number;
  message?: string;
}

export const offerService = {
  async getAll(): Promise<Offer[]> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/offers');
    return extractOfferList(data.data);
  },

  async getById(id: number): Promise<Offer> {
    const { data } = await apiClient.get<ApiResponse<Offer>>(`/offers/${id}`);
    return data.data!;
  },

  async send(payload: SendOfferPayload): Promise<Offer> {
    const { data } = await apiClient.post<ApiResponse<Offer>>('/offers', payload);
    return data.data!;
  },

  async accept(id: number): Promise<Offer> {
    const { data } = await apiClient.post<ApiResponse<Offer>>(`/offers/${id}/accept`);
    return data.data!;
  },

  async reject(id: number, reason?: string): Promise<Offer> {
    const { data } = await apiClient.post<ApiResponse<Offer>>(`/offers/${id}/reject`, { reason });
    return data.data!;
  },

  async getMyOffers(): Promise<Offer[]> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/my-offers');
    return extractOfferList(data.data);
  },

  async getPending(): Promise<Offer[]> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/my-offers/pending');
    return extractOfferList(data.data);
  },
};
