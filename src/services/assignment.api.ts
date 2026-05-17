import api from '../lib/axios';
import type { Assignment, AssignmentStatus, EmployeeProgress, MyStats } from '../types';

export interface AssignPayload {
  employeeId: string;
  trainingId: string;
}

export const fetchAssignments = async (): Promise<Assignment[]> => {
  const { data } = await api.get<{ count: number; assignments: Assignment[] }>('/assignments');
  return data.assignments;
};

export const fetchAssignment = async (id: string): Promise<Assignment> => {
  const { data } = await api.get<{ assignment: Assignment }>(`/assignments/${id}`);
  return data.assignment;
};

export const createAssignment = async (payload: AssignPayload): Promise<Assignment> => {
  const { data } = await api.post<{ assignment: Assignment }>('/assignments', payload);
  return data.assignment;
};

export const updateAssignmentStatus = async (
  id: string,
  status: AssignmentStatus
): Promise<Assignment> => {
  const { data } = await api.patch<{ assignment: Assignment }>(`/assignments/${id}/status`, { status });
  return data.assignment;
};

export const deleteAssignment = async (id: string): Promise<void> => {
  await api.delete(`/assignments/${id}`);
};

export const fetchProgressSummary = async (): Promise<EmployeeProgress[]> => {
  const { data } = await api.get<{ summary: EmployeeProgress[] }>('/assignments/progress');
  return data.summary;
};

export const fetchMyStats = async (): Promise<MyStats> => {
  const { data } = await api.get<MyStats>('/assignments/my-stats');
  return data;
};
