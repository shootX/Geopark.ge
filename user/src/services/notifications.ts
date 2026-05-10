import apiClient from './api';
import type { ApiResponse, AppNotification } from '@/types';

/**
 * Laravel paginated responses wrap collections, e.g.
 * `{ notifications: AppNotification[], unread_count: N, meta: {...} }`.
 * Extract the array safely.
 */
function extractNotificationList(payload: unknown): AppNotification[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as AppNotification[];
  const list = (payload as { notifications?: unknown }).notifications;
  if (Array.isArray(list)) return list as AppNotification[];
  return [];
}

export const notificationService = {
  async getAll(): Promise<AppNotification[]> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/notifications');
    return extractNotificationList(data.data);
  },

  async getUnread(): Promise<AppNotification[]> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/notifications/unread');
    return extractNotificationList(data.data);
  },

  async getCount(): Promise<number> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/notifications/count');
    // The API returns { unread_count: N } inside data.data
    if (data.data && typeof data.data === 'object' && 'unread_count' in (data.data as Record<string, unknown>)) {
      return (data.data as { unread_count: number }).unread_count;
    }
    return typeof data.data === 'number' ? data.data : 0;
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient.post(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/read-all');
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },

  async clearAll(): Promise<void> {
    await apiClient.delete('/notifications');
  },
};
