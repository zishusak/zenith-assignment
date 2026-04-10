import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UsersPage from './pages/UsersPage';
import Profile from './pages/Profile';

const WithSidebar = ({ children }) => (
  <Sidebar>{children}</Sidebar>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <WithSidebar><AdminDashboard /></WithSidebar>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly>
              <WithSidebar><UsersPage /></WithSidebar>
            </ProtectedRoute>
          } />

          {/* User routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <WithSidebar><Profile /></WithSidebar>
            </ProtectedRoute>
          } />

          {/* Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
