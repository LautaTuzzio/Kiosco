import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Home, BarChart3, Package, Users, User, Star, AlertTriangle, Clock, Menu, X, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNavigation: React.FC = () => {
  // This component is no longer used for students since we have the expandable navigation
  return null;
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    { icon: Clock, label: 'Horarios', path: '/admin/break-times' },
    { icon: AlertTriangle, label: 'Reportes', path: '/admin/reports' },
    { icon: Star, label: 'Reseñas', path: '/admin/reviews' },
  ];

  const items = user.role === 'admin' ? adminItems : kioscoItems;
  const title = user.role === 'admin' ? 'Panel Admin' : 'Panel Kiosco';

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Top Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-primary-700">{title}</h2>
              <p className="text-xs text-gray-600 truncate max-w-[150px]">{user.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="bg-white border-t border-gray-200 shadow-lg">
            <nav className="py-2">
              {items.map(({ icon: Icon, label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-200 px-4 py-3">
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-sm font-medium text-red-600 hover:text-red-700"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Side Navigation */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-30">
        <div className="p-6">
          <h2 className="text-xl font-bold text-primary-700">{title}</h2>
          <p className="text-sm text-gray-600 mt-1 truncate">{user.name}</p>
        </div>

        <nav className="mt-6">
          {items.map(({ icon: Icon, label, path }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                location.pathname === path
                  ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-600'
                  : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {label}
            </Link>
          ))}

          <button
            onClick={logout}
            className="flex items-center px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left mt-8"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Cerrar Sesión
          </button>
        </nav>
      </div>
    </>
  );
};