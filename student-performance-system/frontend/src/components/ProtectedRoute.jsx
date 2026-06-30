import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    // Redirect to login but keep current location for redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If authenticated but role is not allowed, redirect to correct home dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'faculty') {
      return <Navigate to="/faculty" replace />;
    } else if (user.role === 'student') {
      return <Navigate to="/student" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
