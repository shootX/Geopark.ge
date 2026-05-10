import apiClient from './api';
import type {
  ApiResponse,
  ParkingOffer,
  ParkingOfferFilters,
  PaginationMeta,
} from '@/types';

function extractOfferList(payload: unknown): ParkingOffer[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as ParkingOffer[];
  const list = (payload as { offers?: unknown }).offers;
  if (Array.isArray(list)) return list as ParkingOffer[];
  return [];
}

export const parkingOfferService = {
  async getAll(
    filters?: Partial<ParkingOfferFilters>
  ): Promise<{ offers: ParkingOffer[]; meta?: PaginationMeta }> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/parking-offers', {
      params: filters,
    });
    return {
      offers: extractOfferList(data.data),
      meta: (data.data as { meta?: PaginationMeta })?.meta,
    };
  },

  async getById(id: number): Promise<ParkingOffer> {
    const { data } = await apiClient.get<ApiResponse<ParkingOffer>>(`/parking-offers/${id}`);
    return data.data!;
  },

  async create(payload: Partial<ParkingOffer> & { availability?: unknown[] }): Promise<ParkingOffer> {
    const { data } = await apiClient.post<ApiResponse<ParkingOffer>>('/parking-offers', payload);
    return data.data!;
  },

  async update(id: number, payload: Partial<ParkingOffer>): Promise<ParkingOffer> {
    const { data } = await apiClient.put<ApiResponse<ParkingOffer>>(`/parking-offers/${id}`, payload);
    return data.data!;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/parking-offers/${id}`);
  },

  async getMyOffers(): Promise<ParkingOffer[]> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/my-parking-offers');
    return extractOfferList(data.data);
  },

  async activate(id: number): Promise<ParkingOffer> {
    const { data } = await apiClient.post<ApiResponse<ParkingOffer>>(`/parking-offers/${id}/activate`);
    return data.data!;
  },

  async pause(id: number): Promise<ParkingOffer> {
    const { data } = await apiClient.post<ApiResponse<ParkingOffer>>(`/parking-offers/${id}/pause`);
    return data.data!;
  },

  async addImages(id: number, files: File[]): Promise<ParkingOffer> {
    const formData = new FormData();
    files.forEach((file) => formData.append('images[]', file));
    const { data } = await apiClient.post<ApiResponse<ParkingOffer>>(
      `/parking-offers/${id}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data!;
  },

  async removeImage(offerId: number, imageId: number): Promise<ParkingOffer> {
    const { data } = await apiClient.delete<ApiResponse<ParkingOffer>>(
      `/parking-offers/${offerId}/images/${imageId}`
    );
    return data.data!;
  },
};
