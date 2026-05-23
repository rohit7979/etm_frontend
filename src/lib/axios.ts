import axios from 'axios';
import { getToken } from '../utils/token';

export const BASE_URL =
  import.meta.env.VITE_ENV != undefined && import.meta.env.VITE_ENV === 'LOCAL'
    ? 'http://localhost:5000/api'
    : 'https://api.etm.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
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

    // Endpoints that are allowed to return 401 without triggering a logout:
    //  • /auth/login    — wrong credentials → let the form show the error
    //  • /auth/register — shouldn't 401 but guard anyway
    //  • /auth/me       — AuthContext owns this response: it decides whether to
    //                     log out (expired token) or keep the cached session
    //                     (backend temporarily unavailable)
    const isHandledLocally =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/me');

    if (error.response?.status === 401 && !isHandledLocally) {
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
