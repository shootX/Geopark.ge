'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { useUIStore } from '@/store/uiStore';
import { useQueryClient } from '@tanstack/react-query';
import type { Booking } from '@/types';
import { getApiOrigin } from '@/utils/constants';

/**
 * RealtimeService - Manages Pusher/Laravel Echo connections.
 *
 * In production with Laravel Echo configured:
 *
 *   import Echo from 'laravel-echo';
 *   import Pusher from 'pusher-js';
 *
 *   const echo = new Echo({
 *     broadcaster: 'pusher',
 *     key: process.env.NEXT_PUBLIC_PUSHER_KEY,
 *     cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
 *     authEndpoint: '/broadcasting/auth',
 *     auth: {
 *       headers: { Authorization: `Bearer ${token}` },
 *     },
 *   });
 *
 * Polling fallback handles realtime when Echo is not configured.
 */

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useRealtime() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { addToast } = useUIStore();
  const updateBookingStatus = useBookingStore((s) => s.updateBookingStatus);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || !user) return;
    const userId = user.id;

    let echo: { disconnect: () => void } | null = null;
    let mounted = true;

    async function initEcho() {
      try {
        const Pusher = (await import('pusher-js')).default;
        const EchoModule = await import('laravel-echo');
        const Echo = EchoModule.default;

        const instance = new Echo({
          broadcaster: 'pusher',
          key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
          forceTLS: true,
          authEndpoint: `${getApiOrigin()}/broadcasting/auth`,
          auth: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });

        echo = instance;

        if (!mounted) return;

        const channelName = `App.Models.User.${userId}`;
        const channel = instance.private(channelName);

        channel.listen('.BookingCreated', () => {
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          addToast({
            type: 'info',
            title: 'Booking Created',
            message: 'Your booking has been created successfully.',
          });
        });

        channel.listen('.BookingApproved', (e: { booking?: Booking }) => {
          if (e?.booking) {
            updateBookingStatus(e.booking.id, e.booking.booking_status);
          }
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          addToast({
            type: 'success',
            title: 'Booking Approved!',
            message: 'Your parking booking has been approved.',
          });
        });

        channel.listen('.BookingRequestReceived', (e: { booking?: Booking }) => {
          if (e?.booking) {
            updateBookingStatus(e.booking.id, e.booking.booking_status);
          }
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['parking-offers'] });
          addToast({
            type: 'info',
            title: 'New Booking Request',
            message: 'You have a new booking request pending your approval.',
            duration: 8000,
          });
        });

        channel.listen('.BookingRejected', (e: { booking?: Booking; reason?: string }) => {
          if (e?.booking) {
            updateBookingStatus(e.booking.id, e.booking.booking_status);
          }
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['parking-offers'] });
          addToast({
            type: 'warning',
            title: 'Booking Rejected',
            message: e?.reason || 'Your booking request was rejected.',
            duration: 8000,
          });
        });

        channel.listen('.RenterStartedTrip', (e: { booking?: Booking }) => {
          if (e?.booking) {
            updateBookingStatus(e.booking.id, e.booking.booking_status);
          }
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          addToast({
            type: 'info',
            title: 'Renter On The Way',
            message: 'The renter has started their trip.',
          });
        });

        channel.listen('.RenterArrived', (e: { booking?: Booking; method?: string }) => {
          if (e?.booking) {
            updateBookingStatus(e.booking.id, e.booking.booking_status);
          }
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          addToast({
            type: 'success',
            title: 'Renter Arrived',
            message: e?.method === 'geofence'
              ? 'Renter detected at the parking location.'
              : 'Renter has confirmed arrival.',
          });
        });

        channel.listen('.PaymentReleased', (e: { booking?: Booking }) => {
          if (e?.booking) {
            updateBookingStatus(e.booking.id, e.booking.booking_status);
          }
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['wallet'] });
          addToast({
            type: 'success',
            title: 'Payment Released',
            message: 'Payment has been released to your wallet.',
          });
        });

        channel.listen('.RatingSubmitted', () => {
          queryClient.invalidateQueries({ queryKey: ['ratings'] });
          addToast({
            type: 'info',
            title: 'New Rating',
            message: 'You received a new rating.',
          });
        });

        channel.listen('.ParkingAvailabilityUpdated', () => {
          queryClient.invalidateQueries({ queryKey: ['parkings'] });
        });

        channel.listen('.OfferReceived', () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          addToast({
            type: 'info',
            title: 'New Offer!',
            message: 'You received a new parking offer.',
            duration: 8000,
          });
        });
      } catch {
        // Pusher/Echo not configured - polling fallback handles it
      }
    }

    initEcho();

    return () => {
      mounted = false;
      if (echo) {
        try {
          echo.disconnect();
        } catch {
          // ignore
        }
      }
    };
  }, [token, user, addToast, updateBookingStatus, queryClient]);

  return null;
}
