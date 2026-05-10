import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl, getApiOrigin } from '@/utils/constants';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

let sanctumCsrfPromise: Promise<void> | null = null;

/** Sanctum SPA: CSRF cookie on API host; session domain `.anovo.ge` shares with app. */
export function ensureSanctumCsrfCookie(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (sanctumCsrfPromise) {
    return sanctumCsrfPromise;
  }
  sanctumCsrfPromise = axios
    .get(`${getApiOrigin()}/sanctum/csrf-cookie`, {
      withCredentials: true,
      headers: { Accept: 'application/json' },
    })
    .then(() => undefined);
  return sanctumCsrfPromise;
}

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15_000,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  config.baseURL = getApiBaseUrl();
  await ensureSanctumCsrfCookie();
  if (authToken && config.headers) {
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${authToken}`);
    } else {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('geopark_token');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
