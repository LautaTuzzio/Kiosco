import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ExpandableNavigation } from './ExpandableNavigation';
import { supabase } from '../../lib/supabase';
import { generateOrderPDF } from '../../utils/pdfGenerator';
import { Clock, Package, CheckCircle, XCircle, AlertCircle, Download, X, CreditCard, Calendar, AlertTriangle, Ban } from 'lucide-react';
import { ReviewModal } from './ReviewModal';
import { ReportModal } from '../common/ReportModal';
import { useToast } from '../../contexts/ToastContext';

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
}

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [orderReviews, setOrderReviews] = useState<Record<string, boolean>>({});
  const [cancellingOrder, setCancellingOrder] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
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
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgoISO) // Only show orders from last 7 days
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        return;
      }

      if (orders) {
        // Transform the data to match the expected format
        const transformedOrders = orders.map(order => ({
          id: order.id,
          userId: order.user_id,
          totalAmount: order.total_amount,
          scheduledTime: order.scheduled_time,
          paymentMethod: order.payment_method,
          status: order.status,
          createdAt: order.created_at,
          userCycle: order.user_cycle,
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
        
        // Load reviews for these orders
        if (transformedOrders.length > 0) {
          loadOrderReviews(transformedOrders.map(o => o.id));
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadOrderReviews = async (orderIds: string[]) => {
    if (orderIds.length === 0) return;
    
    try {
      const { data: supabaseReviews, error } = await supabase
        .from('reviews')
        .select('order_id')
        .in('order_id', orderIds)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error loading reviews:', error);
        return;
      }

      if (supabaseReviews) {
        const reviewedOrders: Record<string, boolean> = {};
        supabaseReviews.forEach(review => {
          reviewedOrders[review.order_id] = true;
        });
        setOrderReviews(reviewedOrders);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pendiente':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'en_preparacion':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'listo':
        return <AlertCircle className="h-4 w-4 text-green-500" />;
      case 'entregado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelado':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_preparacion':
        return 'En Preparación';
      case 'listo':
        return 'Listo para Retirar';
      case 'entregado':
        return 'Entregado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'tarjeta':
        return <CreditCard className="h-4 w-4" />;
      case 'mercadopago':
        return <CreditCard className="h-4 w-4" />;
      case 'efectivo':
        return <Package className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'tarjeta':
        return 'Tarjeta de Crédito';
      case 'mercadopago':
        return 'Mercado Pago';
      case 'efectivo':
        return 'Efectivo';
      default:
        return method;
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setShowModal(false);
  };

  const handleDownloadPDF = () => {
    if (selectedOrder && user) {
      // Convert to the format expected by generateOrderPDF
      const pdfOrder = {
        ...selectedOrder,
        items: selectedOrder.items || []
      };
      generateOrderPDF(pdfOrder, user.name);
    }
  };

  const handleReviewClick = (order: Order) => {
    setSelectedOrder(order);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    if (selectedOrder) {
      setOrderReviews(prev => ({
        ...prev,
        [selectedOrder.id]: true
      }));
    }
  };

  const handleReportKiosco = () => {
    setShowReportModal(true);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    if (!window.confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
      return;
    }

    setCancellingOrder(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelado' })
        .eq('id', selectedOrder.id)
        .eq('status', 'pendiente');

      if (error) throw error;

      addToast('Pedido cancelado exitosamente', 'success');

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrder.id
            ? { ...order, status: 'cancelado' as const }
            : order
        )
      );

      setSelectedOrder(prev => prev ? { ...prev, status: 'cancelado' as const } : null);
    } catch (error) {
      console.error('Error cancelling order:', error);
      addToast('Error al cancelar el pedido', 'error');
    } finally {
      setCancellingOrder(false);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 pt-16 lg:pt-0 lg:pl-16">
        <ExpandableNavigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No tienes pedidos aún</p>
            <a
              href="/menu"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-block"
            >
              Hacer un Pedido
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pt-16 lg:pt-0 lg:pl-16">
      <ExpandableNavigation />
      
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Mis Pedidos</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 p-3 sm:p-4"
              onClick={() => handleOrderClick(order)}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 space-y-2 sm:space-y-0">
                <div>
                  <h3 className="font-bold text-primary-600 text-base sm:text-lg">{order.id}</h3>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 mt-1">
                    <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span>{formatDate(order.createdAt)} - {formatTime(order.createdAt)}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border self-start ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{getStatusText(order.status)}</span>
                </span>
              </div>

              <div className="space-y-1 sm:space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Retiro:</span>
                  <span className="font-medium">{order.scheduledTime}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-primary-600 text-sm sm:text-base">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Productos:</span>
                  <span className="font-medium">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {order.status === 'listo' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                  <p className="text-xs text-green-800 font-medium text-center">
                    🎉 ¡Listo para retirar!
                  </p>
                </div>
              )}

              {order.status === 'entregado' && !orderReviews[order.id] && (
                <div className="mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReviewClick(order);
                    }}
                    className="w-full bg-yellow-500 text-white py-1.5 sm:py-2 px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-yellow-600 transition-colors"
                  >
                    ⭐ Calificar Pedido
                  </button>
                </div>
              )}

              {order.status === 'entregado' && orderReviews[order.id] && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-1.5 sm:p-2">
                  <p className="text-xs text-gray-600 font-medium text-center">
                    ✅ Reseña enviada
                  </p>
                </div>
              )}

              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Toca para ver detalles
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleCloseModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-xl">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Detalles del Pedido</h2>
                  <p className="text-sm text-gray-600">{selectedOrder.id}</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Order Status */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-2">{getStatusText(selectedOrder.status)}</span>
                    </span>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">{formatPrice(selectedOrder.totalAmount)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-gray-600">Fecha del pedido</p>
                        <p className="font-medium">{formatDate(selectedOrder.createdAt)} - {formatTime(selectedOrder.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-gray-600">Horario de retiro</p>
                        <p className="font-medium">{selectedOrder.scheduledTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Método de Pago</h3>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    {getPaymentMethodIcon(selectedOrder.paymentMethod)}
                    <span className="ml-2 font-medium">{getPaymentMethodText(selectedOrder.paymentMethod)}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Productos Pedidos</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                          {item.customizations && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.customizations.ingredients && (
                                <p><strong>Ingredientes:</strong> {item.customizations.ingredients.join(', ')}</p>
                              )}
                              {item.customizations.condiments && (
                                <p><strong>Condimentos:</strong> {item.customizations.condiments.join(', ')}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary-600">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(item.product.price)} c/u
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatPrice(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {selectedOrder.status === 'pendiente' && (
                    <button
                      onClick={handleCancelOrder}
                      disabled={cancellingOrder}
                      className="w-full flex items-center justify-center bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                      <Ban className="h-5 w-5 mr-2" />
                      {cancellingOrder ? 'Cancelando...' : 'Cancelar Pedido'}
                    </button>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownloadPDF}
                      className="flex-1 flex items-center justify-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Descargar Comprobante
                    </button>
                    <button
                      onClick={handleReportKiosco}
                      className="px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Reportar problema con el kiosco"
                    >
                      <AlertTriangle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>

                {selectedOrder.status === 'listo' && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-medium text-center">
                      🎉 ¡Tu pedido está listo! Puedes retirarlo en el kiosco presentando este comprobante.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedOrder && (
        <ReviewModal
          order={selectedOrder}
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedOrder(null);
          }}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId="kiosquero-demo-id" // In real app, get from order or system
        reportedUserName="Kiosco Escolar"
        reportedUserRole="kiosquero"
      />
    </div>
  );
};