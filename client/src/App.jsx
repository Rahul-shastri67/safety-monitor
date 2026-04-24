import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Admin from './pages/Admin';
import CameraPage from './pages/CameraPage';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f1629',
                color: '#e2e8f0',
                border: '1px solid #1e2d4a',
                fontFamily: 'Syne, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#0f1629' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#0f1629' } },
            }}
          />
          <Routes>
            {/* Public routes */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes wrapped in Layout */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/"          element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cameras"   element={<CameraPage />} />
              <Route path="/history"   element={<History />} />
              <Route path="/settings"  element={<Settings />} />
              {/* Admin only */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
