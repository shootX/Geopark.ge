import apiClient from './api';
import type {
  ApiResponse,
  Parking,
  NearbyParkingsQuery,
  ParkingFilters,
} from '@/types';

/** Laravel unwraps listings as `{ parkings: Parking[], meta? }`, not plain `Parking[]`. */
function extractParkingList(payload: ApiResponse<{ parkings: Parking[] } | Parking[]>['data']): Parking[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const list = (payload as { parkings?: unknown }).parkings;
  if (Array.isArray(list)) return list as Parking[];
  return [];
}

export const parkingService = {
  async getNearby(query: NearbyParkingsQuery): Promise<Parking[]> {
    const { data } = await apiClient.get<ApiResponse<{ parkings: Parking[] }>>('/parkings/nearby', {
      params: {
        latitude: query.latitude,
        longitude: query.longitude,
        radius: query.radius ?? 10,
        min_price: query.min_price,
        max_price: query.max_price,
        only_available: query.only_available,
      },
    });
    return extractParkingList(data.data);
  },

  async getById(id: number): Promise<Parking> {
    const { data } = await apiClient.get<ApiResponse<Parking>>(`/parkings/${id}`);
    return data.data!;
  },

  async getAll(filters?: Partial<ParkingFilters>): Promise<Parking[]> {
    const { data } = await apiClient.get<ApiResponse<{ parkings: Parking[] }>>('/parkings', {
      params: {
        min_price: filters?.minPrice,
        max_price: filters?.maxPrice,
        only_available: filters?.onlyAvailable || undefined,
      },
    });
    return extractParkingList(data.data);
  },

  async search(query: string): Promise<Parking[]> {
    const { data } = await apiClient.get<ApiResponse<{ parkings: Parking[] }>>('/parkings', {
      params: { search: query },
    });
    return extractParkingList(data.data);
  },
};
