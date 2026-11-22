import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import Button from './Button';
import Card from './Card';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">Verifying security credentials...</p>
      </div>
    );
  }

  // Not authenticated: Redirect to appropriate login page based on required role
  if (!isAuthenticated || !user) {
    const targetLogin = allowedRoles.includes('teacher') ? '/teacher/login' : '/student/login';
    return <Navigate to={targetLogin} state={{ from: location }} replace />;
  }

  // Role check: If specific roles are required and user does not match
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const validDashboard = user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';

    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 mb-4">
            Role Permission Mismatch (HTTP 403)
          </p>

          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            You are logged in as <strong className="text-slate-800">{user.full_name}</strong> with the{' '}
            <strong className="capitalize text-slate-800">{user.role}</strong> role. This route is
            restricted strictly to users with the{' '}
            <strong className="capitalize text-slate-800">{allowedRoles.join(', ')}</strong> role.
          </p>

          <Link to={validDashboard} className="block w-full">
            <Button variant="primary" size="md" className="w-full" icon={ArrowRight} iconPosition="right">
              Go to Your {user.role === 'teacher' ? 'Teacher' : 'Student'} Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return children;
}
