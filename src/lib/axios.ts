import axios from 'axios';
import { getToken } from '../utils/token';

export const BASE_URL =
  import.meta.env.VITE_ENV != undefined && import.meta.env.VITE_ENV === 'LOCAL'
    ? 'http://localhost:5000/api'
    : 'https://api.etm.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── Request: attach Bearer token ────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response: handle 401s ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl: string = error.config?.url ?? '';

    // Endpoints that are allowed to return 401 without triggering a global redirect to /login:
    // Any /auth/* request is handled by the calling page/context
    const isAuthEndpoint = requestUrl.includes('/auth/');

    // Public pages where users might be unauthenticated
    const isPublicPage =
      window.location.pathname.startsWith('/login') ||
      window.location.pathname.startsWith('/reset-password') ||
      window.location.pathname.startsWith('/accept-invite') ||
      window.location.pathname.startsWith('/forgot-password');

    if (error.response?.status === 401 && !isAuthEndpoint && !isPublicPage) {
      // Clear both the token AND the cached user so the next app load
      // doesn't incorrectly restore a stale session.
      localStorage.removeItem('etm_token');
      localStorage.removeItem('etm_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
