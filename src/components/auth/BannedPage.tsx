import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface BannedPageProps {
  sanction: {
    type: 'warning' | 'timeout' | 'ban';
    reason: string;
    expires_at?: string | null;
    created_at: string;
  };
  onLogout: () => void;
}

export const BannedPage: React.FC<BannedPageProps> = ({ sanction, onLogout }) => {
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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            {getSanctionTitle()}
          </h2>
          <p className="mt-2 text-gray-600">
            {getSanctionDescription()}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-medium">Motivo:</span> {sanction.reason}
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-medium">Fecha de la sanción:</span> {formatDate(sanction.created_at)}
          </p>
          {sanction.expires_at && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Válido hasta:</span> {formatDate(sanction.expires_at)}
            </p>
          )}
        </div>

        {(sanction.type === 'timeout' || sanction.type === 'ban') && (
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {sanction.type === 'timeout'
                    ? 'Esta sanción es temporal. Podrás volver a acceder una vez que expire el período de suspensión.'
                    : 'Si crees que esto es un error, por favor contacta al administrador del sistema.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};