/** Default when env missing (never loopback — production bundles set NEXT_PUBLIC_API_URL). */
const DEFAULT_API_BASE = '/api/v1';

export function getPublicApiBaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_API_URL?.trim();
  const base = v && v.length > 0 ? v : DEFAULT_API_BASE;
  return base.replace(/\/+$/, '');
}

export function getPublicApiOrigin(): string {
  return getPublicApiBaseUrl().replace(/\/api\/v1\/?$/i, '');
}
