import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';

import { AuthContainer } from './components/auth/AuthContainer';
import { ToastContainer } from './components/common/Toast';
import { BottomNavigation, Sidebar } from './components/layout/Navigation';

// Student Components
import { MenuPage } from './components/student/MenuPage';
import { CheckoutPage } from './components/student/CheckoutPage';
import { OrderConfirmationPage } from './components/student/OrderConfirmationPage';
import { OrdersPage } from './components/student/OrdersPage';
import { ProfilePage } from './components/student/ProfilePage';

// Kiosco Components
import { KioscoDashboard } from './components/kiosco/KioscoDashboard';
import { InventoryPage } from './components/kiosco/InventoryPage';
import { AnalyticsPage } from './components/kiosco/AnalyticsPage';
import { ReviewsPage } from './components/kiosco/ReviewsPage';

// Admin Components
import { UsersPage } from './components/admin/UsersPage';
import { ReportsPage } from './components/admin/ReportsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Instead of showing "Access Denied", redirect to appropriate page
    const getDefaultRoute = () => {
      switch (user.role) {
        case 'ciclo_basico':
        case 'ciclo_superior':
          return '/menu';
        case 'kiosquero':
          return '/kiosco/dashboard';
        case 'admin':
          return '/admin/users';
        default:
          return '/menu';
      }
    };
    return <Navigate to={getDefaultRoute()} replace />;
  }
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthContainer />;
  }

  // Redirect to appropriate dashboard based on role
  const getDefaultRoute = () => {
    switch (user.role) {
      case 'ciclo_basico':
      case 'ciclo_superior':
        return '/menu';
      case 'kiosquero':
        return '/kiosco/dashboard';
      case 'admin':
        return '/admin/users';
      default:
        return '/menu';
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        
        {/* Student Routes */}
        <Route path="/menu" element={
          <ProtectedRoute allowedRoles={['ciclo_basico', 'ciclo_superior']}>
            <MenuPage />
          </ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute allowedRoles={['ciclo_basico', 'ciclo_superior']}>
            <Navigate to="/menu" replace />
          </ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute allowedRoles={['ciclo_basico', 'ciclo_superior']}>
            <CheckoutPage />
          </ProtectedRoute>
        } />
        <Route path="/order-confirmation/:orderId" element={
          <ProtectedRoute allowedRoles={['ciclo_basico', 'ciclo_superior']}>
            <OrderConfirmationPage />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute allowedRoles={['ciclo_basico', 'ciclo_superior']}>
            <OrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['ciclo_basico', 'ciclo_superior']}>
            <ProfilePage />
          </ProtectedRoute>
        } />

        {/* Kiosco Routes */}
        <Route path="/kiosco/dashboard" element={
          <ProtectedRoute allowedRoles={['kiosquero']}>
            <KioscoDashboard />
          </ProtectedRoute>
        } />
        <Route path="/kiosco/inventory" element={
          <ProtectedRoute allowedRoles={['kiosquero']}>
            <InventoryPage />
          </ProtectedRoute>
        } />
        <Route path="/kiosco/analytics" element={
          <ProtectedRoute allowedRoles={['kiosquero']}>
            <AnalyticsPage />
          </ProtectedRoute>
        } />
        <Route path="/kiosco/reviews" element={
          <ProtectedRoute allowedRoles={['kiosquero']}>
            <ReviewsPage />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ReportsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/reviews" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ReviewsPage />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <BottomNavigation />
      <ToastContainer />
    </div>
  );
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <AppContent />
          </Router>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;