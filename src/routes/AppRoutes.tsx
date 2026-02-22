import {createBrowserRouter, Navigate } from 'react-router-dom';
import DashboardPage from '../pages/admin/DashboardPage';
import { TrainingsPage } from '../pages/admin/TrainingsPage';
import { AssignmentsPage } from '../pages/admin/AssignmentsPage';
import { ProgressPage } from '../pages/admin/ProgressPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import { AppLayout } from '../components/layout/AppLayout';
import { PrivateRoute } from './PrivateRoute';
import ErrorBoundary from '../components/common/ErrorBoundary';

const AppRoutes = createBrowserRouter([
    // ────────────────────── Public routes (no layout) ──────────────────────
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
    // ────────────────────── Admin routes (with layout) ──────────────────────
    {
        path: '/admin',
        element: (
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          ),
          errorElement: <ErrorBoundary />,
        children: [
            { index: true, element: <Navigate to="/admin/dashboard" replace />},
            
            {
                path: '/admin/dashboard',
                element: <DashboardPage />
            },
            {
                path: '/admin/trainings',
                element: <TrainingsPage />
            },
            {
                path: '/admin/assignments',
                element: <AssignmentsPage />
            },
            {
                path: '/admin/progress',
                element: <ProgressPage />
            }
        ]
    },

    // ────────────────────── Employee routes (with layout) ──────────────────────
    {
        path: '/employee',
        element: <AppLayout />,
        errorElement: <ErrorBoundary />,
        children: [
            { index: true, element: <Navigate to="/employee/dashboard" replace />},
        ]
    },
    // ────────────────────── Catch-all: redirect to login ──────────────────────
    {
        path: '*',
        element: <Navigate to="/login" replace />
    }

])

export default AppRoutes;
