import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-mono animate-pulse">
        Verifying Security Credentials...
      </div>
    );
  }

  // Not logged in -> Redirect to /login
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but unauthorized role -> Redirect to /unauthorized
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
