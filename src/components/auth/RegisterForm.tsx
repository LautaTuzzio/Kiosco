import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getCycleFromCourse } from '../../lib/supabase';
import { Coffee, Mail, Lock, User, Phone, MapPin, Calendar, GraduationCap, Users } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    birthDate: '',
    course: '',
    emergencyContact: '',
    role: 'ciclo_basico' as 'ciclo_basico' | 'ciclo_superior',
    autoAssignedCycle: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      addToast('Las contraseñas no coinciden', 'error');
      return;
    }

    if (formData.password.length < 6) {
      addToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    if (!formData.name || !formData.email || !formData.course) {
      addToast('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    setIsLoading(true);
    
    const success = await register(formData);
    
    if (success) {
      addToast('¡Cuenta creada exitosamente! Bienvenido al sistema.', 'success');
    } else {
      addToast('Error al crear la cuenta. El email ya podría estar en uso.', 'error');
    }
    
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-assign cycle when course changes
    if (name === 'course' && value) {
      const autoAssignedCycle = getCycleFromCourse(value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        role: autoAssignedCycle,
        autoAssignedCycle: true
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white shadow-2xl rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
              <Coffee className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Crear Cuenta</h1>
            <p className="text-gray-600">Únete al sistema de pedidos del kiosco escolar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="+54 9 11 1234-5678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Tu dirección"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                Información Académica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciclo {formData.autoAssignedCycle && formData.course && '(Asignado automáticamente)'}
                  </label>
                  {formData.autoAssignedCycle && formData.course ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-700">
                        {formData.role === 'ciclo_basico' ? 'Ciclo Básico (1°, 2°, 3°)' : 'Ciclo Superior (4°, 5°, 6°, 7°)'}
                      </span>
                    </div>
                  ) : (
                    <select
                      name="role"
                      value={formData.role}
                      onChange={(e) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          role: e.target.value as 'ciclo_basico' | 'ciclo_superior',
                          autoAssignedCycle: false
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      required
                    >
                      <option value="ciclo_basico">Ciclo Básico (1°, 2°, 3°)</option>
                      <option value="ciclo_superior">Ciclo Superior (4°, 5°, 6°, 7°)</option>
                      <option value="7° Año">7° Año</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Curso *
                  </label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    required
                  >
                    <option value="">Selecciona tu curso</option>
                    <option value="1° Año">1° Año</option>
                    <option value="2° Año">2° Año</option>
                    <option value="3° Año">3° Año</option>
                    <option value="4° Año">4° Año</option>
                    <option value="5° Año">5° Año</option>
                    <option value="6° Año">6° Año</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contacto de Emergencia
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Nombre - Teléfono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Seguridad
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Repite tu contraseña"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? <LoadingSpinner size="sm" color="text-white" /> : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Iniciar Sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};