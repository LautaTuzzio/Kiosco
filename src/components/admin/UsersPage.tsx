import React from 'react';
import { Users, UserPlus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingUser, setEditingUser] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<any>({});
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newUser, setNewUser] = React.useState({
    name: '',
    email: '',
    role: 'ciclo_basico',
    password: ''
  });
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();

  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: supabaseUsers, error } = await supabase
        .from('users')
        .select('id, name, email, role, last_login, is_active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        addToast('Error al cargar usuarios', 'error');
        return;
      }

      if (supabaseUsers) {
        const formattedUsers = supabaseUsers.map(user => ({
          ...user,
          lastLogin: user.last_login ? new Date(user.last_login).toLocaleDateString('es-AR') : 'Nunca'
        }));
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      addToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user.id);
    setEditForm({ ...user });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser);

      if (error) {
        console.error('Error updating user:', error);
        addToast('Error al actualizar usuario', 'error');
      } else {
        await loadUsers();
        addToast('Usuario actualizado correctamente', 'success');
      }

      setEditingUser(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating user:', error);
      addToast('Error al actualizar usuario', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      addToast('No puedes eliminar tu propia cuenta', 'error');
      return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) {
          console.error('Error deleting user:', error);
          addToast('Error al eliminar usuario', 'error');
        } else {
          await loadUsers();
          addToast('Usuario eliminado correctamente', 'success');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        addToast('Error al eliminar usuario', 'error');
      }
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      addToast('Por favor completa todos los campos', 'error');
      return;
    }

    if (users.some(user => user.email === newUser.email)) {
      addToast('Ya existe un usuario con ese email', 'error');
      return;
    }

    try {
      const { data: createdUser, error } = await supabase
        .from('users')
        .insert([
          {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            password_hash: newUser.password, // In production, hash properly
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        addToast('Error al crear usuario', 'error');
      } else {
        await loadUsers();
        addToast('Usuario creado correctamente', 'success');
        setNewUser({ name: '', email: '', role: 'ciclo_basico', password: '' });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      addToast('Error al crear usuario', 'error');
    }
  };

  const mockUsers = [
    { id: '1', name: 'Juan Pérez', email: 'juan@ciclobasico.com', role: 'ciclo_basico', lastLogin: '2024-06-14' },
    { id: '2', name: 'María García', email: 'maria@ciclosuperior.com', role: 'ciclo_superior', lastLogin: '2024-06-14' },
    { id: '3', name: 'Pedro López', email: 'pedro@kiosquero.com', role: 'kiosquero', lastLogin: '2024-06-13' },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ciclo_basico':
        return 'bg-blue-100 text-blue-800';
      case 'ciclo_superior':
        return 'bg-green-100 text-green-800';
      case 'kiosquero':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ciclo_basico':
        return 'Ciclo Básico';
      case 'ciclo_superior':
        return 'Ciclo Superior';
      case 'kiosquero':
        return 'Kiosquero';
      case 'admin':
        return 'Administrador';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 min-h-screen bg-cream-50">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Usuarios</h1>
            <p className="text-gray-600">Administra usuarios del sistema</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ciclo Básico</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'ciclo_basico').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ciclo Superior</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'ciclo_superior').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Staff</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'kiosquero' || u.role === 'admin').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Acceso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          {editingUser === user.id ? (
                            <input
                              type="text"
                              value={editForm.name || ''}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{user.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select
                          value={editForm.role || ''}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className="text-xs font-semibold border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="ciclo_basico">Ciclo Básico</option>
                          <option value="ciclo_superior">Ciclo Superior</option>
                          <option value="kiosquero">Kiosquero</option>
                          <option value="admin">Administrador</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleText(user.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {editingUser === user.id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={user.id === currentUser?.id}
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

      {/* Add User Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Agregar Nuevo Usuario</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="ciclo_basico">Ciclo Básico</option>
                    <option value="ciclo_superior">Ciclo Superior</option>
                    <option value="kiosquero">Kiosquero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={handleAddUser}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Crear Usuario
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