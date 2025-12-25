import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, hasAccess } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !hasAccess(allowedRoles)) {
    // Redirect based on role
    let redirectPath = '/dashboard';
    if (user.role === 'CLIENT') {
      redirectPath = '/client/overview';
    } else if (user.role === 'TEAM_MEMBER') {
      redirectPath = '/team-member/tasks';
    }
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
