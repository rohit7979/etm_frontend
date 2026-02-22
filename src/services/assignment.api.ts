import api from '../lib/axios';
import type { Assignment, AssignmentStatus, EmployeeProgress } from '../types';

export interface AssignPayload {
  employeeId: string;
  trainingId: string;
}

export const fetchAssignments = async (): Promise<Assignment[]> => {
  const { data } = await api.get<Assignment[]>('/assignments');
  return data;
};

export const fetchAssignment = async (id: string): Promise<Assignment> => {
  const { data } = await api.get<Assignment>(`/assignments/${id}`);
  return data;
};

export const createAssignment = async (payload: AssignPayload): Promise<Assignment> => {
  const { data } = await api.post<Assignment>('/assignments', payload);
  return data;
};

export const updateAssignmentStatus = async (
  id: string,
  status: AssignmentStatus
): Promise<Assignment> => {
  const { data } = await api.patch<Assignment>(`/assignments/${id}/status`, { status });
  return data;
};

export const deleteAssignment = async (id: string): Promise<void> => {
  await api.delete(`/assignments/${id}`);
};

export const fetchEmployeeProgress = async (): Promise<EmployeeProgress[]> => {
  const { data } = await api.get<EmployeeProgress[]>('/assignments/progress');
  return data;
};
