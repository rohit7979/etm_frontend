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
    if (error.response?.status === 401) {
      localStorage.removeItem('etm_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
