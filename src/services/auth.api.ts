import api from '../lib/axios';
import type { AuthResponse, User } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyInviteResponse {
  email: string;
  name: string;
  role: string;
  companyName?: string | null;
}

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const res = await api.post<any>('/auth/login', payload);
  return res.data?.data || res.data;
};

export const registerUser = async (_payload: any): Promise<AuthResponse> => {
  throw new Error('Public registration is disabled. Contact your administrator.');
};

export const fetchMe = async (): Promise<User> => {
  const res = await api.get<any>('/auth/me');
  return res.data?.data || res.data?.user || res.data;
};

/**
 * Verify invite token before rendering accept-invite page
 */
export const verifyInviteToken = async (token: string): Promise<VerifyInviteResponse> => {
  const res = await api.get<any>(`/auth/invite/${token}`);
  return res.data?.data || res.data;
};

/**
 * Accept invite and set new password
 */
export const acceptInvite = async (token: string, password: string): Promise<{ message: string; email?: string }> => {
  const res = await api.post<any>(`/auth/invite/${token}/accept`, { password });
  return res.data;
};

/**
 * Request a password reset link
 */
export const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
  const res = await api.post<any>('/auth/forgot-password', { email });
  return res.data;
};

/**
 * Verify password reset token
 */
export const verifyResetToken = async (token: string): Promise<{ valid: boolean; email: string }> => {
  const res = await api.get<any>(`/auth/reset-password/${token}`);
  return res.data?.data || res.data;
};

/**
 * Reset password with valid token
 */
export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
  const res = await api.post<any>(`/auth/reset-password/${token}`, { password });
  return res.data;
};
