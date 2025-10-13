import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserRole: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  reportedUserRole
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      addToast('Por favor ingresa una razón para el reporte', 'error');
      return;
    }

    if (!user) {
      addToast('Debes estar logueado para reportar', 'error');
      return;
    }

    if (user.id === reportedUserId) {
      addToast('No puedes reportarte a ti mismo', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('reports')
        .insert([
          {
            reporter_id: user.id,
            reported_id: reportedUserId,
            reason: reason.trim(),
            status: 'pending'
          }
        ]);

      if (error) {
        console.error('Error submitting report:', error);
        addToast('Error al enviar el reporte', 'error');
      } else {
        addToast('Reporte enviado correctamente. Será revisado por un administrador.', 'success');
        setReason('');
        onClose();
      }

    } catch (error) {
      console.error('Error submitting report:', error);
      addToast('Error al enviar el reporte', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      onClose();
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ciclo_basico':
        return 'Estudiante Ciclo Básico';
      case 'ciclo_superior':
        return 'Estudiante Ciclo Superior';
      case 'kiosquero':
        return 'Encargado del Kiosco';
      case 'admin':
        return 'Administrador';
      default:
        return role;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]" onClick={handleClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-xl max-w-md w-full mx-2 sm:mx-0 max-h-[95vh] overflow-y-auto">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Reportar Usuario</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                Reportando a: {reportedUserName}
              </h3>
              <p className="text-sm text-gray-600">
                Rol: {getRoleText(reportedUserRole)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Los reportes son revisados por administradores. Proporciona información detallada sobre el problema.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón del reporte *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:opacity-50 text-sm sm:text-base"
                rows={4}
                placeholder="Describe el problema o comportamiento inapropiado..."
                maxLength={1000}
                required
              />
              <div className="mt-1 text-xs text-gray-500 text-right">
                {reason.length}/1000
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 py-2 sm:py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="flex-1 py-2 sm:py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};