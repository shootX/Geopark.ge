import apiClient, { setAuthToken } from './api';
import type {
  ApiResponse,
  AuthCredentials,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from '@/types';

export const authService = {
  async login(credentials: AuthCredentials): Promise<{ token: string; user: User }> {
    const { data } = await apiClient.post<ApiResponse<{ token: string; user: User }>>(
      '/auth/login',
      credentials
    );
    const result = data.data!;
    setAuthToken(result.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('geopark_token', result.token);
    }
    return result;
  },

  async register(payload: RegisterPayload): Promise<{ token: string; user: User }> {
    const { data } = await apiClient.post<ApiResponse<{ token: string; user: User }>>(
      '/auth/register',
      payload
    );
    const result = data.data!;
    setAuthToken(result.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('geopark_token', result.token);
    }
    return result;
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
    return data.data!;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await apiClient.put<ApiResponse<User>>('/auth/profile', payload);
    return data.data!;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    }
    setAuthToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('geopark_token');
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await apiClient.post('/auth/logout-all');
    } catch {
      // ignore
    }
    setAuthToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('geopark_token');
    }
  },
};
