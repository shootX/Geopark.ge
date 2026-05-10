import apiClient from './api';
import type {
  ApiResponse,
  UserCar,
  VehicleFormData,
} from '@/types';

function extractUserCarList(payload: unknown): UserCar[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as UserCar[];
  const list = (payload as { cars?: unknown }).cars ?? (payload as { data?: unknown }).data;
  if (Array.isArray(list)) return list as UserCar[];
  return [];
}

function extractSingleUserCar(payload: unknown): UserCar | null {
  if (!payload) return null;
  if (typeof payload === 'object' && 'id' in (payload as Record<string, unknown>)) {
    return payload as UserCar;
  }
  return null;
}

export const userCarService = {
  /**
   * Get all vehicles for the authenticated user.
   */
  async getAll(): Promise<UserCar[]> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/user-cars');
    return extractUserCarList(data.data);
  },

  /**
   * Get a single vehicle by ID.
   */
  async getById(id: number): Promise<UserCar> {
    const { data } = await apiClient.get<ApiResponse<UserCar>>(`/user-cars/${id}`);
    return data.data!;
  },

  /**
   * Create a new vehicle.
   */
  async create(payload: VehicleFormData): Promise<UserCar> {
    const { data } = await apiClient.post<ApiResponse<UserCar>>('/user-cars', payload);
    return data.data!;
  },

  /**
   * Update an existing vehicle.
   */
  async update(id: number, payload: Partial<VehicleFormData>): Promise<UserCar> {
    const { data } = await apiClient.put<ApiResponse<UserCar>>(`/user-cars/${id}`, payload);
    return data.data!;
  },

  /**
   * Delete a vehicle.
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/user-cars/${id}`);
  },

  /**
   * Set a vehicle as the default.
   */
  async setDefault(id: number): Promise<UserCar> {
    const { data } = await apiClient.post<ApiResponse<UserCar>>(`/user-cars/${id}/set-default`);
    return data.data!;
  },
};
