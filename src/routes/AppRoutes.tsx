import { createBrowserRouter, Navigate } from 'react-router-dom';
import SuperAdminDashboardPage from '../pages/superadmin/SuperAdminDashboardPage';
import CompaniesPage from '../pages/superadmin/CompaniesPage';
import AdminDashboardPage from '../pages/admin/DashboardPage';
import EmployeesPage from '../pages/admin/EmployeesPage';
import { TrainingsPage } from '../pages/admin/TrainingsPage';
import { AssignmentsPage } from '../pages/admin/AssignmentsPage';
import { ProgressPage } from '../pages/admin/ProgressPage';
import EmployeeDashboardPage from '../pages/employees/EmployeeDashboardPage';
import MyTrainingsPage from '../pages/employees/MyTrainingsPage';
import MyProgressPage from '../pages/employees/MyProgressPage';
import LoginPage from '../pages/auth/LoginPage';
import AcceptInvitePage from '../pages/auth/AcceptInvitePage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import { AppLayout } from '../components/layout/AppLayout';
import { PrivateRoute } from './PrivateRoute';
import ErrorBoundary from '../components/common/ErrorBoundary';

const AppRoutes = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────────────────────────
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/accept-invite',
    element: <AcceptInvitePage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/register',
    element: <Navigate to="/login" replace />,
  },

  // ── Super Admin routes (role-locked to SUPER_ADMIN) ────────────────────────
  {
    path: '/super-admin',
    element: (
      <PrivateRoute allowedRoles={['SUPER_ADMIN']}>
        <AppLayout />
      </PrivateRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/super-admin/dashboard" replace /> },
      { path: '/super-admin/dashboard', element: <SuperAdminDashboardPage /> },
      { path: '/super-admin/companies', element: <CompaniesPage /> },
    ],
  },

  // ── Company Admin routes (role-locked to COMPANY_ADMIN / admin) ─────────────
  {
    path: '/admin',
    element: (
      <PrivateRoute allowedRoles={['COMPANY_ADMIN', 'admin']}>
        <AppLayout />
      </PrivateRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: '/admin/dashboard', element: <AdminDashboardPage /> },
      { path: '/admin/employees', element: <EmployeesPage /> },
      { path: '/admin/trainings', element: <TrainingsPage /> },
      { path: '/admin/assignments', element: <AssignmentsPage /> },
      { path: '/admin/progress', element: <ProgressPage /> },
    ],
  },

  // ── Employee routes (role-locked to EMPLOYEE / employee) ───────────────────
  {
    path: '/employee',
    element: (
      <PrivateRoute allowedRoles={['EMPLOYEE', 'employee']}>
        <AppLayout />
      </PrivateRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/employee/dashboard" replace /> },
      { path: '/employee/dashboard', element: <EmployeeDashboardPage /> },
      { path: '/employee/my-trainings', element: <MyTrainingsPage /> },
      { path: '/employee/my-progress', element: <MyProgressPage /> },
    ],
  },

  // ── Catch-all: redirect to login ───────────────────────────────────────────
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default AppRoutes;
