import React, { useState, useEffect } from 'react';
import { Clock, Plus, CreditCard as Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

interface BreakTime {
  id: string;
  cycle: 'ciclo_basico' | 'ciclo_superior';
  break_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const BreakTimesPage: React.FC = () => {
  const [breakTimes, setBreakTimes] = useState<BreakTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BreakTime>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBreakTime, setNewBreakTime] = useState({
    cycle: 'ciclo_basico' as 'ciclo_basico' | 'ciclo_superior',
    break_time: '',
    is_active: true
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadBreakTimes();
  }, []);

  const loadBreakTimes = async () => {
    try {
      const { data, error } = await supabase
        .from('break_times_config')
        .select('*')
        .order('cycle')
        .order('break_time');

      if (error) {
        console.error('Error loading break times:', error);
        addToast('Error al cargar horarios', 'error');
        return;
      }

      setBreakTimes(data || []);
    } catch (error) {
      console.error('Error loading break times:', error);
      addToast('Error al cargar horarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (breakTime: BreakTime) => {
    setEditingId(breakTime.id);
    setEditForm(breakTime);
  };

  const handleSave = async () => {
    if (!editingId || !editForm) return;

    try {
      const { error } = await supabase
        .from('break_times_config')
        .update({
          cycle: editForm.cycle,
          break_time: editForm.break_time,
          is_active: editForm.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) {
        console.error('Error updating break time:', error);
        addToast('Error al actualizar horario', 'error');
        return;
      }

      await loadBreakTimes();
      setEditingId(null);
      setEditForm({});
      addToast('Horario actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error updating break time:', error);
      addToast('Error al actualizar horario', 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este horario?')) return;

    try {
      const { error } = await supabase
        .from('break_times_config')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting break time:', error);
        addToast('Error al eliminar horario', 'error');
        return;
      }

      await loadBreakTimes();
      addToast('Horario eliminado correctamente', 'success');
    } catch (error) {
      console.error('Error deleting break time:', error);
      addToast('Error al eliminar horario', 'error');
    }
  };

  const handleAddBreakTime = async () => {
    if (!newBreakTime.break_time) {
      addToast('Por favor ingresa un horario', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('break_times_config')
        .insert([newBreakTime]);

      if (error) {
        console.error('Error adding break time:', error);
        addToast('Error al agregar horario', 'error');
        return;
      }

      await loadBreakTimes();
      setNewBreakTime({
        cycle: 'ciclo_basico',
        break_time: '',
        is_active: true
      });
      setShowAddModal(false);
      addToast('Horario agregado correctamente', 'success');
    } catch (error) {
      console.error('Error adding break time:', error);
      addToast('Error al agregar horario', 'error');
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('break_times_config')
        .update({ 
          is_active: !currentActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error toggling break time:', error);
        addToast('Error al cambiar estado', 'error');
        return;
      }

      await loadBreakTimes();
      addToast('Estado actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error toggling break time:', error);
      addToast('Error al cambiar estado', 'error');
    }
  };

  const getCycleText = (cycle: string) => {
    return cycle === 'ciclo_basico' ? 'Ciclo Básico' : 'Ciclo Superior';
  };

  const getCycleColor = (cycle: string) => {
    return cycle === 'ciclo_basico' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="pt-16 lg:pt-0 lg:ml-64 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando horarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0 lg:ml-64 min-h-screen bg-cream-50">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Horarios de Recreo</h1>
            <p className="text-gray-600">Configura los horarios disponibles para cada ciclo</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Horario
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ciclo Básico</p>
                <p className="text-2xl font-bold text-gray-900">
                  {breakTimes.filter(bt => bt.cycle === 'ciclo_basico' && bt.is_active).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ciclo Superior</p>
                <p className="text-2xl font-bold text-gray-900">
                  {breakTimes.filter(bt => bt.cycle === 'ciclo_superior' && bt.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {breakTimes.filter(bt => bt.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Break Times Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ciclo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {breakTimes.map((breakTime) => (
                  <tr key={breakTime.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === breakTime.id ? (
                        <select
                          value={editForm.cycle || ''}
                          onChange={(e) => setEditForm({ ...editForm, cycle: e.target.value as any })}
                          className="border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="ciclo_basico">Ciclo Básico</option>
                          <option value="ciclo_superior">Ciclo Superior</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCycleColor(breakTime.cycle)}`}>
                          {getCycleText(breakTime.cycle)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === breakTime.id ? (
                        <input
                          type="time"
                          value={editForm.break_time || ''}
                          onChange={(e) => setEditForm({ ...editForm, break_time: e.target.value })}
                          className="border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <span className="text-gray-900 font-medium">{breakTime.break_time}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        breakTime.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {breakTime.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {editingId === breakTime.id ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(breakTime)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(breakTime.id, breakTime.is_active)}
                            className={`${
                              breakTime.is_active 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(breakTime.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Break Time Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Agregar Nuevo Horario</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo</label>
                  <select
                    value={newBreakTime.cycle}
                    onChange={(e) => setNewBreakTime({ ...newBreakTime, cycle: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="ciclo_basico">Ciclo Básico</option>
                    <option value="ciclo_superior">Ciclo Superior</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                  <input
                    type="time"
                    value={newBreakTime.break_time}
                    onChange={(e) => setNewBreakTime({ ...newBreakTime, break_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newBreakTime.is_active}
                      onChange={(e) => setNewBreakTime({ ...newBreakTime, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Activo</span>
                  </label>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={handleAddBreakTime}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Agregar Horario
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};