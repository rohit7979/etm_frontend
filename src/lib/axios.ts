import axios from 'axios';
import { getToken } from '../utils/token';



export const BASE_URL = 
import.meta.env.VITE_ENV != undefined && import.meta.env.VITE_ENV == "LOCAL"
    ? 'http://localhost:5000/api'
    : 'https://api.etm.com/api'; // default to production

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl: string = error.config?.url ?? '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    // Only force-redirect to login for 401s on protected routes,
    // NOT when the login/register API itself returns 401 (wrong credentials).
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('etm_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
