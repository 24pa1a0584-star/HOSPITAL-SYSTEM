import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-healing/20 border-t-teal-healing rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Verifying session credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // If attempting to access staff route, redirect to staff login
    const isStaffRoute = location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/doctor') ||
      location.pathname.startsWith('/receptionist');

    return <Navigate to={isStaffRoute ? '/staff-login' : '/login'} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-coral-50 text-coral-warm mx-auto flex items-center justify-center font-bold text-2xl">
            403
          </div>
          <h2 className="font-headline font-bold text-2xl text-navy-deep">Access Restricted</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your role (<span className="font-bold text-navy-deep">{user.role}</span>) does not have
            authorization to access this administrative portal.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
          >
            Return to Safety
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
