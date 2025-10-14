import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ExpandableNavigation } from './ExpandableNavigation';
import { generateOrderPDF } from '../../utils/pdfGenerator';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Download, Clock, CreditCard, ArrowLeft } from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;

      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            products (*)
          `)
          .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        const formattedOrder = {
          id: orderData.id,
          scheduledTime: orderData.scheduled_time,
          paymentMethod: orderData.payment_method,
          totalAmount: orderData.total_amount,
          status: orderData.status,
          items: itemsData.map(item => ({
            product: item.products,
            quantity: item.quantity,
            customizations: item.customizations
          }))
        };

        setOrder(formattedOrder);
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 pt-16 lg:pt-0 lg:pl-16">
        <ExpandableNavigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cream-50 pt-16 lg:pt-0 lg:pl-16">
        <ExpandableNavigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias por tu pedido!</h2>
            <p className="text-gray-600 mb-6">
              Tu pedido ha sido procesado exitosamente
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Volver al Menú
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const handleDownloadPDF = () => {
    if (user) {
      generateOrderPDF(order, user.name);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 pt-16 lg:pt-0 lg:pl-16">
      <ExpandableNavigation />
      
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-full hover:bg-gray-100 mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Confirmación de Pedido</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 text-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h2>
          <p className="text-gray-600 mb-4">
            Tu pedido ha sido recibido y está siendo procesado
          </p>
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Número de pedido</p>
            <p className="text-2xl font-bold text-primary-600">{order.id}</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Pedido</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Horario de retiro:</span>
              </div>
              <span className="font-medium">{order.scheduledTime}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Método de pago:</span>
              </div>
              <span className="font-medium capitalize">{order.paymentMethod}</span>
            </div>

            <div className="py-2">
              <p className="text-gray-600 mb-2">Productos:</p>
              <div className="space-y-2">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                    </div>
                    <span className="font-medium text-primary-600">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-xl font-bold text-primary-600">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
            Descargar Comprobante
          </button>

          <button
            onClick={() => navigate('/orders')}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Ver Mis Pedidos
          </button>
        </div>

      </div>
    </div>
  );
};