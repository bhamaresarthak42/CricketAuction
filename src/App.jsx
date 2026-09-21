import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminPage from './pages/AdminPage';
import HostPage from './pages/HostPage';
import OwnerPage from './pages/OwnerPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Protected Admin Route (Role: admin) */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>

              {/* Protected Host Route (Role: host) */}
              <Route element={<ProtectedRoute allowedRoles={['host']} />}>
                <Route path="/host" element={<HostPage />} />
              </Route>

              {/* Protected Owner Route (Role: owner) */}
              <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
                <Route path="/owner" element={<OwnerPage />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
            Live Cricket Auction Platform • Powered by React, Vite, Tailwind CSS & Firebase
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
