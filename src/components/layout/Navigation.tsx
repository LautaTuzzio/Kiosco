import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Home, BarChart3, Package, Users, User, Star, AlertTriangle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNavigation: React.FC = () => {
  // This component is no longer used for students since we have the expandable navigation
  return null;
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user || (user.role !== 'kiosquero' && user.role !== 'admin')) {
    return null;
  }

  const kioscoItems = [
    { icon: Home, label: 'Panel Principal', path: '/kiosco/dashboard' },
    { icon: Package, label: 'Inventario', path: '/kiosco/inventory' },
    { icon: BarChart3, label: 'Análisis', path: '/kiosco/analytics' },
    { icon: Star, label: 'Reseñas', path: '/kiosco/reviews' },
  ];

  const adminItems = [
    { icon: Users, label: 'Usuarios', path: '/admin/users' },
    { icon: AlertTriangle, label: 'Reportes', path: '/admin/reports' },
    { icon: Star, label: 'Reseñas', path: '/admin/reviews' },
  ];

  const items = user.role === 'admin' ? adminItems : kioscoItems;

  return (
    <div className="fixed left-0 top-0 h-full w-56 sm:w-64 bg-white shadow-lg border-r border-gray-200 z-30">
      <div className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-primary-700">Kiosco Escolar</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{user.name}</p>
      </div>
      
      <nav className="mt-4 sm:mt-6">
        {items.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
              location.pathname === path
                ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-600'
                : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
            }`}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
            {label}
          </Link>
        ))}
        
        <button
          onClick={logout}
          className="flex items-center px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left mt-6 sm:mt-8"
        >
          <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
          Cerrar Sesión
        </button>
      </nav>
    </div>
  );
};