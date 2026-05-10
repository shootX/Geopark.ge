export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

/** API base URL from NEXT_PUBLIC_API_URL (bundled at build time). No loopback defaults. */
export function getApiBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!u) {
    throw new Error(
      'Missing NEXT_PUBLIC_API_URL (set /api/v1 in .env.production)'
    );
  }
  return u.replace(/\/+$/, '');
}

export function getApiOrigin(): string {
  return getApiBaseUrl().replace(/\/api\/v1\/?$/i, '');
}

export const MAP_CONFIG = {
  center: { lat: 41.7151, lng: 44.8271 },
  zoom: 12,
  maxZoom: 18,
  minZoom: 8,
  style: 'mapbox://styles/mapbox/streets-v12',
} as const;

export const PUSHER_CONFIG = {
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
};

export const DEFAULT_RADIUS_KM = 10;
export const DEBOUNCE_DELAY = 300;
export const STALE_TIMES = {
  parkings: 60_000,
  bookings: 30_000,
  pricing: 10_000,
  notifications: 30_000,
  user: 300_000,
} as const;
