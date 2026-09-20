import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole | UserRole[];
}

export const getRoleDashboard = (role?: UserRole): string => {
  if (role === 'SUPER_ADMIN') return '/super-admin/dashboard';
  if (role === 'COMPANY_ADMIN' || role === 'admin') return '/admin/dashboard';
  return '/employee/dashboard';
};

export const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Verifying session...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles) {
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const isAllowed = rolesArray.some(
      (r) =>
        r === user.role ||
        (r === 'admin' && user.role === 'COMPANY_ADMIN') ||
        (r === 'COMPANY_ADMIN' && user.role === 'admin')
    );

    if (!isAllowed) {
      return <Navigate to={getRoleDashboard(user.role)} replace />;
    }
  }

  return <>{children}</>;
};
