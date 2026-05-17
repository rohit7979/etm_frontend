import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
  allowedRole?: 'admin' | 'employee';
}

export const PrivateRoute = ({ children, allowedRole }: PrivateRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Please Wait...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRole && user.role !== allowedRole) {
    const fallback = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};
