import api from '../lib/axios';
import type { User } from '../types';

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateEmployeePayload {
  name?: string;
  status?: 'active' | 'inactive';
}

export const fetchCompanyEmployees = async (): Promise<User[]> => {
  const res = await api.get<any>('/employees');
  return res.data?.data || res.data;
};

export const createEmployee = async (payload: CreateEmployeePayload): Promise<User> => {
  const res = await api.post<any>('/employees', payload);
  return res.data?.data || res.data;
};

export const updateEmployee = async (
  id: string,
  payload: UpdateEmployeePayload
): Promise<User> => {
  const res = await api.patch<any>(`/employees/${id}`, payload);
  return res.data?.data || res.data;
};
