export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'EMPLOYEE' | 'admin' | 'employee';
export type Status = 'active' | 'inactive' | 'PENDING_INVITE' | 'ACTIVE' | 'DEACTIVATED';

export interface Company {
  _id: string;
  name: string;
  email: string;
  status: Status;
  stats?: {
    adminCount: number;
    activeAdminCount?: number;
    pendingAdminCount?: number;
    employeeCount: number;
    totalUsers: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: Status;
  company?: {
    id: string;
    name: string;
    status: Status;
  } | null;
}


export interface Training {
  _id: string;
  title: string;
  description: string;
  category: string;
  durationHours: number;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
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
  updatedAt: string;
}

export interface Comment {
  _id: string;
  assignment: string;
  author: User;
  text: string;
  replyTo?: {
    _id: string;
    author: { name: string };
    text: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Employee (enriched by admin list endpoint) ───────────────────────────────

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'employee';
  joinedAt: string;
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
}

export interface EmployeeDetail {
  employee: {
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
  };
  assignments: Assignment[];
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface EmployeeProgress {
  employee: { name: string; email: string };
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  completionRate: string; // e.g. "67.5%"
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface AdminStats {
  totalEmployees: number;
  totalTrainings: number;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  pendingAssignments: number;
  avgCompletionRate: number;
}

export interface AdminDashboard {
  totalTrainings: number;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  pendingAssignments: number;
  avgCompletionRate: number;
  totalEmployees: number;
  activeEmployees: number;
}

export interface MyStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionRate: number;
  recentAssignments: Assignment[];
}

// ─── Analytics (for Recharts) ─────────────────────────────────────────────────

export interface StatusBreakdownItem {
  status: AssignmentStatus;
  count: number;
}

export interface CategoryBreakdownItem {
  category: string;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export interface MonthlyTrendItem {
  year: number;
  month: number;
  label: string; // "Jan", "Feb", etc.
  completed: number;
}

export interface TopEmployee {
  name: string;
  total: number;
  completed: number;
  completionRate: number;
}

export interface AnalyticsData {
  statusBreakdown: StatusBreakdownItem[];
  categoryBreakdown: CategoryBreakdownItem[];
  monthlyTrends: MonthlyTrendItem[];
  topEmployees: TopEmployee[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token?: string;
  user: User;
}

export interface ApiError {
  message: string;
}
