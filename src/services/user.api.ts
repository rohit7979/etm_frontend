import api from '../lib/axios';
import type { AdminDashboard, AdminStats, AnalyticsData, Employee, EmployeeDetail } from '../types';

export const fetchAdminDashboard = async (): Promise<AdminDashboard> => {
  const { data } = await api.get<AdminDashboard>('/users/dashboard');
  return data;
};

export const fetchAdminStats = async (): Promise<AdminStats> => {
  const { data } = await api.get<AdminStats>('/users/stats');
  return data;
};

export const fetchEmployees = async (): Promise<Employee[]> => {
  const { data } = await api.get<{ count: number; employees: Employee[] }>('/users/employees');
  return data.employees;
};

export const fetchEmployeeById = async (id: string): Promise<EmployeeDetail> => {
  const { data } = await api.get<EmployeeDetail>(`/users/employees/${id}`);
  return data;
};

export const fetchAnalytics = async (): Promise<AnalyticsData> => {
  const { data } = await api.get<AnalyticsData>('/users/analytics');
  return data;
};
