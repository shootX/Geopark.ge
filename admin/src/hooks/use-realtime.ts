'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore, useNotificationStore, useDashboardStore } from '@/store';
import { getPublicApiOrigin } from '@/lib/api-public';
import type Echo from 'laravel-echo';
import type Pusher from 'pusher-js';

// ─── Type Definitions ───
interface RealtimeNotification {
  id: string;
  type: string;
  data: {
    title: string;
    message: string;
    icon?: string;
    action_url?: string;
  };
  notifiable_type: string;
  notifiable_id: number;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RealtimeEvent {
  notification?: RealtimeNotification;
  stats?: {
    active_bookings?: number;
    occupancy_rate?: number;
  };
}

// ─── Realtime Hook ───
// Integrates with Laravel Echo + Pusher for live updates
// If Pusher keys aren't configured, falls back gracefully (no-op)
export function useRealtime() {
  const initialized = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const echoRef = useRef<any>(null);

  useEffect(() => {
    if (initialized.current) return;
    
    const token = useAuthStore.getState().token;
    if (!token) return;

    // Check if Pusher is configured
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    if (!pusherKey || pusherKey === '') return; // Not configured, skip realtime

    let echoInstance: any = null;

    const initEcho = async () => {
      try {
        const PusherClient = (await import('pusher-js')).default;
        const { default: EchoClient } = await import('laravel-echo');

        echoInstance = new EchoClient({
          broadcaster: 'pusher',
          key: pusherKey,
          cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1',
          authEndpoint: `${getPublicApiOrigin()}/broadcasting/auth`,
          auth: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          encrypted: true,
        }) as any;

        echoRef.current = echoInstance;

        // ─── Admin Global Channel ───
        const adminChannel = echoInstance.private('admin.notifications');

        adminChannel.listen('.BookingCreated', (e: RealtimeEvent) => {
          if (e.notification) {
            useNotificationStore.getState().addNotification(e.notification);
          }
          if (e.stats) {
            useDashboardStore.getState().updateStat('active_bookings', e.stats.active_bookings ?? 0);
          }
        });

        adminChannel.listen('.BookingApproved', (e: RealtimeEvent) => {
          if (e.notification) {
            useNotificationStore.getState().addNotification(e.notification);
          }
        });

        adminChannel.listen('.OfferReceived', (e: RealtimeEvent) => {
          if (e.notification) {
            useNotificationStore.getState().addNotification(e.notification);
          }
        });

        adminChannel.listen('.ParkingAvailabilityUpdated', (e: RealtimeEvent) => {
          if (e.stats) {
            useDashboardStore.getState().updateStat('occupancy_rate', e.stats.occupancy_rate ?? 0);
          }
        });

        initialized.current = true;
      } catch (err) {
        console.warn('[Realtime] Failed to initialize Echo:', err);
      }
    };

    initEcho();

    // ─── Cleanup ───
    return () => {
      if (echoInstance) {
        try {
          echoInstance.leaveChannel('admin.notifications');
          echoInstance.disconnect();
        } catch {
          // Ignore cleanup errors
        }
      }
      echoRef.current = null;
      initialized.current = false;
    };
  }, []);
}
