import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, Check, X, Clock, User, Calendar, MessageSquare } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Report, Sanction, SanctionType } from '../../types';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [sanctionForm, setSanctionForm] = useState({
    type: 'warning' as SanctionType,
    reason: '',
    duration_hours: 24
  });
  const [adminNotes, setAdminNotes] = useState('');
  const { addToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadReports();
    loadSanctions();
  }, []);

  const loadReports = async () => {
    try {
      const { data: supabaseReports, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:users!reports_reporter_id_fkey(name),
          reported:users!reports_reported_id_fkey(name, role)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reports:', error);
        addToast('Error al cargar reportes', 'error');
        return;
      }

      if (supabaseReports) {
        const formattedReports = supabaseReports.map(report => ({
          id: report.id,
          reporter_id: report.reporter_id,
          reported_id: report.reported_id,
          reason: report.reason,
          status: report.status,
          admin_notes: report.admin_notes,
          created_at: report.created_at,
          updated_at: report.updated_at,
          reporter_name: Array.isArray(report.reporter) ? report.reporter[0]?.name : report.reporter?.name || 'Usuario',
          reported_name: Array.isArray(report.reported) ? report.reported[0]?.name : report.reported?.name || 'Usuario'
        }));
        setReports(formattedReports);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      addToast('Error al cargar reportes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSanctions = async () => {
    try {
      const { data: supabaseSanctions, error } = await supabase
        .from('sanctions')
        .select(`
          *,
          user:users!sanctions_user_id_fkey(name),
          admin:users!sanctions_created_by_fkey(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading sanctions:', error);
        return;
      }

      if (supabaseSanctions) {
        const formattedSanctions = supabaseSanctions.map(sanction => ({
          id: sanction.id,
          user_id: sanction.user_id,
          type: sanction.type,
          reason: sanction.reason,
          duration_hours: sanction.duration_hours,
          expires_at: sanction.expires_at,
          created_by: sanction.created_by,
          created_at: sanction.created_at,
          is_active: sanction.is_active,
          user_name: Array.isArray(sanction.user) ? sanction.user[0]?.name : sanction.user?.name || 'Usuario',
          admin_name: Array.isArray(sanction.admin) ? sanction.admin[0]?.name : sanction.admin?.name || 'Admin'
        }));
        setSanctions(formattedSanctions);
      }
    } catch (error) {
      console.error('Error loading sanctions:', error);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: Report['status'], notes?: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          admin_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) {
        console.error('Error updating report:', error);
        addToast('Error al actualizar reporte', 'error');
        return;
      }

      await loadReports();
      addToast('Reporte actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error updating report:', error);
      addToast('Error al actualizar reporte', 'error');
    }
  };

  const createSanction = async () => {
    if (!selectedReport || !user) return;

    try {
      const expiresAt = sanctionForm.type === 'ban' && sanctionForm.duration_hours === 0 
        ? null 
        : new Date(Date.now() + (sanctionForm.duration_hours * 60 * 60 * 1000)).toISOString();

      const { error } = await supabase
        .from('sanctions')
        .insert([
          {
            user_id: selectedReport.reported_id,
            type: sanctionForm.type,
            reason: sanctionForm.reason,
            duration_hours: sanctionForm.type === 'ban' && sanctionForm.duration_hours === 0 ? null : sanctionForm.duration_hours,
            expires_at: expiresAt,
            created_by: user.id,
            is_active: true
          }
        ]);

      if (error) {
        console.error('Error creating sanction:', error);
        addToast('Error al crear sanción', 'error');
        return;
      }

      // Update report status to resolved
      await updateReportStatus(selectedReport.id, 'resolved', adminNotes);
      
      await loadSanctions();
      setShowSanctionModal(false);
      setSelectedReport(null);
      setSanctionForm({ type: 'warning', reason: '', duration_hours: 24 });
      setAdminNotes('');
      
      addToast('Sanción aplicada correctamente', 'success');
    } catch (error) {
      console.error('Error creating sanction:', error);
      addToast('Error al crear sanción', 'error');
    }
  };

  const removeSanction = async (sanctionId: string) => {
    if (!confirm('¿Estás seguro de que quieres remover esta sanción?')) return;

    try {
      const { error } = await supabase
        .from('sanctions')
        .update({ is_active: false })
        .eq('id', sanctionId);

      if (error) {
        console.error('Error removing sanction:', error);
        addToast('Error al remover sanción', 'error');
        return;
      }

      await loadSanctions();
      addToast('Sanción removida correctamente', 'success');
    } catch (error) {
      console.error('Error removing sanction:', error);
      addToast('Error al remover sanción', 'error');
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSanctionColor = (type: SanctionType) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'timeout':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ban':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSanctionText = (type: SanctionType) => {
    switch (type) {
      case 'warning':
        return 'Advertencia';
      case 'timeout':
        return 'Suspensión Temporal';
      case 'ban':
        return 'Prohibición';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 min-h-screen bg-cream-50">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Reportes</h1>
          <p className="text-gray-600">Administra reportes de usuarios y sanciones</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reportes Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Revisión</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'reviewed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resueltos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'resolved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sanciones Activas</p>
                <p className="text-2xl font-bold text-gray-900">{sanctions.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Reportes</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {reports.length === 0 ? (
                <div className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay reportes</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <div key={report.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <User className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {report.reporter_name} → {report.reported_name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{report.reason}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(report.created_at)}</span>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(report.status)}`}>
                          {report.status === 'pending' && 'Pendiente'}
                          {report.status === 'reviewed' && 'En Revisión'}
                          {report.status === 'resolved' && 'Resuelto'}
                        </span>
                      </div>
                      
                      {report.status === 'pending' && (
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => updateReportStatus(report.id, 'reviewed')}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Revisar
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowSanctionModal(true);
                            }}
                            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                          >
                            Sancionar
                          </button>
                          <button
                            onClick={() => updateReportStatus(report.id, 'resolved', 'Resuelto sin acción')}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Resolver
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Sanctions */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Sanciones Activas</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {sanctions.length === 0 ? (
                <div className="p-6 text-center">
                  <Check className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay sanciones activas</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {sanctions.map((sanction) => (
                    <div key={sanction.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <User className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {sanction.user_name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{sanction.reason}</p>
                          <div className="flex items-center text-xs text-gray-500 mb-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Por: {sanction.admin_name}</span>
                          </div>
                          {sanction.expires_at && (
                            <div className="text-xs text-gray-500">
                              Expira: {formatDate(sanction.expires_at)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getSanctionColor(sanction.type)}`}>
                            {getSanctionText(sanction.type)}
                          </span>
                          <button
                            onClick={() => removeSanction(sanction.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sanction Modal */}
      {showSanctionModal && selectedReport && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Aplicar Sanción</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Usuario: {selectedReport.reported_name}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Sanción
                  </label>
                  <select
                    value={sanctionForm.type}
                    onChange={(e) => setSanctionForm({ ...sanctionForm, type: e.target.value as SanctionType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="warning">Advertencia</option>
                    <option value="timeout">Suspensión Temporal</option>
                    <option value="ban">Prohibición</option>
                  </select>
                </div>

                {sanctionForm.type !== 'warning' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración (horas) - 0 para permanente
                    </label>
                    <input
                      type="number"
                      value={sanctionForm.duration_hours}
                      onChange={(e) => setSanctionForm({ ...sanctionForm, duration_hours: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón de la Sanción
                  </label>
                  <textarea
                    value={sanctionForm.reason}
                    onChange={(e) => setSanctionForm({ ...sanctionForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe la razón de la sanción..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas del Administrador
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={2}
                    placeholder="Notas internas sobre la resolución..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => {
                    setShowSanctionModal(false);
                    setSelectedReport(null);
                    setSanctionForm({ type: 'warning', reason: '', duration_hours: 24 });
                    setAdminNotes('');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={createSanction}
                  disabled={!sanctionForm.reason.trim()}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Aplicar Sanción
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};