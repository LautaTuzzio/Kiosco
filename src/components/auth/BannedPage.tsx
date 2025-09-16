import React from 'react';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface BannedPageProps {
  sanction: {
    type: 'warning' | 'timeout' | 'ban';
    reason: string;
    expires_at?: string | null;
    created_at: string;
  };
}

export const BannedPage: React.FC<BannedPageProps> = ({ sanction }) => {
  const { logout } = useAuth();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSanctionTitle = () => {
    switch (sanction.type) {
      case 'warning':
        return 'Advertencia Activa';
      case 'timeout':
        return 'Cuenta Suspendida Temporalmente';
      case 'ban':
        return 'Cuenta Prohibida';
      default:
        return 'Acceso Restringido';
    }
  };

  const getSanctionDescription = () => {
    switch (sanction.type) {
      case 'warning':
        return 'Has recibido una advertencia por parte de la administración.';
      case 'timeout':
        return 'Tu cuenta ha sido suspendida temporalmente.';
      case 'ban':
        return 'Tu cuenta ha sido prohibida de usar el sistema.';
      default:
        return 'Tu acceso al sistema ha sido restringido.';
    }
  };

  const isTemporary = sanction.type === 'timeout' && sanction.expires_at;
  const isExpired = isTemporary && new Date(sanction.expires_at!) < new Date();

  if (isExpired) {
    // If the sanction has expired, allow normal access
    // This shouldn't happen as expired sanctions should be marked as inactive
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-2xl rounded-2xl p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {getSanctionTitle()}
          </h1>

          <p className="text-gray-600 mb-6">
            {getSanctionDescription()}
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Razón:</h3>
            <p className="text-red-700 text-sm">{sanction.reason}</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Fecha de sanción:</span>
              </div>
              <span className="font-medium text-gray-900">
                {formatDate(sanction.created_at)}
              </span>
            </div>

            {isTemporary && sanction.expires_at && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Expira:</span>
                </div>
                <span className="font-medium text-gray-900">
                  {formatDate(sanction.expires_at)}
                </span>
              </div>
            )}

            {sanction.type === 'ban' && !sanction.expires_at && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-700 font-medium">
                  Esta es una prohibición permanente.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Si crees que esto es un error, contacta a un administrador.
            </p>

            <button
              onClick={logout}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};