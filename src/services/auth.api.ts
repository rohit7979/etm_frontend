import api from '../lib/axios';
import type { AuthResponse, User } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
}

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
};

export const fetchMe = async (): Promise<User> => {
  // Backend returns { user: { id, name, email, role } }
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
};
