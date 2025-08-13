import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { Clock, Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  scheduled_time: string;
  payment_method: 'tarjeta' | 'mercadopago' | 'efectivo';
  status: 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';
  created_at: string;
  user_cycle: 'ciclo_basico' | 'ciclo_superior' | null;
  notes: string | null;
  items?: any[];
  user_name?: string;
}

export const KioscoDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string>('all');
  const { addToast } = useToast();

  const breakTimes = ['9:35', '11:55', '14:55', '17:15', '19:35'];

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          users!inner(name),
          order_items (
            id,
            quantity,
            unit_price,
            customizations,
            products (
              id,
              name,
              price,
              description,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading orders:', error);
        addToast('Error al cargar pedidos', 'error');
        return;
      }

      if (orders) {
        // Transform the data to match the expected format
        const transformedOrders = orders.map(order => ({
          id: order.id,
          user_id: order.user_id,
          total_amount: order.total_amount,
          scheduled_time: order.scheduled_time,
          payment_method: order.payment_method,
          status: order.status,
          created_at: order.created_at,
          user_cycle: order.user_cycle,
          notes: order.notes,
          user_name: Array.isArray(order.users) ? order.users[0]?.name : order.users?.name || 'Usuario',
          items: order.order_items?.map((item: any) => ({
            product: {
              id: item.products.id,
              name: item.products.name,
              price: item.products.price,
              description: item.products.description,
              image: item.products.image_url
            },
            quantity: item.quantity,
            customizations: item.customizations
          })) || []
        }));

        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      addToast('Error al cargar pedidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'entregado' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        addToast('Error al actualizar pedido', 'error');
        return;
      }

      // Update local state
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      
      addToast(`Pedido ${orderId} actualizado a: ${newStatus.replace('_', ' ')}`, 'success');
    } catch (error) {
      console.error('Error updating order status:', error);
      addToast('Error al actualizar pedido', 'error');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (selectedTime === 'all') return true;
    return order.scheduled_time === selectedTime;
  });

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_preparacion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'listo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'entregado':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextStatus = (currentStatus: Order['status']) => {
    switch (currentStatus) {
      case 'pendiente':
        return 'en_preparacion';
      case 'en_preparacion':
        return 'listo';
      case 'listo':
        return 'entregado';
      default:
        return currentStatus;
    }
  };

  const getActionText = (status: Order['status']) => {
    switch (status) {
      case 'pendiente':
        return 'Iniciar Preparación';
      case 'en_preparacion':
        return 'Marcar como Listo';
      case 'listo':
        return 'Marcar como Entregado';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 min-h-screen bg-cream-50">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel de Órdenes</h1>
          <p className="text-gray-600">Gestiona los pedidos del kiosco</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filtrar por recreo:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedTime('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTime === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {breakTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTime === time
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay pedidos para mostrar</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-xl font-bold text-primary-600 mr-3">
                        {order.id}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                        {order.status === 'pendiente' && <Clock className="h-4 w-4 mr-1" />}
                        {order.status === 'en_preparacion' && <Package className="h-4 w-4 mr-1" />}
                        {order.status === 'listo' && <CheckCircle className="h-4 w-4 mr-1" />}
                        {order.status === 'entregado' && <CheckCircle className="h-4 w-4 mr-1" />}
                        {order.status === 'cancelado' && <XCircle className="h-4 w-4 mr-1" />}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pedido: {formatDate(order.created_at)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Retiro: <span className="font-medium">{order.scheduled_time}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Cliente: <span className="font-medium">{order.user_name}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Ciclo: <span className="capitalize">{order.user_cycle?.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">
                      {formatPrice(order.total_amount)}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {order.payment_method}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Productos:</h4>
                  <div className="space-y-2">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="font-medium">{item.product.name}</span>
                          <span className="text-gray-600 ml-2">x{item.quantity}</span>
                          {item.customizations && (
                            <div className="text-sm text-gray-600 mt-1">
                              {item.customizations.ingredients && (
                                <p><strong>Ingredientes:</strong> {item.customizations.ingredients.join(', ')}</p>
                              )}
                              {item.customizations.condiments && (
                                <p><strong>Condimentos:</strong> {item.customizations.condiments.join(', ')}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-primary-600 font-medium">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  {order.status !== 'entregado' && order.status !== 'cancelado' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {getActionText(order.status)}
                    </button>
                  )}
                  
                  {order.status !== 'entregado' && order.status !== 'cancelado' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelado')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};