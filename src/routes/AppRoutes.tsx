import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminDashboardPage from '../pages/admin/DashboardPage';
import { TrainingsPage } from '../pages/admin/TrainingsPage';
import { AssignmentsPage } from '../pages/admin/AssignmentsPage';
import { ProgressPage } from '../pages/admin/ProgressPage';
import EmployeeDashboardPage from '../pages/employees/EmployeeDashboardPage';
import MyTrainingsPage from '../pages/employees/MyTrainingsPage';
import MyProgressPage from '../pages/employees/MyProgressPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
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
    path: '/register',
    element: <RegisterPage />,
    errorElement: <ErrorBoundary />,
  },

  // ── Admin routes (role-locked to admin) ────────────────────────────────────
  {
    path: '/admin',
    element: (
      <PrivateRoute allowedRole="admin">
        <AppLayout />
      </PrivateRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: '/admin/dashboard', element: <AdminDashboardPage /> },
      { path: '/admin/trainings', element: <TrainingsPage /> },
      { path: '/admin/assignments', element: <AssignmentsPage /> },
      { path: '/admin/progress', element: <ProgressPage /> },
    ],
  },

  // ── Employee routes (role-locked to employee) ──────────────────────────────
  {
    path: '/employee',
    element: (
      <PrivateRoute allowedRole="employee">
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
