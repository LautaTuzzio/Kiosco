import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { ExpandableNavigation } from './ExpandableNavigation';
import { BREAK_TIMES } from '../../data/mockData';
import { CreditCard, Smartphone, DollarSign, Clock, ArrowLeft } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, getTotalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [selectedTime, setSelectedTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'tarjeta' | 'mercadopago' | 'efectivo'>('tarjeta');
  const [isProcessing, setIsProcessing] = useState(false);

  const userCycle = user?.role as 'ciclo_basico' | 'ciclo_superior';
  const availableTimes = BREAK_TIMES[userCycle] || [];

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTime) {
      addToast('Selecciona un horario de retiro', 'error');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create order
    const orderId = `ORD-${Date.now()}`;
    
    // Store order in localStorage for demo
    const order = {
      id: orderId,
      userId: user?.id,
      items: items,
      totalAmount: getTotalAmount(),
      scheduledTime: selectedTime,
      paymentMethod,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
      userCycle
    };

    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    existingOrders.push(order);
    localStorage.setItem('orders', JSON.stringify(existingOrders));

    clearCart();
    setIsProcessing(false);
    
    addToast('¡Pedido realizado con éxito!', 'success');
    navigate(`/order-confirmation/${orderId}`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 pl-16">
        <ExpandableNavigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Ir al Menú
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pl-16">
      <ExpandableNavigation />
      
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/menu')}
            className="p-2 rounded-full hover:bg-gray-100 mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Pedido</h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                    {item.customizations && (
                      <p className="text-xs text-gray-500">Personalizado</p>
                    )}
                  </div>
                  <span className="font-medium text-primary-600">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatPrice(getTotalAmount())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Horario de Retiro
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    selectedTime === time
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de Pago</h2>
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="tarjeta"
                  checked={paymentMethod === 'tarjeta'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-3"
                />
                <CreditCard className="h-5 w-5 mr-3 text-gray-600" />
                <span className="font-medium">Tarjeta de Crédito</span>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="mercadopago"
                  checked={paymentMethod === 'mercadopago'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-3"
                />
                <Smartphone className="h-5 w-5 mr-3 text-gray-600" />
                <span className="font-medium">Mercado Pago</span>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="efectivo"
                  checked={paymentMethod === 'efectivo'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-3"
                />
                <DollarSign className="h-5 w-5 mr-3 text-gray-600" />
                <span className="font-medium">Efectivo (Pagar al retirar)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !selectedTime}
            className="w-full bg-primary-600 text-white py-4 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
          </button>
        </form>
      </div>
    </div>
  );
};