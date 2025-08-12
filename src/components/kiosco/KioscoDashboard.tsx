import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Clock, Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const KioscoDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('all');
  const { addToast } = useToast();

  const breakTimes = ['9:35', '11:55', '14:55', '17:15', '19:35'];

  useEffect(() => {
    // Load orders from localStorage
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(allOrders.sort((a: Order, b: Order) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ));
  }, []);

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    addToast(`Pedido ${orderId} actualizado a: ${newStatus}`, 'success');
  };

  const filteredOrders = orders.filter(order => {
    if (selectedTime === 'all') return true;
    return order.scheduledTime === selectedTime;
  });

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
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
                      Pedido: {formatDate(order.createdAt)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Retiro: <span className="font-medium">{order.scheduledTime}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Ciclo: <span className="capitalize">{order.userCycle?.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">
                      {formatPrice(order.totalAmount)}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {order.paymentMethod}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Productos:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
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