import api from '../lib/axios';
import type { Company, User } from '../types';

export interface CreateCompanyPayload {
  name: string;
  email: string;
}

export interface CreateAdminPayload {
  name: string;
  email: string;
  companyId?: string;
}

export const fetchCompanies = async (): Promise<Company[]> => {
  const res = await api.get<any>('/companies');
  return res.data?.data || res.data;
};

export const createCompany = async (payload: CreateCompanyPayload): Promise<Company> => {
  const res = await api.post<any>('/companies', payload);
  return res.data?.data || res.data;
};

export const updateCompanyStatus = async (
  companyId: string,
  status: 'active' | 'inactive'
): Promise<Company> => {
  const res = await api.patch<any>(`/companies/${companyId}/status`, { status });
  return res.data?.data || res.data;
};

export const createCompanyAdmin = async (
  companyId: string,
  payload: CreateAdminPayload
): Promise<User> => {
  // Can use /company-admins/provision or /companies/:id/admins
  const res = await api.post<any>('/company-admins/provision', {
    companyId,
    name: payload.name,
    email: payload.email,
  });
  return res.data?.data || res.data;
};

export const fetchCompanyAdmins = async (companyId: string): Promise<User[]> => {
  const res = await api.get<any>(`/companies/${companyId}/admins`);
  return res.data?.data || res.data;
};
