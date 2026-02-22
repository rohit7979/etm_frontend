export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
}

export interface Training {
  _id: string;
  title: string;
  description: string;
  category: string;
  durationHours: number;
  createdBy: User;
  createdAt: string;
}

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed';

export interface Assignment {
  _id: string;
  employee: User;
  training: Training;
  assignedBy: User;
  status: AssignmentStatus;
  completedAt: string | null;
  createdAt: string;
}

export interface EmployeeProgress {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  total: number;
  completed: number;
  completionRate: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
}
